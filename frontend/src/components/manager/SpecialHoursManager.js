// frontend/src/components/manager/SpecialHoursManager.js
import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Row, Col, 
  Alert, Spinner, Badge
} from 'react-bootstrap';
import api from '../../interceptors/Interceptor';

const SpecialHoursManager = ({ clubId }) => {
  const [specialHours, setSpecialHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedHours, setSelectedHours] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    is_closed: false,
    opening_time: '08:00:00',
    closing_time: '20:00:00',
    reason: ''
  });

  // Fetch special hours
  useEffect(() => {
    const fetchSpecialHours = async () => {
      if (!clubId) return;
      
      setLoading(true);
      try {
        const response = await api.get(`http://localhost:8000/api/clubs/${clubId}/special-hours/`);
        setSpecialHours(response.data);
      } catch (err) {
        setError('Failed to load special hours. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialHours();
  }, [clubId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        club: clubId,
        date: formData.date,
        is_closed: formData.is_closed,
        reason: formData.reason
      };
      
      // Only include times if not closed
      if (!formData.is_closed) {
        payload.opening_time = formData.opening_time;
        payload.closing_time = formData.closing_time;
      }
      
      if (selectedHours) {
        // Update existing special hours
        await api.put(
          `http://localhost:8000/api/clubs/${clubId}/special-hours/${selectedHours.id}/`, 
          payload
        );
      } else {
        // Create new special hours
        await api.post(
          `http://localhost:8000/api/clubs/${clubId}/special-hours/`, 
          payload
        );
      }
      
      // Refresh data
      const response = await api.get(`http://localhost:8000/api/clubs/${clubId}/special-hours/`);
      setSpecialHours(response.data);
      
      // Close modal and reset form
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to save special hours. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete these special hours?')) {
      return;
    }
    
    setLoading(true);
    try {
      await api.delete(`http://localhost:8000/api/clubs/${clubId}/special-hours/${id}/`);
      
      // Refresh data
      const response = await api.get(`http://localhost:8000/api/clubs/${clubId}/special-hours/`);
      setSpecialHours(response.data);
    } catch (err) {
      setError('Failed to delete special hours. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (hours) => {
    setSelectedHours(hours);
    setFormData({
      date: hours.date,
      is_closed: hours.is_closed,
      opening_time: hours.opening_time || '08:00:00',
      closing_time: hours.closing_time || '20:00:00',
      reason: hours.reason || ''
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedHours(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      is_closed: false,
      opening_time: '08:00:00',
      closing_time: '20:00:00',
      reason: ''
    });
  };

  // Simple date formatter
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4>Special Hours & Closures</h4>
        <Button variant="primary" onClick={openAddModal}>
          Add Special Hours
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading && specialHours.length === 0 ? (
          <div className="text-center p-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading special hours...</p>
          </div>
        ) : specialHours.length === 0 ? (
          <Alert variant="info">
            No special hours or closures have been set up yet.
          </Alert>
        ) : (
          <Table responsive striped bordered hover>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Hours</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {specialHours.map(hours => (
                <tr key={hours.id}>
                  <td>{formatDate(hours.date)}</td>
                  <td>
                    {hours.is_closed ? (
                      <Badge bg="danger">Closed</Badge>
                    ) : (
                      <Badge bg="success">Open (Special Hours)</Badge>
                    )}
                  </td>
                  <td>
                    {hours.is_closed ? 'Closed' : (
                      <>
                        {hours.opening_time.substring(0, 5)} - {hours.closing_time.substring(0, 5)}
                      </>
                    )}
                  </td>
                  <td>{hours.reason || '-'}</td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => openEditModal(hours)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDelete(hours.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>

      {/* Modal for adding/editing special hours */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedHours ? 'Edit Special Hours' : 'Add Special Hours'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="is-closed"
                label="Club is closed on this date"
                name="is_closed"
                checked={formData.is_closed}
                onChange={handleInputChange}
              />
            </Form.Group>

            {!formData.is_closed && (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Opening Time</Form.Label>
                    <Form.Control
                      type="time"
                      name="opening_time"
                      value={formData.opening_time.slice(0, 5)}
                      onChange={(e) => handleInputChange({
                        target: {
                          name: 'opening_time',
                          value: e.target.value + ':00'
                        }
                      })}
                      required={!formData.is_closed}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Closing Time</Form.Label>
                    <Form.Control
                      type="time"
                      name="closing_time"
                      value={formData.closing_time.slice(0, 5)}
                      onChange={(e) => handleInputChange({
                        target: {
                          name: 'closing_time',
                          value: e.target.value + ':00'
                        }
                      })}
                      required={!formData.is_closed}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group>
              <Form.Label>Reason (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="e.g., Holiday hours, Tournament, Maintenance, etc."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                  Saving...
                </>
              ) : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Card>
  );
};

export default SpecialHoursManager;