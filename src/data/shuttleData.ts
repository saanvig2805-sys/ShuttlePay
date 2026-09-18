import type { ShuttleRoute, Shuttle, ShuttleStop } from '@/types';

// Campus-centric coordinates (generic university campus)
export const CAMPUS_CENTER: [number, number] = [40.4237, -86.9212];

export const shuttleRoutes: ShuttleRoute[] = [
  {
    id: 'route-a',
    name: 'North Campus Loop',
    color: '#ef4444',
    stops: [
      { name: 'Engineering Hall', lat: 40.4287, lng: -86.9250 },
      { name: 'Science Building', lat: 40.4270, lng: -86.9220 },
      { name: 'Library', lat: 40.4250, lng: -86.9200 },
      { name: 'Student Union', lat: 40.4230, lng: -86.9180 },
      { name: 'Dormitories North', lat: 40.4260, lng: -86.9150 },
    ],
  },
  {
    id: 'route-b',
    name: 'South Campus Express',
    color: '#f97316',
    stops: [
      { name: 'Business School', lat: 40.4180, lng: -86.9250 },
      { name: 'Arts Center', lat: 40.4190, lng: -86.9210 },
      { name: 'Student Union', lat: 40.4230, lng: -86.9180 },
      { name: 'Gymnasium', lat: 40.4200, lng: -86.9150 },
      { name: 'Dormitories South', lat: 40.4170, lng: -86.9170 },
    ],
  },
  {
    id: 'route-c',
    name: 'East Campus Connector',
    color: '#eab308',
    stops: [
      { name: 'Medical Center', lat: 40.4230, lng: -86.9100 },
      { name: 'Research Park', lat: 40.4245, lng: -86.9130 },
      { name: 'Library', lat: 40.4250, lng: -86.9200 },
      { name: 'Auditorium', lat: 40.4260, lng: -86.9170 },
      { name: 'Sports Complex', lat: 40.4270, lng: -86.9120 },
    ],
  },
  {
    id: 'route-d',
    name: 'West Campus Shuttle',
    color: '#ec4899',
    stops: [
      { name: 'Parking West', lat: 40.4230, lng: -86.9320 },
      { name: 'Engineering Hall', lat: 40.4287, lng: -86.9250 },
      { name: 'Library', lat: 40.4250, lng: -86.9200 },
      { name: 'Arts Center', lat: 40.4190, lng: -86.9210 },
      { name: 'Parking West', lat: 40.4230, lng: -86.9320 },
    ],
  },
];

const driverNames = [
  'Mike Johnson',
  'Sarah Chen',
  'David Rodriguez',
  'Emily Williams',
  'James Thompson',
  'Lisa Anderson',
];

const vehicleNumbers = [
  'SHU-001',
  'SHU-002',
  'SHU-003',
  'SHU-004',
  'SHU-005',
  'SHU-006',
];

function interpolatePoint(
  start: ShuttleStop,
  end: ShuttleStop,
  fraction: number
): { lat: number; lng: number } {
  return {
    lat: start.lat + (end.lat - start.lat) * fraction,
    lng: start.lng + (end.lng - start.lng) * fraction,
  };
}

export function getRoutePath(route: ShuttleRoute): [number, number][] {
  const path: [number, number][] = [];
  for (let i = 0; i < route.stops.length - 1; i++) {
    const start = route.stops[i];
    const end = route.stops[i + 1];
    const segments = 20;
    for (let j = 0; j <= segments; j++) {
      const point = interpolatePoint(start, end, j / segments);
      path.push([point.lat, point.lng]);
    }
  }
  return path;
}

export function getShuttlePosition(
  route: ShuttleRoute,
  pathPosition: number
): { lat: number; lng: number } {
  const stops = route.stops;
  const totalSegments = stops.length - 1;
  const segmentIndex = Math.floor(pathPosition) % totalSegments;
  const fraction = pathPosition - Math.floor(pathPosition);
  return interpolatePoint(stops[segmentIndex], stops[segmentIndex + 1], fraction);
}

export function generateDummyShuttles(): Shuttle[] {
  const shuttles: Shuttle[] = [];

  shuttleRoutes.forEach((route, routeIdx) => {
    const numShuttles = routeIdx < 2 ? 2 : 1;
    for (let i = 0; i < numShuttles; i++) {
      const pathPosition = (i / numShuttles) * (route.stops.length - 1);
      const pos = getShuttlePosition(route, pathPosition);
      const shuttleIdx = shuttles.length;

      shuttles.push({
        id: `shuttle-${route.id}-${i}`,
        routeId: route.id,
        routeName: route.name,
        color: route.color,
        lat: pos.lat,
        lng: pos.lng,
        heading: 0,
        speed: 25 + Math.random() * 10,
        seatsAvailable: 8 + Math.floor(Math.random() * 12),
        totalSeats: 24,
        driverName: driverNames[shuttleIdx % driverNames.length],
        vehicleNumber: vehicleNumbers[shuttleIdx % vehicleNumbers.length],
        etaMinutes: 3 + Math.floor(Math.random() * 12),
        route,
        pathPosition,
      });
    }
  });

  return shuttles;
}

export function advanceShuttle(shuttle: Shuttle): Shuttle {
  const totalSegments = shuttle.route.stops.length - 1;
  let newPos = shuttle.pathPosition + 0.015;
  if (newPos >= totalSegments) {
    newPos = newPos - totalSegments;
  }
  const pos = getShuttlePosition(shuttle.route, newPos);

  return {
    ...shuttle,
    pathPosition: newPos,
    lat: pos.lat,
    lng: pos.lng,
  };
}

export const RIDE_COST = 20;
