// frontend/src/component/booking/CourtTypeFilter.js
import React from 'react';

const CourtTypeFilter = ({ selectedType, onSelectType }) => {
  const courtTypes = [
    { value: 'all', label: 'All Courts' },
    { value: 'hard', label: 'Hard Courts' },
    { value: 'clay', label: 'Clay Courts' },
    { value: 'grass', label: 'Grass Courts' }
  ];
  
  return (
    <div>
      <h3>Court Type</h3>
      <div className="btn-group">
        {courtTypes.map((type) => (
          <button
            key={type.value}
            className={`btn ${selectedType === type.value ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onSelectType(type.value)}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CourtTypeFilter;