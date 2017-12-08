import Observable from 'ol/observable'
import Sphere from 'ol/sphere'
import Cesium from 'cesium/Cesium'
import proj from 'ol/proj'

let isProcessing = false

export default class CrossSectionAnalyzer extends Observable {
  constructor(terrainProvider) {
    super()
    this._terrainProvider = terrainProvider
    this._wgs84Sphere = new Sphere(6378137)
  }

  /**
   * 実行状態を取得する<br>
   * 生成されたインスタンスのうち一つでも実行中であればtrueが返る
   * @api stable
   * @type {Boolean}
   */
  static isProcessing() {
    return isProcessing
  }
  _onStart() {
    isProcessing = true
  }
  _onFinish() {
    isProcessing = false
  }

  /**
   * 断面解析処理の要求と結果受け取り<br>
   * @param {Object} params 処理パラメーター
   *   @param {ol.Coordinate} params.start 解析開始点
   *   @param {ol.Coordinate} params.end 解析終了点
   *   @param {Array.<ol.Coordinate>} [params.via] 解析経由点
   *   @param {Number} params.resolution 見通し方向の解像度(m)
   *   @param {Number} [params.terrainLevel=8] 解析対象Terrainレベル
   * @param {CrossSectionAnalyzer~crossSectionCallback} callback 結果受け取り用コールバック
   * @param {Object} [thisObject=null] コールバック呼び出し時にthisとして扱うオブジェクト
   * @api stable
   */
  requestCrossSection(params, callback, thisObject) {
    if (CrossSectionAnalyzer.isProcessing()) {
      callback.call(thisObject, {
        success: false,
        message: 'CrossSectionAnalyzer is already processing.'
      })
      return false
    }
    this._onStart()

    const paths = [params.start, ...(params.via || []), params.end]
      .map((p, i, ar) => (i ? ar.slice(i - 1, i + 1) : null))
      .filter(v => !!v)

    const pointsToSample = paths.map(path => {
      const s = path[0]
      const e = path[1]
      const s4326 = proj.transform(s, 'EPSG:3857', 'EPSG:4326')
      const e4326 = proj.transform(e, 'EPSG:3857', 'EPSG:4326')
      const distance = this._wgs84Sphere.haversineDistance(s4326, e4326)
      const parts = Math.round(distance / params.resolution)
      const sx = s[0]
      const sy = s[1]
      const ex = e[0]
      const ey = e[1]
      const divided = []
      for (let i = 0; i < parts; i++) {
        const x = sx + (ex - sx) * i / parts
        const y = sy + (ey - sy) * i / parts
        const point4326 = proj.transform([x, y], 'EPSG:3857', 'EPSG:4326')
        const carto = Cesium.Cartographic.fromDegrees(...point4326)
        divided.push(carto)
      }
      return divided
    })

    const result = []
    const toDeg = Cesium.Math.toDegrees
    const promises = pointsToSample.map((points, i) => {
      return new Promise((resolve, reject) => {
        const onFulfilled = samples => {
          result[i] = samples.map(carto => {
            const point4326 = [toDeg(carto.longitude), toDeg(carto.latitude)]
            const point3857 = proj.transform(
              point4326,
              'EPSG:4326',
              'EPSG:3857'
            )
            return [...point3857, carto.height]
          })
          resolve()
        }
        const onRejected = err => {
          reject(err)
        }
        Cesium.sampleTerrain(
          this._terrainProvider,
          params.terrainLevel || 8,
          points
        ).then(onFulfilled, onRejected)
      })
    })

    Promise.all(promises)
      .then(() => {
        this._onFinish()
        callback.call(thisObject, {
          success: true,
          altitudes: result
        })
      })
      .catch(err => {
        this._onFinish()
        callback.call(thisObject, {
          success: false,
          message: err.message
        })
      })
  }
  /**
   * 見通し領域解析結果通知コールバック
   * @callback CrossSectionAnalyzer~crossSectionCallback
   * @param  {Object} result 処理結果
   * @param  {Boolean} result.success 処理成否
   * @param  {String} result.message メッセージ(エラー時)
   * @param  {Array.<Array.<ol.Coordinate>>} result.altitudes 解析結果点群
   * @api stable
   */
}
