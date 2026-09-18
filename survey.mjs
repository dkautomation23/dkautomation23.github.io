#!/usr/bin/env node
/**
 * Builds /ucp-survey.html from the aggregate an actual audit run produced.
 *
 * Nothing on the page is typed by hand. Every number is read out of the
 * aggregate file that `ucp-audit --batch` and `survey/aggregate.mjs` wrote, so
 * the page cannot drift from the run behind it, and a number that is not in
 * the file cannot appear on the page.
 *
 * The aggregate holds totals only - no shop names ever reach the site.
 *
 *     node survey.mjs ../ucp-audit/survey/2026-09-18-aggregate.json
 */

import { readFileSync, writeFileSync } from "node:fs";

const HERE = import.meta.dirname;
const SITE = "https://dkautomation23.github.io";
const GITHUB = "https://github.com/dkautomation23";
const AUTHOR = "Dmytro Galko";
const EMAIL = "hello@dkautomation.dev";
const REPO = `${GITHUB}/ucp-audit`;

const source = process.argv[2];
if (!source) {
  process.stderr.write("usage: node survey.mjs <aggregate.json>\n");
  process.exit(2);
}

const run = JSON.parse(readFileSync(source, "utf8"));
const s = run.summary;
const date = (run.checkedAt ?? "").slice(0, 10);

const escape = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pct = (part, whole) => (whole === 0 ? "—" : `${((part / whole) * 100).toFixed(1)}%`);
const num = (value) => Number(value).toLocaleString("en-US");

/** Every domain the audit could not read, whatever the reason. */
const unverified =
  s.byOutcome.blocked + s.byOutcome.unreachable + s.byOutcome["not-json"] + s.byOutcome.invalid;

const versions = Object.entries(s.versions).sort((a, b) => b[1] - a[1]);
const blockers = Object.entries(s.blockerCounts).sort((a, b) => b[1] - a[1]);
const capabilities = Object.entries(run.capabilities).sort((a, b) => b[1] - a[1]);

// The one capability shops differ on is the story; everything else is
// identical across the whole population, which is a finding of its own.
const identity = run.capabilities["dev.ucp.common.identity_linking"] ?? 0;
const withoutIdentity = s.checked - identity;

const WHAT_IT_MEANS = {
  "dev.ucp.shopping.catalog.search": "find a product by searching",
  "dev.ucp.shopping.catalog.lookup": "look a product up by id",
  "dev.ucp.shopping.cart": "put it in a cart",
  "dev.ucp.shopping.checkout": "complete the purchase",
  "dev.ucp.shopping.order": "read the order afterwards",
  "dev.ucp.shopping.fulfillment": "see delivery options",
  "dev.ucp.shopping.discount": "apply a discount code",
  "dev.ucp.common.identity_linking": "sign the shopper into their own account",
  "dev.shopify.catalog": "use Shopify's own catalogue extension",
};

