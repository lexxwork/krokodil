<template>
  <teleport to="body">
    <div v-if="isOpen" class="popup-backdrop" @click="showCompleted && confirm()">
      <div class="popup-container">
        <div class="container-col-center">
          <div class="steps-container">
            <div v-if="step === 0" class="step0-container">
              <div class="input-container">
                <label for="players-count">{{ $options.i18n.playersCount }}:</label>
                <input
                  class="main-item"
                  id="players-count"
                  type="number"
                  v-model.number.lazy="playersMax"
                  min="2"
                  max="30"
                />
              </div>
              <div class="input-container">
                <label for="player-words-max">{{ $options.i18n.wordsForPlayer }}:</label>
                <input id="player-words-max" type="number" v-model.number.lazy="playerWordsMax" min="1" max="10" />
              </div>
            </div>
            <div v-else-if="step === 1 && !showNext">
              <p class="caption">{{ $options.i18n.player }} #{{ playerCnt }}</p>
              <br />
              <div class="input-container">
                <label for="new-word">{{ $options.i18n.addNewWord }}:</label>
                <input
                  id="new-word"
                  type="text"
                  v-model.trim="word"
                  @input="word = $event.target.value.trim()"
                  min="3"
                  max="20"
                  @keypress.enter="addWord"
                  autocomplete="off"
                />
              </div>
            </div>
            <div v-if="showCompleted" @click="confirm" class="message-completed">{{ $options.i18n.completed }}</div>
          </div>
          <div class="steps-button-container">
            <button v-if="showAdd && !showCompleted" @click.stop="addWord" class="btn-primer">
              {{ $options.i18n.add }}
            </button>
            <button v-if="showNext && !showCompleted" @click.stop="next" class="btn-primer">{{ nextValue }}</button>
            <button @click="showCompleted ? confirm() : close()" class="btn-primer">
              {{ $options.i18n.close }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import i18n from '../i18n'

function shuffle (a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function minMaxValueCorrect (valueOrigin, minValue = 0, maxValue = 100) {
  let value = valueOrigin
  const maxLenght = maxValue.toString().length
  const valueString = value.toString()
  if (valueString.length > maxLenght) {
    value = parseInt(valueString.substring(0, maxValue))
  }
  value = value > maxValue ? maxValue : value
  value = value < minValue ? minValue : value
  return value
}

const GAMEWORDSLIMIT = 30
const PLAYERSLIMIT = 20
const PLAYERWORDS_MIN = 2

const i18nWords = Object.fromEntries(
  ['playersCount', 'wordsForPlayer', 'player', 'addNewWord', 'add', 'nextPlayer', 'check', 'close', 'next', 'completed']
    .map(x => [x, i18n(x)])
)

const initialData = () => {
  return {
    playersMax: undefined,
    gameWordsMax: 0,
    playerCnt: 1,
    playerWordsMax: PLAYERWORDS_MIN,
    playerWords: [],
    gameWords: [],
    playerCompleted: false,
    step: 0,
    isOpen: false,
    showNext: true,
    showAdd: false,
    showCompleted: false,
    nextValue: i18nWords.next,
    word: ''
  }
}

export default {
  popupController: null,
  // emits: { words: null },
  data () {
    return {
      ...initialData()
    }
  },
  i18n: i18nWords,
  mounted () {
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount () {
    document.removeEventListener('keydown', this.handleKeydown)
  },
  watch: {
    word (value, before) {
      if (value !== before) {
        this.showAdd = value.length >= 3 && value.length <= 20 && !/\d/.test(value)
      }
    }
  },
  methods: {
    handleKeydown (e) {
      if (this.isOpen && e.key === 'Escape') {
        this.close()
      }
    },
    open () {
      Object.assign(this.$data, initialData())
      const popupPromise = new Promise((resolve, reject) => {
        this.$options.popupController = { resolve, reject }
      })
      this.isOpen = true
      return popupPromise
    },
    confirm () {
      this.$options.popupController.resolve(this.gameWords)
      this.isOpen = false
    },
    close () {
      this.$options.popupController.resolve(null)
      this.isOpen = false
      this.step = 0
    },
    next () {
      if (this.step === 0) {
        if (isNaN(this.playerWordsMax) | isNaN(this.playersMax)) {
          return
        }
        const playersMaxCorrect = minMaxValueCorrect(this.playersMax, 2, PLAYERSLIMIT)
        const cmpMax = Math.ceil(GAMEWORDSLIMIT / playersMaxCorrect)
        const cmpMin = cmpMax <= PLAYERWORDS_MIN ? 1 : PLAYERWORDS_MIN
        const playerWordsMaxCorrect = minMaxValueCorrect(this.playerWordsMax, cmpMin, cmpMax)
        const changed = playersMaxCorrect !== this.playersMax || playerWordsMaxCorrect !== this.playerWordsMax
        this.playersMax = playersMaxCorrect
        this.playerWordsMax = playerWordsMaxCorrect
        if (changed) {
          return
        }
        this.gameWordsMax = this.playersMax * this.playerWordsMax
        this.step = 1
        this.showNext = false
      }
      if (this.step === 1) {
        if (this.playerCnt > this.playersMax) {
          this.gameWords = [...(new Set(this.gameWords))]
          const diff = this.gameWordsMax - this.gameWords.length
          if (diff > 0) {
            this.playerCnt = 1
            this.playerWordsMax = Math.ceil(diff / this.playersMax)
            this.playerCompleted = false
            this.showNext = false
          } else {
            this.gameWords = shuffle(this.gameWords)
            if (this.gameWords.length > this.gameWordsMax) {
              this.gameWords.splice(this.gameWordsMax, this.gameWords.length - this.gameWordsMax)
            }
            // this.$emit('words', this.words)
            this.showCompleted = true
            // setTimeout(() => {
            //   this.showCompleted = false
            //   this.confirm()
            // }, 3000)
          }
        } else if (this.playerCompleted) {
          this.playerCompleted = false
          this.showNext = false
        }
      }
    },
    addWord () {
      if (!this.showAdd) {
        return
      }
      if (this.word && !this.playerWords.includes(this.word.toLowerCase())) {
        this.playerWords.push(this.word.toLowerCase())
        this.word = ''
        this.showAdd = false
        // debugger
        if (this.playerWords.length >= this.playerWordsMax) {
          if (this.playerWords.length > this.playerWordsMax) {
            this.playerWords.splice(this.playerWordsMax, this.playerWords.length - this.playerWordsMax)
          }
          this.gameWords = this.gameWords.concat(this.playerWords)
          this.playerWords = []
          this.playerCnt++
          this.nextValue = this.playerCnt > this.playersMax
            ? this.$options.i18n.check
            : this.$options.i18n.nextPlayer + ' #' + this.playerCnt
          this.playerCompleted = true
          this.showNext = true
        }
      }
    }
  }
}
</script>

<style lang="scss">
@import "@/assets/app.scss";
.popup-backdrop {
  @apply container-main;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgba(66, 66, 66, 0.92);
  z-index: 100;
  min-width: 16rem;
}

.popup-container {
  width: 100%;
  z-index: 101;
  left: 50%;
  transform: translateX(-50%);
  position: fixed;
  @apply px-2;
}

.steps-container {
  @apply main-item;
  width: 100%;
  min-height: 14rem;
  @media (max-height: 452px) {
    min-height: auto;
  }
}

.message-completed {
  @apply control p-4 rounded-md text-4xl font-bold;
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.step0-container {
  width: 100%;
  @apply my-4 flex flex-col justify-center;
  @media (max-height: 452px) {
    @apply flex-row;
  }
}

.steps-button-container {
  @apply flex flex-col items-center;
  @media (min-height: 452px) {
    @apply h-36;
    button:last-of-type {
      @apply mt-6;
      margin-top: auto;
    }
  }
  @media (max-height: 452px) {
    @apply flex-row h-auto;
    button {
      @apply mx-2;
    }
  }
  // main-item;
}

.caption {
  color: $color-green;
  @apply font-bold text-3xl text-center uppercase;
}
</style>
