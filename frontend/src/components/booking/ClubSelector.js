// frontend/src/components/booking/ClubSelector.js
import React from 'react';
import { Form } from 'react-bootstrap';

const ClubSelector = ({ clubs, selectedClub, onSelectClub }) => {
  // Ensure clubs is an array
  const clubsArray = Array.isArray(clubs) ? clubs : [];
  
  return (
    <div>
      <Form.Group>
        <Form.Label><strong>Select a Facility</strong></Form.Label>
        <Form.Select 
          value={selectedClub || ''} 
          onChange={(e) => onSelectClub(e.target.value)}
          className="form-select"
        >
          <option value="">-- Select a facility --</option>
          {clubsArray.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name} - {club.city}, {club.state}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    </div>
  );
};

export default ClubSelector;