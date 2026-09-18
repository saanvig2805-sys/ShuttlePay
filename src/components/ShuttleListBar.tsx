import { Bus, Clock, Users, ChevronRight, Brain, TrendingUp, Zap } from 'lucide-react';
import type { Shuttle } from '@/types';
import { RIDE_COST } from '@/data/shuttleData';
import type { MLPrediction } from '@/lib/ml';

interface ShuttleListBarProps {
  shuttles: Shuttle[];
  onSelectShuttle: (shuttle: Shuttle) => void;
  predictions: Map<string, MLPrediction>;
  recommendedShuttleId: string | null;
}

export default function ShuttleListBar({
  shuttles,
  onSelectShuttle,
  predictions,
  recommendedShuttleId,
}: ShuttleListBarProps) {
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

  // Sort shuttles by recommendation score (best first)
  const sorted = [...shuttles].sort((a, b) => {
    const predA = predictions.get(a.id);
    const predB = predictions.get(b.id);
    const scoreA = predA?.recommendation?.score ?? 0;
    const scoreB = predB?.recommendation?.score ?? 0;
    return scoreB - scoreA;
  });

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] slide-up">
      <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-white">AI-Recommended Shuttles</span>
            <span className="bg-red-500/20 text-red-400 text-xs font-medium px-2 py-0.5 rounded-full">
              {shuttles.length} nearby
            </span>
          </div>
          <span className="text-xs text-slate-500">{RIDE_COST} credits/ride</span>
        </div>

        {/* Shuttle cards - horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-thin">
          {sorted.map((shuttle, idx) => {
            const pred = predictions.get(shuttle.id);
            const isRecommended = shuttle.id === recommendedShuttleId;
            const isTop = idx === 0 && isRecommended;

            return (
              <button
                key={shuttle.id}
                onClick={() => onSelectShuttle(shuttle)}
                className={`flex-shrink-0 w-[290px] text-left rounded-xl p-3.5 transition-all group relative ${
                  isTop
                    ? 'bg-gradient-to-br from-red-500/20 to-orange-500/10 border-2 border-red-500/50 shadow-lg shadow-red-500/10'
                    : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600'
                }`}
              >
                {/* Recommended badge */}
                {isTop && (
                  <div className="absolute -top-2.5 left-3 flex items-center gap-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    <Zap className="w-2.5 h-2.5" />
                    AI PICK
                  </div>
                )}

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

                <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {shuttle.seatsAvailable}/{shuttle.totalSeats} seats
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus className="w-3 h-3" />
                    {shuttle.vehicleNumber}
                  </span>
                </div>

                {/* ML Prediction section */}
                {pred && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-red-400" />
                      <span className="text-xs">
                        <span className="text-white font-semibold">{pred.etaMinutes}</span>
                        <span className="text-slate-500"> min</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-amber-400" />
                      <span className="text-xs">
                        <span className="text-white font-semibold">{pred.demandAtPickup}</span>
                        <span className="text-slate-500"> waiting</span>
                      </span>
                    </div>
                    {pred.recommendation && (
                      <div className="ml-auto flex items-center gap-1">
                        <Brain className="w-3 h-3 text-red-400" />
                        <span className="text-xs font-bold text-red-400 tabular-nums">
                          {pred.recommendation.score}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Confidence bar */}
                {pred && pred.recommendation && (
                  <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                      style={{ width: `${pred.confidence * 100}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
