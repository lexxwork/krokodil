import locales from './locales.json'

const defaultLocaleName = 'en'

let userLangs = navigator.languages
  .map(lng => lng.split('-')[0].toLowerCase())

userLangs = [...new Set(userLangs)]

if (!userLangs.length) {
  userLangs.push(defaultLocaleName)
}
const localesNames = Object.keys(locales)
const userLocalesMatched = userLangs
  .filter(ln => localesNames.indexOf(ln) >= 0)

if (!userLocalesMatched.length) {
  userLocalesMatched.push(defaultLocaleName)
}
const currentLocale = locales[userLocalesMatched[0]]

export default (propName) => currentLocale[propName] ?? ''
