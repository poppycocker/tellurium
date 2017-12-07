import eventCondition from 'ol/events/condition'
import additionalEventCondition from '@@/ol_extension/events/additionalcondition'
import Draw from 'ol/interaction/draw'
import DrawEventType from 'ol/interaction/draweventtype'
import GeometryType from 'ol/geom/geometrytype'
import MapBrowserEventType from 'ol/mapbrowsereventtype'
import { eventConditionMouseWheelDrag } from '@@/ol_extension/interaction/mousewheeldragrotate'

export default class FreehandDraw extends Draw {
  constructor(options) {
    super(options)
    this.freehandCondition_ = eventCondition.always
    this.handleEvent = FreehandDraw.handleEvent
    this.handleDownEvent_ = FreehandDraw.handleDownEvent_
    this.handleUpEvent_ = FreehandDraw.handleUpEvent_
  }

  static handleEvent(mapBrowserEvent) {
    if (mapBrowserEvent.type === 'mousewheel' && !mapBrowserEvent.dragging) {
      return true
    }
    if (
      this.freehand_ &&
      mapBrowserEvent.type === MapBrowserEventType.POINTERDRAG
    ) {
      this.addToDrawing_(mapBrowserEvent)
    }
    Draw.handleEvent.call(this, mapBrowserEvent)
    return false
  }

  static handleDownEvent_(event) {
    if (additionalEventCondition.mouseWheelDrag(event) || additionalEventCondition.mouseRight(event)) {
      return false
    }
    if (this.mode_ === GeometryType.LINE_STRING && this.condition_(event)) {
      this.downPx_ = event.pixel
      this.freehand_ = true
      if (!this.finishCoordinate_) {
        this.startDrawing_(event)
      }
      return true
    }
    return false
  }

  static handleUpEvent_(event) {
    this.freehand_ = false
    this.atFinish_(event)
    this.finishDrawing()
    return false
  }

  finishDrawing() {
    const sketchFeature = this.abortDrawing_()
    const coordinates = this.sketchCoords_
    const geometry = sketchFeature.getGeometry()
    // remove the redundant last point
    coordinates.pop()
    this.geometryFunction_(coordinates, geometry)
    // First dispatch event to allow full set up of feature
    this.dispatchEvent(new Draw.Event(DrawEventType.DRAWEND, sketchFeature))
    // シングルクリック時はここに来る
    if (coordinates.length === 1) {
      return
    }
    // Then insert feature
    if (this.features_) {
      this.features_.push(sketchFeature)
    }
    if (this.source_) {
      this.source_.addFeature(sketchFeature)
    }
  }
}
