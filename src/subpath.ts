import type { ResolvedPackage, CdnProvider } from './types'
import { getCdnUrl } from './providers'

/**
 * Sub-path import mapping entry
 */
export interface SubpathMapping {
  /** The import specifier (e.g., 'lodash-es/get') */
  importPath: string
  /** The parent package */
  package: ResolvedPackage
  /** The sub-path within the package (e.g., 'get.js') */
  subPath: string
  /** The CDN URL for this sub-path */
  cdnUrl: string
}

/**
 * Well-known sub-path patterns for popular packages.
 * Maps package name -> common sub-paths and their file extensions.
 */
const SUBPATH_PATTERNS: Record<string, { ext?: string; prefix?: string }> = {
  'lodash-es': { ext: '.js' },
  'lodash': { ext: '.js' },
  'rxjs': { ext: '.js' },
  'rxjs/operators': { ext: '.js' },
  'date-fns': { ext: '.js' },
  'antd': { prefix: 'lib' },
  'element-plus': { prefix: 'lib' },
  '@ant-design/icons': { prefix: 'lib' },
}

/**
 * Resolve a sub-path import to its CDN URL.
 *
 * For example:
 *   import('lodash-es/get') with jsdelivr ->
 *   https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/get.js
 */
export function resolveSubpathUrl(
  importPath: string,
  pkg: ResolvedPackage,
  provider: CdnProvider,
): string | undefined {
  const subPath = importPath.substring(pkg.name.length + 1) // +1 for the '/'

  if (!subPath) return undefined

  const pattern = SUBPATH_PATTERNS[pkg.name]
  let resolvedPath = subPath

  // Apply known extensions if the sub-path doesn't already have one
  if (pattern?.ext && !subPath.includes('.')) {
    resolvedPath = subPath + pattern.ext
  }

  // Apply prefix if configured
  if (pattern?.prefix) {
    resolvedPath = `${pattern.prefix}/${resolvedPath}`
  }

  // Build the CDN URL with the sub-path
  const basePkg = { ...pkg, path: resolvedPath }
  return getCdnUrl(basePkg, provider)
}

/**
 * Check if an import path is a sub-path of any configured package.
 * Returns the matching package if found.
 */
export function findParentPackage(
  importPath: string,
  pkgs: ResolvedPackage[],
): ResolvedPackage | undefined {
  return pkgs.find(pkg => {
    if (importPath === pkg.name) return false // exact match, not sub-path
    return importPath.startsWith(`${pkg.name}/`)
  })
}

/**
 * Build a map of all known sub-path imports to their CDN URLs.
 * Useful for generating import map or resolve aliases.
 */
export function buildSubpathMap(
  pkgs: ResolvedPackage[],
  provider: CdnProvider,
  knownImports: string[],
): Map<string, string> {
  const map = new Map<string, string>()

  for (const importPath of knownImports) {
    const pkg = findParentPackage(importPath, pkgs)
    if (pkg) {
      const url = resolveSubpathUrl(importPath, pkg, provider)
      if (url) {
        map.set(importPath, url)
      }
    }
  }

  return map
}
