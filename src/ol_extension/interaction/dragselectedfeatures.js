import Pointer from 'ol/interaction/pointer'
import FeatureDragEvent from '@/ol_extension/featuredragevent'

// http://openlayers.org/en/v3.7.0/examples/drag-features.html
export default class DragSelectedFeatures extends Pointer {
  constructor(selectInteraction) {
    super({
      handleDownEvent: DragSelectedFeatures.prototype.handleDownEvent,
      handleDragEvent: DragSelectedFeatures.prototype.handleDragEvent,
      handleMoveEvent: DragSelectedFeatures.prototype.handleMoveEvent,
      handleUpEvent: DragSelectedFeatures.prototype.handleUpEvent
    })
    this.selectInteraction_ = selectInteraction
    this.coordinate_ = null
    this.cursor_ = 'pointer'
    this.previousCursor_ = undefined
  }

  handleDownEvent(evt) {
    const map = evt.map
    // マウスダウン位置のフィーチャーを検索
    const hit = map.forEachFeatureAtPixel(
      evt.pixel,
      (feature, layer) => feature
    )
    // フィーチャーがヒットし、かつ選択中フィーチャーであるか？
    if (!hit || !this.isSelectedFeature(hit)) {
      return false
    }
    this.coordinate_ = evt.coordinate

    const e = new FeatureDragEvent(
      FeatureDragEvent.Types.MOVESTART,
      this.getSelectedFeatures()
    )
    this.dispatchEvent(e)

    return !!hit
  }

  handleDragEvent(evt) {
    const deltaX = evt.coordinate[0] - this.coordinate_[0]
    const deltaY = evt.coordinate[1] - this.coordinate_[1]
    // 選択中フィーチャーの移動を行う
    const features = this.getSelectedFeatures()
    features.forEach(
      feature => feature.getGeometry().translate(deltaX, deltaY),
      this
    )
    this.coordinate_[0] = evt.coordinate[0]
    this.coordinate_[1] = evt.coordinate[1]
  }

  // カーソル変化
  handleMoveEvent(evt) {
    if (this.cursor_) {
      const map = evt.map
      const feature = map.forEachFeatureAtPixel(
        evt.pixel,
        (feature, layer) => feature
      )
      const element = evt.map.getTargetElement()
      if (feature && this.isSelectedFeature(feature)) {
        if (element.style.cursor !== this.cursor_) {
          this.previousCursor_ = element.style.cursor
          element.style.cursor = this.cursor_
        }
      } else if (this.previousCursor_ !== undefined) {
        element.style.cursor = this.previousCursor_
        this.previousCursor_ = undefined
      }
    }
  }

  handleUpEvent(evt) {
    // 移動したことを明示的に通知
    // fires 'change:geomtry'
    const selected = this.getSelectedFeatures()
    selected.forEach(feature => feature.setGeometry(feature.getGeometry()))
    this.coordinate_ = null
    const e = new FeatureDragEvent(FeatureDragEvent.Types.MOVEEND, selected)
    this.dispatchEvent(e)
    return false
  }

  getSelectedFeatures() {
    return this.selectInteraction_.getFeatures().getArray()
  }

  isSelectedFeature(targetFeature) {
    const features = this.selectInteraction_.getFeatures().getArray()
    return features.some(feature => feature === targetFeature)
  }
}
