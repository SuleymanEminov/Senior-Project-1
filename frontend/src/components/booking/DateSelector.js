// frontend/src/components/booking/DateSelector.js
import React from 'react';
import { Form, ButtonGroup, Button } from 'react-bootstrap';

const DateSelector = ({ selectedDate, onSelectDate }) => {
  // Generate next 7 days
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  const dateOptions = generateDateOptions();
  
  // Format date as "Day of Week, Month Day"
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div>
      <Form.Group>
        <Form.Label><strong>Select Date</strong></Form.Label>
        <div className="date-selector-container">
          <ButtonGroup className="d-flex flex-wrap">
            {dateOptions.map((date) => (
              <Button
                key={date.toISOString()}
                variant={date.toDateString() === selectedDate.toDateString() ? 'primary' : 'outline-primary'}
                className="date-btn m-1"
                onClick={() => onSelectDate(date)}
              >
                {formatDate(date)}
              </Button>
            ))}
          </ButtonGroup>
        </div>
      </Form.Group>
    </div>
  );
};

export default DateSelector;