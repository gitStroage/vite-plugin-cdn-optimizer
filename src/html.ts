import type { ResolvedPackage, HtmlTagDescriptor } from './types'
import type { CdnProvider } from './types'
import { getCdnUrl } from './providers'

/**
 * Normalize attrs: boolean true -> empty string (for boolean HTML attributes)
 */
function normalizeAttrs(attrs: Record<string, string | boolean>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false) continue
    result[key] = value === true ? '' : value
  }
  return result
}

/**
 * Build a <script> tag for a JS package
 */
function buildScriptTag(
  pkg: ResolvedPackage,
  url: string,
  globalAttrs: Record<string, string>,
): HtmlTagDescriptor {
  const attrs: Record<string, string | boolean> = {
    src: url,
    ...globalAttrs,
  }

  // Per-package attrs override global
  if (pkg.attrs) {
    Object.assign(attrs, pkg.attrs)
  }

  // crossorigin: default 'anonymous' unless explicitly set to false
  if (attrs.crossorigin === undefined) {
    attrs.crossorigin = 'anonymous'
  }

  // Loading strategy
  if (pkg.loading === 'defer') {
    attrs.defer = true
  } else if (pkg.loading === 'async') {
    attrs.async = true
  }

  // SRI integrity
  if (pkg.integrity) {
    attrs.integrity = pkg.integrity
  }

  return {
    tag: 'script',
    attrs: normalizeAttrs(attrs),
    injectTo: 'head',
  }
}

/**
 * Build a <link rel="stylesheet"> tag for a CSS package
 */
function buildStyleTag(
  pkg: ResolvedPackage,
  url: string,
  globalAttrs: Record<string, string>,
): HtmlTagDescriptor {
  const attrs: Record<string, string | boolean> = {
    rel: 'stylesheet',
    href: url,
    ...globalAttrs,
  }

  if (pkg.attrs) {
    Object.assign(attrs, pkg.attrs)
  }

  if (attrs.crossorigin === undefined) {
    attrs.crossorigin = 'anonymous'
  }

  if (pkg.integrity) {
    attrs.integrity = pkg.integrity
  }

  if (pkg.media) {
    attrs.media = pkg.media
  }

  return {
    tag: 'link',
    attrs: normalizeAttrs(attrs),
    injectTo: 'head',
  }
}

/**
 * Build a <link rel="preload"> tag
 */
function buildPreloadTag(
  pkg: ResolvedPackage,
  url: string,
): HtmlTagDescriptor {
  return {
    tag: 'link',
    attrs: {
      rel: 'preload',
      href: url,
      as: pkg.css ? 'style' : 'script',
      crossorigin: 'anonymous',
    },
    injectTo: 'head-prepend',
  }
}

/**
 * Generate all HTML tags for CDN packages.
 *
 * Produces <script> and <link> tags with support for:
 * - SRI (integrity + crossorigin)
 * - defer / async loading
 * - preload hints
 * - per-package custom attributes
 */
export function generateHtmlTags(
  pkgs: ResolvedPackage[],
  provider: CdnProvider,
  options: {
    crossorigin?: string | false
    scriptAttrs?: Record<string, string>
    linkAttrs?: Record<string, string>
  } = {},
): HtmlTagDescriptor[] {
  const {
    crossorigin,
    scriptAttrs = {},
    linkAttrs = {},
  } = options

  const tags: HtmlTagDescriptor[] = []

  // Apply global crossorigin to attrs if set
  const effectiveScriptAttrs = { ...scriptAttrs }
  const effectiveLinkAttrs = { ...linkAttrs }
  if (crossorigin !== undefined && crossorigin !== false) {
    effectiveScriptAttrs.crossorigin = crossorigin
    effectiveLinkAttrs.crossorigin = crossorigin
  }

  for (const pkg of pkgs) {
    const url = getCdnUrl(pkg, provider)

    // Preload hints go first (head-prepend)
    if (pkg.preload) {
      tags.push(buildPreloadTag(pkg, url))
    }

    if (pkg.css) {
      tags.push(buildStyleTag(pkg, url, effectiveLinkAttrs))
    } else {
      tags.push(buildScriptTag(pkg, url, effectiveScriptAttrs))
    }
  }

  return tags
}
