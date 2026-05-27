import type { CdnProvider, CdnUrlGenerator, ResolvedPackage } from './types'

/**
 * unpkg URL: https://unpkg.com/package@version/path
 */
const unpkgUrl: CdnUrlGenerator = (pkg) => {
  const base = `https://unpkg.com/${pkg.name}@${pkg.version}`
  return pkg.path ? `${base}/${pkg.path}` : base
}

/**
 * jsdelivr URL: https://cdn.jsdelivr.net/npm/package@version/path
 */
const jsdelivrUrl: CdnUrlGenerator = (pkg) => {
  const base = `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}`
  return pkg.path ? `${base}/${pkg.path}` : base
}

/**
 * cdnjs URL: https://cdnjs.cloudflare.com/ajax/libs/package/version/path
 * Note: cdnjs uses different package naming, so we use the package name as-is
 */
const cdnjsUrl: CdnUrlGenerator = (pkg) => {
  const base = `https://cdnjs.cloudflare.com/ajax/libs/${pkg.name}/${pkg.version}`
  return pkg.path ? `${base}/${pkg.path}` : base
}

const generators: Record<CdnProvider, CdnUrlGenerator> = {
  unpkg: unpkgUrl,
  jsdelivr: jsdelivrUrl,
  cdnjs: cdnjsUrl,
}

/**
 * Get URL generator for a CDN provider
 */
export function getCdnUrlGenerator(provider: CdnProvider): CdnUrlGenerator {
  const gen = generators[provider]
  if (!gen) {
    throw new Error(`Unknown CDN provider: ${provider}`)
  }
  return gen
}

/**
 * Generate CDN URL for a package
 */
export function getCdnUrl(pkg: ResolvedPackage, provider: CdnProvider = 'jsdelivr'): string {
  return getCdnUrlGenerator(provider)(pkg)
}
