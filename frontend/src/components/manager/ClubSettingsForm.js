// frontend/src/components/manager/ClubSettingsForm.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../../interceptors/Interceptor';

const ClubSettingsForm = ({ clubId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState({
    opening_time: '08:00:00',
    closing_time: '20:00:00',
    min_booking_duration: 60,
    max_booking_duration: 120,
    booking_increment: 30,
    max_advance_booking_days: 14,
    same_day_booking_cutoff: 0
  });

  // Load club settings
  useEffect(() => {
    const fetchClubSettings = async () => {
      setLoading(true);
      try {
        const response = await api.get(`http://localhost:8000/api/clubs/${clubId}/`);
        
        // Extract the relevant settings
        const clubData = response.data;
        
        setSettings({
          opening_time: clubData.opening_time || '08:00:00',
          closing_time: clubData.closing_time || '20:00:00',
          min_booking_duration: clubData.min_booking_duration || 60,
          max_booking_duration: clubData.max_booking_duration || 120,
          booking_increment: clubData.booking_increment || 30,
          max_advance_booking_days: clubData.max_advance_booking_days || 14,
          same_day_booking_cutoff: clubData.same_day_booking_cutoff || 0
        });
      } catch (err) {
        setError('Failed to load club settings. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (clubId) {
      fetchClubSettings();
    } else {
      setLoading(false);
    }
  }, [clubId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value + ':00' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Convert settings to the format expected by the API
      const settingsData = {
        opening_time: settings.opening_time,
        closing_time: settings.closing_time,
        min_booking_duration: parseInt(settings.min_booking_duration, 10),
        max_booking_duration: parseInt(settings.max_booking_duration, 10),
        booking_increment: parseInt(settings.booking_increment, 10),
        max_advance_booking_days: parseInt(settings.max_advance_booking_days, 10),
        same_day_booking_cutoff: parseInt(settings.same_day_booking_cutoff, 10)
      };
      
      await api.patch(`http://localhost:8000/api/clubs/${clubId}/`, settingsData);
      setSuccess('Club settings updated successfully!');
    } catch (err) {
      setError('Failed to update club settings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings.opening_time) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading club settings...</p>
      </div>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h4>Court Booking Settings</h4>
      </Card.Header>
      <Card.Body>
        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Club Opening Time</Form.Label>
                <Form.Control
                  type="time"
                  value={settings.opening_time.slice(0, 5)}
                  onChange={(e) => handleTimeChange({
                    target: { name: 'opening_time', value: e.target.value }
                  })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Club Closing Time</Form.Label>
                <Form.Control
                  type="time"
                  value={settings.closing_time.slice(0, 5)}
                  onChange={(e) => handleTimeChange({
                    target: { name: 'closing_time', value: e.target.value }
                  })}
                />
              </Form.Group>
            </Col>
          </Row>

          <h5 className="mt-4 mb-3">Booking Rules</h5>
          
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Minimum Booking Duration (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  name="min_booking_duration"
                  value={settings.min_booking_duration}
                  onChange={handleChange}
                  min="15"
                  max="240"
                  step="15"
                />
                <Form.Text className="text-muted">
                  Minimum time a court can be booked (15-240 min)
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Maximum Booking Duration (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  name="max_booking_duration"
                  value={settings.max_booking_duration}
                  onChange={handleChange}
                  min="30"
                  max="480"
                  step="15"
                />
                <Form.Text className="text-muted">
                  Maximum time a court can be booked (30-480 min)
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Booking Time Increment (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  name="booking_increment"
                  value={settings.booking_increment}
                  onChange={handleChange}
                  min="15"
                  max="60"
                  step="15"
                />
                <Form.Text className="text-muted">
                  Time slots increment (15, 30, 45, or 60 min)
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Maximum Advance Booking (days)</Form.Label>
                <Form.Control
                  type="number"
                  name="max_advance_booking_days"
                  value={settings.max_advance_booking_days}
                  onChange={handleChange}
                  min="1"
                  max="365"
                />
                <Form.Text className="text-muted">
                  How many days in advance courts can be booked
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Same-Day Booking Cutoff (hours)</Form.Label>
                <Form.Control
                  type="number"
                  name="same_day_booking_cutoff"
                  value={settings.same_day_booking_cutoff}
                  onChange={handleChange}
                  min="0"
                  max="24"
                />
                <Form.Text className="text-muted">
                  Hours before start time that same-day booking is cut off (0 = no cutoff)
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <div className="d-flex justify-content-end mt-4">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                  Saving...
                </>
              ) : 'Save Settings'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ClubSettingsForm;