import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmationModal = ({ slot, date, court, onConfirm, onCancel }) => {
  // Format date for display
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const getCourtTypeDisplay = (type) => {
    const typeMap = {
      'hard': 'Hard',
      'clay': 'Clay',
      'grass': 'Grass'
    };
    return typeMap[type] || type;
  };
  
  return (
    <Modal show={true} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Your Reservation</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <p>You are about to book the following court:</p>
        <div className="booking-details p-3 bg-light rounded">
          <p><strong>Date:</strong> {formattedDate}</p>
          <p><strong>Time:</strong> {slot.formatted_time}</p>
          {court && (
            <>
              <p><strong>Court Type:</strong> {getCourtTypeDisplay(court.court_type)}</p>
              <p><strong>Court Number:</strong> {court.court_number}</p>
            </>
          )}
        </div>
        <p className="mt-3">Would you like to confirm this reservation?</p>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
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