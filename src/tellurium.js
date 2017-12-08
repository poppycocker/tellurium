import axios from 'axios'
import querystring from 'querystring'
import ol from 'olreunion'
import olEvents from 'ol/events'
import Cesium from 'cesium/Cesium'
import OLCesium from 'olcs/olcesium'
import 'ol/ol.css'
import Observable from 'ol/observable'
import availableMode from '@@/constants/availableMode'
import MoveControl from '@@/ol_extension/control/movecontrol'
import RotateControl from '@@/ol_extension/control/rotatecontrol'
import ZoomLimited from '@@/ol_extension/control/zoomlimited'
import ZoomSliderCustomized from '@@/ol_extension/control/zoomslidercustomized'
import DrawingManager from '@@/drawingmanager'
import FeaturePicker from '@@/ui_components/featurepicker'
import Measurer, { MeasuringEvent } from '@@/ui_components/measure'
import ArcGenerator, { ArcEvent } from '@@/ui_components/arcgenerator'
import DrawEventType from 'ol/interaction/draweventtype'
import FeatureDragEvent from '@@/ol_extension/featuredragevent'
import Select from 'ol/interaction/select'
import ViewshedAnalyzer from '@@/viewshedanalyzer'
import CrossSectionAnalyzer from '@@/crosssectionanalyzer'
import FormatGeoJSONWithCircle from '@@/ol_extension/format/geojsonwithcircle'

// because expose-loader doesn't work.
window.ol = ol
window.Cesium = Cesium
window.OLCesium = OLCesium
export { ol, Cesium, OLCesium }

const API_ENDPOINT_NOMINATIM = ' http://nominatim.openstreetmap.org'
const API_ENDPOINT_GRAPHHOPPER_ROUTE = 'https://graphhopper.com/api/1/route'
const GRAPHHOPPER_API_KEY = 'ca179d62-2cec-4a92-b731-2cc7389046db'

class Tellurium extends Observable {
  constructor() {
    super()
    this._config = null
    this._olcs = null
    this._drawingManager = null
    this._featurePicker = null
    this._measurer = null
    this._mode = availableMode.VIEW_2DMAP
    this._engineGeoJson = new FormatGeoJSONWithCircle()
  }

  init(olcs, config) {
    this._olcs = olcs
    this._config = config
    const map = this._olcs.getOlMap()
    map.addControl(new MoveControl())
    map.addControl(new RotateControl())
    map.addControl(new ZoomLimited(3, 18))
    map.addControl(new ZoomSliderCustomized())
    this._drawingManager = new DrawingManager(this)
    this._featurePicker = new FeaturePicker(map)
    this._measurer = new Measurer(map)
    this._arcGenerator = new ArcGenerator(map)
    this._viewshedAnalyzer = new ViewshedAnalyzer(
      olcs.getCesiumScene().terrainProvider
    )
    this._crossSectionAnalyzer = new CrossSectionAnalyzer(
      olcs.getCesiumScene().terrainProvider
    )
    this._setListenerRelay()
    this.mode = availableMode.VIEW_2DMAP

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
      case m.DRAW_POINT:
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

  get drawingStyle() {
    return this._drawingManager.style
  }

  set drawingStyle(olStyle) {
    this._drawingManager.style = olStyle
  }

  get layerToDraw() {
    return this._drawingManager.layerToDraw
  }

  set layerToDraw(layer) {
    this._drawingManager.layerToDraw = layer
  }

  get layerToPick() {
    return this._featurePicker.layerToPick
  }

  set layerToPick(layer) {
    this._featurePicker.layerToPick = layer
  }

  get pickedFeatures() {
    return this._featurePicker.features
  }

  static get availableMode() {
    return availableMode
  }

  analyzeViewshed(params, callback) {
    this._viewshedAnalyzer.requestViewshed(params, callback)
  }

  analyzeCrossSection(params, callback) {
    this._crossSectionAnalyzer.requestCrossSection(params, callback)
  }

  findLayerById(id) {
    const layers = this._olcs
      .getOlMap()
      .getLayers()
      .getArray()
    return layers.find(layer => layer.get('id') === id)
  }

  flyTo(center, zoom, duration = 1500, done = () => {}) {
    const view = this.olcs.getOlMap().getView()
    view.cancelAnimations()
    const currentZoom = view.getZoom()
    let parts = 2
    let called = false
    const callback = complete => {
      --parts
      if (called) {
        return
      }
      if (parts === 0 || !complete) {
        called = true
        done(complete)
      }
    }
    view.animate(
      {
        center,
        duration
      },
      callback
    )
    view.animate(
      {
        zoom: currentZoom - 1,
        duration: duration * 1 / 4
      },
      {
        zoom: zoom,
        duration: duration * 3 / 4
      },
      callback
    )
  }

  static to4326(coord3857) {
    if (coord3857.length === 2) {
      return ol.proj.transform(coord3857, 'EPSG:3857', 'EPSG:4326')
    }
    // extent
    const lb3857 = coord3857.slice(0, 2)
    const rt3857 = coord3857.slice(2, 4)
    return [...Tellurium.to4326(lb3857), ...Tellurium.to4326(rt3857)]
  }

  static to3857(coord4326) {
    if (coord4326.length === 2) {
      return ol.proj.transform(coord4326, 'EPSG:4326', 'EPSG:3857')
    }
    // extent
    const lb4326 = coord4326.slice(0, 2)
    const rt4326 = coord4326.slice(2, 4)
    return [...Tellurium.to3857(lb4326), ...Tellurium.to3857(rt4326)]
  }

  geocode(token, query, callback, ctx) {
    const map = this.olcs.getOlMap()
    const viewExtent = map.getView().calculateExtent(map.getSize())
    axios
      .get(API_ENDPOINT_NOMINATIM, {
        params: {
          // token: token,
          format: 'json',
          q: query,
          countrycodes: 'jp',
          limit: 10,
          viewboxlbrt: Tellurium.to4326(viewExtent).join(',')
        },
        timeout: 10000
        // withCredentials: true
      })
      .then(response => {
        callback.call(ctx, {
          success: true,
          data: response.data || []
        })
      })
      .catch(error => {
        callback.call(ctx, {
          success: false,
          error: error
        })
      })
  }

  route(token, points, vehicleType, callback, ctx) {
    axios
      .get(API_ENDPOINT_GRAPHHOPPER_ROUTE, {
        params: {
          // token: token,
          type: 'json',
          point: points,
          vehicle: vehicleType,
          // locale: 'ja',
          points_encoded: false,
          key: GRAPHHOPPER_API_KEY
        },
        paramsSerializer: params => querystring.stringify(params),
        timeout: 10000
        // withCredentials: true
      })
      .then(response => {
        callback.call(ctx, {
          success: true,
          data: response.data || []
        })
      })
      .catch(error => {
        callback.call(ctx, {
          success: false,
          error: error
        })
      })
  }

  geojsonFromFeature(features) {
    return this._engineGeoJson.writeFeatures(features)
  }

  unlistenAll() {
    olEvents.unlistenAll(this)
  }
}

// expose
window.Tellurium = Tellurium
export default Tellurium
