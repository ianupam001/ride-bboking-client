export interface User {
  user_id: string
  name?: string
  email?: string
}

export interface Session {
  id: string
  expires: Date
}

export interface RideBookingRequest {
  pickupLocation: string
  dropoffLocation: string
  timestamp: string
}

export interface DriverInfo {
  driverName: string
  driverRating: number
  vehicleInfo: string
  estimatedTime: number
}

export interface RideStatusUpdate {
  rideId: string
  status: "searching" | "driver_assigned" | "in_progress" | "completed" | "cancelled"
  updatedAt: string
  details?: any
}
