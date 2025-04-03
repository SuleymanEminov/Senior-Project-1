import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../interceptors/Interceptor';
import './UserProfile.css'; 

export const UserProfile = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [userStats, setUserStats] = useState({
    bookingsCount: 0
  });

  // Load user data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        password: '',
        confirmPassword: ''
      });
      
      // Load user stats
      const fetchUserStats = async () => {
        try {
          const response = await api.get('/api/users/profile/');
          setUserStats({
            bookingsCount: response.data.bookings_count || 0
          });
        } catch (err) {
          console.error('Error fetching user stats:', err);
        }
      };
      
      fetchUserStats();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validate password match if password is provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      // Prepare data for submission
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email
      };
      
      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      // Update profile
      const response = await api.put('/api/users/profile/', updateData);
      
      // Update the user in context
      if (updateCurrentUser) {
        updateCurrentUser(response.data);
      }
      
      setSuccess('Profile updated successfully');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error('Profile update error:', err);
      setError(
        err.response?.data?.detail || 
        'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <Row>
        {/* User Stats Card */}
        <Col md={4} className="mb-4">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Profile Summary</h4>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-center mb-4">
                <div className="profile-avatar">
                  {/* Default avatar with initials */}
                  <div className="avatar-circle bg-secondary text-white">
                    {currentUser?.first_name?.charAt(0) || ''}
                    {currentUser?.last_name?.charAt(0) || ''}
                  </div>
                </div>
              </div>
              
              <h5 className="text-center mb-3">
                {currentUser?.first_name} {currentUser?.last_name}
              </h5>
              
              <p className="text-center text-muted mb-4">
                {currentUser?.email}
              </p>
              
              <hr />
              
              <div className="stat-item d-flex justify-content-between align-items-center">
                <span>Username:</span>
                <span className="font-weight-bold">{currentUser?.username}</span>
              </div>
              
              <div className="stat-item d-flex justify-content-between align-items-center mt-2">
                <span>Total Bookings:</span>
                <span className="font-weight-bold">{userStats.bookingsCount}</span>
              </div>
              
              <div className="stat-item d-flex justify-content-between align-items-center mt-2">
                <span>Account Type:</span>
                <span className="font-weight-bold">
                  {currentUser?.groups?.includes('Manager') ? 'Manager' : 
                   currentUser?.groups?.includes('Admin') ? 'Administrator' : 'Client'}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Profile Edit Form */}
        <Col md={8}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Edit Profile</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <hr className="my-4" />
                <h5>Change Password</h5>
                <p className="text-muted mb-3">Leave blank if you don't want to change your password</p>
                
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Updating...
                      </>
                    ) : 'Update Profile'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};