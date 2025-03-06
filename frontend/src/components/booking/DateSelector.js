// frontend/src/component/booking/DateSelector.js
import React from 'react';

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
      <h3>Select Date</h3>
      <div className="date-selector-container">
        <div className="date-buttons">
          {dateOptions.map((date) => (
            <button
              key={date.toISOString()}
              className={`btn date-btn ${
                date.toDateString() === selectedDate.toDateString() 
                  ? 'btn-primary active' 
                  : 'btn-outline-primary'
              }`}
              onClick={() => onSelectDate(date)}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DateSelector;