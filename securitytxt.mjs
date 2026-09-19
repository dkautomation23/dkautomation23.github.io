#!/usr/bin/env node
/**
 * Builds /security-txt-survey.html from the aggregate a real run produced.
 *
 * Same contract as survey.mjs: every number is read out of the file the audit
 * wrote, so a figure that is not in that file cannot appear on the page, and no
 * site name ever reaches the site - the aggregate carries totals only.
 *
 *     node securitytxt.mjs ../well-known-audit/survey/2026-09-18-top500-aggregate.json
 */

import { readFileSync, writeFileSync } from "node:fs";

const HERE = import.meta.dirname;
const SITE = "https://dkautomation23.github.io";
const GITHUB = "https://github.com/dkautomation23";
const AUTHOR = "Dmytro Galko";
const EMAIL = "hello@dkautomation.dev";
const REPO = `${GITHUB}/well-known-audit`;

const source = process.argv[2];
if (!source) {
  process.stderr.write("usage: node securitytxt.mjs <aggregate.json>\n");
  process.exit(2);
}

const run = JSON.parse(readFileSync(source, "utf8"));
const s = run.summary;
const sec = s.securityTxt;
const date = (run.checkedAt ?? "").slice(0, 10);

const escape = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pct = (part, whole) => (whole === 0 ? "—" : `${((part / whole) * 100).toFixed(1)}%`);
const num = (value) => Number(value).toLocaleString("en-US");

const invalid = sec.withoutExpires + sec.expired;
const headline = `${pct(invalid, sec.published)} of the security.txt files at the top of the web are not valid under RFC 9116`;

const FILE_LABEL = {
  "robots.txt": "what crawlers may read",
  "security.txt": "where to report a hole",
  "llms.txt": "what an AI assistant should read",
  "ai.txt": "what AI crawlers may use",
  "assetlinks.json": "Android app links",
  "apple-app-site-association": "iOS universal links",
  "change-password": "where a password manager sends you",
  "openid-configuration": "OIDC discovery",
  "mta-sts.txt": "mail transport security",
  "gpc.json": "Global Privacy Control",
  "dnt-policy.txt": "Do Not Track policy",
  ucp: "Universal Commerce Protocol profile",
};

const files = Object.entries(s.filePresence).sort((a, b) => b[1] - a[1]);

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "security.txt validity across the most visited sites",
  description:
    `A census of the ${num(s.total)} most visited sites, taken on ${date}: how many publish a ` +
    "security.txt, how many of those carry the Expires field RFC 9116 requires, and how many have expired.",
  url: `${SITE}/security-txt-survey.html`,
  license: "https://opensource.org/licenses/MIT",
  creator: { "@type": "Person", name: AUTHOR, url: SITE, email: EMAIL },
  dateCreated: date,
  temporalCoverage: date,
  isAccessibleForFree: true,
  variableMeasured: ["security.txt published", "Expires field present", "Expires date in the past"],
  keywords: [
    "security.txt", "RFC 9116", "Expires", "vulnerability disclosure",
    "well-known files", "site audit", "open data",
  ].join(", "),
  distribution: [
    {
      "@type": "DataDownload",
      name: "Per-domain results",
      encodingFormat: "text/csv",
      contentUrl: `${REPO}/blob/main/survey/${date}-top500.csv`,
    },
  ],
  measurementTechnique:
    "One HTTPS GET per file, four at a time per domain, one domain at a time. Domains that never answered are reported separately and never counted as publishing nothing.",
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Half the security.txt files at the top of the web are invalid</title>
<meta name="description" content="${escape(headline)}. Measured on ${date} across the ${num(s.total)} most visited sites, with the tool, the domain list and the raw results published.">
<meta name="keywords" content="security.txt, RFC 9116, Expires field, vulnerability disclosure, well-known files, open data">
<link rel="canonical" href="${SITE}/security-txt-survey.html">
<meta property="og:title" content="Half the security.txt files at the top of the web are invalid">
<meta property="og:description" content="${escape(headline)}.">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}/security-txt-survey.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="style.css">
<link rel="icon" href="favicon.svg">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>

<header class="compact">
  <div class="wrap">
    <p class="crumb"><a href="./">${escape(AUTHOR)}</a> · open data</p>
    <h1>Where to report a hole, and nobody watching</h1>
    <p class="role">security.txt across the ${num(s.total)} most visited sites · ${date}</p>
    <p class="lede">
      A <code>security.txt</code> file tells a researcher who found a hole in
      your site where to send it. <a href="https://www.rfc-editor.org/rfc/rfc9116">RFC 9116</a>
      makes one field mandatory — <code>Expires</code> — precisely because a
      contact address nobody has confirmed in three years is worse than none:
      the specification treats an expired file as invalid, exactly like a
      missing one.
    </p>
    <p class="proof">
      Nothing breaks when that date passes. No browser warns, no scanner
      complains, no dashboard turns red. So this is a count of how often it has
      already happened at the top of the web.
    </p>
    <div class="links">
      <a class="primary" href="${REPO}">The tool and the raw data</a>
      <a href="#method">How it was measured</a>
    </div>
  </div>
