import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import format from 'date-fns/format';
import { bookingService, clubService, courtService } from '../../services/api';
import BookingModal from './BookingModal';

const CourtCalendar = () => {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const calendarRef = useRef(null);

  // Load clubs
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await clubService.getClubs();
        setClubs(response.data.results || response.data);
        
        // If only one club, select it automatically
        if (response.data.results?.length === 1 || response.data.length === 1) {
          const club = response.data.results?.[0] || response.data[0];
          setSelectedClub(club.id);
        }
      } catch (err) {
        setError('Failed to load clubs');
        console.error(err);
      }
    };

    fetchClubs();
  }, []);

  // Load courts when a club is selected
  useEffect(() => {
    if (!selectedClub) {
      setCourts([]);
      setSelectedCourt('');
      return;
    }

    const fetchCourts = async () => {
      try {
        const response = await courtService.getCourts({ club: selectedClub });
        setCourts(response.data.results || response.data);
        
        // If only one court, select it automatically
        if (response.data.results?.length === 1 || response.data.length === 1) {
          const court = response.data.results?.[0] || response.data[0];
          setSelectedCourt(court.id);
        }
      } catch (err) {
        setError('Failed to load courts');
        console.error(err);
      }
    };

    fetchCourts();
  }, [selectedClub]);

  // Load bookings when a court is selected or date range changes
  useEffect(() => {
    if (!selectedCourt) {
      setBookings([]);
      return;
    }

    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        // Get calendar API instance to determine current view dates
        const calendarApi = calendarRef.current.getApi();
        const view = calendarApi.view;
        const start = format(view.activeStart, 'yyyy-MM-dd');
        const end = format(view.activeEnd, 'yyyy-MM-dd');

        const response = await bookingService.getBookings({
          court: selectedCourt,
          start_date: start,
          end_date: end
        });

        // Transform booking data for the calendar
        const calendarEvents = (response.data.results || response.data).map(booking => ({
          id: booking.id,
          title: `${booking.user_details?.first_name || 'User'} ${booking.user_details?.last_name || ''}`,
          start: `${booking.booking_date}T${booking.start_time}`,
          end: `${booking.booking_date}T${booking.end_time}`,
          extendedProps: { ...booking },
          backgroundColor: getStatusColor(booking.status),
          borderColor: getStatusColor(booking.status)
        }));
        
        setBookings(calendarEvents);
      } catch (err) {
        setError('Failed to load bookings');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [selectedCourt]);

  // Get background color based on booking status
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#28a745';  // Green
      case 'pending': return '#ffc107';    // Yellow
      case 'cancelled': return '#dc3545';  // Red
      case 'completed': return '#6c757d';  // Gray
      default: return '#007bff';           // Blue
    }
  };

  // Handle clicking on an empty date slot
  const handleDateClick = (arg) => {
    setSelectedDate(arg.date);
    setSelectedBooking(null);
    setShowModal(true);
  };

  // Handle clicking on an existing booking
  const handleEventClick = (arg) => {
    setSelectedBooking(arg.event.extendedProps);
    setSelectedDate(arg.event.start);
    setShowModal(true);
  };

  // Handle booking creation/update/deletion
  const handleBookingSubmit = async (bookingData) => {
    try {
      let finalBookingData = { ...bookingData };
      
      // Make sure types are correct
      if (typeof finalBookingData.court === 'string') {
        finalBookingData.court = parseInt(finalBookingData.court, 10);
      }
      
      if (typeof finalBookingData.user === 'string') {
        finalBookingData.user = parseInt(finalBookingData.user, 10);
      }
      
      // Log the exact data being sent
      console.log('Sending booking data to API:', finalBookingData);
      
      if (selectedBooking) {
        // Update existing booking
        const response = await bookingService.updateBooking(selectedBooking.id, finalBookingData);
        console.log('Update booking response:', response.data);
      } else {
        // Create new booking
        const response = await bookingService.createBooking(finalBookingData);
        console.log('Create booking response:', response.data);
      }
      
      // Refresh calendar
      const calendarApi = calendarRef.current.getApi();
      calendarApi.refetchEvents();
      
      setShowModal(false);
    } catch (err) {
      console.error('Booking error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        request: bookingData
      });
      
      // Parse and show error message in a more helpful way
      let errorMessage = 'Failed to save booking';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          // Format validation errors
          const errors = Object.entries(err.response.data)
            .map(([field, error]) => `${field}: ${Array.isArray(error) ? error.join(', ') : error}`)
            .join('\n');
          errorMessage = errors || errorMessage;
        }
      }
      
      setError(errorMessage);
    }
  };

  // Handle booking deletion
  const handleBookingDelete = async (id) => {
    try {
      await bookingService.deleteBooking(id);
      
      // Refresh calendar
      const calendarApi = calendarRef.current.getApi();
      calendarApi.refetchEvents();
      
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete booking');
      console.error(err);
    }
  };

  // Update bookings when view changes (e.g., month to week)
  const handleViewChange = () => {
    if (selectedCourt) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const start = format(view.activeStart, 'yyyy-MM-dd');
      const end = format(view.activeEnd, 'yyyy-MM-dd');

      bookingService.getBookings({
        court: selectedCourt,
        start_date: start,
        end_date: end
      }).then(response => {
        const calendarEvents = (response.data.results || response.data).map(booking => ({
          id: booking.id,
          title: `${booking.user_details?.first_name || 'User'} ${booking.user_details?.last_name || ''}`,
          start: `${booking.booking_date}T${booking.start_time}`,
          end: `${booking.booking_date}T${booking.end_time}`,
          extendedProps: { ...booking },
          backgroundColor: getStatusColor(booking.status),
          borderColor: getStatusColor(booking.status)
        }));
        
        setBookings(calendarEvents);
      }).catch(err => {
        setError('Failed to load bookings for this date range');
        console.error(err);
      });
    }
  };

  return (
    <Container fluid className="p-3">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Row className="mb-3">
        <Col lg={3} md={6} sm={12} className="mb-3">
          <Card>
            <Card.Header>Select Club & Court</Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Club</Form.Label>
                  <Form.Select 
                    value={selectedClub} 
                    onChange={e => setSelectedClub(e.target.value)}
                  >
                    <option value="">Select Club</option>
                    {clubs.map(club => (
                      <option key={club.id} value={club.id}>{club.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Court</Form.Label>
                  <Form.Select
                    value={selectedCourt}
                    onChange={e => setSelectedCourt(e.target.value)}
                    disabled={!selectedClub}
                  >
                    <option value="">Select Court</option>
                    {courts.map(court => (
                      <option key={court.id} value={court.id}>
                        {court.court_type.charAt(0).toUpperCase() + court.court_type.slice(1)} Court #{court.court_number}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>Booking Legend</Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div style={{ width: 20, height: 20, backgroundColor: '#28a745', marginRight: 10 }}></div>
                <span>Confirmed</span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <div style={{ width: 20, height: 20, backgroundColor: '#ffc107', marginRight: 10 }}></div>
                <span>Pending</span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <div style={{ width: 20, height: 20, backgroundColor: '#dc3545', marginRight: 10 }}></div>
                <span>Cancelled</span>
              </div>
              <div className="d-flex align-items-center">
                <div style={{ width: 20, height: 20, backgroundColor: '#6c757d', marginRight: 10 }}></div>
                <span>Completed</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9} md={6} sm={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Court Schedule</h5>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  setSelectedDate(new Date());
                  setSelectedBooking(null);
                  setShowModal(true);
                }}
                disabled={!selectedCourt}
              >
                Add Booking
              </Button>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : (
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  slotMinTime="08:00:00"
                  slotMaxTime="22:00:00"
                  events={bookings}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  datesSet={handleViewChange}
                  height="auto"
                  allDaySlot={false}
                  slotDuration="00:30:00"
                  businessHours={{
                    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                    startTime: '08:00',
                    endTime: '22:00',
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Booking Modal */}
      <BookingModal 
        show={showModal}
        onHide={() => setShowModal(false)}
        date={selectedDate}
        booking={selectedBooking}
        onSubmit={handleBookingSubmit}
        onDelete={handleBookingDelete}
        courts={courts}
        selectedCourt={selectedCourt}
      />
    </Container>
  );
};

export default CourtCalendar;