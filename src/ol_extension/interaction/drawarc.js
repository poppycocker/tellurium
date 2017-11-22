import eventCondition from 'ol/events/condition'
import events from 'ol/events'
import Event from 'ol/events/event'
import olObject from 'ol/object'
import proj from 'ol/proj'
import Sphere from 'ol/sphere'
import Pointer from 'ol/interaction/pointer'
import InteractionProperty from 'ol/interaction/property'
import olCoordinate from 'ol/coordinate'
import VectorLayer from 'ol/layer/vector'
import VectorSource from 'ol/source/vector'
import MapBrowserEventType from 'ol/mapbrowsereventtype'
import GeomPoint from 'ol/geom/point'
import GeomLineString from 'ol/geom/linestring'
import GeomPolygon from 'ol/geom/polygon'
import GeomMultiPoint from 'ol/geom/multipoint'
import GeomCircle from 'ol/geom/circle'
import GeometryType from 'ol/geom/geometrytype'
import Feature from 'ol/feature'
import Style from 'ol/style/style'
import StrokeStyle from 'ol/style/stroke'
import FillStyle from 'ol/style/fill'
import CircleStyle from 'ol/style/circle'

/**
 * @classdesc
 * Events emitted by {@link ol.interaction.DrawArc} instances are instances of
 * this type.
 *
 * @constructor
 * @extends {goog.events.Event}
 * @implements {oli.DrawEvent}
 * @param {ol.interaction.DrawArcEventType} type Type.
 * @param {ol.Feature} feature The feature drawn.
 */
class DrawArcEvent extends Event {
  constructor(type, feature) {
    super(type)
    /**
     * The feature being drawn.
     * @type {ol.Feature}
     */
    this.feature = feature
  }
}

/**
 * @enum {string}
 */
const DrawArcEventType = {
  /**
   * Triggered upon feature draw start
   * @event ol.interaction.DrawArcEvent#drawstart
   */
  DRAWSTART: 'drawstart',
  /**
   * Triggered upon feature draw end
   * @event ol.interaction.DrawArcEvent#drawend
   */
  DRAWEND: 'drawend'
}

/**
 * Draw mode.  This collapses multi-part geometry types with their single-part
 * cousins.
 * @enum {string}
 */
const DrawArcMode = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon',
  CIRCLE: 'Circle'
}

/**
 * @enum {string}
 */
const DrawArcStatus = {
  DRAWSTATUS: 'drawstatus',
  EDITSTATUS: 'editstatus'
}

export { DrawArcEvent, DrawArcEventType, DrawArcMode, DrawArcStatus }

/**
 * Function that takes coordinates and an optional existing geometry as
 * arguments, and returns a geometry. The optional existing geometry is the
 * geometry that is returned when the function is called without a second
 * argument.
 * @typedef {function(!(ol.Coordinate|Array.<ol.Coordinate>|
 *     Array.<Array.<ol.Coordinate>>), ol.geom.SimpleGeometry=):
 *     ol.geom.SimpleGeometry}
 */
// const DrawArcGeometryFunctionType = function() {}

let memo1st = null
let memo2nd = null
let defaultStyle = null

/**
 * @classdesc
 * Interaction for drawing arc geometries.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires DrawArcEvent
 * @param {olx.interaction.DrawOptions} options Options.
 */
