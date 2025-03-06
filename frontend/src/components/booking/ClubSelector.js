// frontend/src/component/booking/ClubSelector.js
import React from 'react';

const ClubSelector = ({ clubs, selectedClub, onSelectClub }) => {
  // Ensure clubs is an array before mapping
  const clubsArray = Array.isArray(clubs) ? clubs : [];
  
  return (
    <div>
      <h3>Select a Facility</h3>
      <select 
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
      </select>
    </div>
  );
};

export default ClubSelector;