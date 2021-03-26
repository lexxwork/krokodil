const DB_NAME = 'wordsdb'
const DB_VERSION = 1
let DB

const objectName = 'words'

export default {

  async getDb () {
    return new Promise((resolve, reject) => {
      if (DB) { return resolve(DB) }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = e => {
        reject(e)
      }
      request.onsuccess = e => {
        DB = e.target.result
        resolve(DB)
      }
      request.onupgradeneeded = e => {
        const db = e.target.result
        db.createObjectStore(objectName, { autoIncrement: true, keyPath: 'id' })
      }
    })
  },
  async deleteWord (word) {
    const db = await this.getDb()

    return new Promise(resolve => {
      const trans = db.transaction([objectName], 'readwrite')
      trans.oncomplete = () => {
        resolve()
      }

      const store = trans.objectStore(objectName)
      store.delete(word.id)
    })
  },
  async getWordRandom () {
    function getRandomInt (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    const db = await this.getDb()

    return new Promise((resolve, reject) => {
      (async () => {
        try {
          let word
          const trans = db.transaction([objectName], 'readonly')
          trans.oncomplete = () => {
            resolve(word)
          }
          const store = trans.objectStore(objectName)

          const total = await new Promise((resolve) => {
            store.count().onsuccess = (e) => resolve(e.target.result)
          })
          if (!total) {
            return resolve(null)
          }
          const rndN = getRandomInt(0, total - 1)
          let needRnd = true

          store.openCursor().onsuccess = (e) => {
            const cursor = e.target.result
            if (!cursor) {
              return resolve(null)
            }
            if (needRnd) {
              if (rndN > 0) {
                needRnd = false
                cursor.advance(rndN)
              } else {
                word = cursor.value
              }
            } else {
              word = cursor.value
            }
          }
        } catch (err) {
          return reject(err)
        }
      })()
    })
  },
  async addWords (words) {
    const db = await this.getDb()

    return new Promise(resolve => {
      const trans = db.transaction([objectName], 'readwrite')
      trans.oncomplete = () => {
        resolve()
      }
      const store = trans.objectStore(objectName)
      words.forEach(word => {
        store.add({ word })
      })
    })
  },
  async clearData () {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const trans = db.transaction([objectName], 'readwrite')
      trans.oncomplete = () => {
        resolve()
      }
      trans.onerror = (error) => {
        reject(error)
      }
      const store = trans.objectStore(objectName)
      store.clear()
    })
  }
}
