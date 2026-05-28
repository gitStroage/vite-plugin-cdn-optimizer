import { describe, it, expect } from 'vitest'
import { inferGlobalName, buildGlobals } from '../src/globals'
import type { ResolvedPackage } from '../src/types'

describe('inferGlobalName', () => {
  it('converts simple names to PascalCase', () => {
    expect(inferGlobalName('vue')).toBe('Vue')
    expect(inferGlobalName('react')).toBe('React')
    expect(inferGlobalName('axios')).toBe('axios')
  })

  it('converts hyphenated names to PascalCase', () => {
    expect(inferGlobalName('react-dom')).toBe('ReactDOM')
    expect(inferGlobalName('vue-router')).toBe('VueRouter')
    expect(inferGlobalName('element-plus')).toBe('ElementPlus')
  })

  it('uses overrides for well-known packages', () => {
    expect(inferGlobalName('lodash-es')).toBe('_')
    expect(inferGlobalName('lodash')).toBe('_')
    expect(inferGlobalName('jquery')).toBe('$')
    expect(inferGlobalName('vue')).toBe('Vue')
    expect(inferGlobalName('react')).toBe('React')
    expect(inferGlobalName('react-dom')).toBe('ReactDOM')
    expect(inferGlobalName('echarts')).toBe('echarts')
    expect(inferGlobalName('dayjs')).toBe('dayjs')
    expect(inferGlobalName('pinia')).toBe('Pinia')
  })

  it('handles scoped-like names with slashes', () => {
    // Some packages use / in paths, but we test the name part
    expect(inferGlobalName('my-lib')).toBe('MyLib')
    expect(inferGlobalName('some-tool')).toBe('SomeTool')
  })
})

describe('buildGlobals', () => {
  it('maps package names to global names', () => {
    const pkgs: ResolvedPackage[] = [
      { name: 'vue', version: '3.5.13', globalName: 'Vue' },
      { name: 'react', version: '19.0.0', globalName: 'React' },
    ]
    expect(buildGlobals(pkgs)).toEqual({
      vue: 'Vue',
      react: 'React',
    })
  })

  it('returns empty map for empty input', () => {
    expect(buildGlobals([])).toEqual({})
  })

  it('uses the globalName from package config', () => {
    const pkgs: ResolvedPackage[] = [
      { name: 'lodash-es', version: '4.17.21', globalName: '_' },
    ]
    expect(buildGlobals(pkgs)).toEqual({ 'lodash-es': '_' })
  })
})
