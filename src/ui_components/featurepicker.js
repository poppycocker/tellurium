import Base from '@/ui_components/base'
import eventCondition from 'ol/events/condition'
import Style from 'ol/style/style'
import StrokeStyle from 'ol/style/stroke'
import FillStyle from 'ol/style/fill'
import Select from 'ol/interaction/select'
import DragBox from 'ol/interaction/dragbox'
import PadDragBox from '@/ol_extension/interaction/paddragbox'
import DragSelectedFeatures from '@/ol_extension/interaction/dragselectedfeatures'
import FeatureDragEvent from '@/ol_extension/featuredragevent'

/**
 * @classdesc
 * UI component for feature picker.
 * @fires {ol.interaction.Select.Event}
 * @fires {FeatureDragEvent}
 */
export default class FeaturePicker extends Base {
  constructor(olMap, opt_options) {
    super(olMap)
    const options = opt_options || {}
    this._isTouch = options.isTouch || false
    this._style =
      options.style ||
      new Style({
        fill: new FillStyle({
          color: 'rgba(255, 255, 255, 0.5)'
        }),
        stroke: new StrokeStyle({
          color: '#ffcc33',
          width: 3,
          lineDash: [9, 9]
        })
      })
    /**
     * 選択対象ベクターレイヤー
     * @private
     * @type {ol.layer.Vector}
     */
    this._layerToPick = null
    /**
     * ol.interaction.Selectインスタンス シングルクリックでの選択に使用
     * @private
     * @type {ol.interaction.Select}
     */
    this._select = null
  }

  /**
   * UIを提供するInteractionを生成する
   * @private
   * @override
   */
  _generateInteraction() {
    this._select = new Select({
      layers: [this._layerToPick],
      condition: mapBrowserEvent => eventCondition.singleClick(mapBrowserEvent),
      addCondition: mapBrowserEvent =>
        eventCondition.singleClick(mapBrowserEvent),
      removeCondition: mapBrowserEvent =>
        eventCondition.singleClick(mapBrowserEvent),
      toggleCondition: eventCondition.never,
      features: this._layerToPick.getSource().getFeatures()
    })
    this._select.on('select', this._dispatchOnChange, this)

    const DragBoxInteraction = this._isTouch ? PadDragBox : DragBox
    /**
     * ol.interaction.DragBoxインスタンス 範囲での選択に使用
     * @private
     * @type {ol.interaction.DragBox}
     */
    const dragBox = new DragBoxInteraction({
      condition: mapBrowserEvent =>
        !eventCondition.singleClick(mapBrowserEvent) &&
        !eventCondition.doubleClick(mapBrowserEvent),
      style: this._style
    })
    dragBox.on('boxend', e => {
      const boxExtent = dragBox.getGeometry().getExtent()
      const selectedFeatures = this._select.getFeatures()
      const source = this._layerToPick.getSource()
      let changed = false
      source.forEachFeatureInExtent(boxExtent, feature => {
        const featureExtent = feature.getGeometry().getExtent()
        if (
          featureExtent[0] >= boxExtent[0] &&
          featureExtent[1] >= boxExtent[1] &&
          featureExtent[2] <= boxExtent[2] &&
          featureExtent[3] <= boxExtent[3]
        ) {
          // 元々選択されていないものの検出
          if (!selectedFeatures.remove(feature)) {
            changed = true
          }
          selectedFeatures.push(feature)
        }
      })
      if (changed) {
        this._dispatchOnChange()
      }
    })

    const dragFeature = new DragSelectedFeatures(this._select)
    dragFeature.on(
      FeatureDragEvent.Types.MOVESTART,
      this.dispatchEvent,
      this
    )
    dragFeature.on(FeatureDragEvent.Types.MOVEEND, this.dispatchEvent, this)
    this._interactions = [this._select, dragBox, dragFeature]
  }

  /**
   * 地図ダブルクリック時のリスナ<br>
   * フィーチャーが無い地点でダブルクリックした際、選択状態を全解除する
   * @private
   * @param  {ol.MapBrowserEvent} mapBrowserEvent MapBrowserEvent
   * @return {Boolean} バブリングするか否か
   */
  _onDoubleClicked(mapBrowserEvent) {
    const features = this._select.getFeatures()
    if (!features.getLength()) {
      return false
    }
    if (!this._olMap.hasFeatureAtPixel(mapBrowserEvent.pixel)) {
      features.clear()
      this._dispatchOnChange()
    }
    return false
  }

  /**
   * フィーチャー削除時のリスナ<br>
   * 削除されたフィーチャーに対し、選択状態を解除する。<br>
   * @private
   * @param  {ol.source.VectorEvent} vectorEvent ol.source.VectorEvent
   */
  _onFeatureRemoved(vectorEvent) {
    const selectedFeatures = this._select.getFeatures()
    selectedFeatures.remove(vectorEvent.feature)
    this._dispatchOnChange()
  }

  /**
   * @override
   */
  activate() {
    if (!this._layerToPick) {
      throw new Error('specify target layer to select features.')
    }
    this._olMap.on('dblclick', this._onDoubleClicked, this)
    super.activate()
  }

  /**
   * @override
   */
  deactivate() {
    this._olMap.un('dblclick', this._onDoubleClicked, this)
    super.deactivate()
  }

  get layerToPick() {
    return this._layerToPick
  }

  /**
   * 選択対象レイヤーの設定
   * @param {ol.layer.Vector} layer 選択対象ベクターレイヤー
   * @fires {ol.interaction.Select.Event}
   */
  set layerToPick(layer) {
    // Interactionを再生成、イベントリスナーを付け替え
    const wasActive = this._isActive
    this.deactivate()
    if (this._layerToPick) {
      this._layerToPick
        .getSource()
        .un('removefeature', this._onFeatureRemoved, this)
    }
    this._layerToPick = layer
    this._generateInteraction()
    this._layerToPick
      .getSource()
      .on('removefeature', this._onFeatureRemoved, this)
    if (wasActive) {
      this.activate()
    } else {
      this.deactivate()
    }
  }

  /**
   * 選択状態変化イベントの発火
   * @fires {ol.interaction.Select.Event}
   * @private
   */
  _dispatchOnChange() {
    this.dispatchEvent(
      new Select.Event(Select.EventType_.SELECT, this.features, [], null)
    )
  }

  /**
   * 現在選択されているフィーチャーを全て取得
   * @return {Array.<ol.Feature>} 現在選択されている全フィーチャー
   */
  get features() {
    return this._select ? this._select.getFeatures().getArray() : []
  }

  /**
   * 選択状態の全解除
   * @fires {ol.interaction.Select.Event}
   */
  releaseAll() {
    if (!this._select) {
      return
    }
    this._select.getFeatures().clear()
    this._dispatchOnChange()
  }
}
