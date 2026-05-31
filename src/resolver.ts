import { existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

/**
 * Try to resolve a package version from node_modules.
 * Searches up the directory tree to support monorepo hoisted dependencies.
 */
export function resolveVersion(name: string, root?: string): string | undefined {
  const startDir = root || process.cwd()
  let dir = startDir

  while (true) {
    const pkgPath = join(dir, 'node_modules', name, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const content = readFileSync(pkgPath, 'utf-8')
        const pkg = JSON.parse(content)
        return pkg.version
      } catch {
        return undefined
      }
    }

    const parent = resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }

  return undefined
}

/**
 * Try to resolve a package version from the project's package.json dependencies.
 * Checks dependencies, devDependencies, and peerDependencies.
 * Returns the version range (e.g., "^3.5.13") — not the resolved version.
 */
export function resolveVersionFromPackageJson(
  name: string,
  root?: string,
): string | undefined {
  const startDir = root || process.cwd()
  const pkgPath = join(startDir, 'package.json')

  if (!existsSync(pkgPath)) return undefined

  try {
    const content = readFileSync(pkgPath, 'utf-8')
    const pkg = JSON.parse(content)
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    }
    return deps[name]
  } catch {
    return undefined
  }
}

/**
 * Extract the exact version from a version range string.
 * "^3.5.13" -> "3.5.13", "~3.5.13" -> "3.5.13", "3.5.13" -> "3.5.13"
 * Returns undefined if the string is not a valid semver-like range.
 */
export function extractVersion(versionRange: string): string | undefined {
  // Match semver: strip leading ^, ~, >=, <=, >, <, =
  const match = versionRange.match(/^[\^~>=<]*\s*(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)/)
  return match ? match[1] : undefined
}

/**
 * Resolve all package versions. Throws if any version cannot be resolved.
 * Tries in order: explicit version, node_modules, package.json range extraction.
 */
export function resolvePackageVersions(
  packages: Array<{ name: string; version?: string }>,
  root?: string,
): Array<{ name: string; version: string }> {
  return packages.map((pkg) => {
    if (pkg.version) return { name: pkg.name, version: pkg.version }

    // Try node_modules
    const installed = resolveVersion(pkg.name, root)
    if (installed) return { name: pkg.name, version: installed }

    // Try package.json range extraction
    const range = resolveVersionFromPackageJson(pkg.name, root)
    if (range) {
      const exact = extractVersion(range)
      if (exact) return { name: pkg.name, version: exact }
    }

    throw new Error(
      `[vite-plugin-cdn-optimizer] Cannot resolve version for "${pkg.name}". ` +
      `Please specify the version explicitly or install the package first.`
    )
  })
}
