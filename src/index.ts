import type { Plugin, ResolvedConfig } from 'vite'
import type { CdnOptions, CdnPackage, ResolvedPackage, CdnProvider } from './types'
import { buildExternal } from './external'
import { inferGlobalName, buildGlobals } from './globals'
import { resolveVersion } from './resolver'
import { generateHtmlTags } from './html'
import { detectSsr, shouldSkipHtmlInjection } from './ssr'

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
    // CSS-only packages don't need a globalName
    const globalName = pkg.css
      ? (pkg.globalName || '')
      : (pkg.globalName || inferGlobalName(pkg.name))
    return {
      ...pkg,
      version,
      globalName,
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
  let ssrContext = { isSsr: false, isSsrBuild: false }

  return {
    name: 'vite-plugin-cdn-optimizer',
    enforce: 'post',

    configResolved(config: ResolvedConfig) {
      isDev = config.command === 'serve'
      ssrContext = detectSsr(config as any)
      resolvedPkgs = resolvePackages(packages, config.root)
    },

    config(_, { command }) {
      // In SSR mode, don't set external/globals — SSR handles its own externals
      if (ssrContext.isSsr) {
        return {}
      }

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
      // Skip in SSR mode — no browser HTML to inject into
      if (shouldSkipHtmlInjection(ssrContext.isSsr, ssrContext.isSsrBuild)) return []

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
export { resolveVersion, resolveVersionFromPackageJson, extractVersion } from './resolver'
export { generateHtmlTags } from './html'
export { rewriteCssUrls, getCdnBase, cssPackage } from './css'
export { resolveSubpathUrl, findParentPackage, buildSubpathMap } from './subpath'
export { detectSsr, getSsrExternalPackages, shouldSkipHtmlInjection } from './ssr'
