// Description: This component allows users to select a time range for booking a court.
import React, { useState, useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap';

const TimeRangeSelector = ({ court, onTimeRangeSelected }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availableStartTimes, setAvailableStartTimes] = useState([]);
  const [availableEndTimes, setAvailableEndTimes] = useState([]);
  
  // Generate available times based on operating hours and existing bookings
  useEffect(() => {
    if (!court) return;
    
    const { operating_hours, booked_ranges, booking_increment } = court;
    const open = operating_hours.open.slice(0, 5); // HH:MM format
    const close = operating_hours.close.slice(0, 5);
    
    // Generate all potential time slots in increments
    const allTimes = [];
    let currentTime = open;
    while (currentTime < close) {
      allTimes.push(currentTime);
      
      // Advance by increment
      const [hours, minutes] = currentTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + booking_increment;
      const newHours = Math.floor(totalMinutes / 60);
      const newMinutes = totalMinutes % 60;
      currentTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    }
    
    // Filter out booked times
    const availableTimes = allTimes.filter(time => {
      return !booked_ranges.some(range => {
        const rangeStart = range.start.slice(0, 5);
        const rangeEnd = range.end.slice(0, 5);
        return time >= rangeStart && time < rangeEnd;
      });
    });
    
    setAvailableStartTimes(availableTimes);
    if (availableTimes.length > 0) {
      setStartTime(availableTimes[0]);
    }
  }, [court]);
  
  // Update available end times when start time changes
  useEffect(() => {
    if (!startTime || !court) return;
    
    const { operating_hours, booked_ranges, booking_increment, min_duration, max_duration } = court;
    const close = operating_hours.close.slice(0, 5);
    
    // Calculate the earliest and latest possible end times
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    
    const minEndTotalMinutes = startTotalMinutes + min_duration;
    const maxEndTotalMinutes = startTotalMinutes + max_duration;
    
    // Generate possible end times
    const endTimes = [];
    let currentMinutes = startTotalMinutes + booking_increment;
    while (currentMinutes <= maxEndTotalMinutes && currentMinutes / 60 < 24) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      if (timeString <= close) {
        // Check if this end time conflicts with any bookings
        const isAvailable = !booked_ranges.some(range => {
          const rangeStart = range.start.slice(0, 5);
          return timeString > rangeStart && startTime < rangeStart;
        });
        
        if (isAvailable) {
          endTimes.push(timeString);
        } else {
          break; // Stop at first conflict
        }
      } else {
        break; // Beyond closing time
      }
      
      currentMinutes += booking_increment;
    }
    
    setAvailableEndTimes(endTimes);
    if (endTimes.length > 0) {
      // Default to 1 hour if available, otherwise the first available end time
      const oneHourLater = `${String(startHours + 1).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;
      const defaultEnd = endTimes.includes(oneHourLater) ? oneHourLater : endTimes[0];
      setEndTime(defaultEnd);
    }
  }, [startTime, court]);
  
  // When either time changes, notify parent component
  useEffect(() => {
    if (startTime && endTime) {
      onTimeRangeSelected({
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        formatted_time: `${formatTimeDisplay(startTime)} - ${formatTimeDisplay(endTime)}`
      });
    }
  }, [startTime, endTime, onTimeRangeSelected]);
  
  // Format time for display (convert from 24h to 12h format)
  const formatTimeDisplay = (time24h) => {
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };
  
  return (
    <div className="time-range-selector p-3 border rounded mb-3">
      <h5>Select Booking Time</h5>
      <Row>
        <Col xs={6}>
          <Form.Group>
            <Form.Label>Start Time</Form.Label>
            <Form.Select 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)}
            >
              {availableStartTimes.map(time => (
                <option key={`start-${time}`} value={time}>
                  {formatTimeDisplay(time)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={6}>
          <Form.Group>
            <Form.Label>End Time</Form.Label>
            <Form.Select 
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)}
              disabled={availableEndTimes.length === 0}
            >
              {availableEndTimes.map(time => (
                <option key={`end-${time}`} value={time}>
                  {formatTimeDisplay(time)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <div className="mt-2 text-muted">
        <small>Booking duration: {calculateDuration(startTime, endTime)} minutes</small>
      </div>
    </div>
  );
};

// Helper function to calculate duration between two times
const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);
  
  return (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
};

export default TimeRangeSelector;