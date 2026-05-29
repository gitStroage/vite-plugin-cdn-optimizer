import type { Plugin, ResolvedConfig } from 'vite'
import type { CdnOptions, CdnPackage, ResolvedPackage, CdnProvider } from './types'
import { buildExternal } from './external'
import { inferGlobalName, buildGlobals } from './globals'
import { resolveVersion } from './resolver'
import { generateHtmlTags } from './html'

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
 * vite-plugin-cdn-optimizer
 *
 * Replaces npm dependencies with CDN links for smaller production bundles.
 */
export default function cdnOptimizer(options: CdnOptions): Plugin {
  const {
    provider = 'jsdelivr',
    packages,
    devMode = false,
    crossorigin,
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
      return generateHtmlTags(resolvedPkgs, provider as CdnProvider, {
        crossorigin,
        scriptAttrs,
        linkAttrs,
      })
    },
  }
}

export { inferGlobalName } from './globals'
export { buildExternal, isExternal } from './external'
export { getCdnUrl, getCdnUrlGenerator } from './providers'
export { resolveVersion } from './resolver'
export { generateHtmlTags } from './html'
