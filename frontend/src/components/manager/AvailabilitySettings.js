// frontend/src/components/manager/AvailabilitySettings.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Tabs, Tab, Spinner, Alert } from 'react-bootstrap';
import api from '../../interceptors/Interceptor';
import ClubSettingsForm from './ClubSettingsForm';
import SpecialHoursManager from './SpecialHoursManager';
import CourtRestrictionsManager from './CourtRestrictionsManager';

const AvailabilitySettings = () => {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load manager's clubs
  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      try {
        const response = await api.get('http://localhost:8000/api/clubs/');
        
        // Extract clubs data based on response format
        const clubsData = response.data.results || response.data || [];
        
        if (clubsData.length > 0) {
          setClubs(clubsData);
          setSelectedClub(clubsData[0].id);
        } else {
          setError('You don\'t have any clubs to manage. Please create a club first.');
        }
      } catch (err) {
        setError('Failed to load clubs. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // Club selector component
  const ClubSelector = () => (
    <div className="mb-4">
      <h4>Select Club</h4>
      <select 
        className="form-select" 
        value={selectedClub || ''} 
        onChange={(e) => setSelectedClub(e.target.value)}
      >
        {clubs.map(club => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading clubs data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );
  }

  if (clubs.length === 0) {
    return (
      <Alert variant="info" className="m-3">
        You don't have any clubs to manage. Please create a club first.
      </Alert>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <ClubSelector />
        </Col>
      </Row>

      <Row>
        <Col>
          <Tabs defaultActiveKey="general" className="mb-4">
            <Tab eventKey="general" title="General Settings">
              <ClubSettingsForm clubId={selectedClub} />
            </Tab>
            <Tab eventKey="special-hours" title="Special Hours">
              <SpecialHoursManager clubId={selectedClub} />
            </Tab>
            <Tab eventKey="court-restrictions" title="Court Restrictions">
              <CourtRestrictionsManager clubId={selectedClub} />
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default AvailabilitySettings;