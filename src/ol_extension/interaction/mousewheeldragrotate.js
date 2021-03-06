import eventCondition from 'ol/events/condition'
import additionalEventCondition from '@@/ol_extension/events/additionalcondition'
import Pointer from 'ol/interaction/pointer'
import Interaction from 'ol/interaction/interaction'
import ViewHint from 'ol/viewhint'
import Util from '@@/util'

export default class MouseWheelDragRotate extends Pointer {
  constructor(opt_options) {
    super({
      handleDownEvent: MouseWheelDragRotate.handleDownEvent_,
      handleDragEvent: MouseWheelDragRotate.handleDragEvent_,
      handleUpEvent: MouseWheelDragRotate.handleUpEvent_
    })
    const options = opt_options || {}
    this.condition_ = options.condition || additionalEventCondition.mouseWheelDrag
    this.duration_ = options.duration || 250
    this.lastAnchor_ = null
    this.lastAngle_ = undefined
  }

  static handleDragEvent_(mapBrowserEvent) {
    if (!eventCondition.mouseOnly(mapBrowserEvent)) {
      return
    }
    const map = mapBrowserEvent.map
    const size = map.getSize()
    const offset = mapBrowserEvent.pixel
    const theta = Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2)
    if (!Util.isDefined(this.lastAngle_)) {
      const delta = theta - this.lastAngle_
      const view = map.getView()
      const rotation = view.getRotation()
      map.render()
      Interaction.rotateWithoutConstraints(map, view, rotation - delta)
    }
    this.lastAngle_ = theta
  }

  static handleUpEvent_(mapBrowserEvent) {
    if (!eventCondition.mouseOnly(mapBrowserEvent)) {
      return true
    }
    const map = mapBrowserEvent.map
    const view = map.getView()
    view.setHint(ViewHint.INTERACTING, -1)
    const rotation = view.getRotation()
    Interaction.rotate(map, view, rotation, undefined, this.duration_)
    return false
  }

  static handleDownEvent_(mapBrowserEvent) {
    if (!eventCondition.mouseOnly(mapBrowserEvent)) {
      return false
    }
    if (this.condition_(mapBrowserEvent)) {
      const map = mapBrowserEvent.map
      map.getView().setHint(ViewHint.INTERACTING, 1)
      map.render()
      this.lastAngle_ = undefined
      return true
    } else {
      return false
    }
  }
}
