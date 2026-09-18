import { useEffect, useState } from 'react';
import { Brain, Loader2, CheckCircle2, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { mlEngine, type MLTrainingProgress } from '@/lib/ml';

interface MLTrainingOverlayProps {
  onComplete: () => void;
}

export default function MLTrainingOverlay({ onComplete }: MLTrainingOverlayProps) {
  const [progress, setProgress] = useState<MLTrainingProgress>({
    stage: 'idle',
    progress: 0,
    loss: 0,
    epoch: 0,
    totalEpochs: 200,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await mlEngine.train((p) => {
        if (!cancelled) setProgress(p);
      });

      if (!cancelled) {
        setTimeout(onComplete, 600);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  const stageLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    idle: { label: 'Initializing...', icon: <Brain className="w-4 h-4" /> },
    generating: { label: 'Generating synthetic training data (500 ride records)', icon: <BarChart3 className="w-4 h-4" /> },
    training_eta: { label: 'Training ETA Predictor — Linear Regression', icon: <TrendingDown className="w-4 h-4" /> },
    training_demand: { label: 'Training Demand Predictor — Hourly patterns', icon: <Activity className="w-4 h-4" /> },
    ready: { label: 'Models trained and ready!', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  };

  const current = stageLabels[progress.stage];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brain icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mb-4 shadow-lg shadow-red-500/30 relative">
            <Brain className="w-11 h-11 text-white" />
            {progress.stage !== 'ready' && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-red-500 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
              </div>
            )}
            {progress.stage === 'ready' && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Shuttle ML Engine</h1>
          <p className="text-slate-400 mt-1 text-sm">Training predictive models for your campus</p>
        </div>

        {/* Training card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-2xl">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Training Progress</span>
              <span className="text-xs font-bold text-white tabular-nums">{progress.progress}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>

          {/* Current stage */}
          <div className="flex items-center gap-2.5 mb-4 fade-in" key={progress.stage}>
            <div className="text-red-400">{current?.icon}</div>
            <span className="text-sm text-slate-300">{current?.label}</span>
          </div>

          {/* Training metrics */}
          {progress.stage === 'training_eta' && (
            <div className="grid grid-cols-2 gap-3 mb-4 fade-in">
              <div className="bg-slate-800/40 rounded-lg p-3">
                <div className="text-[11px] text-slate-500 mb-0.5">Epoch</div>
                <div className="text-sm font-semibold text-white tabular-nums">
                  {progress.epoch} / {progress.totalEpochs}
                </div>
              </div>
              <div className="bg-slate-800/40 rounded-lg p-3">
                <div className="text-[11px] text-slate-500 mb-0.5">Loss (MSE)</div>
                <div className="text-sm font-semibold text-emerald-400 tabular-nums">
                  {progress.loss.toFixed(4)}
                </div>
              </div>
            </div>
          )}

          {/* Model checklist */}
          <div className="space-y-2">
            <ModelItem
              name="ETA Predictor"
              desc="Linear regression — 5 features"
              state={
                progress.stage === 'idle' || progress.stage === 'generating' ? 'pending'
                  : progress.stage === 'training_eta' ? 'training'
                  : 'done'
              }
            />
            <ModelItem
              name="Demand Predictor"
              desc="Hourly ridership patterns per stop"
              state={
                progress.stage === 'training_demand' ? 'training'
                  : progress.stage === 'ready' ? 'done'
                  : 'pending'
              }
            />
            <ModelItem
              name="Shuttle Recommender"
              desc="Weighted scoring — ETA + demand + seats"
              state={progress.stage === 'ready' ? 'done' : 'pending'}
            />
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Models are trained from 500+ synthetic ride records using batch gradient descent
        </p>
      </div>
    </div>
  );
}

function ModelItem({ name, desc, state }: {
  name: string;
  desc: string;
  state: 'pending' | 'training' | 'done';
}) {
  return (
    <div className="flex items-center gap-3 bg-slate-800/30 rounded-lg px-3 py-2.5">
      <div className="flex-shrink-0">
        {state === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        {state === 'training' && <Loader2 className="w-4 h-4 text-red-400 animate-spin" />}
        {state === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${state === 'pending' ? 'text-slate-500' : 'text-white'}`}>
          {name}
        </div>
        <div className="text-[11px] text-slate-500">{desc}</div>
      </div>
      {state === 'training' && (
        <span className="text-[10px] text-red-400 font-medium animate-pulse">TRAINING</span>
      )}
      {state === 'done' && (
        <span className="text-[10px] text-emerald-400 font-medium">READY</span>
      )}
    </div>
  );
}
