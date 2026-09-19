# Contributing

This is a personal site, so pull requests that change its wording or its claims
will usually be declined. Two kinds of change are welcome:

- **A factual correction.** If a number, a date or a claim on the site is
  wrong, open an issue with the evidence. Published numbers are meant to be
  checkable; being wrong in public is worse than being corrected.
- **A broken page.** Layout that fails at some width, a dead link, a page that
  does not render.

## Working on it

No dependencies to install. Node 22 or newer:

```console
$ node build.mjs
$ node survey.mjs ../ucp-audit/survey/2026-09-18-aggregate.json
$ python -m http.server 8765      # then open http://127.0.0.1:8765
```

Generated files (`tools/*.html`, `ucp-survey.html`, `sitemap.xml`) are committed,
so run the generator and commit its output rather than editing the result.

Never hand-edit a number on a page. It comes from the aggregate file the audit
wrote; if it is wrong, the run is wrong, and that is what gets fixed.
