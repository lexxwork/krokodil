module.exports = {
  purge: {
    content: ['./public/**/*.html', './src/**/*.vue', './src/**/*.scss'],
    options: {
      keyframes: true
    }
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        exo2: ['Exo2'],
        varino: ['Varino']
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
  // corePlugins: {
  //   // fontFamily: false
  // }
}
