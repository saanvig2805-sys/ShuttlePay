export interface ShuttleStop {
  name: string;
  lat: number;
  lng: number;
}

export interface ShuttleRoute {
  id: string;
  name: string;
  color: string;
  stops: ShuttleStop[];
}

export interface Shuttle {
  id: string;
  routeId: string;
  routeName: string;
  color: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  seatsAvailable: number;
  totalSeats: number;
  driverName: string;
  vehicleNumber: string;
  etaMinutes: number;
  route: ShuttleRoute;
  pathPosition: number;
}

export type UserRole = 'student' | 'teacher';

export interface Student {
  id: string;
  credits: number;
  role: UserRole;
}

export interface Ride {
  id: string;
  student_id: string;
  shuttle_id: string;
  shuttle_name: string;
  origin: string;
  destination: string;
  departed_at: string;
  credits_spent: number;
}