export default class DrawArc extends Pointer {
  constructor(options) {
    super({
      handleDownEvent: options.handleDownEvent || DrawArc.handleDownEvent_,
      handleEvent: options.handleEvent || DrawArc.handleEvent,
      handleUpEvent: options.handleUpEvent || DrawArc.handleUpEvent_
    })
    this.drawStatus_ = DrawArcStatus.DRAWSTATUS
    this.firstCoordinate_ = null
    this.secondCoordinate_ = null
    this.centerCoordinate_ = null
    this.snapCoordinate_ = null
    this.snapIdx_ = 0
    // this.currentCoordinate_ = null;
    /**
     * @type {ol.Pixel}
     * @private
     */
    this.downPx_ = null
    this.mouseDown_ = false
    /**
     * @type {boolean}
     * @private
     */
    this.freehand_ = false
    /**
     * Target source for drawn features.
     * @type {ol.source.Vector}
     * @private
     */
    this.source_ = options.source ? options.source : null
    /**
     * Target collection for drawn features.
     * @type {ol.Collection.<ol.Feature>}
     * @private
     */
    this.features_ = options.features ? options.features : null
    /**
     * Pixel distance for snapping.
     * @type {number}
     * @private
     */
    this.snapTolerance_ = options.snapTolerance ? options.snapTolerance : 12
    /**
     * arc's side when arc change to polygon.
     * @type {number}
     * @private
     */
    this.sides_ = options.sides !== undefined ? options.sides : 32
    /**
     * the max radial range.<br>
     * default is 50km, when modified geometry's radius exceeds this, the fill color will be red.
     * @type {number}
     * @private
     */
    this.radialRangeLimit_ = options.radialRangeLimit || 50 * 1000
    /**
     * Geometry type.
     * @type {ol.geom.GeometryType}
     * @private
     */
    this.type_ = options.type
    /**
     * Drawing mode (derived from geometry type).
     * @type {DrawArcMode}
     * @private
     */
    this.mode_ = DrawArc.getMode_(this.type_)
    /**
     * The number of points that must be drawn before a polygon ring or line
     * string can be finished.  The default is 3 for polygon rings and 2 for
     * line strings.
     * @type {number}
     * @private
     */
    this.minPoints_ = options.minPoints
      ? options.minPoints
      : this.mode_ === DrawArcMode.POLYGON ? 3 : 2
    /**
     * The number of points that can be drawn before a polygon ring or line string
     * is finished. The default is no restriction.
     * @type {number}
     * @private
     */
    this.maxPoints_ = options.maxPoints ? options.maxPoints : Infinity
    /**
     * @type {DrawArcGeometryFunctionType}
     * @private
     */
    this.geometryFunction_ = function(coordinates, opt_geometry) {
      const circle = opt_geometry || new GeomCircle([NaN, NaN])
      const squaredLength = olCoordinate.squaredDistance(
        coordinates[0],
        coordinates[1]
      )
      circle.setCenterAndRadius(coordinates[0], Math.sqrt(squaredLength))
      return circle
    }
    /**
     * Finish coordinate for the feature (first point for polygons, last point for
     * linestrings).
     * @type {ol.Coordinate}
     * @private
     */
    this.finishCoordinate_ = null
    /**
     * Sketch feature.
     * @type {ol.Feature}
     * @private
     */
    this.sketchFeature_ = null
    /**
     * Sketch point.
     * @type {ol.Feature}
     * @private
     */
    this.sketchPoint_ = null
    /**
     * Sketch edit point.
     * @type {ol.Feature}
     * @private
     */
    this.sketchEditPoint_ = null
    /**
     * Sketch coordinates. Used when drawing a line or polygon.
     * @type {ol.Coordinate|Array.<ol.Coordinate>|Array.<Array.<ol.Coordinate>>}
     * @private
     */
    this.sketchCoords_ = null
    /**
     * Sketch line. Used when drawing polygon.
     * @type {ol.Feature}
     * @private
     */
    this.sketchLine_ = null
    /**
     * Sketch line coordinates. Used when drawing a polygon or circle.
     * @type {Array.<ol.Coordinate>}
     * @private
     */
    this.sketchLineCoords_ = null
    /**
     * Squared tolerance for handling up events.  If the squared distance
     * between a down and up event is greater than this tolerance, up events
     * will not be handled.
     * @type {number}
     * @private
     */
    this.squaredClickTolerance_ = options.clickTolerance
      ? options.clickTolerance * options.clickTolerance
      : 36
    /**
     * Draw overlay where our sketch features are drawn.
     * @type {ol.layer.Vector}
     * @private
     */
    this.overlay_ = new VectorLayer({
      source: new VectorSource({
        useSpatialIndex: false,
        wrapX: options.wrapX ? options.wrapX : false
      }),
      style: options.style ? options.style : DrawArc.getDefaultStyleFunction(),
      updateWhileAnimating: true,
      updateWhileInteracting: true
    })
    /**
     * Name of the geometry attribute for newly created features.
     * @type {string|undefined}
     * @private
     */
    this.geometryName_ = options.geometryName
    /**
     * @private
     * @type {ol.events.ConditionType}
     */
    this.condition_ = options.condition
      ? options.condition
      : eventCondition.noModifierKeys

    events.listen(
      this,
      olObject.getChangeEventType(InteractionProperty.ACTIVE),
      this.updateState_,
      false,
      this
    )

    this._wgs84Sphere = new Sphere(6378137)

  }
  /**
   * @return {ol.style.StyleFunction} Styles.
   */
  static getDefaultStyleFunction() {
    const styles = Style.createDefaultEditing()
    return (feature, resolution) => styles[feature.getGeometry().getType()]
  }
  /**
   * @inheritDoc
   */
  setMap(map) {
    super.setMap(map)
    this.updateState_()
  }
  /**
   * @return {ol.Coordinate}  center oordinate.
   */
  getCenterCoordinate() {
    return this.centerCoordinate_
  }
  /**
   * @return {float}  first radius.
   */
  getFirstRadius() {
    if (!this.centerCoordinate_ || !this.firstCoordinate_) {
      return 0
    }
    return this.calcDistance_(this.centerCoordinate_, this.firstCoordinate_)
  }
  /**
   * calc distance between 2 points
   * @private
   * @param  {ol.Coordinate} from from
   * @param  {ol.Coordinate} to   to
   * @return {Number} distance in meter
   */
  calcDistance_(from, to) {
    const f = proj.transform(from, 'EPSG:3857', 'EPSG:4326')
    const t = proj.transform(to, 'EPSG:3857', 'EPSG:4326')
    return this._wgs84Sphere.haversineDistance(f, t)
  }
  /**
   * @return {float}  second radius.
   */
  getSecondRadius() {
    if (!this.centerCoordinate_ || !this.secondCoordinate_) {
      return 0
    }
    return this.calcDistance_(this.centerCoordinate_, this.secondCoordinate_)
  }
  /**
   * @return {float}  first degree.
   */
  getFirstDegree() {
    if (!this.centerCoordinate_ || !this.firstCoordinate_) {
      return 0
    }
    return this.getDegreesFromNorth_(
      this.centerCoordinate_,
      this.firstCoordinate_
    )
  }
  /**
   * @return {float}  second degree.
   */
  getSecondDegree() {
    if (!this.centerCoordinate_ || !this.secondCoordinate_) {
      return 0
    }
    return this.getDegreesFromNorth_(
      this.centerCoordinate_,
      this.secondCoordinate_
    )
  }
  /**
   * @param {ol.Coordinate} centerCoordinate center oordinate.
   * @param {float} firstRadius first radius.
   * @param {float} firstDegree first degree.
   * @param {float} secondRadius second radius.
   * @param {float} secondDegree second degree.
   */
  setArcData(
    centerCoordinate,
    firstRadius,
    firstDegree,
    secondRadius,
    secondDegree
  ) {
    this.centerCoordinate_ = centerCoordinate
    this.firstCoordinate_ = [
      this.centerCoordinate_[0] +
        firstRadius * Math.cos(firstDegree * Math.PI / 180),
      this.centerCoordinate_[1] +
        firstRadius * Math.sin(firstDegree * Math.PI / 180)
    ]
    this.secondCoordinate_ = [
      this.centerCoordinate_[0] +
        secondRadius * Math.cos(secondDegree * Math.PI / 180),
      this.centerCoordinate_[1] +
        secondRadius * Math.sin(secondDegree * Math.PI / 180)
    ]
    this.drawStatus_ = DrawArcStatus.EDITSTATUS
    this.initializeDrawing_()
    this.initializeEditing_()
    this.modifyDrawing_(this.firstCoordinate_, this.secondCoordinate_, null)
    this.updateSketchFeatures_()
  }
  /**
   * Handles the {@link ol.MapBrowserEvent map browser event} and may actually
   * draw or finish the drawing.
   * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @this {DrawArc}
   */
  static handleEvent(mapBrowserEvent) {
    let pass = !this.freehand_
    if (
      this.drawStatus_.EDITSTATUS &&
      mapBrowserEvent.type === MapBrowserEventType.POINTERDRAG
    ) {
      // this.addToDrawing_(mapBrowserEvent);
      pass = false
    } else if (mapBrowserEvent.type === MapBrowserEventType.POINTERMOVE) {
      pass = this.handlePointerMove_(mapBrowserEvent)
    } else if (mapBrowserEvent.type === MapBrowserEventType.DBLCLICK) {
      if (this.drawStatus_ === DrawArcStatus.EDITSTATUS) {
        this.finishDrawing()
        pass = false
      } else {
        pass = true
      }
    }
    return Pointer.handleEvent.call(this, mapBrowserEvent) && pass
  }
  /**
   * @param {ol.MapBrowserPointerEvent} event Event.
   * @return {boolean} Start drag sequence?
   * @this {ol.interaction.DrawArc}
   * @private
   */
  static handleDownEvent_(event) {
    if (this.condition_(event)) {
      this.mouseDown_ = true
      this.downPx_ = event.pixel

      if (this.drawStatus_ === DrawArcStatus.EDITSTATUS) {
        const map = event.map
        const firstPx = map.getPixelFromCoordinate(this.firstCoordinate_)
        const secondPx = map.getPixelFromCoordinate(this.secondCoordinate_)
        const pixel = event.pixel
        const squaredFirstPxD =
          Math.pow(pixel[0] - firstPx[0], 2) +
          Math.pow(pixel[1] - firstPx[1], 2)
        const squaredSecondPxD =
          Math.pow(pixel[0] - secondPx[0], 2) +
          Math.pow(pixel[1] - secondPx[1], 2)
        const squaredSnapTolerance = this.snapTolerance_ * this.snapTolerance_
        if (squaredFirstPxD <= squaredSnapTolerance) {
          this.snapIdx_ = 1
          this.createOrUpdateSketchPoint_(this.firstCoordinate_)
        } else if (squaredSecondPxD <= squaredSnapTolerance) {
          this.snapIdx_ = 2
          this.createOrUpdateSketchPoint_(this.secondCoordinate_)
        } else if (
          this.containCoordinateRadius_(
            map.getPixelFromCoordinate(this.centerCoordinate_),
            firstPx,
            secondPx,
            pixel
          ) &&
          this.containCoordinateDegree_(
            this.centerCoordinate_,
            this.firstCoordinate_,
            this.secondCoordinate_,
            event.coordinate.slice()
          )
        ) {
          this.snapIdx_ = 3
          this.snapCoordinate_ = event.coordinate.slice()
          this.createOrUpdateSketchPoint_(event.coordinate.slice())
        } else {
          this.snapIdx_ = 0
          this.snapCoordinate_ = null
          this.createOrUpdateSketchPoint_(event.coordinate.slice())
        }
      }
      return true
    } else {
      return false
    }
  }
  /**
   * @param {Array.<number>} centerPx center pixel
   * @param {Array.<number>} firstPx first pixel
   * @param {Array.<number>} secondPx second pixel
   * @param {Array.<number>} coordinatePx coordinate pixel.
   * @return {boolean} true:arc contains false:not contains coordinate.
   * @private
   */
  containCoordinateRadius_(centerPx, firstPx, secondPx, coordinatePx) {
    // check is in arc.
    const squardFirstPxCenterPxD =
      Math.pow(centerPx[0] - firstPx[0], 2) +
      Math.pow(centerPx[1] - firstPx[1], 2)
    const squardSecondPxCenterPxD =
      Math.pow(centerPx[0] - secondPx[0], 2) +
      Math.pow(centerPx[1] - secondPx[1], 2)
    const squardEventPxCenterPxD =
      Math.pow(centerPx[0] - coordinatePx[0], 2) +
      Math.pow(centerPx[1] - coordinatePx[1], 2)
    return (
      (squardEventPxCenterPxD >= squardFirstPxCenterPxD &&
        squardEventPxCenterPxD <= squardSecondPxCenterPxD) ||
      (squardEventPxCenterPxD <= squardFirstPxCenterPxD &&
        squardEventPxCenterPxD >= squardSecondPxCenterPxD)
    )
  }
  /**
   * @param {ol.Coordinate} center center coordinate
   * @param {ol.Coordinate} first first coordinate
   * @param {ol.Coordinate} second second coordinate
   * @param {ol.Coordinate} coordinate coordinate coordinate.
   * @return {boolean} true:arc contains false:not contains coordinate.
   * @private
   */
  containCoordinateDegree_(center, first, second, coordinate) {
    // check by degree
    const startRad = this.getRad_(center, first)
    let endRad = this.getRad_(center, second)
    let coordinateRad = this.getRad_(center, coordinate)
    if (endRad <= startRad) {
      endRad += Math.PI * 2
    }
    if (coordinateRad < startRad) {
      coordinateRad += Math.PI * 2
    }
    return coordinateRad <= endRad
  }
  /**
   * @param {ol.MapBrowserPointerEvent} event Event.
   * @return {boolean} Stop drag sequence?
   * @this {ol.interaction.DrawArc}
   * @private
   */
  static handleUpEvent_(event) {
    this.mouseDown_ = false
    const downPx = this.downPx_
    const clickPx = event.pixel
    const dx = downPx[0] - clickPx[0]
    const dy = downPx[1] - clickPx[1]
    const squaredDistance = dx * dx + dy * dy
    let pass = true
    if (squaredDistance <= this.squaredClickTolerance_) {
      this.handlePointerMove_(event)
      if (this.drawStatus_ === DrawArcStatus.DRAWSTATUS) {
        if (!this.firstCoordinate_) {
          this.firstCoordinate_ = event.coordinate
          this.centerCoordinate_ = event.coordinate
          this.initializeDrawing_()
        } else if (!this.secondCoordinate_) {
          this.secondCoordinate_ = event.coordinate
          this.memorizeCoordinatesOnCircleDrawn_()
          this.modifyDrawing_(
            this.firstCoordinate_,
            this.secondCoordinate_,
            this.secondCoordinate_
          )
          this.drawStatus_ = DrawArcStatus.EDITSTATUS
          this.initializeEditing_()
        }
      }
      pass = false
    }
    return pass
  }

