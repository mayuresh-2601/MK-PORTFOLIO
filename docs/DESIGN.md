# Design System and UX Specification

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Source of truth for visual design and UX
**Version:** 1.0
**Last updated:** 2026-11-14
**Product source:** [PRD.md](./PRD.md)
**Implementation:** `client/src/index.css`, `client/src/components`, `client/src/pages`

---

## 1. Visual direction

### Kinetic Brutalism

The interface is built on a high-contrast, editorial, poster-like system: acid yellow-green and hot pink against near-black ink, heavy 3 px borders, hard offset shadows, oversized uppercase type, visible grids, and deliberate asymmetry.

It should feel like an independent design/engineering portfolio, not a generic SaaS landing page.

### Design principles

1. **Evidence over decoration.** Every visual device should support hierarchy, identity, or feedback. No ornamental gradients, glassmorphism, floating blobs, or stock illustration.
2. **Loud frame, quiet content.** Strong surfaces and type create identity; reading areas stay legible and uncluttered.
3. **One system, many pages.** Reuse tokens, buttons, cards, state panels, and page shells. No one-off styles for a single screen.
4. **Hard edges, honest feedback.** Borders, offset shadows, and visible states match the brutalist language. Loading, error, and disabled states must be obvious.
5. **Accessible by default.** High contrast, semantic structure, keyboard support, reduced motion, and visible focus are requirements, not polish.
6. **Mobile is not a shrink-wrap.** The layout reorders intentionally: portrait first on small screens, stacked forms, single-column cards, and a full-screen navigation overlay.

### What to avoid

- Purple/blue SaaS gradients, glass cards, soft neumorphism, or generic dashboard charts.
- Rounded cards with blurred shadows that conflict with the hard-edged system.
- Decorative animation that delays reading or ignores reduced-motion.
- White text on pink for body copy; use ink on pink.
- Gray body text on acid; use ink on acid.
- More than one primary action per view.

## 2. Colors

### Core tokens

| Token | Value | Role |
|---|---|---|
| `--acid` | `#CCFF00` | Primary surface, primary CTA, dark-surface accent |
| `--pink` | `#FF33CC` | Secondary surface, emphasis, errors, focus ring, badges |
| `--ink` | `#111111` | Text, borders, dark surfaces, hard shadows |
| `--white` | `#FFFFFF` | Cards, form fields, light text on ink |
| `--off` | `#F2F2F4` | Reserved neutral surface |
| `--gray` | `#6B7280` | Muted supporting text on white |
| Dark muted | `#D1D5DB` | Supporting text on ink/dark panels |

### Surface modes

| Class | Background | Grid | Typical use |
|---|---|---|---|
| `grid-acid` | Acid | 100 px ink grid at 9% opacity | Home hero, skills, projects, admin, 404 |
| `grid-pink` | Pink | 40 px ink grid at 9% opacity | About, certificates, home CTA |
| `grid-dark` | Ink | 40 px white grid at 5.5% opacity | Stats, footer, System page, dark cards |

### Contrast rules

Measured WCAG contrast ratios for the current palette:

| Foreground | Background | Ratio | Allowed use |
|---|---|---:|---|
| Ink `#111111` | Acid `#CCFF00` | 16.07:1 | All text and UI |
| Ink `#111111` | Pink `#FF33CC` | 5.93:1 | Body and large text |
| White `#FFFFFF` | Ink `#111111` | 18.88:1 | All text |
| Pink `#FF33CC` | Ink `#111111` | 5.93:1 | Accent text, icons |
| Gray `#6B7280` | White `#FFFFFF` | 4.83:1 | Small supporting text, passes normal text |
| Gray `#6B7280` | Acid `#CCFF00` | 4.11:1 | Do not use for normal-size body text |
| White `#FFFFFF` | Pink `#FF33CC` | 3.18:1 | Large text only; prefer ink |
| Pink `#FF33CC` | Acid `#CCFF00` | 2.71:1 | Non-text accent only; fails 3:1 UI/focus threshold |

