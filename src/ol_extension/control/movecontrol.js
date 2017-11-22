import Control from 'ol/control/control'
import Interaction from 'ol/interaction/interaction'
import 'olex_assets/control/movecontrol/move_control.css'
import Util from '@/util'

/**
 * @classdesc
 * 視点の水平移動コントローラー
 * @constructor
 * @extends {ol.control.Control}
 */
export default class MoveControl extends Control {
  constructor(opt_options) {
    const options = opt_options || {}
    const classNames = options.classNames || {}
    const element = document.createElement('div')
    super({
      element: element,
      // render: ol.control.MoveControl.render,
      target: options.target
    })

    this.button = document.createElement('div')
    this.button.className = classNames.button || 'move-button'
    element.className =
      (classNames.container || 'move-control') + ' ol-unselectable ol-control'
    element.appendChild(this.button)

    this.states = {
      isProcessing: false,
      percentageOfMovement: 0, // 移動量の割合,百分率
      xPositonOfCenter: 0,
      yPositonOfCenter: 0,
      mapRotatation: 0.0, // マップの傾き
      timeoutId: null,
      pause: false // 動作中にmouseoutした場合の状態保持に使用
    }
  }

  /**
   * setMap時に各種リスナーを設定する
   * @param {Element} mapViewElement 地図div要素
   */
  setEventListenerOnSetMap_(mapViewElement) {
    this.button.addEventListener(
      'mousedown',
      this.handlePointerDown.bind(this),
      false
    )
    mapViewElement.addEventListener(
      'mousemove',
      this.handlePointerMove.bind(this),
      false
    )
    mapViewElement.addEventListener(
      'mouseup',
      this.handlePointerUp.bind(this),
      false
    )
    mapViewElement.addEventListener(
      'mouseout',
      this.handlePointerOut.bind(this),
      false
    )
    mapViewElement.addEventListener(
      'mouseover',
      this.handlePointerOver.bind(this),
      false
    )
    if (!Util.isTouchEnable()) {
      return
    }
    this.button.addEventListener(
      'touchstart',
      this.handlePointerDown.bind(this),
      false
    )
    mapViewElement.addEventListener(
      'touchmove',
      this.handlePointerMove.bind(this),
      false
    )
    mapViewElement.addEventListener(
      'touchend',
      this.handlePointerUp.bind(this),
      false
    )
    mapViewElement.addEventListener(
      'touchleave',
      this.handlePointerOut.bind(this),
      false
    )
    mapViewElement.addEventListener(
      'touchenter',
      this.handlePointerOver.bind(this),
      false
    )
  }

  /**
   * マウスポインタ/指のダウン時処理<br>
   * 視点移動を開始する
   * @param  {MouseEvent|TouchEvent} e マウス/タッチイベント
   */
  handlePointerDown(e) {
    const e0 = this.getSignificantEventObject_(e)
    if (!e0) {
      return
    }
    const s = this.states
    const map = this.getMap()
    const view = map.getView()
    s.mapRotatation = view.getRotation()
    s.xPositonOfCenter = this.xPoint_(this.button, e0)
    s.yPositonOfCenter = this.yPoint_(this.button, e0)
    s.percentageOfMovement = this.scara_(
      this.button,
      s.xPositonOfCenter,
      s.yPositonOfCenter
    )
    s.isProcessing = true
    s.timeoutId = setTimeout(this.move.bind(this), 10)
  }

  /**
   * マウスポインタ/指の移動中の処理<br>
   * カーソル/指の位置に応じて移動量(速度)を変化させる
   * @param  {MouseEvent|TouchEvent} e マウス/タッチイベント
   */
  handlePointerMove(e) {
    const e0 = this.getSignificantEventObject_(e)
    const s = this.states
    if (e0 && s.isProcessing) {
      s.xPositonOfCenter = this.xPoint_(this.button, e0)
      s.yPositonOfCenter = this.yPoint_(this.button, e0)
      s.percentageOfMovement = this.scara_(
        this.button,
        s.xPositonOfCenter,
        s.yPositonOfCenter
      )
    }
  }

  /**
   * マウスポインタ/指のアップ時処理<br>
   * 視点移動を終了する
   */
  handlePointerUp() {
    const s = this.states
    s.isProcessing = false
    s.percentageOfMovement = 0
    s.xPositonOfCenter = 0
    s.yPositonOfCenter = 0
    clearTimeout(s.timeoutId)
    s.pause = false
  }

