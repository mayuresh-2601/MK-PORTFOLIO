import { useEffect, useState } from "react";
import {
  Code2,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";
import AIExplainModal from "../../components/common/AIExplainModal";

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSkill, setActiveSkill] = useState(null);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/skills");

      // Supports both:
      // [{...}]
      // { success:true, data:[...] }
      const skillsData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
        ? response.data.data
        : [];

      setSkills(skillsData);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
      setSkills([]);
      setError(
        err.response?.data?.message ||
          "Unable to load skills. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page page-section skills-section grid-acid">
      <div className="section__inner">
        <div className="section-head">
          <div className="reveal">
            <p className="meta text-ink">Stack / 02</p>
            <h2 className="display section-title">
              Technical
              <br />
              Skills
            </h2>
          </div>
          <p className="meta text-ink reveal" style={{ "--delay": "100ms" }}>
            Click a skill name → AI explains it
          </p>
        </div>

        <p className="lede reveal" style={{ marginBottom: "2.5rem" }}>
          A collection of technologies, programming languages, frameworks,
          databases, and development tools I use to build secure, scalable, and
          modern web applications.
        </p>

        {loading && (
          <div className="state-panel reveal">
            <Loader2
              size={40}
              className="spin state-panel__icon"
              aria-hidden="true"
            />
            <h3 className="state-panel__title">Loading stack</h3>
            <p className="state-panel__text">
              Fetching skills from the portfolio API...
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
            <h3 className="state-panel__title">Failed to load skills</h3>
            <p className="state-panel__text">{error}</p>
            <button
              type="button"
              onClick={fetchSkills}
              className="btn btn--black btn--pill"
              style={{ marginTop: "1.5rem" }}
            >
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && skills.length === 0 && (
          <div className="state-panel reveal">
            <Code2
              size={44}
              className="state-panel__icon"
              aria-hidden="true"
            />
            <h3 className="state-panel__title">No skills available</h3>
            <p className="state-panel__text">
              Skills will appear here after being added from the admin
              dashboard.
            </p>
          </div>
        )}

        {!loading && !error && skills.length > 0 && (
          <div className="skill-grid">
            {skills.map((skill, index) => {
              const level = skill.level ?? 80;
              return (
                <article
                  key={skill.id}
                  className="skill-card reveal"
                  style={{ "--delay": `${Math.min(index, 8) * 70}ms` }}
                >
                  <div className="skill-card__top">
                    <span className="skill-card__index">
                      {String(index + 1).padStart(2, "0")} /
                    </span>
                    <span className="skill-card__level">{level}%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSkill(skill)}
                    className="skill-card__name"
                    title="Ask AI to explain this skill"
                  >
                    {skill.name}
                    <Sparkles size={16} aria-hidden="true" />
                  </button>

                  <div
                    className="skill-bar"
                    role="progressbar"
                    aria-label={skill.name}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={level}
                  >
                    <div
                      className="skill-bar__fill"
                      style={{ width: `${Math.min(100, level)}%` }}
                    />
                  </div>

                  <p className="skill-card__hint">
                    Click name for an AI explainer
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <AIExplainModal
        open={!!activeSkill}
        onClose={() => setActiveSkill(null)}
        title={activeSkill ? `What is ${activeSkill.name}?` : ""}
        endpoint="/ai/explain-skill"
        payload={
          activeSkill
            ? { name: activeSkill.name, level: activeSkill.level }
            : {}
        }
      />
    </section>
  );
}
