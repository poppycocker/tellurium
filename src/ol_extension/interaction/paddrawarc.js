import DrawArc, { DrawArcStatus } from '@@/ol_extension/interaction/drawarc'
import MapBrowserEventType from 'ol/mapbrowsereventtype'
import Pointer from 'ol/interaction/pointer'

/**
 * @classdesc
 * Interaction for drawing arc geometries by touch panel.
 *
 * @constructor
 * @private
 * @extends {ol.interaction.DrawArc}
 * @fires ol.interaction.DrawArcEvent
 * @param {olx.interaction.DrawOptions} options Options.
 */
export default class PadDrawArc extends DrawArc {
  constructor(options) {
    options.handleDownEvent =
      options.handleDownEvent || PadDrawArc.handleDownEvent_
    options.handleEvent = options.handleEvent || PadDrawArc.handleEvent
    options.handleUpEvent = options.handleUpEvent || PadDrawArc.handleUpEvent_
    super(options)
  }

  /**
   * Handles the {@link ol.MapBrowserEvent map browser event} and may actually
   * draw or finish the drawing.
   * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @this {ol.interaction.PadDrawArc}
   */
  static handleEvent(mapBrowserEvent) {
    let pass = !this.freehand_
    if (
      this.drawStatus_ === DrawArcStatus.DRAWSTATUS &&
      mapBrowserEvent.type === MapBrowserEventType.POINTERDRAG
    ) {
      this.handlePointerMove_(mapBrowserEvent)
      pass = false
    } else if (
      this.drawStatus_ === DrawArcStatus.EDITSTATUS &&
      mapBrowserEvent.type === MapBrowserEventType.POINTERDRAG
    ) {
      // this.addToDrawing_(mapBrowserEvent);
      pass = false
    } else if (
      mapBrowserEvent.type === MapBrowserEventType.POINTERMOVE &&
      this.drawStatus_ === DrawArcStatus.EDITSTATUS
    ) {
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

      // DRAWSTATUS
      if (this.drawStatus_ === DrawArcStatus.DRAWSTATUS) {
        if (!this.firstCoordinate_) {
          this.firstCoordinate_ = event.coordinate
          this.centerCoordinate_ = event.coordinate
          this.initilizeDrawing_()
        }
      } else if (this.drawStatus_ === DrawArcStatus.EDITSTATUS) {
        // EDITSTATUS
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
   * @param {ol.MapBrowserPointerEvent} event Event.
   * @return {boolean} Stop drag sequence?
   * @this {ol.interaction.PadDrawArc}
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

    if (squaredDistance > this.squaredClickTolerance_) {
      this.handlePointerMove_(event)
      if (this.drawStatus_ === DrawArcStatus.DRAWSTATUS) {
        if (!this.secondCoordinate_) {
          this.secondCoordinate_ = event.coordinate
          this.modifyDrawing_(
            this.firstCoordinate_,
            this.secondCoordinate_,
            this.secondCoordinate_
          )
          this.drawStatus_ = DrawArcStatus.EDITSTATUS
          this.initilizeEditing_()
        }
      }
      pass = false
    } else if (
      this.drawStatus_ === DrawArcStatus.DRAWSTATUS &&
      this.firstCoordinate_
    ) {
      // when cancel set radius 0
      this.secondCoordinate_ = this.firstCoordinate_
      // this.sketchFeature_ = null;
      const geometry = this.sketchFeature_.getGeometry()
      geometry.setRadius(0)
      this.finishDrawing()
    }
    return pass
  }
}
