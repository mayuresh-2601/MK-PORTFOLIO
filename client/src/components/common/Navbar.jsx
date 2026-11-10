import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Skills", path: "/skills" },
  { name: "Projects", path: "/projects" },
  { name: "Certificates", path: "/certificates" },
  { name: "System", path: "/system" },
  { name: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const closeButtonRef = useRef(null);
  const overlayRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the overlay whenever the route changes.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Lock page scroll, trap focus, and wire Escape while the overlay is open.
  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocusedRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // The overlay is already mounted when this effect runs, so focus the
    // close button immediately. Deferring to rAF leaves a frame where the
    // overlay is visible but keyboard focus is still behind it.
    closeButtonRef.current?.focus({ preventScroll: true });

    const getFocusable = () =>
      Array.from(
        overlayRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      ).filter((element) => element.offsetParent !== null);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();

      if (focusable.length === 0) {
        event.preventDefault();
        overlayRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outsideOverlay = !overlayRef.current?.contains(active);

      if (event.shiftKey && (active === first || outsideOverlay)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outsideOverlay)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);

      const trigger = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;

      if (trigger instanceof HTMLElement && trigger.isConnected) {
        trigger.focus();
      }
    };
  }, [isOpen]);

  return (
    <header className={`site-nav${scrolled ? " site-nav--scrolled" : ""}`}>
      <div className="site-nav__inner">
        <Link
          to="/"
          className="site-nav__logo"
          aria-label="Mayuresh Kasar — home"
        >
          Mayuresh<span>.dev</span>
        </Link>

        <nav aria-label="Primary">
          <ul className="site-nav__links">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`site-nav__link${
                      isActive ? " is-active" : ""
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}

            {token && (
              <li>
                <Link to="/admin/dashboard" className="site-nav__admin">
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <button
          type="button"
          className="site-nav__menu-btn"
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label="Open navigation menu"
        >
          <Menu size={18} aria-hidden="true" />
          Menu
        </button>
      </div>

      {isOpen && (
        <div
          ref={overlayRef}
          id="mobile-menu"
          className="site-nav__overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          tabIndex={-1}
        >
          <div className="site-nav__overlay-top">
            <Link
              to="/"
              className="site-nav__overlay-logo"
              onClick={() => setIsOpen(false)}
            >
              Mayuresh<span>.dev</span>
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              className="site-nav__overlay-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={18} aria-hidden="true" />
              Close
            </button>
          </div>

          <nav
            className="site-nav__overlay-links"
            aria-label="Mobile primary"
          >
            {navLinks.map((link, index) => (
              <Link
                key={link.path}
                to={link.path}
                className="site-nav__overlay-link"
                onClick={() => setIsOpen(false)}
              >
                <span className="meta text-pink">
                  {String(index + 1).padStart(2, "0")}
                </span>{" "}
                {link.name}
              </Link>
            ))}

            {token && (
              <Link
                to="/admin/dashboard"
                className="site-nav__overlay-link"
                onClick={() => setIsOpen(false)}
              >
                <span className="meta text-pink">AD</span> Admin
              </Link>
            )}
          </nav>

          <div className="site-nav__overlay-meta">
            <span className="meta">Maharashtra, India</span>
            <a className="meta" href="mailto:kasarmayuresh99@gmail.com">
              kasarmayuresh99@gmail.com
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
