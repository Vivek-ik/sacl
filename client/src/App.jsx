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

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
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
          <Protected roles={["admin", "team_owner"]}>
            <Team />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected roles={["admin"]}>
            <Admin />
          </Protected>
        }
      />
      <Route
        path="/scorers"
        element={
          <Protected roles={["admin"]}>
            <ScorerManagement />
          </Protected>
        }
      />

      {/* Admin: Create and assign matches */}
      <Route
        path="/admin/matches"
        element={
          <Protected roles={["admin"]}>
            <MatchAdminForm />
          </Protected>
        }
      />

      {/* Scorer: Assigned matches and scoring controls */}
      <Route
        path="/scorer"
        element={
          <Protected roles={["scorer", "admin"]}>
            <ScorerDashboard />
          </Protected>
        }
      />

      {/* Public: All matches */}
      <Route path="/live" element={<LiveMatches />} />

      {/* Public: Individual live match and scorecard */}
      <Route path="/live/:matchId" element={<LiveMatch />} />
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
