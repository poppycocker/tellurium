import BaseWithOwnVectorLayer from '@@/ui_components/basewithownvectorlayer'
import Style from 'ol/style/style'
import StrokeStyle from 'ol/style/stroke'
import FillStyle from 'ol/style/fill'
import CircleStyle from 'ol/style/circle'
import Sphere from 'ol/sphere'
import Event from 'ol/events/event'
import DeletableDraw from '@@/ol_extension/interaction/deletabledraw'
import Observable from 'ol/observable'
import Overlay from 'ol/overlay'
import proj from 'ol/proj'

/**
 * @classdesc
 * 距離計測中に発生するイベント
 * @constructor
 * @param {Array.<Number>} clickedXY クリック地点のスクリーン座標([X,Y])
 * @param {ol.Coordinate} clickedCoord クリック地点の緯度経度
 * @param {Number} total これまでの累積距離(m)
 * @param {Array.<ol.Coordinate>} shape これまでの計測点座標列
 * @api stable
 */
class MeasuringEvent extends Event {
  constructor(clickedXY, clickedCoord, total, shape, type) {
    super(type)
    /**
     * クリック地点のスクリーン座標([X,Y])
     * @type {Array.<Number>}
     * @api stable
     */
    this.clickedXY = clickedXY
    /**
     * クリック地点の緯度経度
     * @type {ol.Coordinate}
     * @api stable
     */
    this.clickedCoord = clickedCoord
    /**
     * これまでの累積距離(m)
     * @type {Number}
     * @api stable
     */
    this.total = total
    /**
     * これまでの計測点座標列
     * @type {Array.<ol.Coordinate>}
     * @api stable
     */
    this.shape = shape
  }

  /**
   * 3D地形上で発生するイベント種別の定義
   * @enum {string}
   * @api stable
   */
  static get Types() {
    return {
      /**
       * 距離計測開始時
       * @event MeasuringEvent#MEASURING_STARTED
       * @api stable
       */
      MEASURING_STARTED: 'measuring_started',
      /**
       * 距離計測中の計測点追加時
       * @event MeasuringEvent#MEASURE_POINT_ADDED
       * @api stable
       */
      MEASURE_POINT_ADDED: 'measure_point_added',
      /**
       * 距離計測終了時
       * @event MeasuringEvent#MEASURING_FINISHED
       * @api stable
       */
      MEASURING_FINISHED: 'measuring_finished'
    }
  }
}

export { MeasuringEvent }

/**
 * @classdec
 * 距離計測モードのUIコントロールを管理するクラス
 * @param {ol.Map} olMap OL3のMapオブジェクト
 * @extends {BaseWithOwnVectorLayer}
 * @fires MeasuringEvent#MEASURING_STARTED
 * @fires MeasuringEvent#MEASURE_POINT_ADDED
 * @fires MeasuringEvent#MEASURING_FINISHED
 * @see http://openlayers.org/en/v3.10.1/examples/measure.html
 */
