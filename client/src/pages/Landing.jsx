import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trophy,
  Users,
  Gavel,
  ShieldCheck,
  Radio,
  UserPlus,
  Building2,
  ClipboardList,
  ArrowRight,
  LogIn,
  Menu,
  X,
  Target,
  CalendarDays,
  Wallet,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const tabs = [
  "Overview",
  "Player",
  "Turf Cricket",
  "Team Owner",
  "Auctioneer",
  "Admin",
];

const portalContent = {
  Overview: {
    eyebrow: "SACL 2.0 PORTALS",
    title: "Choose Your Portal",
    description:
      "Select your role to access the right registration process and tournament services.",
    cards: [
      {
        title: "Player Registration",
        description:
          "Complete your cricket profile, select your playing role and register for participation.",
        icon: Users,
        action: "Player Registration",
        to: "/register",
        color: "blue",
      },
      {
        title: "Team Owner Portal",
        description:
          "Browse available tournaments, apply with your team and manage your squad.",
        icon: Trophy,
        action: "Explore Tournaments",
        to: "/tournaments",
        color: "amber",
      },
      {
        title: "Auctioneer Portal",
        description:
          "Access your assigned auctioneer account and manage live bidding.",
        icon: Gavel,
        action: "Auctioneer Login",
        to: "/login",
        color: "purple",
      },
      {
        title: "Organization Admin",
        description:
          "Register your cricket association and organize tournaments, teams and auctions.",
        icon: Building2,
        action: "Register Organization",
        to: "/organization/register",
        color: "green",
      },
    ],
  },

  Player: {
    eyebrow: "PLAYER PORTAL",
    title: "Player Registration",
    description: "",
    cards: [
      {
        title: "Complete Player Profile",
        description: "",
        icon: UserPlus,
        action: "Open Player Registration",
        to: "/register",
        color: "blue",
      },
      {
        title: "My Player Registration",
        description: "",
        icon: ClipboardList,
        action: "View My Registration",
        to: "/registration",
        color: "amber",
      },
    ],
  },

  "Turf Cricket": {
    eyebrow: "TURF CRICKET",
    title: "Play. Score. Compete.",
    description:
      "Create friendly cricket matches, track your performance and build your player statistics.",
    cards: [
      {
        title: "Create Friendly Match",
        description: "Organize a cricket match with your friends.",
        icon: Trophy,
        action: "Create Match",
        to: "/friendly-matches/create",
        color: "amber",
      },
      {
        title: "My Matches",
        description: "View your previous and upcoming matches.",
        icon: CalendarDays,
        action: "View Matches",
        to: "/friendly-matches",
        color: "blue",
      },
      {
        title: "My Cricket Stats",
        description: "Track your runs, wickets and career performance.",
        icon: Target,
        action: "View Statistics",
        to: "/my-cricket-stats",
        color: "green",
      },
    ],
  },
  "Team Owner": {
    eyebrow: "TEAM OWNER PORTAL",
    title: "Build Your Team",
    description: "",
    cards: [
      {
        title: "Complete Owner Profile",
        description: "",
        icon: UserPlus,
        action: "Open Owner Registration",
        to: "/register",
        color: "blue",
      },
      ,
      {
        title: "Browse Tournaments",
        description: "",
        icon: Trophy,
        action: "Explore Tournaments",
        to: "/tournaments",
        color: "amber",
      },
      {
        title: "My Team Dashboard",
        description: "",
        icon: Users,
        action: "Open Team Dashboard",
        to: "/team",
        color: "blue",
      },
    ],
  },

  Auctioneer: {
    eyebrow: "AUCTIONEER PORTAL",
    title: "Live Auction Control",
    description:
      "Auctioneers can access their assigned tournament auction after signing in with organization-provided credentials.",
    cards: [
      {
        title: "Auctioneer Login",
        description:
          "Sign in with your assigned account to access auction controls.",
        icon: Gavel,
        action: "Sign In",
        to: "/login",
        color: "purple",
      },
      {
        title: "Live Auction",
        description:
          "Access the live auction room and manage real-time player bidding.",
        icon: Radio,
        action: "Open Live Auction",
        to: "/auction",
        color: "amber",
      },
    ],
  },

  Admin: {
    eyebrow: "ADMINISTRATION PORTAL",
    title: "Manage Your Organization",
    description:
      "Create your organization and manage tournaments, team applications, players, auctioneers and live matches.",
    cards: [
      {
        title: "Register Organization",
        description:
          "Create your cricket association account and start managing tournaments.",
        icon: Building2,
        action: "Register Organization",
        to: "/organization/register",
        color: "green",
      },
      {
        title: "Administrator Login",
        description:
          "Sign in to your existing administrator account and open the management dashboard.",
        icon: ShieldCheck,
        action: "Admin Login",
        to: "/login",
        color: "blue",
      },
    ],
  },
};

