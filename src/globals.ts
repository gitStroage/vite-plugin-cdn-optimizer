import type { ResolvedPackage } from './types'

/**
 * Well-known package -> global variable name overrides.
 * These are packages whose global names cannot be inferred by simple PascalCase conversion.
 */
const GLOBAL_OVERRIDES: Record<string, string> = {
  // Utilities
  'lodash-es': '_',
  'lodash': '_',
  'underscore': '_',
  'jquery': '$',
  'zepto': 'Zepto',

  // Date libraries
  'moment': 'moment',
  'dayjs': 'dayjs',
  'luxon': 'luxon',

  // HTTP
  'axios': 'axios',
  'superagent': 'superagent',

  // Vue ecosystem
  'vue': 'Vue',
  'vue-router': 'VueRouter',
  'pinia': 'Pinia',
  'vuex': 'Vuex',

  // React ecosystem
  'react': 'React',
  'react-dom': 'ReactDOM',
  'react-router': 'ReactRouter',
  'react-router-dom': 'ReactRouterDOM',

  // UI frameworks
  'element-plus': 'ElementPlus',
  'ant-design-vue': 'antd',
  'naive-ui': 'naive',
  'vant': 'vant',

  // Chart / visualization
  'echarts': 'echarts',
  'chart.js': 'Chart',
  'd3': 'd3',
  'three': 'THREE',

  // Other
  'crypto-js': 'CryptoJS',
  'marked': 'marked',
  'highlight.js': 'hljs',
  'nprogress': 'NProgress',
  'sortablejs': 'Sortable',
  'swiper': 'Swiper',
  'APlayer': 'APlayer',
  'mpegts': 'mpegts',
}

/**
 * Infer global variable name from package name.
 * Uses overrides for known packages, otherwise converts to PascalCase.
 *
 * Examples:
 *   'vue'        -> 'Vue'
 *   'react-dom'  -> 'ReactDOM'
 *   'lodash-es'  -> '_'
 *   'my-lib'     -> 'MyLib'
 */
export function inferGlobalName(name: string): string {
  if (GLOBAL_OVERRIDES[name]) return GLOBAL_OVERRIDES[name]
  return name
    .split(/[-/]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * Build a globals map for Rollup output.globals.
 * Maps package names to their global variable names.
 */
export function buildGlobals(pkgs: ResolvedPackage[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const pkg of pkgs) {
    map[pkg.name] = pkg.globalName
  }
  return map
}
