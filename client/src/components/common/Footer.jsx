import { Link } from "react-router-dom";
import { Mail, ArrowUpRight } from "lucide-react";
import GithubIcon from "../../assets/GithubIcon";
import LinkedinIcon from "../../assets/LinkedinIcon";

const primaryLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Skills", to: "/skills" },
  { label: "Projects", to: "/projects" },
];

const secondaryLinks = [
  { label: "Certificates", to: "/certificates" },
  { label: "System", to: "/system" },
  { label: "Contact", to: "/contact" },
  { label: "Admin", to: "/admin" },
];

export default function Footer() {
  return (
    <footer className="site-footer grid-dark">
      <div className="site-footer__stripes" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div>
            <p className="site-footer__heading">// Manifesto</p>
            <p className="site-footer__manifesto">
              I build secure, scalable web apps with <span>clean code</span> and
              loud interfaces.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
              <a
                href="https://github.com/mayuresh-2601"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className="btn btn--sm site-footer__social"
              >
                <GithubIcon size={16} />
              </a>
              <a
                href="https://www.linkedin.com/in/mayuresh2601/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                className="btn btn--sm site-footer__social"
              >
                <LinkedinIcon size={16} />
              </a>
              <a
                href="mailto:kasarmayuresh99@gmail.com"
                aria-label="Send email"
                className="btn btn--sm site-footer__social"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          <div>
            <p className="site-footer__heading">Navigate</p>
            {primaryLinks.map((link) => (
              <Link key={link.to} to={link.to} className="site-footer__link">
                {link.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="site-footer__heading">Explore</p>
            {secondaryLinks.map((link) => (
              <Link key={link.to} to={link.to} className="site-footer__link">
                {link.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="site-footer__heading">Get in touch</p>
            <a
              href="mailto:kasarmayuresh99@gmail.com"
              className="site-footer__link"
            >
              Email <ArrowUpRight size={12} aria-hidden="true" />
            </a>
            <a
              href="https://github.com/mayuresh-2601"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__link"
            >
              GitHub <ArrowUpRight size={12} aria-hidden="true" />
            </a>
            <a
              href="https://www.linkedin.com/in/mayuresh2601/"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__link"
            >
              LinkedIn <ArrowUpRight size={12} aria-hidden="true" />
            </a>
            <a
              href="/Mayuresh_Kasar_Resume.pdf"
              download
              className="site-footer__link"
            >
              Resume <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="site-footer__wordmark" aria-hidden="true">
          Mayuresh Kasar
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Mayuresh Kasar.</span>
          <span>Designed with Kinetic Brutalism</span>
        </div>
      </div>
    </footer>
  );
}
