import { describe, it, expect, vi, beforeEach } from 'vitest'
import cdnOptimizer from '../src/index'
import type { CdnPackage, ResolvedPackage } from '../src/types'

// Simulate Vite's ResolvedConfig
function mockConfig(command: 'serve' | 'build' = 'build', extra: Record<string, any> = {}) {
  return {
    command,
    root: process.cwd(),
    build: { ssr: false },
    ...extra,
  } as any
}

describe('cdnOptimizer plugin', () => {
  it('returns a Vite plugin object with correct shape', () => {
    const plugin = cdnOptimizer({
      packages: [{ name: 'vue', version: '3.5.13', globalName: 'Vue' }],
    })
    expect(plugin.name).toBe('vite-plugin-cdn-optimizer')
    expect(plugin.enforce).toBe('post')
    expect(typeof plugin.configResolved).toBe('function')
    expect(typeof plugin.config).toBe('function')
    expect(typeof plugin.transformIndexHtml).toBe('function')
  })

  describe('configResolved hook', () => {
    it('resolves packages with explicit versions', () => {
      const plugin = cdnOptimizer({
        packages: [
          { name: 'vue', version: '3.5.13', globalName: 'Vue' },
          { name: 'react', version: '19.0.0', globalName: 'React' },
        ],
      })
      // Should not throw
      ;(plugin as any).configResolved(mockConfig())
    })

    it('throws for missing version when package not installed', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'non-existent-pkg-xyz' }],
      })
      expect(() => {
        ;(plugin as any).configResolved(mockConfig())
      }).toThrow('Cannot resolve version')
    })

    it('infers globalName for JS packages', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'vue', version: '3.5.13' }],
      })
      // configResolved sets up resolvedPkgs internally
      ;(plugin as any).configResolved(mockConfig())
      // We verify indirectly through config() output
      const config = (plugin as any).config({}, { command: 'build' })
      expect(config.build.rollupOptions.output.globals).toEqual({ vue: 'Vue' })
    })

    it('allows empty globalName for CSS packages', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'element-plus', version: '2.9.1', css: true }],
      })
      ;(plugin as any).configResolved(mockConfig())
      const config = (plugin as any).config({}, { command: 'build' })
      expect(config.build.rollupOptions.output.globals).toEqual({ 'element-plus': '' })
    })
  })

  describe('config hook', () => {
    it('returns rollupOptions with external and globals', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'vue', version: '3.5.13', globalName: 'Vue' }],
      })
      ;(plugin as any).configResolved(mockConfig())
      const config = (plugin as any).config({}, { command: 'build' })

      expect(config.build.rollupOptions).toBeDefined()
      expect(typeof config.build.rollupOptions.external).toBe('function')
      expect(config.build.rollupOptions.output.globals).toEqual({ vue: 'Vue' })
    })

    it('external function matches package names', () => {
      const plugin = cdnOptimizer({
        packages: [
          { name: 'vue', version: '3.5.13' },
          { name: 'lodash-es', version: '4.17.21' },
        ],
      })
      ;(plugin as any).configResolved(mockConfig())
      const config = (plugin as any).config({}, { command: 'build' })
      const external = config.build.rollupOptions.external

      expect(external('vue')).toBe(true)
      expect(external('lodash-es')).toBe(true)
      expect(external('lodash-es/get')).toBe(true)
      expect(external('react')).toBe(false)
    })

    it('returns empty config in SSR mode', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'vue', version: '3.5.13' }],
      })
      ;(plugin as any).configResolved(mockConfig('build', { build: { ssr: true } }))
      const config = (plugin as any).config({}, { command: 'build' })
      expect(config).toEqual({})
    })
  })

  describe('transformIndexHtml hook', () => {
    it('returns HTML tags in build mode', () => {
      const plugin = cdnOptimizer({
        packages: [
          { name: 'vue', version: '3.5.13', globalName: 'Vue' },
        ],
      })
      ;(plugin as any).configResolved(mockConfig('build'))
      const tags = (plugin as any).transformIndexHtml()

      expect(tags).toHaveLength(1)
      expect(tags[0].tag).toBe('script')
      expect(tags[0].attrs.src).toContain('vue@3.5.13')
    })

    it('returns empty array in dev mode by default', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'vue', version: '3.5.13' }],
      })
      ;(plugin as any).configResolved(mockConfig('serve'))
      const tags = (plugin as any).transformIndexHtml()
      expect(tags).toEqual([])
    })

    it('returns tags in dev mode when devMode is true', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'vue', version: '3.5.13' }],
        devMode: true,
      })
      ;(plugin as any).configResolved(mockConfig('serve'))
      const tags = (plugin as any).transformIndexHtml()
      expect(tags).toHaveLength(1)
    })

    it('returns empty array in SSR mode', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'vue', version: '3.5.13' }],
      })
      ;(plugin as any).configResolved(mockConfig('build', { build: { ssr: true } }))
      const tags = (plugin as any).transformIndexHtml()
      expect(tags).toEqual([])
    })

    it('generates both script and link tags', () => {
      const plugin = cdnOptimizer({
        packages: [
          { name: 'vue', version: '3.5.13', globalName: 'Vue' },
          { name: 'element-plus', version: '2.9.1', css: true },
        ],
      })
      ;(plugin as any).configResolved(mockConfig('build'))
      const tags = (plugin as any).transformIndexHtml()

      expect(tags).toHaveLength(2)
      expect(tags[0].tag).toBe('script')
      expect(tags[1].tag).toBe('link')
    })

    it('passes crossorigin option through', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'vue', version: '3.5.13' }],
        crossorigin: 'use-credentials',
      })
      ;(plugin as any).configResolved(mockConfig('build'))
      const tags = (plugin as any).transformIndexHtml()
      expect(tags[0].attrs.crossorigin).toBe('use-credentials')
    })

    it('passes scriptAttrs option through', () => {
      const plugin = cdnOptimizer({
        packages: [{ name: 'vue', version: '3.5.13' }],
        scriptAttrs: { 'data-plugin': 'cdn' },
      })
      ;(plugin as any).configResolved(mockConfig('build'))
      const tags = (plugin as any).transformIndexHtml()
      expect(tags[0].attrs['data-plugin']).toBe('cdn')
    })
  })

  describe('multiple packages', () => {
    it('handles a mix of JS and CSS packages', () => {
      const plugin = cdnOptimizer({
        packages: [
          { name: 'vue', version: '3.5.13', globalName: 'Vue' },
          { name: 'vue-router', version: '4.5.0', globalName: 'VueRouter' },
          { name: 'element-plus', version: '2.9.1', css: true },
          { name: 'element-plus', version: '2.9.1', css: true, path: 'theme-chalk/dark/css-vars.css' },
        ],
      })
      ;(plugin as any).configResolved(mockConfig('build'))
      const tags = (plugin as any).transformIndexHtml()

      expect(tags).toHaveLength(4)
      expect(tags.filter((t: any) => t.tag === 'script')).toHaveLength(2)
      expect(tags.filter((t: any) => t.tag === 'link')).toHaveLength(2)
    })

    it('generates correct globals map for multiple packages', () => {
      const plugin = cdnOptimizer({
        packages: [
          { name: 'vue', version: '3.5.13' },
          { name: 'pinia', version: '3.0.1' },
        ],
      })
      ;(plugin as any).configResolved(mockConfig('build'))
      const config = (plugin as any).config({}, { command: 'build' })

      expect(config.build.rollupOptions.output.globals).toEqual({
        vue: 'Vue',
        pinia: 'Pinia',
      })
    })
  })
})
