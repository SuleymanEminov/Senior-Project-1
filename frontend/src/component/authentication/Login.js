import axios from "axios";
import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from "react-router-dom";
import "./authentication.css";

export function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async e => {
        e.preventDefault();

        const user = {
            username: username,
            password: password
        };
        try {
            // Create POST request to backend
            const {data} = await axios.post("http://localhost:8000/api/token/", user, 
            {
                headers : 
                {
                    "Content-Type": "application/json"},
                    withCredentials: true
                });

            // Initialize the access & refresh token in localstorage.      
            localStorage.clear();
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);

            axios.defaults.headers.common['Authorization'] = "Bearer " + data.access;
            window.location.href = "/";
        }
        catch (error) {
            // Handle error response
            if (error.response && error.response.status === 401) {
                // Unauthorized: Invalid username or password
                setErrorMessage("Invalid username or password. Please try again.");
            } else {
                // Other errors
                setErrorMessage("An error occurred. Please try again later.");
            }
        }
    }

    return(
        <div className="Auth-form-container">
    <form className="Auth-form" onSubmit={handleSubmit}>
        <div className="Auth-form-content">
            <h3 className="Auth-form-title">Sign In</h3>
            {errorMessage && (
                <div className="alert alert-danger mt-3" role="alert">
                    {errorMessage}
                </div>
            )}
            <div className="form-group mt-3">
                <label>Username</label>
                <input
                    className="form-control mt-1"
                    placeholder="Enter Username"
                    name="username"
                    type="text"
                    value={username}
                    required
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div className="form-group mt-3">
                <label>Password</label>
                <input
                    name="password"
                    type="password"
                    className="form-control mt-1"
                    placeholder="Enter Password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <div className="d-grid gap-2 mt-3">
                <button type="submit" className="btn btn-primary">
                    Submit
                </button>
            </div>
            <p className="mt-3">
                Don't have an account? <Link to="/register">Register here.</Link>
            </p>
        </div>
    </form>
</div>
    )
}