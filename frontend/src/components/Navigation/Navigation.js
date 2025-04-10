import React from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { useAuth } from '../../context/AuthContext';
import './Navigation.css';

export function Navigation() {
   const { currentUser, logout } = useAuth();
   
   // Check if user is a manager
   const isManager = currentUser?.groups?.includes('Manager');

   const handleLogout = () => {
      logout();
   };

   return ( 
      <Navbar variant="light" expand="lg" sticky="top" className="navbar-frosted">
        <Container>
          <Navbar.Brand href="/">Tennis Court Booking</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
                <Nav.Link href="/">Home</Nav.Link>
                {/* Show Dashboard link only for managers */}
                {isManager && (
                  <Nav.Link href="/manager/dashboard">Manager Dashboard</Nav.Link>
                )}
            </Nav>
            <Nav>
              {currentUser ? (
                <>
                  <Nav.Link href="/profile">Profile</Nav.Link>
                  <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link href="/login">Login</Nav.Link>
                  <Nav.Link href="/register">Register</Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
}