**Known accessibility risk:** the global `:focus-visible` outline is pink on acid (2.71:1). On pink surfaces it can disappear. A future approved change should use a two-layer indicator, for example an ink outer ring plus a pink inner ring, or a white ring on dark surfaces. Until then, keyboard focus remains visible on white/ink areas but is weak on acid/pink.

## 3. Typography

### Families

| Family | Token | Use |
|---|---|---|
| Inter | `--font-sans` | Display headings, body copy, buttons |
| Space Mono | `--font-mono` | Kickers, metadata, labels, navigation, terminal, admin microcopy |

Both are self-hosted through `@fontsource` packages; no third-party font request is made at runtime.

### Type roles

| Role | Class | Size | Weight | Treatment |
|---|---|---|---|---|
| Page display | `.display` / `.section-title` | `clamp(3rem, 8vw, 7rem)` | 900 | Uppercase, `line-height: 0.88`, `letter-spacing: -0.065em` |
| Hero title | `.hero__title` | `clamp(2.9rem, 15.5vw, 5rem)` on mobile; larger on desktop | 900 | Stacked words, tight leading |
| Section display | `.display` | Contextual | 900 | Uppercase |
| Lede | `.lede` | `clamp(1rem, 1.4vw, 1.15rem)` | 500 | Max 62ch, 1.65 line-height |
| Body | default | 1rem | 500 | 1.5 line-height |
| Metadata | `.meta` | 0.7rem | 700 | Mono, uppercase, 0.16em tracking |
| Navigation | `.site-nav__link` | 0.66rem | 700 | Mono, uppercase, 0.08em tracking |
| Form label | `.form-label` | 0.64rem | 700 | Mono, uppercase, 0.12em tracking |
| Button | `.btn` | 0.72rem | 700 | Mono, uppercase, 0.09em tracking |
| Skill/title accents | Card titles | Contextual | 900 | Tight tracking |

### Typography rules

- One `h1` per page; section headings use `h2`, card titles `h3`.
- Display type is for short statements only. Never set paragraphs in `.display`.
- Body copy stays at a comfortable measure (45–75 characters).
- Do not use all-caps for long body text; reserve uppercase for labels, metadata, and display.
- Avoid faux italics and decorative script fonts.
- Keep mono text for metadata and UI chrome, not paragraphs.

## 4. Spacing, borders, and elevation

### Spacing scale

Use a 4 px base with a practical set: `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.25rem`, `1.5rem`, `2rem`, `2.5rem`, `3rem`, `4rem`, `5rem`, `7rem`.

| Context | Value |
|---|---|
| Page top padding | `calc(var(--nav-h) + 3rem)` |
| Section bottom padding | `clamp(4rem, 8vw, 7rem)` |
| Max content width | 1440 px |
| Horizontal gutter | 1.5rem |
| Section header gap | `1.25rem 2rem` |
| Card padding | 1.25–2rem |
| Form gap | 1rem |
| Grid gap | 1–2rem |

### Borders and shadows

| Token | Value | Use |
|---|---|---|
| `--border-w` | 3 px | Main borders |
| `--border` | `3px solid #111111` | Cards, inputs, buttons, panels |
| `--shadow-sm` | `4px 4px 0 #111111` | Buttons, small cards |
| `--shadow` | `8px 8px 0 #111111` | Cards, state panels, form panels |
| `--shadow-lg` | `12px 12px 0 #111111` | Hero/feature moments |
| `--shadow-pink` | `8px 8px 0 #FF33CC` | Error panels, pink-accent cards |
| `--shadow-acid` | `8px 8px 0 #CCFF00` | Acid-accent dark cards |

Rules:

- Shadows are hard offsets, never blurred.
- Interactive cards may translate toward the shadow on hover, reducing the visible offset.
- Do not mix multiple shadow colors on one element unless the hierarchy is intentional.
- Borders carry structure; do not rely on color alone to separate surfaces.

## 5. Layout system

### Shell

