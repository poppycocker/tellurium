<template>
  <el-container>
    <el-main>
      <el-row>
        <el-col :span="6">線幅</el-col>
        <el-col :span="18"><el-slider :min="1" :max="10" :step="1" v-model="styleProps.strokeWidth" @change="raiseChange" show-stops show-input /></el-col>
      </el-row>
      <el-row>
        <el-col :span="6">線色</el-col>
        <el-col :span="18"><el-color-picker v-model="styleProps.strokeColor" @change="raiseChange" show-alpha /></el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import hub from '@/hub'

export default {
  props: ['styleProps'],
  mounted() {
    this.raiseChange()
  },
  methods: {
    raiseChange() {
      hub.$emit('drawing_style_changed', this.styleProps)
    }
  }
}
</script>

<style scoped>
</style>
