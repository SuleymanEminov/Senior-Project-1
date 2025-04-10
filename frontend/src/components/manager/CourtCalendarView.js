// frontend/src/components/manager/CourtCalendarView.js
import React, { useState } from 'react';
import { Card, Nav } from 'react-bootstrap';
import CourtCalendar from './CourtCalendar';
import CourtMasterCalendar from './CourtMasterCalendar';

const CourtCalendarView = () => {
  const [viewMode, setViewMode] = useState('master');

  return (
    <Card>
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Court Booking Calendar</h4>
        <Nav variant="tabs" className="card-header-tabs">
          <Nav.Item>
            <Nav.Link 
              className={viewMode === 'master' ? 'active text-white bg-primary' : 'text-white'} 
              onClick={() => setViewMode('master')}
            >
              Master View
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              className={viewMode === 'single' ? 'active text-white bg-primary' : 'text-white'} 
              onClick={() => setViewMode('single')}
            >
              Single Court View
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Card.Header>
      <Card.Body className="p-0">
        {viewMode === 'master' ? (
          <CourtMasterCalendar />
        ) : (
          <CourtCalendar />
        )}
      </Card.Body>
    </Card>
  );
};

export default CourtCalendarView;