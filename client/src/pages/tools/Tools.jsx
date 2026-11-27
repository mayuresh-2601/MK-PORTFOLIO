import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "../../components/common/SEO";
import {
  buildGradient,
  checkContrast,
  decodeBase64,
  decodeHtml,
  decodeJwt,
  decodeUrl,
  encodeBase64,
  encodeHtml,
  encodeUrl,
  formatDuration,
  formatJson,
  generateUuidV4,
  HASH_ALGORITHMS,
  hashText,
  HTTP_STATUS_CODES,
  inspectTimestamp,
  testRegex,
  TOOL_DEFINITIONS,
  validateJson,
} from "../../lib/devtools";

const useClipboard = () => {
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const copy = useCallback(async (text) => {
    if (!text) return;
    if (timer.current) window.clearTimeout(timer.current);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }

    timer.current = window.setTimeout(() => setStatus("idle"), 2400);
  }, []);

  return { status, copy };
};

const CopyButton = ({ text, label = "Copy" }) => {
  const { status, copy } = useClipboard();
  const message =
    status === "copied"
      ? "Copied to clipboard."
      : status === "error"
        ? "Copy failed. Select the text and copy it manually."
        : "";

  return (
    <span className="tool-copy">
      <button
        type="button"
        className={`tool__copy${status === "error" ? " is-error" : ""}`}
        onClick={() => copy(text)}
        disabled={!text}
      >
        {status === "copied" ? "Copied" : status === "error" ? "Copy failed" : label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {message}
      </span>
    </span>
  );
};

export default function Tools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTool = searchParams.get("tool");
  const tool =
    TOOL_DEFINITIONS.find((t) => t.id === requestedTool) || TOOL_DEFINITIONS[0];
  const activeTool = tool.id;
  return (
    <section className="page page-section tool-section grid-acid">
      <SEO
        title="Developer Tools | Mayuresh Kasar — Full Stack Developer"
        description="Free browser-based developer tools: JSON formatter, Base64, URL and HTML codecs, regex tester, JWT decoder with expiry, UUID v4 generator, SHA hashes, Unix timestamp converter, WCAG contrast checker, CSS gradient builder and HTTP status reference. All tools run locally."
        path="/tools"
      />

      <div className="section__inner">
        <div className="tool-head">
          <div className="reveal">
            <p className="meta text-ink">
              Tools / {String(TOOL_DEFINITIONS.length).padStart(2, "0")}
            </p>
            <h1 className="display section-title">Developer toolkit</h1>
          </div>
          <p className="meta text-ink reveal" style={{ "--delay": "100ms" }}>
            Browser-based utilities. Nothing is sent anywhere; every tool runs
            locally in this page.
          </p>
        </div>

        <div className="tool-layout" aria-label="Developer tools">
          <nav className="tool-nav" aria-label="Tool categories">
            {TOOL_DEFINITIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tool-nav__item${t.id === activeTool ? " is-active" : ""}`}
                onClick={() => setSearchParams({ tool: t.id })}
                aria-pressed={t.id === activeTool}
              >
                {t.name}
              </button>
            ))}
          </nav>

          <div className="tool-content">
            <h2 className="tool-content__title">{tool.name}</h2>
            <p className="meta text-ink tool-content__desc">{tool.description}</p>
            <div className="tool-panels">
              {activeTool === "json" && <JsonTool />}
              {activeTool === "base64" && <Base64Tool />}
              {activeTool === "url" && <UrlTool />}
              {activeTool === "html" && <HtmlTool />}
              {activeTool === "regex" && <RegexTool />}
              {activeTool === "jwt" && <JwtTool />}
              {activeTool === "uuid" && <UuidTool />}
              {activeTool === "hash" && <HashTool />}
              {activeTool === "timestamp" && <TimestampTool />}
              {activeTool === "contrast" && <ContrastTool />}
              {activeTool === "gradient" && <GradientTool />}
              {activeTool === "http" && <HttpStatusTool />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const ResultBlock = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="tool-result">
      <span className="tool-result__label">{label}</span>
      <pre className="tool-result__value">{value}</pre>
    </div>
  );
};

function JsonTool() {
  const [input, setInput] = useState('{ "b": 2, "a": [1, 2, 3] }');
  const format = useMemo(() => formatJson(input, 2), [input]);
  const valid = useMemo(() => validateJson(input), [input]);
  return (
    <>
      <label htmlFor="json-input" className="tool-label">
        JSON input
      </label>
      <textarea
        id="json-input"
        className="tool-textarea"
        rows={6}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
      />
      <div className="tool-status">
        {format.ok ? <p className="tool-status__ok">Valid JSON.</p> : <p className="tool-status__err">{format.error}</p>}
        {!valid.ok && !format.ok && <p className="tool-status__err">{valid.error}</p>}
      </div>
      <ResultBlock label="Formatted output" value={format.ok ? format.value : null} />
      <CopyButton text={format.ok ? format.value : ""} label="Copy formatted" />
    </>
  );
}

function Base64Tool() {
  const [input, setInput] = useState("Mayuresh — कार्य 🚀");
  const encoded = useMemo(() => encodeBase64(input), [input]);
  const decoded = useMemo(() => decodeBase64(encoded.value || ""), [encoded]);
  return (
    <>
      <label htmlFor="b64-input" className="tool-label">
        Text to encode
      </label>
      <textarea
        id="b64-input"
        className="tool-textarea"
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <ResultBlock label="Base64 (UTF-8)" value={encoded.ok ? encoded.value : null} />
      <CopyButton text={encoded.ok ? encoded.value : ""} label="Copy base64" />
      <ResultBlock label="Decoded back" value={decoded.ok ? decoded.value : null} />
    </>
  );
}

function UrlTool() {
  const [input, setInput] = useState("name=Mayuresh Kasar&city=Pune");
  const encoded = useMemo(() => encodeUrl(input), [input]);
  const decoded = useMemo(() => decodeUrl(encoded.value || ""), [encoded]);
  return (
    <>
      <label htmlFor="url-input" className="tool-label">
        Text to encode
      </label>
      <textarea
        id="url-input"
        className="tool-textarea"
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <ResultBlock label="Percent-encoded" value={encoded.ok ? encoded.value : null} />
      <CopyButton text={encoded.ok ? encoded.value : ""} label="Copy encoded" />
      <ResultBlock label="Decoded back" value={decoded.ok ? decoded.value : null} />
    </>
  );
}

function HtmlTool() {
  const [input, setInput] = useState('<a href="https://example.com?a=1&b=2">Link &amp; more</a>');
  const encoded = useMemo(() => encodeHtml(input), [input]);
  const decoded = useMemo(() => decodeHtml(encoded || ""), [encoded]);
  return (
    <>
      <label htmlFor="html-input" className="tool-label">
        HTML text
      </label>
      <textarea
        id="html-input"
        className="tool-textarea"
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <ResultBlock label="Escaped" value={encoded} />
      <CopyButton text={encoded} label="Copy escaped" />
      <ResultBlock label="Decoded back" value={decoded} />
    </>
  );
}

function RegexTool() {
  const [pattern, setPattern] = useState("(\\d+)-(\\d+)");
  const [flags, setFlags] = useState("g");
  const [input, setInput] = useState("12-34 and 56-78");
  const result = useMemo(
    () => testRegex({ pattern, flags, input }),
    [pattern, flags, input]
  );
  return (
    <>
      <label htmlFor="regex-pattern" className="tool-label">
        Pattern
      </label>
      <input
        id="regex-pattern"
        type="text"
        className="tool-input"
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
      />
      <label htmlFor="regex-flags" className="tool-label">
        Flags
      </label>
      <input
        id="regex-flags"
        type="text"
        className="tool-input"
        value={flags}
        onChange={(e) => setFlags(e.target.value)}
      />
      <label htmlFor="regex-input" className="tool-label">
        Input
      </label>
      <input
        id="regex-input"
        type="text"
        className="tool-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {result.ok ? (
        <ul className="tool-matches">
          {result.matches.map((m, i) => (
            <li key={i} className="tool-match">
              <span className="tool-match__index">#{i + 1}</span>
              <code>{m.match}</code>
              {m.groups?.some(Boolean) && <code className="tool-match__groups">{m.groups.filter(Boolean).join(" · ")}</code>}
            </li>
          ))}
          {result.matches.length === 0 && <li>No matches found.</li>}
        </ul>
      ) : (
        <p className="tool-status__err">{result.error}</p>
      )}
    </>
  );
}

function JwtTool() {
  const [token, setToken] = useState("");
  const result = useMemo(() => decodeJwt(token), [token]);
  return (
    <>
      <label htmlFor="jwt-token" className="tool-label">
        JWT token
      </label>
      <textarea
        id="jwt-token"
        className="tool-textarea"
        rows={4}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />
      {result.ok ? (
        <>
          <ResultBlock label="Header" value={JSON.stringify(result.header, null, 2)} />
          <ResultBlock label="Payload" value={JSON.stringify(result.payload, null, 2)} />
          <CopyButton
            text={JSON.stringify(result.header, null, 2) + "\n" + JSON.stringify(result.payload, null, 2)}
            label="Copy decoded"
          />
          {result.times?.issuedAt && (
            <ResultBlock
              label="Issued at (UTC)"
              value={result.times.issuedAt.iso}
            />
          )}
          {result.times?.notBefore && (
            <ResultBlock
              label="Not valid before (UTC)"
              value={result.times.notBefore.iso}
            />
          )}
          {result.times?.expiresAt ? (
            <>
              <ResultBlock
                label="Expires at (UTC)"
                value={result.times.expiresAt.iso}
              />
              <ResultBlock
                label="Expiry state"
                value={
                  result.times.expired
                    ? `Expired ${formatDuration(result.times.expiresInSeconds)} ago`
                    : `Valid for ${formatDuration(result.times.expiresInSeconds)}`
                }
              />
            </>
          ) : (
            <p className="tool-status__warn">
              This token has no <code>exp</code> claim, so its expiry cannot be
              determined.
            </p>
          )}
          {result.warning && <p className="tool-status__warn">{result.warning}</p>}
        </>
      ) : (
        <p className="tool-status__err">{result.error}</p>
      )}
    </>
  );
}

function UuidTool() {
  const [result, setResult] = useState(() => generateUuidV4());

  return (
    <>
      <p className="tool-hint">
        RFC 4122 version 4 UUIDs carry 122 random bits, a fixed version nibble
        and an RFC variant. They are identifiers, not secrets.
      </p>
      <div className="tool-actions">
        <button
          type="button"
          className="tool-action"
          onClick={() => setResult(generateUuidV4())}
        >
          Generate another
        </button>
        <CopyButton text={result.ok ? result.value : ""} label="Copy UUID" />
      </div>
      {result.ok ? (
        <>
          <ResultBlock label="UUID v4" value={result.value} />
          <dl className="tool-facts">
            <div>
              <dt>Version</dt>
              <dd>4 (random)</dd>
            </div>
            <div>
              <dt>Variant</dt>
              <dd>RFC 4122 / 10xx</dd>
            </div>
            <div>
              <dt>Secure source</dt>
              <dd>Web Crypto getRandomValues</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="tool-status__err">{result.error}</p>
      )}
    </>
  );
}

function HashTool() {
  const [input, setInput] = useState("Mayuresh — portfolio");
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);

    hashText(input, algorithm).then((next) => {
      if (!cancelled) setResult(next);
    });

    return () => {
      cancelled = true;
    };
  }, [input, algorithm]);

  return (
    <>
      <label htmlFor="hash-algorithm" className="tool-label">
        Algorithm
      </label>
      <select
        id="hash-algorithm"
        className="tool-input"
        value={algorithm}
        onChange={(e) => setAlgorithm(e.target.value)}
      >
        {HASH_ALGORITHMS.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <label htmlFor="hash-input" className="tool-label">
        Text to hash
      </label>
      <textarea
        id="hash-input"
        className="tool-textarea"
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {result?.ok ? (
        <>
          <ResultBlock
            label={`${result.algorithm} hex digest · ${result.bits} bits`}
            value={result.value}
          />
          <CopyButton text={result.value} label="Copy digest" />
        </>
      ) : result?.error ? (
        <p className="tool-status__err">{result.error}</p>
      ) : (
        <p className="tool-status__warn">Hashing locally…</p>
      )}
      <p className="tool-hint">
        Hashing is one-way and does not encrypt. A bare SHA digest is not a
        password storage format; passwords need a salted, slow KDF such as
        bcrypt, scrypt or Argon2.
      </p>
    </>
  );
}

function TimestampTool() {
  const [input, setInput] = useState(() =>
    String(Math.floor(Date.now() / 1000))
  );
  const result = useMemo(() => inspectTimestamp(input), [input]);
  const localTime = result.ok
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "full",
        timeStyle: "long",
      }).format(new Date(result.milliseconds))
    : null;

  return (
    <>
      <label htmlFor="timestamp-input" className="tool-label">
        Unix seconds, Unix milliseconds or ISO 8601
      </label>
      <input
        id="timestamp-input"
        type="text"
        className="tool-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="tool-actions">
        <button
          type="button"
          className="tool-action"
          onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
        >
          Use current time
        </button>
        <CopyButton
          text={result.ok ? result.iso : ""}
          label="Copy ISO 8601"
        />
      </div>
      {result.ok ? (
        <>
          <ResultBlock label="Detected input" value={result.unit} />
          <ResultBlock label="Unix seconds" value={String(result.seconds)} />
          <ResultBlock label="Unix milliseconds" value={String(result.milliseconds)} />
          <ResultBlock label="ISO 8601 (UTC)" value={result.iso} />
          <ResultBlock label="UTC" value={result.utc} />
          <ResultBlock label="Local time" value={localTime} />
        </>
      ) : (
        <p className="tool-status__err">{result.error}</p>
      )}
      <p className="tool-hint">
        Numeric input with up to 10 digits is treated as seconds; longer input
        is treated as milliseconds. Unix time counts seconds since 1970-01-01
        UTC and ignores leap seconds.
      </p>
    </>
  );
}

const CONTRAST_CHECKS = [
  { key: "normalTextAA", label: "Normal text", standard: "AA", threshold: "4.5:1" },
  { key: "normalTextAAA", label: "Normal text", standard: "AAA", threshold: "7:1" },
  { key: "largeTextAA", label: "Large text", standard: "AA", threshold: "3:1" },
  { key: "largeTextAAA", label: "Large text", standard: "AAA", threshold: "4.5:1" },
  { key: "uiComponents", label: "UI and graphics", standard: "AA", threshold: "3:1" },
];

const pickerValue = (value) =>
  /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";

function ColorField({ id, label, value, onChange }) {
  return (
    <div className="tool-color-field">
      <label htmlFor={`${id}-text`} className="tool-label">
        {label}
      </label>
      <div className="tool-color-control">
        <input
          type="color"
          className="tool-color-picker"
          value={pickerValue(value)}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} colour picker`}
        />
        <input
          id={`${id}-text`}
          type="text"
          className="tool-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

function ContrastTool() {
  const [foreground, setForeground] = useState("#111111");
  const [background, setBackground] = useState("#CCFF00");
  const result = useMemo(
    () => checkContrast(foreground, background),
    [foreground, background]
  );

  return (
    <>
      <div className="tool-color-grid">
        <ColorField
          id="contrast-foreground"
          label="Text colour"
          value={foreground}
          onChange={setForeground}
        />
        <ColorField
          id="contrast-background"
          label="Background colour"
          value={background}
          onChange={setBackground}
        />
      </div>
      <div
        className="tool-contrast__preview"
        style={{
          background: result.ok ? result.background : "#FFFFFF",
          color: result.ok ? result.foreground : "#000000",
        }}
      >
        <p className="tool-contrast__large">Large text sample</p>
        <p>Normal body text sample.</p>
      </div>
      {result.ok ? (
        <div className="tool-contrast__report" role="status">
          <p className="tool-contrast__ratio">
            <strong>{result.ratioText}:1</strong> contrast ratio
          </p>
          <ul className="tool-contrast__checks">
            {CONTRAST_CHECKS.map((check) => (
              <li key={check.key}>
                <span>
                  {check.label} · {check.standard} ({check.threshold})
                </span>
                <strong className="tool-contrast__verdict">
                  {result[check.key] ? "Pass" : "Fail"}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="tool-status__err" role="status">
          {result.error}
        </p>
      )}
      <p className="tool-hint">
        WCAG 2.2 thresholds: 4.5:1 for normal text (AA), 3:1 for large text and
        UI components, 7:1 for normal text at AAA and 4.5:1 for large text at
        AAA. Large text is at least 24 px, or 18.66 px when bold. The ratio is
        symmetric for a colour pair.
      </p>
    </>
  );
}

function GradientTool() {
  const [type, setType] = useState("linear");
  const [angle, setAngle] = useState("90");
  const [stopsText, setStopsText] = useState(
    "  { color: '#CCFF00', position: 0 }\n  { color: '#000000', position: 100 }"
  );
  const result = useMemo(() => {
    const stops = stopsText
      .split(";")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const colorMatch = chunk.match(/color:\s*['"]?([^'",)]+)/i);
        const posMatch = chunk.match(/position:\s*([^,]+)/i);
        return {
          color: colorMatch?.[1]?.trim(),
          position: posMatch ? posMatch[1].trim() : undefined,
        };
      })
      .filter((s) => s.color);
    return buildGradient({
      type,
      angle,
      stops: stops.length ? stops : undefined,
    });
  }, [type, angle, stopsText]);

  return (
    <>
      <label htmlFor="gradient-type" className="tool-label">
        Gradient type
      </label>
      <select
        id="gradient-type"
        className="tool-input"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="linear">linear</option>
        <option value="radial">radial</option>
      </select>
      {type === "linear" && (
        <>
          <label htmlFor="gradient-angle" className="tool-label">
            Angle (deg)
          </label>
          <input
            id="gradient-angle"
            type="number"
            min="0"
            max="359"
            className="tool-input"
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
          />
        </>
      )}
      <label htmlFor="gradient-stops" className="tool-label">
        Colour stops (semicolon-separated, e.g. "color: #fff; color: #000")
      </label>
      <textarea
        id="gradient-stops"
        className="tool-textarea"
        rows={3}
        value={stopsText}
        onChange={(e) => setStopsText(e.target.value)}
      />
      {result.ok ? (
        <div className="tool-gradient" style={{ background: result.css }}>
          <code className="tool-gradient__code">{result.css}</code>
        </div>
      ) : (
        <p className="tool-status__err">{result.error}</p>
      )}
    </>
  );
}

function HttpStatusTool() {
  const [codeText, setCodeText] = useState("404");
  const matches = useMemo(
    () => HTTP_STATUS_CODES.filter((entry) => String(entry.code).includes(codeText.trim())),
    [codeText]
  );
  return (
    <>
      <label htmlFor="http-code" className="tool-label">
        HTTP status code
      </label>
      <input
        id="http-code"
        type="text"
        className="tool-input"
        value={codeText}
        onChange={(e) => setCodeText(e.target.value)}
      />
      {matches.length > 0 ? (
        <ul className="tool-matches">
          {matches.map((m) => (
            <li key={m.code} className="tool-match">
              <span className="tool-match__index">{m.code}</span>
              <code>{m.label}</code>
              <span className="tool-match__category">{m.category}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tool-status__warn">No status codes match.</p>
      )}
    </>
  );
}
