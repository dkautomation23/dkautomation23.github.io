#!/usr/bin/env node
/**
 * Builds /llms-txt-conformance.html from the aggregate a real run produced.
 *
 * Same contract as the other two survey pages: every number on the page is
 * read out of the file the run wrote. A figure that is not in that file cannot
 * appear here, and no domain name ever reaches the page — the aggregate
 * carries totals only, and the per-domain CSV stays in the tool's repository
 * where the method sits next to it.
 *
 *     node llmsconformance.mjs ../well-known-audit/survey/2026-09-19-llms-aggregate.json
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
  process.stderr.write("usage: node llmsconformance.mjs <aggregate.json>\n");
  process.exit(2);
}

const run = JSON.parse(readFileSync(source, "utf8"));
const { method, population, llms_txt: llms, conformance, links, contradiction } = run;
const date = method.collected;

const escape = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = (value) => Number(value).toLocaleString("en-US");
const pct = (value) => (value === null ? "—" : `${value}%`);

const couldNot =
  population.could_not_check.soft_404 +
  population.could_not_check.refused_us +
  population.could_not_check.unreachable;

const headline =
  `${pct(contradiction.share)} of the sites that publish an llms.txt also ban, by name, ` +
  "at least one of the AI crawlers that would read it";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "llms.txt conformance and link health across the most visited sites",
  description:
    `A census of the ${num(population.total)} most visited sites, taken on ${date}: not how many publish ` +
    "an llms.txt, which is already known, but whether the files they publish have the shape the " +
    "specification describes, whether the links inside them still resolve, and how often a site " +
    "publishes one while banning the crawlers that would read it.",
  url: `${SITE}/llms-txt-conformance.html`,
  license: "https://opensource.org/licenses/MIT",
  creator: { "@type": "Person", name: AUTHOR, url: SITE, email: EMAIL },
  dateCreated: date,
  temporalCoverage: date,
  isAccessibleForFree: true,
  variableMeasured: [
    "llms.txt published",
    "llms.txt conforms to the documented shape",
    "links inside llms.txt that resolve",
    "named AI crawler blocked in robots.txt",
  ],
  keywords: [
    "llms.txt", "AI crawlers", "robots.txt", "GPTBot", "ClaudeBot",
    "link rot", "open data", "site audit",
  ].join(", "),
  distribution: [
    {
      "@type": "DataDownload",
      name: "Per-domain results",
      encodingFormat: "text/csv",
      contentUrl: `${REPO}/blob/main/survey/${date}-llms-conformance.csv`,
    },
  ],
  measurementTechnique: escape(method.politeness),
};

const agents = Object.entries(run.robots_stance);
const agentRows = agents
  .map(([name, stance]) => {
    const share = ((stance.blocked / stance.population) * 100).toFixed(1);
    return `        <tr><th><code>${escape(name)}</code></th><td>${num(stance.blocked)}</td><td>${share}%</td></tr>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A map of your content, and a locked door</title>
<meta name="description" content="${escape(headline)}. Measured on ${date} across the ${num(population.total)} most visited sites, with the tool, the domain list and the raw results published.">
<meta name="keywords" content="llms.txt, AI crawlers, robots.txt, GPTBot, ClaudeBot, link rot, open data">
<link rel="canonical" href="${SITE}/llms-txt-conformance.html">
<meta property="og:title" content="A map of your content, and a locked door">
<meta property="og:description" content="${escape(headline)}.">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}/llms-txt-conformance.html">
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
    <h1>A map of your content, and a locked door</h1>
    <p class="role">llms.txt conformance across the ${num(population.total)} most visited sites · ${date}</p>
    <p class="lede">
      How many sites publish an <code>llms.txt</code> has been counted several
      times this year, and the answers agree. This is the next question, which
      nobody seems to have asked: of the files that exist, how many actually
      work — the right shape, live links inside, and a robots.txt that lets the
      reader in.
    </p>
    <p class="proof">
      An <code>llms.txt</code> is a map an assistant follows to your content.
      A map with dead streets on it is worse than no map: the assistant spends
      its one visit on a 404 and leaves. Nothing tells you when that happens.
    </p>
    <div class="links">
      <a class="primary" href="${REPO}">The tool and the raw data</a>
      <a href="#method">How it was measured</a>
    </div>
  </div>
</header>

<section>
  <div class="wrap">
    <h2>The finding</h2>
    <p class="note">
      ${num(contradiction.count)} of the ${num(contradiction.population)} sites publishing a usable
      <code>llms.txt</code> — ${pct(contradiction.share)} — also name at least one AI crawler in
      their <code>robots.txt</code> and forbid it outright. They wrote a guide
      for a reader they are not letting through the door.
    </p>
    <p class="note">
      This is not the wildcard rule being read as a ban. Only a group naming the
      crawler explicitly counts here, and only <code>Disallow: /</code> counts as
      a block, because anything looser inflates the number.
    </p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Do the files have the documented shape?</h2>
    <table class="data">
      <tbody>
        <tr><th>Publish an <code>llms.txt</code></th><td>${num(llms.publishing)}</td><td>${pct(llms.publishing_share_of_answered)} of ${num(population.answered)} answered</td></tr>
        <tr><th>Have the documented shape</th><td>${num(conformance.conformant)}</td><td>${pct(conformance.conformant_share)}</td></tr>
        <tr><th>No heading</th><td>${num(conformance.missing_h1)}</td><td></td></tr>
        <tr><th>No sections</th><td>${num(conformance.no_sections)}</td><td></td></tr>
        <tr><th>No links at all</th><td>${num(conformance.no_links)}</td><td></td></tr>
      </tbody>
    </table>
    <p class="note">
      A file with no links in it is a file that points an assistant nowhere. It
      exists, it would be counted as adoption by every published figure, and it
      does nothing.
    </p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Do the links inside still work?</h2>
    <table class="data">
      <tbody>
        <tr><th>Sites with at least one dead link</th><td>${num(links.sites_with_at_least_one_broken)}</td><td>${pct(links.sites_with_broken_share)} of ${num(links.sites_with_links_checked)}</td></tr>
        <tr><th>Links checked</th><td>${num(links.links_checked)}</td><td></td></tr>
        <tr><th>Resolved</th><td>${num(links.links_ok)}</td><td></td></tr>
        <tr><th>Dead</th><td>${num(links.links_broken)}</td><td>${pct(links.broken_share_of_checked)}</td></tr>
        <tr><th>Could not verify</th><td>${num(links.links_could_not_verify)}</td><td>not counted as dead</td></tr>
      </tbody>
    </table>
    <p class="note">
      At most eight links per site were followed, spaced out, so this is a floor
      and not a ceiling: a site with one dead link among its first eight may have
      more further down.
    </p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Who is banned by name</h2>
    <table class="data">
      <thead><tr><th>Crawler</th><th>Blocked outright</th><th>Share</th></tr></thead>
      <tbody>
${agentRows}
      </tbody>
    </table>
    <p class="note">
      Out of ${num(agents[0]?.[1].population ?? 0)} sites that publish a <code>robots.txt</code> at all. A crawler
      that is never mentioned is counted as not mentioned, never as allowed and
      never as blocked.
    </p>
  </div>
</section>

<section id="method">
  <div class="wrap">
    <h2>How it was measured, and what it cannot tell you</h2>
    <p class="note">
      Population: ${escape(method.source)}. Run on ${date} with
      <code>${escape(method.tool)}</code>.
    </p>
    <p class="note">
      Politeness: ${escape(method.politeness)}. A refusal is recorded as a
      refusal and never retried.
    </p>
    <p class="note">
      Of ${num(population.total)} domains, ${num(couldNot)} could not be asked at all:
      ${num(population.could_not_check.unreachable)} never answered — most of these are CDN and
      infrastructure names that carry no website —
      ${num(population.could_not_check.refused_us)} refused the request, and
      ${num(population.could_not_check.soft_404)} answer 200 to a path that cannot exist, so
      nothing they return is evidence of anything. None of the three is inside
      any percentage on this page.
    </p>
    <p class="note">
      ${escape(method.soft404)}.
    </p>
    <p class="note">
      ${escape(method.robots)}.
    </p>
    <p class="note">
      What this cannot tell you: whether any assistant actually read these
      files, and whether a site meant to publish one — a large share of
      <code>llms.txt</code> files on the web are written by a platform or a
      plugin rather than chosen by the publisher.
    </p>
    <p class="note">
      Want to know what your own domains publish?
      <code>npx well-known-audit yourdomain.com</code>, or write to
      <a href="mailto:${EMAIL}?subject=llms.txt%20conformance">${EMAIL}</a>.
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

writeFileSync(`${HERE}/llms-txt-conformance.html`, html, "utf8");
process.stdout.write(
  `llms-txt-conformance.html  (${num(llms.publishing)} files, ${num(contradiction.count)} contradictions, ` +
    `${num(links.links_broken)} dead links)\n`,
);
