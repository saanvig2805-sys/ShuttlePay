import { Bus, Clock, Users, ChevronRight } from 'lucide-react';
import type { Shuttle } from '@/types';
import { RIDE_COST } from '@/data/shuttleData';

interface ShuttleListBarProps {
  shuttles: Shuttle[];
  onSelectShuttle: (shuttle: Shuttle) => void;
}

export default function ShuttleListBar({ shuttles, onSelectShuttle }: ShuttleListBarProps) {
  if (shuttles.length === 0) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-[1000] slide-up">
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-4 py-6 text-center">
          <Bus className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No shuttles available for this route right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] slide-up">
      <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Available Shuttles</span>
            <span className="bg-red-500/20 text-red-400 text-xs font-medium px-2 py-0.5 rounded-full">
              {shuttles.length} nearby
            </span>
          </div>
          <span className="text-xs text-slate-500">{RIDE_COST} credits/ride</span>
        </div>

        {/* Shuttle cards - horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-thin">
          {shuttles.map((shuttle) => (
            <button
              key={shuttle.id}
              onClick={() => onSelectShuttle(shuttle)}
              className="flex-shrink-0 w-[280px] text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl p-3.5 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: shuttle.color }}
                  />
                  <span className="text-sm font-semibold text-white truncate">
                    {shuttle.routeName}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {shuttle.etaMinutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {shuttle.seatsAvailable}/{shuttle.totalSeats} seats
                </span>
                <span className="flex items-center gap-1">
                  <Bus className="w-3 h-3" />
                  {shuttle.vehicleNumber}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