- Fixed navigation, 84 px tall on desktop, 72 px on small screens.
- Main content is offset by the nav height; anchors use `scroll-padding-top`.
- `.section__inner` centers content at a 1440 px max width with 1.5 rem gutters.
- `.page-section` closes with a 3 px ink border.
- The footer is full-bleed dark; the app shell keeps it at the bottom on short pages.

### Grids

| Layout | Desktop | Tablet | Mobile |
|---|---|---|---|
| Hero | 3 columns (identity / portrait / summary) | 2 columns, summary full width | 1 column, portrait first |
| Stats band | 4 columns | 2 columns | 1 column with separators |
| Capabilities | 3 columns | 1 column | 1 column |
| Skills | 3 columns | 2 columns | 1 column |
| Projects | 3 columns with staggered second card | 2 columns with stagger | 1 column |
| Certificates | 3 columns | 2 columns | 1 column |
| Contact | 2 columns | 1 column | 1 column |
| System cards | 4 columns | 2 columns | 1 column |
| Admin | 2 columns | 2 columns | 1 column |
| Footer | 4 columns | 2 columns | 1 column |

### Breakpoints

| Width | Behavior |
|---|---|
| `≤1180px` | Desktop nav links hide; menu button appears; full-screen overlay navigation |
| `≤1024px` | Hero becomes 2 columns; card grids and admin become 2 columns; contact stacks |
| `≤820px` | About stacks; stats become 2 columns; capabilities/system lower sections stack |
| `≤640px` | Nav height 72 px; hero/sections/cards/forms/footer become 1 column; watermark hidden; wordmark wraps |

## 6. Reusable components

### Buttons

| Variant | Use | Notes |
|---|---|---|
| `.btn--acid` | Primary on light/dark surfaces | Highest emphasis |
| `.btn--black` | Primary on acid/pink or neutral action | Acid text on ink |
| `.btn--pink` | Destructive or attention action | Ink text; never white body text |
| `.btn--outline` | Secondary on acid | Transparent background |
| `.btn--pill` | Rounded action | 999 px radius; the only intentionally rounded element besides avatars |
| `.btn--sm` | Dense admin/header actions | 0.65 rem label |
| `.btn--wide` | Full-width form/admin action | Use once per form |

States: default, hover (translate + shadow collapse), active (further translate), disabled (55% opacity, no transform), focus-visible (global ring).

### Cards

- `.brutal-card`: white, 3 px border, 8 px hard shadow.
- `.brutal-card--dark`: ink surface, white text.
- Content cards (`.skill-card`, `.work-card`, `.cert-card`, `.capability-card`, `.system-card`, `.admin-card`) follow the same border/shadow language.
- Project and certificate images use a fixed media ratio, `object-fit: cover`, lazy loading, and a placeholder fallback.
- Hover lifts the whole card and slightly scales media; motion is removed under reduced-motion.

### Tags and badges

- `.tag`: 2 px border, mono, uppercase, 0.62 rem; color variants acid/pink/ink.
- `.badge-rotate`: ink background, acid text, −3° rotation, small shadow; use sparingly for personality.
- Status counts use mono metadata, not pill badges.

### State panels

- White panel, 3 px border, 8 px hard shadow, centered content.
- Icon is pink; the title is uppercase and tight; supporting text is gray, max 48ch.
- Error variant uses a pink border and pink shadow.
- Dark variant uses ink background and light text.
- Every panel has one clear action when recovery is possible (for example, "Try again").

### Form controls

- White field, 3 px ink border, 0.95–1 rem padding.
- Label above the field, mono uppercase, explicit association via `htmlFor`/`id`.
- Focus moves the field −2 px and adds a pink hard shadow.
- Disabled controls drop to 60% opacity and remain readable.
- Placeholders are examples, never the only label.
- Error text is specific and appears near the form, announced with `role="alert"`.
- Success text uses `role="status"` and acid background.

### Modal

- Full-screen ink overlay with a centered white card, 3 px border, hard shadow.
- Used for AI explanations.
- Focus moves to the close button, Tab is trapped, Escape closes, focus returns to the trigger.
- Loading spinner and text; error icon and message; result text in a scrollable body.
- Background click closes; clicks inside the card do not.

