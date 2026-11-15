import { Link, useNavigate } from "react-router-dom";
import {
  Trophy,
  Users,
  Gavel,
  ShieldCheck,
  LogOut,
  ClipboardList,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Radio } from "lucide-react";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = [
    { to: "/", label: "Overview", icon: Trophy },
    // { to: "/auction", label: "Live auction", icon: Gavel },
    ...(user?.role === "team_owner"
      ? [{ to: "/team", label: "My Team", icon: Users }]
      : []),
    { to: "/registration", label: "My registration", icon: Users },
    ...(user?.role === "admin"
      ? [{ to: "/admin", label: "Approvals", icon: ShieldCheck }]
      : []),
    ...(user?.role === "admin"
      ? [
          {
            to: "/scorers",
            label: "Scorer Management",
            icon: ClipboardList,
          },
        ]
      : []),

    ...(user?.role === "admin"
      ? [
          {
            to: "/admin/matches",
            label: "Manage Matches",
            icon: Trophy,
          },
          {
            to: "/scorers",
            label: "Scorer Management",
            icon: Users,
          },
        ]
      : []),

    ...(user?.role === "scorer"
      ? [
          {
            to: "/scorer",
            label: "Scoring Dashboard",
            icon: Radio,
          },
        ]
      : []),

    {
      to: "/live",
      label: "Live Scoreboard",
      icon: Activity,
    },
  ];
  return (
    <div className="min-h-screen bg-pitch text-white">
      <header className="border-b border-white/10 bg-[#0b211a]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-pitch">
              <Trophy />
            </div>
            <div>
              <p className="font-black tracking-wide">
                SACL <span className="text-lime">2.0</span>
              </p>
              {/* <p className="text-xs text-emerald-200/60">
                CRICKET AUCTION PLATFORM
              </p> */}
            </div>
          </Link>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="min-w-0 text-right">
              <p className="max-w-[130px] truncate text-xs font-semibold text-white sm:max-w-none sm:text-sm">
                {user?.name}
              </p>
              <p className="text-[10px] capitalize text-emerald-100/50 sm:text-xs">
                {user?.role?.replaceAll("_", " ")}
              </p>
            </div>

            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 hover:bg-white/10 sm:h-10 sm:w-10"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:grid-cols-[220px_1fr]">
        <aside className="flex gap-2 overflow-x-auto md:flex-col">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm text-emerald-100/70 hover:bg-panel hover:text-lime"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
