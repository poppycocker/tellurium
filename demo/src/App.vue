<template>
  <router-view :user="user" :token="token" id="app" />
</template>

<script>
import hub from '@/hub'
import dataStore from '@/dataStore'
import Tellurium from 'tellurium'

export default {
  name: 'app',
  data () {
    return {
      user: '',
      token: ''
    }
  },
  mounted() {
    hub.$on('info', this.showInfo)
    hub.$on('warn', this.showWarn)
    hub.$on('error', this.showError)
    hub.$on('authenticated', this.onAuthenticated)
    hub.$on('logout_requested', this.logout)
    this.showAuthView()
    this.checkToken()
  },
  methods: {
    checkToken () {
      // check token and move to auth view if needed.
      dataStore.loadApiToken().then((data) => {
        // this.onAuthenticated()
        hub.$emit('authenticated', data.user, data.token)
      }).catch(err => {
        this.showError(err)
      })
    },
    onAuthenticated(user, token) {
      dataStore.saveApiToken(user, token).catch(err => {
        this.showError(err)
      })
      this.user = user
      this.token = token
      this.showMainView()
    },
    showAuthView () {
      this.$router.replace('/auth')
    },
    showMainView () {
      this.$router.replace(`/${Tellurium.availableMode.VIEW_2DMAP}`)
    },
    showInfo(msg) {
      this.$notify.info({
        title: 'Info',
        message: msg
      })
    },
    showWarn(msg) {
      this.$notify.warning({
        title: 'Warning',
        message: msg
      })
    },
    showError(msg) {
      this.$notify.error({
        title: 'Error',
        message: msg
      })
    },
    logout() {
      this.token = ''
      dataStore.removeApiToken()
      this.$router.replace('/auth')
    }
  },
  components: {
  },
}
</script>

<style>
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
