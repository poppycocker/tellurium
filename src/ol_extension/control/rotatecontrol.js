import Control from 'ol/control/control'
import Interaction from 'ol/interaction/interaction'
import MoveControl from '@@/ol_extension/control/movecontrol'
import 'olex_assets/control/rotatecontrol/rotate_control.css'
import Util from '@@/util'

/**
 * @classdesc
 * コンパス及びチルト角コントローラー
 * @constructor
 * @extends {ol.control.Control}
 */
export default class RotateControl extends Control {
  constructor(opt_options) {
    const options = opt_options || {}
    const classNames = options.classNames || {}
    const element = document.createElement('div')
    super({
      element: element,
      render: RotateControl.render,
      target: options.target
    })
    this.innerCircle = document.createElement('div')
    this.outerRing = document.createElement('div')
    this.innerCircle.className = classNames.innerCircle || 'rotate-button'
    this.outerRing.className = classNames.outerRing || 'compass-button'
    element.className =
      (classNames.container || 'rotate-control') + ' ol-unselectable ol-control'
    element.appendChild(this.innerCircle)
    element.appendChild(this.outerRing)

    this.states = {
      processingRotation: false,
      processingCompassDrag: false,
      percentageOfMovement: 0,
      xPositonFromCenter: 0,
      yPositonFromCenter: 0,
      startRoatationValue: 0.0,
      startDegValue: 0.0,
      timeoutId: null,
      pause: false // 動作中にmouseoutした場合の状態保持に使用
    }
  }

