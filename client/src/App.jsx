import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Registration from "./pages/Registration";
import Auction from "./pages/Auction";
import Admin from "./pages/Admin";
import Team from "./pages/Team";
import ScorerManagement from "./pages/ScorerManagement";
import ScorerDashboard from "./pages/ScorerDashboard";

import MatchAdminForm from "./components/MatchAdminForm";
import LiveMatches from "./pages/LiveMatches";
import LiveMatch from "./pages/LiveMatch";

import StaffManagement from "./pages/organizer/StaffManagement";
import CreateOrganization from "./pages/super-admin/CreateOrganization";

import {
  SuperAdminDashboard,
  // OrganizerDashboard,
  Organizations,
  PlatformUsers,
  Payments,
  Subscriptions,
  Plans,
  Tournaments,
  TeamsManagement,
  PlayersManagement,
  OrganizerMatches,
} from "./pages/SaaSDashboards";
import OrganizationRegister from "./pages/OrganizationRegister";
import PublicTournaments from "./pages/public/Tournaments";
import TournamentDetails from "./pages/public/TournamentDetails";
import Landing from "./pages/Landing";

function Protected({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}
function HomeDashboard() {
  const { user } = useAuth();

  if (user?.role === "super_admin") {
    return <SuperAdminDashboard />;
  }

  if (user?.role === "org_admin") {
    return <Tournaments />;
  }

  if (user?.role === "scorer") {
    return <ScorerDashboard />;
  }

  if (user?.role === "team_owner") {
    return <Dashboard />;
  }

  return <Dashboard />;
}

function HomeRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Landing />;
  }

  return (
    <Protected>
      <HomeDashboard />
    </Protected>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Role-based home dashboard */}
      <Route
        path="/"
        element={
          <Protected>
            <HomeDashboard />
          </Protected>
        }
      />
      {/* Super Admin */}
      <Route
        path="/super-admin/organizations"
        element={
          <Protected roles={["super_admin"]}>
            <Organizations />
          </Protected>
        }
      />
      <Route
        path="/super-admin/users"
        element={
          <Protected roles={["super_admin"]}>
            <PlatformUsers />
          </Protected>
        }
      />
      <Route
        path="/super-admin/payments"
        element={
          <Protected roles={["super_admin"]}>
            <Payments />
          </Protected>
        }
      />
      <Route
        path="/super-admin/subscriptions"
        element={
          <Protected roles={["super_admin"]}>
            <Subscriptions />
          </Protected>
        }
      />
      <Route
        path="/super-admin/plans"
        element={
          <Protected roles={["super_admin"]}>
            <Plans />
          </Protected>
        }
      />
      {/* Organizer */}
      <Route
        path="/organizer/tournaments"
        element={
          <Protected roles={["org_admin"]}>
            <Tournaments />
          </Protected>
        }
      />
      <Route
        path="/organizer/teams"
        element={
          <Protected roles={["org_admin"]}>
            <TeamsManagement />
          </Protected>
        }
      />
      <Route
        path="/organizer/players"
        element={
          <Protected roles={["org_admin"]}>
            <PlayersManagement />
          </Protected>
        }
      />
      <Route
        path="/organizer/matches"
        element={
          <Protected roles={["org_admin"]}>
            <OrganizerMatches />
          </Protected>
        }
      />
      {/* Existing SACL screens: retain legacy admin access */}
      <Route
        path="/registration"
        element={
          <Protected>
            <Registration />
          </Protected>
        }
      />
      <Route
        path="/auction"
        element={
          <Protected>
            <Auction />
          </Protected>
        }
      />
      <Route
        path="/team"
        element={
          <Protected roles={["admin", "org_admin", "team_owner"]}>
            <Team />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected roles={["admin", "org_admin"]}>
            <Admin />
          </Protected>
        }
      />
      <Route
        path="/scorers"
        element={
          <Protected roles={["admin", "org_admin"]}>
            <ScorerManagement />
          </Protected>
        }
      />
      <Route
        path="/admin/matches"
        element={
          <Protected roles={["admin", "org_admin"]}>
            <MatchAdminForm />
          </Protected>
        }
      />
      <Route
        path="/scorer"
        element={
          <Protected roles={["scorer", "admin", "org_admin"]}>
            <ScorerDashboard />
          </Protected>
        }
      />
      {/* Public live score pages */}
      <Route path="/live" element={<LiveMatches />} />
      <Route path="/live/:matchId" element={<LiveMatch />} />
      <Route path="/" element={<HomeRoute />} />{" "}
      <Route
        path="/organizer/staff"
        element={
          <Protected roles={["org_admin"]}>
            <StaffManagement />
          </Protected>
        }
      />
      <Route
        path="/super-admin/organizations/create"
        element={
          <Protected roles={["super_admin"]}>
            <CreateOrganization />
          </Protected>
        }
      />
      <Route path="/organization/register" element={<OrganizationRegister />} />
      {/* Public tournament discovery */}
      <Route path="/tournaments" element={<PublicTournaments />} />
      <Route path="/tournaments/:id" element={<TournamentDetails />} />
      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
