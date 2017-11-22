import ol from 'olreunion'
import Cesium from 'cesium/Cesium'
import OLCesium from 'olcs/olcesium'
import 'ol/ol.css'
import Observable from 'ol/observable'
import availableMode from '@/constants/availableMode'
import MoveControl from '@/ol_extension/control/movecontrol'
import RotateControl from '@/ol_extension/control/rotatecontrol'
import ZoomLimited from '@/ol_extension/control/zoomlimited'
import ZoomSliderCustomized from '@/ol_extension/control/zoomslidercustomized'
import DrawingManager from '@/drawingmanager'
import FeaturePicker from '@/ui_components/featurepicker'
import Measurer, { MeasuringEvent } from '@/ui_components/measure'
import ArcGenerator, { ArcEvent } from '@/ui_components/arcgenerator'
import DrawEventType from 'ol/interaction/draweventtype'
import FeatureDragEvent from '@/ol_extension/featuredragevent'
import Select from 'ol/interaction/select'
import ViewshedAnalyzer from '@/viewshedanalyzer'

// because expose-loader doesn't work.
window.ol = ol
window.Cesium = Cesium
window.OLCesium = OLCesium

class Tellurium extends Observable {
  constructor() {
    super()
    this._config = null
    this._olcs = null
    this._drawingManager = null
    this._featurePicker = null
    this._measurer = null
  }

  init(olcs, config) {
    this._olcs = olcs
    this._config = config
    const map = this._olcs.getOlMap()
    this._drawingManager = new DrawingManager(this)
    this._featurePicker = new FeaturePicker(map)
    this._measurer = new Measurer(map)
    this._arcGenerator = new ArcGenerator(map)
    this._viewshedAnalyzer = new ViewshedAnalyzer(
      olcs.getCesiumScene().terrainProvider
    )
    this._setListenerRelay()
    return this
  }

  _setListenerRelay() {
    const set = (target, type) => target.on(type, this.dispatchEvent, this)
    set(this._drawingManager, DrawEventType.DRAWSTART)
    set(this._drawingManager, DrawEventType.DRAWEND)
    set(this._featurePicker, Select.EventType_.SELECT)
    set(this._featurePicker, FeatureDragEvent.Types.MOVESTART)
    set(this._featurePicker, FeatureDragEvent.Types.MOVEEND)
    set(this._measurer, MeasuringEvent.Types.MEASURING_STARTED)
    set(this._measurer, MeasuringEvent.Types.MEASURE_POINT_ADDED)
    set(this._measurer, MeasuringEvent.Types.MEASURING_FINISHED)
    set(this._arcGenerator, ArcEvent.Types.ARC_GENERATED)
  }

  get olcs() {
    return this._olcs
  }

  get mode() {
    return this._mode
  }

  set mode(mode) {
    if (mode === this.mode) {
      return
    }
    const m = availableMode
    // 2D表示以外→2D表示以外の切替時は状態リセットのため一度2D表示を経由させる(fixme)
    if (this.mode !== m.VIEW_2DMAP && mode !== m.VIEW_2DMAP) {
      this.mode = m.VIEW_2DMAP
    }
    this._featurePicker.releaseAll()
    this._featurePicker.deactivate()
    this._measurer.deactivate()
    this._arcGenerator.deactivate()
    switch (mode) {
      case m.VIEW_2DMAP:
      case m.VIEW_3DMAP:
        break
      case m.DRAW_POLYLINE:
      case m.DRAW_POLYLINE_FREEHAND:
      case m.DRAW_SQUARE:
      case m.DRAW_RECTANGLE:
      case m.DRAW_POLYGON:
      case m.DRAW_CIRCLE:
      case m.DRAW_ELLIPSE:
      case m.DRAW_LABEL:
      case m.DRAW_ICON:
        this._drawingManager.mode = mode
        break
      case m.PICK_FEATURE:
        this._featurePicker.activate()
        break
      case m.MEASURE_DISTANCE:
        this._measurer.activate()
        break
      case m.GENERATE_ARC:
        this._arcGenerator.activate()
        break
      case m.DESIGNATE_RECT:
      default:
        console.warn(`${mode} is not implemented.`)
        break
    }
    if (!availableMode.isDrawing(mode)) {
      this._drawingManager.clearInteraction()
    }
    this._olcs.setEnabled(mode === m.VIEW_3DMAP)

    this._mode = mode
  }

  get layerToDraw() {
    return this._drawingManager.layerToDraw
  }

  set layerToDraw(layer) {
    this._drawingManager.layerToDraw = layer
  }

  get layerToSelect() {
    return this._featurePicker.layerToSelect
  }

  set layerToSelect(layer) {
    this._featurePicker.layerToPick = layer
  }

  get availableMode() {
    return availableMode
  }

  analyzeViewshed(params, callback) {
    this._viewshedAnalyzer.requestViewshed(params, callback)
  }
}

// expose
Tellurium.availableMode = availableMode
window.Tellurium = Tellurium
export default Tellurium

// for test
document.addEventListener('DOMContentLoaded', () => {
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

  const controls = [
    new MoveControl(),
    new RotateControl(),
    new ZoomLimited(3, 18),
    new ZoomSliderCustomized()
  ]
  controls.forEach(c => olMap.addControl(c))

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
  // olcs.setEnabled(true)
})
