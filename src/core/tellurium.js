import ol from './olreunion'
import olMap from 'ol/map'
import olOsmSource from 'ol/source/osm'
import olControl from 'ol/control'
import olView from 'ol/view'
import olLayerTile from 'ol/layer/tile'
import olProj from 'ol/proj'
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

const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olOsmSource()
    })
  ],
  controls: olControl.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  target: 'map',
  view: new olView({
    center: olProj.transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
  })
})

const ol3d = new OLCesium({
  map: ol2d
})
const scene = ol3d.getCesiumScene()
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestVertexNormals: true
})
scene.terrainProvider = terrainProvider
ol3d.setEnabled(true)
