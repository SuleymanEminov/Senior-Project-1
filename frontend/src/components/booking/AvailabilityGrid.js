// frontend/src/component/booking/AvailabilityGrid.js
import React from 'react';

const AvailabilityGrid = ({ availableSlots, onSelectSlot }) => {
  // Group courts by type for better organization
  const groupedCourts = availableSlots.reduce((groups, court) => {
    const courtType = court.court_type;
    if (!groups[courtType]) {
      groups[courtType] = [];
    }
    groups[courtType].push(court);
    return groups;
  }, {});
  
  if (availableSlots.length === 0) {
    return (
      <div className="no-slots-message">
        <p>No courts available for the selected filters. Please try a different date or court type.</p>
      </div>
    );
  }
  
  // Function to get court type display name
  const getCourtTypeDisplay = (type) => {
    const typeMap = {
      'hard': 'Hard',
      'clay': 'Clay',
      'grass': 'Grass'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  return (
    <div>
      <h2>Available Courts & Time Slots</h2>
      
      {Object.entries(groupedCourts).map(([courtType, courts]) => (
        <div key={courtType} className="court-type-section">
          <h3 className="court-type-heading">
            {getCourtTypeDisplay(courtType)} Courts
          </h3>
          
          <div className="courts-container">
            {courts.map((court) => (
              <div key={court.court_id} className="court-card">
                <h5>
                  <div className="court-info">
                    <span className="court-icon">{court.court_number}</span>
                    Court #{court.court_number}
                  </div>
                </h5>
                
                <div className="time-slots">
                  {court.available_slots && court.available_slots.length > 0 ? (
                    court.available_slots.map((slot, index) => (
                      <button
                        key={index}
                        className="btn btn-outline-success time-slot-btn"
                        onClick={() => onSelectSlot(court.court_id, slot)}
                      >
                        {slot.formatted_time}
                      </button>
                    ))
                  ) : (
                    <p className="no-slots-message">No available time slots</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AvailabilityGrid;