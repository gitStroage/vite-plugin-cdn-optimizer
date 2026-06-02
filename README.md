# vite-plugin-cdn-optimizer

[![npm version](https://img.shields.io/npm/v/vite-plugin-cdn-optimizer.svg)](https://www.npmjs.com/package/vite-plugin-cdn-optimizer)
[![npm downloads](https://img.shields.io/npm/dm/vite-plugin-cdn-optimizer.svg)](https://www.npmjs.com/package/vite-plugin-cdn-optimizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Vite plugin to replace npm dependencies with CDN links for smaller production bundles

English | [中文](./README.zh-CN.md)

## Features

- **CDN Replacement** - Replace npm dependencies with CDN links (jsdelivr, unpkg, cdnjs)
- **Bundle Size Reduction** - Externalize large libraries to reduce build output
- **SRI Support** - Subresource Integrity for secure CDN loading
- **CSS Support** - CDN CSS with automatic URL rewriting for fonts/images
- **SSR Compatible** - Smart SSR detection, skips HTML injection in SSR mode
- **Sub-path Imports** - Support for tree-shaking friendly sub-path imports
- **Zero Dependencies** - No runtime dependencies

## Install

```bash
npm install -D vite-plugin-cdn-optimizer
# or
pnpm add -D vite-plugin-cdn-optimizer
```

## Quick Start

```typescript
// vite.config.ts
import cdnOptimizer from 'vite-plugin-cdn-optimizer'

export default {
  plugins: [
    cdnOptimizer({
      packages: [
        { name: 'vue', version: '3.5.13' },
        { name: 'vue-router', version: '4.5.0' },
        { name: 'element-plus', version: '2.9.1' },
        { name: 'element-plus', version: '2.9.1', css: true },
      ],
    }),
  ],
}
```

## Options

### `provider`

- Type: `'jsdelivr' | 'unpkg' | 'cdnjs'`
- Default: `'jsdelivr'`

CDN provider to use.

### `packages`

- Type: `CdnPackage[]`

List of packages to load from CDN.

```typescript
interface CdnPackage {
  name: string                    // Package name
  version?: string                // Auto-detected from node_modules if omitted
  path?: string                   // Sub-path (e.g., 'dist/index.css')
  globalName?: string             // Global variable name (auto-inferred if omitted)
  css?: boolean                   // Mark as CSS-only entry
  integrity?: string              // SRI hash (e.g., 'sha384-...')
  loading?: 'defer' | 'async'     // Script loading strategy
  preload?: boolean               // Add preload hint
  media?: string                  // Media query for CSS
  attrs?: Record<string, string | boolean>  // Per-package HTML attributes
}
```

### `devMode`

- Type: `boolean`
- Default: `false`

Whether to enable CDN injection in dev mode.

### `crossorigin`

- Type: `string | false`
- Default: `'anonymous'`

Crossorigin attribute for all tags. Set to `false` to disable.

### `scriptAttrs` / `linkAttrs`

- Type: `Record<string, string>`

Extra attributes applied to all script or link tags.

## Examples

### Vue 3 + Element Plus

```typescript
cdnOptimizer({
  packages: [
    { name: 'vue', version: '3.5.13' },
    { name: 'pinia', version: '3.0.1' },
    { name: 'vue-router', version: '4.5.0' },
    { name: 'element-plus', version: '2.9.1' },
    { name: 'element-plus', version: '2.9.1', css: true },
  ],
})
```

### React

```typescript
cdnOptimizer({
  packages: [
    { name: 'react', version: '19.0.0' },
    { name: 'react-dom', version: '19.0.0' },
    { name: 'react-router-dom', version: '7.1.1' },
  ],
})
```

### With SRI

```typescript
cdnOptimizer({
  packages: [
    {
      name: 'vue',
      version: '3.5.13',
      integrity: 'sha384-abc123...',
      loading: 'async',
    },
  ],
})
```

### CSS with Media Query

```typescript
cdnOptimizer({
  packages: [
    { name: 'element-plus', version: '2.9.1', css: true, media: 'screen' },
    { name: 'element-plus', version: '2.9.1', css: true, media: 'print' },
  ],
})
```

### With Preload

```typescript
cdnOptimizer({
  packages: [
    { name: 'vue', version: '3.5.13', preload: true },
  ],
})
```

## CSS URL Rewriting

The plugin can rewrite relative URLs in CSS files to point to the CDN:

```typescript
import { rewriteCssUrls, getCdnBase } from 'vite-plugin-cdn-optimizer'

const css = `@font-face { src: url(../fonts/icon.woff2); }`
const rewritten = rewriteCssUrls(css, {
  cdnBase: getCdnBase(pkg, 'jsdelivr'),
  cssPath: 'dist/index.css',
})
// Result: @font-face { src: url(https://cdn.jsdelivr.net/npm/element-plus@2.9.1/fonts/icon.woff2); }
```

## Sub-path Imports

Support for tree-shaking friendly imports:

```typescript
import { resolveSubpathUrl, buildSubpathMap } from 'vite-plugin-cdn-optimizer'

// Resolve single sub-path
resolveSubpathUrl('lodash-es/get', lodashPkg, 'jsdelivr')
// -> https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/get.js

// Build import map for multiple sub-paths
buildSubpathMap(pkgs, 'jsdelivr', ['lodash-es/get', 'lodash-es/set'])
```

## SSR Support

The plugin automatically detects SSR mode and skips HTML injection. In SSR builds, packages are not externalized (Vite SSR handles its own externals).

```typescript
// Works out of the box with SSR
// vite.config.ts
export default {
  plugins: [
    cdnOptimizer({
      packages: [{ name: 'vue', version: '3.5.13' }],
    }),
  ],
  ssr: {
    noExternal: ['element-plus'], // Bundled in SSR
  },
}
```

## Exported Utilities

```typescript
// CDN URL generation
getCdnUrl(pkg, provider)
getCdnUrlGenerator(provider)

// External/globals
buildExternal(pkgs)
isExternal(id, pkgs)
inferGlobalName(name)
buildGlobals(pkgs)

// Version resolution
resolveVersion(name, root?)
resolveVersionFromPackageJson(name, root?)
extractVersion(range)

// CSS
rewriteCssUrls(css, context)
getCdnBase(pkg, provider)
cssPackage(name, options)

// Sub-path
resolveSubpathUrl(importPath, pkg, provider)
findParentPackage(importPath, pkgs)
buildSubpathMap(pkgs, provider, imports)

// SSR
detectSsr(config)
getSsrExternalPackages(pkgs, ssrConfig)
shouldSkipHtmlInjection(isSsr, isSsrBuild)

// HTML
generateHtmlTags(pkgs, provider, options)
```

## Comparison

| Feature | vite-plugin-cdn-optimizer | vite-plugin-cdn | vite-plugin-externals |
|---------|--------------------------|-----------------|----------------------|
| CDN providers | 3 (jsdelivr, unpkg, cdnjs) | 1 | N/A |
| CSS support | ✅ | ✅ | ❌ |
| SRI | ✅ | ❌ | ❌ |
| Preload | ✅ | ❌ | ❌ |
| SSR | ✅ | ❌ | ❌ |
| Sub-path | ✅ | ❌ | ❌ |
| CSS URL rewrite | ✅ | ❌ | ❌ |
| Auto version | ✅ | ❌ | ❌ |
| Zero deps | ✅ | ❌ | ✅ |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