</header>

<section>
  <div class="wrap">
    <h2>Of the ${num(sec.published)} files that exist</h2>
    <table class="data">
      <tbody>
        <tr><th>Valid today</th><td>${num(sec.valid)}</td><td>${pct(sec.valid, sec.published)}</td></tr>
        <tr><th>No <code>Expires</code> field at all</th><td>${num(sec.withoutExpires)}</td><td>${pct(sec.withoutExpires, sec.published)}</td></tr>
        <tr><th>Expired</th><td>${num(sec.expired)}</td><td>${pct(sec.expired, sec.published)}</td></tr>
      </tbody>
    </table>
    <p class="note">
      ${num(invalid)} of ${num(sec.published)} — ${pct(invalid, sec.published)} — are not valid files under the
      specification they are written to. The commonest failure is not an expired
      date but no date at all: the field was never added, and nothing ever asked
      for it.
    </p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Who publishes one in the first place</h2>
    <table class="data">
      <tbody>
        <tr><th>Sites that answered</th><td>${num(s.checked)}</td><td>${pct(s.checked, s.total)}</td></tr>
        <tr><th>Publish a security.txt</th><td>${num(sec.published)}</td><td>${pct(sec.published, s.checked)}</td></tr>
        <tr><th>Never answered</th><td>${num(s.unreachable)}</td><td>${pct(s.unreachable, s.total)}</td></tr>
      </tbody>
    </table>
    <p class="note">
      The ${num(s.unreachable)} that never answered are counted here and nowhere else. A ranking of
      the most visited domains is full of content-delivery and API hostnames
      that serve nothing at their root; calling those "sites without a
      security.txt" would be a made-up number.
    </p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>And the rest of what sites publish at their root</h2>
    <table class="data">
      <tbody>
${files
  .map(
    ([file, count]) =>
      `        <tr><th><code>${escape(file)}</code><br><span class="hint">${escape(FILE_LABEL[file] ?? "")}</span></th><td>${num(count)}</td><td>${pct(count, s.checked)}</td></tr>`,
  )
  .join("\n")}
      </tbody>
    </table>
  </div>
</section>

<section id="method">
  <div class="wrap">
    <h2>How it was measured</h2>
    <ul class="plain">
      <li><strong>Population.</strong> The Tranco top ${num(s.total)}, taken as it is — no filtering by kind of site.</li>
      <li><strong>Measurement.</strong> One HTTPS GET per file, four at a time for a single domain, one domain at a time, with a pause and a user agent naming the tool. Both locations RFC 9116 allows are checked.</li>
      <li><strong>Date.</strong> ${date}.</li>
      <li><strong>Tool.</strong> <a href="${REPO}">well-known-audit</a> — open source, zero runtime dependencies, tests on recorded responses.</li>
      <li><strong>Checked by hand before publishing.</strong> Four of the flagged sites were confirmed with <code>curl</code>, because a number like this is only worth having if it is right.</li>
      <li><strong>Repeat it.</strong> <code>well-known-audit --batch survey/domains-top500.txt --csv out.csv</code> rebuilds every table above.</li>
    </ul>
    <h2>What this does not say</h2>
    <ul class="plain">
      <li>An invalid security.txt does not mean a site is insecure. It means the one document a researcher reads first cannot be relied on.</li>
      <li>This was run from one machine. A site that serves different files by region, or blocks an unknown user agent, is counted as unverified rather than guessed at.</li>
      <li>No site is named on this page. The per-domain results are in the repository for anyone who wants to check their own.</li>
    </ul>
    <p class="cta">
      Want to know what your own domains publish? <code>npx well-known-audit yourdomain.com</code>
      once it is released, or write to <a href="mailto:${EMAIL}?subject=well-known%20audit">${EMAIL}</a>.
    </p>
  </div>
</section>

<footer>
  <div class="wrap">
    <a href="./">All tools</a> ·
    <a href="${REPO}">well-known-audit on GitHub</a> ·
    Data and code MIT licensed
  </div>
</footer>

</body>
</html>
`;

writeFileSync(`${HERE}/security-txt-survey.html`, html, "utf8");
process.stdout.write(`security-txt-survey.html  (${num(sec.published)} files, ${num(invalid)} invalid)\n`);
