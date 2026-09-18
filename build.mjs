#!/usr/bin/env node
/**
 * Builds a page per tool, plus sitemap.xml.
 *
 * One page listing eight tools competes with itself for every search. A page
 * per tool, each answering one question in its own title, heading and structured
 * data, does not. Node's standard library only - the whole site stays something
 * you can read end to end.
 *
 *     node build.mjs
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HERE = import.meta.dirname;
const SITE = "https://dkautomation23.github.io";
const GITHUB = "https://github.com/dkautomation23";
const AUTHOR = "Dmytro Galko";
const EMAIL = "hello@dkautomation.dev";

const tools = JSON.parse(readFileSync(join(HERE, "tools.json"), "utf8"));
const style = readFileSync(join(HERE, "style.css"), "utf8");

const escape = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page(tool) {
  const url = `${SITE}/tools/${tool.slug}.html`;
  const title = `${tool.name} — ${tool.tagline}`;

  // Schema.org, so a search engine can see this is a named piece of software
  // with an author, rather than one more page of prose.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    alternateName: tool.tagline,
    description: tool.summary,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, macOS, Windows",
    url,
    codeRepository: `${GITHUB}/${tool.slug}`,
    license: "https://opensource.org/licenses/MIT",
    keywords: tool.keywords.join(", "),
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    author: { "@type": "Person", name: AUTHOR, url: SITE, email: EMAIL },
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(tool.summary.slice(0, 300))}">
<meta name="keywords" content="${escape(tool.keywords.join(", "))}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(tool.summary.slice(0, 300))}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../style.css">
<link rel="icon" href="../favicon.svg">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>

<header class="compact">
  <div class="wrap">
    <p class="crumb"><a href="../">${escape(AUTHOR)}</a> · open-source tools</p>
    <h1>${escape(tool.name)}</h1>
    <p class="role">${escape(tool.tagline)}</p>
    <p class="lede">${escape(tool.summary)}</p>
    <div class="links">
      <a class="primary" href="${GITHUB}/${tool.slug}">Source on GitHub</a>
      <a href="../#work">Work with me</a>
    </div>
  </div>
</header>

<section>
  <div class="wrap">
    <h2>What it does</h2>
    <ul class="plain">
${tool.how.map((line) => `      <li>${escape(line)}</li>`).join("\n")}
    </ul>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>How it is proved</h2>
    <p class="note">${escape(tool.proof)}</p>
    <p class="tags">${tool.stack.map((item) => `<span>${escape(item)}</span>`).join("")}</p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>People find this looking for</h2>
    <p class="note">${escape(tool.search)}.</p>
    <p class="cta">
      If that is your week and you would rather someone else did it, write to
      <a href="mailto:${EMAIL}?subject=${encodeURIComponent(tool.name)}">${EMAIL}</a>
      or <a href="${GITHUB}/${tool.slug}/issues/new/choose">open an issue</a>.
    </p>
  </div>
</section>

<footer>
  <div class="wrap">
    <a href="../">All tools</a> ·
    <a href="${GITHUB}/${tool.slug}">${escape(tool.name)} on GitHub</a> ·
    MIT licensed
  </div>
</footer>

</body>
</html>
`;
}

mkdirSync(join(HERE, "tools"), { recursive: true });
for (const tool of tools) {
  writeFileSync(join(HERE, "tools", `${tool.slug}.html`), page(tool), "utf8");
  console.log(`tools/${tool.slug}.html`);
}

const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: `${SITE}/`, priority: "1.0" },
  // The survey is the only page here that is data rather than a tool, and the
  // one most likely to be linked to from elsewhere.
  { loc: `${SITE}/ucp-survey.html`, priority: "0.9" },
  ...tools.map((tool) => ({ loc: `${SITE}/tools/${tool.slug}.html`, priority: "0.8" })),
];
writeFileSync(
  join(HERE, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) =>
      `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${entry.priority}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`,
  "utf8",
);
console.log(`sitemap.xml (${urls.length} urls)`);
