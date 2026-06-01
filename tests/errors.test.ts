import { describe, it, expect } from 'vitest'
import cdnOptimizer from '../src/index'
import { getCdnUrlGenerator } from '../src/providers'
import { resolvePackageVersions } from '../src/resolver'

function mockConfig(command: 'serve' | 'build' = 'build') {
  return { command, root: process.cwd() } as any
}

describe('error scenarios', () => {
  describe('missing version', () => {
    it('throws when version cannot be resolved', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'totally-fake-package-xyz-123' }],
      })
      expect(() => {
        ;(plugin as any).configResolved(mockConfig())
      }).toThrow('Cannot resolve version')
    })

    it('error message includes package name', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'my-missing-pkg' }],
      })
      expect(() => {
        ;(plugin as any).configResolved(mockConfig())
      }).toThrow('my-missing-pkg')
    })
  })

  describe('resolvePackageVersions', () => {
    it('throws for unresolvable packages', () => {
      expect(() => {
        resolvePackageVersions([{ name: 'totally-fake-xyz' }])
      }).toThrow('Cannot resolve version')
    })

    it('uses explicit version when provided', () => {
      const result = resolvePackageVersions([{ name: 'vue', version: '3.5.13' }])
      expect(result).toEqual([{ name: 'vue', version: '3.5.13' }])
    })
  })

  describe('invalid provider', () => {
    it('getCdnUrlGenerator throws for unknown provider', () => {
      expect(() => getCdnUrlGenerator('bunny' as any)).toThrow('Unknown CDN provider')
    })
  })

  describe('empty inputs', () => {
    it('handles empty packages array', () => {
      const plugin = cdnOptimizer({ packages: [] })
      ;(plugin as any).configResolved(mockConfig())
      const config = (plugin as any).config({}, { command: 'build' })
      expect(config.build.rollupOptions.output.globals).toEqual({})
      const tags = (plugin as any).transformIndexHtml()
      expect(tags).toEqual([])
    })

    it('handles no scriptAttrs or linkAttrs', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'vue', version: '3.5.13' }],
      })
      ;(plugin as any).configResolved(mockConfig())
      const tags = (plugin as any).transformIndexHtml()
      expect(tags).toHaveLength(1)
    })
  })

  describe('duplicate packages', () => {
    it('handles same package listed multiple times (different paths)', () => {
      const plugin = cdnOptimizer({
        packages: [
          { name: 'element-plus', version: '2.9.1', css: true },
          { name: 'element-plus', version: '2.9.1', css: true, path: 'theme-chalk/dark/css-vars.css' },
        ],
      })
      ;(plugin as any).configResolved(mockConfig())
      const tags = (plugin as any).transformIndexHtml()
      expect(tags).toHaveLength(2)
    })
  })

  describe('crossorigin edge cases', () => {
    it('default crossorigin is anonymous for scripts', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'vue', version: '3.5.13' }],
      })
      ;(plugin as any).configResolved(mockConfig())
      const tags = (plugin as any).transformIndexHtml()
      expect(tags[0].attrs.crossorigin).toBe('anonymous')
    })

    it('default crossorigin is anonymous for CSS', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'element-plus', version: '2.9.1', css: true }],
      })
      ;(plugin as any).configResolved(mockConfig())
      const tags = (plugin as any).transformIndexHtml()
      expect(tags[0].attrs.crossorigin).toBe('anonymous')
    })
  })
})
