import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Loader2, AlertCircle } from "lucide-react";
import api from "../../api/axios";

/**
 * AIExplainModal
 *
 * Generic "explain this in plain language" popup. Pass an `endpoint`
 * (relative to /api) and a `payload` — the modal handles loading state,
 * errors, and the fetch itself, so Skills.jsx and Certificates.jsx only
 * need a couple of lines each to use it.
 */
export default function AIExplainModal({
  open,
  onClose,
  title,
  endpoint,
  payload,
}) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");

  const cardRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setLoading(true);
    setError("");
    setExplanation("");

    api
      .post(endpoint, payload)
      .then((res) => {
        if (!cancelled) {
          setExplanation(res.data.explanation || res.data.answer || "");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Couldn't load an explanation right now. Please try again shortly."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, endpoint, JSON.stringify(payload)]);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocusedRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // The dialog is mounted by the time this effect runs; focus it now so
    // keyboard users never land behind an open modal.
    closeButtonRef.current?.focus({ preventScroll: true });

    const getFocusable = () =>
      Array.from(
        cardRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      ).filter((element) => element.offsetParent !== null);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();

      if (focusable.length === 0) {
        event.preventDefault();
        cardRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outsideCard = !cardRef.current?.contains(active);

      if (event.shiftKey && (active === first || outsideCard)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outsideCard)) {
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
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={cardRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-explain-title"
        aria-describedby="ai-explain-body"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="modal-kicker">
              <Sparkles size={14} aria-hidden="true" />
              AI Explain
            </p>
            <h3 className="modal-title" id="ai-explain-title">
              {title}
            </h3>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close explanation"
            className="modal-close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body" id="ai-explain-body">
          {loading && (
            <div className="modal-loading">
              <Loader2 size={18} className="spin" aria-hidden="true" />
              Thinking it through...
            </div>
          )}

          {!loading && error && (
            <div className="modal-error">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && explanation && (
            <p className="modal-text">{explanation}</p>
          )}
        </div>
      </div>
    </div>
  );
}
