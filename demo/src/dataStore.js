const KEY_LOCALSTORAGE = 'TELLURIUM_DEMO'
const SUBKEY_APITOKEN = 'APITOKEN'
const SUBKEY_USERLAYERS = 'USERLAYERS'
const SUBKEY_SEARCH_HISTORY = 'SEARCH_HISTORY'

const generateFullKey = (key, user) => `${KEY_LOCALSTORAGE}_${user}_${key}`

const saveToLocal = async (key, data, user = '') => {
  // TODO:
  const json = JSON.stringify(data)
  localStorage.setItem(generateFullKey(key, user), json)
}
const loadFromLocal = async (key, user = '') => {
  // TODO:
  const json = localStorage.getItem(generateFullKey(key, user))
  return JSON.parse(json)
}
const removeFromLocal = async (key, user = '') => {
  localStorage.removeItem(generateFullKey(key, user))
}

const saveToRemote = async (key, data, user = '') => {
  // TODO:
  const json = JSON.stringify(data)
  localStorage.setItem(generateFullKey(key, user), json)
}
const loadFromRemote = async (key, user = '') => {
  // TODO:
  const json = localStorage.getItem(generateFullKey(key, user))
  return JSON.parse(json)
}
// const removeFromRemote = async (key, user) => {
//   localStorage.removeItem(generateFullKey(key, user))
// }

const dataStore = {
  saveApiToken(user, token) {
    return saveToLocal(SUBKEY_APITOKEN, {
      user,
      token
    })
  },
  loadApiToken() {
    return loadFromLocal(SUBKEY_APITOKEN)
  },
  removeApiToken() {
    return removeFromLocal(SUBKEY_APITOKEN)
  },
  saveUserLayers(data, user) {
    return saveToRemote(SUBKEY_USERLAYERS, data, user)
  },
  loadUserLayers(user) {
    return loadFromRemote(SUBKEY_USERLAYERS, user)
  },
  saveSearchHistory(list, user) {
    return saveToRemote(SUBKEY_SEARCH_HISTORY, list, user)
  },
  loadSearchHistory(user) {
    return loadFromRemote(SUBKEY_SEARCH_HISTORY, user)
  },
  clearAllLocalData() {
    localStorage.clear()
  }
}

export default dataStore
