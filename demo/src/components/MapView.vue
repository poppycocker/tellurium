<template>
  <div id="map"></div>
</template>

<script>
import Tellurium, { ol, Cesium, OLCesium } from 'tellurium'
import hub from '@/hub'

const onMounted = () => {
  const olMap = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    ],
    controls: [],
    target: 'map',
    view: new ol.View({
      center: ol.proj.transform(
        [139.691706, 35.689488],
        'EPSG:4326',
        'EPSG:3857'
      ),
      zoom: 8
    })
  })
  const olcs = new OLCesium({
    map: olMap
  })
  const scene = olcs.getCesiumScene()
  scene.terrainProvider = new Cesium.CesiumTerrainProvider({
    url: '//assets.agi.com/stk-terrain/world',
    requestVertexNormals: true
  })
  const te = new Tellurium().init(olcs, {})
  window.te = te
  const layerToDraw = new ol.layer.Vector({
    source: new ol.source.Vector(),
    altitudeMode: 'clampToGround'
  })
  olMap.addLayer(layerToDraw)
  te.layerToDraw = layerToDraw
  te.layerToSelect = layerToDraw
  te.on('drawstart', console.log)
  te.on('drawend', console.log)
  te.on('select', console.log)
  te.on('movestart', console.log)
  te.on('moveend', console.log)
  te.on('measuring_started', console.log)
  te.on('measure_point_added', console.log)
  te.on('measuring_finished', console.log)
  te.on('arc_generated', console.log)
  te.on('arc_generated', evt => {
    const params = Object.assign({}, evt)
    params.radialResolution = 100
    params.azimuthalResolution = 15
    te.analyzeViewshed(params, result => {
      if (result.status === 'success') {
        console.log(`analyzeViewshed: ${result.status}`)
        layerToDraw.getSource().addFeatures(result.features)
      } else {
        console.error(`analyzeViewshed: ${result.status}`)
      }
    })
  })
  return te
}

export default {
  name: 'MapView',
  props: ['token', 'hub'],
  data () {
    return {
      te: null
    }
  },
  mounted () {
    this.te = onMounted()
    hub.$on('mode_selected', (mode) => (this.te.mode = mode))
  }
}
</script>

<style scoped>
</style>
