<template>
  <el-container>
    <el-main>
      <el-row>
        <el-col :span="24" v-if="selected.length > 0">
          <el-button type="danger"  icon="el-icon-delete" @click="onRemoveButtonClicked">{{selected.length}}個の図形を削除</el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" v-if="selected.length === 1">
          <p>タイプ: {{ typeOfHead }}</p>
        </el-col>
        <el-col :span="24" v-else>
          <el-alert
            title="ヒント"
            type="info"
            description="スタイル編集するには図形を1つだけ選択して下さい"
            show-icon
            :closable="false" />
        </el-col>
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
    hub.$on('features_picked', this.onFeaturesSelected)
  },
  methods: {
    onFeaturesSelected(features) {
      this.selected = features
      if (this.selected.length === 1) {
        const feature = this.selected[0]
        this.selectedStyle = TelluriumUtil.generateStyleProps(feature.getStyle())
        const type = feature.getGeometry().getType().toLowerCase()
        hub.$emit('single_feature_picked', type)
      } else {
        hub.$emit('multiple_feature_picked')
      }
    },
    onRemoveButtonClicked() {
      hub.$emit('remove_feature_required', this.selected)
    }
  }
}
</script>

<style scoped>
</style>
