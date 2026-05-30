import { describe, it, expect } from 'vitest'
import { generateHtmlTags } from '../src/html'
import type { ResolvedPackage } from '../src/types'

const vue: ResolvedPackage = { name: 'vue', version: '3.5.13', globalName: 'Vue' }
const lodash: ResolvedPackage = { name: 'lodash-es', version: '4.17.21', globalName: '_' }
const elementCss: ResolvedPackage = {
  name: 'element-plus',
  version: '2.9.1',
  globalName: 'ElementPlus',
  path: 'dist/index.css',
  css: true,
}

describe('generateHtmlTags', () => {
  it('generates script tags for JS packages', () => {
    const tags = generateHtmlTags([vue], 'jsdelivr')
    expect(tags).toHaveLength(1)
    expect(tags[0].tag).toBe('script')
    expect(tags[0].attrs.src).toBe('https://cdn.jsdelivr.net/npm/vue@3.5.13')
    expect(tags[0].attrs.crossorigin).toBe('anonymous')
    expect(tags[0].injectTo).toBe('head')
  })

  it('generates link tags for CSS packages', () => {
    const tags = generateHtmlTags([elementCss], 'jsdelivr')
    expect(tags).toHaveLength(1)
    expect(tags[0].tag).toBe('link')
    expect(tags[0].attrs.rel).toBe('stylesheet')
    expect(tags[0].attrs.href).toBe('https://cdn.jsdelivr.net/npm/element-plus@2.9.1/dist/index.css')
    expect(tags[0].attrs.crossorigin).toBe('anonymous')
  })

  it('handles mixed JS and CSS packages', () => {
    const tags = generateHtmlTags([vue, elementCss], 'jsdelivr')
    expect(tags).toHaveLength(2)
    expect(tags[0].tag).toBe('script')
    expect(tags[1].tag).toBe('link')
  })

  it('uses specified CDN provider', () => {
    const tags = generateHtmlTags([vue], 'unpkg')
    expect(tags[0].attrs.src).toBe('https://unpkg.com/vue@3.5.13')
  })

  it('returns empty array for empty packages', () => {
    const tags = generateHtmlTags([], 'jsdelivr')
    expect(tags).toHaveLength(0)
  })
})

describe('SRI (integrity)', () => {
  it('adds integrity attribute when specified', () => {
    const pkg: ResolvedPackage = {
      ...vue,
      integrity: 'sha384-abc123',
    }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags[0].attrs.integrity).toBe('sha384-abc123')
  })

  it('adds integrity to CSS packages', () => {
    const pkg: ResolvedPackage = {
      ...elementCss,
      integrity: 'sha384-def456',
    }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags[0].attrs.integrity).toBe('sha384-def456')
  })

  it('does not add integrity when not specified', () => {
    const tags = generateHtmlTags([vue], 'jsdelivr')
    expect(tags[0].attrs.integrity).toBeUndefined()
  })
})

describe('loading strategy', () => {
  it('adds defer attribute', () => {
    const pkg: ResolvedPackage = { ...vue, loading: 'defer' }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags[0].attrs.defer).toBe('')
  })

  it('adds async attribute', () => {
    const pkg: ResolvedPackage = { ...vue, loading: 'async' }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags[0].attrs.async).toBe('')
  })

  it('no defer/async by default', () => {
    const tags = generateHtmlTags([vue], 'jsdelivr')
    expect(tags[0].attrs.defer).toBeUndefined()
    expect(tags[0].attrs.async).toBeUndefined()
  })
})

describe('preload', () => {
  it('generates preload link when enabled', () => {
    const pkg: ResolvedPackage = { ...vue, preload: true }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    // preload + script = 2 tags
    expect(tags).toHaveLength(2)
    expect(tags[0].tag).toBe('link')
    expect(tags[0].attrs.rel).toBe('preload')
    expect(tags[0].attrs.as).toBe('script')
    expect(tags[0].injectTo).toBe('head-prepend')
    expect(tags[1].tag).toBe('script')
  })

  it('generates preload link for CSS', () => {
    const pkg: ResolvedPackage = { ...elementCss, preload: true }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags).toHaveLength(2)
    expect(tags[0].attrs.rel).toBe('preload')
    expect(tags[0].attrs.as).toBe('style')
  })
})

describe('per-package attrs', () => {
  it('merges per-package attrs onto script tag', () => {
    const pkg: ResolvedPackage = {
      ...vue,
      attrs: { 'data-test': 'hello', id: 'vue-script' },
    }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags[0].attrs['data-test']).toBe('hello')
    expect(tags[0].attrs.id).toBe('vue-script')
  })

  it('per-package attrs override global attrs', () => {
    const pkg: ResolvedPackage = {
      ...vue,
      attrs: { crossorigin: 'use-credentials' },
    }
    const tags = generateHtmlTags([pkg], 'jsdelivr', { crossorigin: 'anonymous' })
    expect(tags[0].attrs.crossorigin).toBe('use-credentials')
  })

  it('boolean true renders as empty string attribute', () => {
    const pkg: ResolvedPackage = {
      ...vue,
      attrs: { nomodule: true },
    }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags[0].attrs.nomodule).toBe('')
  })

  it('boolean false omits the attribute', () => {
    const pkg: ResolvedPackage = {
      ...vue,
      attrs: { crossorigin: false },
    }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags[0].attrs.crossorigin).toBeUndefined()
  })
})

describe('global crossorigin option', () => {
  it('applies global crossorigin to all tags', () => {
    const tags = generateHtmlTags([vue, elementCss], 'jsdelivr', {
      crossorigin: 'use-credentials',
    })
    expect(tags[0].attrs.crossorigin).toBe('use-credentials')
    expect(tags[1].attrs.crossorigin).toBe('use-credentials')
  })

  it('default crossorigin is anonymous', () => {
    const tags = generateHtmlTags([vue], 'jsdelivr')
    expect(tags[0].attrs.crossorigin).toBe('anonymous')
  })
})

describe('global scriptAttrs / linkAttrs', () => {
  it('merges global scriptAttrs onto script tags', () => {
    const tags = generateHtmlTags([vue], 'jsdelivr', {
      scriptAttrs: { 'data-plugin': 'cdn-optimizer' },
    })
    expect(tags[0].attrs['data-plugin']).toBe('cdn-optimizer')
  })

  it('merges global linkAttrs onto link tags', () => {
    const tags = generateHtmlTags([elementCss], 'jsdelivr', {
      linkAttrs: { media: 'print' },
    })
    expect(tags[0].attrs.media).toBe('print')
  })
})

describe('media query', () => {
  it('adds media attribute to CSS link tag', () => {
    const pkg: ResolvedPackage = { ...elementCss, media: 'print' }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags[0].attrs.media).toBe('print')
  })

  it('supports complex media query', () => {
    const pkg: ResolvedPackage = { ...elementCss, media: '(min-width: 768px)' }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags[0].attrs.media).toBe('(min-width: 768px)')
  })

  it('does not add media to script tags', () => {
    const pkg: ResolvedPackage = { ...vue, media: 'screen' }
    const tags = generateHtmlTags([pkg], 'jsdelivr')
    expect(tags[0].attrs.media).toBeUndefined()
  })
})
