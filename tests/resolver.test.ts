import { describe, it, expect } from 'vitest'
import { extractVersion, resolveVersionFromPackageJson } from '../src/resolver'

describe('extractVersion', () => {
  it('extracts from caret range', () => {
    expect(extractVersion('^3.5.13')).toBe('3.5.13')
  })

  it('extracts from tilde range', () => {
    expect(extractVersion('~3.5.13')).toBe('3.5.13')
  })

  it('extracts from exact version', () => {
    expect(extractVersion('3.5.13')).toBe('3.5.13')
  })

  it('extracts from gte range', () => {
    expect(extractVersion('>=3.5.13')).toBe('3.5.13')
  })

  it('extracts from complex range', () => {
    expect(extractVersion('^3.5.13-beta.1')).toBe('3.5.13-beta.1')
  })

  it('returns undefined for invalid input', () => {
    expect(extractVersion('latest')).toBeUndefined()
    expect(extractVersion('workspace:*')).toBeUndefined()
    expect(extractVersion('')).toBeUndefined()
  })
})

describe('resolveVersionFromPackageJson', () => {
  it('returns undefined for non-existent root', () => {
    const version = resolveVersionFromPackageJson('vue', '/non/existent/path')
    expect(version).toBeUndefined()
  })
})
