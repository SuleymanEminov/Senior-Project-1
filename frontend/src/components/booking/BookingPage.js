// Updated BookingPage.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, Button, ProgressBar } from 'react-bootstrap';
import api from '../../interceptors/Interceptor';
import ClubSelector from './ClubSelector';
import CourtTypeFilter from './CourtTypeFilter';
import DateSelector from './DateSelector';
import CourtSelector from './CourtSelector';
import TimeRangeSelector from './TimeRangeSelector';
import ConfirmationModal from './ConfirmationModal';
import './Booking.css';

export const BookingPage = () => {
  // State variables for the booking process
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedCourtType, setSelectedCourtType] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableCourts, setAvailableCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  
  // Fetch clubs on component mount
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await api.get('/api/clubs/');
        setClubs(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }
    };
    
    fetchClubs();
  }, []);
  
  // Fetch available courts when filters change
  useEffect(() => {
    if (!selectedClub) return;
    
    const fetchAvailableCourts = async () => {
      setIsLoading(true);
      setBookingError('');
      
      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        
        const response = await api.get('/api/bookings/available_slots/', {
          params: {
            club_id: selectedClub,
            court_type: selectedCourtType,
            date: formattedDate
          }
        });
        
        setAvailableCourts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setBookingError(error.response?.data?.error || 'Error fetching available courts');
        setAvailableCourts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailableCourts();
  }, [selectedClub, selectedCourtType, selectedDate]);
  
  // Handle proceeding to next step
  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  // Handle going back to previous step
  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // Handle court selection
  const handleCourtSelect = (court) => {
    setSelectedCourt(court);
    handleNextStep();
  };
  
  // Handle time range selection
  const handleTimeRangeSelect = (timeRange) => {
    setSelectedTimeRange(timeRange);
  };
  
  // Handle confirming the booking
  const handleConfirmBooking = async () => {
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      await api.post('/api/bookings/', {
        court: selectedCourt.court_id,
        booking_date: formattedDate,
        start_time: selectedTimeRange.start_time,
        end_time: selectedTimeRange.end_time
      });
      
      setBookingSuccess('Your court has been successfully reserved!');
      setShowConfirmation(false);
      setCurrentStep(5); // Final step (confirmation)
    } catch (error) {
      setBookingError(error.response?.data?.error || 'Failed to book the court. Please try again.');
    }
  };
  
  // JSX rendering based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3 className="step-title">Select a Tennis Club</h3>
            <p className="step-description">Choose where you'd like to play</p>
            <ClubSelector 
              clubs={clubs} 
              selectedClub={selectedClub} 
              onSelectClub={(clubId) => {
                setSelectedClub(clubId);
                if (clubId) handleNextStep();
              }} 
            />
          </div>
        );
      
      case 2:
        return (
          <div className="step-content">
            <h3 className="step-title">Choose Court Type & Date</h3>
            <p className="step-description">Filter by court surface and select your preferred date</p>
            <div className="d-flex flex-wrap gap-4">
              <CourtTypeFilter 
                selectedType={selectedCourtType} 
                onSelectType={setSelectedCourtType} 
              />
              <DateSelector 
                selectedDate={selectedDate} 
                onSelectDate={setSelectedDate} 
              />
            </div>
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={handlePreviousStep}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNextStep}>
                Continue
              </Button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="step-content">
            <h3 className="step-title">Select a Court</h3>
            <p className="step-description">Choose from available courts</p>
            {isLoading ? (
              <div className="text-center p-4">
                <Spinner animation="border" />
                <p>Loading available courts...</p>
              </div>
            ) : availableCourts.length > 0 ? (
              <CourtSelector 
                courts={availableCourts}
                onSelectCourt={handleCourtSelect}
              />
            ) : (
              <Alert variant="info">
                No available courts found. Please try a different date or court type.
              </Alert>
            )}
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={handlePreviousStep}>
                Back
              </Button>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="step-content">
            <h3 className="step-title">Select Time</h3>
            <p className="step-description">Choose your preferred time slot</p>
            <TimeRangeSelector 
              court={selectedCourt}
              onTimeRangeSelected={handleTimeRangeSelect}
            />
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={handlePreviousStep}>
                Back
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setShowConfirmation(true)}
                disabled={!selectedTimeRange}
              >
                Review & Confirm
              </Button>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="step-content text-center">
            <div className="success-animation mb-4">
              <i className="bi bi-check-circle-fill text-success" style={{fontSize: '4rem'}}></i>
            </div>
            <h3 className="step-title">Booking Confirmed!</h3>
            <div className="booking-details p-4 bg-light rounded mt-4">
              <p><strong>Date:</strong> {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}</p>
              <p><strong>Time:</strong> {selectedTimeRange?.formatted_time}</p>
              <p><strong>Court:</strong> {selectedCourt ? 
                `${selectedCourt.court_type.charAt(0).toUpperCase() + selectedCourt.court_type.slice(1)} Court #${selectedCourt.court_number}` : 
                ''
              }</p>
              <p><strong>Club:</strong> {clubs.find(c => c.id == selectedClub)?.name}</p>
            </div>
            <div className="d-flex justify-content-center mt-4">
              <Button variant="outline-primary" onClick={() => {
                // Reset booking form
                setCurrentStep(1);
                setSelectedClub(null);
                setSelectedCourtType('all');
                setSelectedDate(new Date());
                setSelectedCourt(null);
                setSelectedTimeRange(null);
                setBookingSuccess('');
              }}>
                Book Another Court
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Container className="booking-container my-5">
      <Card className="booking-card shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">Book a Tennis Court</h2>
        </Card.Header>
        <Card.Body>
          {bookingError && (
            <Alert variant="danger" dismissible onClose={() => setBookingError('')}>
              {bookingError}
            </Alert>
          )}
          
          {/* Progress indicator */}
          <div className="booking-progress mb-4">
            <ProgressBar now={(currentStep / 5) * 100} />
            <div className="step-indicators d-flex justify-content-between mt-2">
              <div className={`step-indicator ${currentStep >= 1 ? 'active' : ''}`}>Club</div>
              <div className={`step-indicator ${currentStep >= 2 ? 'active' : ''}`}>Date</div>
              <div className={`step-indicator ${currentStep >= 3 ? 'active' : ''}`}>Court</div>
              <div className={`step-indicator ${currentStep >= 4 ? 'active' : ''}`}>Time</div>
              <div className={`step-indicator ${currentStep >= 5 ? 'active' : ''}`}>Confirm</div>
            </div>
          </div>
          
          {/* Current step content */}
          {renderStepContent()}
        </Card.Body>
      </Card>
      
      {/* Confirmation modal */}
      {showConfirmation && selectedTimeRange && (
        <ConfirmationModal 
          timeRange={selectedTimeRange}
          date={selectedDate}
          court={selectedCourt}
          club={clubs.find(c => c.id == selectedClub)}
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </Container>
  );
};