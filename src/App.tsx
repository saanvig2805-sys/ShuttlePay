import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthScreen from '@/components/AuthScreen';
import Page1 from '@/pages/Page1';
import Page2 from '@/pages/Page2';
import MLTrainingOverlay from '@/components/MLTrainingOverlay';
import type { Shuttle } from '@/types';
import { Loader2, Bus } from 'lucide-react';
import { mlEngine } from '@/lib/ml';

type AppState = 'search' | 'tracking';

function AppContent() {
  const { user, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>('search');
  const [selectedShuttle, setSelectedShuttle] = useState<Shuttle | null>(null);
  const [tripInfo, setTripInfo] = useState({ origin: '', destination: '' });
  const [mlReady, setMlReady] = useState(false);

  // Start ML training as soon as the app loads (before auth)
  useEffect(() => {
    if (mlEngine.isTrained()) {
      setMlReady(true);
      return;
    }

    let cancelled = false;
    const run = async () => {
      await mlEngine.train();
      if (!cancelled) setMlReady(true);
    };
    run();

    return () => {
      cancelled = true;
    };
  }, []);

  // Show ML training overlay while training is in progress (and auth is still loading)
  if (loading && !mlReady) {
    return <MLTrainingOverlay onComplete={() => {}} />;
  }

  // If auth is still loading but ML is ready, show a brief loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mb-4 shadow-lg shadow-red-500/30">
            <Bus className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading Shuttle...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const handleSelectShuttle = (shuttle: Shuttle, origin: string, destination: string) => {
    setSelectedShuttle(shuttle);
    setTripInfo({ origin, destination });
    setAppState('tracking');
  };

  const handleBack = () => {
    setAppState('search');
    setSelectedShuttle(null);
  };

  const handleRideCompleted = () => {
    setAppState('search');
    setSelectedShuttle(null);
  };

  if (appState === 'tracking' && selectedShuttle) {
    return (
      <Page2
        shuttle={selectedShuttle}
        origin={tripInfo.origin}
        destination={tripInfo.destination}
        onBack={handleBack}
        onRideCompleted={handleRideCompleted}
      />
    );
  }

  return <Page1 onSelectShuttle={handleSelectShuttle} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
