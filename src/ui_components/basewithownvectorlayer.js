import Base from '@/ui_components/base'
import VectorLayer from 'ol/layer/vector'
import VectorSource from 'ol/source/vector'

export default class BaseWithOwnVectorLayer extends Base {
  constructor(olMap) {
    super(olMap)
    /**
     * 描画用ベクターレイヤー<br>
     * sourceやstyleは派生先でセットすること
     * @private
     * @type {ol.layer.Vector}
     */
    this._layer = new VectorLayer({})
    /**
     * ベクターソース
     * @private
     * @type {ol.source.Vector}
     */
    this._source = new VectorSource()
    this._layer.setSource(this._source)

    this._olMap.addLayer(this._layer)
  }
  /**
   * @override
   */
  activate() {
    this._layer.setVisible(true)
    super.activate()
  }
  /**
   * @override
   */
  deactivate() {
    this.clear()
    this._layer.setVisible(false)
    super.deactivate()
  }

  get layer() {
    return this._layer
  }

  clear() {
    this._source.clear()
  }
}
