import { useEffect, useRef, useState } from "react";
import {
  Cpu,
  MemoryStick,
  Server,
  GitBranch,
  Sparkles,
  Terminal,
  Send,
  Loader2,
  MessageSquare,
} from "lucide-react";
import api from "../../api/axios";
import SEO from "../../components/common/SEO";

const POLL_INTERVAL_MS = 5000;

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="system-card">
      <div className="system-card__label">
        <Icon size={15} aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="system-card__value">{value}</div>
      {sub && <div className="system-card__sub">{sub}</div>}
    </div>
  );
}

function ProgressBar({ percent }) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div
      className="system-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={width}
    >
      <div className="system-bar__fill" style={{ width: `${width}%` }} />
    </div>
  );
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function System() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [terminalLines, setTerminalLines] = useState([
    "$ connecting to live server metrics...",
  ]);

  const [chatQuestion, setChatQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const terminalBodyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let timer;

    // Poll after each response instead of on a fixed interval. On a Render
    // cold start one request can outlive several 5-second ticks, and the old
    // interval fired overlapping requests that resolved out of order.
    const poll = async () => {
      try {
        const res = await api.get("/system");
        if (cancelled) return;
        const data = res.data.data;
        setSnapshot(data);
        setError("");
        setLastUpdatedAt(new Date());

        setTerminalLines((previous) => {
          const next = [
            ...previous,
            `$ uptime -> up ${formatUptime(data.uptimeSeconds)}, load ${data.cpu.loadPercent}%`,
            `$ free -> ${data.memory.usedPercent}% memory in use`,
            `$ ai status -> ${data.services.ai}`,
            data.deployment.commit
              ? `$ deployed commit -> ${data.deployment.commit}`
              : null,
          ].filter(Boolean);
          return next.slice(-14); // keep terminal from growing forever
        });
      } catch {
        if (!cancelled) {
          setError(
            "Live metrics unavailable right now — backend may be waking up (free-tier cold start)."
          );
        }
      } finally {
        if (!cancelled) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Keep the terminal pinned to its newest line without scrolling the
  // whole page to the terminal panel. `scrollIntoView` on a child element
  // would hijack the visitor's page position every time telemetry polls.
  useEffect(() => {
    const node = terminalBodyRef.current;
    if (!node) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    node.scrollTo({
      top: node.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [terminalLines]);

  const handleAsk = async (event) => {
    event.preventDefault();
    const question = chatQuestion.trim();
    if (!question || chatLoading) return;

    setChatHistory((previous) => [
      ...previous,
      { role: "user", text: question },
    ]);
    setChatQuestion("");
    setChatLoading(true);

    try {
      const res = await api.post("/ai/ask-about-me", { question });
      setChatHistory((previous) => [
        ...previous,
        {
          role: "ai",
          text:
            res.data.answer ||
            "No answer was returned. Please try again shortly.",
        },
      ]);
    } catch (err) {
      setChatHistory((previous) => [
        ...previous,
        {
          role: "ai",
          text:
            err.response?.data?.message ||
            "Couldn't reach the AI assistant right now — please try again shortly.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <section className="page page-section system-page grid-dark">
      <SEO
        title="Live System Metrics | Mayuresh Kasar"
        description="Live telemetry from the portfolio API: CPU load, memory usage, uptime and AI availability, refreshed every few seconds."
        path="/system"
      />

      <div className="section__inner">
        <div className="section-head">
          <div className="reveal">
            <p className="meta text-pink">Live telemetry / 06</p>
            <h1 className="display section-title">
              Live
              <br />
              System
            </h1>
          </div>
          <p className="meta reveal" style={{ color: "#d1d5db", "--delay": "100ms" }}>
            Real metrics / refreshed every 5s
          </p>
        </div>

        <p className="lede reveal" style={{ color: "#d1d5db", marginBottom: "2.5rem" }}>
          Real metrics pulled live from the API this site runs on — proof that
          the backend is live, measured, and actively rate-limited, not just a
          claim on a resume.
        </p>

        {error && (
          <div className="system-error reveal" role="status" style={{ marginBottom: "1.5rem" }}>
            {error}
            {snapshot && lastUpdatedAt
              ? ` Showing the last reading from ${lastUpdatedAt.toLocaleTimeString()}.`
              : ""}
          </div>
        )}

        <div className="system-grid reveal">
          <StatCard
            icon={Cpu}
            label="CPU Load"
            value={snapshot ? `${snapshot.cpu.loadPercent}%` : "—"}
            sub={snapshot ? "1-minute average" : "Waiting..."}
          />
          <StatCard
            icon={MemoryStick}
            label="Memory"
            value={snapshot ? `${snapshot.memory.usedPercent}%` : "—"}
            sub={snapshot ? "Of host memory" : "Waiting..."}
          />
          <StatCard
            icon={Server}
            label="Uptime"
            value={snapshot ? formatUptime(snapshot.uptimeSeconds) : "—"}
            sub="API process"
          />
          <StatCard
            icon={Sparkles}
            label="AI Assistant"
            value={
              snapshot
                ? snapshot.services.ai === "available"
                  ? "Online"
                  : "Paused"
                : "—"
            }
            sub={snapshot ? "Rate-limited" : "Waiting..."}
          />
        </div>

        {snapshot && (
          <div className="system-bars reveal" style={{ "--delay": "120ms" }}>
            <div>
              <div className="system-bar__head">
                <span>CPU</span>
                <span>{snapshot.cpu.loadPercent}%</span>
              </div>
              <ProgressBar percent={snapshot.cpu.loadPercent} />
            </div>
            <div>
              <div className="system-bar__head">
                <span>Memory</span>
                <span>{snapshot.memory.usedPercent}%</span>
              </div>
              <ProgressBar percent={snapshot.memory.usedPercent} />
            </div>
          </div>
        )}

        <div className="system-lower">
          {/* Terminal-style live log */}
          <div className="system-panel reveal">
            <div className="system-panel__head">
              <Terminal size={16} aria-hidden="true" />
              <span>Live server log</span>
            </div>
            <div ref={terminalBodyRef} className="terminal-body">
              {terminalLines.map((line, index) => (
                <div key={index} className="terminal-line">
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Ask AI about me */}
          <div
            className="system-panel reveal"
            style={{ "--delay": "120ms" }}
          >
            <div className="system-panel__head">
              <MessageSquare size={16} aria-hidden="true" />
              <span>Ask AI about Mayuresh</span>
            </div>

            <div className="chat-body">
              {chatHistory.length === 0 && (
                <p className="chat-empty">
                  Try: &quot;What DevOps skills does he have?&quot; or &quot;Is
                  he ready for a full-stack role?&quot;
                </p>
              )}
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`chat-msg ${
                    message.role === "user" ? "chat-msg--user" : "chat-msg--ai"
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {chatLoading && (
                <div className="chat-loading">
                  <Loader2 size={14} className="spin" aria-hidden="true" />
                  Thinking...
                </div>
              )}
            </div>

            <form onSubmit={handleAsk} className="chat-form">
              <input
                type="text"
                value={chatQuestion}
                onChange={(event) => setChatQuestion(event.target.value)}
                placeholder="Ask a question..."
                maxLength={300}
                className="chat-input"
                aria-label="Question for the AI assistant"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatQuestion.trim()}
                className="chat-send"
                aria-label="Send question"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>

        <div className="system-footer-note">
          <GitBranch size={14} aria-hidden="true" />
          {snapshot?.deployment.commit
            ? `Deployed from commit ${snapshot.deployment.commit}`
            : "Deployment metadata unavailable in this environment"}
        </div>
      </div>
    </section>
  );
}
