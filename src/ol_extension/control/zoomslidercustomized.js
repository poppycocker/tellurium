import ZoomSlider from 'ol/control/zoomslider'
import 'olex_assets/control/zoomslidercustomized/custom_zoombar.css'
import zoombar from 'olex_assets/control/zoomslidercustomized/zoom_bar.png'

/**
 * @classdesc
 * カスタマイズ済みズームスライダー<br>
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ZoomSliderOptions=} opt_options Zoom slider options.
 */
export default class ZoomSliderCustomized extends ZoomSlider {
  constructor(opt_options) {
    const options = opt_options || {}
    super(options)
    const backgroundElement = document.createElement('img')
    const className =
      options.className !== undefined ? options.className : 'ol-zoomslider'
    backgroundElement.className = className + '-background'
    backgroundElement.src = zoombar
    this.element.appendChild(backgroundElement)
  }

  /**
   * 3D時に0.0-1.0のレンジから外れ、assertion errorが大量発生することがあるため強制介入
   * @override
   */
  getPositionForResolution_(res) {
    const fn = this.getMap()
      .getView()
      .getValueForResolutionFunction()
    let val
    try {
      val = fn(res)
    } catch (e) {
      val = Math.round(this._lastValueForResolution)
    }
    this._lastValueForResolution = val
    return 1 - val
  }
}
