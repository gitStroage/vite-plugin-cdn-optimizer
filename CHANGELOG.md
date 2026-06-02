# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2024-02-01

### Features

- **CDN Provider Support** - jsdelivr, unpkg, cdnjs
- **HTML Injection** - Automatic `<script>` and `<link>` tag injection via `transformIndexHtml`
- **Module Externalization** - Rollup external + globals mapping
- **CSS Support** - CSS-only packages with `css: true`, media queries
- **CSS URL Rewriting** - Automatic rewrite of relative URLs in CSS (fonts, images)
- **SRI (Subresource Integrity)** - `integrity` attribute support
- **Script Loading** - `defer` / `async` loading strategies
- **Preload Hints** - `<link rel="preload">` for performance
- **Per-package Attributes** - Custom HTML attributes per package
- **SSR Support** - Automatic SSR detection, skip HTML injection in SSR mode
- **Sub-path Imports** - Support for `lodash-es/get` style imports
- **Auto Version Detection** - Resolve version from node_modules or package.json
- **Global Variable Inference** - Auto-infer global names for 30+ common packages
- **Zero Dependencies** - No runtime dependencies
