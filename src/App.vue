<template>
  <div class="relative mx-auto md:max-w-3xl min-h-screen pb-10 p-5 container-col-center select-none">
    <div class="button add absolute top-4 right-4 h-14 w-14 font-extrabold text-5xl">
      <label for="upload-words">
        +
        <input id="upload-words" hidden type="file" accept=".txt" @change="loadWords" class="hidden" />
      </label>
    </div>
    <div class="text-5xl mb-3 mt-10 pt-2 varino control" :class="{ warning: alarmStyle }">
      {{ timer }}
    </div>
    <div class="m-4 container-col-center">
      <div class="mb-4 word-container">
        <div v-if="showNoMoreWords" class="warning text-gray-50 p-4 rounded-md text-lg font-bold">
          {{ noMoreWords }}
        </div>
        <div
          v-else
          v-show="currentWord"
          @click="toggleLockWord = !toggleLockWord"
          class="font-bold text-3xl control"
        >
          <div class="p-4" v-show="toggleLockWord">{{ currentWord }}</div>
          <div v-show="!toggleLockWord" class="lock">
            <svg viewBox="0 0 372.826 372.826">
              <use href="/img/secured-lock.svg#secured-lock"></use>
            </svg>
          </div>
        </div>
      </div>
      <button
        :disabled="getNewWordsDisabled"
        class="p-2 focus:outline-none button rounded-xl my-3 px-8 text-2xl font-bold"
        @click="getNewWord"
      >
        {{ newWordOrMore }}
      </button>
      <ul v-show="wordsPassedCurrent.length" class="list-none my-3 p-2 container-col-center control">
        <li class="font-bold text-xl" v-for="(word, i) in wordsPassedCurrent" :key="i">
          {{ word }}
        </li>
      </ul>
    </div>
    <div class="background"></div>
  </div>
</template>

<script>
import i18n from '@/i18n'

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

body {
  background-color: $bg-color;
}

.container-col-center {
  @apply flex;
  @apply flex-col;
  @apply items-center;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/img/tile_background.png');
  background-repeat: repeat;
  // filter: blur(1px);
  z-index: -1;
}

.control {
  background-color: $bg-color;
  border-color: $bg-color;
  @apply border-opacity-90;
  @apply border-4;
  @apply rounded-md;
  @apply text-gray-50;
  @apply inline-flex;
  @apply justify-center;
  @apply items-center;
  @apply text-center;
}

.warning {
  @apply bg-pink-700;
  @apply border-pink-700;
}

.button {
  @apply control;
  background-color: $color-green;
  &:disabled {
    background-color: darken($color-green, 20%);
    filter: grayscale(80%);
  }
  &:active {
    background-color: lighten($color-green, 10%);
    border-color: lighten($bg-color, 10%);
  }
}

.word-container {
  @apply inline-flex;
  @apply justify-center;
  @apply items-center;
  @apply text-center;
  height: 100px;
  width: auto;
}

.lock {
  @apply control;
  border-color: $color-green;
  height: 100%;
  width: 100%;
  @apply p-1;
  svg {
    width: 80px;
    height: 80px;
  }
  svg * {
    width: 100%;
    height: 100%;
    fill: $color-green;
  }
}

.add {
  @extend .button;
  @apply rounded-full;
  @apply overflow-hidden;
}

@font-face {
  font-family: 'Varino';
  src: local('Varino'), url(./assets/fonts/varino.ttf) format('truetype');
}

.varino {
  font-family: Varino;
}
</style>
