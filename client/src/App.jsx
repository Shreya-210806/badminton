import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import CrmLayout from './components/CrmLayout';
import ProtectedRoute from './components/ProtectedRoute';

import CrmLoginPage from './pages/login/CrmLoginPage';
import AuthPage from './pages/public/AuthPage';
import HomePage from './pages/public/HomePage';
import PublicTournamentsPage from './pages/public/PublicTournamentsPage';
import PublicPlayersPage from './pages/public/PublicPlayersPage';
import PublicRankingsPage from './pages/public/PublicRankingsPage';
import PublicLiveScoresPage from './pages/public/PublicLiveScoresPage';
import PublicAboutPage from './pages/public/PublicAboutPage';
import OverviewPage from './pages/overview/OverviewPage';
import PlayerCrmPage from './pages/player-crm/PlayerCrmPage';
import TournamentManagementPage from './pages/tournament-management/TournamentManagementPage';
import RegistrationManagementPage from './pages/registration-management/RegistrationManagementPage';
import DoublesTeamsPage from './pages/doubles-teams/DoublesTeamsPage';
import DrawsFixturesPage from './pages/draws-fixtures/DrawsFixturesPage';
import MatchScoringPage from './pages/match-scoring/MatchScoringPage';
import PaymentTrackingPage from './pages/payment-tracking/PaymentTrackingPage';
import CommunicationsPage from './pages/communications/CommunicationsPage';
import ReportsPage from './pages/reports/ReportsPage';
import AuditLogPage from './pages/audit-log/AuditLogPage';
import SettingsPage from './pages/settings/SettingsPage';
import RefereeConsolePage from './pages/referee-console/RefereeConsolePage';

// Player Dashboard Pages
import PlayerLayout from './pages/player/PlayerLayout';
import PlayerDashboardHome from './pages/player/PlayerDashboardHome';
import PlayerAvailableTournaments from './pages/player/PlayerAvailableTournaments';
import PlayerApplications from './pages/player/PlayerApplications';
import PlayerMyTournaments from './pages/player/PlayerMyTournaments';
import PlayerTournamentUpdates from './pages/player/PlayerTournamentUpdates';
import PlayerNotifications from './pages/player/PlayerNotifications';
import PlayerProfile from './pages/player/PlayerProfile';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'referee') return <Navigate to="/referee" replace />;
  return <Navigate to="/overview" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* 1. Public Pages (Dedicated Routes for Every Navbar Title) */}
      <Route index element={<HomePage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/tournaments" element={<PublicTournamentsPage />} />
      <Route path="/players" element={<PublicPlayersPage />} />
      <Route path="/rankings" element={<PublicRankingsPage />} />
      <Route path="/live-scores" element={<PublicLiveScoresPage />} />
      <Route path="/about" element={<PublicAboutPage />} />

      {/* 2. Player Simple Login & Registration */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />

      {/* 3. Player Dedicated Dashboard & Management Suite */}
      <Route
        path="/player"
        element={
          <ProtectedRoute allowedRoles={['player', 'admin', 'organizer', 'referee']}>
            <PlayerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/player/dashboard" replace />} />
        <Route path="dashboard" element={<PlayerDashboardHome />} />
        <Route path="tournaments" element={<PlayerAvailableTournaments />} />
        <Route path="applications" element={<PlayerApplications />} />
        <Route path="my-tournaments" element={<PlayerMyTournaments />} />
        <Route path="updates" element={<PlayerTournamentUpdates />} />
        <Route path="notifications" element={<PlayerNotifications />} />
        <Route path="profile" element={<PlayerProfile />} />
      </Route>

      {/* 3. Staff & Admin Operations Login Portal */}
      <Route path="/admin/login" element={<CrmLoginPage />} />

      {/* 3. Protected CRM Routes */}
      <Route
        path="/crm"
        element={
          <ProtectedRoute allowedRoles={['admin', 'organizer', 'referee']}>
            <CrmLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'organizer', 'referee']}>
            <CrmLayout />
          </ProtectedRoute>
        }
      >

        <Route
          path="/overview"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <OverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <OverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/overview"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <OverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player-crm"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <PlayerCrmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crm-tournaments"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <TournamentManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrations"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <RegistrationManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doubles-teams"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <DoublesTeamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/draws-fixtures"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <DrawsFixturesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/match-scoring"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <MatchScoringPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <PaymentTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communications"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <CommunicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-log"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/referee"
          element={
            <ProtectedRoute allowedRoles={['referee', 'organizer', 'admin']}>
              <RefereeConsolePage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
