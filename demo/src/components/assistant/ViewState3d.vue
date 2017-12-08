<template>
  <el-container>
    <el-header height="1.2em">カメラ状態</el-header>
    <el-main>
      <el-row>
        <el-col :span="8">緯度経度</el-col>
        <el-col :span="16">{{ fixedLat }}, {{ fixedLng }}</el-col>
      </el-row>
      <el-row>
        <el-col :span="8">標高</el-col>
        <el-col :span="16">{{ fixedHeight }} {{ unit }}</el-col>
      </el-row>
      <el-row>
        <el-col :span="8">方位</el-col>
        <el-col :span="16">{{ fixedHeading }}°</el-col>
      </el-row>
      <el-row>
        <el-col :span="8">ピッチ</el-col>
        <el-col :span="16">{{ fixedPitch }}°</el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import hub from '@/hub'

const toDeg = rad => rad * 180 / Math.PI

export default {
  props: ['mode'],
  data() {
    return {
      position: {
        latitude: 0.0,
        longitude: 0.0,
        height: 0.0
      },
      heading: 0.0,
      pitch: 0.0
    }
  },
  computed: {
    fixedLat() {
      return toDeg(this.position.latitude).toFixed(3)
    },
    fixedLng() {
      return toDeg(this.position.longitude).toFixed(3)
    },
    fixedHeight() {
      const p = this.position
      return p.height < 10000.0 ? p.height.toFixed(0) : (p.height / 1000).toFixed(1)
    },
    unit() {
      return this.position.height < 10000.0 ? 'm' : 'km'
    },
    fixedHeading() {
      return toDeg(this.heading).toFixed(1)
    },
    fixedPitch() {
      return toDeg(this.pitch).toFixed(1)
    }
  },
  mounted() {
    hub.$on('change_viewstate_3d', state => {
      this.position = state.position
      this.heading = state.heading
      this.pitch = state.pitch
    })
  }
}
</script>

<style scoped>
</style>
