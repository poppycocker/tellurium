<template>
  <div id="app">
    <mode-selector />
    <router-view />
    <map-view :token="token" />
  </div>
</template>

<script>
import hub from '@/hub'
import MapView from '@/components/MapView'
import ModeSelector from '@/components/ModeSelector'

export default {
  name: 'app',
  data () {
    return {
      token: ''
    }
  },
  mounted() {
    hub.$on('mode_selected', this.onModeSelected)
  },
  methods: {
    onModeSelected(mode) {
      this.$router.replace(`/${mode}`)
    }
  },
  components: {
    MapView,
    ModeSelector
  },
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
