import type { Plugin, ResolvedConfig } from 'vite'
import type { CdnOptions, CdnPackage, ResolvedPackage } from './types'
import { getCdnUrl } from './providers'

export type { CdnOptions, CdnPackage }

/**
 * Infer global variable name from package name
 * e.g., 'vue' -> 'Vue', 'react-dom' -> 'ReactDOM', 'lodash-es' -> '_'
 */
function inferGlobalName(name: string): string {
  const overrides: Record<string, string> = {
    'lodash-es': '_',
    'lodash': '_',
    'jquery': '$',
    'moment': 'moment',
    'dayjs': 'dayjs',
    'axios': 'axios',
  }
  if (overrides[name]) return overrides[name]
  return name
    .split(/[-/]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * Try to resolve package version from node_modules
 */
function resolveVersion(name: string): string | undefined {
  try {
    const pkgPath = require.resolve(`${name}/package.json`)
    const pkg = require(pkgPath)
    return pkg.version
  } catch {
    return undefined
  }
}

/**
 * Resolve packages: fill in missing version and globalName
 */
function resolvePackages(packages: CdnPackage[]): ResolvedPackage[] {
  return packages.map((pkg) => {
    const version = pkg.version || resolveVersion(pkg.name)
    if (!version) {
      throw new Error(
        `[vite-plugin-cdn-optimizer] Cannot resolve version for "${pkg.name}". ` +
        `Please specify the version explicitly or install the package first.`
      )
    }
    return {
      ...pkg,
      version,
      globalName: pkg.globalName || inferGlobalName(pkg.name),
    }
  })
}

/**
 * Build external function for Rollup
 */
function buildExternal(pkgs: ResolvedPackage[]) {
  const names = new Set(pkgs.map(p => p.name))
  return (id: string) => {
    // Exact match
    if (names.has(id)) return true
    // Sub-path match (e.g., lodash-es/get)
    for (const name of names) {
      if (id.startsWith(`${name}/`)) return true
    }
    return false
  }
}

/**
 * Build globals map for Rollup output
 */
function buildGlobals(pkgs: ResolvedPackage[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const pkg of pkgs) {
    map[pkg.name] = pkg.globalName!
  }
  return map
}

/**
 * Generate HTML tags for CDN packages
 */
function generateHtmlTags(
  pkgs: ResolvedPackage[],
  provider: string,
  scriptAttrs: Record<string, string> = {},
  linkAttrs: Record<string, string> = {},
) {
  const tags: Array<{ tag: string; attrs: Record<string, string>; injectTo?: 'head' | 'body' }> = []

  for (const pkg of pkgs) {
    const url = getCdnUrl(pkg, provider as any)
    if (pkg.css) {
      tags.push({
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href: url,
          ...linkAttrs,
        },
        injectTo: 'head',
      })
    } else {
      tags.push({
        tag: 'script',
        attrs: {
          src: url,
          crossorigin: 'anonymous',
          ...scriptAttrs,
        },
        injectTo: 'head',
      })
    }
  }

  return tags
}

/**
 * vite-plugin-cdn-optimizer
 *
 * Replaces npm dependencies with CDN links for smaller production bundles.
 */
export default function cdnOptimizer(options: CdnOptions): Plugin {
  const {
    provider = 'jsdelivr',
    packages,
    devMode = false,
    scriptAttrs = {},
    linkAttrs = {},
  } = options

  let resolvedPkgs: ResolvedPackage[]
  let isDev = false

  return {
    name: 'vite-plugin-cdn-optimizer',
    enforce: 'post',

    configResolved(config: ResolvedConfig) {
      isDev = config.command === 'serve'
      resolvedPkgs = resolvePackages(packages)
    },

    config() {
      return {
        build: {
          rollupOptions: {
            external: buildExternal(resolvedPkgs),
            output: {
              globals: buildGlobals(resolvedPkgs),
            },
          },
        },
      }
    },

    transformIndexHtml() {
      // Skip in dev mode unless devMode is enabled
      if (isDev && !devMode) return []

      return generateHtmlTags(resolvedPkgs, provider, scriptAttrs, linkAttrs)
    },
  }
}
