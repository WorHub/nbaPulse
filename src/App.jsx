import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Scores from './pages/Scores';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Standings from './pages/Standings';
import News from './pages/News';
import GameDetail from './pages/GameDetail';
import PlayerStats from './pages/PlayerStats';
import PlayerProfile from './pages/PlayerProfile';
import DailyPerformers from './pages/DailyPerformers';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Scores />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:slug" element={<TeamDetail />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/news" element={<News />} />
        <Route path="/game/:gameId" element={<GameDetail />} />
        <Route path="/players" element={<PlayerStats />} />
        <Route path="/player/:athleteId" element={<PlayerProfile />} />
        <Route path="/daily" element={<DailyPerformers />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" themes={["dark", "light", "team"]}>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App