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
  /** Extra attributes for script tags (e.g., crossorigin, integrity) */
  scriptAttrs?: Record<string, string>
  /** Extra attributes for link tags */
  linkAttrs?: Record<string, string>
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
