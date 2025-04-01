// frontend/src/components/booking/BookingPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../interceptors/Interceptor';
import { Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
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
  }, [navigate]);
  
  // Load clubs
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchClubs = async () => {
      try {
        const response = await api.get('http://localhost:8000/api/clubs/');
        
        // Extract clubs data based on response format
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
      setBookingError('');
      
      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        
        const response = await api.get('http://localhost:8000/api/bookings/available_slots/', {
          params: {
            club_id: selectedClub,
            court_type: selectedCourtType,
            date: formattedDate
          }
        });
        
        // Handle the case where the response contains a message (like "club is closed")
        if (response.data.message) {
          setBookingError(response.data.message);
          if (response.data.reason) {
            setBookingError(`${response.data.message} (${response.data.reason})`);
          }
          setAvailableSlots([]);
        } else {
          // Ensure it's an array
          const slotsData = Array.isArray(response.data) ? response.data : [];
          setAvailableSlots(slotsData);
        }
      } catch (error) {
        if (error.response?.data?.error) {
          setBookingError(error.response.data.error);
        } else {
          setBookingError('Error fetching available time slots. Please try again.');
        }
        setAvailableSlots([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailableSlots();
  }, [selectedClub, selectedCourtType, selectedDate]);
  
  const handleClubChange = (clubId) => {
    setSelectedClub(clubId);
    setSelectedSlot(null);
    setBookingSuccess('');
  };
  
  const handleCourtTypeChange = (courtType) => {
    setSelectedCourtType(courtType);
    setSelectedSlot(null);
    setBookingSuccess('');
  };
  
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setBookingSuccess('');
  };
  
  const handleSlotSelect = (courtId, timeSlot) => {
    setSelectedCourtId(courtId);
    setSelectedSlot(timeSlot);
    setShowConfirmation(true);
  };
  
  const handleConfirmBooking = async () => {
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Use the booking endpoint
      await api.post('http://localhost:8000/api/bookings/', {
        court: selectedCourtId,
        booking_date: formattedDate,
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
      if (slotsResponse.data.message) {
        setBookingError(slotsResponse.data.message);
        setAvailableSlots([]);
      } else {
        const slotsData = Array.isArray(slotsResponse.data) ? slotsResponse.data : [];
        setAvailableSlots(slotsData);
      }
    } catch (error) {
      console.error('Error booking court:', error);
      setBookingError(error.response?.data?.error || 'Failed to book court. Please try again.');
    }
  };
  
  if (isLoading && !clubs.length) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4 mb-5">
      <Card>
        <Card.Header>
          <h2 className="mb-0">Book a Tennis Court</h2>
        </Card.Header>
        <Card.Body>
          {bookingSuccess && (
            <Alert variant="success">{bookingSuccess}</Alert>
          )}
          
          {bookingError && (
            <Alert variant="danger">{bookingError}</Alert>
          )}
          
          <Row className="mb-4">
            <Col md={4}>
              <ClubSelector 
                clubs={clubs} 
                selectedClub={selectedClub} 
                onSelectClub={handleClubChange} 
              />
            </Col>
            
            {selectedClub && (
              <Col md={4}>
                <CourtTypeFilter 
                  selectedType={selectedCourtType} 
                  onSelectType={handleCourtTypeChange} 
                />
              </Col>
            )}
            
            {selectedClub && (
              <Col md={4}>
                <DateSelector 
                  selectedDate={selectedDate} 
                  onSelectDate={handleDateChange} 
                />
              </Col>
            )}
          </Row>
          
          {selectedClub && !isLoading && availableSlots.length === 0 && !bookingError && (
            <Alert variant="info">
              No available courts found for the selected criteria. Try a different date or court type.
            </Alert>
          )}
          
          {selectedClub && isLoading ? (
            <div className="text-center p-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading available slots...</p>
            </div>
          ) : (
            <div className="availability-container">
              <AvailabilityGrid 
                availableSlots={availableSlots} 
                onSelectSlot={handleSlotSelect} 
              />
            </div>
          )}
        </Card.Body>
      </Card>
      
      {showConfirmation && selectedSlot && (
        <ConfirmationModal 
          slot={selectedSlot}
          date={selectedDate}
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowConfirmation(false)}
          court={availableSlots.find(court => court.court_id === selectedCourtId)}
        />
      )}
    </Container>
  );
};

export default BookingPage;