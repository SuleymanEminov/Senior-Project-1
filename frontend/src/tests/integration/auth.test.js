import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import LoginPage from '../../components/Auth/LoginPage';
import ProfilePage from '../../components/Profile/ProfilePage';
import { Navigation } from '../../components/Navigation/Navigation';

// Mock the api service
jest.mock('../../services/api', () => ({
  authService: {
    login: jest.fn().mockResolvedValue({
      data: {
        access: 'fake-access-token',
        refresh: 'fake-refresh-token'
      }
    })
  }
}));

// Mock fetch for user data
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    groups: []
  })
});

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
  });

  test('login flow should work correctly and update navigation', async () => {
    // Setup test component with router and auth provider
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Navigation />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify login page is rendered
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    
    // Fill in login form
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: 'testuser' }
    });
    
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Wait for redirect and state update
    await waitFor(() => {
      // Verify we have a Profile link in the navigation now 
      expect(screen.getByText(/Profile/i)).toBeInTheDocument();
      
      // Verify login/register links are gone
      expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Register/i)).not.toBeInTheDocument();
    });
    
    // Verify tokens are stored in localStorage
    expect(localStorage.getItem('access_token')).toBe('fake-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('fake-refresh-token');
  });

  test('logout should clear auth state and update navigation', async () => {
    // Setup initial auth state
    localStorage.setItem('access_token', 'fake-access-token');
    localStorage.setItem('refresh_token', 'fake-refresh-token');
    
    // Setup test component
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <AuthProvider>
          <Navigation />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for auth state to be loaded
    await waitFor(() => {
      expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });
    
    // Click logout
    fireEvent.click(screen.getByText(/Logout/i));
    
    // Verify navigation is updated
    await waitFor(() => {
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
      expect(screen.getByText(/Register/i)).toBeInTheDocument();
      expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
    });
    
    // Verify localStorage is cleared
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
}); 