import { Link } from "react-router-dom";
import { ArrowUpRight, Download } from "lucide-react";

export default function About() {
  return (
    <section className="page page-section about-section grid-pink">
      <div className="section__inner">
        <div className="section-head">
          <div className="reveal">
            <p className="meta text-ink">About / 01</p>
            <h2 className="display section-title">
              Who am
              <br />
              I?
            </h2>
          </div>
          <p className="meta text-ink reveal" style={{ "--delay": "100ms" }}>
            Full Stack Developer / India
          </p>
        </div>

        <div className="about-grid">
          <div className="about-portrait reveal">
            <div className="about-portrait__frame">
              <img
                src="/Profile.png"
                alt="Portrait of Mayuresh Kasar"
                loading="lazy"
                decoding="async"
              />
            </div>
            <span className="badge-rotate about-portrait__badge">
              Based in India
            </span>
          </div>

          <div
            className="about-copy reveal"
            style={{ "--delay": "140ms" }}
          >
            <p className="about-copy__quote">
              I build secure, scalable products — with clean code and interfaces
              that don&apos;t hide.
            </p>

            <p className="about-copy__body">
              I&apos;m Mayuresh Kasar, a passionate Full Stack Developer with
              hands-on experience building secure, responsive, and scalable web
              applications using React.js, Node.js, Express.js, JavaScript, and
              MySQL/TiDB. I enjoy designing modern user interfaces, developing
              RESTful APIs, and creating efficient backend systems following
              clean architecture principles. I am also familiar with Linux
              (Ubuntu), Docker fundamentals, Git, and cloud-based deployment,
              and I&apos;m always eager to learn new technologies while building
              real-world software solutions.
            </p>

            <div className="about-facts">
              <div className="about-fact">
                <span className="about-fact__label">Name</span>
                <span className="about-fact__value">Mayuresh Kasar</span>
              </div>
              <div className="about-fact">
                <span className="about-fact__label">Location</span>
                <span className="about-fact__value">Maharashtra, India</span>
              </div>
              <div className="about-fact">
                <span className="about-fact__label">Email</span>
                <span className="about-fact__value">
                  kasarmayuresh99@gmail.com
                </span>
              </div>
              <div className="about-fact">
                <span className="about-fact__label">Status</span>
                <span className="about-fact__value">Available for hire</span>
              </div>
            </div>

            <div className="about-actions">
              <a
                href="/Mayuresh_Kasar_Resume.pdf"
                download
                className="btn btn--black btn--pill"
              >
                Download resume
                <Download size={16} aria-hidden="true" />
              </a>
              <Link to="/projects" className="btn btn--pill">
                See my work
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
