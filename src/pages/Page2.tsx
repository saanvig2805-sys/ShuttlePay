import { useState, useEffect } from 'react';
import ShuttleMap from '@/components/ShuttleMap';
import { advanceShuttle } from '@/data/shuttleData';
import type { Shuttle } from '@/types';
import {
  ArrowLeft,
  Bus,
  Users,
  Clock,
  Route,
  Navigation,
  QrCode,
  CheckCircle2,
  Loader2,
  Coins,
  User,
  Hash,
  AlertCircle,
  PartyPopper,
} from 'lucide-react';
import { deductCreditsForRide, recordRide, getStudentCredits } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RIDE_COST } from '@/data/shuttleData';

interface Page2Props {
  shuttle: Shuttle;
  origin: string;
  destination: string;
  onBack: () => void;
  onRideCompleted: () => void;
}

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

export default function Page2({ shuttle, origin, destination, onBack, onRideCompleted }: Page2Props) {
  const { role } = useAuth();
  const [currentShuttle, setCurrentShuttle] = useState(shuttle);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const isTeacher = role === 'teacher';

  // Shuttle movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShuttle((prev) => advanceShuttle(prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Load current credits
  useEffect(() => {
    getStudentCredits().then(setCredits);
  }, []);

  const handleScanQR = async () => {
    setScanState('scanning');
    setScanError(null);

    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Deduct credits (teachers get free rides — handled server-side)
    const deductResult = await deductCreditsForRide(RIDE_COST);

    if (!deductResult.success) {
      setScanState('error');
      setScanError(deductResult.error ?? 'Failed to process payment');
      return;
    }

    // Record the ride
    const rideResult = await recordRide({
      shuttle_id: currentShuttle.id,
      shuttle_name: currentShuttle.routeName,
      origin,
      destination,
      credits_spent: isTeacher ? 0 : RIDE_COST,
    });

    if (!rideResult.success) {
      setScanState('error');
      setScanError(rideResult.error ?? 'Failed to record ride');
      return;
    }

    setCredits(deductResult.newBalance);
    setScanState('success');

    setTimeout(() => {
      onRideCompleted();
    }, 3500);
  };

  const handleRetry = () => {
    setScanState('idle');
    setScanError(null);
  };

  const pickupStop = currentShuttle.route.stops[0];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 flex">
      {/* Map - main area */}
      <div className="flex-1 relative">
        <ShuttleMap
          shuttles={[currentShuttle]}
          selectedShuttleId={currentShuttle.id}
          highlightRoutes={[currentShuttle.route]}
          showAllShuttles={false}
          fitBoundsToRoutes={true}
          pickupStop={pickupStop}
        />

        {/* Back button - top left */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 hover:text-white hover:border-slate-600 transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Shuttle name overlay - top center */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl px-5 py-2.5 shadow-lg">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentShuttle.color }}
            />
            <span className="text-sm font-semibold text-white">{currentShuttle.routeName}</span>
          </div>
        </div>

        {/* Full-screen success overlay */}
        {scanState === 'success' && (
          <div className="absolute inset-0 z-[3000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center fade-in">
            <div className="text-center">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-28 h-28 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <PartyPopper className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Ride Confirmed!</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                {isTeacher
                  ? 'Faculty pass activated. Enjoy your free ride!'
                  : `${RIDE_COST} credits deducted. Enjoy your trip!`}
              </p>
              {!isTeacher && credits !== null && (
                <div className="inline-flex items-center gap-2 bg-slate-800/60 rounded-full px-4 py-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-slate-300">Remaining balance: </span>
                  <span className={`text-sm font-bold ${credits <= 20 ? 'text-red-400' : 'text-amber-400'}`}>
                    {credits} credits
                  </span>
                </div>
              )}
              {isTeacher && (
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2">
                  <Coins className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300">Faculty Pass — No charge</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="w-[380px] max-w-[calc(100vw-3rem)] bg-slate-900 border-l border-slate-700/50 overflow-y-auto flex flex-col">
        {/* Shuttle info header */}
        <div className="px-5 py-5 border-b border-slate-700/50 bg-gradient-to-b from-slate-800/40 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{currentShuttle.routeName}</h2>
              <p className="text-xs text-slate-400">Shuttle #{currentShuttle.vehicleNumber}</p>
            </div>
          </div>

          {/* Live status badge */}
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 pulse-ring" />
            </div>
            <span className="text-xs font-medium text-emerald-400">Live tracking active</span>
          </div>
        </div>

        {/* Trip details */}
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Trip Details</h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] text-slate-500">Pickup</p>
                <p className="text-sm text-white">{origin || 'Current Location'}</p>
              </div>
            </div>
            <div className="ml-[3px] w-px h-4 bg-slate-700" />
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] text-slate-500">Dropoff</p>
                <p className="text-sm text-white">{destination || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shuttle stats */}
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Shuttle Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">ETA</span>
              </div>
              <p className="text-sm font-semibold text-white">{currentShuttle.etaMinutes} min</p>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">Seats</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {currentShuttle.seatsAvailable}/{currentShuttle.totalSeats}
              </p>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">Driver</span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{currentShuttle.driverName}</p>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">Vehicle</span>
              </div>
              <p className="text-sm font-semibold text-white">{currentShuttle.vehicleNumber}</p>
            </div>
          </div>
        </div>

        {/* Route stops */}
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5" />
            Route Stops
          </h3>
          <div className="space-y-1">
            {currentShuttle.route.stops.map((stop, idx) => (
              <div key={idx} className="flex items-center gap-2.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                <span className="text-sm text-slate-300">{stop.name}</span>
                {idx === 0 && (
                  <span className="text-[10px] text-emerald-400 font-medium ml-auto">First stop</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Credits info */}
        <div className="px-5 py-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className={`w-4 h-4 ${isTeacher ? 'text-blue-400' : 'text-amber-400'}`} />
              <span className="text-sm text-slate-300">{isTeacher ? 'Faculty Pass' : 'Ride Cost'}</span>
            </div>
            <div className="text-right">
              {isTeacher ? (
                <>
                  <span className="text-sm font-semibold text-blue-400">Free</span>
                  <p className="text-[11px] text-slate-500">No charge</p>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold text-amber-400">{RIDE_COST} credits</span>
                  {credits !== null && (
                    <p className={`text-[11px] ${credits <= 20 ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                      Balance: {credits} credits
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* QR Scan / Booking section - bottom */}
        <div className="mt-auto px-5 py-5 sticky bottom-0 bg-slate-900 border-t border-slate-700/50">
          {scanState === 'idle' && (
            <button
              onClick={handleScanQR}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-500/30"
            >
              <QrCode className="w-5 h-5" />
              {isTeacher ? 'Scan QR to Board' : 'Scan QR to Confirm Ride'}
            </button>
          )}

          {scanState === 'scanning' && (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 text-red-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-slate-300">Scanning & confirming booking...</p>
              <p className="text-xs text-slate-500 mt-1">
                {isTeacher ? 'Activating faculty pass...' : `Deducting ${RIDE_COST} credits`}
              </p>
            </div>
          )}

          {scanState === 'success' && (
            <div className="text-center py-4 fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-white">All set!</p>
              <p className="text-xs text-slate-400 mt-1">Redirecting back to map...</p>
            </div>
          )}

          {scanState === 'error' && (
            <div className="text-center py-4 fade-in">
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-sm font-semibold text-white">Booking Failed</p>
              <p className="text-xs text-slate-400 mt-1 mb-3">{scanError}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          <p className="text-center text-[11px] text-slate-600 mt-3 flex items-center justify-center gap-1">
            <Navigation className="w-3 h-3" />
            Scan the QR code on the shuttle when it arrives
          </p>
        </div>
      </div>
    </div>
  );
}
