<template>
  <el-container>
    <el-header height="1.2em">地図表示状態</el-header>
    <el-main>
      <el-row>
        <el-col :span="8">中心</el-col>
        <el-col :span="16">{{ fixedCenterLat }}, {{ fixedCenterLng }}</el-col>
      </el-row>
      <el-row>
        <el-col :span="8">回転角</el-col>
        <el-col :span="16">{{ fixedRotationDegrees }}°</el-col>
      </el-row>
      <el-row>
        <el-col :span="8">レベル</el-col>
        <el-col :span="16">{{ fixedZoom }}</el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import hub from '@/hub'

export default {
  props: ['mode'],
  data() {
    return {
      center: [0.0, 0.0],
      rotation: 0.0,
      zoom: 0
    }
  },
  computed: {
    fixedCenterLat() {
      return `${this.center[0].toFixed(3)}`
    },
    fixedCenterLng() {
      return `${this.center[1].toFixed(3)}`
    },
    fixedRotationDegrees() {
      return (this.rotation * 180 / Math.PI).toFixed(1)
    },
    fixedZoom() {
      return this.zoom.toFixed(0)
    }
  },
  created() {
    hub.$on('change_viewstate_2d', state => {
      this.center = state.center
      this.rotation = state.rotation
      this.zoom = state.zoom
    })
  }
}
</script>

<style scoped>
</style>
