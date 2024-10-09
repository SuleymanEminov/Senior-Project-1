# Tennis Court Booking Web App
This application allows users to book tennis courts online, view available time slots, and manage their reservations. It's designed for both individual clients and club administrators to streamline court bookings and operations.

## Docker
run ``docker-compose build`` from the project root to build this application

run ``docker-compose up`` to launch servers

run ``docker ps`` to show all the docker containers that are running. This will show CONTAINER_ID of all running containers. 

To run commands within a docker container, run ``docker exec -it CONTAINER_ID bash -l``. This will move you inside the /app directory of docker container, that we setup within docker-compose.yml file. Now we can run any commands we wish inside the container. To exit, CTRL-D. 

## Backend

## Frontend
Frontend uses React. 

Install the following packages within the frontend docker container:
```
npm i bootstrap
npm i axios
npm i react-router-dom 
```