const colorClasses = {
  blue: "bg-blue-400/10 text-blue-300",
  amber: "bg-amber-400/10 text-amber-300",
  purple: "bg-purple-400/10 text-purple-300",
  green: "bg-emerald-400/10 text-emerald-300",
};

function PortalCard({ card, onRegistration }) {
  const Icon = card.icon;

  const isRegistration = card.to === "/register" || card.to === "/registration";

  return (
    <div className="group flex flex-col rounded-2xl border border-white/10 bg-[#17283e] p-5 transition duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:bg-[#1b304a]">
      <div
        className={`mb-5 grid h-12 w-12 place-items-center rounded-xl ${
          colorClasses[card.color] || colorClasses.amber
        }`}
      >
        <Icon size={25} />
      </div>

      <h3 className="text-lg font-bold text-white">{card.title}</h3>

      <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">
        {card.description}
      </p>

      <Link
        to={card.to}
        onClick={(e) => {
          if (isRegistration) {
            e.preventDefault();
            onRegistration();
          }
        }}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300"
      >
        {card.action}
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#192b42] p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon size={20} className="text-amber-400" />
      </div>

      <p className="mt-3 text-2xl font-black text-amber-400 sm:text-3xl">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

const getDashboardPath = (role) => {
  const routes = {
    player: "/registration",
    team_owner: "/team",
    auctioneer: "/auction",
    admin: "/overview",
    org_admin: "/overview",
    super_admin: "/overview",
  };

  return routes[role] || "/login";
};

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publicTournaments, setPublicTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [tournamentsError, setTournamentsError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPublicTournaments = async () => {
      try {
        setTournamentsLoading(true);
        setTournamentsError("");

        // Expected response: { tournaments: [{ ..., auction: {...} }] }
        const response = await api.get("/public/tournaments");
        const data = response.data;
        const list = Array.isArray(data)
          ? data
          : data?.tournaments || data?.data || [];

        if (active) setPublicTournaments(Array.isArray(list) ? list : []);
      } catch (error) {
        if (active) {
          setTournamentsError(
            error.response?.data?.message ||
              "Unable to load tournaments right now.",
          );
        }
      } finally {
        if (active) setTournamentsLoading(false);
      }
    };

    loadPublicTournaments();
    return () => {
      active = false;
    };
  }, []);

  const current = portalContent[activeTab];

  const dashboardPath = getDashboardPath(user?.role);

  const handleRegistration = () => {
    if (user) {
      navigate(dashboardPath);
      return;
    }

    navigate("/register");
  };
  const selectTab = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleGetStarted = () => {
    setActiveTab("Overview");
    document.getElementById("portals")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#050b19] text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1629]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-slate-950">
              <Trophy size={22} />
            </div>

            <div>
              <p className="text-xl font-black tracking-tight">
                We<span className="text-amber-400">Khiladi</span>
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Digital Auction Arena
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/tournaments"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 hover:text-amber-400"
            >
              Tournaments
            </Link>

            {user ? (
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-300"
              >
                <UserCheck size={17} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 hover:text-amber-400"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-bold hover:border-amber-400 hover:text-amber-400"
                >
                  <LogIn size={17} />
                  Register
                </Link>
              </>
            )}

            <button
              onClick={handleGetStarted}
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-300"
            >
              Get Started
            </button>
          </div>
          <button
            className="rounded-xl border border-white/10 p-2 sm:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#0b1629] p-5 sm:hidden">
            <div className="grid gap-3">
              <Link
                to="/tournaments"
                className="rounded-xl bg-[#17283e] p-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore Tournaments
              </Link>

              {user ? (
                <Link
                  to={dashboardPath}
                  className="rounded-xl bg-amber-400 p-3 font-bold text-slate-950"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserCheck size={17} className="mr-2 inline" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-xl bg-[#17283e] p-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="rounded-xl bg-[#17283e] p-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);

                  if (user) {
                    navigate("/quick-cricket");
                  } else {
                    navigate("/login", {
                      state: { from: "/quick-cricket" },
                    });
                  }
                }}
                className="rounded-xl bg-[#17283e] p-3 font-bold text-white"
              >
                {user ? "🏏 Start Quick Match" : "🏏 Login & Play"}{" "}
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:py-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#172b45] via-[#10243a] to-[#101b32] p-6 sm:p-12">
          <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Radio size={14} />
              The Digital Auction Arena
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              PLAY. BID.
              {/* <br /> */}
              <span className="text-amber-400 "> WIN.</span>
            </h1>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);

                  if (user) {
                    navigate("/quick-cricket");
                  } else {
                    navigate("/login", {
                      state: { from: "/quick-cricket" },
                    });
                  }
                }}
                className="rounded-xl bg-[#17283e] p-3 font-bold text-white"
              >
                {user ? "🏏 Start Quick Match" : "🏏 Login & Play"}{" "}
              </button>

              {user ? (
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 font-bold text-white transition hover:border-amber-400"
                >
                  <UserCheck size={18} />
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 font-bold text-white transition hover:border-amber-400"
                >
                  <Trophy size={18} />
                  Register now
                </Link>
              )}
            </div>
          </div>

          <Trophy
            className="absolute -bottom-12 -right-8 hidden text-amber-300/[0.07] sm:block"
            size={300}
            strokeWidth={1}
          />
        </section>

        {/* Public tournaments and auctions */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-[#111f33] p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                Discover competitions
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Tournaments & Live Auctions
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Explore tournaments, check auction schedules and watch live
                player bidding.
              </p>
            </div>
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:border-amber-400 hover:text-amber-400"
            >
              All tournaments <ArrowRight size={16} />
            </Link>
          </div>

          {tournamentsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                />
              ))}
            </div>
          ) : tournamentsError ? (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              {tournamentsError}
            </div>
          ) : publicTournaments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center">
              <Trophy className="mx-auto text-amber-400" size={32} />
              <h3 className="mt-3 font-bold text-white">
                No tournaments available yet
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Check back soon for upcoming tournaments and auctions.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicTournaments.map((tournament) => {
                const auction = tournament.auction || null;
                const status = auction?.status || "NOT_CREATED";
                const isLive = status === "RUNNING";
                const isCompleted = status === "COMPLETED";
                const scheduledAt = auction?.scheduledAt
                  ? new Date(auction.scheduledAt)
                  : null;

                const statusLabel =
                  status === "RUNNING"
                    ? "LIVE NOW"
                    : status === "PAUSED"
                      ? "PAUSED"
                      : status === "COMPLETED"
                        ? "COMPLETED"
                        : scheduledAt
                          ? "SCHEDULED"
                          : auction
                            ? "NOT STARTED"
                            : "";

                const statusClass = isLive
                  ? "bg-red-400/15 text-red-300"
                  : status === "PAUSED"
                    ? "bg-amber-400/15 text-amber-300"
                    : isCompleted
                      ? "bg-white/10 text-slate-300"
                      : "bg-blue-400/15 text-blue-300";

                return (
                  <article
                    key={tournament._id}
                    className="flex flex-col rounded-2xl border border-white/10 bg-[#192b42] p-5 transition hover:-translate-y-1 hover:border-amber-400/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-400">
                        <Trophy size={22} />
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-black text-white">
                      {tournament.name || "Tournament"}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {[tournament.season, tournament.organization?.name]
                        .filter(Boolean)
                        .join(" · ") || "WeKhiladi Tournament"}
                    </p>

                    <div className="mt-4 flex-1 space-y-2 border-t border-white/10 pt-4 text-xs text-slate-300">
                      <p className="flex items-center gap-2">
                        <Gavel size={14} className="text-amber-400" />
                        {auction?.auctionName ||
                          "Auction details not available"}
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-amber-400" />
                        {scheduledAt && !Number.isNaN(scheduledAt.getTime())
                          ? scheduledAt.toLocaleString()
                          : "Auction date not announced"}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        to={`/tournaments/${tournament._id}`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 text-xs font-bold text-white transition hover:border-amber-400 hover:text-amber-400"
                      >
                        Tournament details
                      </Link>
                      {auction?._id && (
                        <Link
                          to={`/auction/live/${auction._id}`}
                          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black ${
                            isLive
                              ? "bg-red-500 text-white hover:bg-red-400"
                              : "bg-amber-400 text-slate-950 hover:bg-amber-300"
                          }`}
                        >
                          <Radio size={14} />
                          {isLive
                            ? "Watch Live"
                            : isCompleted
                              ? "View Auction"
                              : "Auction Room"}
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Role tabs */}
        <section className="mt-8">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => selectTab(tab)}
                className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition ${
                  activeTab === tab
                    ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/10"
                    : "border border-white/10 bg-[#17283e] text-slate-300 hover:border-amber-400/50 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-400/20 bg-gradient-to-r from-[#302b1d] to-[#17283e] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-400">
                WEKHILADI QUICK CRICKET
              </p>

              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                Your Friends. Your Teams. Your Match.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Create teams in seconds, add players by name and start scoring
                friendly cricket matches. No tournament registration or fixed
                squad size.
              </p>
            </div>

            <Link
              to={user ? "/quick-cricket" : "/login"}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 font-black text-slate-950 hover:bg-amber-300"
            >
              Start Playing
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
        {/* Statistics */}
        {/* <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Teams"
            value="10"
            detail="Participating"
          />

          <StatCard
            icon={UserCheck}
            label="Squad Slots"
            value="130"
            detail="13 players per team"
          />

          <StatCard
            icon={Wallet}
            label="Team Purse"
            value="50,000"
            detail="Auction points"
          />

          <StatCard
            icon={Target}
            label="Registration"
            value="₹1,200"
            detail="Per player"
          />
        </section> */}

        {/* Portals */}
        <section
          id="portals"
          className="mt-7 scroll-mt-24 rounded-3xl border border-white/10 bg-[#111f33] p-5 sm:p-8"
        >
          <div className="mb-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
              {current.eyebrow}
            </p>

            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              {current.title}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              {current.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {current.cards.map((card) => (
              <PortalCard
                key={card.title}
                card={card}
                onRegistration={handleRegistration}
              />
            ))}
          </div>
        </section>

        {/* Organization CTA */}
        <section className="relative mt-7 overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-r from-[#302b1d] to-[#17283e] p-6 sm:p-9">
          <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
                <Building2 size={16} />
                For Cricket Associations
              </p>

              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                Host Your Own Tournament
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Create your organization and manage tournaments, team
                applications, player registrations, auctions and live scoring.
              </p>
            </div>

            <Link
              to="/organization/register"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 font-black text-slate-950 transition hover:bg-amber-300"
            >
              Register Organization
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* Tournament rules */}
        <section className="mt-7 rounded-3xl border border-white/10 bg-[#111f33] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400/10 text-amber-400">
              <ShieldCheck size={23} />
            </div>

            <h2 className="text-xl font-black">Tournament Rules</h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "10 teams · 13 players per team",
              "50,000 points per team",
              "Maximum 1 Iconic Player per team",
              "45-second default bidding timer",
              "Player category and role require Admin verification",
            ].map((rule, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl bg-[#192b42] p-4 text-sm text-slate-300"
              >
                <span className="font-black text-amber-400">0{index + 1}</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-white/10 bg-[#0b1629] p-20 rounded-xl">
          <div className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Platform */}
            <div>
              <Link to="/home" className="inline-flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-slate-950">
                  <Trophy size={22} />
                </div>
                <div>
                  <p className="text-xl font-black">
                    We<span className="text-amber-400">Khiladi</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    Digital Auction Arena
                  </p>
                </div>
              </Link>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                WeKhiladi is a sports registration and tournament management
                platform dedicated to promoting sports, supporting emerging
                talent, and creating opportunities for aspiring athletes.
              </p>

              <a
                href="https://wekhiladi.in/home"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300"
              >
                Visit wekhiladi.in
                <ArrowRight size={16} />
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white">Quick Links</h3>

              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link to="/home" className="hover:text-amber-400">
                  Home
                </Link>
                <Link to="/contact" className="hover:text-amber-400">
                  Contact us
                </Link>
                <Link to="/tournaments" className="hover:text-amber-400">
                  Tournaments
                </Link>
                <Link to="/register" className="hover:text-amber-400">
                  Registration
                </Link>
                <Link to="/login" className="hover:text-amber-400">
                  Login
                </Link>
                <Link
                  to="/organization/register"
                  className="hover:text-amber-400"
                >
                  Organization Registration
                </Link>
              </div>
            </div>

            {/* Associated Organisations */}
            <div>
              <h3 className="font-bold text-white">
                Our Associated Organisations
              </h3>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold text-amber-400">Arohan</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold text-amber-400">
                    Lodheshwar Foundation
                  </p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="font-bold text-white">Business Information</h3>

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Business Name</p>
                  <p className="mt-1 font-semibold text-slate-200">Arohan</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Proprietor</p>
                  <p className="mt-1 font-semibold text-slate-200">
                    Narendra Lodhi
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Associated Name</p>
                  <p className="mt-1 font-semibold text-slate-200">
                    Lodheshwar Foundation
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Business Address</p>
                  <p className="mt-1 leading-6 text-slate-300">
                    126 B, Vaishali Nagar, Vidisha, Madhya Pradesh 464001, India
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Contact</p>
                  <p className="mt-1 leading-6 text-slate-300">
                    Phone: 9109101114 <br />
                    Email: arohanmp@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 py-5">
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} WeKhiladi. All rights reserved.
              </p>

              <a
                href="https://wekhiladi.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-400 transition hover:text-amber-400"
              >
                Powered by WeKhiladi
              </a>
            </div>
          </div>
          <div className="wrap">
            <h3 className="font-bold text-white">We Khiladi</h3>

            <p className="mt-2 text-sm text-slate-400">
              Tournament registration and management platform.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <Link
                to="/terms-and-conditions"
                className="text-slate-400 transition hover:text-white"
              >
                Terms & Conditions
              </Link>

              <Link
                to="/privacy"
                className="text-slate-400 transition hover:text-white"
              >
                Privacy Policy
              </Link>

              <Link
                to="/refund-policy"
                className="text-slate-400 transition hover:text-white"
              >
                Refund & Cancellation Policy
              </Link>
            </div>

            <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-500">
              © {new Date().getFullYear()} We khiladi. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
