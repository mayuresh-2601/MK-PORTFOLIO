import { Link } from "react-router-dom";
import LegalPage from "../../components/common/LegalPage";
import { CONTACT_EMAIL, CONTACT_EMAIL_LINK } from "../../config/site";

export default function Accessibility() {
  return (
    <LegalPage
      title="Accessibility Statement"
      description="How this portfolio approaches keyboard access, screen readers, motion, contrast, and feedback."
      path="/accessibility"
      updated="22 November 2026"
    >
      <p>
        Mayuresh Kasar wants this portfolio to be usable by visitors with
        different devices, input methods, and assistive technologies. The site
        is built with accessibility in mind, but it has not been independently
        audited and full conformance is not claimed.
      </p>

      <h2>Target</h2>
      <p>
        The site aims to meet the Web Content Accessibility Guidelines (WCAG)
        2.1 Level AA. That target guides the semantic structure, keyboard
        behaviour, focus styles, colour choices, and motion handling in the
        repository. Where a limitation is known, it is listed below.
      </p>

      <h2>What is implemented</h2>
      <ul>
        <li>A skip-to-content link is the first focusable element on every public page.</li>
        <li>Pages use landmark elements: header, navigation, main, and footer.</li>
        <li>Keyboard focus is visible on links, buttons, and form controls.</li>
        <li>Decorative animation is disabled when the operating system requests reduced motion.</li>
        <li>Images that carry meaning use alternative text; purely decorative shapes are hidden from assistive technology.</li>
        <li>The mobile navigation can be opened and closed with a keyboard, and its state is announced.</li>
        <li>Form fields have visible labels, and errors are shown as text rather than colour alone.</li>
        <li>The developer tools use native form controls and expose their state in text.</li>
      </ul>

      <h2>Known limitations</h2>
      <ul>
        <li>
          The site uses large display type and high-contrast blocks. Some custom
          layouts have not been tested with every screen reader and browser
          combination.
        </li>
        <li>
          Certificate and project images are supplied by the owner. Their
          alternative text is only as good as the description attached to each
          record.
        </li>
        <li>
          The blog code samples can be long. Horizontal scrolling may be needed
          on very narrow screens.
        </li>
        <li>
          The site is a client-rendered React application. Visitors who disable
          JavaScript get a limited static fallback, not the full interactive
          experience.
        </li>
      </ul>

      <h2>Feedback</h2>
      <p>
        If a page or tool is difficult to use, send the page address and a short
        description of the barrier to{" "}
        <a href={CONTACT_EMAIL_LINK}>{CONTACT_EMAIL}</a>. Reports are reviewed and
        fixed where practical. Please do not include passwords or other secrets.
      </p>

      <h2>Related pages</h2>
      <p>
        Read the <Link to="/privacy">privacy policy</Link> and the{" "}
        <Link to="/terms">terms of use</Link>.
      </p>
    </LegalPage>
  );
}