### Navigation

- Fixed ink bar with acid text and a 3 px acid bottom border; pink border when scrolled.
- Desktop links are mono uppercase; active link uses a border, not color alone.
- Mobile uses a full-screen dialog with numbered links, focus trap, scroll lock, Escape, route-change close, and focus restoration.
- The Admin link appears only when a token exists.
- The skip link is the first focusable element and moves focus to `#main-content`.

### Footer

- Dark full-bleed surface with a striped accent, four columns, large outlined wordmark, and bottom ownership line.
- Links are white/acid, hover pink; social icons have accessible labels.
- The footer appears on all public routes, not on admin routes.

### System cards and terminal

- Dark page, acid headings, pink accents.
- Four stat cards: CPU, memory, uptime, environment.
- Progress bars use `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.
- Terminal panel shows the last 14 lines and scrolls internally, never hijacking the page.
- AI chat panel has an empty prompt, user/AI messages, loading indicator, and disabled send when empty.

### Admin components

- Admin pages use the same tokens but denser spacing.
- `.admin-card` groups one resource: projects, skills, certificates, messages.
- Forms use `.admin-input` with the same 3 px border and pink focus shadow.
- List rows show a title/name and icon buttons with explicit `aria-label`.
- Feedback uses the shared success/error banner.
- Edit mode opens a single panel above the grid and can be cancelled.
- Empty lists use muted metadata, not a full-page state panel.
- Destructive icon buttons are visually distinct (pink hover) and must not rely on color alone.

## 7. Navigation and information architecture

### Public navigation order

Home · About · Skills · Projects · Certificates · System · Contact

The order follows the evaluation journey: identity → background → capabilities → proof → credentials → operational depth → contact.

### Admin navigation

- `/admin` is a standalone login card; no public nav/footer.
- `/admin/dashboard` is a standalone control room; no public nav/footer.
- "View site" returns to `/`.
- "Refresh" reloads all dashboard data.
- "Logout" clears local auth and returns to `/admin`.
- Admin links in the public nav/footer are visible only when a token exists.

### Link rules

- Internal navigation uses the router; external links use `target="_blank"` with `rel="noopener noreferrer"`.
- Database-driven URLs must pass `safeExternalUrl`; only absolute HTTP(S) links render.
- Email uses `mailto:`; resume uses a same-origin download.
- No link should point to a placeholder or an unverified shortener.

## 8. Forms

### Contact form

Fields: full name, email, subject, message. All required in the current UI. Submit state disables every field and the button, and the label changes to "Sending message…".

Validation order:

1. Client checks empty fields and shows a form-level error.
2. Server validates types, lengths, email format, and required fields.
3. If a file is present, the server validates the text payload before uploading.
4. Success resets the form and shows a status banner.
5. Failure preserves the user's input and shows a specific server message when safe.

### Admin forms

- Project: title, description, GitHub URL, demo URL, required image for create; optional replacement image for edit.
- Skill: name, proficiency 0–100; default 80 when omitted.
- Certificate: title, issuer, optional link, optional image.
- Login: email and password; disabled while authenticating; generic error on failure.

### Form UX rules

- Never clear input on error.
- Never show a raw stack trace.
- Never claim success before the API confirms it.
- Keep the primary action visible on mobile.
- Use `autocomplete` for name/email/password fields.
- Do not use placeholder-only labels.

## 9. Loading, empty, and error states

| State | Pattern | Copy tone |
|---|---|---|
| Loading | Spinner icon + short title + one sentence | Direct, specific: "Fetching skills from the portfolio API…" |
| Empty | Relevant icon + title + explanation of how content appears | Helpful, not blaming the visitor |
| Recoverable error | Pink-shadow panel + specific message + Try again | Calm and actionable; no internal details |
| Non-blocking error | Inline status banner on System page | Explains cold start and keeps page usable |
| Form error | Pink banner with `role="alert"` | Specific field/API message |
| Form success | Acid banner with `role="status"` | Confirms the message was sent |
| Admin partial failure | Feedback banner + successfully loaded sections remain | Names what failed without exposing internals |

Rules:

- Do not use a full-page spinner for a section-level fetch.
- Do not hide the page behind a loading overlay.
- Do not use an empty state when an error occurred; distinguish the two.
- Do not auto-retry non-idempotent actions.
- Preserve layout height where possible to avoid jumps.

## 10. Interactions and animation

| Interaction | Behavior | Timing |
|---|---|---|
| Route change | Fade/translate the new route in; scroll to top instantly | 450 ms |
| Scroll reveal | Elements fade/translate up once when entering the viewport; content above the fold is visible immediately | 700 ms, 34 px |
| Button hover | Move 4 px toward the shadow; shadow collapses | 200 ms |
| Button active | Move 6 px | 200 ms |
| Card hover | Lift/translate; media scales slightly | 200–300 ms |
| Nav scroll | Border changes to pink and a hard shadow appears | 300 ms |
| Mobile menu | Full-screen overlay fades in; focus trapped | 300 ms |
| Marquee | Continuous horizontal strip; paused/removed for reduced motion | Continuous |
| Decor circle/dot | Gentle pulse | 2.6 s |
| AI modal | Overlay/card entrance; spinner while waiting | 300 ms + provider time |
| System telemetry | Poll every 5 s; terminal scrolls internally | 5 s |
| Focus | 3 px pink outline, 3 px offset | Immediate |

Rules:

- Animate transform/opacity only; avoid layout-triggering properties.
- No animation may block input.
- Hover effects must have a keyboard/focus equivalent where they convey state.
- Under `prefers-reduced-motion: reduce`, disable route, reveal, marquee, pulse, and smooth scrolling; keep essential state changes instant.
- Do not animate error messages in a way that delays reading.

## 11. Responsive behavior

- Minimum supported width: 320 px.
- No horizontal page scroll at any breakpoint.
- Long emails, URLs, and project titles must wrap (`overflow-wrap: anywhere`) rather than overflow.
- Images are responsive with explicit width/height to reduce layout shift.
- Touch targets should be at least 44×44 px where practical; icon-only admin actions need generous hit areas.
- Mobile nav is a dialog, not a dropdown; it locks body scroll.
- The hero portrait appears first on mobile to establish identity, followed by name/summary.
- Sticky/fixed elements must not cover focused fields; `scroll-padding-top` accounts for the nav.
- Admin forms stack to one column; list actions remain reachable.
- The System terminal keeps a bounded height and scrolls internally.

## 12. Accessibility requirements

### Required

- Semantic landmarks: header, nav, main, footer; one `h1` per page; ordered headings.
- Skip link to `#main-content`.
- All form controls have visible labels and programmatic association.
- All icon-only buttons have `aria-label`.
- Images have meaningful `alt`; decorative surfaces are `aria-hidden`.
- Modals use `role="dialog"`, `aria-modal`, labelled/described content, focus trap, Escape, and focus restoration.
- Mobile menu follows the same dialog rules.
- Progress bars expose `role="progressbar"` and values.
- Status messages use `role="status"`; errors use `role="alert"`.
- Active nav links use `aria-current="page"`.
- Motion respects reduced-motion.
- Color is never the only indicator of state.
- Keyboard order follows visual order.
- Focus is never removed without a replacement.

