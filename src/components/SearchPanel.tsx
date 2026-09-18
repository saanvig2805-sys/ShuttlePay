import { useState } from 'react';
import { MapPin, Navigation, Clock, Zap, LocateFixed, X, ArrowDown } from 'lucide-react';

interface SearchPanelProps {
  onSearch: (origin: string, destination: string, departureTime: string, leavingNow: boolean) => void;
  onUseCurrentLocation: () => void;
  origin: string;
  destination: string;
  departureTime: string;
  leavingNow: boolean;
  setOrigin: (v: string) => void;
  setDestination: (v: string) => void;
  setDepartureTime: (v: string) => void;
  setLeavingNow: (v: boolean) => void;
  hasSearched: boolean;
  onClear: () => void;
}

const stopSuggestions = [
  'Engineering Hall',
  'Science Building',
  'Library',
  'Student Union',
  'Dormitories North',
  'Dormitories South',
  'Business School',
  'Arts Center',
  'Gymnasium',
  'Medical Center',
  'Research Park',
  'Auditorium',
  'Sports Complex',
  'Parking West',
];

export default function SearchPanel({
  onSearch,
  onUseCurrentLocation,
  origin,
  destination,
  departureTime,
  leavingNow,
  setOrigin,
  setDestination,
  setDepartureTime,
  setLeavingNow,
  hasSearched,
  onClear,
}: SearchPanelProps) {
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const handleLeavingNow = () => {
    setLeavingNow(true);
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    setDepartureTime(timeStr);
  };

  const canSearch = origin.trim() && destination.trim() && (departureTime || leavingNow);

  const filteredOrigin = stopSuggestions.filter((s) =>
    s.toLowerCase().includes(origin.toLowerCase())
  );
  const filteredDest = stopSuggestions.filter((s) =>
    s.toLowerCase().includes(destination.toLowerCase())
  );

  return (
    <div className="absolute top-4 left-4 z-[1000] w-[340px] max-w-[calc(100vw-2rem)]">
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-white">Plan Your Trip</span>
          </div>
          {hasSearched && (
            <button
              onClick={onClear}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Origin with current location button inside */}
          <div className="relative">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">From</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  setShowOriginSuggestions(true);
                }}
                onFocus={() => setShowOriginSuggestions(true)}
                onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 150)}
                placeholder="Starting point"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
              {/* Current location button inside the From field */}
              <button
                onClick={onUseCurrentLocation}
                title="Use current location"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <LocateFixed className="w-4 h-4" />
              </button>
            </div>
            {showOriginSuggestions && filteredOrigin.length > 0 && (
              <div className="absolute z-[1001] mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                {filteredOrigin.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setOrigin(s);
                      setShowOriginSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap indicator */}
          <div className="flex justify-center -my-1">
            <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
          </div>

          {/* Destination */}
          <div className="relative">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">To</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
              <input
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowDestSuggestions(true);
                }}
                onFocus={() => setShowDestSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDestSuggestions(false), 150)}
                placeholder="Destination"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
              />
            </div>
            {showDestSuggestions && filteredDest.length > 0 && (
              <div className="absolute z-[1001] mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                {filteredDest.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setDestination(s);
                      setShowDestSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Departure time */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Departure Time</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => {
                    setDepartureTime(e.target.value);
                    setLeavingNow(false);
                  }}
                  disabled={leavingNow}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/30 transition-all disabled:opacity-40"
                />
              </div>
              <button
                onClick={handleLeavingNow}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  leavingNow
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-slate-800/60 border border-slate-700 text-slate-300 hover:border-red-500/50 hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4" />
                Now
              </button>
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={() => canSearch && onSearch(origin, destination, departureTime, leavingNow)}
            disabled={!canSearch}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Find Shuttles
          </button>
        </div>
      </div>
    </div>
  );
}
