import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Trophy,
  Users,
  ShieldCheck,
  LogOut,
  ClipboardList,
  Activity,
  Building2,
  CreditCard,
  Receipt,
  Settings,
  CalendarDays,
  UserRound,
  Wallet,
  LayoutDashboard,
  Gavel,
  Radio,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const superAdminLinks = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/super-admin/organizations", label: "Organizations", icon: Building2 },
  { to: "/super-admin/users", label: "All Users", icon: Users },
  { to: "/super-admin/subscriptions", label: "Subscriptions", icon: Wallet },
  { to: "/super-admin/payments", label: "Payments", icon: CreditCard },
  { to: "/super-admin/plans", label: "Plans & Pricing", icon: Receipt },
];

const organizerLinks = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/organizer/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/organizer/teams", label: "Teams", icon: ShieldCheck },
  { to: "/organizer/players", label: "Players", icon: Users },
  { to: "/organizer/matches", label: "Matches", icon: CalendarDays },
  { to: "/scorers", label: "Scorer Management", icon: ClipboardList },
  { to: "/auction", label: "Auction", icon: Gavel },
  { to: "/live", label: "Live Scoreboard", icon: Activity },
];

const legacyAdminLinks = [
  { to: "/", label: "Overview", icon: Trophy },
  { to: "/admin", label: "Approvals", icon: ShieldCheck },
  { to: "/registration", label: "Registrations", icon: Users },
  { to: "/admin/matches", label: "Manage Matches", icon: CalendarDays },
  { to: "/scorers", label: "Scorer Management", icon: ClipboardList },
  { to: "/auction", label: "Auction", icon: Gavel },
  { to: "/live", label: "Live Scoreboard", icon: Activity },
];

const teamOwnerLinks = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/registration", label: "My Registration", icon: UserRound },
  { to: "/team", label: "My Team", icon: ShieldCheck },
  { to: "/live", label: "Live Scoreboard", icon: Activity },
];

const scorerLinks = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/scorer", label: "Scoring Dashboard", icon: Radio },
  { to: "/live", label: "Live Scoreboard", icon: Activity },
];

const playerLinks = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/registration", label: "My Registration", icon: UserRound },
  { to: "/live", label: "Live Scoreboard", icon: Activity },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links =
    user?.role === "super_admin"
      ? superAdminLinks
      : user?.role === "org_admin"
        ? organizerLinks
        : user?.role === "admin"
          ? legacyAdminLinks
          : user?.role === "team_owner"
            ? teamOwnerLinks
            : user?.role === "scorer"
              ? scorerLinks
              : playerLinks;

  const roleLabel = user?.role?.replaceAll("_", " ");

  return (
    <div className="min-h-screen bg-[#071b16] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b211a]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-[#071b16]">
              <Trophy size={22} />
            </div>

            <div>
              <p className="font-black tracking-wide">
                SACL <span className="text-lime">2.0</span>
              </p>
              <p className="text-[10px] uppercase tracking-widest text-emerald-100/50">
                Cricket management platform
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="max-w-[160px] truncate text-sm font-semibold">
                {user?.name}
              </p>
              <p className="text-xs capitalize text-emerald-100/50">
                {roleLabel}
              </p>
            </div>

            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 transition hover:bg-white/10"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-5 md:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-[#0b211a] p-3 md:sticky md:top-[90px]">
          <p className="mb-3 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100/40">
            {user?.role === "super_admin"
              ? "Platform Management"
              : user?.role === "org_admin"
                ? "Tournament Management"
                : "Main Menu"}
          </p>

          <nav className="flex gap-2 overflow-x-auto md:flex-col">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                    isActive
                      ? "bg-lime font-semibold text-[#071b16]"
                      : "text-emerald-100/70 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 hidden rounded-xl border border-white/10 bg-white/[0.03] p-3 md:block">
            <p className="text-xs font-semibold text-emerald-100/70">
              SACL 2.0
            </p>
            <p className="mt-1 text-[11px] text-emerald-100/40">
              Cricket auction and tournament management
            </p>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
