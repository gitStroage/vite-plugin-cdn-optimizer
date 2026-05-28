import type { Plugin, ResolvedConfig } from 'vite'
import type { CdnOptions, CdnPackage, ResolvedPackage } from './types'
import { getCdnUrl } from './providers'
import { buildExternal } from './external'
import { inferGlobalName, buildGlobals } from './globals'
import { resolveVersion } from './resolver'

export type { CdnOptions, CdnPackage }

/**
 * Resolve packages: fill in missing version and globalName
 */
function resolvePackages(packages: CdnPackage[], root?: string): ResolvedPackage[] {
  return packages.map((pkg) => {
    const version = pkg.version || resolveVersion(pkg.name, root)
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
      resolvedPkgs = resolvePackages(packages, config.root)
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
      if (isDev && !devMode) return []
      return generateHtmlTags(resolvedPkgs, provider, scriptAttrs, linkAttrs)
    },
  }
}

export { inferGlobalName } from './globals'
export { buildExternal, isExternal } from './external'
export { getCdnUrl, getCdnUrlGenerator } from './providers'
export { resolveVersion } from './resolver'
