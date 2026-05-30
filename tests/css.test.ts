import { describe, it, expect } from 'vitest'
import { rewriteCssUrls, getCdnBase, cssPackage } from '../src/css'
import type { ResolvedPackage } from '../src/types'

describe('rewriteCssUrls', () => {
  const ctx = {
    cdnBase: 'https://cdn.jsdelivr.net/npm/element-plus@2.9.1',
    cssPath: 'dist/index.css',
  }

  it('rewrites relative url() paths', () => {
    const css = `@font-face {\n  src: url(../fonts/icon.woff2);\n}`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toContain('https://cdn.jsdelivr.net/npm/element-plus@2.9.1/fonts/icon.woff2')
  })

  it('rewrites url() with single quotes', () => {
    const css = `background: url('./img/bg.png');`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toContain("url('https://cdn.jsdelivr.net/npm/element-plus@2.9.1/dist/img/bg.png')")
  })

  it('rewrites url() with double quotes', () => {
    const css = `background: url("./img/bg.png");`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toContain('url("https://cdn.jsdelivr.net/npm/element-plus@2.9.1/dist/img/bg.png")')
  })

  it('does not rewrite absolute URLs', () => {
    const css = `background: url(https://example.com/img.png);`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toBe(css)
  })

  it('does not rewrite data URIs', () => {
    const css = `background: url(data:image/png;base64,abc123);`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toBe(css)
  })

  it('does not rewrite protocol-relative URLs', () => {
    const css = `background: url(//cdn.example.com/img.png);`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toBe(css)
  })

  it('rewrites @import with relative path', () => {
    const css = `@import './reset.css';`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toContain("https://cdn.jsdelivr.net/npm/element-plus@2.9.1/dist/reset.css")
  })

  it('rewrites @import url() syntax', () => {
    const css = `@import url('./theme.css');`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toContain("https://cdn.jsdelivr.net/npm/element-plus@2.9.1/dist/theme.css")
  })

  it('does not rewrite absolute @import', () => {
    const css = `@import url('https://fonts.googleapis.com/css');`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toBe(css)
  })

  it('handles multiple url() in one declaration', () => {
    const css = `.a { background: url(./a.png); }\n.b { background: url(./b.png); }`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toContain('dist/a.png')
    expect(result).toContain('dist/b.png')
  })

  it('handles CSS with no url()', () => {
    const css = `body { color: red; }`
    const result = rewriteCssUrls(css, ctx)
    expect(result).toBe(css)
  })

  it('handles empty CSS', () => {
    const result = rewriteCssUrls('', ctx)
    expect(result).toBe('')
  })

  it('handles cssPath without directory', () => {
    const ctxNoDir = {
      cdnBase: 'https://cdn.jsdelivr.net/npm/vue@3.5.13',
      cssPath: 'style.css',
    }
    const css = `@import './reset.css';`
    const result = rewriteCssUrls(css, ctxNoDir)
    expect(result).toContain('https://cdn.jsdelivr.net/npm/vue@3.5.13/reset.css')
  })
})

describe('getCdnBase', () => {
  it('returns base URL without path', () => {
    const pkg: ResolvedPackage = {
      name: 'element-plus',
      version: '2.9.1',
      globalName: 'ElementPlus',
      path: 'dist/index.css',
      css: true,
    }
    expect(getCdnBase(pkg, 'jsdelivr')).toBe('https://cdn.jsdelivr.net/npm/element-plus@2.9.1')
  })

  it('works with different providers', () => {
    const pkg: ResolvedPackage = {
      name: 'element-plus',
      version: '2.9.1',
      globalName: 'ElementPlus',
    }
    expect(getCdnBase(pkg, 'unpkg')).toBe('https://unpkg.com/element-plus@2.9.1')
  })
})

describe('cssPackage', () => {
  it('creates a CSS-only package', () => {
    const pkg = cssPackage('element-plus', {
      version: '2.9.1',
      path: 'dist/index.css',
    })
    expect(pkg.name).toBe('element-plus')
    expect(pkg.css).toBe(true)
    expect(pkg.version).toBe('2.9.1')
    expect(pkg.path).toBe('dist/index.css')
    expect(pkg.globalName).toBe('')
  })

  it('allows custom globalName', () => {
    const pkg = cssPackage('my-lib', {
      version: '1.0.0',
      globalName: 'MyLib',
    })
    expect(pkg.globalName).toBe('MyLib')
  })
})