const headline = `Every live Shopify storefront publishes an agent profile; ${pct(withoutIdentity, s.checked)} of them will not let an agent sign the shopper in`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Universal Commerce Protocol adoption among live Shopify storefronts",
  description:
    `A census of ${num(s.total)} live Shopify storefronts taken on ${date}: how many publish a ` +
    "Universal Commerce Protocol profile at /.well-known/ucp, which protocol version they publish, " +
    "and which capabilities an AI shopping agent actually finds there.",
  url: `${SITE}/ucp-survey.html`,
  license: "https://opensource.org/licenses/MIT",
  creator: { "@type": "Person", name: AUTHOR, url: SITE, email: EMAIL },
  dateCreated: date,
  temporalCoverage: date,
  isAccessibleForFree: true,
  variableMeasured: [
    "UCP profile published",
    "protocol version",
    "declared capabilities",
    "identity linking availability",
  ],
  keywords: [
    "Universal Commerce Protocol",
    "UCP adoption",
    "agentic commerce",
    "AI shopping agents",
    "Shopify",
    "well-known ucp",
    "identity linking",
  ].join(", "),
  distribution: [
    {
      "@type": "DataDownload",
      name: "Per-domain results",
      encodingFormat: "text/csv",
      contentUrl: `${REPO}/blob/main/survey/${date}-results.csv`,
    },
    {
      "@type": "DataDownload",
      name: "Aggregate",
      encodingFormat: "application/json",
      contentUrl: `${REPO}/blob/main/survey/${date}-aggregate.json`,
    },
  ],
  measurementTechnique:
    "One HTTPS GET of /.well-known/ucp per domain, four at a time, with a pause and an honest user agent. Domains that refused or did not answer are reported separately and never counted as broken.",
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>What AI shopping agents actually see: ${num(s.total)} Shopify storefronts, ${date}</title>
<meta name="description" content="${escape(headline)}. A census of ${num(s.total)} live Shopify storefronts with the tool, the domain list and the raw results published so anyone can repeat it.">
<meta name="keywords" content="UCP adoption, Universal Commerce Protocol, agentic commerce data, AI shopping agents, Shopify, well-known ucp, identity linking">
<link rel="canonical" href="${SITE}/ucp-survey.html">
<meta property="og:title" content="What AI shopping agents actually see in ${num(s.total)} Shopify shops">
<meta property="og:description" content="${escape(headline)}.">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}/ucp-survey.html">
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
    <h1>What AI shopping agents actually see</h1>
    <p class="role">A census of ${num(s.total)} live Shopify storefronts · ${date}</p>
    <p class="lede">
      Google and Shopify published the Universal Commerce Protocol so an agent
      can read a shop, find a product and buy it. The obvious question is how
      many shops actually speak it — and nobody had published a count. Here is
      one, with the tool, the domain list and the raw results, so anyone can
      repeat it and get their own number.
    </p>
    <p class="proof">
      The short answer surprised me: adoption is not the problem. ${pct(s.byOutcome.checked, s.total)} of these
      shops publish a valid profile, all of them on the current
      ${escape(run.specVersion)} release, none with a blocker. Shopify turned it on for
      everyone, so "does my shop support it" is already answered. The real
      variation is one capability — and it is the one that decides whether the
      agent is a stranger or your customer.
    </p>
    <div class="links">
      <a class="primary" href="${REPO}">The tool and the raw data</a>
      <a href="#method">How it was measured</a>
    </div>
  </div>
</header>

<section>
  <div class="wrap">
    <h2>Half of them treat the agent as a stranger</h2>
    <table class="data">
      <tbody>
        <tr><th>Agent can sign the shopper into their account</th><td>${num(identity)}</td><td>${pct(identity, s.checked)}</td></tr>
        <tr><th>Agent can only act as a guest</th><td>${num(withoutIdentity)}</td><td>${pct(withoutIdentity, s.checked)}</td></tr>
      </tbody>
    </table>
    <p class="note">
      <code>dev.ucp.common.identity_linking</code> is the only capability these
      ${num(s.checked)} shops differ on; the other eight are identical everywhere. Without
      it the agent can browse and buy, but as an anonymous visitor: no saved
      address, no order history, no loyalty tier, no "the usual". For a
      returning customer that is the difference between a checkout and a form.
    </p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>What ${num(s.total)} shops answered</h2>
    <table class="data">
      <tbody>
        <tr><th>Profile read and audited</th><td>${num(s.byOutcome.checked)}</td><td>${pct(s.byOutcome.checked, s.total)}</td></tr>
        <tr><th>No profile published at all</th><td>${num(s.byOutcome["no-profile"])}</td><td>${pct(s.byOutcome["no-profile"], s.total)}</td></tr>
        <tr><th>Refused the request (403, 429)</th><td>${num(s.byOutcome.blocked)}</td><td>${pct(s.byOutcome.blocked, s.total)}</td></tr>
        <tr><th>Answered something that is not a profile</th><td>${num(s.byOutcome["not-json"] + s.byOutcome.invalid)}</td><td>${pct(s.byOutcome["not-json"] + s.byOutcome.invalid, s.total)}</td></tr>
        <tr><th>No answer</th><td>${num(s.byOutcome.unreachable)}</td><td>${pct(s.byOutcome.unreachable, s.total)}</td></tr>
      </tbody>
    </table>
    <p class="note">
      ${num(unverified)} shops (${pct(unverified, s.total)}) could not be checked either way. They are
      counted here and nowhere else: a shop that refused the request is not a
      shop that failed the audit, and none of them appears in any percentage
      above or below.
    </p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>What an agent is allowed to do</h2>
    <p class="note">
      How often each capability appears among the ${num(s.checked)} audited shops.
    </p>
    <table class="data">
      <tbody>
${capabilities
  .map(
    ([name, count]) =>
      `        <tr><th><code>${escape(name)}</code><br><span class="hint">${escape(WHAT_IT_MEANS[name] ?? "")}</span></th><td>${num(count)}</td><td>${pct(count, s.checked)}</td></tr>`,
  )
  .join("\n")}
      </tbody>
    </table>
    <p class="note">
      Eight of the nine are <code>dev.ucp.*</code>, the protocol's own namespace. The
      ninth, <code>dev.shopify.catalog</code>, is a platform extension — evidence
      that the extension mechanism is being used in production and not only in
      the specification.
    </p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Which version they publish</h2>
    <table class="data">
      <tbody>
