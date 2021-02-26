<template>
  <div
    class="container relative bg-gray-800 rounded-lg text-white mx-auto lg:max-w-xl md:max-w-xl mt-10 mb-10 p-5 flex flex-col items-center select-none"
  >
    <div
      class="absolute top-2 right-2 bg-color-default h-10 w-10 text-center font-extrabold flex justify-center items-center rounded-full text-3xl"
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
    <div class="text-5xl my-3 p-2 varino" :class="alarmColorStyle">
      {{ timer }}
    </div>
    <div class="flex flex-col items-center" style="min-height: 20rem">
      <div v-if="showNoMoreWords" class="mt-3 mb-2 p-2 border-4 border-red-700">
        NO MORE WORDS
      </div>
      <div v-else class="my-4 h-9 font-bold text-3xl text-white">
        {{ currentWord }}
      </div>
      <button
        :disabled="!newWordBtnEnabled || showNoMoreWords"
        class="p-2 focus:outline-none rounded-lg text-2xl shadow-md bg-color-default active:bg-green-600 my-3 disabled:opacity-50 varino"
        @click="getNewWord"
      >
        New word
      </button>
      <ul class="list-none my-3 p-2 flex flex-col items-center">
        <li
          class="font-bold text-xl text-gray-300"
          v-for="(word, i) in wordsPassedCurrent"
          :key="i"
        >
          {{ word }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
const DEBUG = process.env.VUE_APP_DEBUG === 'true'
const log = (...args) => DEBUG && console.log(args)

const countDownSound = new Audio(require('@/assets/sounds/stopwatch.mp3'))
const alarmSound = new Audio(require('@/assets/sounds/alarm.mp3'))

const defaultTime = 10
const warningTime = 5
const warningSoundTime = 3
const volumeInit = 0.3
const volumeStep = 0.7 / warningTime

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
      alarmColorStyle: []
    }
  },
  created () {
    if (this.$workbox) {
      this.$workbox.addEventListener('waiting', () => {
        console.log('waiting')
        this.$workbox.messageSW({ type: 'SKIP_WAITING' })
      })
    }
  },
  computed: {
    timer () {
      let minutes = parseInt(this.time / 60, 10)
      let seconds = parseInt(this.time % 60, 10)
      minutes = minutes < 10 ? '0' + minutes : minutes
      seconds = seconds < 10 ? '0' + seconds : seconds
      return minutes + ':' + seconds
    }
  },
  methods: {
    countDownStart () {
      if (this.intervalId) return

      this.wordsPassedCurrent = []
      this.alarmColorStyle = []
      this.time = defaultTime

      this.intervalId = setInterval(() => {
        this.time--
        if (this.time <= warningTime && countDownSound.volume < 1) {
          countDownSound.volume += volumeStep
          this.alarmColorStyle = ['text-red-500']
        }
        if (this.time <= warningSoundTime && countDownSound.paused) {
          countDownSound.play()
        }
        if (this.time <= 0) {
          this.newWordBtnEnabled = false
          alarmSound.play()
          this.countDownReset()
          setTimeout(() => {
            this.newWordBtnEnabled = true
            this.alarmColorStyle = []
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

      log('cleared')
      const files = event.target.files
      if (files.length === 0) return
      log('have file')
      const reader = new FileReader()
      reader.onload = e => {
        log('loaded')
        const content = e.target.result
        this.wordsAll = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 1)
        log('from loader', this.wordsAll)
      }
      reader.readAsText(files[0])
      event.target.value = ''
    }
  }
}
</script>

<style>
:root {
  --bg-color: #70b900;
}

body,
.bg-color-default {
  background-color: var(--bg-color);
}

@font-face {
  font-family: 'Varino';
  src: local('Varino'), url(./assets/fonts/varino.ttf) format('truetype');
}

.varino {
  font-family: Varino;
}

</style>
