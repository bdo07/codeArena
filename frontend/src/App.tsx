import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

const LandingPage = React.lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const ChallengesPage = React.lazy(() => import('./pages/ChallengesPage').then((m) => ({ default: m.ChallengesPage })));
const WorkspacePage = React.lazy(() => import('./pages/WorkspacePage').then((m) => ({ default: m.WorkspacePage })));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const RoadmapsPage = React.lazy(() => import('./pages/RoadmapsPage').then((m) => ({ default: m.RoadmapsPage })));
const RoadmapDetailPage = React.lazy(() => import('./pages/RoadmapDetailPage').then((m) => ({ default: m.RoadmapDetailPage })));
const ContestsPage = React.lazy(() => import('./pages/ContestsPage').then((m) => ({ default: m.ContestsPage })));
const ContestDetailPage = React.lazy(() => import('./pages/ContestDetailPage').then((m) => ({ default: m.ContestDetailPage })));
const ContestLeaderboardPage = React.lazy(() => import('./pages/ContestLeaderboardPage').then((m) => ({ default: m.ContestLeaderboardPage })));
const QuestPage = React.lazy(() => import('./pages/QuestPage').then((m) => ({ default: m.QuestPage })));
const GitPlaygroundPage = React.lazy(() => import('./pages/GitPlaygroundPage').then((m) => ({ default: m.GitPlaygroundPage })));
const InterviewPage = React.lazy(() => import('./pages/InterviewPage').then((m) => ({ default: m.InterviewPage })));
const LearningReportsPage = React.lazy(() => import('./pages/LearningReportsPage').then((m) => ({ default: m.LearningReportsPage })));
const PublicShareCardPage = React.lazy(() => import('./pages/PublicShareCardPage').then((m) => ({ default: m.PublicShareCardPage })));
const SearchPage = React.lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

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
                <Route path="search" element={<SearchPage />} />
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
                    <ProtectedRoute requireAdmin={true}>
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