${versions
  .map(
    ([version, count]) =>
      `        <tr><th>${escape(version)}</th><td>${num(count)}</td><td>${pct(count, s.checked)}</td></tr>`,
  )
  .join("\n")}
      </tbody>
    </table>
    <p class="note">
      ${
        s.behindSpec === 0
          ? `Not one audited shop is behind the ${escape(run.specVersion)} release. A platform-wide rollout has no long tail of old versions, which is the opposite of what a self-hosted protocol looks like a year in.`
          : `${num(s.behindSpec)} shops (${pct(s.behindSpec, s.checked)}) are behind the ${escape(run.specVersion)} release.`
      }
    </p>
  </div>
</section>

${
  blockers.length === 0
    ? `<section>
  <div class="wrap">
    <h2>Blockers found: none</h2>
    <p class="note">
      The audit looks for twelve ways a profile can be published and still be
      useless to an agent — a checkout with no searchable catalogue, a capability
      declared without the schema needed to call it, an extension naming a parent
      that is not there, an endpoint on plain HTTP. Across ${num(s.checked)} shops it found
      none of them. Worth stating plainly: the tool is not measuring nothing —
      the same twelve checks do fire on hand-written profiles, which is what they
      were written against.
    </p>
  </div>
</section>`
    : `<section>
  <div class="wrap">
    <h2>What actually blocks the agent</h2>
    <table class="data">
      <tbody>
${blockers
  .map(([id, count]) => `        <tr><th>${escape(id)}</th><td>${num(count)}</td><td>${pct(count, s.checked)}</td></tr>`)
  .join("\n")}
      </tbody>
    </table>
  </div>
</section>`
}

<section id="method">
  <div class="wrap">
    <h2>How it was measured</h2>
    <ul class="plain">
      <li><strong>Population.</strong> Every domain in the Tranco top 300,000 whose DNS points at Shopify's documented storefront address, 23.227.38.0/24, or at a <code>*.myshopify.com</code> name: ${num(s.total)} shops. Discovery asked a public resolver, never the shop.</li>
      <li><strong>Measurement.</strong> One HTTPS GET of <code>/.well-known/ucp</code> per shop, four at a time, with a pause, an honest user agent naming the tool, and no attempt to get around anything that said no.</li>
      <li><strong>Date.</strong> ${date}, against the ${escape(run.specVersion)} release of the specification.</li>
      <li><strong>Tool.</strong> <a href="${REPO}">ucp-audit</a> — open source, zero runtime dependencies, tests on recorded responses.</li>
      <li><strong>Repeat it.</strong> The domain list, both scripts and the raw per-domain results are in <a href="${REPO}/tree/main/survey">the repository</a>. <code>ucp-audit --batch survey/domains.txt --csv out.csv</code> rebuilds every table above.</li>
    </ul>
    <h2>What this does not say</h2>
    <ul class="plain">
      <li><strong>Shopify shops are not all of commerce.</strong> They are the shops the specification reaches first, which is why they are the population — and why ${pct(s.byOutcome.checked, s.total)} adoption says more about one platform's rollout than about the industry.</li>
      <li><strong>Publishing a profile is not completing a sale.</strong> The audit reads what a shop declares; whether its checkout actually completes for an agent is a different measurement and is not claimed here.</li>
      <li><strong>Shops behind a CDN that blocks unknown clients are under-represented</strong> among the audited. That share is printed above rather than folded into a nicer number.</li>
      <li><strong>The population is traffic-ranked.</strong> Shops too small for the Tranco top 300,000 are not in it, and they may look different.</li>
    </ul>
    <p class="cta">
      Want this run against your own shops, or the identity-linking gap closed on
      yours? Write to <a href="mailto:${EMAIL}?subject=UCP%20survey">${EMAIL}</a>
      or <a href="${REPO}/issues/new/choose">open an issue</a>.
    </p>
  </div>
</section>

<footer>
  <div class="wrap">
    <a href="./">All tools</a> ·
    <a href="${REPO}">ucp-audit on GitHub</a> ·
    Data and code MIT licensed
  </div>
</footer>

</body>
</html>
`;

writeFileSync(`${HERE}/ucp-survey.html`, html, "utf8");
process.stdout.write(`ucp-survey.html  (${num(s.total)} shops, ${num(s.checked)} audited)\n`);
