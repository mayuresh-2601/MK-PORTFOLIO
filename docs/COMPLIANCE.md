# Compliance and Policy Notes

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Engineering notes, not legal advice
**Version:** 1.0
**Last updated:** 2026-11-22
**Public pages:** [/privacy](https://mk-portfolio-phi-silk.vercel.app/privacy) · [/terms](https://mk-portfolio-phi-silk.vercel.app/terms) · [/accessibility](https://mk-portfolio-phi-silk.vercel.app/accessibility)
**Related:** [DATA_RETENTION.md](./DATA_RETENTION.md) · [THREAT_MODEL.md](./THREAT_MODEL.md) · [SECURITY.md](./SECURITY.md)

This document records what the application actually does. It is not a legal
opinion and does not certify compliance with any law. The owner should obtain
professional advice before making a compliance claim or handling a formal
complaint.

## 1. Data protection (India)

The site is a personal portfolio operated from Maharashtra, India. The main
personal data is a contact message (name, email, subject, message, optional
attachment), plus server logs containing IP addresses.

Engineering controls that support the **Digital Personal Data Protection Act,
2023** principles:

| Principle | Implementation |
|---|---|
| Notice and purpose | `/privacy` explains what is collected, why, where it goes, and how long it is kept |
| Purpose limitation | Contact data is used to reply; logs and security events are used for availability and abuse investigation; no advertising |
| Data minimisation | No visitor accounts, no phone number, no address, no payment data, no analytics by default |
| Accuracy and correction | A visitor can ask for correction using the contact address |
| Erasure | The owner deletes the message row, related attachment and notification on request |
| Security safeguards | bcrypt admin credential, HttpOnly session cookie, CSRF, rate limits, parameterized SQL, upload validation, TLS |
| Retention | Documented schedule; contact messages reviewed at least every 12 months; sessions expire and are purged |
| Grievance | The public contact address is the first point of contact; the privacy page also points to the Data Protection Board of India |
| Breach response | [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) covers containment, evidence and notification decisions |

Whether the DPDP Act applies in full, and what formal grievance or breach
notification steps are required, depends on facts the code cannot determine.
That is an owner/counsel decision.

## 2. Visitors from the EU/UK

The site can be read worldwide. It does not set advertising or analytics
cookies by default. The only application cookie is the admin session cookie,
which is strictly necessary for the private admin area and is not set for
ordinary visitors.

If Google Analytics 4 is enabled later:

- it must be disclosed on `/privacy`;
- the CSP must allow the Google domains;
- a consent mechanism may be required before non-essential analytics cookies
  or identifiers are set;
- IP anonymisation and data retention settings must be configured;
- the change must be reviewed against the EU/UK cookie rules before launch.

No GDPR/UK GDPR compliance claim is made. The privacy page describes the
processing in plain language and provides access/deletion contact details.

## 3. Cookies

| Cookie | Set for | Purpose | Consent |
|---|---|---|---|
| `__Host-portfolio_session` (production) | Admin after login | Authenticate the admin session | Strictly necessary |
| `portfolio_session` (local HTTP) | Admin after login | Same, without the `Secure`/`__Host-` requirements | Strictly necessary |
| Google Analytics cookies | Nobody by default | Disabled; see [ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md) | Would require review |

There is no cookie banner because there are no non-essential cookies in the
default build. Enabling analytics or any third-party embed invalidates that
statement and requires a new review.

## 4. Accessibility

The site targets **WCAG 2.1 Level AA**. The public
[accessibility statement](https://mk-portfolio-phi-silk.vercel.app/accessibility)
lists implemented features and known limitations. The site has not been
independently audited, and no conformance claim is made. Automated axe tests
are not in CI because adding that dependency requires owner approval.

## 5. Security disclosure

`/.well-known/security.txt` gives a contact address, expiry, canonical URL and
a link to [SECURITY.md](./SECURITY.md). There is no bug bounty and no promise
of a response time beyond the owner's best effort. Do not send secrets or
another person's data in a report.

## 6. Content, licences and third parties

- Original site content and code are MIT licensed; see `LICENSE`.
- Third-party names, logos and certificate issuer marks remain the property of
  their owners.
- Vercel, Render, TiDB Cloud, Cloudinary, Google Gemini and Gmail process data
  under their own terms. Some may process data outside India; `/privacy`
  discloses this.
- The AI explainer is not an automated decision with legal or similarly
  significant effect. It produces explanatory text and can be wrong.

## 7. Owner actions before any compliance claim

- [ ] Have counsel confirm DPDP applicability, notice wording and grievance
      handling for a personal portfolio.
- [ ] Confirm provider data-processing terms and regions for Vercel, Render,
      TiDB, Cloudinary, Google Gemini and Gmail.
- [ ] Decide whether a formal grievance officer is required as the site grows.
- [ ] If analytics is enabled, add consent review, CSP changes and a policy
      update before launch.
- [ ] Complete an independent accessibility audit before claiming WCAG
      conformance.
- [ ] Keep the public policy pages and this document consistent whenever data
      handling changes.

## 8. What this document does not do

- It does not certify DPDP, GDPR, WCAG or any other compliance regime.
- It does not replace provider terms or a lawyer's review.
- It does not claim that every visitor request has been tested end to end.