  memorizeCoordinatesOnCircleDrawn_() {
    memo1st = this.firstCoordinate_
    memo2nd = this.secondCoordinate_
  }

  isCircleModified_() {
    return (
      memo1st !== this.firstCoordinate_ || memo2nd !== this.secondCoordinate_
    )
  }
  /**
   * Handle move events.
   * @param {ol.MapBrowserEvent} event A move event.
   * @return {boolean} Pass the event to other interactions.
   * @private
   */
  handlePointerMove_(event) {
    // draw status
    if (this.drawStatus_ === DrawArcStatus.DRAWSTATUS) {
      // between first coordinate and second coordinate redraw
      if (this.firstCoordinate_) {
        let currentCoordinate = event.coordinate
        this.modifyDrawing_(
          this.firstCoordinate_,
          currentCoordinate,
          currentCoordinate
        )
      } else {
        this.createOrUpdateSketchPoint_(event.coordinate.slice())
      }
    } else if (this.drawStatus_ === DrawArcStatus.EDITSTATUS) {
      if (this.mouseDown_) {
        this.createOrUpdateSketchPoint_(event.coordinate.slice())
        if (this.snapIdx_ === 1) {
          this.firstCoordinate_ = event.coordinate
          this.modifyDrawing_(
            this.firstCoordinate_,
            this.secondCoordinate_,
            this.firstCoordinate_
          )
        } else if (this.snapIdx_ === 2) {
          this.secondCoordinate_ = event.coordinate
          this.modifyDrawing_(
            this.firstCoordinate_,
            this.secondCoordinate_,
            this.secondCoordinate_
          )
        } else if (this.snapIdx_ === 3) {
          let currentCoordinate = event.coordinate
          const dx = currentCoordinate[0] - this.snapCoordinate_[0]
          const dy = currentCoordinate[1] - this.snapCoordinate_[1]

          this.centerCoordinate_ = [
            this.centerCoordinate_[0] + dx,
            this.centerCoordinate_[1] + dy
          ]
          this.firstCoordinate_ = [
            this.firstCoordinate_[0] + dx,
            this.firstCoordinate_[1] + dy
          ]
          this.secondCoordinate_ = [
            this.secondCoordinate_[0] + dx,
            this.secondCoordinate_[1] + dy
          ]
          this.snapCoordinate_ = currentCoordinate
          this.modifyDrawing_(
            this.firstCoordinate_,
            this.secondCoordinate_,
            currentCoordinate
          )
        }
      }
      this.createOrUpdateSketchPoint_(event.coordinate.slice())
      this.createOrUpdateEditSketchPoint_()
      // draw
      this.updateSketchFeatures_()
    }
    return true
  }
  /**
   * @param {Array.<ol.Coordinate>} coordinates Coordinates.
   * @private
   */
  createOrUpdateSketchPoint_(coordinates) {
    if (!this.sketchPoint_) {
      this.sketchPoint_ = new Feature(new GeomPoint(coordinates))
    } else {
      const sketchPointGeom = this.sketchPoint_.getGeometry()
      sketchPointGeom.setCoordinates(coordinates)
    }
  }
  /**
   * @private
   */
  createOrUpdateEditSketchPoint_() {
    const coordinates = [this.firstCoordinate_, this.secondCoordinate_]
    if (null == this.sketchEditPoint_) {
      this.sketchEditPoint_ = new Feature(new GeomMultiPoint(coordinates))
      const fill = new FillStyle({
        color: 'rgba(255,51,51,0.8)'
      })
      const stroke = new StrokeStyle({
        color: '#CC0000',
        width: 2
      })
      const style = new Style({
        image: new CircleStyle({
          fill: fill,
          stroke: stroke,
          radius: 9
        }),
        fill: fill,
        stroke: stroke
      })
      this.sketchEditPoint_.setStyle(style)
    } else {
      const sketchPointGeom = this.sketchEditPoint_.getGeometry()
      sketchPointGeom.setCoordinates(coordinates)
    }
  }
  /**
   * Start the drawing.
   * @private
   */
  initializeDrawing_() {
    const start = this.firstCoordinate_
    this.sketchLineCoords_ = [start.slice(), start.slice()] // this.sketchCoords_;
    this.sketchLine_ = new Feature(new GeomLineString(this.sketchLineCoords_))
    const geometry = this.geometryFunction_([start.slice(), start.slice()])
    this.sketchFeature_ = new Feature()
    if (this.geometryName_) {
      this.sketchFeature_.setGeometryName(this.geometryName_)
    }
    this.sketchFeature_.setGeometry(geometry)
    this.updateSketchFeatures_()
    this.dispatchEvent(
      new DrawArcEvent(DrawArcEventType.DRAWSTART, this.sketchFeature_)
    )
  }
  /**
   * Start the Editing.
   * @private
   */
  initializeEditing_() {
    // delete sketchLine_
    this.sketchLineCoords_ = null
    this.sketchLine_ = null
    // geometry change
    this.createOrUpdateEditSketchPoint_()
    this.updateSketchFeatures_()
  }
  /**
   * Modify the drawing.
   * @param {ol.Coordinate} first first coordinate.
   * @param {ol.Coordinate} second second coordinate.
   * @param {ol.Coordinate} current current coordinate.
   * @private
   */
  modifyDrawing_(first, second, current) {
    if (this.drawStatus_ === DrawArcStatus.DRAWSTATUS) {
      const geometry = this.sketchFeature_.getGeometry()
      // if(geometry.getType() === 'Circle'){
      this.geometryFunction_([first, second], geometry)
      // } else if(geometry.getType() === 'Polygon'){
    } else if (this.drawStatus_ === DrawArcStatus.EDITSTATUS) {
      const polygonGeometry = this.createPolygonGeometry_()
      this.sketchFeature_.setGeometry(polygonGeometry)
    }
    // 半径チェック
    const exceedsRadialLimit =
      Math.max(this.getFirstRadius(), this.getSecondRadius()) >
      this.radialRangeLimit_
    const fill = new FillStyle({
      color: exceedsRadialLimit ? [255, 0, 0, 0.5] : [255, 255, 255, 0.5]
    })
    const stroke = new StrokeStyle({
      color: [0, 153, 255, 1],
      width: 3
    })
    const style = new Style({
      fill: fill,
      stroke: stroke
    })
    this.sketchFeature_.setStyle(style)
    if (this.sketchPoint_ && current) {
      const sketchPointGeom = this.sketchPoint_.getGeometry()
      sketchPointGeom.setCoordinates(current)
    }
    if (this.sketchLine_) {
      const sketchLineGeom = this.sketchLine_.getGeometry()
      sketchLineGeom.setCoordinates([first, second])
    }
    this.updateSketchFeatures_()
  }
  /**
   * Stop drawing and add the sketch feature to the target layer.
   * The {@link DrawArcEventType.DRAWEND} event is dispatched before
   * inserting the feature.
   */
  finishDrawing() {
    const sketchFeature = this.abortDrawing_()
    sketchFeature.set('center_coordinate', this.centerCoordinate_)
    sketchFeature.set('second_radius', this.getSecondRadius())
    if (this.isCircleModified_()) {
      sketchFeature.set('first_radius', this.getFirstRadius())
      sketchFeature.set('first_degree', this.getFirstDegree())
      sketchFeature.set('second_degree', this.getSecondDegree())
    } else {
      sketchFeature.set('first_radius', 0)
      sketchFeature.set('first_degree', 0)
      sketchFeature.set('second_degree', 360)
    }
    this.drawStatus_ = DrawArcStatus.DRAWSTATUS
    this.firstCoordinate_ = null
    this.secondCoordinate_ = null
    this.centerCoordinate_ = null
    // squaredClickTolerance_未満でキャンセルされる場合、イベントを発生させない
    if (sketchFeature.get('second_radius') === 0) {
      return
    }
    // 制限半径を超えてしまう場合、イベントを発生させない
    if (
      Math.max(
        sketchFeature.get('first_radius'),
        sketchFeature.get('second_radius')
      ) > this.radialRangeLimit_
    ) {
      return
    }
    // First dispatch event to allow full set up of feature
    this.dispatchEvent(
      new DrawArcEvent(DrawArcEventType.DRAWEND, sketchFeature)
    )
    // Then insert feature
    if (this.features_) {
      this.features_.push(sketchFeature)
    }
    if (this.source_) {
      this.source_.addFeature(sketchFeature)
    }
  }
  /**
   * Stop drawing without adding the sketch feature to the target layer.
   * @return {ol.Feature} The sketch feature (or null if none).
   * @private
   */
  abortDrawing_() {
    const sketchFeature = this.sketchFeature_
    if (sketchFeature) {
      this.sketchFeature_ = null
      this.sketchPoint_ = null
      this.sketchEditPoint_ = null
      this.sketchLine_ = null
      this.overlay_.getSource().clear(true)
      sketchFeature.setStyle(null)
    }
    return sketchFeature
  }
  /**
   * Extend an existing geometry by adding additional points. This only works
   * on features with `LineString` geometries, where the interaction will
   * extend lines by adding points to the end of the coordinates array.
   * @param {!ol.Feature} feature Feature to be extended.
   */
  extend(feature) {
    // do nothing
  }
  /**
   * Redraw the sketch features.
   * @private
   */
  updateSketchFeatures_() {
    const sketchFeatures = []
    if (this.sketchFeature_) {
      sketchFeatures.push(this.sketchFeature_)
    }
    if (this.sketchLine_) {
      sketchFeatures.push(this.sketchLine_)
    }
    if (this.sketchPoint_) {
      sketchFeatures.push(this.sketchPoint_)
    }
    if (this.sketchEditPoint_) {
      sketchFeatures.push(this.sketchEditPoint_)
    }
    const overlaySource = this.overlay_.getSource()
    overlaySource.clear(true)
    overlaySource.addFeatures(sketchFeatures)
  }
  /**
   * @private
   */
  updateState_() {
    const map = this.getMap()
    const active = this.getActive()
    if (!map || !active) {
      this.abortDrawing_()
    }
    this.overlay_.setMap(active ? map : null)
  }

