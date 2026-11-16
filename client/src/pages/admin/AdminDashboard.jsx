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
  Pencil,
  X,
  ShieldOff,
} from "lucide-react";
import api, { clearCsrfToken } from "../../api/axios";
import SEO from "../../components/common/SEO";

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

const emptyEditForm = {
  title: "",
  description: "",
  github: "",
  demo: "",
  name: "",
  level: 80,
  issuer: "",
  link: "",
  imageFile: null,
};

const EDIT_LABELS = {
  project: "project",
  skill: "skill",
  certificate: "certificate",
};

export default function AdminDashboard() {
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [messages, setMessages] = useState([]);

  const [projectForm, setProjectForm] = useState(emptyProject);
  const [skillForm, setSkillForm] = useState(emptySkill);
  const [certForm, setCertForm] = useState(emptyCertificate);

  // One exclusive operation at a time: "load" while fetching, or the name
  // of the write in progress. A single string prevents overlapping writes
  // and the shared-boolean races the dashboard used to have.
  const [pending, setPending] = useState("load");
  const loading = pending !== null;

  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loggingOut, setLoggingOut] = useState(false);

  // Editing state: { type, id } plus the values of the edited record.
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setPending("load");

      const results = await Promise.allSettled([
        api.get("/projects"),
        api.get("/skills"),
        api.get("/certificates"),
        api.get("/messages"),
      ]);

      const extract = (result) => {
        const payload = result.value.data;

        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;

        return [];
      };

      // Keep the last good list when one endpoint fails. Replacing a failed
      // section with [] used to show "No projects yet" beside an error.
      if (results[0].status === "fulfilled") {
        setProjects(extract(results[0]));
      }

      if (results[1].status === "fulfilled") {
        setSkills(extract(results[1]));
      }

      if (results[2].status === "fulfilled") {
        setCertificates(extract(results[2]));
      }

      if (results[3].status === "fulfilled") {
        setMessages(extract(results[3]));
      }

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

      setFeedback({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to load dashboard data. Is the API running?",
      });
    } finally {
      setPending(null);
    }
  };

  const finishLogout = () => {
    clearCsrfToken();

    try {
      sessionStorage.removeItem("portfolio_admin_hint");
    } catch {
      // Cosmetic only.
    }

    window.location.replace("/admin");
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await api.post("/auth/logout");
    } catch {
      // The cookie may already be expired or revoked. Clearing local state
      // and returning to the login screen is still the right outcome.
    } finally {
      finishLogout();
    }
  };

  const handleLogoutAll = async () => {
    if (loggingOut) return;

    if (
      !window.confirm(
        "Sign out of every device? All active admin sessions will be revoked."
      )
    ) {
      return;
    }

    setLoggingOut(true);

    try {
      await api.post("/auth/logout-all");
    } catch {
      // Fall through to the same local cleanup.
    } finally {
      finishLogout();
    }
  };

  /* 
     Edit
   */

  const startEdit = (type, item) => {
    if (pending) return;

    if (type === "skill") {
      setEditing({ type, id: item.id });
      setEditForm({
        ...emptyEditForm,
        name: item.name,
        level: item.level ?? 80,
      });
      return;
    }

    if (type === "certificate") {
      setEditing({ type, id: item.id });
      setEditForm({
        ...emptyEditForm,
        title: item.title ?? "",
        issuer: item.issuer ?? "",
        link: item.link ?? "",
      });
      return;
    }

    setEditing({ type: "project", id: item.id });
    setEditForm({
      ...emptyEditForm,
      title: item.title ?? "",
      description: item.description ?? "",
      github: item.github ?? "",
      demo: item.demo ?? "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm(emptyEditForm);
  };

  const saveEdit = async (event) => {
    event.preventDefault();

    if (!editing || pending) return;

    setPending("save");
    setFeedback({ type: "", text: "" });

    try {
      if (editing.type === "skill") {
        if (!editForm.name.trim()) {
          setFeedback({ type: "error", text: "Skill name is required." });
          return;
        }

        await api.put(`/skills/${editing.id}`, {
          name: editForm.name.trim(),
          level: Number(editForm.level) || 0,
        });
      } else if (editing.type === "certificate") {
        if (!editForm.title.trim()) {
          setFeedback({ type: "error", text: "Certificate title is required." });
          return;
        }

        const data = new FormData();
        data.append("title", editForm.title.trim());
        data.append("issuer", editForm.issuer.trim());
        data.append("link", editForm.link.trim());

        if (editForm.imageFile) {
          data.append("image", editForm.imageFile);
        }

        await api.put(`/certificates/${editing.id}`, data);
      } else {
        if (!editForm.title.trim() || !editForm.description.trim()) {
          setFeedback({
            type: "error",
            text: "Title and description are required.",
          });
          return;
        }

        const data = new FormData();
        data.append("title", editForm.title.trim());
        data.append("description", editForm.description.trim());
        data.append("github", editForm.github.trim());
        data.append("demo", editForm.demo.trim());

        if (editForm.imageFile) {
          data.append("image", editForm.imageFile);
        }

        await api.put(`/projects/${editing.id}`, data);
      }

      setFeedback({
        type: "success",
        text: `${EDIT_LABELS[editing.type].replace(/^./, (c) => c.toUpperCase())} updated successfully.`,
      });

      cancelEdit();

      await loadData();
    } catch (error) {
      console.error("Failed to update item:", error);
      setFeedback({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to update the item. Please try again.",
      });
    } finally {
      setPending(null);
    }
  };

  const addProject = async (event) => {
    event.preventDefault();

    if (pending) return;

    if (!projectForm.title || !projectForm.description || !projectForm.imageFile) {
      setFeedback({
        type: "error",
        text: "Title, description, and image are required.",
      });
      return;
    }

    setPending("add-project");
    setFeedback({ type: "", text: "" });

    try {
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
      setPending(null);
    }
  };

  const addSkill = async (event) => {
    event.preventDefault();

    if (pending) return;

    if (!skillForm.name.trim()) {
      setFeedback({ type: "error", text: "Skill name is required." });
      return;
    }

    setPending("add-skill");
    setFeedback({ type: "", text: "" });

    try {
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
      setPending(null);
    }
  };

  const addCertificate = async (event) => {
    event.preventDefault();

    if (pending) return;

    if (!certForm.title.trim()) {
      setFeedback({
        type: "error",
        text: "Certificate title is required.",
      });
      return;
    }

    setPending("add-certificate");
    setFeedback({ type: "", text: "" });

    try {
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
      setPending(null);
    }
  };

  const deleteItem = async (endpoint, id) => {
    if (pending) return;
    if (!window.confirm("Confirm deletion?")) return;

    setPending("delete");
    setFeedback({ type: "", text: "" });

    try {
      await api.delete(`/${endpoint}/${id}`);
      setFeedback({ type: "success", text: "Item deleted." });
      await loadData();
    } catch (error) {
      console.error(`Failed to delete ${endpoint} item:`, error);
      setFeedback({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to delete item. Please try again.",
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="admin-page grid-acid">
      <SEO
        title="Admin Dashboard | Mayuresh Kasar"
        description="Restricted admin dashboard for managing portfolio projects, skills, certificates and contact messages."
        path="/admin/dashboard"
        noIndex
      />

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
              onClick={handleLogoutAll}
              disabled={loggingOut}
              className="btn btn--black btn--sm btn--pill"
            >
              <ShieldOff size={14} aria-hidden="true" />
              Log out all
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
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

        {pending === "load" && (
          <div
            className="form-status"
            role="status"
            style={{ marginTop: "1.5rem" }}
          >
            Loading dashboard data...
          </div>
        )}

        {editing && (
          <section className="admin-card admin-card--edit">
            <h2>
              <Pencil size={18} aria-hidden="true" />
              Edit {EDIT_LABELS[editing.type]}
            </h2>

            <form onSubmit={saveEdit}>
              {editing.type === "skill" ? (
                <>
                  <input
                    placeholder="Skill name"
                    aria-label="Skill name"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm({ ...editForm, name: event.target.value })
                    }
                    className="admin-input"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Proficiency %"
                    aria-label="Skill proficiency percentage"
                    value={editForm.level}
                    onChange={(event) =>
                      setEditForm({ ...editForm, level: event.target.value })
                    }
                    className="admin-input"
                  />
                </>
              ) : (
                <>
                  <input
                    placeholder="Title"
                    aria-label="Title"
                    value={editForm.title}
                    onChange={(event) =>
                      setEditForm({ ...editForm, title: event.target.value })
                    }
                    className="admin-input"
                  />

                  {editing.type === "certificate" ? (
                    <>
                      <input
                        placeholder="Issuer"
                        aria-label="Issuer"
                        value={editForm.issuer}
                        onChange={(event) =>
                          setEditForm({ ...editForm, issuer: event.target.value })
                        }
                        className="admin-input"
                      />
                      <input
                        placeholder="Certificate link"
                        aria-label="Certificate link"
                        value={editForm.link}
                        onChange={(event) =>
                          setEditForm({ ...editForm, link: event.target.value })
                        }
                        className="admin-input"
                      />
                    </>
                  ) : (
                    <>
                      <textarea
                        placeholder="Description"
                        aria-label="Description"
                        rows={3}
                        value={editForm.description}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            description: event.target.value,
                          })
                        }
                        className="admin-input"
                        style={{ resize: "vertical" }}
                      />
                      <input
                        placeholder="GitHub link"
                        aria-label="GitHub link"
                        value={editForm.github}
                        onChange={(event) =>
                          setEditForm({ ...editForm, github: event.target.value })
                        }
                        className="admin-input"
                      />
                      <input
                        placeholder="Live demo link"
                        aria-label="Live demo link"
                        value={editForm.demo}
                        onChange={(event) =>
                          setEditForm({ ...editForm, demo: event.target.value })
                        }
                        className="admin-input"
                      />
                    </>
                  )}

                  <label className="admin-file">
                    <Upload size={16} aria-hidden="true" />
                    <span>
                      {editForm.imageFile
                        ? editForm.imageFile.name
                        : "Replace image (optional)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          imageFile: event.target.files[0],
                        })
                      }
                    />
                  </label>
                </>
              )}

              <div className="admin-edit__actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--black btn--pill"
                >
                  <Pencil size={16} aria-hidden="true" />
                  Save changes
                </button>

                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={loading}
                  className="btn btn--pill"
                >
                  <X size={16} aria-hidden="true" />
                  Cancel
                </button>
              </div>
            </form>
          </section>
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
              {pending !== "load" && projects.length === 0 && (
                <p className="meta meta--muted">No projects yet.</p>
              )}
              {projects.map((project) => (
                <div key={project.id} className="admin-list-item">
                  <span>{project.title}</span>
                  <span className="admin-list-item__actions">
                    <button
                      type="button"
                      onClick={() => startEdit("project", project)}
                      disabled={loading}
                      className="admin-edit"
                      aria-label={`Edit ${project.title}`}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem("projects", project.id)}
                      disabled={loading}
                      className="admin-delete"
                      aria-label={`Delete ${project.title}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </span>
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
              {pending !== "load" && skills.length === 0 && (
                <p className="meta meta--muted">No skills yet.</p>
              )}
              {skills.map((skill) => (
                <div key={skill.id} className="admin-list-item">
                  <span>
                    {skill.name} ({skill.level}%)
                  </span>
                  <span className="admin-list-item__actions">
                    <button
                      type="button"
                      onClick={() => startEdit("skill", skill)}
                      disabled={loading}
                      className="admin-edit"
                      aria-label={`Edit ${skill.name}`}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem("skills", skill.id)}
                      disabled={loading}
                      className="admin-delete"
                      aria-label={`Delete ${skill.name}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </span>
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
              {pending !== "load" && certificates.length === 0 && (
                <p className="meta meta--muted">No certificates yet.</p>
              )}
              {certificates.map((certificate) => (
                <div key={certificate.id} className="admin-list-item">
                  <span>{certificate.title}</span>
                  <span className="admin-list-item__actions">
                    <button
                      type="button"
                      onClick={() => startEdit("certificate", certificate)}
                      disabled={loading}
                      className="admin-edit"
                      aria-label={`Edit ${certificate.title}`}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        deleteItem("certificates", certificate.id)
                      }
                      disabled={loading}
                      className="admin-delete"
                      aria-label={`Delete ${certificate.title}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </span>
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

            {pending !== "load" && (
              <p className="meta meta--muted">
                {messages.length === 0
                  ? "No messages yet."
                  : `${messages.length} ${
                      messages.length === 1 ? "message" : "messages"
                    } received`}
              </p>
            )}

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
                    disabled={loading}
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
