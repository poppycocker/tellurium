<template>
  <el-container>
    <el-main>
      <el-row>
        <el-col :span="24" v-if="selected.length === 1">タイプ: {{ typeOfHead }}</el-col>
        <el-col :span="24" v-else-if="selected.length === 0">スタイル編集するには図形を1つ選択して下さい</el-col>
        <el-col :span="24" v-else>スタイル編集するには1つだけ選択して下さい({{ selected.length }}個選択中)</el-col>
      </el-row>
      <router-view :styleProps="selectedStyle" /> <!-- for style config view -->
    </el-main>
  </el-container>
</template>

<script>
import hub from '@/hub'
import TelluriumUtil from 'TelluriumUtil'

export default {
  data() {
    return {
      selected: [],
      selectedStyle: {}
    }
  },
  computed: {
    typeOfHead() {
      return (this.selected.length === 1) ? this.selected[0].getGeometry().getType() : ''
    }
  },
  mounted() {
    hub.$on('feature_selected', this.onFeatureSelected.bind(this))
  },
  methods: {
    onFeatureSelected(features) {
      this.selected = features
      if (this.selected.length === 1) {
        const feature = this.selected[0]
        this.selectedStyle = TelluriumUtil.generateStyleProps(feature.getStyle())
        const type = feature.getGeometry().getType().toLowerCase()
        hub.$emit('single_feature_picked', type)
      } else {
        hub.$emit('multiple_feature_picked')
      }
    }
  }
}
</script>

<style scoped>
</style>
