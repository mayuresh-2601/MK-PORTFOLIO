import { Link } from "react-router-dom";
import LegalPage from "../../components/common/LegalPage";
import { CONTACT_EMAIL, CONTACT_EMAIL_LINK } from "../../config/site";

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Use"
      description="The rules for using this portfolio, its developer tools, and its contact form."
      path="/terms"
      updated="22 November 2026"
    >
      <p>
        By using this website you agree to these terms. If you do not agree,
        please stop using the site.
      </p>

      <h2>Purpose of the site</h2>
      <p>
        This is a personal portfolio. It presents Mayuresh Kasar&apos;s work,
        skills, certificates, articles, and developer tools. It is informational
        and does not create an employment, consulting, or client relationship.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not attempt to access the admin area without authorisation.</li>
        <li>
          Do not use the contact form or AI explainers to send spam, malware,
          unlawful content, or another person&apos;s private data.
        </li>
        <li>
          Do not probe, scrape at a disruptive rate, or interfere with the
          availability of the site or API.
        </li>
        <li>
          Do not upload files you do not have permission to share. Uploaded
          files are checked for type and, when configured, malware.
        </li>
      </ul>

      <h2>Developer tools</h2>
      <p>
        The browser tools process input locally in your browser. They are
        provided as-is for convenience. The JWT decoder displays the header and
        payload only; it does not verify the signature and must not be treated
        as proof that a token is valid. Never paste a production secret into any
        tool.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The site&apos;s original text, design, and source code are owned by
        Mayuresh Kasar unless a file states otherwise. The repository is
        published under the licence included with it. Third-party names and
        logos remain the property of their owners.
      </p>

      <h2>External links</h2>
      <p>
        Links to GitHub, LinkedIn, certificate issuers, and other sites are
        provided for context. Those sites are not controlled by this portfolio
        and have their own terms and privacy policies.
      </p>

      <h2>Availability and warranties</h2>
      <p>
        The site is provided without warranties of any kind, to the extent
        permitted by law. Content may be incomplete, out of date, or
        temporarily unavailable. The owner does not guarantee uninterrupted
        access or that every external link will keep working.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, the owner is not liable for indirect or
        consequential loss arising from use of the site, reliance on its
        content, or use of a developer tool. Nothing in these terms excludes
        liability that cannot lawfully be excluded.
      </p>

      <h2>Privacy</h2>
      <p>
        The <Link to="/privacy">privacy policy</Link> explains what the site
        stores and how to request deletion.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India. Disputes are subject to
        the jurisdiction of the courts of Maharashtra, India.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to{" "}
        <a href={CONTACT_EMAIL_LINK}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
