import ol from 'olreunion'
import Cesium from 'cesium/Cesium'
import OLCesium from 'olcs/olcesium'
import 'ol/ol.css'

// because expose-loader doesn't work.
window.ol = ol
window.Cesium = Cesium
window.OLCesium = OLCesium

class Tellurium {
  constructor() {
    this._config = null
  }
  init(config) {
    this._config = config
    this._olcs = new OLCesium({})
  }
}

const tellurium = () => {
  return new Tellurium()
}
window.tellurium = tellurium

export default tellurium

document.addEventListener('DOMContentLoaded', () => {
  const ol2d = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    ],
    controls: ol.control.defaults({
      attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
        collapsible: false
      })
    }),
    target: 'map',
    view: new ol.View({
      center: ol.proj.transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
      zoom: 3
    })
  })

  const ol3d = new OLCesium({
    map: ol2d
  })
  const scene = ol3d.getCesiumScene()
  scene.terrainProvider = new Cesium.CesiumTerrainProvider({
    url: '//assets.agi.com/stk-terrain/world',
    requestVertexNormals: true
  })
  ol3d.setEnabled(true)
})
