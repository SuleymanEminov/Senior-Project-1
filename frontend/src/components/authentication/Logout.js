import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../interceptors/Interceptor";

export const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            try {
                // Get the refresh token
                const refreshToken = localStorage.getItem('refresh_token');
                
                // Attempt to blacklist the token on the server
                await api.post('/api/logout/', { refresh_token: refreshToken });
            } catch (error) {
                console.error('Error during logout:', error);
                // Continue with logout process even if server request fails
            } finally {
                // Always clear local storage and redirect
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                
                // Reset authorization header
                api.defaults.headers.common['Authorization'] = null;
                
                // Redirect to login page
                navigate('/login');
            }
        };

        performLogout();
    }, [navigate]);

    // Show a simple loading message while logging out
    return <div className="text-center p-5">Logging out...</div>;
};