import { describe, it, expect } from 'vitest'
import { buildExternal, isExternal } from '../src/external'
import type { ResolvedPackage } from '../src/types'

const pkgs: ResolvedPackage[] = [
  { name: 'vue', version: '3.5.13', globalName: 'Vue' },
  { name: 'lodash-es', version: '4.17.21', globalName: '_' },
  { name: 'element-plus', version: '2.9.1', globalName: 'ElementPlus' },
]

describe('buildExternal', () => {
  it('returns a function', () => {
    const fn = buildExternal(pkgs)
    expect(typeof fn).toBe('function')
  })

  it('matches exact package name', () => {
    const fn = buildExternal(pkgs)
    expect(fn('vue')).toBe(true)
    expect(fn('lodash-es')).toBe(true)
    expect(fn('element-plus')).toBe(true)
  })

  it('matches sub-path imports', () => {
    const fn = buildExternal(pkgs)
    expect(fn('vue/dist/vue.runtime.esm-bundler.js')).toBe(true)
    expect(fn('lodash-es/get')).toBe(true)
    expect(fn('element-plus/dist/index.css')).toBe(true)
  })

  it('does not match unrelated packages', () => {
    const fn = buildExternal(pkgs)
    expect(fn('react')).toBe(false)
    expect(fn('axios')).toBe(false)
    expect(fn('vuepress')).toBe(false)
  })

  it('does not match partial names', () => {
    const fn = buildExternal(pkgs)
    expect(fn('vue-router')).toBe(false)
    expect(fn('lodash')).toBe(false)
  })

  it('handles empty package list', () => {
    const fn = buildExternal([])
    expect(fn('vue')).toBe(false)
    expect(fn('anything')).toBe(false)
  })
})

describe('isExternal', () => {
  it('matches exact names', () => {
    expect(isExternal('vue', pkgs)).toBe(true)
    expect(isExternal('react', pkgs)).toBe(false)
  })

  it('matches sub-paths', () => {
    expect(isExternal('lodash-es/get', pkgs)).toBe(true)
    expect(isExternal('unknown/path', pkgs)).toBe(false)
  })
})