  /**
   * マウスポインタ/指がターゲット要素から外れた際の処理<br>
   * 視点移動中であれば処理をポーズする
   */
  handlePointerOut() {
    const s = this.states
    if (s.isProcessing) {
      this.states.pause = true
    }
  }

  /**
   * マウスポインタ/指がターゲット要素に乗った際の処理<br>
   * 視点移動がポーズされていれば再開させる
   */
  handlePointerOver() {
    // mouseout前にポーズした動作を再開させる
    const s = this.states
    if (s.pause) {
      s.pause = false
      this.states.timeoutId = setTimeout(this.move.bind(this), 10)
    }
  }

  /**
   * 視点の移動処理<br>
   * イベント入力から算出した移動方向・量に応じた視点移動を行う
   */
  move() {
    const s = this.states
    if (s.pause) {
      return
    }
    const map = this.getMap()
    const view = map.getView()
    s.percentageOfMovement =
      s.percentageOfMovement > 1.0 ? s.percentageOfMovement : 1.0
    // 移動量
    const amountOfMovement = Math.sqrt(
      Math.pow(s.xPositonOfCenter, 2) + Math.pow(s.yPositonOfCenter, 2)
    )
    // ボタン中心からの角度
    const angle = Math.atan2(s.yPositonOfCenter, s.xPositonOfCenter)
    const xDelta =
      amountOfMovement *
      Math.cos(s.mapRotatation + angle) *
      s.percentageOfMovement *
      view.getResolution()
    const yDelta =
      amountOfMovement *
      Math.sin(s.mapRotatation + angle) *
      s.percentageOfMovement *
      view.getResolution()
    const delta = [xDelta, yDelta]

    Interaction.pan(view, delta, 1)
    if (s.isProcessing === true) {
      s.timeoutId = setTimeout(this.move.bind(this), 10)
    }
  }

  /**
   * ターゲット要素の中心を基準とした座標系における、マウス/タッチイベントが指す位置のX座標を返す
   * @param  {Element} element ターゲット要素
   * @param  {MouseEvent|TouchEvent} e イベント
   * @return {Number} ターゲット要素中心基準のX座標
   */
  xPoint_(element, e) {
    const rect = element.getBoundingClientRect()
    return e.clientX - rect.left - rect.width / 2
  }

  /**
   * ターゲット要素の中心を基準とした座標系における、マウス/タッチイベントが指す位置のY座標を返す
   * @param  {Element} element ターゲット要素
   * @param  {MouseEvent|TouchEvent} e イベント
   * @return {Number} ターゲット要素中心基準のY座標
   */
  yPoint_(element, e) {
    const rect = element.getBoundingClientRect()
    return -1 * (e.clientY - rect.top - rect.height / 2)
  }

  /**
   * ターゲット要素中心座標からポインターまでの距離を算出する<br>
   * ターゲット要素中心座標と重なる際に0.0、<br>
   * ターゲット要素の矩形の短辺の1/2を半径とする円周上にあるときに1.0となる
   * @param  {Element} element ターゲット要素
   * @param  {Number} x ターゲット要素の中心を基準とした座標系におけるX座標値
   * @param  {Number} y ターゲット要素の中心を基準とした座標系におけるY座標値
   * @return {Number} 計算された移動量
   */
  scara_(element, x, y) {
    const rect = element.getBoundingClientRect()
    const minLenght = Math.min(rect.width, rect.height)
    const maxVal = minLenght / 2
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) / maxVal
  }

  /**
   * イベントリスナー登録用にオーバーライド
   * @override
   * @param {ol.Map} map ol.Map
   */
  setMap(map) {
    if (map && !this.arelistenersIntialized) {
      this.setEventListenerOnSetMap_(map.getTargetElement())
      this.arelistenersIntialized = true
    }
    super.setMap(map)
  }

  /**
   * MouseEventの場合はそのまま返却、TouchEventの場合は一本指操作であることを確認の上、一番目の指のイベントを返却
   * @param  {MouseEvent|TouchEvent} e イベント
   * @return {MouseEvent|Touch} 抽出されたイベントオブジェクト
   */
  getSignificantEventObject_(e) {
    // タッチイベントの場合は一本指での操作のみ有効とする
    const isSingleTouch = e && e.touches && e.touches.length === 1
    const isTouchEvent = !window.TouchEvent
      ? false
      : e instanceof window.TouchEvent
    if (isTouchEvent && !isSingleTouch) {
      return null
    }
    return isTouchEvent ? e.touches[0] : e
  }
}
