import { describe, it, expect } from 'vitest'
import { detectSsr, getSsrExternalPackages, shouldSkipHtmlInjection } from '../src/ssr'
import type { ResolvedPackage } from '../src/types'

describe('detectSsr', () => {
  it('detects non-SSR mode', () => {
    const ctx = detectSsr({ command: 'build' })
    expect(ctx.isSsr).toBe(false)
    expect(ctx.isSsrBuild).toBe(false)
  })

  it('detects SSR build with boolean true', () => {
    const ctx = detectSsr({ build: { ssr: true } })
    expect(ctx.isSsr).toBe(true)
    expect(ctx.isSsrBuild).toBe(true)
  })

  it('detects SSR build with string entry', () => {
    const ctx = detectSsr({ build: { ssr: 'src/entry-server.ts' } })
    expect(ctx.isSsr).toBe(true)
    expect(ctx.isSsrBuild).toBe(true)
  })

  it('detects non-SSR when build.ssr is false', () => {
    const ctx = detectSsr({ build: { ssr: false } })
    expect(ctx.isSsr).toBe(false)
    expect(ctx.isSsrBuild).toBe(false)
  })
})

describe('getSsrExternalPackages', () => {
  const pkgs: ResolvedPackage[] = [
    { name: 'vue', version: '3.5.13', globalName: 'Vue' },
    { name: 'lodash-es', version: '4.17.21', globalName: '_' },
    { name: 'element-plus', version: '2.9.1', globalName: 'ElementPlus' },
  ]

  it('externalizes all packages by default', () => {
    const result = getSsrExternalPackages(pkgs)
    expect(result).toEqual(['vue', 'lodash-es', 'element-plus'])
  })

  it('respects noExternal list', () => {
    const result = getSsrExternalPackages(pkgs, { noExternal: ['vue'] })
    expect(result).toEqual(['lodash-es', 'element-plus'])
  })

  it('respects external list', () => {
    const result = getSsrExternalPackages(pkgs, { external: ['vue', 'lodash-es'] })
    expect(result).toEqual(['vue', 'lodash-es'])
  })

  it('noExternal "*" prevents all externalization', () => {
    const result = getSsrExternalPackages(pkgs, { noExternal: ['*'] })
    expect(result).toEqual([])
  })

  it('noExternal takes precedence over external', () => {
    const result = getSsrExternalPackages(pkgs, {
      external: ['vue'],
      noExternal: ['vue'],
    })
    expect(result).not.toContain('vue')
  })
})

describe('shouldSkipHtmlInjection', () => {
  it('skips in SSR mode', () => {
    expect(shouldSkipHtmlInjection(true, false)).toBe(true)
  })

  it('skips in SSR build', () => {
    expect(shouldSkipHtmlInjection(false, true)).toBe(true)
  })

  it('does not skip in normal mode', () => {
    expect(shouldSkipHtmlInjection(false, false)).toBe(false)
  })
})
