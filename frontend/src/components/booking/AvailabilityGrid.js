// frontend/src/components/booking/AvailabilityGrid.js
import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';

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
    return null;
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
      <h3 className="mb-4">Available Courts & Time Slots</h3>
      
      {Object.entries(groupedCourts).map(([courtType, courts]) => (
        <div key={courtType} className="mb-4">
          <h4 className="court-type-heading mb-3">
            {getCourtTypeDisplay(courtType)} Courts
          </h4>
          
          <Row>
            {courts.map((court) => (
              <Col md={6} lg={4} className="mb-3" key={court.court_id}>
                <Card className="h-100 court-card">
                  <Card.Header>
                    <h5 className="mb-0">Court #{court.court_number}</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="time-slots">
                      {court.available_slots && court.available_slots.length > 0 ? (
                        court.available_slots.map((slot, index) => (
                          <Button
                            key={index}
                            variant="outline-success"
                            className="time-slot-btn m-1"
                            onClick={() => onSelectSlot(court.court_id, slot)}
                          >
                            {slot.formatted_time}
                          </Button>
                        ))
                      ) : (
                        <p className="no-slots-message">No available time slots</p>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  );
};

export default AvailabilityGrid;