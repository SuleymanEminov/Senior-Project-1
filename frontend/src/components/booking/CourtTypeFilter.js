// frontend/src/components/booking/CourtTypeFilter.js
import React from 'react';
import { Form } from 'react-bootstrap';

const CourtTypeFilter = ({ selectedType, onSelectType }) => {
  const courtTypes = [
    { value: 'all', label: 'All Courts' },
    { value: 'hard', label: 'Hard Courts' },
    { value: 'clay', label: 'Clay Courts' },
    { value: 'grass', label: 'Grass Courts' }
  ];
  
  return (
    <div>
      <Form.Group>
        <Form.Label><strong>Court Type</strong></Form.Label>
        <div className="d-flex">
          {courtTypes.map((type) => (
            <div key={type.value} className="me-2">
              <Form.Check
                type="radio"
                id={`court-type-${type.value}`}
                label={type.label}
                name="courtType"
                checked={selectedType === type.value}
                onChange={() => onSelectType(type.value)}
              />
            </div>
          ))}
        </div>
      </Form.Group>
    </div>
  );
};

export default CourtTypeFilter;