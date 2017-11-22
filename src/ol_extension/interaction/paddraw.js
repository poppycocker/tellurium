import Draw from 'ol/interaction/draw'
import Pointer from 'ol/interaction/pointer'
import DrawEventType from 'ol/interaction/draweventtype'
import MapBrowserEventType from 'ol/mapbrowsereventtype'
import GeometryType from 'ol/geom/geometrytype'
import GeomMultiPoint from 'ol/geom/multipoint'
import GeomMultiLineString from 'ol/geom/multilinestring'
import GeomMultiPolygon from 'ol/geom/multipolygon'

export default class PadDraw extends Draw {
  constructor(options) {
    super(options)
    // handler上書き
    // at ol.interaction.Interaction
    this.handleEvent = PadDraw.handleEvent
    // at ol.interaction.Pointer
    this.handleDownEvent_ = PadDraw.handleDownEvent_
    this.handleUpEvent_ = PadDraw.handleUpEvent_
    this.overlay_.updateWhileInteracting_ = true
  }

  static handleEvent(mapBrowserEvent) {
    let pass = !this.freehand_
    if (mapBrowserEvent.type === MapBrowserEventType.POINTERDRAG) {
      this.handlePointerMove_(mapBrowserEvent)
      pass = false
    } else if (mapBrowserEvent.type === MapBrowserEventType.POINTERMOVE) {
      pass = this.handlePointerMove_(mapBrowserEvent)
    } else if (mapBrowserEvent.type === MapBrowserEventType.DBLCLICK) {
      pass = false
    }
    return Pointer.handleEvent.call(this, mapBrowserEvent) && pass
  }

  static handleDownEvent_(event) {
    if (this.condition_(event)) {
      this.downPx_ = event.pixel
      this.handlePointerMove_(event)
      if (!this.finishCoordinate_) {
        this.startDrawing_(event)
      }
      return true
    } else if (
      (this.mode_ === GeometryType.LINE_STRING ||
        this.mode_ === GeometryType.POLYGON) &&
      this.freehandCondition_(event)
    ) {
      this.downPx_ = event.pixel
      this.freehand_ = true
      if (!this.finishCoordinate_) {
        this.startDrawing_(event)
      }
      return true
    } else {
      return false
    }
  }

  static handleUpEvent_(event) {
    this.freehand_ = false
    const downPx = this.downPx_
    const clickPx = event.pixel
    const dx = downPx[0] - clickPx[0]
    const dy = downPx[1] - clickPx[1]
    const squaredDistance = dx * dx + dy * dy
    let pass = true
    if (squaredDistance <= this.squaredClickTolerance_) {
      this.handlePointerMove_(event)
      if (!this.finishCoordinate_) {
        this.startDrawing_(event)
        if (this.mode_ === GeometryType.POINT) {
          this.finishDrawing()
        }
        this.finishDrawing()
        // } else if (this.mode_ === GeometryType.CIRCLE) {
        //   this.finishDrawing();
        // } else if (this.atFinish_(event)) {
        //   this.finishDrawing();
        // } else {
        //   this.addToDrawing_(event);
      }
      pass = false
    } else if (this.finishCoordinate_) {
      this.finishDrawing()
    }
    return pass
  }

  finishDrawing() {
    const sketchFeature = this.abortDrawing_()
    const coordinates = this.sketchCoords_
    const geometry = sketchFeature.getGeometry()
    if (this.mode_ === GeometryType.LINE_STRING) {
      // remove the redundant last point
      // coordinates.pop();
      this.geometryFunction_(coordinates, geometry)
    } else if (this.mode_ === GeometryType.POLYGON) {
      // When we finish drawing a polygon on the last point,
      // the last coordinate is duplicated as for LineString
      // we force the replacement by the first point
      coordinates[0].pop()
      coordinates[0].push(coordinates[0][0])
      this.geometryFunction_(coordinates, geometry)
    }
    // cast multi-part geometries
    if (this.type_ === GeometryType.MULTI_POINT) {
      sketchFeature.setGeometry(new GeomMultiPoint([coordinates]))
    } else if (this.type_ === GeometryType.MULTI_LINE_STRING) {
      sketchFeature.setGeometry(new GeomMultiLineString([coordinates]))
    } else if (this.type_ === GeometryType.MULTI_POLYGON) {
      sketchFeature.setGeometry(new GeomMultiPolygon([coordinates]))
    }
    // First dispatch event to allow full set up of feature
    this.dispatchEvent(new Draw.Event(DrawEventType.DRAWEND, sketchFeature))
    // Then insert feature
    if (this.features_) {
      this.features_.push(sketchFeature)
    }
    if (this.source_) {
      this.source_.addFeature(sketchFeature)
    }
  }
}
