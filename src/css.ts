import type { ResolvedPackage, CssRewriteContext } from './types'
import type { CdnProvider } from './types'
import { getCdnUrl } from './providers'

/**
 * Rewrite relative URLs in CSS content to point to the CDN.
 *
 * Handles url() references in CSS:
 *   url(../fonts/icon.woff) -> url({cdnBase}/fonts/icon.woff)
 *   url('./img/bg.png')     -> url('{cdnBase}/img/bg.png')
 *   url("data:...")         -> unchanged (absolute/data URI)
 *
 * Also handles @import:
 *   @import './reset.css'   -> @import '{cdnBase}/reset.css'
 */
export function rewriteCssUrls(
  css: string,
  ctx: CssRewriteContext,
): string {
  const { cdnBase, cssPath } = ctx

  // Compute the directory of the CSS file relative to the package root
  const cssDir = cssPath.includes('/')
    ? cssPath.substring(0, cssPath.lastIndexOf('/'))
    : ''

  // Build the base for relative resolution
  const base = cssDir
    ? `${cdnBase}/${cssDir}`
    : cdnBase

  // Rewrite url() references
  // Matches: url(path), url('path'), url("path")
  const urlPattern = /url\(\s*(['"]?)([^'"()]+?)\1\s*\)/g

  const rewritten = css.replace(urlPattern, (_match, quote, url) => {
    // Skip absolute URLs, data URIs, and protocol-relative URLs
    if (
      url.startsWith('data:') ||
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('//')
    ) {
      return _match
    }

    // Resolve relative path
    const resolved = resolveRelativePath(url, base)
    return `url(${quote}${resolved}${quote})`
  })

  // Rewrite @import with relative paths
  const importPattern = /@import\s+(?:url\(\s*(['"]?)([^'"()]+?)\1\s*\)|(['"])([^'"()]+?)\3)\s*;?/g

  return rewritten.replace(importPattern, (_match, q1, url1, q2, url2) => {
    const url = url1 || url2
    const quote = q1 || q2 || "'"

    if (
      url.startsWith('data:') ||
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('//')
    ) {
      return _match
    }

    const resolved = resolveRelativePath(url, base)
    return `@import ${quote}${resolved}${quote};`
  })
}

/**
 * Resolve a relative URL against a base URL.
 * Handles ../ and ./ prefixes.
 */
function resolveRelativePath(url: string, base: string): string {
  // Remove leading ./
  let cleanUrl = url.replace(/^\.\//, '')

  // Handle ../ traversal
  let baseParts = base.split('/')
  let upCount = 0

  while (cleanUrl.startsWith('../')) {
    upCount++
    cleanUrl = cleanUrl.substring(3)
  }

  // Remove base parts for each ../
  if (upCount > 0 && baseParts.length > upCount) {
    baseParts = baseParts.slice(0, -upCount)
  }

  const resolvedBase = baseParts.join('/')
  return cleanUrl ? `${resolvedBase}/${cleanUrl}` : resolvedBase
}

/**
 * Build the CDN base URL for a package (without sub-path).
 * Used as the root for CSS path rewriting.
 */
export function getCdnBase(pkg: ResolvedPackage, provider: CdnProvider): string {
  return getCdnUrl({ ...pkg, path: undefined }, provider)
}

/**
 * Check if a package has CSS content that needs path rewriting.
 */
export function hasCssRewrite(pkg: ResolvedPackage): boolean {
  if (!pkg.css) return false
  // Only rewrite if there's a path (otherwise it's a root CSS file)
  return true
}

/**
 * Convenience: create a CSS-only CdnPackage.
 * Sets css=true and provides a sensible default globalName.
 */
export function cssPackage(
  name: string,
  options: Omit<ResolvedPackage, 'name' | 'css' | 'globalName'> & { globalName?: string } = {} as any,
): ResolvedPackage {
  return {
    name,
    css: true,
    globalName: options.globalName || '',
    ...options,
    version: options.version || '',
  }
}
