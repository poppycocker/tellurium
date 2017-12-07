import Observable from 'ol/observable'
import Draw from 'ol/interaction/draw'
import DragPan from 'ol/interaction/dragpan'
import DeletableDraw from '@@/ol_extension/interaction/deletabledraw'
import FreehandDraw from '@@/ol_extension/interaction/freehanddraw'
import PadDraw from '@@/ol_extension/interaction/paddraw'
import availableMode from '@@/constants/availableMode'
import GeomPolygon from 'ol/geom/polygon'

/**
 * @classdesc
 * UIによる描画の補助を行うクラス
 * @constructor
 * @extends ol.Observable
 * @param {Tellurium} te Telluriumインスタンス
 * @fires drawstart
 * @fires drawend
 * @api stable
 */
export default class DrawingManager extends Observable {
  constructor(te) {
    super()
    /**
     * 描画対象ベクターレイヤー
     * @private
     * @type {ol.layer.Vector}
     */
    this._layerToDraw = null
    /**
     * Telluriumインスタンス
     * @private
     * @type {Tellurium}
     */
    this._te = te
    /**
     * ol.Mapインスタンス
     * @private
     * @type {ol.Map}
     */
    this._olMap = te.olcs.getOlMap()
    /**
     * 現在設定されているinteraction
     * @private
     * @type {ol.interaction.Draw}
     */
    this._currentInteraction = null
    /**
     * タッチ対応した描画操作を提供するか否か
     * @private
     * @type {Boolean}
     */
    this._touch = false // todo:暫定
    /**
     * 描画されたオブジェクトに設定するスタイル
     * @private
     * @type {ol.style.Style|Array.<ol.style.Style>|ol.FeatureStyleFunction|ol.StyleFunction}
     */
    this._style = null
  }

  /**
   * 描画対象に指定されているベクターレイヤーの取得
   * @return {ol.layer.Vector} 現在の描画対象ベクターレイヤー
   * @api stable
   */
  get layerToDraw() {
    return this._layerToDraw
  }

  /**
   * 描画対象とするベクターレイヤーの設定
   * @param {ol.layer.Vector} layer 描画対象に設定するベクターレイヤー
   * @return {DrawingManager} this
   * @api stable
   */
  set layerToDraw(layer) {
    this._layerToDraw = layer
    // 現在描画モードであれば、指定レイヤーでinteractionを作り直す
    const currentMode = this._te.mode
    if (availableMode.isDrawing(currentMode)) {
      this.mode = currentMode
    }
    return this
  }

  /**
   * 現在設定されているスタイルの取得
   * @return {ol.style.Style|Array.<ol.style.Style>|ol.FeatureStyleFunction|ol.StyleFunction} 現在設定されているスタイル
   */
  get style() {
    return this._style
  }

  /**
   * 描画スタイルの設定
   * @param {ol.style.Style|Array.<ol.style.Style>|ol.FeatureStyleFunction|ol.StyleFunction} 現在設定されているスタイル
   * @return {DrawingManager} this
   */
  set style(style) {
    this._style = style
    return this
  }

  /**
 * 現在のinteractionの取得
 * @return {ol.interaction.Draw} ol.interaction.Drawのインスタンス
 * @api stable
 */
  get currentInteraction() {
    return this._currentInteraction
  }

  /**
   * 描画モードの設定
   * @param {Tellurium.availableMode} mode 操作モード(描画系)
   * @throws {Error} 描画対象レイヤーが設定されていない場合
   * @throws {Error} 与えられたモードに対するinteractionが存在しない場合
   */
  set mode(mode) {
    if (!this._layerToDraw) {
      throw new Error('darwing target layer is not set.')
    }
    const nextInteraction = this._touch
      ? this._getInteractionsForTouch(mode)
      : this._getInteractionsForMouse(mode)
    this.clearInteraction()
    if (!nextInteraction) {
      throw new Error(`no interaction is defined for ${mode}.`)
    }
    this._olMap.addInteraction(nextInteraction)
    nextInteraction.on('drawstart', this._onInteractionDrawStart, this)
    nextInteraction.on('drawend', this._onInteractionDrawEnd, this)
    this._currentInteraction = nextInteraction
  }

