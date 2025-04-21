import type React from "react"

import { useState, useEffect } from "react"
import type { Socket } from "socket.io-client"
import "../styles/RideBookingInterface.css"

interface RideBookingInterfaceProps {
  socket: Socket | null
  isConnected: boolean
  showToast: (title: string, message: string, type: string) => void
}

type RideStatus = "idle" | "searching" | "driver_assigned" | "in_progress" | "completed"

interface RideDetails {
  id?: string
  pickupLocation: string
  dropoffLocation: string
  estimatedTime?: number
  driverName?: string
  driverRating?: number
  vehicleInfo?: string
  status: RideStatus
}

export default function RideBookingInterface({ socket, isConnected, showToast }: RideBookingInterfaceProps) {
  const [ride, setRide] = useState<RideDetails>({
    pickupLocation: "",
    dropoffLocation: "",
    status: "idle",
  })

  useEffect(() => {
    if (!socket) return

    // Listen for ride status updates
    socket.on("ride_status_update", (data: any) => {
      console.log("Ride status update:", data)
      setRide((prev) => ({ ...prev, ...data }))
      showToast("Ride Update", `Status: ${data.status}`, "info")
    })

    // Listen for driver assignment
    socket.on("driver_assigned", (data: any) => {
      console.log("Driver assigned:", data)
      setRide((prev) => ({
        ...prev,
        driverName: data.driverName,
        driverRating: data.driverRating,
        vehicleInfo: data.vehicleInfo,
        estimatedTime: data.estimatedTime,
        status: "driver_assigned",
      }))

      showToast("Driver Assigned", `${data.driverName} is on the way!`, "success")
    })

    // Cleanup
    return () => {
      socket.off("ride_status_update")
      socket.off("driver_assigned")
    }
  }, [socket, showToast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRide((prev) => ({ ...prev, [name]: value }))
  }

  const handleBookRide = () => {
    if (!socket || !isConnected) {
      showToast("Connection Error", "Not connected to the server", "error")
      return
    }

    if (!ride.pickupLocation || !ride.dropoffLocation) {
      showToast("Missing Information", "Please enter pickup and dropoff locations", "error")
      return
    }

    // Emit booking request
    socket.emit("book_ride", {
      pickupLocation: ride.pickupLocation,
      dropoffLocation: ride.dropoffLocation,
      timestamp: new Date().toISOString(),
    })

    setRide((prev) => ({ ...prev, status: "searching" }))
    showToast("Booking Ride", "Searching for drivers...", "info")

    // For testing - simulate driver assignment after 3 seconds
    if (import.meta.env.DEV) {
      setTimeout(() => {
        const mockDriverData = {
          driverName: "John Driver",
          driverRating: 4.8,
          vehicleInfo: "Tesla Model Y • ABC123",
          estimatedTime: 5,
        }

        socket.emit("driver_assigned", mockDriverData)
      }, 3000)
    }
  }

  const handleCancelRide = () => {
    if (!socket || !isConnected) return

    socket.emit("cancel_ride", { rideId: ride.id })
    setRide({
      pickupLocation: "",
      dropoffLocation: "",
      status: "idle",
    })

    showToast("Ride Cancelled", "Your ride has been cancelled", "info")
  }

  // Render different UI based on ride status
  const renderRideStatus = () => {
    switch (ride.status) {
      case "searching":
        return (
          <div className="searching-status">
            <div className="pulse-animation">
              <div className="car-icon">🚗</div>
              <h3>Finding your driver</h3>
              <p>This won't take long...</p>
            </div>
            <button className="secondary-button" onClick={handleCancelRide}>
              Cancel Ride
            </button>
          </div>
        )

      case "driver_assigned":
        return (
          <div className="driver-assigned">
            <div className="driver-info">
              <div className="driver-avatar">🚗</div>
              <div>
                <h3>{ride.driverName}</h3>
                <div className="driver-details">
                  <span>★ {ride.driverRating}</span>
                  <span className="separator">•</span>
                  <span>{ride.vehicleInfo}</span>
                </div>
              </div>
            </div>
            <div className="eta-info">
              <span>🕒 Arriving in {ride.estimatedTime} minutes</span>
            </div>

            <div className="location-details">
              <div className="location-item">
                <span className="location-icon">📍</span>
                <div>
                  <p className="location-label">Pickup</p>
                  <p className="location-address">{ride.pickupLocation}</p>
                </div>
              </div>
              <div className="location-item">
                <span className="location-icon">🏁</span>
                <div>
                  <p className="location-label">Dropoff</p>
                  <p className="location-address">{ride.dropoffLocation}</p>
                </div>
              </div>
            </div>

            <button className="secondary-button" onClick={handleCancelRide}>
              Cancel Ride
            </button>
          </div>
        )

      default:
        return (
          <div className="booking-form">
            <div className="form-group">
              <label htmlFor="pickupLocation">Pickup Location</label>
              <input
                id="pickupLocation"
                name="pickupLocation"
                placeholder="Enter pickup address"
                value={ride.pickupLocation}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="dropoffLocation">Dropoff Location</label>
              <input
                id="dropoffLocation"
                name="dropoffLocation"
                placeholder="Enter destination address"
                value={ride.dropoffLocation}
                onChange={handleInputChange}
              />
            </div>
            <button
              className="primary-button"
              onClick={handleBookRide}
              disabled={!isConnected || !ride.pickupLocation || !ride.dropoffLocation}
            >
              Book Ride
            </button>
          </div>
        )
    }
  }

  return (
    <div className="ride-booking-card">
      <div className="card-header">
        <h2>Book a Ride</h2>
        <p>{isConnected ? "Enter your pickup and dropoff locations to book a ride" : "Connecting to server..."}</p>
      </div>
      <div className="card-content">{renderRideStatus()}</div>
      {!isConnected && (
        <div className="card-footer">
          <div className="connection-waiting">Waiting for connection to server...</div>
        </div>
      )}
    </div>
  )
}
