import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  Upload,
  LogOut,
  Plus,
  FolderKanban,
  Code2,
  Award,
  ExternalLink,
  Inbox,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";

const emptyProject = {
  title: "",
  description: "",
  github: "",
  demo: "",
  imageFile: null,
};

const emptySkill = { name: "", level: 80 };

const emptyCertificate = {
  title: "",
  issuer: "",
  link: "",
  imageFile: null,
};

export default function AdminDashboard() {
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [messages, setMessages] = useState([]);

  const [projectForm, setProjectForm] = useState(emptyProject);
  const [skillForm, setSkillForm] = useState(emptySkill);
  const [certForm, setCertForm] = useState(emptyCertificate);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        api.get("/projects"),
        api.get("/skills"),
        api.get("/certificates"),
        api.get("/messages"),
      ]);

      const extract = (result) => {
        if (result.status !== "fulfilled") return [];

        const payload = result.value.data;

        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;

        return [];
      };

      setProjects(extract(results[0]));
      setSkills(extract(results[1]));
      setCertificates(extract(results[2]));
      setMessages(extract(results[3]));

      const failed = results.find(
        (result) => result.status === "rejected"
      );

      if (failed) {
        console.error(
          "Failed to load part of the dashboard data:",
          failed.reason
        );

        setFeedback({
          type: "error",
          text:
            failed.reason?.response?.data?.message ||
            "Some dashboard data could not be loaded. Is the API running?",
        });
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);

      setProjects([]);
      setSkills([]);
      setCertificates([]);
      setMessages([]);

      setFeedback({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to load dashboard data. Is the API running?",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const addProject = async (event) => {
    event.preventDefault();

    if (!projectForm.title || !projectForm.description || !projectForm.imageFile) {
      setFeedback({
        type: "error",
        text: "Title, description, and image are required.",
      });
      return;
    }

    try {
      setLoading(true);
      setFeedback({ type: "", text: "" });

      const data = new FormData();
      data.append("title", projectForm.title);
      data.append("description", projectForm.description);
      data.append("github", projectForm.github);
      data.append("demo", projectForm.demo);
      data.append("image", projectForm.imageFile);

      await api.post("/projects", data);

      setProjectForm(emptyProject);
      setFeedback({ type: "success", text: "Project added successfully." });
      await loadData();
    } catch (error) {
      console.error("Failed to add project:", error);
      setFeedback({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to add project. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (event) => {
    event.preventDefault();

    if (!skillForm.name.trim()) {
      setFeedback({ type: "error", text: "Skill name is required." });
      return;
    }

    try {
      setLoading(true);
      setFeedback({ type: "", text: "" });

      await api.post("/skills", {
        name: skillForm.name.trim(),
        level: Number(skillForm.level) || 0,
      });

      setSkillForm(emptySkill);
      setFeedback({ type: "success", text: "Skill added successfully." });
      await loadData();
    } catch (error) {
      console.error("Failed to add skill:", error);
      setFeedback({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to add skill. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCertificate = async (event) => {
    event.preventDefault();

    if (!certForm.title.trim()) {
      setFeedback({
        type: "error",
        text: "Certificate title is required.",
      });
      return;
    }

    try {
      setLoading(true);
      setFeedback({ type: "", text: "" });

      const data = new FormData();
      data.append("title", certForm.title);
      data.append("issuer", certForm.issuer);
      data.append("link", certForm.link);

      if (certForm.imageFile) {
        data.append("image", certForm.imageFile);
      }

      await api.post("/certificates", data);

      setCertForm(emptyCertificate);
      setFeedback({
        type: "success",
        text: "Certificate added successfully.",
      });
      await loadData();
    } catch (error) {
      console.error("Failed to add certificate:", error);
      setFeedback({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to add certificate. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (endpoint, id) => {
    if (!window.confirm("Confirm deletion?")) return;

    try {
      setFeedback({ type: "", text: "" });
      await api.delete(`/${endpoint}/${id}`);
      await loadData();
      setFeedback({ type: "success", text: "Item deleted." });
    } catch (error) {
      console.error(`Failed to delete ${endpoint} item:`, error);
      setFeedback({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to delete item. Please try again.",
      });
    }
  };

  return (
    <div className="admin-page grid-acid">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="meta text-pink">Control room / Admin</p>
            <h1>Admin dashboard</h1>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            <Link to="/" className="btn btn--acid btn--sm btn--pill">
              <ExternalLink size={14} aria-hidden="true" />
              View site
            </Link>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="btn btn--black btn--sm btn--pill"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn--pink btn--sm btn--pill"
            >
              <LogOut size={14} aria-hidden="true" />
              Logout
            </button>
          </div>
        </header>

        {feedback.text && (
          <div
            className={`form-status form-status--${
              feedback.type === "success" ? "success" : "error"
            }`}
            role={feedback.type === "success" ? "status" : "alert"}
            style={{ marginTop: "1.5rem" }}
          >
            {feedback.text}
          </div>
        )}

        <div className="admin-grid">
          {/* PROJECTS CONTROL */}
          <section className="admin-card">
            <h2>
              <FolderKanban size={18} aria-hidden="true" />
              Manage projects
            </h2>

            <form onSubmit={addProject}>
              <input
                placeholder="Project title"
                aria-label="Project title"
                value={projectForm.title}
                onChange={(event) =>
                  setProjectForm({
                    ...projectForm,
                    title: event.target.value,
                  })
                }
                className="admin-input"
              />
              <textarea
                placeholder="Description"
                aria-label="Project description"
                rows={3}
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm({
                    ...projectForm,
                    description: event.target.value,
                  })
                }
                className="admin-input"
                style={{ resize: "vertical" }}
              />
              <input
                placeholder="GitHub link"
                aria-label="GitHub link"
                value={projectForm.github}
                onChange={(event) =>
                  setProjectForm({
                    ...projectForm,
                    github: event.target.value,
                  })
                }
                className="admin-input"
              />
              <input
                placeholder="Live demo link"
                aria-label="Live demo link"
                value={projectForm.demo}
                onChange={(event) =>
                  setProjectForm({
                    ...projectForm,
                    demo: event.target.value,
                  })
                }
                className="admin-input"
              />
              <label className="admin-file">
                <Upload size={16} aria-hidden="true" />
                <span>
                  {projectForm.imageFile
                    ? projectForm.imageFile.name
                    : "Upload image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      imageFile: event.target.files[0],
                    })
                  }
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn btn--black btn--pill btn--wide"
              >
                <Plus size={16} aria-hidden="true" />
                Add project
              </button>
            </form>

            <div className="admin-list">
              {projects.length === 0 && (
                <p className="meta meta--muted">No projects yet.</p>
              )}
              {projects.map((project) => (
                <div key={project.id} className="admin-list-item">
                  <span>{project.title}</span>
                  <button
                    type="button"
                    onClick={() => deleteItem("projects", project.id)}
                    className="admin-delete"
                    aria-label={`Delete ${project.title}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SKILLS CONTROL */}
          <section className="admin-card">
            <h2>
              <Code2 size={18} aria-hidden="true" />
              Manage skills
            </h2>

            <form onSubmit={addSkill}>
              <input
                placeholder="Skill name"
                aria-label="Skill name"
                value={skillForm.name}
                onChange={(event) =>
                  setSkillForm({ ...skillForm, name: event.target.value })
                }
                className="admin-input"
              />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Proficiency %"
                aria-label="Skill proficiency percentage"
                value={skillForm.level}
                onChange={(event) =>
                  setSkillForm({ ...skillForm, level: event.target.value })
                }
                className="admin-input"
              />

              <button
                type="submit"
                disabled={loading}
                className="btn btn--acid btn--pill btn--wide"
              >
                <Plus size={16} aria-hidden="true" />
                Add skill
              </button>
            </form>

            <div className="admin-list">
              {skills.length === 0 && (
                <p className="meta meta--muted">No skills yet.</p>
              )}
              {skills.map((skill) => (
                <div key={skill.id} className="admin-list-item">
                  <span>
                    {skill.name} ({skill.level}%)
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteItem("skills", skill.id)}
                    className="admin-delete"
                    aria-label={`Delete ${skill.name}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* CERTIFICATES CONTROL */}
          <section className="admin-card">
            <h2>
              <Award size={18} aria-hidden="true" />
              Manage certificates
            </h2>

            <form onSubmit={addCertificate}>
              <input
                placeholder="Certificate title"
                aria-label="Certificate title"
                value={certForm.title}
                onChange={(event) =>
                  setCertForm({ ...certForm, title: event.target.value })
                }
                className="admin-input"
              />
              <input
                placeholder="Issuer"
                aria-label="Certificate issuer"
                value={certForm.issuer}
                onChange={(event) =>
                  setCertForm({ ...certForm, issuer: event.target.value })
                }
                className="admin-input"
              />
              <input
                placeholder="Certificate link"
                aria-label="Certificate link"
                value={certForm.link}
                onChange={(event) =>
                  setCertForm({ ...certForm, link: event.target.value })
                }
                className="admin-input"
              />
              <label className="admin-file">
                <Upload size={16} aria-hidden="true" />
                <span>
                  {certForm.imageFile
                    ? certForm.imageFile.name
                    : "Upload image (optional)"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setCertForm({
                      ...certForm,
                      imageFile: event.target.files[0],
                    })
                  }
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn btn--pink btn--pill btn--wide"
              >
                <Plus size={16} aria-hidden="true" />
                Add certificate
              </button>
            </form>

            <div className="admin-list">
              {certificates.length === 0 && (
                <p className="meta meta--muted">No certificates yet.</p>
              )}
              {certificates.map((certificate) => (
                <div key={certificate.id} className="admin-list-item">
                  <span>{certificate.title}</span>
                  <button
                    type="button"
                    onClick={() =>
                      deleteItem("certificates", certificate.id)
                    }
                    className="admin-delete"
                    aria-label={`Delete ${certificate.title}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* CONTACT MESSAGES INBOX */}
          <section className="admin-card">
            <h2>
              <Inbox size={18} aria-hidden="true" />
              Contact inbox
            </h2>

            <p className="meta meta--muted">
              {messages.length === 0
                ? "No messages yet."
                : `${messages.length} ${
                    messages.length === 1 ? "message" : "messages"
                  } received`}
            </p>

            <div className="admin-list">
              {messages.map((message) => (
                <article key={message.id} className="admin-message">
                  <div className="admin-message__body">
                    <div className="admin-message__head">
                      <span>{message.name}</span>
                      <a href={`mailto:${message.email}`}>
                        {message.email}
                      </a>
                    </div>

                    <p className="admin-message__subject">
                      {message.subject || "Portfolio Contact Form"}
                    </p>

                    <p className="admin-message__text">
                      {message.message}
                    </p>

                    <p className="admin-message__meta">
                      {message.created_at
                        ? new Date(
                            message.created_at
                          ).toLocaleString()
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteItem("messages", message.id)}
                    className="admin-delete"
                    aria-label={`Delete message from ${message.name}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
