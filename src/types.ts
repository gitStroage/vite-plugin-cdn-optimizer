/**
 * CDN provider type
 */
export type CdnProvider = 'unpkg' | 'jsdelivr' | 'cdnjs'

/**
 * A single package to be loaded from CDN
 */
export interface CdnPackage {
  /** Package name (e.g., 'vue', 'react', 'lodash-es') */
  name: string
  /** Version override. If omitted, auto-detected from node_modules */
  version?: string
  /** Sub-path to load (e.g., 'dist/index.css') */
  path?: string
  /** Global variable name (e.g., 'Vue'). If omitted, auto-inferred */
  globalName?: string
  /** Whether this is a CSS-only entry */
  css?: boolean
  /** Per-package extra attributes for the HTML tag */
  attrs?: Record<string, string | boolean>
  /** SRI integrity hash (e.g., 'sha384-...') */
  integrity?: string
  /** Script loading strategy. Default: no defer/async */
  loading?: 'defer' | 'async'
  /** Add a preload link hint for this resource */
  preload?: boolean
  /** Media query for CSS link tags (e.g., 'screen', 'print', '(min-width: 768px)') */
  media?: string
}

/**
 * Plugin options
 */
export interface CdnOptions {
  /** CDN provider to use. Default: 'jsdelivr' */
  provider?: CdnProvider
  /** List of packages to load from CDN */
  packages: CdnPackage[]
  /** Whether to enable in dev mode. Default: false */
  devMode?: boolean
  /** Default crossorigin for all script/link tags. Default: 'anonymous' */
  crossorigin?: string | false
  /** Extra attributes applied to all script tags */
  scriptAttrs?: Record<string, string>
  /** Extra attributes applied to all link tags */
  linkAttrs?: Record<string, string>
  /** Enable CSS resource path rewriting (fonts, images). Default: true */
  rewriteCss?: boolean
}

/**
 * Resolved package with version and globalName guaranteed to be set
 */
export interface ResolvedPackage extends CdnPackage {
  version: string
  globalName: string
}

/**
 * CDN URL generator function
 */
export type CdnUrlGenerator = (pkg: ResolvedPackage) => string

/**
 * HTML tag descriptor compatible with Vite's transformIndexHtml
 */
export interface HtmlTagDescriptor {
  tag: string
  attrs: Record<string, string | boolean>
  children?: string
  injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend'
}

/**
 * Context for CSS path rewriting
 */
export interface CssRewriteContext {
  /** The CDN base URL for the package (e.g., https://cdn.jsdelivr.net/npm/element-plus@2.9.1) */
  cdnBase: string
  /** The original CSS file path relative to the package */
  cssPath: string
}
