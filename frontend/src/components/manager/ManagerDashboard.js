// frontend/src/components/manager/ManagerDashboard.js
import React, { useState } from 'react';
import { Container, Row, Col, Nav, Card } from 'react-bootstrap';
import AvailabilitySettings from './AvailabilitySettings.js';

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('availability');
  
  // Function to render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'availability':
        return <AvailabilitySettings />;
      case 'calendar':
        return (
          <Card>
            <Card.Header>Court Calendar</Card.Header>
            <Card.Body>
              <p>Court calendar will be implemented soon.</p>
            </Card.Body>
          </Card>
        );
      case 'courts':
        return (
          <Card>
            <Card.Header>Court Management</Card.Header>
            <Card.Body>
              <p>Court management interface will be implemented soon.</p>
            </Card.Body>
          </Card>
        );
      case 'stats':
        return (
          <Card>
            <Card.Header>Statistics</Card.Header>
            <Card.Body>
              <p>Statistics dashboard will be implemented soon.</p>
            </Card.Body>
          </Card>
        );
      default:
        return <AvailabilitySettings />;
    }
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="mt-3">Manager Dashboard</h2>
          <p>Manage your tennis club settings and bookings</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'availability'} 
                onClick={() => setActiveTab('availability')}
              >
                Availability Settings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'calendar'} 
                onClick={() => setActiveTab('calendar')}
              >
                Court Calendar
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'courts'} 
                onClick={() => setActiveTab('courts')}
              >
                Courts
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'stats'} 
                onClick={() => setActiveTab('stats')}
              >
                Statistics
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
      </Row>

      <Row>
        <Col>
          {renderTabContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default ManagerDashboard;