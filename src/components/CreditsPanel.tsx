import { useState } from 'react';
import { Coins, LogOut, History, X, Clock, MapPin, Bus, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Ride } from '@/types';
import { RIDE_COST } from '@/data/shuttleData';

interface CreditsPanelProps {
  credits: number;
  rideHistory: Ride[];
}

export default function CreditsPanel({ credits, rideHistory }: CreditsPanelProps) {
  const { signOut, role } = useAuth();
  const [showHistory, setShowHistory] = useState(false);

  const isTeacher = role === 'teacher';
  const LOW_CREDIT_THRESHOLD = 20;
  const isLowCredits = !isTeacher && credits <= LOW_CREDIT_THRESHOLD;

  return (
    <>
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
        {/* Credits display */}
        <div
          className={`backdrop-blur-xl rounded-2xl border shadow-2xl px-4 py-3 min-w-[200px] transition-all ${
            isTeacher
              ? 'bg-blue-950/90 border-blue-700/50'
              : isLowCredits
              ? 'bg-red-950/90 border-red-500/60'
              : 'bg-slate-900/90 border-slate-700/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isTeacher ? (
              <Coins className="w-4 h-4 text-blue-400" />
            ) : isLowCredits ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <Coins className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {isTeacher ? 'Faculty Pass' : 'Credits'}
            </span>
          </div>

          {isTeacher ? (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-400">Free</span>
              <span className="text-xs text-slate-500">unlimited rides</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    isLowCredits ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {credits}
                </span>
                <span className="text-xs text-slate-500">{RIDE_COST} per ride</span>
              </div>
              {/* Low credits warning */}
              {isLowCredits && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-400 font-medium fade-in">
                  <AlertTriangle className="w-3 h-3" />
                  Only {credits} left — recharge soon!
                </div>
              )}
              {/* Credit bar */}
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isLowCredits
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-amber-400 to-orange-500'
                  }`}
                  style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl px-3 py-2 text-slate-300 hover:text-white hover:border-slate-600 transition-all shadow-lg"
            title="Ride history"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={signOut}
            className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl px-3 py-2 text-slate-300 hover:text-red-400 hover:border-red-500/30 transition-all shadow-lg"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ride history drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-[2000] flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          />
          <div className="relative w-[380px] max-w-[calc(100vw-2rem)] bg-slate-900 border-l border-slate-700/50 shadow-2xl overflow-y-auto slide-up">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-red-400" />
                Ride History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {rideHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Bus className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No rides yet. Take your first trip!</p>
                </div>
              ) : (
                rideHistory.map((ride) => (
                  <div
                    key={ride.id}
                    className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 hover:border-slate-600/60 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-sm text-white">
                          <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{ride.origin}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-white mt-1">
                          <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                          <span className="truncate">{ride.destination}</span>
                        </div>
                      </div>
                      <span className="text-amber-400 font-semibold text-sm whitespace-nowrap">
                        -{ride.credits_spent}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700/30">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Bus className="w-3 h-3" />
                        {ride.shuttle_name}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {new Date(ride.departed_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(ride.departed_at).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
