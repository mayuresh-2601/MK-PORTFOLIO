import { useState, useEffect } from "react";
import {
  ExternalLink,
  Award,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";
import AIExplainModal from "../../components/common/AIExplainModal";
import SEO from "../../components/common/SEO";
import { safeExternalUrl } from "../../utils/safeUrl";

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCert, setActiveCert] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/certificates");

      // Supports both:
      // [{...}]
      // { success:true, data:[...] }
      const certificatesData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
        ? response.data.data
        : [];

      setCertificates(certificatesData);
    } catch (err) {
      console.error("Failed to fetch certificates:", err);
      setCertificates([]);
      setError(
        err.response?.data?.message ||
          "Unable to load certificates. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page page-section certificates-section grid-pink">
      <SEO
        title="Certificates | Mayuresh Kasar"
        description="Verified certificates of Mayuresh Kasar across React, JavaScript, Node.js, SQL, Python, Java, Angular, REST APIs, problem solving and software engineering."
        path="/certificates"
      />

      <div className="section__inner">
        <div className="section-head">
          <div className="reveal">
            <p className="meta text-ink">Credentials / 04</p>
            <h1 className="display section-title">
              My
              <br />
              Certificates
            </h1>
          </div>
          <p className="meta text-ink reveal" style={{ "--delay": "100ms" }}>
            Licenses / certifications / proof
          </p>
        </div>

        <p className="lede reveal" style={{ marginBottom: "2.5rem" }}>
          Licenses, certifications, and technical accomplishments — each one a
          checkpoint on the way to better software.
        </p>

        {loading && (
          <div className="state-panel reveal">
            <Loader2
              size={40}
              className="spin state-panel__icon"
              aria-hidden="true"
            />
            <h3 className="state-panel__title">Loading certificates</h3>
            <p className="state-panel__text">
              Fetching credentials from the portfolio API...
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
            <h3 className="state-panel__title">
              Failed to load certificates
            </h3>
            <p className="state-panel__text">{error}</p>
            <button
              type="button"
              onClick={fetchCertificates}
              className="btn btn--black btn--pill"
              style={{ marginTop: "1.5rem" }}
            >
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && certificates.length === 0 && (
          <div className="state-panel reveal">
            <Award
              size={44}
              className="state-panel__icon"
              aria-hidden="true"
            />
            <h3 className="state-panel__title">No certificates available</h3>
            <p className="state-panel__text">
              Certificates will appear here after being added from the admin
              dashboard.
            </p>
          </div>
        )}

        {!loading && !error && certificates.length > 0 && (
          <div className="cert-grid">
            {certificates.map((cert, index) => {
              // Credential links come from the database; only render absolute
              // HTTP(S) URLs so a bad row cannot become a script link.
              const certificateUrl = safeExternalUrl(cert.link);
              return (
                <article
                  key={cert.id}
                  className="cert-card reveal"
                  style={{ "--delay": `${Math.min(index, 8) * 80}ms` }}
                >
                  {cert.image && (
                    <div className="cert-card__media">
                      <img
                        src={cert.image}
                        alt={cert.title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src =
                            "/placeholder-project.png";
                        }}
                      />
                    </div>
                  )}

                  <div className="cert-card__body">
                    <p className="cert-card__issuer">
                      <Award size={14} aria-hidden="true" />
                      {cert.issuer}
                    </p>

                    <button
                      type="button"
                      onClick={() => setActiveCert(cert)}
                      className="cert-card__title"
                      title="Ask AI to explain this certificate"
                    >
                      {cert.title}
                      <Sparkles size={14} aria-hidden="true" />
                    </button>

                    {certificateUrl && (
                      <a
                        href={certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cert-card__link"
                      >
                        View credential
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <AIExplainModal
        open={!!activeCert}
        onClose={() => setActiveCert(null)}
        title={activeCert ? activeCert.title : ""}
        endpoint="/ai/explain-certificate"
        payload={
          activeCert
            ? { title: activeCert.title, issuer: activeCert.issuer }
            : {}
        }
      />
    </section>
  );
}
