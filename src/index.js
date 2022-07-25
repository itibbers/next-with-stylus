const cloneDeep = require('clone-deep')

// this plugin finds next.js's sass rules and duplicates them with stylus
// it mimics the exact behavior of CSS extraction/modules/client/server of SASS
// tested on next@11.0.1 with webpack@5

const addStylusToRegExp = (rx) => new RegExp(rx.source.replace('|sass', '|sass|styl'), rx.flags)

function patchNextCSSWithStylus(
  nextCSSModule = require('next/dist/build/webpack/config/blocks/css')
) {
  // monkey patch next's regexLikeCss to include less files
  // overrides https://github.com/vercel/next.js/blob/e8a9bd19967c9f78575faa7d38e90a1270ffa519/packages/next/build/webpack/config/blocks/css/index.ts#L17
  // so https://github.com/vercel/next.js/blob/e8a9bd19967c9f78575faa7d38e90a1270ffa519/packages/next/build/webpack-config.ts#L54
  // has less extension as well
  nextCSSModule.regexLikeCss = addStylusToRegExp(nextCSSModule.regexLikeCss)
}

patchNextCSSWithStylus()

function withStylus({ stylusLoaderOptions = {}, ...nextConfig }) {
  return Object.assign({}, nextConfig, {
    webpack(config, opts) {
      // there are 2 relevant sass rules in next.js - css modules and global css
      let sassModuleRule
      // global sass rule (does not exist in server builds)
      let sassGlobalRule

      const isNextSpecialCSSRule = (rule) =>
        // next >= 12.0.7
        rule[Symbol.for('__next_css_remove')] ||
        // next < 12.0.7
        rule.options?.__next_css_remove

      const cssRule = config.module.rules.find((rule) => rule.oneOf?.find(isNextSpecialCSSRule))

      if (!cssRule) {
        throw new Error(
          'Could not find next.js css rule. Please ensure you are using a supported version of next.js'
        )
      }

      const addStylusToRuleTest = (test) => {
        if (Array.isArray(test)) {
          return test.map((rx) => addStylusToRegExp(rx))
        } else {
          return addStylusToRegExp(test)
        }
      }

      cssRule.oneOf.forEach((rule) => {
        if (rule.options?.__next_css_remove) return

        if (rule.use?.loader === 'error-loader') {
          rule.test = addStylusToRuleTest(rule.test)
        } else if (rule.use?.loader?.includes('file-loader')) {
          // url() inside .styl files - next <= 11
          rule.issuer = addStylusToRuleTest(rule.issuer)
        } else if (rule.type === 'asset/resource') {
          // url() inside .styl files - next >= 12
          rule.issuer = addStylusToRuleTest(rule.issuer)
        } else if (rule.use?.includes?.('ignore-loader')) {
          rule.test = addStylusToRuleTest(rule.test)
        } else if (rule.test?.source === '\\.module\\.(scss|sass)$') {
          sassModuleRule = rule
        } else if (rule.test?.source === '(?<!\\.module)\\.(scss|sass)$') {
          sassGlobalRule = rule
        }
      })

      const stylusLoader = {
        loader: 'stylus-loader',
        options: {
          ...stylusLoaderOptions,
          stylusOptions: {
            javascriptEnabled: true,
            ...stylusLoaderOptions.stylusOptions,
          },
        },
      }

      let stylusModuleRule = cloneDeep(sassModuleRule)

      const configureStylusRule = (rule) => {
        rule.test = new RegExp(rule.test.source.replace('(scss|sass)', 'styl'))
        // replace sass-loader (last entry) with stylus-loader
        rule.use.splice(-1, 1, stylusLoader)
      }

      configureStylusRule(stylusModuleRule)
      cssRule.oneOf.splice(cssRule.oneOf.indexOf(sassModuleRule) + 1, 0, stylusModuleRule)

      if (sassGlobalRule) {
        let stylusGlobalRule = cloneDeep(sassGlobalRule)
        configureStylusRule(stylusGlobalRule)
        cssRule.oneOf.splice(cssRule.oneOf.indexOf(sassGlobalRule) + 1, 0, stylusGlobalRule)
      }

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, opts)
      }

      return config
    },
  })
}

module.exports = withStylus
module.exports.patchNext = patchNextCSSWithStylus
