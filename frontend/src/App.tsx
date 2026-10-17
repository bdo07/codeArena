import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import { RoadmapsPage } from './pages/RoadmapsPage';
import { RoadmapDetailPage } from './pages/RoadmapDetailPage';
import { ContestsPage } from './pages/ContestsPage';
import { ContestDetailPage } from './pages/ContestDetailPage';
import { ContestLeaderboardPage } from './pages/ContestLeaderboardPage';
import { QuestPage } from './pages/QuestPage';
import { GitPlaygroundPage } from './pages/GitPlaygroundPage';
import { InterviewPage } from './pages/InterviewPage';
import { LearningReportsPage } from './pages/LearningReportsPage';
import { PublicShareCardPage } from './pages/PublicShareCardPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="challenges" element={<ChallengesPage />} />
                <Route path="challenges/:slug" element={<WorkspacePage />} />
                <Route path="roadmaps" element={<RoadmapsPage />} />
                <Route path="roadmaps/:slug" element={<RoadmapDetailPage />} />
                <Route path="quest" element={<QuestPage />} />
                <Route path="quest/:slug" element={<QuestPage />} />
                <Route path="git-playground" element={<GitPlaygroundPage />} />
                <Route path="interview" element={<InterviewPage />} />
                <Route path="interview/:token" element={<InterviewPage />} />
                <Route path="contests" element={<ContestsPage />} />
                <Route path="contests/:slug" element={<ContestDetailPage />} />
                <Route path="contests/:slug/leaderboard" element={<ContestLeaderboardPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="profile/:username" element={<ProfilePage />} />
                <Route path="share/:token" element={<PublicShareCardPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute>
                      <LearningReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
