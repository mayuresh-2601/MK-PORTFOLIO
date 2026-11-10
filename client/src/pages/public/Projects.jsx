import { useState, useEffect } from "react";
import {
  ExternalLink,
  FolderOpen,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";
import GithubIcon from "../../assets/GithubIcon";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/projects");

      // Supports both:
      // [{...}]
      // { success: true, data: [...] }
      const projectsData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
        ? response.data.data
        : [];

      setProjects(projectsData);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjects([]);
      setError(
        err.response?.data?.message ||
          "Unable to load projects. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page page-section work-section grid-acid">
      <div className="section__inner">
        <div className="section-head">
          <div className="reveal">
            <p className="meta text-ink">Work / 03</p>
            <h2 className="display section-title">
              Featured
              <br />
              Projects
            </h2>
          </div>
          <p className="meta text-ink reveal" style={{ "--delay": "100ms" }}>
            Selected projects / Full stack
          </p>
        </div>

        <p className="lede reveal" style={{ marginBottom: "2.5rem" }}>
          Explore some of my featured full-stack applications built using
          React.js, Node.js, Express.js, MySQL/TiDB, and modern web
          technologies with a focus on performance, scalability, and user
          experience.
        </p>

        {loading && (
          <div className="state-panel reveal">
            <Loader2
              size={40}
              className="spin state-panel__icon"
              aria-hidden="true"
            />
            <h3 className="state-panel__title">Loading projects</h3>
            <p className="state-panel__text">
              Pulling the latest work from the portfolio API...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="state-panel state-panel--error reveal">
            <AlertCircle
              size={40}
              className="state-panel__icon"
              aria-hidden="true"
            />
            <h3 className="state-panel__title">Failed to load projects</h3>
            <p className="state-panel__text">{error}</p>
            <button
              type="button"
              onClick={fetchProjects}
              className="btn btn--black btn--pill"
              style={{ marginTop: "1.5rem" }}
            >
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="state-panel reveal">
            <FolderOpen
              size={44}
              className="state-panel__icon"
              aria-hidden="true"
            />
            <h3 className="state-panel__title">No projects available</h3>
            <p className="state-panel__text">
              Projects will appear here once they are added from the admin
              dashboard.
            </p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="work-grid">
            {projects.map((project, index) => {
              const primaryLink = project.demo || project.github;
              return (
                <article
                  key={project.id}
                  className="work-card reveal"
                  style={{ "--delay": `${Math.min(index, 8) * 80}ms` }}
                >
                  <div className="work-card__media">
                    <div className="work-card__img">
                      <img
                        src={project.image || "/placeholder-project.png"}
                        alt={project.title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = "/placeholder-project.png";
                        }}
                      />
                    </div>

                    {primaryLink && (
                      <a
                        href={primaryLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="work-card__badge"
                        aria-label={`Open ${project.title}`}
                      >
                        <ArrowUpRight size={22} aria-hidden="true" />
                      </a>
                    )}
                  </div>

                  <div className="work-card__body">
                    <p className="meta text-pink">
                      {String(index + 1).padStart(2, "0")} / Project
                    </p>
                    <h3 className="work-card__title">{project.title}</h3>
                    <p className="work-card__desc">{project.description}</p>

                    <div className="work-card__links">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="work-card__link"
                        >
                          <GithubIcon size={14} />
                          Source
                        </a>
                      )}

                      {project.demo && (
                        <a
                          href={project.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="work-card__link"
                        >
                          <ExternalLink size={14} aria-hidden="true" />
                          Live demo
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