export default class Measure extends BaseWithOwnVectorLayer {
  constructor(olMap, opt_options) {
    super(olMap)
    this._wgs84Sphere = new Sphere(6378137)
    const options = opt_options || {}
    const layerStyle =
      options.layerStyle ||
      new Style({
        fill: new FillStyle({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new StrokeStyle({
          color: '#ffcc33',
          width: 2
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new FillStyle({
            color: '#ffcc33'
          })
        })
      })
    this._layer.setStyle(layerStyle)
    this._interactionStyle =
      options.interactionStyle ||
      new Style({
        fill: new FillStyle({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new StrokeStyle({
          color: 'rgba(0, 0, 0, 0.5)',
          lineDash: [10, 10],
          width: 2
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new StrokeStyle({
            color: 'rgba(0, 0, 0, 0.7)'
          }),
          fill: new FillStyle({
            color: 'rgba(255, 255, 255, 0.2)'
          })
        })
      })
    /**
     * Currently drawn feature.
     * @type {ol.Feature}
     */
    this._sketch = null
    /**
     * The current measure tooltip element.
     * @type {Element}
     */
    this._currentMeasureTooltipElement = null
    /**
     * an array of measure tooltip elements.
     * @type {Array.<Element>}
     */
    this._measureTooltipElements = []
    /**
     * Overlay to show the measurement.
     * @type {ol.Overlay}
     */
    this._measureTooltip = null

    this._generateInteraction()
  }

  /**
   * @inheritdoc
   * @override
   */
  clear() {
    // ツールチップも消す
    this._measureTooltipElements.forEach(el => el.parentNode.removeChild(el))
    this._measureTooltipElements = []
    return super.clear()
  }

  /**
   * 計測開始イベントの通知
   * @private
   */
  _dispatchOnMeasuringStarted(evt) {
    // target内のprivate変数を使ってしまっているのがいまいち。
    // 公式リファレンスにも記載がなく、OL3バージョンアップに対応できない可能性あり
    this.dispatchEvent(
      new MeasuringEvent(
        evt.target.downPx_,
        evt.target.finishCoordinate_,
        0,
        [],
        MeasuringEvent.Types.MEASURING_STARTED
      )
    )
  }

  /**
   * 計測経由点追加イベントの通知
   * @private
   */
  _dispatchOnMeasurePointAdded(evt, length) {
    const coordinates = evt.target
      .getCoordinates()
      .filter(function(coord, i, ar) {
        // 末尾の座標がダブるので排除する
        return i !== ar.length - 1
      })
    this.dispatchEvent(
      new MeasuringEvent(
        evt.target.downPx_,
        coordinates[coordinates.length - 1],
        length,
        coordinates,
        MeasuringEvent.Types.MEASURE_POINT_ADDED
      )
    )
  }

  /**
   * 計測終了イベントの通知
   * @private
   */
  _dispatchOnMeasuringFinished(evt, length) {
    const coordinates = evt.feature.getGeometry().getCoordinates()
    this.dispatchEvent(
      new MeasuringEvent(
        evt.target.downPx_,
        coordinates[coordinates.length - 1],
        length,
        coordinates,
        MeasuringEvent.Types.MEASURING_FINISHED
      )
    )
  }

  /**
   * UIを提供するInteractionを生成する
   * @private
   * @override
   */
  _generateInteraction() {
    const interaction = new DeletableDraw({
      source: this._source,
      type: 'LineString',
      style: this._interactionStyle
    })

    let listener = null
    let vertices = 1 // 2点目から発火するように
    interaction.on('drawstart', evt => {
      this._createMeasureTooltip()
      // set sketch
      this._sketch = evt.feature
      /** @type {ol.Coordinate|undefined} */
      let tooltipCoord = evt.coordinate
      // 計測開始イベントを発火
      this._dispatchOnMeasuringStarted(evt)
      listener = this._sketch.getGeometry().on('change', evt => {
        const geom = evt.target
        const length = this._calcDistance(geom)
        const output = this._formatLength(length)
        tooltipCoord = geom.getLastCoordinate()
        this._currentMeasureTooltipElement.innerHTML = output
        this._measureTooltip.setPosition(tooltipCoord)
        // 経由点追加イベントを発火
        const currentVertices = geom.getCoordinates().length
        if (currentVertices - 1 > vertices) {
          this._dispatchOnMeasurePointAdded(evt, length)
          vertices++
        }
      })
    })

    interaction.on(
      'drawend',
      function(evt) {
        const length = this._calcDistance(evt.feature.getGeometry())
        this._currentMeasureTooltipElement.className = 'tooltip tooltip-static'
        this._measureTooltipElements.push(this._currentMeasureTooltipElement)
        this._measureTooltip.setOffset([0, -7])
        // unset sketch
        this._sketch = null
        // unset tooltip so that a new one can be created
        this._currentMeasureTooltipElement = null
        this._createMeasureTooltip()
        Observable.unByKey(listener)
        // 計測終了イベントを発火
        this._dispatchOnMeasuringFinished(evt, length)
        vertices = 1
      },
      this
    )

    this._interactions = [interaction]
  }

  /**
   * Creates a new measure tooltip
   * @private
   */
  _createMeasureTooltip() {
    if (this._currentMeasureTooltipElement) {
      this._currentMeasureTooltipElement.parentNode.removeChild(
        this._currentMeasureTooltipElement
      )
    }
    this._currentMeasureTooltipElement = document.createElement('div')
    this._currentMeasureTooltipElement.className = 'tooltip tooltip-measure'
    this._measureTooltip = new Overlay({
      element: this._currentMeasureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center'
    })
    this._olMap.addOverlay(this._measureTooltip)
  }

  /**
   * calc distance
   * @private
   * @param {ol.geom.LineString} line
   * @return {Number} length
   */
  _calcDistance(line) {
    const coordinates = line.getCoordinates()
    const sourceProj = this._olMap.getView().getProjection()
    let length = 0
    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      const c1 = proj.transform(coordinates[i], sourceProj, 'EPSG:4326')
      const c2 = proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326')
      length += this._wgs84Sphere.haversineDistance(c1, c2)
    }
    return length
  }

  /**
   * format length output
   * @private
   * @param {Number} length
   * @return {string} label
   */
  _formatLength(length) {
    if (length > 100) {
      return `${Math.round(length / 1000 * 100) / 100} km`
    }
    return `${Math.round(length * 100) / 100} m`
  }
}
