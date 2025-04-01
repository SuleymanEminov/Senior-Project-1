// frontend/src/components/clubs/AddClubForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from "react-bootstrap";
import "./AddClubForm.css";

export const AddClubForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    email: "",
    phone_number: "",
    website: "",
    opening_time: "08:00:00",
    closing_time: "20:00:00",
    min_booking_duration: 60,
    max_booking_duration: 120,
    booking_increment: 30,
    max_advance_booking_days: 14,
    same_day_booking_cutoff: 0
  });

  const [courts, setCourts] = useState([{ type: "", count: "" }]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const allCourtTypes = ["hard", "clay", "grass"];

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Use the clubs endpoint to verify token validity
        await axios.get("http://localhost:8000/api/clubs/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Authentication error:", error);
        // If we get a 401 Unauthorized, token is invalid
        if (error.response && error.response.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("access_token");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { 
        state: { message: "Please login to register a club" } 
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value + ":00" });
  };

  const handleCourtChange = (e, index) => {
    const { name, value } = e.target;
    const updatedCourts = [...courts];
    updatedCourts[index][name] = value;
    setCourts(updatedCourts);
  };

  const addCourtType = () => {
    setCourts([...courts, { type: "", count: "" }]);
  };

  const removeCourtType = (index) => {
    const updatedCourts = courts.filter((_, i) => i !== index);
    setCourts(updatedCourts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const dataToSubmit = {
      ...formData,
      min_booking_duration: parseInt(formData.min_booking_duration, 10),
      max_booking_duration: parseInt(formData.max_booking_duration, 10),
      booking_increment: parseInt(formData.booking_increment, 10),
      max_advance_booking_days: parseInt(formData.max_advance_booking_days, 10),
      same_day_booking_cutoff: parseInt(formData.same_day_booking_cutoff, 10),
      courts: courts.map((court) => ({
        type: court.type,
        count: parseInt(court.count, 10),
      })),
    };

    try {
      await axios.post(
        "http://localhost:8000/api/clubs/", 
        dataToSubmit,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setSuccessMessage("Club submitted successfully for approval!");
      setErrorMessage("");
      
      // Reset form
      setFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        phone_number: "",
        email: "",
        website: "",
        opening_time: "08:00:00",
        closing_time: "20:00:00",
        min_booking_duration: 60,
        max_booking_duration: 120,
        booking_increment: 30,
        max_advance_booking_days: 14,
        same_day_booking_cutoff: 0
      });
      setCourts([{ type: "", count: "" }]);
      setShowAdvancedSettings(false);
    } catch (error) {
      console.error("Submission error:", error);
      setErrorMessage(
        error.response?.data?.detail || 
        "Failed to submit the club. Please try again."
      );
      setSuccessMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  const getDropdownOptions = (index) => {
    const selectedTypes = courts.map((court) => court.type);
    return allCourtTypes.filter(
      (type) => type === courts[index].type || !selectedTypes.includes(type)
    );
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  // If not authenticated, we'll redirect, so we don't need to render anything
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container className="my-5">
      <Card className="form-card">
        <Card.Body>
          <h2 className="text-center mb-4">Register Your Tennis Club</h2>
          <p className="text-muted text-center">
            Note: Your club will be reviewed by an administrator before being published.
          </p>
          
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

          <Form onSubmit={handleSubmit}>
            <section className="mb-4">
              <h3>Club Information</h3>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Club Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Website (Optional)</Form.Label>
                    <Form.Control
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </section>

            <section className="mb-4">
              <h3>Court Details</h3>
              {courts.map((court, index) => (
                <Row key={index} className="mb-3 court-row align-items-end">
                  <Col xs={5}>
                    <Form.Group>
                      <Form.Label>Court Type</Form.Label>
                      <Form.Select
                        name="type"
                        value={court.type}
                        onChange={(e) => handleCourtChange(e, index)}
                        required
                      >
                        <option value="" disabled>
                          Select Court Type
                        </option>
                        {getDropdownOptions(index).map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={5}>
                    <Form.Group>
                      <Form.Label>Number of Courts</Form.Label>
                      <Form.Control
                        type="number"
                        name="count"
                        value={court.count}
                        onChange={(e) => handleCourtChange(e, index)}
                        placeholder="Count"
                        required
                        min="1"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={2}>
                    <Button
                      variant="danger"
                      onClick={() => removeCourtType(index)}
                      disabled={courts.length === 1}
                      className="w-100"
                    >
                      <span>✖</span>
                    </Button>
                  </Col>
                </Row>
              ))}
              
              {courts.length < allCourtTypes.length && (
                <Button
                  variant="primary"
                  onClick={addCourtType}
                  className="mb-3"
                >
                  <span>+</span> Add Another Court Type
                </Button>
              )}
            </section>

            <section className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Operating Hours</h3>
                <Button 
                  variant="link" 
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="p-0"
                >
                  {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                </Button>
              </div>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Opening Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={formData.opening_time.substring(0, 5)}
                      onChange={(e) => handleTimeChange({
                        target: { name: 'opening_time', value: e.target.value }
                      })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Closing Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={formData.closing_time.substring(0, 5)}
                      onChange={(e) => handleTimeChange({
                        target: { name: 'closing_time', value: e.target.value }
                      })}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              {showAdvancedSettings && (
                <>
                  <h4 className="mt-4 mb-3">Booking Rules</h4>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Minimum Booking Duration (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          name="min_booking_duration"
                          value={formData.min_booking_duration}
                          onChange={handleChange}
                          min="15"
                          max="240"
                          step="15"
                          required
                        />
                        <Form.Text className="text-muted">
                          Minimum time a court can be booked (15-240 min)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Maximum Booking Duration (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          name="max_booking_duration"
                          value={formData.max_booking_duration}
                          onChange={handleChange}
                          min="30"
                          max="480"
                          step="15"
                          required
                        />
                        <Form.Text className="text-muted">
                          Maximum time a court can be booked (30-480 min)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Booking Time Increment (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          name="booking_increment"
                          value={formData.booking_increment}
                          onChange={handleChange}
                          min="15"
                          max="60"
                          step="15"
                          required
                        />
                        <Form.Text className="text-muted">
                          Time slots increment (15, 30, 45, or 60 min)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Maximum Advance Booking (days)</Form.Label>
                        <Form.Control
                          type="number"
                          name="max_advance_booking_days"
                          value={formData.max_advance_booking_days}
                          onChange={handleChange}
                          min="1"
                          max="365"
                          required
                        />
                        <Form.Text className="text-muted">
                          How many days in advance courts can be booked
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Same-Day Booking Cutoff (hours)</Form.Label>
                        <Form.Control
                          type="number"
                          name="same_day_booking_cutoff"
                          value={formData.same_day_booking_cutoff}
                          onChange={handleChange}
                          min="0"
                          max="24"
                          required
                        />
                        <Form.Text className="text-muted">
                          Hours before start time that same-day booking is cut off (0 = no cutoff)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
            </section>

            <div className="d-grid">
              <Button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Submitting...</> : 'Submit Club'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};