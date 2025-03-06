// frontend/src/component/booking/BookingPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../interceptors/Interceptor';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Booking.css';

// Import subcomponents for booking flow
import ClubSelector from './ClubSelector';
import CourtTypeFilter from './CourtTypeFilter';
import DateSelector from './DateSelector';
import AvailabilityGrid from './AvailabilityGrid';
import ConfirmationModal from './ConfirmationModal';

export const BookingPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedCourtType, setSelectedCourtType] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState(null);
  
  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login', { state: { message: 'Please login to book a court' } });
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
    console.log("Authenticated, access token available"); // Debug output
  }, [navigate]);
  
  // Load clubs
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchClubs = async () => {
      try {
        // Based on your API structure in urls.py
        const response = await api.get('http://localhost:8000/api/clubs/');
        console.log('Clubs API response:', response.data); // Debug output
        
        // Handle different potential response formats
        if (Array.isArray(response.data)) {
          setClubs(response.data);
        } else if (response.data && typeof response.data === 'object') {
          // If response is an object with results property (common in DRF pagination)
          const clubsData = response.data.results || [];
          setClubs(clubsData);
        } else {
          // Fallback to empty array if unexpected format
          console.error('Unexpected clubs data format:', response.data);
          setClubs([]);
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
        setClubs([]);
      }
    };
    
    fetchClubs();
  }, [isAuthenticated]);
  
  // Load available slots when filters change
  useEffect(() => {
    if (!selectedClub) return;
    
    const fetchAvailableSlots = async () => {
      setIsLoading(true);
      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const response = await api.get('http://localhost:8000/api/bookings/available_slots/', {
          params: {
            club_id: selectedClub,
            court_type: selectedCourtType,
            date: formattedDate
          }
        });
        setAvailableSlots(response.data);
      } catch (error) {
        console.error('Error fetching available slots:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailableSlots();
  }, [selectedClub, selectedCourtType, selectedDate]);
  
  const handleClubChange = (clubId) => {
    setSelectedClub(clubId);
    setSelectedSlot(null);
  };
  
  const handleCourtTypeChange = (courtType) => {
    setSelectedCourtType(courtType);
    setSelectedSlot(null);
  };
  
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };
  
  const handleSlotSelect = (courtId, timeSlot) => {
    setSelectedCourtId(courtId);
    setSelectedSlot(timeSlot);
    setShowConfirmation(true);
  };
  
  const handleConfirmBooking = async () => {
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const response = await api.post('http://localhost:8000/api/bookings/', {
        court: selectedCourtId,
        date: formattedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time
      });
      
      setBookingSuccess('Reservation confirmed successfully!');
      setShowConfirmation(false);
      setSelectedSlot(null);
      
      // Refresh available slots
      const slotsResponse = await api.get('http://localhost:8000/api/bookings/available_slots/', {
        params: {
          club_id: selectedClub,
          court_type: selectedCourtType,
          date: formattedDate
        }
      });
      
      // Ensure we're handling the response data correctly
      const slotsData = Array.isArray(slotsResponse.data) ? slotsResponse.data : [];
      setAvailableSlots(slotsData);
    } catch (error) {
      console.error('Error booking court:', error);
      setBookingError(error.response?.data?.error || 'Failed to book court. Please try again.');
    }
  };
  
  if (isLoading && !clubs.length) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="booking-container">
      <div className="booking-header">
        <h1>Book a Tennis Court</h1>
        <p>Select a facility, court type, and date to find available time slots</p>
      </div>
      
      {bookingSuccess && (
        <div className="alert alert-success">{bookingSuccess}</div>
      )}
      
      {bookingError && (
        <div className="alert alert-danger">{bookingError}</div>
      )}
      
      <div className="booking-filters">
        <div className="filter-section club-selector">
          <ClubSelector 
            clubs={clubs} 
            selectedClub={selectedClub} 
            onSelectClub={handleClubChange} 
          />
        </div>
        
        {selectedClub && (
          <div className="filter-section court-type-filter">
            <CourtTypeFilter 
              selectedType={selectedCourtType} 
              onSelectType={handleCourtTypeChange} 
            />
          </div>
        )}
        
        {selectedClub && (
          <div className="filter-section date-selector">
            <DateSelector 
              selectedDate={selectedDate} 
              onSelectDate={handleDateChange} 
            />
          </div>
        )}
      </div>
      
      {selectedClub && (
        <div className="availability-container">
          <AvailabilityGrid 
            availableSlots={availableSlots} 
            onSelectSlot={handleSlotSelect} 
          />
        </div>
      )}
      
      {showConfirmation && selectedSlot && (
        <ConfirmationModal 
          slot={selectedSlot}
          date={selectedDate}
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowConfirmation(false)}
          court={availableSlots.find(court => court.court_id === selectedCourtId)}
        />
      )}
    </div>
  );
};
