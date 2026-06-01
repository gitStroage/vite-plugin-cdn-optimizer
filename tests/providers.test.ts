import { describe, it, expect } from 'vitest'
import { getCdnUrl, getCdnUrlGenerator } from '../src/providers'
import type { ResolvedPackage } from '../src/types'

const vue: ResolvedPackage = { name: 'vue', version: '3.5.13', globalName: 'Vue' }
const vueCss: ResolvedPackage = { name: 'element-plus', version: '2.9.1', path: 'dist/index.css', css: true, globalName: '' }
const lodash: ResolvedPackage = { name: 'lodash-es', version: '4.17.21', globalName: '_' }

describe('getCdnUrl', () => {
  describe('jsdelivr', () => {
    it('generates basic URL', () => {
      expect(getCdnUrl(vue, 'jsdelivr')).toBe('https://cdn.jsdelivr.net/npm/vue@3.5.13')
    })

    it('handles sub-path', () => {
      expect(getCdnUrl(vueCss, 'jsdelivr')).toBe('https://cdn.jsdelivr.net/npm/element-plus@2.9.1/dist/index.css')
    })

    it('handles scoped packages', () => {
      const pkg: ResolvedPackage = { name: '@vue/runtime-dom', version: '3.5.13', globalName: 'VueRuntimeDom' }
      expect(getCdnUrl(pkg, 'jsdelivr')).toBe('https://cdn.jsdelivr.net/npm/@vue/runtime-dom@3.5.13')
    })

    it('handles scoped package with sub-path', () => {
      const pkg: ResolvedPackage = { name: '@vue/runtime-dom', version: '3.5.13', path: 'dist/runtime-dom.esm-bundler.js', globalName: 'VueRuntimeDom' }
      expect(getCdnUrl(pkg, 'jsdelivr')).toBe('https://cdn.jsdelivr.net/npm/@vue/runtime-dom@3.5.13/dist/runtime-dom.esm-bundler.js')
    })
  })

  describe('unpkg', () => {
    it('generates basic URL', () => {
      expect(getCdnUrl(vue, 'unpkg')).toBe('https://unpkg.com/vue@3.5.13')
    })

    it('handles sub-path', () => {
      expect(getCdnUrl(vueCss, 'unpkg')).toBe('https://unpkg.com/element-plus@2.9.1/dist/index.css')
    })

    it('handles scoped packages', () => {
      const pkg: ResolvedPackage = { name: '@vue/runtime-dom', version: '3.5.13', globalName: 'VueRuntimeDom' }
      expect(getCdnUrl(pkg, 'unpkg')).toBe('https://unpkg.com/@vue/runtime-dom@3.5.13')
    })
  })

  describe('cdnjs', () => {
    it('generates basic URL', () => {
      expect(getCdnUrl(vue, 'cdnjs')).toBe('https://cdnjs.cloudflare.com/ajax/libs/vue/3.5.13')
    })

    it('handles sub-path', () => {
      expect(getCdnUrl(vueCss, 'cdnjs')).toBe('https://cdnjs.cloudflare.com/ajax/libs/element-plus/2.9.1/dist/index.css')
    })
  })

  describe('default provider', () => {
    it('defaults to jsdelivr when no provider specified', () => {
      expect(getCdnUrl(vue)).toBe('https://cdn.jsdelivr.net/npm/vue@3.5.13')
    })
  })

  describe('pre-release versions', () => {
    it('handles pre-release version', () => {
      const pkg: ResolvedPackage = { name: 'vue', version: '3.5.13-beta.1', globalName: 'Vue' }
      expect(getCdnUrl(pkg, 'jsdelivr')).toBe('https://cdn.jsdelivr.net/npm/vue@3.5.13-beta.1')
    })

    it('handles alpha version', () => {
      const pkg: ResolvedPackage = { name: 'react', version: '19.0.0-alpha.1', globalName: 'React' }
      expect(getCdnUrl(pkg, 'unpkg')).toBe('https://unpkg.com/react@19.0.0-alpha.1')
    })
  })

  describe('edge cases', () => {
    it('handles deep sub-path', () => {
      const pkg: ResolvedPackage = { name: 'antd', version: '5.24.7', path: 'lib/button/style/index.css', css: true, globalName: '' }
      expect(getCdnUrl(pkg, 'jsdelivr')).toBe('https://cdn.jsdelivr.net/npm/antd@5.24.7/lib/button/style/index.css')
    })

    it('handles package with no path', () => {
      const pkg: ResolvedPackage = { name: 'lodash-es', version: '4.17.21', globalName: '_' }
      expect(getCdnUrl(pkg, 'jsdelivr')).toBe('https://cdn.jsdelivr.net/npm/lodash-es@4.17.21')
    })
  })
})

describe('getCdnUrlGenerator', () => {
  it('returns a function for each provider', () => {
    expect(typeof getCdnUrlGenerator('jsdelivr')).toBe('function')
    expect(typeof getCdnUrlGenerator('unpkg')).toBe('function')
    expect(typeof getCdnUrlGenerator('cdnjs')).toBe('function')
  })

  it('throws for unknown provider', () => {
    expect(() => getCdnUrlGenerator('unknown' as any)).toThrow('Unknown CDN provider')
  })

  it('generated function produces correct URLs', () => {
    const gen = getCdnUrlGenerator('unpkg')
    expect(gen(vue)).toBe('https://unpkg.com/vue@3.5.13')
  })
})
