import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Sun, Menu, X, ArrowUpRight, Trophy } from "lucide-react";

const navLinks = [
  { name: "Home", path: "/home" },
  { name: "About", path: "/about" },
  //   { name: "Solar & Services", path: "/services" },
  //   { name: "Pricing", path: "/pricing" },
  //   { name: "Tournaments", path: "/tournaments" },
  { name: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d192c] text-white shadow-lg backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        {/* Logo */}
        <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
          <span className="rounded-xl bg-[#f5b942] p-3 text-[#102a24]">
            <Trophy size={25} />
          </span>

          <span>
            <strong className="block text-xl tracking-wide">WEKHILADI</strong>
            <small className="text-[10px] tracking-[.2em] text-white/60">
              SPORTS • COMMUNITY
            </small>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors hover:text-[#f5b942] ${
                  isActive ? "text-[#f5b942]" : "text-white/80"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA */}
        <Link
          to="/contact"
          className="hidden items-center rounded-full bg-[#f5b942] px-5 py-3 text-sm font-bold text-[#102a24] transition hover:bg-white lg:inline-flex"
        >
          Get in touch
          <ArrowUpRight size={17} className="ml-2" />
        </Link>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="rounded-lg p-2 transition hover:bg-white/10 lg:hidden"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav className="border-t border-white/10 bg-[#102a24] px-5 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white/10 text-[#f5b942]"
                      : "text-white/85 hover:bg-white/10"
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            <Link
              to="/contact"
              onClick={closeMenu}
              className="mt-3 flex items-center justify-center rounded-full bg-[#f5b942] px-5 py-3 font-bold text-[#102a24]"
            >
              Get in touch
              <ArrowUpRight size={17} className="ml-2" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
