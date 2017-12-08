<template>
  <div id="map" v-loading="isProcessing" ref="mapcontainer"></div>
</template>

<script>
import Tellurium, { ol } from 'tellurium'
import TelluriumUtil from '@/TelluriumUtil'
import telluriumBuilder from '@/telluriumBuilder'
import hub from '@/hub'
import dataStore from '@/dataStore'
import pins from '@/pins'

const m = Tellurium.availableMode

export default {
  name: 'MapView',
  props: ['user', 'token'],
  data () {
    return {
      te: null,
      isProcessing: false
    }
  },
  mounted () {
    this.te = telluriumBuilder.getInstance()
    this.te.olcs.getOlMap().setTarget(this.$refs.mapcontainer)
    this.setListeners()
    this.raiseViewStateChange2d()
    this.loadUserLayers().then(() => {
      const firstLayer = this.getUserVectorLayers()[0]
      this.te.layerToDraw = firstLayer
      this.te.layerToPick = firstLayer
      this.updateLayerList()
    })
    hub.$emit('info', 'mounted')
  },
  beforeDestroy() {
    this.clearListeners()
    this.getUserVectorLayers().forEach(layer => {
      this.getOlMap().removeLayer(layer)
    })
    this.updateLayerList()
  },
  updated() {
    this.te.olcs.getOlMap().setTarget(this.$refs.mapcontainer)
    hub.$emit('info', 'updated')
  },
  methods: {
    clearListeners() {
      const olView = this.getOlMap().getView()
      olView.un('change:resolution', this.raiseViewStateChange2d)
      olView.un('change:center', this.raiseViewStateChange2d)
      olView.un('change:rotation', this.raiseViewStateChange2d)

      const cesiumScene = this.te.olcs.getCesiumScene()
      cesiumScene.camera.moveEnd.removeEventListener(this.raiseViewStateChange3d)

      this.te.unlistenAll()
    },
    setListeners() {
      hub.$on('mode_selected', (mode) => (this.te.mode = mode))
      hub.$on('drawing_style_changed', this.applyDrawingStyle)
      hub.$on('layer_list_requested', this.updateLayerList)
      hub.$on('layer_state_changed', this.applyChangeToLayer)
      hub.$on('layer_selected', this.applySelectedLayer)
      hub.$on('layer_order_changed', this.applyLayerOrder)
      hub.$on('add_layer_requested', this.addUserVectorLayer)
      hub.$on('remove_layer_requested', this.removeLayer)
      hub.$on('flyto_requested', this.flyTo)
      hub.$on('geocoding_requested', this.geocode)
      hub.$on('routing_requested', this.findRoute)
      hub.$on('routing_cancelled', this.clearRoute)
      hub.$on('instruction_selected', this.focusOnInstruction)
      hub.$on('save_user_layers', this.saveUserLayers)

      const olView = this.getOlMap().getView()
      olView.on('change:resolution', this.raiseViewStateChange2d)
      olView.on('change:center', this.raiseViewStateChange2d)
      olView.on('change:rotation', this.raiseViewStateChange2d)

      const cesiumScene = this.te.olcs.getCesiumScene()
      cesiumScene.camera.moveEnd.addEventListener(this.raiseViewStateChange3d, this)

      this.te.on('select', evt => hub.$emit('feature_selected', evt.selected))
      this.te.on('measuring_started', evt => hub.$emit('measuring_started', evt))
      this.te.on('measure_point_added', evt => hub.$emit('measure_point_added', evt))
      this.te.on('measuring_finished', evt => hub.$emit('measuring_finished', evt))
      this.te.on('measuring_finished', evt => {
        const len = evt.shape.length
        const params = {
          start: evt.shape[0],
          end: evt.shape[len - 1],
          via: (len > 2) ? evt.shape.slice(1, len - 1) : null,
          resolution: Math.pow(10, Math.floor(Math.log10(evt.total)) - 3),
          terrainLevel: 16 - Math.round(Math.log10(evt.total))
        }
        this.isProcessing = true
        this.te.analyzeCrossSection(params, result => {
          this.isProcessing = false
          if (result.success) {
            hub.$emit('info', '断面解析が完了しました')
            hub.$emit('analyze_crosssection_finished', result.altitudes, params.resolution)
          } else {
            hub.$emit('error', `断面解析に失敗しました: ${result.message}`)
          }
        })
      })
      this.te.on('arc_generated', evt => {
        const params = Object.assign({}, evt)
        const radialDiff = evt.radialRangeMax - evt.radialRangeMin
        params.terrainLevel = 15 - Math.round(Math.log10(radialDiff))
        params.radialResolution = Math.pow(10, Math.floor(Math.log10(radialDiff)) - 1)
        params.azimuthalResolution = 15
        hub.$emit('info', '見通し解析を開始しました')
        this.isProcessing = true
        this.te.analyzeViewshed(params, result => {
          this.isProcessing = false
          if (result.success) {
            hub.$emit('info', '見通し解析が完了しました')
            this.te.layerToDraw.getSource().addFeatures(result.features)
          } else {
            hub.$emit('error', `見通し解析に失敗しました: ${result.message}`)
          }
        })
      })
      // this.te.on('drawstart', msg => hub.$emit('info', msg))
      // this.te.on('drawend', msg => hub.$emit('info', msg))
      // this.te.on('movestart', msg => hub.$emit('info', msg))
      // this.te.on('moveend', msg => hub.$emit('info', msg))
    },
    raiseViewStateChange2d() {
      if (this.te.mode !== m.VIEW_2DMAP) {
        return
      }
      const olView = this.getOlMap().getView()
      const center4326 = TelluriumUtil.to4326(olView.getCenter())
      hub.$emit('change_viewstate_2d', {
        center: center4326,
        rotation: olView.getRotation(),
        zoom: olView.getZoom()
      })
    },
    raiseViewStateChange3d() {
      if (this.te.mode !== m.VIEW_3DMAP) {
        return
      }
      const camera = this.te.olcs.getCesiumScene().camera
      hub.$emit('change_viewstate_3d', {
        position: camera.positionCartographic,
        heading: camera.heading,
        pitch: camera.pitch
      })
    },
    flyTo(coordinate, setPin = false) {
      this.te.flyTo(coordinate, 16)
      if (setPin) {
        pins.pinPoi.getGeometry().setCoordinates(coordinate)
      }
    },
    geocode(query, callback, ctx) {
      this.te.geocode(this.token, query, callback, ctx)
    },
    findRoute(points, vehicleType, callback, ctx) {
      this.te.route(this.token, points, vehicleType, result => {
        this.drawRoute(result)
        callback.call(ctx, result)
      }, ctx)
    },
    drawRoute(result) {
      const layer = this.te.findLayerById('route')
      const source = layer.getSource()
      const path = result.data.paths[0]
      const coords3857 = path.points.coordinates.map(TelluriumUtil.to3857)
      const routeLine = new ol.Feature(new ol.geom.LineString(coords3857))
      routeLine.setId('route')
      routeLine.setStyle(TelluriumUtil.generateOlStyle({
        strokeWidth: 5,
        strokeColor: 'rgba(0, 32, 255, 1)'
      }))
      source.clear()
      pins.pinStart.getGeometry().setCoordinates(coords3857[0])
      pins.pinGoal.getGeometry().setCoordinates(coords3857[coords3857.length - 1])
      source.addFeatures([routeLine, pins.pinStart, pins.pinGoal])
      this.getOlMap().getView().fit(routeLine.getGeometry(), {
        duration: 500
      })
    },
    clearRoute() {
      const layer = this.te.findLayerById('route')
      const source = layer.getSource()
      source.clear()
    },
    focusOnInstruction(from, to) {
      const layer = this.te.findLayerById('route')
      const source = layer.getSource()
      let focused = source.getFeatureById('focused-instruction')
      if (!focused) {
        const dummyCoords = [[0.0, 0.0], [0.1, 0.1]].map(TelluriumUtil.to3857)
        focused = new ol.Feature(new ol.geom.LineString(dummyCoords))
        focused.setId('focused-instruction')
        focused.setStyle(TelluriumUtil.generateOlStyle({
          strokeColor: 'rgba(225, 16, 128, 1)',
          strokeWidth: 8
        }))
        source.addFeature(focused)
      }
      const routeLine = source.getFeatureById('route')
      const slicedCoords = routeLine.getGeometry().getCoordinates().slice(from, to + 1)
      focused.setGeometry(new ol.geom.LineString(slicedCoords))
      this.getOlMap().getView().fit(focused.getGeometry(), {
        duration: 500
      })
    },
    applyDrawingStyle(style) {
      const olStyle = TelluriumUtil.generateOlStyle(style)
      if (this.te.pickedFeatures.length === 1) {
        this.te.pickedFeatures[0].setStyle(olStyle)
      } else {
        this.te.drawingStyle = olStyle
      }
    },
    applyChangeToLayer(layerProps) {
      // change: id, show
      const olLayer = this.te.findLayerById(layerProps.id)
      if (!olLayer) {
        hub.$emit('error', `layer not found: ${layerProps.id}`)
        return
      }
      if (olLayer.get('id') !== layerProps.id) {
        olLayer.set('id', layerProps.id)
      }
      if (olLayer.getVisible() !== layerProps.show) {
        olLayer.setVisible(layerProps.show)
      }
    },
    applySelectedLayer(layerProps) {
      const olLayer = this.te.findLayerById(layerProps.id)
      if (!olLayer) {
        hub.$emit('error', `layer not found: ${layerProps.id}`)
        return
      }
      this.te.layerToDraw = olLayer
      this.te.layerToPick = olLayer
    },
    applyLayerOrder(layerPropsArray) {
      this.getLayers().forEach((layer, i, layers) => {
        const idx = layerPropsArray.findIndex(layerProps => layerProps.id === layer.get('id'))
        // リスト上の並びとzIndexは逆転関係
        layer.setZIndex(layers.length - 1 - idx)
      })
    },
    addUserVectorLayer(idToAdd) {
      const maxZIndex = Math.max(...this.getLayers().map(layer => layer.getZIndex()))
      const layerToAdd = new ol.layer.Vector({
        source: new ol.source.Vector(),
        altitudeMode: 'clampToGround',
        zIndex: maxZIndex + 1,
        id: idToAdd,
      })
      this.getOlMap().addLayer(layerToAdd)
      const layerProps = {
        id: idToAdd,
        vector: true,
        system: false,
        show: layerToAdd.getVisible(),
        idx: layerToAdd.getZIndex(),
        selected: false
      }
      hub.$emit('layer_added', layerProps)
    },
    removeLayer(layerProps) {
      const layerToRemove = this.te.findLayerById(layerProps.id)
      if (layerToRemove === this.te.layerToDraw) {
        hub.$emit('warn', '描画対象レイヤーは削除できません')
        return
      }
      if (layerToRemove) {
        this.getOlMap().removeLayer(layerToRemove)
        hub.$emit('layer_removed', layerProps)
      }
    },
    getUserVectorLayers() {
      return this.getLayers().filter(layer => {
        return (layer instanceof ol.layer.Vector) && !layer.get('base') && !layer.get('system')
      })
    },
    saveUserLayers() {
      const userVectorLayers = this.getUserVectorLayers()
      const geoJsons = userVectorLayers.map(layer => {
        const featuresWithStyleProps = layer.getSource().getFeatures().map(feature => {
          const styleProps = TelluriumUtil.generateStyleProps(feature.getStyle())
          const cloned = feature.clone()
          cloned.setProperties(styleProps)
          return cloned
        })
        return {
          id: layer.get('id'),
          data: JSON.parse(this.te.geojsonFromFeature(featuresWithStyleProps))
        }
      })
      dataStore.saveUserLayers(geoJsons, this.user).then(() => {
        hub.$emit('info', 'レイヤーデータを保存しました')
      }).catch(err => {
        hub.$emit('error', `レイヤーデータの保存に失敗しました： ${err}`)
      })
    },
    async loadUserLayers() {
      if (!this.token) {
        hub.$emit('error', 'APIトークン未設定')
        return
      }
      let geoJsons
      try {
        geoJsons = await dataStore.loadUserLayers(this.user)
        if (!geoJsons) {
          hub.$emit('info', '保存済みレイヤーデータはありません')
          this.addDefaultVectorLayer()
        } else {
          geoJsons.forEach(this.addLayerFromGeoJson)
          hub.$emit('info', 'レイヤーデータをロードしました')
        }
      } catch (err) {
        hub.$emit('error', `レイヤーデータのロードに失敗しました： ${err}`)
      }
    },
    addLayerFromGeoJson(geoJson, i, geoJsons) {
      const engine = new ol.format.GeoJSON()
      const features = engine.readFeatures(geoJson.data).map(feature => {
        const styleProps = feature.getProperties()
        feature.setStyle(TelluriumUtil.generateOlStyle(styleProps))
        return feature
      })
      const layer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features
        }),
        altitudeMode: 'clampToGround',
        id: geoJsons[i].id,
        selected: i === 0
      })
      this.getOlMap().addLayer(layer)
    },
    updateLayerList() {
      const olMap = this.getOlMap()
      const layers = olMap.getLayers().getArray().map((olLayer, idx) => {
        olLayer.setZIndex(idx)
        return {
          id: olLayer.get('id'),
          vector: (olLayer instanceof ol.layer.Vector),
          system: !!olLayer.get('system'),
          base: !!olLayer.get('base'),
          show: olLayer.getVisible(),
          idx: idx,
          selected: olLayer === this.te.layerToDraw
        }
      })
      hub.$emit('layer_list_updated', layers)
    },
    addDefaultVectorLayer() {
      this.addUserVectorLayer('drawing_00')
    },
    getOlMap() {
      return this.te.olcs.getOlMap()
    },
    getLayers() {
      return this.getOlMap().getLayers().getArray()
    }
  }
}
</script>

<style>
#map {
  height: 100%;
}
</style>
