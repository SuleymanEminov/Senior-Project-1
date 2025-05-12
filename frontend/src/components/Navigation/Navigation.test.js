import React from 'react';
import { render, screen } from '@testing-library/react';
import { Navigation } from './Navigation';
import { useAuth } from '../../context/AuthContext';

// Mock the useAuth hook
jest.mock('../../context/AuthContext');

describe('Navigation Component', () => {
  // Test for when user is not logged in
  test('renders login and register links when user is not logged in', () => {
    // Setup mock return value for useAuth
    useAuth.mockReturnValue({
      currentUser: null,
      logout: jest.fn()
    });

    render(<Navigation />);
    
    // Check if login and register links are present
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
    
    // Check if profile and logout links are NOT present
    expect(screen.queryByText(/Profile/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
    
    // Check if manager dashboard link is NOT present
    expect(screen.queryByText(/Manager Dashboard/i)).not.toBeInTheDocument();
  });

  // Test for logged in regular user
  test('renders profile and logout links when user is logged in', () => {
    // Setup mock return value for useAuth with logged in user
    useAuth.mockReturnValue({
      currentUser: { username: 'testuser', groups: [] },
      logout: jest.fn()
    });

    render(<Navigation />);
    
    // Check if profile and logout links are present
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    
    // Check if login and register links are NOT present
    expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Register/i)).not.toBeInTheDocument();
    
    // Check if manager dashboard link is NOT present for regular user
    expect(screen.queryByText(/Manager Dashboard/i)).not.toBeInTheDocument();
  });

  // Test for logged in manager user
  test('renders manager dashboard link for manager users', () => {
    // Setup mock return value for useAuth with manager user
    useAuth.mockReturnValue({
      currentUser: { username: 'manager', groups: ['Manager'] },
      logout: jest.fn()
    });

    render(<Navigation />);
    
    // Check if manager dashboard link is present
    expect(screen.getByText(/Manager Dashboard/i)).toBeInTheDocument();
    
    // Check if profile and logout links are present
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  // Test for logout functionality
  test('calls logout function when logout link is clicked', () => {
    // Create a mock function
    const mockLogout = jest.fn();
    
    // Setup mock return value for useAuth with mock logout function
    useAuth.mockReturnValue({
      currentUser: { username: 'testuser', groups: [] },
      logout: mockLogout
    });

    render(<Navigation />);
    
    // Click on the logout link
    screen.getByText(/Logout/i).click();
    
    // Check if logout function was called
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
}); 