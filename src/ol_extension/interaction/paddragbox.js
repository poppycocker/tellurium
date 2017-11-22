import DragBox from 'ol/interaction/dragbox'

const DRAG_BOX_HYSTERESIS_PIXELS = 8
const DRAG_BOX_HYSTERESIS_PIXELS_SQUARED = Math.pow(
  DRAG_BOX_HYSTERESIS_PIXELS,
  2
)

export default class PadDragBox extends DragBox {
  constructor(opt_options) {
    super(opt_options)
    this.handleDragEvent_ = PadDragBox.handleDragEvent_
    this.handleUpEvent_ = PadDragBox.handleUpEvent_
    this.handleDownEvent_ = PadDragBox.handleDownEvent_
  }

  static handleDragEvent_(mapBrowserEvent) {
    // removed for touch screen
    // if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    //   return;
    // }
    this.box_.setPixels(this.startPixel_, mapBrowserEvent.pixel)
  }

  static handleUpEvent_(mapBrowserEvent) {
    // removed for touch screen
    // if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    //   return true;
    // }
    this.box_.setMap(null)
    const deltaX = mapBrowserEvent.pixel[0] - this.startPixel_[0]
    const deltaY = mapBrowserEvent.pixel[1] - this.startPixel_[1]
    if (
      deltaX * deltaX + deltaY * deltaY >=
      DRAG_BOX_HYSTERESIS_PIXELS_SQUARED
    ) {
      this.onBoxEnd(mapBrowserEvent)
      this.dispatchEvent(
        new DragBox.Event(DragBox.EventType.BOXEND, mapBrowserEvent.coordinate)
      )
    }
    return false
  }

  static handleDownEvent_(mapBrowserEvent) {
    // removed for touch screen
    // if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    //   return false;
    // }
    // const browserEvent = mapBrowserEvent.browserEvent
    // if (browserEvent.isMouseActionButton() && this.condition_(mapBrowserEvent)) {
    if (this.condition_(mapBrowserEvent)) {
      this.startPixel_ = mapBrowserEvent.pixel
      this.box_.setMap(mapBrowserEvent.map)
      this.box_.setPixels(this.startPixel_, this.startPixel_)
      this.dispatchEvent(
        new DragBox.Event(
          DragBox.EventType.BOXSTART,
          mapBrowserEvent.coordinate
        )
      )
      return true
    } else {
      return false
    }
  }
}
