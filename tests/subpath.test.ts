import { describe, it, expect } from 'vitest'
import { resolveSubpathUrl, findParentPackage, buildSubpathMap } from '../src/subpath'
import type { ResolvedPackage } from '../src/types'

const lodash: ResolvedPackage = { name: 'lodash-es', version: '4.17.21', globalName: '_' }
const vue: ResolvedPackage = { name: 'vue', version: '3.5.13', globalName: 'Vue' }
const elementPlus: ResolvedPackage = { name: 'element-plus', version: '2.9.1', globalName: 'ElementPlus' }

describe('resolveSubpathUrl', () => {
  it('resolves lodash-es/get to CDN URL with extension', () => {
    const url = resolveSubpathUrl('lodash-es/get', lodash, 'jsdelivr')
    expect(url).toBe('https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/get.js')
  })

  it('resolves with unpkg provider', () => {
    const url = resolveSubpathUrl('lodash-es/get', lodash, 'unpkg')
    expect(url).toBe('https://unpkg.com/lodash-es@4.17.21/get.js')
  })

  it('resolves with cdnjs provider', () => {
    const url = resolveSubpathUrl('lodash-es/get', lodash, 'cdnjs')
    expect(url).toBe('https://cdnjs.cloudflare.com/ajax/libs/lodash-es/4.17.21/get.js')
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

  it('handles subpath for package without known pattern', () => {
    const customPkg: ResolvedPackage = { name: 'my-custom-lib', version: '1.0.0', globalName: 'MyCustomLib' }
    const url = resolveSubpathUrl('my-custom-lib/utils/format', customPkg, 'jsdelivr')
    // No known pattern, so no extension added
    expect(url).toBe('https://cdn.jsdelivr.net/npm/my-custom-lib@1.0.0/utils/format')
  })

  it('handles scoped package subpath', () => {
    const scopedPkg: ResolvedPackage = { name: '@vue/runtime-dom', version: '3.5.13', globalName: 'VueRuntimeDom' }
    const url = resolveSubpathUrl('@vue/runtime-dom/dist/runtime-dom.esm-bundler.js', scopedPkg, 'jsdelivr')
    expect(url).toBe('https://cdn.jsdelivr.net/npm/@vue/runtime-dom@3.5.13/dist/runtime-dom.esm-bundler.js')
  })
})

describe('findParentPackage', () => {
  const pkgs = [lodash, vue, elementPlus]

  it('finds parent for subpath import', () => {
    const pkg = findParentPackage('lodash-es/get', pkgs)
    expect(pkg?.name).toBe('lodash-es')
  })

  it('returns undefined for exact match (not a subpath)', () => {
    const pkg = findParentPackage('lodash-es', pkgs)
    expect(pkg).toBeUndefined()
  })

  it('returns undefined for unknown package', () => {
    const pkg = findParentPackage('react-dom/client', pkgs)
    expect(pkg).toBeUndefined()
  })

  it('finds correct parent among multiple candidates', () => {
    const pkg = findParentPackage('element-plus/lib/button', pkgs)
    expect(pkg?.name).toBe('element-plus')
  })

  it('returns first matching parent', () => {
    // If two packages could match (unlikely but possible with prefixes)
    const pkgs2 = [
      { name: 'lodash', version: '4.17.21', globalName: '_' },
      { name: 'lodash-es', version: '4.17.21', globalName: '_' },
    ]
    const pkg = findParentPackage('lodash-es/get', pkgs2)
    // Should find lodash-es (exact prefix match before lodash)
    expect(pkg?.name).toBe('lodash-es')
  })

  it('does not match partial names', () => {
    const pkg = findParentPackage('vue-router', pkgs)
    expect(pkg).toBeUndefined()
  })

  it('handles empty package list', () => {
    expect(findParentPackage('lodash-es/get', [])).toBeUndefined()
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

  it('handles duplicate imports', () => {
    const imports = ['lodash-es/get', 'lodash-es/get']
    const map = buildSubpathMap(pkgs, 'jsdelivr', imports)
    expect(map.size).toBe(1)
  })

  it('works with all providers', () => {
    const imports = ['lodash-es/get']
    const jsdelivrMap = buildSubpathMap(pkgs, 'jsdelivr', imports)
    const unpkgMap = buildSubpathMap(pkgs, 'unpkg', imports)
    const cdnjsMap = buildSubpathMap(pkgs, 'cdnjs', imports)

    expect(jsdelivrMap.get('lodash-es/get')).toContain('jsdelivr')
    expect(unpkgMap.get('lodash-es/get')).toContain('unpkg')
    expect(cdnjsMap.get('lodash-es/get')).toContain('cdnjs')
  })
})
