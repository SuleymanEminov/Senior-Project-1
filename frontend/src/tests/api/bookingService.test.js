import { bookingService } from '../../services/api';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('Booking Service API Tests', () => {
  // Setup mock for axios instance
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };

  // Setup before tests
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock axios create to return our mock instance
    axios.create.mockReturnValue(mockAxiosInstance);
  });

  // Test getting bookings
  test('getBookings should call the correct endpoint with parameters', async () => {
    // Setup mock response
    const mockResponse = {
      data: [
        { id: 1, court: 1, user: 1, start_time: '2023-10-10T10:00:00Z', end_time: '2023-10-10T11:00:00Z' },
        { id: 2, court: 2, user: 1, start_time: '2023-10-11T10:00:00Z', end_time: '2023-10-11T11:00:00Z' }
      ]
    };
    
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    // Call the service with query parameters
    const params = { date: '2023-10-10' };
    const result = await bookingService.getBookings(params);
    
    // Assertions
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('bookings/', { params });
    expect(result).toBe(mockResponse);
  });

  // Test getting a single booking
  test('getBooking should call the correct endpoint with ID', async () => {
    // Setup mock response
    const mockResponse = {
      data: { 
        id: 1, 
        court: 1, 
        user: 1, 
        start_time: '2023-10-10T10:00:00Z', 
        end_time: '2023-10-10T11:00:00Z' 
      }
    };
    
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    // Call the service
    const result = await bookingService.getBooking(1);
    
    // Assertions
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('bookings/1/');
    expect(result).toBe(mockResponse);
  });

  // Test creating a booking
  test('createBooking should call the correct endpoint with booking data', async () => {
    // Setup mock response
    const mockResponse = {
      data: { 
        id: 1,
        court: 1, 
        user: 1, 
        start_time: '2023-10-10T10:00:00Z', 
        end_time: '2023-10-10T11:00:00Z'
      }
    };
    
    mockAxiosInstance.post.mockResolvedValue(mockResponse);
    
    // Booking data
    const bookingData = {
      court: 1,
      start_time: '2023-10-10T10:00:00Z',
      end_time: '2023-10-10T11:00:00Z'
    };
    
    // Call the service
    const result = await bookingService.createBooking(bookingData);
    
    // Assertions
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('bookings/', bookingData);
    expect(result).toBe(mockResponse);
  });

  // Test updating a booking
  test('updateBooking should call the correct endpoint with booking data', async () => {
    // Setup mock response
    const mockResponse = {
      data: { 
        id: 1,
        court: 1, 
        user: 1, 
        start_time: '2023-10-10T10:00:00Z', 
        end_time: '2023-10-10T12:00:00Z' // Updated time
      }
    };
    
    mockAxiosInstance.put.mockResolvedValue(mockResponse);
    
    // Booking data with updated end time
    const bookingData = {
      court: 1,
      start_time: '2023-10-10T10:00:00Z',
      end_time: '2023-10-10T12:00:00Z'
    };
    
    // Call the service
    const result = await bookingService.updateBooking(1, bookingData);
    
    // Assertions
    expect(mockAxiosInstance.put).toHaveBeenCalledWith('bookings/1/', bookingData);
    expect(result).toBe(mockResponse);
  });

  // Test deleting a booking
  test('deleteBooking should call the correct endpoint with ID', async () => {
    // Setup mock response
    const mockResponse = { data: {} };
    
    mockAxiosInstance.delete.mockResolvedValue(mockResponse);
    
    // Call the service
    const result = await bookingService.deleteBooking(1);
    
    // Assertions
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('bookings/1/');
    expect(result).toBe(mockResponse);
  });

  // Test error handling
  test('should handle API errors correctly', async () => {
    // Setup mock error
    const mockError = {
      response: {
        status: 400,
        data: { detail: 'Bad request' }
      }
    };
    
    mockAxiosInstance.get.mockRejectedValue(mockError);
    
    // Call the service and expect it to throw
    await expect(bookingService.getBookings()).rejects.toEqual(mockError);
  });
}); 