### Known gaps and approvals

1. **Focus ring contrast:** pink on acid is 2.71:1. Approve a higher-contrast double ring.
2. **Automated accessibility test:** no axe/Lighthouse CI gate yet. Add before claiming WCAG conformance.
3. **White on pink:** avoid for normal text; audit any remaining instances.
4. **Gray on acid:** avoid for body text; use ink.
5. **Screen-reader pass:** no documented NVDA/VoiceOver regression run yet.
6. **Zoom/reflow:** verify at 200% and 400% zoom, especially admin tables/lists.

## 13. Page-level layout guidance

### Home

- Three-part hero: identity left, portrait center, role/summary/actions right.
- Acid grid background, oversized watermark, decorative acid circle.
- Primary CTA "View Work" (acid pill); secondary "Resume" (outline pill).
- Marquee, stats band, three capability cards, pink CTA panel.
- Keep the hero readable at 320 px; portrait first on mobile.

### About

- Pink grid surface.
- Split layout: portrait/frame + biography, facts, actions.
- Facts use label/value rows; email wraps.
- Quote is the visual anchor; body copy remains at a readable measure.
- Primary action: resume; secondary: projects.

### Skills

- Acid surface; large section title.
- Card grid with index, level, clickable skill name, progress bar, hint.
- AI sparkle icon signals the explainer; the card remains readable without it.
- Loading/error/empty panels replace the grid only when appropriate.

