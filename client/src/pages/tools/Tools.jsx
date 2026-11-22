import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "../../components/common/SEO";
import {
  buildGradient,
  decodeBase64,
  decodeHtml,
  decodeJwt,
  decodeUrl,
  encodeBase64,
  encodeHtml,
  encodeUrl,
  formatJson,
  HTTP_STATUS_CODES,
  testRegex,
  TOOL_DEFINITIONS,
  validateJson,
} from "../../lib/devtools";

const useClipboard = () => {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);
  return { copied, copy };
};

const CopyButton = ({ text, label = "Copy" }) => {
  const { copied, copy } = useClipboard();
  return (
    <button type="button" className="tool__copy" onClick={() => copy(text)}>
      {copied ? "Copied" : label}
    </button>
  );
};

export default function Tools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTool = searchParams.get("tool") || TOOL_DEFINITIONS[0].id;
  const tool = TOOL_DEFINITIONS.find((t) => t.id === activeTool);
  return (
    <section className="page page-section tool-section grid-acid">
      <SEO
        title="Developer Tools | Mayuresh Kasar — Full Stack Developer"
        description="Free browser-based developer tools: JSON formatter, validator, Base64 and URL encoders, HTML entity encoder, regex tester, JWT decoder, CSS gradient generator and HTTP status reference. All tools run locally."
        path="/tools"
      />

      <div className="section__inner">
        <div className="tool-head">
          <div className="reveal">
            <p className="meta text-ink">Tools / 12</p>
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
          {result.warning && <p className="tool-status__warn">{result.warning}</p>}
        </>
      ) : (
        <p className="tool-status__err">{result.error}</p>
      )}
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
