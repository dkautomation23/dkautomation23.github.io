# Security policy

This repository is a static site. There is no server, no database and no user
input: GitHub Pages serves files from the default branch.

## Reporting

**Security → Report a vulnerability** on this repository, or
**hello@dkautomation.dev**. First reply within 2 working days.

Do not open a public issue for a security problem.

## In scope

- Content injection: anything that makes a published page execute code or load
  a resource the repository does not contain.
- A page or a data file that exposes personal data. The survey publishes totals
  only, and a shop name appearing anywhere on the site is a bug worth reporting.
- A link or a redirect that sends a visitor somewhere other than where it says.

## Out of scope

- Missing security headers that GitHub Pages does not let a site set.
- The absence of a Content Security Policy header, for the same reason; the
  pages load no third-party script.
- Findings about GitHub Pages itself — report those to GitHub.
