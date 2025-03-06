import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from "react-router-dom";

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    password2: '',
    email: '',
    first_name: '',
    last_name: ''
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/register/', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = response.data;
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      setMessage('Registration successful!');
      
      axios.defaults.headers.common['Authorization'] = "Bearer " + data.access;
      window.location.href = "/";
    } catch (error) {
        if (error.response && error.response.data) {
          const errorMessage = error.response.data.username
            ? 'This username is already taken.'
            : error.response.data.email
            ? 'This email is already taken.'
            : 'Registration failed. ' + JSON.stringify(error.response.data);
          setMessage(errorMessage);
        } else {
          setMessage('Registration failed. Please try again.');
        }
    }
  };

  return (
    <div className="Auth-form-container">
    <form className="Auth-form" onSubmit={handleSubmit}>
        <div className="Auth-form-content">
            <h3 className="Auth-form-title">Create an Account</h3>
            <p className="Auth-form-subtitle">
                Join us today! Fill in the details below to get started.
            </p>
            <div className="form-group mt-3">
                <label>Username</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="form-control mt-1"
                    placeholder="Choose a username"
                    required
                />
            </div>
            <div className="form-group mt-3">
                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-control mt-1"
                    placeholder="Enter your email"
                    required
                />
            </div>
            <div className="form-group mt-3">
                <label>First Name</label>
                <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="form-control mt-1"
                    placeholder="Enter your first name"
                />
            </div>
            <div className="form-group mt-3">
                <label>Last Name</label>
                <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="form-control mt-1"
                    placeholder="Enter your last name"
                />
            </div>
            <div className="form-group mt-3">
                <label>Password</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-control mt-1"
                    placeholder="Create a strong password"
                    required
                />
            </div>
            <div className="form-group mt-3">
                <label>Confirm Password</label>
                <input
                    type="password"
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    className="form-control mt-1"
                    placeholder="Re-enter your password"
                    required
                />
            </div>
            <div className="d-grid gap-2 mt-4">
                <button type="submit" className="btn btn-primary btn-block">
                    Register
                </button>
            </div>
            <p className="text-center mt-3">
                Already have an account? <Link to="/login" className="link-primary">Log in</Link>
            </p>
            {message && <p className="text-success text-center mt-3">{message}</p>}
        </div>
    </form>
</div>
  );
};