  /**
   * Create a regular polygon from a circle.
   * @return {ol.geom.Polygon} Polygon geometry.
   * @private
   */
  createPolygonGeometry_() {
    const polygon = new GeomPolygon(null, null)
    const sides = this.sides_
    const stride = polygon.getStride()
    const layout = polygon.getLayout()
    const flatCoordinates = Array(stride * (2 * sides + 3)).fill(0)
    const ends = [flatCoordinates.length]
    const startRad = this.getRad_(this.centerCoordinate_, this.firstCoordinate_)
    let endRad = this.getRad_(this.centerCoordinate_, this.secondCoordinate_)
    if (endRad <= startRad) {
      endRad += Math.PI * 2
    }
    const deltaRad = endRad - startRad
    const firstR = Math.sqrt(
      olCoordinate.squaredDistance(
        this.centerCoordinate_,
        this.firstCoordinate_
      )
    )
    const secondR = Math.sqrt(
      olCoordinate.squaredDistance(
        this.centerCoordinate_,
        this.secondCoordinate_
      )
    )
    let rad = 0.0
    let offset = 0
    for (let i = 0; i <= sides; ++i) {
      offset = i * stride
      rad = startRad + i * deltaRad / sides
      flatCoordinates[offset] =
        this.centerCoordinate_[0] + firstR * Math.cos(rad)
      flatCoordinates[offset + 1] =
        this.centerCoordinate_[1] + firstR * Math.sin(rad)
    }
    const start = sides + 1
    for (let i = 0; i <= sides; ++i) {
      offset = (start + i) * stride
      rad = endRad - i * deltaRad / sides
      flatCoordinates[offset] =
        this.centerCoordinate_[0] + secondR * Math.cos(rad)
      flatCoordinates[offset + 1] =
        this.centerCoordinate_[1] + secondR * Math.sin(rad)
    }
    flatCoordinates[flatCoordinates.length - 2] = flatCoordinates[0]
    flatCoordinates[flatCoordinates.length - 1] = flatCoordinates[1]

    polygon.setFlatCoordinates(layout, flatCoordinates, ends)
    return polygon
  }

