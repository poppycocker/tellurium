import Tellurium, { ol, Cesium, OLCesium } from 'tellurium'
import pins from '@/pins'

let te = null

const initialize = () => {
  const olMap = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          attribution: new ol.Attribution({
            html:
              '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>'
          }),
          url:
            'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'
        }),
        id: 'base_gsi_aerial',
        base: true
      }),
      new ol.layer.Tile({
        source: new ol.source.OSM(),
        id: 'base_osm',
        base: true
      })
    ],
    controls: [],
    target: 'map',
    view: new ol.View({
      center: Tellurium.to3857([139.691706, 35.689488]),
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
  te = new Tellurium().init(olcs, {})
  window.te = te
  const layerForPins = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [pins.pinPoi]
    }),
    altitudeMode: 'clampToGround',
    id: 'pins',
    system: true
  })
  const layerForRoute = new ol.layer.Vector({
    source: new ol.source.Vector(),
    altitudeMode: 'clampToGround',
    id: 'route',
    system: true
  })
  olMap.addLayer(layerForRoute)
  olMap.addLayer(layerForPins)
}

export default {
  getInstance() {
    if (!te) {
      initialize()
    }
    return te
  }
}
