import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Hello } from "./components/Hello";
import { Navigation } from "./components/Navigation/Navigation";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Register } from "./components/authentication/Register";
import { Login } from "./components/authentication/Login";
import { Logout } from "./components/authentication/Logout";
import { Book } from "./components/booking/Book";
import { AddClubForm } from "./components/clubs/AddClubForm";
import ManagerDashboard from './components/manager/ManagerDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  document.title = "Tennis Court Booking";
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navigation />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Hello />} />
          <Route path="/hello" element={<Hello />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          
          {/* Protected routes - require authentication */}
          <Route 
            path="/book" 
            element={
              <ProtectedRoute>
                <Book />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/apply-club" 
            element={
              <ProtectedRoute>
                <AddClubForm />
              </ProtectedRoute>
            } 
          />
          
          {/* Manager routes - require Manager role */}
          <Route 
            path="/manager/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Manager', 'Admin']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<h1>Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