  /**
 * setMap時に各種リスナーを設定する
 * @param {Element} mapViewElement 地図div要素
 */
  setEventListenerOnSetMap_(mapViewElement) {
    this.outerRing.addEventListener(
      'dblclick',
      this.handleDoubleClick.bind(this),
      false
    )
    this.outerRing.addEventListener(
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
    Util.handleDoubleTap(
      this.outerRing,
      this.handleDoubleClick.bind(this),
      {
        thisObject: this
      }
    )
    this.outerRing.addEventListener(
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
 * ダブルクリック/タップ時の処理<br>
 * ダブルクリック/タップ位置がouterRing上であれば、コンパスをノースアップにする
 * @param  {MouseEvent|TouchEvent} e マウス/タッチイベント
 */
  handleDoubleClick(e) {
    const e0 = this.getSignificantEventObject_(e)
    if (!e0) {
      return
    }
    const rotateEnable = this.scara_(
      this.innerCircle,
      this.xPoint_(this.innerCircle, e0),
      this.yPoint_(this.innerCircle, e0)
    )
    if (1 < rotateEnable) {
      const map = this.getMap()
      Interaction.rotateWithoutConstraints(map.getView(), 0)
      this.rotateElementInOrientation(this.outerRing)
    }
  }

  /**
 * マウスポインタ/指のダウン時処理<br>
 * innerCircleによる連続回転/outerCircleによるドラッグ回転を開始する
 * @param  {MouseEvent|TouchEvent} e マウス/タッチイベント
 */
  handlePointerDown(e) {
    const e0 = this.getSignificantEventObject_(e)
    if (!e0) {
      return
    }
    const rotateEnable = this.scara_(
      this.innerCircle,
      this.xPoint_(this.innerCircle, e0),
      this.yPoint_(this.innerCircle, e0)
    )
    const s = this.states
    if (1 > rotateEnable) {
      // ポインターがinnerCircleに乗っている状態
      // ポインター移動に応じた地図連続回転を開始する
      s.xPositonFromCenter = this.xPoint_(this.innerCircle, e0)
      s.yPositonFromCenter = this.yPoint_(this.innerCircle, e0)
      s.percentageOfMovement = this.scara_(
        this.innerCircle,
        s.xPositonFromCenter,
        s.yPositonFromCenter
      )
      s.processingRotation = true
      s.timeoutId = setTimeout(this.rotateContinuously.bind(this), 10)
    } else {
      // ポインターがouterRingに乗っている状態
      // リングのドラッグによる地図回転を開始する
      s.startRoatationValue = this.getMap()
        .getView()
        .getRotation()
      s.startDegValue =
        -1 *
        Math.atan2(
          this.yPoint_(this.outerRing, e0),
          this.xPoint_(this.outerRing, e0)
        )
      s.processingCompassDrag = true
    }
  }

  /**
 * マウスポインタ/指の移動時処理<br>
 * 連続回転時の作用量/ドラッグ回転時の回転角を変化させる
 * @param  {MouseEvent|TouchEvent} e マウス/タッチイベント
 */
  handlePointerMove(e) {
    const e0 = this.getSignificantEventObject_(e)
    if (!e0) {
      return
    }
    const s = this.states
    if (s.processingRotation) {
      s.xPositonFromCenter = this.xPoint_(this.innerCircle, e0)
      s.yPositonFromCenter = this.yPoint_(this.innerCircle, e0)
      s.percentageOfMovement = this.scara_(
        this.innerCircle,
        s.xPositonFromCenter,
        s.yPositonFromCenter
      )
    }
    if (s.processingCompassDrag) {
      // 上下左右の上を角度0とするように設定
      const deg =
        -1 *
        Math.atan2(
          this.yPoint_(this.outerRing, e0),
          this.xPoint_(this.outerRing, e0)
        )
      Interaction.rotateWithoutConstraints(
        this.getMap().getView(),
        s.startRoatationValue + (deg - s.startDegValue)
      )
      this.rotateElementInOrientation(this.outerRing)
    }
  }

  /**
 * マウスポインタ/指のアップ時処理<br>
 * 回転操作を終了する
 */
  handlePointerUp() {
    const s = this.states
    if (s.processingRotation) {
      s.processingRotation = false
      s.percentageOfMovement = 0
      s.xPositonFromCenter = 0
      s.yPositonFromCenter = 0
      clearTimeout(s.timeoutId)
    }
    if (s.processingCompassDrag) {
      s.processingCompassDrag = false
    }
    s.pause = false
  }

  /**
 * マウスポインタ/指がターゲット要素から外れた際の処理<br>
 * 視点移動中であれば処理をポーズする
 */
  handlePointerOut() {
    const s = this.states
    if (s.processingRotation || s.processingCompassDrag) {
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
      this.states.timeoutId = setTimeout(this.rotateContinuously.bind(this), 10)
    }
  }

  /**
 * innerCircle上のポイント位置から回転方向・量を計算し、地図回転操作を行う<br>
 * ポインターダウン継続中であれば、自身をタイマーにセットして連続動作させる
 */
  rotateContinuously() {
    const s = this.states
    if (s.pause) {
      return
    }
    s.percentageOfMovement = Math.max(s.percentageOfMovement, 1.0)
    const maxWidthRotateButton = this.innerCircle.getBoundingClientRect().width
    if (s.xPositonFromCenter < -1 * (maxWidthRotateButton / 2)) {
      s.xPositonFromCenter = -1 * (maxWidthRotateButton / 2)
    } else if (s.xPositonFromCenter > maxWidthRotateButton / 2) {
      s.xPositonFromCenter = maxWidthRotateButton / 2
    }
    const map = this.getMap()
    const view = map.getView()
    const rotation = view.getRotation()
    const xDelta = s.xPositonFromCenter * s.percentageOfMovement / 1000
    Interaction.rotateWithoutConstraints(view, rotation - xDelta)
    if (s.processingRotation === true) {
      s.timeoutId = setTimeout(this.rotateContinuously.bind(this), 10)
    }
    this.rotateElementInOrientation(this.outerRing)
  }

  /**
 * ターゲット要素を現在の地図回転角に合わせて回転させる
 * @param  {Element} element ターゲット要素
 */
  rotateElementInOrientation(element) {
    const map = this.getMap()
    const view = map.getView()
    const viewRotate = view.getRotation()
    element.style.transform = 'rotate(' + viewRotate + ')'
    element.style.mozTransform = 'rotate(' + viewRotate + 'rad)'
    element.style.webkitTransform = 'rotate(' + viewRotate + 'rad)'
    element.style.OTransform = 'rotate(' + viewRotate + 'rad)'
    element.style.msTransform = 'rotate(' + viewRotate + 'rad)'
  }

  /**
 * 地図の回転に追従させる<br>
 * ol.MapEventType.POSTRENDER 発火時に呼ばれる
 * @override
 */
  static render(mapEvent) {
    this.rotateElementInOrientation(this.outerRing)
  }
}

/**
 * @see ol.control.MoveControl#setMap
 */
RotateControl.prototype.setMap = MoveControl.prototype.setMap
/**
 * @see ol.control.MoveControl#xPoint_
 */
RotateControl.prototype.xPoint_ = MoveControl.prototype.xPoint_
/**
 * @see ol.control.MoveControl#yPoint_
 */
RotateControl.prototype.yPoint_ = MoveControl.prototype.yPoint_
/**
 * @see ol.control.MoveControl#scara_
 */
RotateControl.prototype.scara_ = MoveControl.prototype.scara_
/**
 * @see ol.control.MoveControl#getSignificantEventObject_
 */
RotateControl.prototype.getSignificantEventObject_ =
  MoveControl.prototype.getSignificantEventObject_
