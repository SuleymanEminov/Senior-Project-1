import React from 'react';
import {useEffect, useState} from 'react';
import axios from 'axios';

export const Home = () => {
    const [message, setMessage] = useState("");
    

    return <div className="form-signin mt-5 text-center">
        <h3>{message} </h3>
    </div>;


}

