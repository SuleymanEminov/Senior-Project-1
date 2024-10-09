import React from 'react';
import './App.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import {Home} from "./component/home";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  document.title = "Tennis Court Booking";
  return <BrowserRouter>
  <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/home" element={<Home/>}/>
    <Route path="*" element={<h1>Not Found</h1>}/>
  </Routes>
  <h1>Hello</h1>
</BrowserRouter>;
}

export default App;
