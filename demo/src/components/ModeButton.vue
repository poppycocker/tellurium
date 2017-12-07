<template>
  <button @click="onClick">{{ mode }}</button>
</template>

<script>
// import Tellurium from 'tellurium'
// const m = Tellurium.availableMode
import hub from '@/hub'

export default {
  props: ['mode'],
  data() {
    return {
    }
  },
  methods: {
    onClick() {
      hub.$emit('mode_selected', this.mode)
    }
  }
}
</script>

<style scoped>
</style>
