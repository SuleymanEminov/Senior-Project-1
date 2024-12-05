import React from 'react';
import './App.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import {Hello} from "./component/Hello";
import {Navigation} from "./component/Navigation/Navigation";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Register} from "./component/authentication/Register";
import {Login} from "./component/authentication/Login";
import {Logout} from "./component/authentication/Logout";
import {Book} from "./component/booking/Book";
import {AddClubForm} from "./component/clubs/AddClubForm";

function App() {
  document.title = "Tennis Court Booking";
  return <BrowserRouter>
  <Navigation>  </Navigation>
  <Routes>
    <Route path="/" element={<Hello/>}/>
    <Route path="/hello" element={<Hello/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/logout" element={<Logout/>}/>
    <Route path="/book" element={<Book/>}/>

    {/* Club application routes */}
    <Route path="/apply-club" element={<AddClubForm/>}/>
    <Route path="*" element={<h1>Not Found</h1>}/>
    
  </Routes>
</BrowserRouter>;
}

export default App;
