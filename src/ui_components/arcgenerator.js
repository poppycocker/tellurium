import BaseWithOwnVectorLayer from '@/ui_components/basewithownvectorlayer'
import Event from 'ol/events/event'
import Style from 'ol/style/style'
import StrokeStyle from 'ol/style/stroke'
import FillStyle from 'ol/style/fill'
import Util from '@/util'
import DrawArc, { DrawArcEventType } from '@/ol_extension/interaction/drawarc'
import PadDrawArc from '@/ol_extension/interaction/paddrawarc'

/**
 * @classdesc
 * 円弧描画中に発生するイベント
 * @constructor
 * @param {Array.<Number>} clickedXY クリック地点のスクリーン座標([X,Y])
 * @param {ol.Coordinate} clickedCoord クリック地点の緯度経度
 * @param {Number} total これまでの累積距離(m)
 * @param {Array.<ol.Coordinate>} shape これまでの計測点座標列
 * @api stable
 */
class ArcEvent extends Event {
  constructor(
    center,
    radialRangeMin,
    radialRangeMax,
    azimuthalRangeLeft,
    azimuthalRangeRight,
    type
  ) {
    super(type)

    /**
     * 中心座標
     * @type {ol.Coordinate}
     */
    this.center = center
    /**
     * 中心から内側の弧までの距離[m]
     * @type {Number}
     * @api stable
     */
    this.radialRangeMin = radialRangeMin
    /**
     * 中心から外側の弧までの距離[m]
     * @type {Number}
     * @api stable
     */
    this.radialRangeMax = radialRangeMax
    /**
     * 北(0°)とその左側にある弧の端までの角度[°]
     * @type {Number}
     * @api stable
     */
    this.azimuthalRangeLeft = azimuthalRangeLeft
    /**
     * 北(0°)とその右側にある弧の端までの角度[°]
     * @type {Number}
     * @api stable
     */
    this.azimuthalRangeRight = azimuthalRangeRight
  }

  /**
   * 円弧描画で発生するイベント種別の定義
   * @enum {string}
   * @api stable
   */
  static get Types() {
    return {
      /**
       * 円弧描画完了時
       * @event ArcEvent#ARC_GENERATED
       * @api stable
       */
      ARC_GENERATED: 'arc_generated'
    }
  }
}

export { ArcEvent }

const MAX_RADIUS = 1000.0 * 1000

/**
 * @classdec
 * 矩形範囲選択モードのUIコントロールを管理するクラス
 * @param {ol.Map} olMap OL3のMapオブジェクト
 * @extends {BaseWithOwnVectorLayer}
 * @fires Mfgeoapi.events.ViewshedEvent#ON_ANALYSING_VIEWSHED_STARTED
 * @fires Mfgeoapi.events.ViewshedEvent#ON_ANALYSING_VIEWSHED_FINISHED
 */
export default class Arc extends BaseWithOwnVectorLayer {
  constructor(olMap, opt_options) {
    super(olMap)
    const options = opt_options || {}
    const style =
      options.style ||
      new Style({
        fill: new FillStyle({
          color: 'rgba(255, 255, 255, 0.1)'
        }),
        stroke: new StrokeStyle({
          color: '#ffcc33',
          width: 3,
          lineDash: [9, 9]
        })
      })
    this._layer.setStyle(style)

    this._generateInteraction()
  }

  /**
   * UIを提供するInteractionを生成する
   * @private
   * @override
   */
  _generateInteraction() {
    const DrawInteraction = Util.isTouchEnable() ? PadDrawArc : DrawArc
    const interaction = new DrawInteraction({
      source: this._source,
      type: 'Circle',
      sides: 32,
      radialRangeLimit: MAX_RADIUS
    })
    interaction.on(DrawArcEventType.DRAWSTART, this.clear, this)
    interaction.on(DrawArcEventType.DRAWEND, evt => {
      // 範囲指定終了、見通し領域解析開始イベントを発火
      const center = evt.feature.get('center_coordinate')
      const firstRadius = evt.feature.get('first_radius')
      const firstDegree = evt.feature.get('first_degree')
      const secondRadius = evt.feature.get('second_radius')
      const secondDegree = evt.feature.get('second_degree')
      this.dispatchEvent(
        new ArcEvent(
          center,
          Math.min(firstRadius, secondRadius),
          Math.max(firstRadius, secondRadius),
          secondDegree,
          firstDegree,
          ArcEvent.Types.ARC_GENERATED
        )
      )
    })
    this._interactions = [interaction]
  }

  /**
   * 図形確定前にadd/removeInteractionしてしまうと正常に描画完了できなくなるので、<br>
   * 都度interactionの再生成を行うためにオーバーライド
   * @override
   */
  activate() {
    if (!this._isActive) {
      this._generateInteraction()
    }
    super.activate()
  }
}