### Projects

- Acid surface; 3-column grid with a staggered second card on desktop.
- Media card with image, primary link badge, title, description, source/demo links.
- Long descriptions clamp or wrap without breaking the card; images fall back to the placeholder.
- Only safe HTTP(S) links render.

### Certificates

- Pink surface; 3-column grid.
- Optional media; issuer line; clickable title with AI sparkle; credential link.
- Cards without images must remain balanced and not collapse.
- Error/empty states use the shared panel.

### Contact

- Acid surface; split intro/visual panel + form panel.
- Direct contact rows with icon, label, value; external links open safely.
- Form fields in a 2-column grid, message full width, submit full width.
- Success/error banners appear above the form.
- On mobile, visual panel stacks above the form; form remains the primary action.

### System

- Dark surface with acid title and pink shadow.
- Four stat cards, two progress bars, terminal panel, AI chat panel.
- Telemetry placeholders show dashes and "Waiting…" before the first response.
- Cold-start warning is inline and non-blocking.
- Git metadata footer shows commit/branch or a clear unavailable message.

### Admin login

- Centered card on acid grid; no public nav/footer.
- Back link, shield icon, "Restricted / Authorized only" kicker, short guidance.
- Email/password fields; disabled state during login; error banner; primary acid button.
- Page is `noindex` and never linked from public navigation unless authenticated.

### Admin dashboard

- Control-room header with title, view site, refresh, logout.
- Feedback banner below the header.
- Optional edit panel above the grid.
- 2×2 resource cards: projects, skills, certificates, inbox.
- Forms are compact; lists are scannable; icon actions are labelled.
- Empty lists use muted text; data load failure keeps available sections visible.
- On mobile, cards stack and forms remain usable.

### 404

- Acid surface; large "404", "Lost in the grid.", explanatory copy, home button.
- `noindex, nofollow`; canonical points to `/404` but the route is excluded from the sitemap.

## 14. Content and voice

- Direct, technical, confident. No marketing fluff or exclamation marks.
- First person for biography; third person for SEO descriptions where appropriate.
- Error copy: explain what happened and what to do next. Never blame the user.
- Empty copy: explain how content appears, not "Nothing here."
- Metadata: uppercase, short, mono; use slashes and numbering (`Work / 03`).
- Avoid unverifiable claims, fake metrics, or invented employers.
- Keep contact promises realistic (the current UI says 24–48 hours; the owner must honor it).

## 15. Design quality checklist

- [ ] Uses existing tokens; no unexplained hex values.
- [ ] One primary action per view.
- [ ] Heading hierarchy is semantic and ordered.
- [ ] All interactive elements have hover, focus, active, and disabled states.
- [ ] Form labels, help text, errors, and success messages are present.
- [ ] Loading, empty, and error states are designed, not implied.
- [ ] Keyboard-only journey works, including modal and mobile nav.
- [ ] Reduced-motion behavior is verified.
- [ ] Layout works at 320 px, 768 px, 1024 px, and 1440 px.
- [ ] Text contrast meets the palette rules above.
- [ ] Images have alt text and fallbacks.
- [ ] No secret, internal URL, or unsupported claim appears in the UI.
- [ ] New components reuse an existing pattern or extend the system deliberately.
