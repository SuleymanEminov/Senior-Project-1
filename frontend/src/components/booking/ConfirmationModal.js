// ConfirmationModal.js
import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';

const ConfirmationModal = ({ timeRange, date, court, club, onConfirm, onCancel }) => {
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatCourtType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Calculate duration in minutes
  const calculateDuration = () => {
    if (!timeRange) return 0;
    
    const [startHours, startMinutes] = timeRange.start_time.split(':');
    const [endHours, endMinutes] = timeRange.end_time.split(':');
    
    const start = parseInt(startHours) * 60 + parseInt(startMinutes);
    const end = parseInt(endHours) * 60 + parseInt(endMinutes);
    
    return end - start;
  };
  
  const duration = calculateDuration();
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  return (
    <Modal show onHide={onCancel} centered size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>Review & Confirm Booking</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <div className="booking-summary">
              <h5>Booking Details</h5>
              <hr />
              <div className="detail-item d-flex justify-content-between mb-2">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{formatDate(date)}</span>
              </div>
              <div className="detail-item d-flex justify-content-between mb-2">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{timeRange?.formatted_time}</span>
              </div>
              <div className="detail-item d-flex justify-content-between mb-2">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">
                  {hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : ''} 
                  {minutes > 0 ? ` ${minutes} min` : ''}
                </span>
              </div>
              <hr />
              <div className="detail-item d-flex justify-content-between mb-2">
                <span className="detail-label">Club:</span>
                <span className="detail-value">{club?.name || ''}</span>
              </div>
              <div className="detail-item d-flex justify-content-between mb-2">
                <span className="detail-label">Court:</span>
                <span className="detail-value">
                  {court ? `${formatCourtType(court.court_type)} Court #${court.court_number}` : ''}
                </span>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="booking-policies p-3 bg-light rounded">
              <h5>Booking Policies</h5>
              <ul className="policies-list">
                <li>Cancellations must be made at least 24 hours in advance</li>
                <li>Please arrive 10 minutes before your booking time</li>
                <li>Court shoes with non-marking soles are required</li>
              </ul>
              <div className="text-center mt-3">
                <small className="text-muted">By confirming, you agree to the club's policies</small>
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Confirm Booking
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;