import React, { useState, useEffect } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import './Navigation.css';

export function Navigation() {
   const [isAuth, setIsAuth] = useState(false);

   useEffect(() => {
     if (localStorage.getItem('access_token') !== null) {
        setIsAuth(true); 
      }
    }, []);

    const handleLogout = () => {
      localStorage.removeItem('access_token');
      setIsAuth(false);
    };

    return ( 
      <Navbar variant="light" expand="lg" sticky="top" className="navbar-frosted">
        <Container>
          <Navbar.Brand href="/">Tennis Court Booking</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
                <Nav.Link href="/">Home</Nav.Link>
                <Nav.Link href="/hello">Hello</Nav.Link>
                <Nav.Link href="/about">About</Nav.Link>
                <Nav.Link href="/contact">Contact</Nav.Link>
            </Nav>
            <Nav>
              {isAuth ? (
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