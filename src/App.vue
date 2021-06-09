<template>
  <div id="parallax-scene" class="container-paralax">
    <div class="item-paralax" data-depth="0">
      <div class="container-main pt-20">
        <div class="menu" @click="openWizard">
          <svg width="48px" height="48px" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M41,14H7a2,2,0,0,1,0-4H41A2,2,0,0,1,41,14Z"></path>
            <path d="M41,26H7a2,2,0,0,1,0-4H41A2,2,0,0,1,41,26Z"></path>
            <path d="M41,38H7a2,2,0,0,1,0-4H41A2,2,0,0,1,41,38Z"></path>
          </svg>
        </div>
        <div class="timer" :class="{ 'warning-color': alarmStyle }">
          {{ timer }}
        </div>
        <div class="main-item word-container">
          <div v-if="showNoMoreWords" class="control message warning">
            {{ noMoreWords }}
          </div>
          <div v-else v-show="currentWord" @click="toggleLockWord = !toggleLockWord">
            <div class="word" v-show="!toggleLockWord">
              {{ currentWord }}
            </div>
            <div v-show="toggleLockWord" class="lock">
              <svg viewBox="0 0 372.826 372.826">
                <use href="/img/secured-lock.svg#secured-lock"></use>
              </svg>
            </div>
          </div>
        </div>
        <button :disabled="getNewWordsDisabled" class="btn-primer main-item text-4xl" @click="getRandomWord">
          {{ newWordOrMore }}
        </button>
        <ul v-show="wordsPassedCurrent.length" class="words-list main-item">
          <li v-for="(word, i) in wordsPassedCurrent" :key="i">
            {{ word }}
          </li>
        </ul>
      </div>
    </div>
    <div class="item-paralax" data-depth="0.2" style="z-index: -1">
      <div class="background"></div>
    </div>
  </div>
  <words-wizard ref="wizard" />
</template>

<script>
import i18n from '@/i18n'
import Parallax from 'parallax-js'
import WordsWizard from './components/WordsWizard.vue'

const DEBUG = process.env.VUE_APP_DEBUG === 'true'
const PRODUCTION = process.env.NODE_ENV === 'production'
const log = (...args) => DEBUG && console.log(args)

const countDownSound = new Audio(require('@/assets/sounds/stopwatch.mp3'))
const alarmSound = new Audio(require('@/assets/sounds/alarm.mp3'))

let defaultTime = 60 + 30
let warningTime = 15

if (!PRODUCTION) {
  defaultTime = 20
  warningTime = 10
}

const volumeInit = 0.1
const volumeStep = (1 - volumeInit) / warningTime

export default {
  components: { WordsWizard },
  data () {
    return {
      currentWord: null,
      wordsPassedCurrent: [],
      time: 0,
      intervalId: null,
      newWordBtnEnabled: true,
      showNoMoreWords: false,
      alarmStyle: false,
      toggleLockWord: false
    }
  },
  created () {
    if (this.$workbox) {
      this.$workbox.addEventListener('waiting', () => {
        this.$workbox.messageSW({ type: 'SKIP_WAITING' })
      })
    }
  },
  mounted () {
    const scene = document.getElementById('parallax-scene')
    this.$parallax = new Parallax(scene, {
      pointerEvents: true,
      frictionX: 0.6,
      frictionY: 0.6
    })
  },
  unmounted () {
    this.$parallax.destroy()
  },
  renderTracked ({ key, target, type }) {
    if (!DEBUG) return
    const targetValue = target.constructor.name === 'ComputedRefImpl' ? target.value : target
    log({ key, target: targetValue, type })
  },
  computed: {
    timer () {
      let minutes = parseInt(this.time / 60, 10)
      let seconds = parseInt(this.time % 60, 10)
      minutes = minutes < 10 ? '0' + minutes : minutes
      seconds = seconds < 10 ? '0' + seconds : seconds
      return minutes + ':' + seconds
    },
    getNewWordsDisabled () {
      return !this.newWordBtnEnabled || this.showNoMoreWords
    },
    newWordOrMore () {
      const propName = this.intervalId ? 'newWordOneMore' : 'newWord'
      return i18n(propName).toUpperCase()
    },
    noMoreWords () {
      return i18n('noMoreWords').toUpperCase()
    }
  },
  methods: {
    countDownStart () {
      if (this.intervalId) return

      this.wordsPassedCurrent = []
      this.alarmStyle = false
      this.time = defaultTime

      this.intervalId = setInterval(() => {
        this.time--
        const volume = countDownSound.volume + volumeStep
        if (this.time <= warningTime && volume <= 1) {
          if (countDownSound.paused) countDownSound.play()
          if (!this.alarmStyle) this.alarmStyle = true
          countDownSound.volume = volume
        }
        if (this.time <= 0) {
          this.newWordBtnEnabled = false
          alarmSound.play()
          this.countDownReset()
          setTimeout(() => {
            this.newWordBtnEnabled = true
            this.alarmStyle = false
          }, 5000)
        }
      }, 1000)

      countDownSound.volume = volumeInit
      countDownSound.loop = true
    },
    countDownReset () {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
      countDownSound.pause()
      countDownSound.currentTime = 0
    },
    async getRandomWord () {
      if (this.currentWord) {
        if (!this.wordsPassedCurrent.includes(this.currentWord)) {
          this.wordsPassedCurrent.push(this.currentWord)
        }
      }
      if (!this.intervalId) {
        this.currentWord = null
      }
      this.newWordBtnEnabled = false

      const record = await this.$idb.getWordRandom()
      if (!record) {
        this.showNoMoreWords = true
        this.countDownReset()
        return
      }
      this.currentWord = record.word
      this.toggleLockWord = false
      this.countDownStart()
      this.newWordBtnEnabled = true

      this.$idb.deleteWord(record)
    },
    async loadWords (event) {
      alarmSound.pause()
      alarmSound.currentTime = 0
      this.currentWord = null
      this.wordsPassedCurrent = []
      this.countDownReset()
      this.newWordBtnEnabled = false
      this.showNoMoreWords = false

      try {
        const files = event.target.files
        if (files.length === 0) return
        const reader = new FileReader()
        reader.readAsText(files[0])
        event.target.value = ''
        const content = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result)
        })
        let words = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 1)
        words = Array.from(new Set(words))
        await this.$idb.clearData()
        await this.$idb.addWords(words)
      } catch (error) {
        log.warn(error)
      }
      this.newWordBtnEnabled = true
    },
    async openWizard () {
      alarmSound.pause()
      alarmSound.currentTime = 0
      this.currentWord = null
      this.wordsPassedCurrent = []
      this.countDownReset()
      this.newWordBtnEnabled = false
      const words = await this.$refs.wizard.open()
      if (words && words.length > 0) {
        await this.$idb.clearData()
        await this.$idb.addWords(words)
        this.showNoMoreWords = false
        this.newWordBtnEnabled = true
      }
    }
  }
}
</script>

<style lang="scss">
@import "@/assets/app.scss";
</style>
