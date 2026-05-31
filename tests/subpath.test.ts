import { describe, it, expect } from 'vitest'
import { resolveSubpathUrl, findParentPackage, buildSubpathMap } from '../src/subpath'
import type { ResolvedPackage } from '../src/types'

const lodash: ResolvedPackage = { name: 'lodash-es', version: '4.17.21', globalName: '_' }
const vue: ResolvedPackage = { name: 'vue', version: '3.5.13', globalName: 'Vue' }
const elementPlus: ResolvedPackage = { name: 'element-plus', version: '2.9.1', globalName: 'ElementPlus' }

describe('resolveSubpathUrl', () => {
  it('resolves lodash-es/get to CDN URL', () => {
    const url = resolveSubpathUrl('lodash-es/get', lodash, 'jsdelivr')
    expect(url).toBe('https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/get.js')
  })

  it('resolves with unpkg provider', () => {
    const url = resolveSubpathUrl('lodash-es/get', lodash, 'unpkg')
    expect(url).toBe('https://unpkg.com/lodash-es@4.17.21/get.js')
  })

  it('returns undefined for exact package name (no subpath)', () => {
    const url = resolveSubpathUrl('lodash-es', lodash, 'jsdelivr')
    expect(url).toBeUndefined()
  })

  it('handles subpath with existing extension', () => {
    const url = resolveSubpathUrl('lodash-es/get.js', lodash, 'jsdelivr')
    expect(url).toBe('https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/get.js')
  })

  it('handles deeper subpaths', () => {
    const url = resolveSubpathUrl('lodash-es/fp/get', lodash, 'jsdelivr')
    expect(url).toBe('https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/fp/get.js')
  })
})

describe('findParentPackage', () => {
  const pkgs = [lodash, vue, elementPlus]

  it('finds parent for subpath import', () => {
    const pkg = findParentPackage('lodash-es/get', pkgs)
    expect(pkg?.name).toBe('lodash-es')
  })

  it('returns undefined for exact match', () => {
    const pkg = findParentPackage('lodash-es', pkgs)
    expect(pkg).toBeUndefined()
  })

  it('returns undefined for unknown package', () => {
    const pkg = findParentPackage('react/jsx-runtime', pkgs)
    expect(pkg).toBeUndefined()
  })

  it('finds correct parent among multiple candidates', () => {
    const pkg = findParentPackage('element-plus/lib/button', pkgs)
    expect(pkg?.name).toBe('element-plus')
  })
})

describe('buildSubpathMap', () => {
  const pkgs = [lodash, vue]

  it('maps known imports to CDN URLs', () => {
    const imports = ['lodash-es/get', 'lodash-es/set', 'vue']
    const map = buildSubpathMap(pkgs, 'jsdelivr', imports)
    expect(map.get('lodash-es/get')).toBe('https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/get.js')
    expect(map.get('lodash-es/set')).toBe('https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/set.js')
    // Exact matches are not subpaths
    expect(map.has('vue')).toBe(false)
  })

  it('ignores unknown imports', () => {
    const imports = ['react-dom/client', 'unknown-pkg/foo']
    const map = buildSubpathMap(pkgs, 'jsdelivr', imports)
    expect(map.size).toBe(0)
  })

  it('returns empty map for empty inputs', () => {
    expect(buildSubpathMap([], 'jsdelivr', []).size).toBe(0)
  })
})
