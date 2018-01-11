<template>
  <el-container>
    <el-aside :width="'24.5em'">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="レイヤー" name="layer">
          <layers class="controller" />
        </el-tab-pane>
        <el-tab-pane label="描画・解析" name="draw_n_analysis">
          <mode-selector class="mode-selector" />
          <router-view class="controller" :styleProps="currentStyle" />
        </el-tab-pane>
        <el-tab-pane label="地点・ルート検索" name="search">
          <searcher :user="user" class="controller" />
        </el-tab-pane>
        <el-tab-pane label="ユーザー" name="user">
          <user-console :user="user" class="controller" />
        </el-tab-pane>
      </el-tabs>
    </el-aside>
    <el-main class="map-view" >
      <map-view :user="user" :token="token" />
    </el-main>
  </el-container>
</template>

<script>
import hub from '@/hub'
import ModeSelector from '@/components/ModeSelector'
import Layers from '@/components/layers/Layers'
import Searcher from '@/components/Searcher'
import UserConsole from '@/components/UserConsole'
import MapView from '@/components/MapView'
import Tellurium from 'tellurium'
import TelluriumUtil from 'TelluriumUtil'

export default {
  props: ['user', 'token'],
  data() {
    return {
      currentStyle: {},
      styles: {},
      activeTab: 'draw_n_analysis'
    }
  },
  mounted() {
    hub.$on('mode_selected', this.onModeSelected)
    hub.$on('single_feature_picked', this.onSingleFeaturePicked)
    hub.$on('multiple_feature_picked', this.onMultipleFeaturePicked)
  },
  beforeRouteUpdate(to, from, next) {
    const mode = to.path.slice(1)
    this.setStyleFromMode(mode)
    next()
  },
  methods: {
    onModeSelected(mode) {
      this.$router.push(`/${mode}`)
    },
    onSingleFeaturePicked(type) {
      this.$router.push(`/pick_feature/${type}`)
    },
    onMultipleFeaturePicked() {
      this.$router.push('/pick_feature')
    },
    setStyleFromMode(mode) {
      if (this.styles[mode]) {
        this.currentStyle = this.styles[mode]
        return
      }
      const m = Tellurium.availableMode
      let defaultStyle = null
      switch (mode) {
        case m.DRAW_POLYLINE:
        case m.DRAW_POLYLINE_FREEHAND:
          defaultStyle = TelluriumUtil.defaultLineStringStyleProps()
          break
        case m.DRAW_SQUARE:
        case m.DRAW_RECTANGLE:
        case m.DRAW_POLYGON:
        case m.DRAW_CIRCLE:
        case m.DRAW_ELLIPSE:
          defaultStyle = TelluriumUtil.defaultPolygonLikeStyleProps()
          break
        case m.DRAW_POINT:
          defaultStyle = TelluriumUtil.defaultPointStyleProps()
          break
        default:
          break
      }
      this.styles[mode] = defaultStyle
      this.currentStyle = defaultStyle
    },
  },
  components: {
    ModeSelector,
    Layers,
    Searcher,
    UserConsole,
    MapView
  },
}
</script>

<style>
html, body, .el-main, .map-view {
  height: 100%;
}
.el-aside {
  padding: 0 0.5em
}
.el-header {
  margin-top: 1em; 
}
.map-view {
  width: 100%;
  padding: 0;
}
</style>
