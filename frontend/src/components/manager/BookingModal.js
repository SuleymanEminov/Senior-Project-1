import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import format from 'date-fns/format';
import { userService } from '../../services/api';

const BookingModal = ({ 
  show, 
  onHide, 
  date,
  booking,
  onSubmit,
  onDelete,
  courts,
  selectedCourt 
}) => {
  const [users, setUsers] = useState([]);
  const [formValues, setFormValues] = useState({
    court: '',
    user: '',
    booking_date: '',
    start_time: '',
    end_time: '',
    status: 'pending',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with booking data or defaults
  useEffect(() => {
    if (show) {
      if (booking) {
        // Edit mode - populate with existing booking
        setFormValues({
          court: booking.court,
          user: booking.user,
          booking_date: booking.booking_date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          notes: booking.notes || '',
        });
      } else {
        // Create mode - set defaults
        const defaultDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const defaultTime = date ? format(date, 'HH:00') : '08:00';
        const defaultEndTime = date ? format(new Date(date.getTime() + 60 * 60 * 1000), 'HH:00') : '09:00';
        
        setFormValues({
          court: selectedCourt,
          user: '', // Manager will select user
          booking_date: defaultDate,
          start_time: defaultTime,
          end_time: defaultEndTime,
          status: 'confirmed', // Default for manager-created bookings
          notes: '',
        });
      }

      // Load users for the dropdown
      fetchUsers();
    }
  }, [show, booking, date, selectedCourt]);

  // Fetch users for the dropdown
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get users from the API
      const response = await userService.getUsers();
      const usersData = response.data.results || response.data || [];
      console.log('Available users:', usersData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure all required fields are provided
    if (!formValues.court) {
      setError('Please select a court');
      return;
    }
    
    if (!formValues.user) {
      setError('Please select a user');
      return;
    }
    
    // Format data properly for the API
    const bookingData = {
      ...formValues,
      // Convert fields to their expected types if needed
      court: String(formValues.court),  // Ensure court ID is a string
      user: String(formValues.user)     // Ensure user ID is a string
    };
    
    console.log('Submitting booking data:', bookingData);
    onSubmit(bookingData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      onDelete(booking.id);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={false}
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {booking ? 'Edit Booking' : 'New Booking'}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Court</Form.Label>
                <Form.Select
                  name="court"
                  value={formValues.court}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Court</option>
                  {courts.map(court => (
                    <option key={court.id} value={court.id}>
                      {court.court_type.charAt(0).toUpperCase() + court.court_type.slice(1)} Court #{court.court_number}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label>User</Form.Label>
                <Form.Select
                  name="user"
                  value={formValues.user}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </Form.Select>
                {loading && <Spinner animation="border" size="sm" />}
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="booking_date"
                  value={formValues.booking_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group>
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="time"
                  name="start_time"
                  value={formValues.start_time}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group>
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="time"
                  name="end_time"
                  value={formValues.end_time}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formValues.status}
                  onChange={handleChange}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="notes"
              value={formValues.notes}
              onChange={handleChange}
              placeholder="Optional notes about this booking"
            />
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          
          {booking && (
            <Button 
              variant="danger" 
              onClick={handleDelete}
              className="me-auto"
            >
              Delete
            </Button>
          )}
          
          <Button variant="primary" type="submit">
            {booking ? 'Update Booking' : 'Create Booking'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default BookingModal;