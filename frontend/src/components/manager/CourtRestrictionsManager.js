// frontend/src/components/manager/CourtRestrictionsManager.js
import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Row, Col, 
  Alert, Spinner, Badge
} from 'react-bootstrap';
import api from '../../interceptors/Interceptor';

const CourtRestrictionsManager = ({ clubId }) => {
  const [courts, setCourts] = useState([]);
  const [restrictions, setRestrictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRestriction, setSelectedRestriction] = useState(null);
  const [formData, setFormData] = useState({
    court: '',
    weekday: 0,
    start_time: '08:00:00',
    end_time: '10:00:00',
    reason: 'Court Maintenance'
  });

  // Fetch courts and restrictions
  useEffect(() => {
    const fetchData = async () => {
      if (!clubId) return;
      
      setLoading(true);
      try {
        // Fetch courts for this club
        const courtsResponse = await api.get(`http://localhost:8000/api/courts/`, {
          params: { club: clubId }
        });
        
        setCourts(courtsResponse.data.results || courtsResponse.data);
        
        // Fetch restrictions
        const restrictionsResponse = await api.get(`http://localhost:8000/api/courts/restrictions/`, {
          params: { club: clubId }
        });
        
        setRestrictions(restrictionsResponse.data.results || restrictionsResponse.data);
      } catch (err) {
        setError('Failed to load court data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value + ':00' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        court: formData.court,
        weekday: parseInt(formData.weekday, 10),
        start_time: formData.start_time,
        end_time: formData.end_time,
        reason: formData.reason
      };
      
      if (selectedRestriction) {
        // Update existing restriction
        await api.put(
          `http://localhost:8000/api/courts/restrictions/${selectedRestriction.id}/`, 
          payload
        );
      } else {
        // Create new restriction
        await api.post(
          `http://localhost:8000/api/courts/restrictions/`, 
          payload
        );
      }
      
      // Refresh data
      const response = await api.get(`http://localhost:8000/api/courts/restrictions/`, {
        params: { club: clubId }
      });
      setRestrictions(response.data.results || response.data);
      
      // Close modal and reset form
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to save court restriction. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this court restriction?')) {
      return;
    }
    
    setLoading(true);
    try {
      await api.delete(`http://localhost:8000/api/courts/restrictions/${id}/`);
      
      // Refresh data
      const response = await api.get(`http://localhost:8000/api/courts/restrictions/`, {
        params: { club: clubId }
      });
      setRestrictions(response.data.results || response.data);
    } catch (err) {
      setError('Failed to delete court restriction. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (restriction) => {
    setSelectedRestriction(restriction);
    setFormData({
      court: restriction.court,
      weekday: restriction.weekday,
      start_time: restriction.start_time,
      end_time: restriction.end_time,
      reason: restriction.reason || 'Court Maintenance'
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedRestriction(null);
    setFormData({
      court: courts.length > 0 ? courts[0].id : '',
      weekday: 0,
      start_time: '08:00:00',
      end_time: '10:00:00',
      reason: 'Court Maintenance'
    });
  };

  // Helper function to get court details by ID
  const getCourtById = (courtId) => {
    return courts.find(court => court.id === parseInt(courtId, 10));
  };

  // Helper function to get weekday name
  const getWeekdayName = (weekday) => {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return weekdays[weekday];
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4>Court Maintenance & Restrictions</h4>
        <Button variant="primary" onClick={openAddModal} disabled={courts.length === 0}>
          Add Restriction
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading && restrictions.length === 0 ? (
          <div className="text-center p-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading court restrictions...</p>
          </div>
        ) : restrictions.length === 0 ? (
          <Alert variant="info">
            No recurring court restrictions have been set up yet.
          </Alert>
        ) : (
          <Table responsive striped bordered hover>
            <thead>
              <tr>
                <th>Court</th>
                <th>Day</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restrictions.map(restriction => {
                const court = getCourtById(restriction.court);
                return (
                  <tr key={restriction.id}>
                    <td>
                      {court ? (
                        `${court.court_type.charAt(0).toUpperCase() + court.court_type.slice(1)} Court #${court.court_number}`
                      ) : `Court ID: ${restriction.court}`}
                    </td>
                    <td>{getWeekdayName(restriction.weekday)}</td>
                    <td>
                      {restriction.start_time.substring(0, 5)} - {restriction.end_time.substring(0, 5)}
                    </td>
                    <td>{restriction.reason || 'Maintenance'}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => openEditModal(restriction)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(restriction.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card.Body>

      {/* Modal for adding/editing restrictions */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedRestriction ? 'Edit Court Restriction' : 'Add Court Restriction'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Court</Form.Label>
              <Form.Select
                name="court"
                value={formData.court}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a court</option>
                {courts.map(court => (
                  <option key={court.id} value={court.id}>
                    {court.court_type.charAt(0).toUpperCase() + court.court_type.slice(1)} Court #{court.court_number}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Day of Week</Form.Label>
              <Form.Select
                name="weekday"
                value={formData.weekday}
                onChange={handleInputChange}
                required
              >
                <option value="0">Monday</option>
                <option value="1">Tuesday</option>
                <option value="2">Wednesday</option>
                <option value="3">Thursday</option>
                <option value="4">Friday</option>
                <option value="5">Saturday</option>
                <option value="6">Sunday</option>
              </Form.Select>
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.start_time.slice(0, 5)}
                    onChange={(e) => handleTimeChange({
                      target: { name: 'start_time', value: e.target.value }
                    })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>End Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.end_time.slice(0, 5)}
                    onChange={(e) => handleTimeChange({
                      target: { name: 'end_time', value: e.target.value }
                    })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label>Reason</Form.Label>
              <Form.Control
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="e.g., Court Maintenance, Reserved for Team Practice"
                required
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

export default CourtRestrictionsManager;