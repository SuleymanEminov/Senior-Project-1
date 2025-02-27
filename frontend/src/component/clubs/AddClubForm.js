import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
  });

  const [courts, setCourts] = useState([{ type: "", count: "" }]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
        // This will return a 401 if token is invalid
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

  // Rest of the component remains the same...

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

    const dataToSubmit = {
      ...formData,
      courts: courts.map((court) => ({
        type: court.type,
        count: parseInt(court.count, 10),
      })),
    };

    try {
      const response = await axios.post(
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
      });
      setCourts([{ type: "", count: "" }]);
    } catch (error) {
      console.error("Submission error:", error);
      setErrorMessage(
        error.response?.data?.detail || 
        "Failed to submit the club. Please try again."
      );
      setSuccessMessage("");
    }
  };

  const getDropdownOptions = (index) => {
    const selectedTypes = courts.map((court) => court.type);
    return allCourtTypes.filter(
      (type) => type === courts[index].type || !selectedTypes.includes(type)
    );
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // If not authenticated, we'll redirect, so we don't need to render anything
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="form-card">
      <h2>Register Your Tennis Club</h2>
      <p className="approval-note">
        Note: Your club will be reviewed by an administrator before being published.
      </p>
      
      {successMessage && <div className="alert success">{successMessage}</div>}
      {errorMessage && <div className="alert error">{errorMessage}</div>}

      <form onSubmit={handleSubmit}>
        <section>
          <h3>Club Information</h3>
          <div className="form-group">
            <label htmlFor="name">Club Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Address:</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City:</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="state">State:</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="zip_code">Postal Code:</label>
              <input
                type="text"
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone_number">Phone Number:</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="website">Website (Optional):</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
            />
          </div>
        </section>

        <section>
          <h3>Court Details</h3>
          {courts.map((court, index) => (
            <div key={index} className="form-row court-row">
              <select
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
              </select>
              <input
                type="number"
                name="count"
                value={court.count}
                onChange={(e) => handleCourtChange(e, index)}
                placeholder="Number of Courts"
                required
                min="1"
              />
              <button
                type="button"
                onClick={() => removeCourtType(index)}
                className="btn-remove"
              >
                <span>✖</span>
              </button>
            </div>
          ))}
          {courts.length < allCourtTypes.length && (
            <button
              type="button"
              onClick={addCourtType}
              className="btn-add-court"
            >
              <span>➕</span> Add Another Court Type
            </button>
          )}
        </section>

        <button type="submit" className="btn-submit mt-3">
          Submit Club
        </button>
      </form>
    </div>
  );
};