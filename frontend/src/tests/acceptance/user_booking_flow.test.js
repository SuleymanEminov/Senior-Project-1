import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { AuthProvider } from '../../context/AuthContext';
import { courtService, bookingService } from '../../services/api';

// Mock the API services
jest.mock('../../services/api', () => {
  const originalModule = jest.requireActual('../../services/api');
  
  return {
    ...originalModule,
    authService: {
      login: jest.fn().mockResolvedValue({
        data: {
          access: 'fake-access-token',
          refresh: 'fake-refresh-token'
        }
      })
    },
    courtService: {
      getCourts: jest.fn().mockResolvedValue({
        data: [
          { id: 1, name: 'Indoor Court 1', court_type: 'Indoor', surface_type: 'Hard', is_active: true },
          { id: 2, name: 'Outdoor Court 1', court_type: 'Outdoor', surface_type: 'Clay', is_active: true }
        ]
      }),
      getCourtAvailability: jest.fn().mockResolvedValue({
        data: {
          court_id: 1,
          date: '2023-10-10',
          available_slots: [
            { start_time: '2023-10-10T10:00:00Z', end_time: '2023-10-10T11:00:00Z', available: true },
            { start_time: '2023-10-10T11:00:00Z', end_time: '2023-10-10T12:00:00Z', available: false },
            { start_time: '2023-10-10T12:00:00Z', end_time: '2023-10-10T13:00:00Z', available: true },
          ]
        }
      })
    },
    bookingService: {
      createBooking: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          court: 1,
          start_time: '2023-10-10T10:00:00Z',
          end_time: '2023-10-10T11:00:00Z',
          status: 'Confirmed'
        }
      }),
      getBookings: jest.fn().mockResolvedValue({
        data: []
      }),
      getBooking: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          court: 1,
          start_time: '2023-10-10T10:00:00Z',
          end_time: '2023-10-10T11:00:00Z',
          status: 'Confirmed'
        }
      }),
      deleteBooking: jest.fn().mockResolvedValue({
        status: 204
      })
    }
  };
});

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

describe('User Booking Flow Acceptance Tests', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  const setupLoggedInUser = async () => {
    // Set up initial auth state to simulate logged in user
    localStorage.setItem('access_token', 'fake-access-token');
    localStorage.setItem('refresh_token', 'fake-refresh-token');
  };

  test('Complete user booking flow - search, book, and cancel', async () => {
    // Setup logged in user
    await setupLoggedInUser();
    
    // Render the application
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for app to load and auth state to be set
    await waitFor(() => {
      expect(screen.getByText(/Tennis Court Booking/i)).toBeInTheDocument();
    });
    
    // 1. Navigate to booking page
    await act(async () => {
      fireEvent.click(screen.getByText(/Book a Court/i));
    });
    
    // Wait for courts to load
    await waitFor(() => {
      expect(screen.getByText(/Select a Court/i)).toBeInTheDocument();
    });
    
    // Verify courts were loaded
    expect(courtService.getCourts).toHaveBeenCalled();
    expect(screen.getByText(/Indoor Court 1/i)).toBeInTheDocument();
    
    // 2. Select a court
    await act(async () => {
      fireEvent.click(screen.getByText(/Indoor Court 1/i));
    });
    
    // Wait for availability to load
    await waitFor(() => {
      expect(screen.getByText(/Select a Time Slot/i)).toBeInTheDocument();
    });
    
    // Verify availability was fetched
    expect(courtService.getCourtAvailability).toHaveBeenCalled();
    
    // 3. Select an available time slot
    const availableSlot = screen.getByText(/10:00 AM - 11:00 AM/i);
    expect(availableSlot).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(availableSlot);
    });
    
    // 4. Confirm booking
    await act(async () => {
      fireEvent.click(screen.getByText(/Confirm Booking/i));
    });
    
    // Verify booking was created
    await waitFor(() => {
      expect(bookingService.createBooking).toHaveBeenCalledWith({
        court: 1,
        start_time: '2023-10-10T10:00:00Z',
        end_time: '2023-10-10T11:00:00Z'
      });
    });
    
    // 5. Verify success message
    await waitFor(() => {
      expect(screen.getByText(/Booking Confirmed/i)).toBeInTheDocument();
    });
    
    // 6. Navigate to My Bookings
    await act(async () => {
      fireEvent.click(screen.getByText(/My Bookings/i));
    });
    
    // Wait for bookings to load
    await waitFor(() => {
      expect(screen.getByText(/Your Bookings/i)).toBeInTheDocument();
    });
    
    // Mock that getBookings now returns our new booking
    bookingService.getBookings.mockResolvedValueOnce({
      data: [{
        id: 1,
        court: { id: 1, name: 'Indoor Court 1' },
        start_time: '2023-10-10T10:00:00Z',
        end_time: '2023-10-10T11:00:00Z',
        status: 'Confirmed'
      }]
    });
    
    // Refresh the bookings
    await act(async () => {
      fireEvent.click(screen.getByText(/Refresh/i));
    });
    
    // Verify booking is displayed
    await waitFor(() => {
      expect(screen.getByText(/Indoor Court 1/i)).toBeInTheDocument();
      expect(screen.getByText(/October 10, 2023/i)).toBeInTheDocument();
    });
    
    // 7. Cancel the booking
    await act(async () => {
      fireEvent.click(screen.getByText(/Cancel Booking/i));
    });
    
    // Confirm cancellation
    await act(async () => {
      fireEvent.click(screen.getByText(/Confirm Cancellation/i));
    });
    
    // Verify booking was cancelled
    await waitFor(() => {
      expect(bookingService.deleteBooking).toHaveBeenCalledWith(1);
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/Booking Cancelled/i)).toBeInTheDocument();
    });
  });
  
  test('Error handling during booking process', async () => {
    // Setup logged in user
    await setupLoggedInUser();
    
    // Set up error for booking creation
    bookingService.createBooking.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { detail: 'Court is not available at this time' }
      }
    });
    
    // Render the application
    render(
      <MemoryRouter initialEntries={['/booking']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for booking page to load
    await waitFor(() => {
      expect(screen.getByText(/Select a Court/i)).toBeInTheDocument();
    });
    
    // Select a court
    await act(async () => {
      fireEvent.click(screen.getByText(/Indoor Court 1/i));
    });
    
    // Select an available time slot
    await waitFor(() => {
      expect(screen.getByText(/10:00 AM - 11:00 AM/i)).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText(/10:00 AM - 11:00 AM/i));
    });
    
    // Try to confirm booking (should fail)
    await act(async () => {
      fireEvent.click(screen.getByText(/Confirm Booking/i));
    });
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Court is not available at this time/i)).toBeInTheDocument();
    });
  });
}); 