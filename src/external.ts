import type { ResolvedPackage } from './types'

/**
 * Build a Rollup external function from resolved packages.
 * Matches exact package names and sub-path imports (e.g., lodash-es/get).
 */
export function buildExternal(pkgs: ResolvedPackage[]) {
  const names = new Set(pkgs.map(p => p.name))

  return (id: string) => {
    if (names.has(id)) return true
    for (const name of names) {
      if (id.startsWith(`${name}/`)) return true
    }
    return false
  }
}

/**
 * Check if a module ID matches any of the external packages.
 */
export function isExternal(id: string, pkgs: ResolvedPackage[]): boolean {
  const names = pkgs.map(p => p.name)
  if (names.includes(id)) return true
  return names.some(name => id.startsWith(`${name}/`))
}
