import { createApp } from 'vue'
import App from './App.vue'
import wb from './registerServiceWorker'
import './assets/tailwind.css'
import firebase from 'firebase/app'
import 'firebase/analytics'
import appConfig from '../firebase.app.json'
import idb from './idb'

const app = createApp(App)

app.config.globalProperties.$workbox = wb
app.config.globalProperties.$idb = idb

app.mount('#app')

firebase.initializeApp(appConfig)
firebase.analytics()
