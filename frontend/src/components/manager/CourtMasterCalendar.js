// frontend/src/components/manager/CourtMasterCalendar.js
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Spinner, Alert, Badge, OverlayTrigger, Tooltip, InputGroup } from 'react-bootstrap';
import { format, addDays, subDays, parseISO, setHours, setMinutes } from 'date-fns';
import api from '../../interceptors/Interceptor';
import BookingModal from './BookingModal';
import './CourtMasterCalendar.css';

const CourtMasterCalendar = () => {
  // State
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [courtGroups, setCourtGroups] = useState([]);

  // Time slots for the calendar (30-minute intervals)
  const timeSlots = [];
  for (let hour = 5; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push({ hour, minute });
    }
  }

  // Load clubs when component mounts
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await api.get('/api/clubs/');
        setClubs(response.data.results || response.data);
        
        // If only one club, select it automatically
        if ((response.data.results?.length === 1) || (response.data.length === 1)) {
          const club = response.data.results?.[0] || response.data[0];
          setSelectedClub(club.id);
        }
      } catch (err) {
        setError('Failed to load clubs. Please try again.');
        console.error(err);
      }
    };

    fetchClubs();
  }, []);

  // Load courts and bookings when a club is selected or the date changes
  useEffect(() => {
    if (!selectedClub) return;
    
    const fetchCourtsAndBookings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch courts
        const courtsResponse = await api.get('/api/courts/', {
          params: { club: selectedClub }
        });
        const courtsData = courtsResponse.data.results || courtsResponse.data;
        setCourts(courtsData);
        
        // Filter out empty court types and sort courts by number
        const filteredCourts = courtsData.filter(court => court.is_active !== false);
        setCourts(filteredCourts.sort((a, b) => a.court_number - b.court_number));
        
        // Fetch bookings for the selected date
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        const bookingsResponse = await api.get('/api/bookings/', {
          params: {
            club: selectedClub,
            booking_date: formattedDate
          }
        });
        
        setBookings(bookingsResponse.data.results || bookingsResponse.data);
      } catch (err) {
        setError('Failed to load calendar data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourtsAndBookings();
  }, [selectedClub, currentDate]);

  // Navigate to previous day
  const goToPreviousDay = () => {
    setCurrentDate(prevDate => subDays(prevDate, 1));
  };

  // Navigate to next day
  const goToNextDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, 1));
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle clicking on an empty cell/time slot
  const handleTimeSlotClick = (court, timeSlot) => {
    // Create a date object for the selected time slot
    const slotDate = new Date(currentDate);
    slotDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
    
    setSelectedTimeSlot(slotDate);
    setSelectedCourt(court);
    setSelectedBooking(null);
    setShowModal(true);
  };

  // Handle clicking on a booking
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setSelectedTimeSlot(null);
    setSelectedCourt(booking.court_details);
    setShowModal(true);
  };

  // Find bookings for a specific court and time slot
  const findBookingsForSlot = (court, timeSlot) => {
    return bookings.filter(booking => {
      if (booking.court !== court.id) return false;
      
      const bookingDate = booking.booking_date;
      const startTime = parseISO(`${bookingDate}T${booking.start_time}`);
      const endTime = parseISO(`${bookingDate}T${booking.end_time}`);
      
      const slotStart = setMinutes(setHours(new Date(currentDate), timeSlot.hour), timeSlot.minute);
      const slotEnd = setMinutes(setHours(new Date(currentDate), timeSlot.hour), timeSlot.minute + 30);
      
      return slotStart < endTime && slotEnd > startTime;
    });
  };

  // Get a color based on booking status
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#28a745'; // Green
      case 'pending': return '#ffc107';   // Yellow
      case 'canceled': return '#dc3545';  // Red
      case 'completed': return '#6c757d'; // Gray
      default: return '#007bff';          // Blue
    }
  };

  // Handle booking creation/update/deletion
  const handleBookingSubmit = async (bookingData) => {
    try {
      if (selectedBooking) {
        // Update existing booking
        await api.put(`/api/bookings/${selectedBooking.id}/`, bookingData);
      } else {
        // Create new booking
        await api.post('/api/bookings/', bookingData);
      }
      
      // Refresh bookings
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      const response = await api.get('/api/bookings/', {
        params: {
          club: selectedClub,
          booking_date: formattedDate
        }
      });
      
      setBookings(response.data.results || response.data);
      setShowModal(false);
    } catch (err) {
      console.error('Booking error:', err);
      setError('Failed to save booking. Please try again.');
    }
  };

  // Handle booking deletion
  const handleBookingDelete = async (id) => {
    try {
      await api.delete(`/api/bookings/${id}/`);
      
      // Refresh bookings
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      const response = await api.get('/api/bookings/', {
        params: {
          club: selectedClub,
          booking_date: formattedDate
        }
      });
      
      setBookings(response.data.results || response.data);
      setShowModal(false);
    } catch (err) {
      console.error('Deletion error:', err);
      setError('Failed to delete booking. Please try again.');
    }
  };

  // Render cell content for a booking
  const renderBookingCell = (booking) => {
    const startTime = booking.start_time.substring(0, 5);
    const endTime = booking.end_time.substring(0, 5);
    const userName = booking.user_details ? 
      `${booking.user_details.first_name || ''} ${booking.user_details.last_name || ''}`.trim() : 
      'User';
    
    return (
      <OverlayTrigger
        placement="auto"
        overlay={
          <Tooltip>
            <strong>{userName}</strong><br />
            {startTime} - {endTime}<br />
            Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            {booking.notes && <><br />Notes: {booking.notes}</>}
          </Tooltip>
        }
      >
        <div 
          className="booking-cell"
          style={{
            backgroundColor: getStatusColor(booking.status),
            color: '#fff',
            borderRadius: '4px',
            padding: '2px 4px',
            fontSize: '0.8rem',
            height: '100%',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          onClick={() => handleBookingClick(booking)}
        >
          <div className="booking-time">{startTime} - {endTime}</div>
          <div className="booking-user" style={{ fontWeight: 'bold' }}>{userName}</div>
          {booking.notes && <div className="booking-notes text-truncate">{booking.notes}</div>}
        </div>
      </OverlayTrigger>
    );
  };

  return (
    <Card className="master-calendar">
      
      <Card.Body className="p-3">
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label><strong>Select Club</strong></Form.Label>
              <Form.Select 
                value={selectedClub || ''} 
                onChange={e => setSelectedClub(e.target.value)}
              >
                <option value="">Select Club</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={5} className="d-flex align-items-end">
            <div className="d-flex justify-content-between w-100">
              <div>
                <Button variant="outline-secondary" size="sm" onClick={goToPreviousDay}>
                  <i className="bi bi-chevron-left"></i> Previous Day
                </Button>{' '}
                <Button variant="outline-primary" size="sm" onClick={goToToday}>
                  Today
                </Button>{' '}
                <Button variant="outline-secondary" size="sm" onClick={goToNextDay}>
                  Next Day <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </div>
          </Col>
          <Col md={3} className="d-flex align-items-end justify-content-end">
            <Form.Control
              type="date"
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={(e) => setCurrentDate(new Date(e.target.value))}
              className="me-2"
            />
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={() => window.print()}
              title="Print Calendar"
            >
              <i className="bi bi-printer"></i>
            </Button>
          </Col>
        </Row>
        
        <Row className="mb-3">
          <Col>
            <h4 className="mb-2">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h4>
            <div className="booking-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#28a745' }}></div>
                <span>Confirmed</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#ffc107' }}></div>
                <span>Pending</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#dc3545' }}></div>
                <span>Canceled</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#6c757d' }}></div>
                <span>Completed</span>
              </div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="ms-auto"
                onClick={() => {
                  setSelectedTimeSlot(new Date());
                  setSelectedCourt(courts[0]);
                  setSelectedBooking(null);
                  setShowModal(true);
                }}
                disabled={courts.length === 0}
              >
                <i className="bi bi-plus"></i> Add Booking
              </Button>
            </div>
          </Col>
        </Row>
        
        {isLoading ? (
          <div className="text-center p-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading calendar...</span>
            </Spinner>
            <p className="mt-2">Loading calendar data...</p>
          </div>
        ) : (
          <div className="court-master-calendar-container">
            {courts.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <div className="d-flex">
                  {/* Time slots column */}
                  <div className="time-column" style={{ minWidth: '80px', borderRight: '1px solid #dee2e6' }}>
                    <div className="time-header" style={{ height: '40px', borderBottom: '1px solid #dee2e6' }}></div>
                    {timeSlots.map((timeSlot, idx) => (
                      <div 
                        key={`time-${idx}`} 
                        className="time-slot"
                        style={{
                          height: '30px',
                          borderBottom: '1px solid #dee2e6',
                          padding: '2px 4px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '8px'
                        }}
                      >
                        {`${String(timeSlot.hour).padStart(2, '0')}:${String(timeSlot.minute).padStart(2, '0')}`}
                      </div>
                    ))}
                  </div>
                  
                  {/* Court columns */}
                  {courts.map(court => {
                    // Map court type to display name and color
                    const courtTypeDisplay = court.court_type.charAt(0).toUpperCase() + court.court_type.slice(1);
                    const courtTypeColor = 
                      court.court_type === 'clay' ? '#e67e22' : 
                      court.court_type === 'grass' ? '#27ae60' : 
                      court.court_type === 'hard' ? '#3498db' : '#95a5a6';
                    
                    return (
                      <div 
                        key={`court-${court.id}`} 
                        className="court-column"
                        style={{ 
                          minWidth: '120px',
                          borderRight: '1px solid #dee2e6'
                        }}
                      >
                        {/* Court header */}
                        <div 
                          className="court-header"
                          style={{
                            height: '40px',
                            borderBottom: '1px solid #dee2e6',
                            backgroundColor: '#f8f9fa',
                            padding: '2px 4px',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <div style={{ fontWeight: 'bold' }}>Court #{court.court_number}</div>
                          <div style={{ fontSize: '0.7rem', color: courtTypeColor }}>
                            {courtTypeDisplay}
                          </div>
                        </div>
                        
                        {/* Time slots for this court */}
                        {timeSlots.map((timeSlot, slotIdx) => {
                          const slotBookings = findBookingsForSlot(court, timeSlot);
                          const hasBooking = slotBookings.length > 0;
                          
                          return (
                            <div 
                              key={`slot-${court.id}-${slotIdx}`}
                              className="time-cell"
                              style={{
                                height: '30px',
                                borderBottom: '1px solid #dee2e6',
                                backgroundColor: hasBooking ? 'transparent' : 'white',
                                cursor: hasBooking ? 'default' : 'pointer'
                              }}
                              onClick={hasBooking ? undefined : () => handleTimeSlotClick(court, timeSlot)}
                            >
                              {hasBooking ? (
                                renderBookingCell(slotBookings[0])
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Alert variant="info">
                No courts available for the selected club. Please select a different club or ensure courts have been added.
              </Alert>
            )}
          </div>
        )}
      </Card.Body>
      
      {/* Booking Modal */}
      <BookingModal 
        show={showModal}
        onHide={() => setShowModal(false)}
        date={selectedTimeSlot || (selectedBooking ? parseISO(`${selectedBooking.booking_date}T00:00:00`) : new Date())}
        booking={selectedBooking}
        onSubmit={handleBookingSubmit}
        onDelete={handleBookingDelete}
        courts={courts}
        selectedCourt={selectedCourt?.id}
      />
    </Card>
  );
};

export default CourtMasterCalendar;