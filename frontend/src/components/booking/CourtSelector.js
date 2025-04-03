// CourtSelector.js 
// This component allows users to select a court for booking.
// It displays available courts grouped by type and shows their availability status.
// It also handles the selection of a court and passes the selected court to the parent component.
import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const CourtSelector = ({ courts, onSelectCourt }) => {
  // Group courts by type for better organization
  const courtsByType = courts.reduce((acc, court) => {
    const type = court.court_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(court);
    return acc;
  }, {});
  
  // Format court type for display
  const formatCourtType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  return (
    <div className="court-selector">
      {Object.entries(courtsByType).map(([type, courtsOfType]) => (
        <div key={type} className="court-type-section mb-4">
          <h4 className="court-type-heading">{formatCourtType(type)} Courts</h4>
          <Row>
            {courtsOfType.map(court => (
              <Col md={6} lg={4} key={court.court_id} className="mb-3">
                <Card 
                  className="court-card h-100 cursor-pointer"
                  onClick={() => onSelectCourt(court)}
                >
                  <Card.Body className="d-flex flex-column">
                    <div className="court-header d-flex align-items-center mb-3">
                      <div className="court-icon me-2">
                        {type === 'clay' && <i className="bi bi-circle-fill text-danger"></i>}
                        {type === 'hard' && <i className="bi bi-circle-fill text-primary"></i>}
                        {type === 'grass' && <i className="bi bi-circle-fill text-success"></i>}
                      </div>
                      <h5 className="mb-0">Court #{court.court_number}</h5>
                    </div>
                    <div className="court-details mt-auto">
                      <div className="availability-indicator">
                        {court.operating_hours && (
                          <small className="text-muted">
                            Available: {court.operating_hours.open.slice(0, 5)} - {court.operating_hours.close.slice(0, 5)}
                          </small>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="badge bg-success">Available</span>
                      </div>
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

export default CourtSelector;