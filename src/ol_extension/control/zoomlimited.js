import Zoom from 'ol/control/zoom'
import Util from '@/util'
import 'olex_assets/control/zoomslidercustomized/custom_zoombar.css'

export default class ZoomLimited extends Zoom {
  constructor(min, max, opt_options) {
    super(opt_options)
    ;[this.min_, this.max_] = [min, max]
  }
  /**
   * @param {number} delta Zoom delta.
   * @private
   */
  zoomByDelta_(delta) {
    const map = this.getMap()
    const view = map.getView()
    if (!view) {
      return
    }
    const currentResolution = view.getResolution()
    if (currentResolution) {
      // 上限/下限に達している場合はズームさせない
      const currentZoom = Util.approximateZoomFromResolution(
        view,
        currentResolution
      )
      if (delta < 0 && currentZoom === this.min_) {
        return
      }
      if (delta > 0 && currentZoom === this.max_) {
        return
      }
    }
    super.zoomByDelta_(delta)
  }
}
