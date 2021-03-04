
const bgColor = '#424242'

module.exports = {
  pwa: {
    themeColor: bgColor,
    msTileColor: bgColor,
    appleMobileWebAppCache: 'yes',
    manifestOptions: {
      background_color: bgColor
    },
    iconPaths: {
      favicon32: 'img/icons/favicon-32x32.png',
      favicon16: 'img/icons/favicon-16x16.png',
      appleTouchIcon: 'img/icons/apple-touch-icon-152x152.png',
      maskIcon: 'img/icons/android-chrome-maskable-192x192.png',
      msTileImage: 'img/icons/msapplication-icon-144x144.png'
    }
  },
  productionSourceMap: false,
  css: { sourceMap: false }
}
