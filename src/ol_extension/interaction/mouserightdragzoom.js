import eventCondition from 'ol/events/condition'
import Pointer from 'ol/interaction/pointer'
import Interaction from 'ol/interaction/Interaction'
import Util from '@/util'

const MOUSEWHEELZOOM_MAXDELTA = 1
const MOUSEWHEELZOOM_TIMEOUT_DURATION = 80

const conditionMouseRight = function(mapBrowserEvent) {
  // マウスのボタンがホイールがない場合、ボタンの値が変わる可能性があるかも
  return (
    mapBrowserEvent.pointerEvent.pointerId === 1 &&
    mapBrowserEvent.pointerEvent.button === 2
  )
}

export default class MouseRightDragZoom extends Pointer {
  constructor(opt_options) {
    super({
      handleDownEvent: MouseRightDragZoom.handleDownEvent_,
      handleDragEvent: MouseRightDragZoom.handleDragEvent_,
      handleUpEvent: MouseRightDragZoom.handleUpEvent_
    })
    const options = opt_options || {}
    this.condition_ = options.condition || conditionMouseRight
    this.delta_ = 0
    this.prePositionY = 0
    this.duration_ = options.duration || 250
    this.lastAnchor_ = null
    this.startTime_ = undefined
    this.timeoutId_ = undefined
  }

  static handleDragEvent_ = function(mapBrowserEvent) {
    // console.log("movementY:" + mapBrowserEvent.originalEvent.movementY);
    if (!eventCondition.mouseOnly(mapBrowserEvent)) {
      return
    }
    const map = mapBrowserEvent.map
    this.lastAnchor_ = mapBrowserEvent.coordinate
    this.delta_ +=
      -1 * (mapBrowserEvent.originalEvent.offsetY - this.prePositionY)
    this.prePositionY = mapBrowserEvent.originalEvent.offsetY
    if (!this.startTime_) {
      this.startTime_ = Date.now()
    }
    const duration = MOUSEWHEELZOOM_TIMEOUT_DURATION
    const timeLeft = Math.max(duration - (Date.now() - this.startTime_), 0)

    clearTimeout(this.timeoutId_)
    this.timeoutId_ = setTimeout(this.doZoom_.bind(this), timeLeft, map)
    mapBrowserEvent.preventDefault()
    return false
  }

  static handleDownEvent_ = function(mapBrowserEvent) {
    if (!eventCondition.mouseOnly(mapBrowserEvent)) {
      return false
    }
    this.prePositionY = mapBrowserEvent.originalEvent.offsetY
    if (this.condition_(mapBrowserEvent)) {
      // browserEvent.isMouseActionButton()これは左ボタン押した時のチェックらしい
      return true
    } else {
      return false
    }
  }

  static handleUpEvent_ = function(mapBrowserEvent) {
    if (!eventCondition.mouseOnly(mapBrowserEvent)) {
      return true
    }
    return false
  }

  doZoom_(map) {
    const maxDelta = MOUSEWHEELZOOM_MAXDELTA
    const delta = Util.clamp(this.delta_, -maxDelta, maxDelta)
    const view = map.getView()
    map.render()
    Interaction.zoomByDelta(map, view, -delta, this.lastAnchor_, this.duration_)
    this.delta_ = 0
    this.lastAnchor_ = null
    this.startTime_ = undefined
    this.timeoutId_ = undefined
  }
}
