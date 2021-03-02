<template>
  <div
    class="relative mx-auto lg:max-w-xl md:max-w-xl min-h-screen  pb-10 p-5 flex flex-col items-center select-none"
  >
    <div
      class="absolute top-4 right-4 h-14 w-14 text-center font-extrabold flex justify-center items-center rounded-full text-5xl button overflow-hidden"
    >
      <label for="upload-words">
        +
        <input
          id="upload-words"
          hidden
          type="file"
          accept=".txt"
          @change="loadWords"
          class="hidden"
        />
      </label>
    </div>
    <div
      class="text-5xl mb-3 mt-10 pt-2 varino control"
      :class="{ warning: alarmStyle }"
    >
      {{ timer }}
    </div>
    <div class="flex flex-col items-center" style="min-height: 20rem">
      <div class="my-4" style="min-height: 5rem">
        <div
          v-if="showNoMoreWords"
          class="warning text-gray-50 p-4 rounded-md text-lg font-bold"
        >
          NO MORE WORDS
        </div>
        <div v-else v-show="currentWord" class="p-4 font-bold text-3xl control">
          {{ currentWord }}
        </div>
      </div>
      <button
        :disabled="getNewWordsDisabled"
        class="p-2 focus:outline-none button rounded-xl my-3 px-8 disabled:opacity-50 text-2xl font-bold"
        @click="getNewWord"
      >
        NEW WORD
      </button>
      <ul v-show="wordsPassedCurrent.length" class="list-none my-3 p-2 flex flex-col items-center control">
        <li
          class="font-bold text-xl"
          v-for="(word, i) in wordsPassedCurrent"
          :key="i"
        >
          {{ word }}
        </li>
      </ul>
    </div>
    <div class="background"></div>
  </div>
</template>

<script>
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
      alarmStyle: false
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
    const targetValue =
      target.constructor.name === 'ComputedRefImpl' ? target.value : target
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
        word =>
          !this.wordsPassedCurrent.includes(word) &&
          !this.wordsPassedAll.includes(word)
      )
      if (!this.intervalId) {
        this.currentWord = null
      }
      if (newWords.length > 0) {
        this.currentWord = newWords[Math.floor(Math.random() * newWords.length)]
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
      reader.onload = e => {
        const content = e.target.result
        this.wordsAll = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 1)
      }
      reader.readAsText(files[0])
      event.target.value = ''
    }
  }
}
</script>

<style>

:root {
  --bg-color: #424242;
  /* --border-color: #3f434b; */
  --color-green: #5ce0bf;
}

body {
  background-color: var(--bg-color);
}
body * {
  /* background-color: var(--bg-color); */
  border-color: var(--border-color);
  /* color: var(--border-color); */
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/img/tile_background.png');
  background-repeat: repeat;
  filter: blur(1px);
  z-index: -1;
}

.control {
  background-color: var(--bg-color);
  border-color: var(--bg-color);
  @apply border-opacity-90;
  @apply border-4;
  @apply rounded-md;
  @apply shadow-2xl;
  @apply text-gray-50;

}

.warning {
  @apply bg-pink-700;
  @apply border-pink-700;
}

/* @media (min-width: 780px) {
  .container {
    border: var(--border-color) solid 14px;
  }
} */

.button {
  @apply control;
  background-color: var(--color-green);
}

@font-face {
  font-family: 'Varino';
  src: local('Varino'), url(./assets/fonts/varino.ttf) format('truetype');
}

.varino {
  font-family: Varino;
}
</style>
