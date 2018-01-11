<template>
  <el-container>
    <el-header height="1.2em">レイヤー操作</el-header>
    <el-main>
      <el-row :gutter="10">
        <el-col :span="2"><i class="el-icon-edit"></i></el-col>
        <el-col :span="2"><i class="el-icon-view"></i></el-col>
        <el-col :offset="8" :span="12">
          <el-switch
            style="display: block"
            v-model="isBaseOSM"
            active-color="#409eff"
            inactive-color="#34FF76"
            active-text="地図"
            inactive-text="航空写真"
            @change="onToggleBaseMap" />
        </el-col>
      </el-row>
      <draggable v-model="layers" :move="isDraggable" @update="raiseOrderChange">
        <el-row v-for="layer in layers" :key="layer.id" :gutter="10" class="draggable"　v-if="!needToDisabled(layer)">
          <el-col :span="2">
            <el-radio v-model="selected" :label="layer.id" @change="raiseSelected(layer)">&nbsp;</el-radio>
          </el-col>
          <el-col :span="2">
            <el-checkbox v-model="layer.show" @change="raiseChange(layer)" />
          </el-col>
          <el-col :span="12">
            <el-input v-model="layer.id" @change="raiseChange(layer)" />
          </el-col>
          <el-col :span="4">
            <el-button icon="el-icon-delete" @click="requestRemove(layer)" />
          </el-col>
          <el-col :span="4">
            <i class="el-icon-d-caret" />
          </el-col>
        </el-row>
      </draggable>
      <el-row :gutter="10">
        <el-col :offset="4" :span="20">
          <el-input suffix-icon="el-icon-circle-plus" v-model="idToAdd" placeholder="追加レイヤーのIDを入力..." @keyup.enter.native="requestAdd" />
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import hub from '@/hub'
import Draggable from 'vuedraggable'

export default {
  data() {
    return {
      layers: [], // {id,vector,base,system,show,idx}
      selected: null,
      idToAdd: '',
      isBaseOSM: true
    }
  },
  mounted() {
    hub.$on('layer_added', this.onLayerAdded)
    hub.$on('layer_removed', this.onLayerRemoved)
    hub.$on('layer_list_updated', this.onLayerListUpdated)
    hub.$emit('layer_list_requested')
  },
  methods: {
    needToDisabled(layer) {
      return layer.base || layer.system || !layer.vector
    },
    isDraggable(evt) {
      return !evt.draggedContext.element.system || !evt.draggedContext.element.base
    },
    raiseChange(layer) {
      hub.$emit('layer_state_changed', layer)
    },
    raiseSelected(layer) {
      hub.$emit('layer_selected', layer)
    },
    raiseOrderChange() {
      hub.$emit('layer_order_changed', this.layers)
    },
    requestAdd() {
      if (!this.idToAdd) {
        hub.$emit('warn', 'レイヤーIDは必須です')
        return
      }
      if (this.layers.some(layer => layer.id === this.idToAdd)) {
        hub.$emit('warn', `ID:${this.idToAdd} は既に存在します`)
        return
      }
      hub.$emit('add_layer_requested', this.idToAdd)
    },
    requestRemove(layer) {
      hub.$emit('remove_layer_requested', layer)
    },
    onLayerAdded(layerToAdd) {
      this.layers.unshift(layerToAdd)
    },
    onLayerRemoved(layerToRemove) {
      const idx = this.layers.findIndex(layer => layer.id === layerToRemove.id)
      if (idx !== -1) {
        this.layers.splice(idx, 1)
      }
    },
    onLayerListUpdated(layers) {
      this.layers = layers.reverse()
      const selected = this.layers.filter(layer => layer.selected)[0]
      this.selected = selected ? selected.id : null
      this.raiseOrderChange()
    },
    onToggleBaseMap() {
      const osm = this.layers.find(layer => layer.id === 'base_osm')
      const gsiAerial = this.layers.find(layer => layer.id === 'base_gsi_aerial')
      osm.show = this.isBaseOSM
      gsiAerial.show = !this.isBaseOSM
      this.raiseChange(osm)
      this.raiseChange(gsiAerial)
    }
  },
  components: {
    Draggable
  },
}
</script>

<style scoped>
.el-row {
  margin-bottom: 0.5em;
  &:last-child {
    margin-bottom: 0;
  }
}
.draggable:hover {
  cursor: pointer;
}
</style>
