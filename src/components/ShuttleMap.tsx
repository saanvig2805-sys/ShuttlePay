import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import type { Shuttle, ShuttleRoute } from '@/types';
import { getRoutePath } from '@/data/shuttleData';
import { CAMPUS_CENTER } from '@/data/shuttleData';

interface ShuttleMapProps {
  shuttles: Shuttle[];
  selectedShuttleId?: string | null;
  userLocation?: [number, number] | null;
  highlightRoutes?: ShuttleRoute[];
  showAllShuttles?: boolean;
  fitBoundsToRoutes?: boolean;
  pickupStop?: { lat: number; lng: number; name: string } | null;
}

// Component to fit map bounds to route paths
function FitBounds({ routes, shuttles, userLocation, pickupStop }: {
  routes?: ShuttleRoute[];
  shuttles?: Shuttle[];
  userLocation?: [number, number] | null;
  pickupStop?: { lat: number; lng: number; name: string } | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];

    if (routes && routes.length > 0) {
      routes.forEach((route) => {
        route.stops.forEach((stop) => {
          points.push([stop.lat, stop.lng]);
        });
      });
    }

    if (shuttles && shuttles.length > 0) {
      shuttles.forEach((s) => points.push([s.lat, s.lng]));
    }

    if (userLocation) {
      points.push(userLocation);
    }

    if (pickupStop) {
      points.push([pickupStop.lat, pickupStop.lng]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [routes, shuttles, userLocation, pickupStop, map]);

  return null;
}

const shuttleIcon = (isSelected: boolean) =>
  L.divIcon({
    className: '',
    html: `<div class="shuttle-marker${isSelected ? ' selected' : ''}"></div>`,
    iconSize: isSelected ? [24, 24] : [18, 18],
    iconAnchor: isSelected ? [12, 12] : [9, 9],
  });

const stopIcon = () =>
  L.divIcon({
    className: '',
    html: '<div class="stop-marker"></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

const userIcon = () =>
  L.divIcon({
    className: '',
    html: '<div class="user-location-marker"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

export default function ShuttleMap({
  shuttles,
  selectedShuttleId,
  userLocation,
  highlightRoutes,
  showAllShuttles = true,
  fitBoundsToRoutes = false,
  pickupStop,
}: ShuttleMapProps) {
  const visibleShuttles = showAllShuttles
    ? shuttles
    : shuttles.filter((s) => s.id === selectedShuttleId);

  const routesToShow = highlightRoutes ?? [];

  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={15}
      zoomControl={true}
      className="w-full h-full"
      style={{ background: '#1a1d29' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />

      {fitBoundsToRoutes && (
        <FitBounds
          routes={routesToShow}
          shuttles={visibleShuttles}
          userLocation={userLocation}
          pickupStop={pickupStop}
        />
      )}

      {/* Route paths */}
      {routesToShow.map((route) => (
        <Polyline
          key={route.id}
          positions={getRoutePath(route)}
          pathOptions={{
            color: route.color,
            weight: 4,
            opacity: 0.7,
            dashArray: '8 6',
          }}
        />
      ))}

      {/* Stop markers on highlighted routes */}
      {routesToShow.map((route) =>
        route.stops.map((stop, idx) => (
          <Marker
            key={`${route.id}-stop-${idx}`}
            position={[stop.lat, stop.lng]}
            icon={stopIcon()}
          >
            <Tooltip direction="top" offset={[0, -8]} className="leaflet-tooltip-custom">
              {stop.name}
            </Tooltip>
          </Marker>
        ))
      )}

      {/* Pickup stop marker */}
      {pickupStop && (
        <CircleMarker
          center={[pickupStop.lat, pickupStop.lng]}
          radius={12}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.3,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            Pickup: {pickupStop.name}
          </Tooltip>
        </CircleMarker>
      )}

      {/* User location */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon()}>
          <Tooltip direction="top" offset={[0, -8]}>
            You are here
          </Tooltip>
        </Marker>
      )}

      {/* Shuttle markers */}
      {visibleShuttles.map((shuttle) => (
        <Marker
          key={shuttle.id}
          position={[shuttle.lat, shuttle.lng]}
          icon={shuttleIcon(shuttle.id === selectedShuttleId)}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            {shuttle.routeName}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
