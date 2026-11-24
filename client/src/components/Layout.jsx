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
  CalendarDays,
  UserRound,
  Wallet,
  LayoutDashboard,
  Gavel,
  Radio,
  LucideAxis3D,
  Zap,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const superAdminLinks = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/super-admin/organizations", label: "Organizations", icon: Building2 },
  { to: "/super-admin/users", label: "All Users", icon: Users },
  { to: "/super-admin/subscriptions", label: "Subscriptions", icon: Wallet },
  { to: "/super-admin/payments", label: "Payments", icon: CreditCard },
  { to: "/super-admin/plans", label: "Plans & Pricing", icon: Receipt },
  { to: "/contact-leads", label: "Contact Leads", icon: LucideAxis3D },
  { to: "/profile", label: "My Profile", icon: UserRound },
];

const organizerLinks = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/organizer/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/organizer/teams", label: "Teams", icon: ShieldCheck },
  { to: "/organizer/players", label: "Players", icon: Users },
  { to: "/organizer/matches", label: "Matches", icon: CalendarDays },
  { to: "/scorers", label: "Scorer Management", icon: ClipboardList },
  { to: "/auction", label: "Auction", icon: Gavel },
  { to: "/live", label: "Live Scoreboard", icon: Activity },
  { to: "/profile", label: "My Profile", icon: UserRound },
];

const legacyAdminLinks = [
  { to: "/overview", label: "Overview", icon: Trophy },
  { to: "/admin", label: "Approvals", icon: ShieldCheck },
  { to: "/registration", label: "Registrations", icon: Users },
  { to: "/admin/matches", label: "Manage Matches", icon: CalendarDays },
  { to: "/scorers", label: "Scorer Management", icon: ClipboardList },
  { to: "/auction", label: "Auction", icon: Gavel },
  { to: "/live", label: "Live Scoreboard", icon: Activity },
  { to: "/profile", label: "My Profile", icon: UserRound },
];

const teamOwnerLinks = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/registration", label: "My Registration", icon: UserRound },
  { to: "/team", label: "My Team", icon: ShieldCheck },
  { to: "/auction", label: "Auction", icon: Gavel },
  { to: "/live", label: "Live Scoreboard", icon: Activity },
  { to: "/profile", label: "My Profile", icon: UserRound },
];

const scorerLinks = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/scorer", label: "Scoring Dashboard", icon: Radio },
  { to: "/profile", label: "My Profile", icon: UserRound },
];

const playerLinks = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/registration", label: "My Registration", icon: UserRound },
  { to: "/profile", label: "My Profile", icon: UserRound },
];

const auctioneerLinks = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/auction", label: "My Assigned Auctions", icon: Gavel },
  { to: "/live", label: "Live Scoreboard", icon: Activity },
  { to: "/profile", label: "My Profile", icon: UserRound },
];

const quickCricketLinks = [
  {
    to: "/quick-cricket",
    label: "Friendly Cricket",
    icon: Zap,
  },
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
          : user?.role === "auctioneer"
            ? auctioneerLinks
            : user?.role === "team_owner"
              ? teamOwnerLinks
              : user?.role === "scorer"
                ? scorerLinks
                : playerLinks;

  const allLinks = [...quickCricketLinks, ...links];
  const roleLabel = user?.role?.replaceAll("_", " ");

  return (
    <div className="min-h-screen bg-[#050817] text-[#f1f5f9]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#293b55] bg-[#0d192c]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4c34e] text-[#101827] shadow-lg shadow-yellow-500/10">
              <Trophy size={22} />
            </div>

            <div>
              <p className="font-black tracking-wide text-white">
                SACL <span className="text-[#f4c34e]">2.0</span>
              </p>
              <p className="text-[10px] uppercase tracking-widest text-[#a6b4c8]">
                Cricket management platform
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="max-w-[160px] truncate text-sm font-semibold text-white">
                {user?.name}
              </p>
              <p className="text-xs capitalize text-[#a6b4c8]">{roleLabel}</p>
            </div>

            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#293b55] text-[#a6b4c8] transition hover:border-[#f4c34e]/50 hover:bg-[#1b2d45] hover:text-[#f4c34e]"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-3 py-5 sm:gap-6 sm:px-5 md:flex-row md:px-5">
        {/* Sidebar */}
        <aside className="h-fit rounded-2xl border border-[#293b55] bg-[#0d192c] p-3 shadow-xl shadow-black/10 md:sticky md:top-[90px] md:min-w-[230px]">
          <p className="mb-3 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a6b4c8]">
            {user?.role === "super_admin"
              ? "Platform Management"
              : user?.role === "org_admin"
                ? "Tournament Management"
                : "Main Menu"}
          </p>

          <nav className="flex gap-2 overflow-x-auto md:flex-col">
            {allLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-[#f4c34e] font-bold text-[#101827] shadow-md shadow-yellow-500/10"
                      : "text-[#c0ccdc] hover:bg-[#1b2d45] hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-6 hidden rounded-xl border border-[#293b55] bg-[#1b2d45]/60 p-3 md:block">
            <p className="text-xs font-bold text-[#f4c34e]">WEKHILADI</p>

            <p className="mt-1 text-[11px] leading-relaxed text-[#a6b4c8]">
              Tournament management, cricket auctions and quick friendly
              matches.
            </p>
          </div>
        </aside>

        {/* Page Content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
