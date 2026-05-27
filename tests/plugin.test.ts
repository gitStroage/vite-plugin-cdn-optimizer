import { describe, it, expect } from 'vitest'
import cdnOptimizer from '../src/index'
import type { CdnPackage } from '../src/types'

describe('cdnOptimizer', () => {
  it('returns a Vite plugin object', () => {
    const plugin = cdnOptimizer({
      packages: [{ name: 'vue', version: '3.5.13', globalName: 'Vue' }],
    })
    expect(plugin.name).toBe('vite-plugin-cdn-optimizer')
    expect(plugin.enforce).toBe('post')
    expect(typeof plugin.configResolved).toBe('function')
    expect(typeof plugin.config).toBe('function')
    expect(typeof plugin.transformIndexHtml).toBe('function')
  })

  it('has correct plugin name', () => {
    const plugin = cdnOptimizer({ packages: [] })
    expect(plugin.name).toBe('vite-plugin-cdn-optimizer')
  })

  it('enforces post order', () => {
    const plugin = cdnOptimizer({ packages: [] })
    expect(plugin.enforce).toBe('post')
  })
})
