import type { ResolvedPackage } from './types'

/**
 * SSR context information
 */
export interface SsrContext {
  /** Whether running in SSR mode */
  isSsr: boolean
  /** Whether this is an SSR build (vs dev SSR) */
  isSsrBuild: boolean
}

/**
 * Detect SSR context from Vite config.
 */
export function detectSsr(config: { command?: string; build?: { ssr?: boolean | string }; ssr?: { external?: string[]; noExternal?: string[] } }): SsrContext {
  const isSsrBuild = config.build?.ssr !== undefined && config.build?.ssr !== false
  const isSsr = isSsrBuild

  return { isSsr, isSsrBuild }
}

/**
 * Determine which packages should be externalized for SSR.
 * In SSR mode, packages should typically be externalized (loaded from node_modules)
 * rather than from CDN, since there's no browser to fetch from CDN.
 */
export function getSsrExternalPackages(
  pkgs: ResolvedPackage[],
  ssrConfig?: { external?: string[]; noExternal?: string[] },
): string[] {
  if (!ssrConfig) {
    // Default: externalize all CDN packages in SSR
    return pkgs.map(p => p.name)
  }

  const ssrExternal = ssrConfig.external
  const ssrNoExternal = new Set(ssrConfig.noExternal || [])

  // If noExternal includes '*', all packages are bundled (not external)
  if (ssrNoExternal.has('*')) return []

  // If explicit external list is provided, only externalize those
  if (ssrExternal && ssrExternal.length > 0) {
    const externalSet = new Set(ssrExternal)
    return pkgs
      .filter(p => externalSet.has(p.name) && !ssrNoExternal.has(p.name))
      .map(p => p.name)
  }

  // No explicit external list: externalize all, except noExternal
  return pkgs
    .filter(p => !ssrNoExternal.has(p.name))
    .map(p => p.name)
}

/**
 * Check if HTML injection should be skipped for this context.
 * In SSR mode, there's no HTML to inject into.
 */
export function shouldSkipHtmlInjection(isSsr: boolean, ssrBuild: boolean): boolean {
  // Skip HTML injection in SSR builds (no browser HTML)
  return isSsr || ssrBuild
}
