import { describe, it, expect } from 'vitest'
import { getCdnUrl, getCdnUrlGenerator } from '../src/providers'
import type { ResolvedPackage } from '../src/types'

const vue: ResolvedPackage = { name: 'vue', version: '3.5.13' }
const vueCss: ResolvedPackage = { name: 'element-plus', version: '2.9.1', path: 'dist/index.css', css: true }
const lodash: ResolvedPackage = { name: 'lodash-es', version: '4.17.21' }

describe('getCdnUrl', () => {
  it('generates jsdelivr URL (default)', () => {
    expect(getCdnUrl(vue)).toBe('https://cdn.jsdelivr.net/npm/vue@3.5.13')
  })

  it('generates unpkg URL', () => {
    expect(getCdnUrl(vue, 'unpkg')).toBe('https://unpkg.com/vue@3.5.13')
  })

  it('generates cdnjs URL', () => {
    expect(getCdnUrl(vue, 'cdnjs')).toBe('https://cdnjs.cloudflare.com/ajax/libs/vue/3.5.13')
  })

  it('handles sub-path', () => {
    expect(getCdnUrl(vueCss, 'jsdelivr')).toBe('https://cdn.jsdelivr.net/npm/element-plus@2.9.1/dist/index.css')
  })

  it('handles scoped packages', () => {
    const pkg: ResolvedPackage = { name: '@vue/runtime-dom', version: '3.5.13' }
    expect(getCdnUrl(pkg, 'unpkg')).toBe('https://unpkg.com/@vue/runtime-dom@3.5.13')
  })
})

describe('getCdnUrlGenerator', () => {
  it('returns a function', () => {
    const gen = getCdnUrlGenerator('jsdelivr')
    expect(typeof gen).toBe('function')
  })

  it('throws for unknown provider', () => {
    expect(() => getCdnUrlGenerator('unknown' as any)).toThrow('Unknown CDN provider')
  })
})
