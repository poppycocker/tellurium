const Util = {
  isUndefined: obj => obj === (v => v)(),
  isDefined: obj => !Util.isUndefined(obj),
  /**
   *  @see ol.View#getZoom
   *  resolutionからzoomLevelを取得する。
   *  ol.View#getZoomはzoomLevelに対応するresolutionが存在しない場合undefinedを返すため、
   *  現在のresolutionと最も近いzoomLevelを返す
   *  @param  {ol.View} view ol.Viewのインスタンス
   *  @param  {Number} [opt_resolution] 計算対象resolution(オプション)
   *  @return {Number} zoomLevel
   */
  approximateZoomFromResolution: (view, opt_resolution) => {
    let offset
    const und = Util.isUndefined
    const resolution = opt_resolution || view.getResolution()
    if (!und(resolution)) {
      let res
      let z = 0
      let currentDiff = 100000
      do {
        res = view.constrainResolution(view.maxResolution_, z)
        const diff = Math.abs(res - resolution)
        if (diff === 0) {
          offset = z
          break
        } else if (diff < currentDiff) {
          currentDiff = diff
        } else {
          offset = z - 1
          break
        }
        ++z
      } while (res > view.minResolution_)
      if (und(offset) && currentDiff < 1) {
        offset = z
      }
    }
    return !und(offset) ? view.minZoom_ + offset : offset
  },
  clamp: (val, min, max) => Math.min(Math.max(min, val), max),
  /**
   * 角度値(degrees)の正規化: 0.0 <= deg < 360.0
   * @param  {Number} v 入力値
   * @return {Number} 正規化済み出力値
   */
  normalizeDegrees: v => {
    const d = v > 0 ? -1 : 1
    while (v < 0 || 360 <= v) {
      v += 360 * d
    }
    return v
  },
  /**
   * Determines if touch enable.
   * @return     {boolean}  True if touch is enable, False otherwise.
   */
  isTouchEnable: () => {
    return !!window.ontouchstart
  },
  /**
   * ダブルタップのハンドリング
   * @param  {Element} elem ターゲット要素
   * @param  {Function} listener リスナー関数
   * @param  {Object} [opt_options] オプションパラメーター
   *   @param  {Boolean} [opt_options.useCapture=false] useCapture
   *   @param  {Object} [opt_options.thisObject=null] 実行コンテキスト
   *   @param  {Number} [opt_options.interval=500] タップ間隔[ms]
   */
  handleDoubleTap: (elem, listener, opt_options) => {
    let timeoutId = null
    let last = 0
    const options = opt_options || {}
    const interval = options.interval || 500
    elem.addEventListener(
      'touchstart',
      e => {
        const now = Date.now()
        clearTimeout(timeoutId)
        if (now - last < interval) {
          listener.call(options.thisObject, e)
        } else {
          timeoutId = setTimeout(function() {
            clearTimeout(timeoutId)
          }, interval)
        }
        last = now
      },
      !!options.useCapture
    )
  },
  googbind: (fn, ctx, ...args) => {
    const binded = fn.bind(ctx)
    return () => binded(...args)
  }
}

export default Util
