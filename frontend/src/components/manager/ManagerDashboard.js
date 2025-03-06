import React, { useState } from 'react';
import { Container, Row, Col, Nav, Card } from 'react-bootstrap';
import CourtCalendar from './CourtCalendar';
import { useAuth } from '../../context/AuthContext';

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const { currentUser } = useAuth();

  // Function to render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <CourtCalendar />;
      case 'stats':
        return (
          <Card className="mt-3">
            <Card.Header>Statistics</Card.Header>
            <Card.Body>
              <p>Statistics dashboard will be implemented here.</p>
            </Card.Body>
          </Card>
        );
      case 'courts':
        return (
          <Card className="mt-3">
            <Card.Header>Court Management</Card.Header>
            <Card.Body>
              <p>Court management interface will be implemented here.</p>
            </Card.Body>
          </Card>
        );
      case 'settings':
        return (
          <Card className="mt-3">
            <Card.Header>Settings</Card.Header>
            <Card.Body>
              <p>Club settings management will be implemented here.</p>
            </Card.Body>
          </Card>
        );
      default:
        return <CourtCalendar />;
    }
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="mt-3">Manager Dashboard</h2>
          <p>Welcome, {currentUser?.first_name} {currentUser?.last_name}</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Nav variant="tabs" className="mb-3">
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
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')}
              >
                Settings
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