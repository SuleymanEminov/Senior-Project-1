import React, { useState, useEffect } from "react";
import api from "../interceptors/Interceptor";

export const Hello = () => {
  const [clubs, setClubs] = useState([]);
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("access_token"); // Ensure token exists

  useEffect(() => {
    // Fetch the current user
    api.get("http://localhost:8000/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      console.log("User data:", response.data);
      setUser(response.data);
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
    });

    // Fetch clubs
    api.get("http://localhost:8000/api/clubs", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      console.log("Clubs data:", response.data);
      setClubs(response.data);
    })
    .catch((error) => {
      console.error("Error fetching clubs:", error);
    });

  }, [token]); // Runs when `token` changes

  return (
    <div>
      <h1>Hello, {user?.username || "Guest"}</h1>
      <div className="form-signin mt-5 text-center">
        <h1 className="h3 mb-3 fw-normal">Tennis Court Booking</h1>
        {clubs?.results?.length > 0 ? (
          clubs?.results?.map((club) => (
            <div key={club.id}>
              <h2>{club.name}</h2>
              <p>
                {club.address}, {club.city}, {club.state}
              </p>
              <p>Phone: {club.phone_number}</p>
              <p>
                Website: <a href={club.website}>{club.website}</a>
              </p>
            </div>
          ))
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};