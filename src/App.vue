<template>
  <div id="parallax-scene" class="container-paralax">
    <div class="item-paralax" data-depth="0">
      <div class="container-main">
        <div class="add">
          <label for="upload-words">
            +
            <input
              id="upload-words"
              hidden
              type="file"
              accept=".txt"
              @change="loadWords"
              style="display: none"
            />
          </label>
        </div>
        <div
          class="control main-item timer varino"
          :class="{ 'warning-color': alarmStyle }"
        >
          {{ timer }}
        </div>
        <div class="main-item word-container">
          <div v-if="showNoMoreWords" class="control message warning">
            {{ noMoreWords }}
          </div>
          <div
            v-else
            v-show="currentWord"
            @click="toggleLockWord = !toggleLockWord"
          >
            <div class="word" v-show="toggleLockWord">
              {{ currentWord }}
            </div>
            <div v-show="!toggleLockWord" class="lock">
              <svg viewBox="0 0 372.826 372.826">
                <use href="/img/secured-lock.svg#secured-lock"></use>
              </svg>
            </div>
          </div>
        </div>
        <button
          :disabled="getNewWordsDisabled"
          class="get-new-word main-item"
          @click="getNewWord"
        >
          {{ newWordOrMore }}
        </button>
        <ul v-show="wordsPassedCurrent.length" class="words-list main-item">
          <li v-for="(word, i) in wordsPassedCurrent" :key="i">
            {{ word }}
          </li>
        </ul>
      </div>
    </div>
    <div class="item-paralax" data-depth="0.2" style="z-index: -1;">
      <div class="background"></div>
    </div>
  </div>
</template>

<script>
import i18n from '@/i18n'
import Parallax from 'parallax-js'

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
  data () {
    return {
      wordsAll: [],
      currentWord: null,
      wordsPassedCurrent: [],
      wordsPassedAll: [],
      time: 0,
      intervalId: null,
      newWordBtnEnabled: true,
      showNoMoreWords: false,
      alarmStyle: false,
      toggleLockWord: true
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
    getNewWord () {
      if (this.currentWord) {
        this.wordsPassedAll.push(this.currentWord)
        if (!this.wordsPassedCurrent.includes(this.currentWord)) {
          this.wordsPassedCurrent.push(this.currentWord)
        }
      }
      const newWords = this.wordsAll.filter(
        (word) => !this.wordsPassedCurrent.includes(word) && !this.wordsPassedAll.includes(word)
      )
      if (!this.intervalId) {
        this.currentWord = null
      }
      if (newWords.length > 0) {
        this.currentWord = newWords[Math.floor(Math.random() * newWords.length)]
        this.toggleLockWord = true
        this.countDownStart()
      } else {
        this.showNoMoreWords = true
        this.countDownReset()
      }
    },
    loadWords (event) {
      alarmSound.pause()
      alarmSound.currentTime = 0
      this.currentWord = null
      this.wordsPassedCurrent = []
      this.countDownReset()
      this.newWordBtnEnabled = true
      this.showNoMoreWords = false

      const files = event.target.files
      if (files.length === 0) return
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        this.wordsAll = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 1)
      }
      reader.readAsText(files[0])
      event.target.value = ''
    }
  }
}
</script>

<style lang="scss">
$color-green: #5ce0bf;
$bg-color: #424242;
@import "@/assets/app.scss";
</style>
