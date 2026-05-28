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
 * Resolve all package versions. Throws if any version cannot be resolved.
 */
export function resolvePackageVersions(
  packages: Array<{ name: string; version?: string }>,
  root?: string,
): Array<{ name: string; version: string }> {
  return packages.map((pkg) => {
    const version = pkg.version || resolveVersion(pkg.name, root)
    if (!version) {
      throw new Error(
        `[vite-plugin-cdn-optimizer] Cannot resolve version for "${pkg.name}". ` +
        `Please specify the version explicitly or install the package first.`
      )
    }
    return { name: pkg.name, version }
  })
}