  /**
   * Calculate the bearing between two positions as a value from 0-360
   *
   * @param {ol.Coordinate} origin first coordinate.
   * @param {ol.Coordinate} to second coordinate.
   * @return {float} rad .
   * @private
   */
  getRad_(origin, to) {
    const dx = to[0] - origin[0]
    const dy = to[1] - origin[1]
    const rad = Math.atan2(dy, dx) //*  180 / Math.PI;
    return rad
  }

  getDegreesFromNorth_(origin, to) {
    // 東を0°とする反時計回りのラジアン角
    const rad = this.getRad_(origin, to)
    let degree = 90 - rad * 180 / Math.PI
    const direction = degree > 0 ? -1 : 1
    while (degree < 0 || 360 <= degree) {
      degree += 360 * direction
    }
    return degree
  }

  /**
   * Get the drawing mode.  The mode for mult-part geometries is the same as for
   * their single-part cousins.
   * @param {ol.geom.GeometryType} type Geometry type.
   * @return {DrawArcMode} Drawing mode.
   * @private
   */
  static getMode_(type) {
    let mode = null
    if (type === GeometryType.POINT || type === GeometryType.MULTI_POINT) {
      mode = DrawArcMode.POINT
    } else if (
      type === GeometryType.LINE_STRING ||
      type === GeometryType.MULTI_LINE_STRING
    ) {
      mode = DrawArcMode.LINE_STRING
    } else if (
      type === GeometryType.POLYGON ||
      type === GeometryType.MULTI_POLYGON
    ) {
      mode = DrawArcMode.POLYGON
    } else if (type === GeometryType.CIRCLE) {
      mode = DrawArcMode.CIRCLE
    }
    return mode
  }
  /**
   * Remove last point of the feature currently being drawn.
   */
  removeLastPoint() {
    // donothing
  }
  /**
   * @param {ol.Feature|ol.render.Feature} feature Feature.
   * @param {number} resolution Resolution.
   * @return {Array.<ol.style.Style>} Style.
   */
  static defaultEditStyleFunction(feature, resolution) {
    if (!defaultStyle) {
      const fill = new FillStyle({
        color: 'rgba(255,51,51,0.4)'
      })
      const stroke = new StrokeStyle({
        color: '#CC0000',
        width: 1.25
      })
      defaultStyle = [
        new Style({
          image: new CircleStyle({
            fill: fill,
            stroke: stroke,
            radius: 5
          }),
          fill: fill,
          stroke: stroke
        })
      ]
    }
    return defaultStyle
  }
}