  /**
   * マウス用のinteraction取得
   * @private
   * @param  {Tellurium.availableMode} mode ユーザーモード(描画系)
   * @return {ol.interaction.Draw} ol.interaction.Drawのインスタンス
   */
  _getInteractionsForMouse(mode) {
    const olVectorSource = this._layerToDraw.getSource()
    const m = availableMode
    let interaction = null
    switch (mode) {
      case m.DRAW_POLYLINE:
        interaction = new DeletableDraw({
          source: olVectorSource,
          type: 'LineString'
        })
        break
      case m.DRAW_POLYLINE_FREEHAND:
        interaction = new FreehandDraw({
          source: olVectorSource,
          type: 'LineString'
        })
        break
      case m.DRAW_POLYGON:
        interaction = new DeletableDraw({
          source: olVectorSource,
          type: 'Polygon'
        })
        break
      case m.DRAW_SQUARE:
        interaction = new Draw({
          source: olVectorSource,
          type: 'LineString',
          maxPoints: 2,
          geometryFunction: this._squareGeomFunc
        })
        break
      case m.DRAW_RECTANGLE:
        interaction = new Draw({
          source: olVectorSource,
          type: 'LineString',
          maxPoints: 2,
          geometryFunction: this._rectangleGeomFunc
        })
        break
      case m.DRAW_CIRCLE:
        interaction = new Draw({
          source: olVectorSource,
          type: 'Circle'
        })
        break
      case m.DRAW_ELLIPSE:
        interaction = new Draw({
          source: olVectorSource,
          type: 'Circle', // 正円と同じくシングルクリックで確定させたいため
          geometryFunction: this._ellipseGeomFunc
        })
        break
      case m.DRAW_LABEL:
        interaction = new Draw({
          source: olVectorSource,
          type: 'Point'
        })
        break
      case m.DRAW_ICON:
        interaction = new Draw({
          source: olVectorSource,
          type: 'Point'
        })
        break
      default:
        break
    }
    return interaction
  }

  /**
 * タッチ用のinteraction取得
 * @private
 * @param  {Tellurium.availableMode} mode ユーザーモード(描画系)
 * @return {ol.interaction.Draw} ol.interaction.Drawのインスタンス
 */
  _getInteractionsForTouch(mode) {
    const olVectorSource = this._layerToDraw.getSource()
    const m = availableMode
    let interaction = null
    switch (mode) {
      case m.DRAW_POLYLINE:
        interaction = new DeletableDraw({
          source: olVectorSource,
          type: 'LineString'
        })
        break
      case m.DRAW_POLYLINE_FREEHAND:
        interaction = new FreehandDraw({
          source: olVectorSource,
          type: 'LineString'
        })
        break
      case m.DRAW_POLYGON:
        interaction = new DeletableDraw({
          source: olVectorSource,
          type: 'Polygon'
        })
        break
      case m.DRAW_SQUARE:
        interaction = new PadDraw({
          source: olVectorSource,
          type: 'LineString',
          maxPoints: 2,
          geometryFunction: this._squareGeomFunc
        })
        break
      case m.DRAW_RECTANGLE:
        interaction = new PadDraw({
          source: olVectorSource,
          type: 'LineString',
          maxPoints: 2,
          geometryFunction: this._rectangleGeomFunc
        })
        break
      case m.DRAW_CIRCLE:
        interaction = new PadDraw({
          source: olVectorSource,
          type: 'Circle'
        })
        break
      case m.DRAW_ELLIPSE:
        interaction = new PadDraw({
          source: olVectorSource,
          type: 'Circle',
          geometryFunction: this._ellipseGeomFunc
        })
        break
      case m.DRAW_LABEL:
        interaction = new Draw({
          source: olVectorSource,
          type: 'Point'
        })
        break
      case m.DRAW_ICON:
        interaction = new Draw({
          source: olVectorSource,
          type: 'Point'
        })
        break
      default:
        break
    }
    return interaction
  }

  /**
   * ドラッグによる地図スクロールinteractionが現在設定されているかの判定
   * @private
   * @return {Boolean} true:有効,false:無効
   */
  _isDragPanSet() {
    const filtered = this._olMap
      .getInteractions()
      .getArray()
      .filter(interaction => interaction instanceof DragPan)
    return !!filtered.length
  }

