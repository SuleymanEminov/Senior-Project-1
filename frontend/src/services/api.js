import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include the JWT token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API services
export const authService = {
  login: (credentials) => api.post('token/', credentials),
  register: (userData) => api.post('register/', userData),
  logout: (refresh_token) => api.post('logout/', { refresh_token }),
  refreshToken: (refresh_token) => api.post('token/refresh/', { refresh: refresh_token }),
};

export const clubService = {
  getClubs: () => api.get('clubs/'),
  getClub: (id) => api.get(`clubs/${id}/`),
  createClub: (clubData) => api.post('clubs/', clubData),
  updateClub: (id, clubData) => api.put(`clubs/${id}/`, clubData),
  deleteClub: (id) => api.delete(`clubs/${id}/`),
  getClubBookings: (id, params) => api.get(`clubs/${id}/bookings/`, { params }),
};

export const courtService = {
  getCourts: (params) => api.get('courts/', { params }),
  getCourt: (id) => api.get(`courts/${id}/`),
  createCourt: (courtData) => api.post('courts/', courtData),
  updateCourt: (id, courtData) => api.put(`courts/${id}/`, courtData),
  deleteCourt: (id) => api.delete(`courts/${id}/`),
  getCourtAvailability: (id, params) => api.get(`courts/${id}/availability/`, { params }),
};

export const bookingService = {
  getBookings: (params) => api.get('bookings/', { params }),
  getBooking: (id) => api.get(`bookings/${id}/`),
  createBooking: (bookingData) => api.post('bookings/', bookingData),
  updateBooking: (id, bookingData) => api.put(`bookings/${id}/`, bookingData),
  deleteBooking: (id) => api.delete(`bookings/${id}/`),
  getCalendarBookings: (params) => api.get('bookings/calendar/', { params }),
};

export const userService = {
  getCurrentUser: () => api.get('users/me/'),
  updateUser: (userData) => api.put('users/me/', userData),
  getUsers: () => api.get('users/'),
  getUser: (id) => api.get(`users/${id}/`),
};

export default api;