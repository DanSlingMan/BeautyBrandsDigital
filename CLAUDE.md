# CLT Makeup — Claude Code Project Context

## Brand
- **Name:** CLT Makeup
- **Domain:** cltmakeup.com
- **Tagline:** Charlotte's luxury bridal makeup artist
- **Location:** Charlotte, NC
- **Instagram / TikTok / Pinterest:** @cltmakeup
- **Market:** Luxury bridal — brides aged 25–38, Charlotte + 30-mile radius
- **Tone:** Warm, elevated, confident, Charlotte-proud. Never clinical or corporate.

## Design System

### Colors (always use CSS variables)
```css
--color-rose:       #D4537E;   /* primary — headings, CTAs, accents */
--color-blush:      #FBEAF0;   /* light backgrounds, section fills */
--color-blush-mid:  #F4C0D1;   /* borders, dividers */
--color-ivory:      #FAF8F5;   /* page background */
--color-charcoal:   #2C2C2A;   /* body text */
--color-stone:      #5F5E5A;   /* secondary text */
--color-white:      #FFFFFF;
```

### Typography
- **Heading font:** Cormorant Garamond (Google Fonts) — elegant serif, used for all h1–h3
- **Body font:** DM Sans (Google Fonts) — clean, modern sans
- **Heading sizes:** h1 64px mobile→80px desktop, h2 40px→52px, h3 28px→32px
- **Body:** 16px, line-height 1.75, color var(--color-stone)
- **Letter spacing on headings:** 0.02em

### Spacing
- Section padding: 80px top/bottom mobile, 120px desktop
- Max content width: 1200px, centered
- Gutter: 24px mobile, 40px desktop

### Motion
- All reveals: `opacity 0 → 1`, `translateY 24px → 0`, duration 0.7s, ease-out
- Use Intersection Observer for scroll-triggered reveals
- Hover on buttons: subtle scale(1.02) + background shift, 0.2s
- No heavy animations — elegant and restrained

### Mobile-first
- Always write CSS mobile-first, then `@media (min-width: 768px)` for tablet/desktop
- Touch targets minimum 44px
- Test all layouts at 375px width first

## Tech Stack
- **Pure HTML / CSS / JS** — no frameworks, no build tools
- **Fonts:** Google Fonts (Cormorant Garamond + DM Sans)
- **Scheduling:** Cal.com embed (free)
- **Payments:** Stripe Checkout (2.9% per transaction, no monthly fee)
- **Analytics:** Google Analytics 4 (snippet placeholder in every page `<head>`)
- **Hosting:** Netlify (free tier)
- **Version control:** GitHub

## File Structure
```
cltmakeup/
├── CLAUDE.md              ← this file
├── index.html             ← homepage
├── services.html          ← services page
├── about.html             ← about page
├── book.html              ← booking + payment page
├── css/
│   ├── reset.css          ← minimal CSS reset
│   ├── variables.css      ← all CSS custom properties
│   └── main.css           ← global styles (nav, footer, typography, buttons)
├── js/
│   ├── reveal.js          ← scroll-triggered fade-in reveals
│   └── nav.js             ← mobile hamburger menu
└── images/
    └── README.md          ← placeholder — real photos go here
```

## Pages — Content & Requirements

### index.html — Homepage
Sections (in order):
1. **Nav** — logo "CLT MAKEUP", links: Services / About / Book, mobile hamburger
2. **Hero** — full-viewport, headline "Your wedding day. Perfected.", subline "Charlotte's luxury bridal makeup artist", CTA button → /book.html, subtle background (ivory with blush overlay or hero image placeholder)
3. **Intro strip** — 3 icons + short phrases: "Luxury Experience" / "Charlotte-Based" / "Trial Included"
4. **Services teaser** — 3 cards: Bridal Package / Bridal Party / Trial Session, each with name + 1-line description + "Learn more" link → /services.html
5. **About teaser** — left: headshot placeholder, right: 2–3 lines of artist bio + "Meet the artist" link → /about.html
6. **Testimonials** — 3 bride quotes (placeholder text), soft blush background
7. **Instagram strip** — 6 placeholder image boxes labeled "@cltmakeup on Instagram", link to instagram.com/cltmakeup
8. **CTA banner** — "Ready to book your bridal look?" + button → /book.html
9. **Footer** — logo, nav links, @cltmakeup social links, © CLT Makeup 2026, cltmakeup.com

### services.html — Services
- Full pricing menu with 4 packages:
  - **Bridal Package** — bride only, full glam, includes touch-up kit. Price: $350
  - **Bridal Party** — per person pricing, min 3 people. Price: $150/person
  - **Trial Session** — pre-wedding trial, 2 hours, at artist's studio. Price: $200
  - **Engagement Session** — natural glam for photos. Price: $175
- Each package: name, description (3–4 sentences), what's included (bullet list), price, CTA button → /book.html
- Add-ons section: false lashes ($25), airbrush upgrade ($50), travel fee (quote-based)
- FAQ section: 4–5 common bridal makeup questions

### about.html — About
- Artist story: personal, warm, Charlotte-rooted
- Philosophy: making every bride feel like themselves, elevated
- Headshot placeholder (large, editorial crop)
- Credentials / experience section
- CTA: "Let's work together" → /book.html

### book.html — Booking + Payment
- Intro: "Book your consultation" — what to expect in the consult
- **Consultation deposit: $75** (applied toward final booking)
- Cal.com embed: `<div id="cal-booking"></div>` with Cal.com inline embed script (use placeholder comment if API key not yet set)
- Stripe Checkout button: on click, redirects to Stripe Checkout session for $75
  - Use Stripe.js + a `<script>` that calls a placeholder Stripe publishable key
  - Add comment: `// Replace with your Stripe publishable key: pk_live_...`
  - Add comment: `// Replace with your Stripe price ID: price_...`
- After payment: show confirmation message "You're booked! Check your email for details."
- Contact alternative: "Prefer to reach out directly? Email hello@cltmakeup.com"

## Coding Standards
- Semantic HTML5 — use `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>` correctly
- All images use `alt` text describing the image for accessibility
- Every page includes: `<meta charset>`, `<meta viewport>`, `<meta description>`, Open Graph tags
- CSS: variables-first, mobile-first, no inline styles
- JS: vanilla only, no jQuery, no frameworks
- Comments: add a comment above every major section in HTML and every function in JS
- Consistent 2-space indentation throughout

## Git Workflow
- Repo name: `cltmakeup`
- Main branch: `main`
- Commit message style: `feat: add hero section` / `fix: mobile nav overlap` / `style: adjust button spacing`
- Commit after each completed page

## Key Instructions for Claude Code
- Always start with CSS variables and global styles before building components
- Build mobile layout first, then add desktop breakpoints
- Use placeholder text that sounds like real bridal copy — not Lorem Ipsum
- Image placeholders: use a `<div>` with `background: var(--color-blush)` and an aspect ratio, labeled with the image description
- Never use Bootstrap, Tailwind, or any CSS framework
- Keep each HTML file self-contained with its own `<link>` tags
- After completing each page, remind me to: commit to GitHub, then preview in browser
