<template>
  <div>
    <mode-button v-for="mode in modes" v-bind:data="mode" v-bind:key="mode":mode="mode"></mode-button>
  </div>
</template>

<script>
import Tellurium from 'tellurium'
import ModeButton from '@/components/ModeButton'

const m = Tellurium.availableMode

export default {
  data () {
    return {
      modes: [m.VIEW_2DMAP, m.VIEW_3DMAP, m.DRAW_POLYLINE_FREEHAND]
    }
  },
  components: {
    ModeButton
  }
}
</script>

<style scoped>
</style>
