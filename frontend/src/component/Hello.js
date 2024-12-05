import React from "react";
import { useState } from "react";
import api from "../interceptors/Interceptor";

export const Hello = () => {
  const [username, setUsername] = useState("");
  const token = localStorage.getItem("access_token"); // Assuming token is stored in localStorage

  api.get("http://localhost:8000/api/user/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      console.log("User data:", response.data.username);
      setUsername(response.data.username);
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
    });

  return (
    <div className="form-signin mt-5 text-center">
      <h1 className="h3 mb-3 fw-normal">Tennis Court Booking</h1>

      <h3>hello {username}</h3>
    </div>
  );
};
