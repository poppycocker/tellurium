<template>
  <el-container>
    <el-main>
      <el-row>
        <el-col :span="24">
          <el-select v-model="selectedId" @change="onChange">
            <el-option
              v-for="mode in concatenated"
              :key="mode.id"
              :label="mode.label"
              :value="mode.id">
              <span style="float: left">{{ mode.label }}</span>
              <i :class="mode.icon" style="float: right;" />
            </el-option>
          </el-select>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import Tellurium from 'tellurium'
import hub from '@/hub'

const modes = {
  control: [
    {
      label: '2D表示',
      id: Tellurium.availableMode.VIEW_2DMAP,
      icon: 'el-icon-picture'
    },
    {
      label: '3D表示',
      id: Tellurium.availableMode.VIEW_3DMAP,
      icon: 'el-icon-picture'
    },
    {
      label: '図形選択',
      id: Tellurium.availableMode.PICK_FEATURE,
      icon: 'el-icon-edit-outline'
    },
    {
      label: '距離/断面',
      id: Tellurium.availableMode.MEASURE_DISTANCE,
      icon: 'el-icon-star-off'
    },
    {
      label: '見通し解析',
      id: Tellurium.availableMode.GENERATE_ARC,
      icon: 'el-icon-star-off'
    }
  ],
  draw: [
    {
      label: 'ポリライン描画',
      id: Tellurium.availableMode.DRAW_POLYLINE,
      icon: 'el-icon-edit'
    },
    {
      label: 'フリーハンド描画',
      id: Tellurium.availableMode.DRAW_POLYLINE_FREEHAND,
      icon: 'el-icon-edit'
    },
    {
      label: 'ポリゴン描画',
      id: Tellurium.availableMode.DRAW_POLYGON,
      icon: 'el-icon-edit'
    },
    {
      label: '正方形描画',
      id: Tellurium.availableMode.DRAW_SQUARE,
      icon: 'el-icon-edit'
    },
    {
      label: '矩形描画',
      id: Tellurium.availableMode.DRAW_RECTANGLE,
      icon: 'el-icon-edit'
    },
    {
      label: '正円描画',
      id: Tellurium.availableMode.DRAW_CIRCLE,
      icon: 'el-icon-edit'
    },
    {
      label: '楕円描画',
      id: Tellurium.availableMode.DRAW_ELLIPSE,
      icon: 'el-icon-edit'
    },
    {
      label: 'アイコン/ラベル描画',
      id: Tellurium.availableMode.DRAW_POINT,
      icon: 'el-icon-edit'
    },
  ]
}

export default {
  data () {
    return {
      modes: modes,
      selectedId: modes.control[0].id
    }
  },
  computed: {
    concatenated() {
      return this.modes.control.concat(this.modes.draw)
    }
  },
  methods: {
    onChange() {
      hub.$emit('mode_selected', this.selectedId)
    }
  }
}
</script>

<style scoped>
</style>