  /**
   * interactionによる描画操作開始イベントリスナー
   * @private
   * @param  {ol.interaction.DrawEvent} e ol.interaction.DrawEventのインスタンス
   */
  _onInteractionDrawStart(e) {
    this.dispatchEvent(e)
  }

  /**
   * interactionによる描画操作終了イベントリスナー
   * @private
   * @param  {ol.interaction.DrawEvent} e ol.interaction.DrawEventのインスタンス
   */
  _onInteractionDrawEnd(e) {
    e.feature.setStyle(this.style)
    this.dispatchEvent(e)
  }

  /**
   * interactionのクリア
   */
  clearInteraction() {
    if (!this._currentInteraction) {
      return
    }
    this._currentInteraction.un('drawstart', this._onInteractionDrawStart)
    this._currentInteraction.un('drawend', this._onInteractionDrawEnd)
    this._olMap.removeInteraction(this._currentInteraction)
  }

  /**
   * 正方形描画の際にol.interaction.Drawのコンストラクタに渡す関数
   * @private
   * @param  {Array.<ol.Coordinate>} coordinates 緯度経度値[degrees]
   * @param  {ol.geom.Polygon} geometry ol.geom.Polygonのインスタンス
   * @return {ol.geom.Polygon} ol.geom.Polygonのインスタンス
   */
  _squareGeomFunc(coordinates, geometry) {
    if (!geometry) {
      geometry = new GeomPolygon(null)
    }
    const start = coordinates[0]
    const end = coordinates[1]
    const distance = Math.sqrt(
      Math.pow(Math.abs(end[0] - start[0]), 2) +
        Math.pow(Math.abs(end[1] - start[1]), 2)
    )
    const delta = distance / Math.sqrt(2)
    geometry.setCoordinates([
      [
        [start[0] - delta, start[1] - delta],
        [start[0] - delta, start[1] + delta],
        [start[0] + delta, start[1] + delta],
        [start[0] + delta, start[1] - delta],
        [start[0] - delta, start[1] - delta]
      ]
    ])
    return geometry
  }

  /**
   * 矩形描画の際にol.interaction.Drawのコンストラクタに渡す関数
   * @private
   * @param  {Array.<ol.Coordinate>} coordinates 緯度経度値[degrees]
   * @param  {ol.geom.Polygon} geometry ol.geom.Polygonのインスタンス
   * @return {ol.geom.Polygon} ol.geom.Polygonのインスタンス
   */
  _rectangleGeomFunc(coordinates, geometry) {
    if (!geometry) {
      geometry = new GeomPolygon(null)
    }
    const start = coordinates[0]
    const end = coordinates[1]
    geometry.setCoordinates([
      [start, [start[0], end[1]], end, [end[0], start[1]], start]
    ])
    return geometry
  }

  /**
   * 楕円描画の際にol.interaction.Drawのコンストラクタに渡す関数
   * @private
   * @param  {Array.<ol.Coordinate>} coordinates 緯度経度値[degrees]
   * @param  {ol.geom.Polygon} geometry 形状設定対象のポリゴンジオメトリ
   * @return {ol.geom.Polygon} 形状設定対象のポリゴンジオメトリ
   */
  _ellipseGeomFunc(coordinates, geometry) {
    if (!geometry) {
      geometry = new GeomPolygon(null)
    }
    const start = coordinates[0]
    const end = coordinates[1]
    const offsetX = end[0] - start[0]
    const offsetY = end[1] - start[1]
    const flatCoordinates = []
    const rot = 25
    let xPos = 0.0
    let yPos = 0.0

    for (let i = 0 * Math.PI; i < 2 * Math.PI; i += 0.01) {
      xPos =
        start[0] -
        offsetX * Math.cos(i) * Math.cos(rot * Math.PI) +
        offsetY * -Math.sin(i) * Math.sin(rot * Math.PI)
      yPos =
        start[1] +
        offsetY * Math.sin(i) * Math.cos(rot * Math.PI) +
        offsetX * Math.cos(i) * Math.sin(rot * Math.PI)
      flatCoordinates.push([xPos, yPos])
    }
    // ポリゴンは2次元配列で指定する必要がある
    geometry.setCoordinates([flatCoordinates])
    return geometry
  }
}
