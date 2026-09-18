import { useState, useEffect, useCallback, useMemo } from 'react';
import ShuttleMap from '@/components/ShuttleMap';
import SearchPanel from '@/components/SearchPanel';
import CreditsPanel from '@/components/CreditsPanel';
import ShuttleListBar from '@/components/ShuttleListBar';
import {
  generateDummyShuttles,
  advanceShuttle,
  shuttleRoutes,
  CAMPUS_CENTER,
} from '@/data/shuttleData';
import type { Shuttle, ShuttleRoute, Ride } from '@/types';
import { getStudentCredits, getRideHistory } from '@/lib/api';
import { mlEngine, findStopByName, type MLPrediction } from '@/lib/ml';

interface Page1Props {
  onSelectShuttle: (shuttle: Shuttle, origin: string, destination: string) => void;
}

export default function Page1({ onSelectShuttle }: Page1Props) {
  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [leavingNow, setLeavingNow] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [availableShuttles, setAvailableShuttles] = useState<Shuttle[]>([]);
  const [highlightRoutes, setHighlightRoutes] = useState<ShuttleRoute[]>([]);
  const [credits, setCredits] = useState(0);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);

  // Initialize dummy shuttles
  useEffect(() => {
    setShuttles(generateDummyShuttles());
  }, []);

  // Animate shuttle positions
  useEffect(() => {
    if (shuttles.length === 0) return;
    const interval = setInterval(() => {
      setShuttles((prev) => prev.map(advanceShuttle));
    }, 2000);
    return () => clearInterval(interval);
  }, [shuttles.length]);

  // Load credits and ride history
  const loadUserData = useCallback(async () => {
    const c = await getStudentCredits();
    setCredits(c);
    const h = await getRideHistory();
    setRideHistory(h);
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setOrigin('Current Location');
        },
        () => {
          setUserLocation(CAMPUS_CENTER);
          setOrigin('Current Location');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setUserLocation(CAMPUS_CENTER);
      setOrigin('Current Location');
    }
  };

  const handleSearch = (
    _origin: string,
    _destination: string,
    _time: string,
    _leavingNow: boolean
  ) => {
    const matchingRoutes = shuttleRoutes.filter(
      (route) =>
        route.stops.some(
          (stop) =>
            stop.name.toLowerCase().includes(origin.toLowerCase()) ||
            stop.name.toLowerCase().includes(destination.toLowerCase())
        )
    );

    const routes = matchingRoutes.length > 0 ? matchingRoutes : shuttleRoutes;
    setHighlightRoutes(routes);

    const matching = shuttles.filter((s) =>
      routes.some((r) => r.id === s.routeId)
    );
    setAvailableShuttles(matching);
    setHasSearched(true);
  };

  const handleClear = () => {
    setHasSearched(false);
    setAvailableShuttles([]);
    setHighlightRoutes([]);
  };

  // Compute ML predictions for available shuttles
  const { predictions, recommendedShuttleId } = useMemo(() => {
    const preds = new Map<string, MLPrediction>();
    if (!hasSearched || !mlEngine.isTrained() || availableShuttles.length === 0) {
      return { predictions: preds, recommendedShuttleId: null };
    }

    // Find origin and destination stops on the highlighted routes
    let originStop = null;
    let destStop = null;
    for (const route of highlightRoutes) {
      if (!originStop) originStop = findStopByName(route, origin);
      if (!destStop) destStop = findStopByName(route, destination);
    }

    let bestScore = -1;
    let bestId: string | null = null;

    for (const shuttle of availableShuttles) {
      const pred = mlEngine.predictForShuttle(shuttle, userLocation, originStop, destStop);
      preds.set(shuttle.id, pred);
      if (pred.recommendation && pred.recommendation.score > bestScore) {
        bestScore = pred.recommendation.score;
        bestId = shuttle.id;
      }
    }

    return { predictions: preds, recommendedShuttleId: bestId };
  }, [hasSearched, availableShuttles, highlightRoutes, origin, destination, userLocation]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      {/* Map fills the screen */}
      <ShuttleMap
        shuttles={shuttles}
        userLocation={userLocation}
        highlightRoutes={hasSearched ? highlightRoutes : []}
        showAllShuttles={true}
        fitBoundsToRoutes={hasSearched}
      />

      {/* Search panel - top left */}
      <SearchPanel
        onSearch={handleSearch}
        onUseCurrentLocation={handleUseCurrentLocation}
        origin={origin}
        destination={destination}
        departureTime={departureTime}
        leavingNow={leavingNow}
        setOrigin={setOrigin}
        setDestination={setDestination}
        setDepartureTime={setDepartureTime}
        setLeavingNow={setLeavingNow}
        hasSearched={hasSearched}
        onClear={handleClear}
      />

      {/* Credits panel - top right */}
      <CreditsPanel credits={credits} rideHistory={rideHistory} />

      {/* Bottom shuttle bar - only after search */}
      {hasSearched && (
        <ShuttleListBar
          shuttles={availableShuttles}
          onSelectShuttle={(s) => onSelectShuttle(s, origin, destination)}
          predictions={predictions}
          recommendedShuttleId={recommendedShuttleId}
        />
      )}
    </div>
  );
}
