import { createApp } from 'vue'
import App from './App.vue'
import wb from './registerServiceWorker'
import './assets/tailwind.css'
import firebase from 'firebase/app'
import 'firebase/analytics'
import appConfig from '../firebase.app.json'

// if (process.env.NODE_ENV === 'production') {

// }
const app = createApp(App)
app.config.globalProperties.$workbox = wb
app.mount('#app')

firebase.initializeApp(appConfig)
firebase.analytics()
