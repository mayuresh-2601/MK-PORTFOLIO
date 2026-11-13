import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Download,
  Code2,
  Server,
  Container,
} from "lucide-react";
import Marquee from "../../components/common/Marquee";
import StatsBand from "../../components/common/StatsBand";
import SEO from "../../components/common/SEO";

const capabilities = [
  {
    icon: Code2,
    title: "Frontend Engineering",
    text: "Responsive, accessible interfaces built with React.js, modern JavaScript, and clean component architecture that stays fast under real-world load.",
  },
  {
    icon: Server,
    title: "Backend & APIs",
    text: "RESTful APIs with Node.js, Express.js, and MySQL/TiDB — JWT authentication, validation, role-based access, and maintainable server structure.",
  },
  {
    icon: Container,
    title: "DevOps & Delivery",
    text: "Linux, Docker fundamentals, Git workflows, and cloud deployment. I ship, monitor, and iterate on applications instead of stopping at localhost.",
  },
];

export default function Home() {
  return (
    <>
      <SEO
        title="Mayuresh Kasar — Full Stack Developer Portfolio"
        description="Mayuresh Kasar — full stack developer portfolio. Explore React, Node.js, Express, MySQL, Docker and CI/CD projects, skills, certificates, and live server telemetry."
        path="/"
      />

      <section className="hero grid-acid">
        <div className="hero__decor-circle" aria-hidden="true" />
        <div className="hero__inner">
          <div className="hero__left reveal">
            <p className="meta hero__kicker">Portfolio / 2026</p>
            <h1 className="display hero__title">
              <span>I am</span>
              <span>Mayuresh</span>
              <span>Kasar</span>
            </h1>
            <p className="meta hero__location">
              Based in Maharashtra, India
            </p>
          </div>

          <div
            className="hero__center reveal"
            style={{ "--delay": "120ms" }}
          >
            <div className="portrait-card">
              <picture>
                <source srcSet="/Profile.webp" type="image/webp" />
                <img
                  src="/Profile.png"
                  alt="Mayuresh Kasar — Full Stack Developer"
                  width="1086"
                  height="1448"
                  loading="eager"
                  decoding="async"
                  draggable={false}
                />
              </picture>
              <span className="portrait-card__tag">Full Stack Dev</span>
            </div>
          </div>

          <div
            className="hero__right reveal"
            style={{ "--delay": "220ms" }}
          >
            <p className="meta text-pink">Hello, world</p>
            <h2 className="display hero__subtitle">
              <span>Full Stack</span>
              <span>Developer</span>
            </h2>
            <p>
              Passionate Full Stack Developer specializing in building secure,
              scalable, and responsive web applications using React.js,
              Node.js, Express.js, JavaScript, and MySQL/TiDB. Experienced in
              RESTful APIs, JWT authentication, and clean, maintainable code.
            </p>
            <div className="hero__actions">
              <Link to="/projects" className="btn btn--acid btn--pill">
                View Work
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <a
                href="/Mayuresh_Kasar_Resume.pdf"
                download
                className="btn btn--outline btn--pill"
              >
                Resume
                <Download size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="hero__watermark" aria-hidden="true">
          Fullstack
        </div>
      </section>

      <Marquee />

      <StatsBand />

      <section className="page-section capabilities grid-acid">
        <div className="section__inner">
          <div className="section-head">
            <div className="reveal">
              <p className="meta text-ink">What I do / End to end</p>
              <h2 className="display section-title">Built to ship.</h2>
            </div>
            <p className="meta text-ink reveal" style={{ "--delay": "100ms" }}>
              Frontend → API → Database → Deploy
            </p>
          </div>

          <div className="capability-grid">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="capability-card reveal"
                  style={{ "--delay": `${index * 110}ms` }}
                >
                  <span className="capability-card__icon">
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <h3 className="capability-card__title">{item.title}</h3>
                  <p className="capability-card__text">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-cta grid-pink">
        <div className="home-cta__inner">
          <div className="reveal">
            <h2 className="display home-cta__title">
              Have an idea?
              <br />
              Let&apos;s build it.
            </h2>
            <p className="meta home-cta__meta">
              Open to full-time roles &amp; freelance projects
            </p>
          </div>
          <Link to="/contact" className="btn btn--black btn--pill reveal">
            Start a project
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
