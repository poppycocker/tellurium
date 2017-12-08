import Observable from 'ol/observable'
import Cesium from 'cesium/Cesium'
import GeoJSONFormat from 'ol/format/geojson'
import proj from 'ol/proj'
import geoCircle from 'd3-geo/src/circle'
import geoCentroid from 'd3-geo/src/centroid'
import nest from 'd3-collection/src/nest'

const EARTH_RADIUS = 6378137
let isProcessing = false

/**
 * @classdesc
 * 地図データの解析を行う(現時点では見通し領域解析機能を提供)
 * @constructor
 * @api stable
 */
export default class ViewshedAnalyzer extends Observable {
  constructor(terrainProvider) {
    super()
    this._terrainProvider = terrainProvider
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
   * 見通し領域解析処理の要求と結果受け取り<br>
   * @param {Object} params 処理パラメーター
   *   @param {ol.Coordinate} params.center 視点緯度経度
   *   @param {Number} [params.eyeHeight=2.0] 視点の高さ[m](地表基準)
   *   @param {Number} [params.radialRangeMin=0] 解析対象距離レンジ_見通し開始距離[m] 50kmを上限値とする
   *   @param {Number} params.radialRangeMax 解析対象距離レンジ_見通し打ち切り距離[m] 50kmを上限値とする
   *   @param {Number} [params.azimuthalRangeLeft=0.0] 解析対象方位レンジ_開始値(北を0°として時計回りに増加)[degrees]
   *   @param {Number} [params.azimuthalRangeRight=360.0] 解析対象方位レンジ_終了値(北を0°として時計回りに増加)[degrees]
   *   @param {Number} params.radialResolution 見通し方向の解像度(刻み)[m]
   *   @param {Number} params.azimuthalResolution 角度の解像度(刻み)[degrees]
   *   @param {Number} [params.terrainLevel=8] 解析対象Terrainレベル
   * @param {ViewshedAnalyzer~viewshedCallback} callback 結果受け取り用コールバック
   * @param {Object} [thisObject=null] コールバック呼び出し時にthisとして扱うオブジェクト
   * @api stable
   */
  requestViewshed(params, callback, thisObject) {
    if (ViewshedAnalyzer.isProcessing()) {
      callback.call(thisObject, {
        success: false,
        message: 'ViewshedAnalyzer is already processing.'
      })
      return false
    }
    this._onStart()
    this._params = params
    this._clipLineId = undefined

    const positions = this._createPositions(
      this._params.center,
      this._params.radialRangeMax,
      this._params.radialResolution,
      this._params.azimuthalResolution,
      this._params.azimuthalRangeLeft,
      this._params.azimuthalRangeRight
    )
    let geoJson = this._createGeoJson(positions)
    this._calcCentroid(geoJson)
    // terrainProviderから標高読み込み
    // 重心の標高データを取得する
    Cesium.sampleTerrain(
      this._terrainProvider,
      this._params.terrainLevel || 8,
      geoJson.features.map(polygon => {
        const c = polygon.properties.centroid
        return Cesium.Cartographic.fromDegrees(c[0], c[1])
      })
    ).then(
      samples => {
        this._setElevations(geoJson, samples)
        this._setVisibility(geoJson)
        geoJson = this._clipCircle(
          geoJson,
          this._params.radialResolution,
          this._params.radialRangeMin
        )
        geoJson = this._reducePolygon(geoJson)
        const engine = new GeoJSONFormat()
        const features = engine
          .readFeatures(geoJson)
          .filter(feature => {
            // 可視ポリゴンのみに絞って再構築
            return feature.getProperties().visible
          })
          .map(feature => {
            feature
              .getGeometry()
              .transform(proj.get('EPSG:4326'), proj.get('EPSG:3857'))
            return feature
          })
        this._onFinish()
        callback.call(thisObject, {
          success: true,
          features: features
        })
      },
      e => {
        this._onFinish()
        callback.call(thisObject, {
          success: false,
          message: e.message
        })
      }
    )
    return true
  }
  /**
   * 見通し領域解析結果通知コールバック
   * @callback ViewshedAnalyzer~viewshedCallback
   * @param  {Object} result 処理結果
   * @param  {Boolean} result.success 処理成否
   * @param  {String} result.message メッセージ(エラー時)
   * @param  {Array.<ol.feature.Polygon>} result.features 解析結果ポリゴン群
   * @api stable
   */

  /**
   * centerで与えられた中心座標から半径radialRengeMaxの円を描き、azimuthalResolutionで扇型に分割し、
   * 見通し方向の距離をradialResolutionで分割して見通し領域解析用の座標群を生成し返す
   * @private
   * @param {ol.Coordinate} center 視点緯度経度
   * @param {Object} radialRangeMax 解析対象距離レンジ_見通し打ち切り距離[m] 50kmを上限値とする
   * @param {Number} radialResolution 見通し方向の解像度(刻み)[m]
   * @param {Number} azimuthalResolution 角度の解像度(刻み)[degrees]
   * @param {Number} [azimuthalRangeLeft=0.0] 解析対象方位レンジ_開始値(北を0°として時計回りに増加)[degrees]
   * @param {Number} [azimuthalRangeRight=360.0] 解析対象方位レンジ_終了値(北を0°として時計回りに増加)[degrees]
   * @return {Array.<Array.<Array>>} 指定された分解能で分割された同心円の座標
   * @api stable
   */
  _createPositions(
    center,
    radialRangeMax,
    radialResolution,
    azimuthalResolution,
    azimuthalRangeLeft,
    azimuthalRangeRight
  ) {
    const retPositions = []
    azimuthalRangeLeft = this._convertDegress(
      this._params.azimuthalRangeLeft || 0
    )
    azimuthalRangeRight = this._convertDegress(
      this._params.azimuthalRangeRight || 360
    )
    const center4326 = proj.transform(center, 'EPSG:3857', 'EPSG:4326')
    const d3GeoCircle = geoCircle()
      .center(center4326)
      .precision(azimuthalResolution)
    const stepEnd = radialRangeMax / radialResolution
    let azimuthalRangeStartStep
    let azimuthalRangeEndStep
    let upsideLeft = false
    if (azimuthalRangeLeft === azimuthalRangeRight) {
      azimuthalRangeStartStep = 0
      azimuthalRangeEndStep = Math.floor(360 / azimuthalResolution)
    } else if (azimuthalRangeLeft < azimuthalRangeRight) {
      azimuthalRangeStartStep = Math.ceil(
        azimuthalRangeLeft / azimuthalResolution
      )
      azimuthalRangeEndStep = Math.floor(
        azimuthalRangeRight / azimuthalResolution
      )
    } else {
      // left > right (0度を跨ぐ時)
      upsideLeft = true
      azimuthalRangeStartStep = Math.floor(
        azimuthalRangeRight / azimuthalResolution
      )
      azimuthalRangeEndStep = Math.ceil(
        azimuthalRangeLeft / azimuthalResolution
      )
      this._clipLineId = azimuthalRangeStartStep
    }
    // 指定範囲角度内の座標のみ抽出する
    const filterFnc = (_, index) => {
      if (upsideLeft) {
        return (
          index <= azimuthalRangeStartStep || index >= azimuthalRangeEndStep
        )
      } else {
        return (
          azimuthalRangeStartStep <= index && index <= azimuthalRangeEndStep
        )
      }
    }
    // 同心円を広げながら積み重ねていく
    for (let i = 0; i <= stepEnd; i++) {
      const radius = 180 / Math.PI * (i * radialResolution) / EARTH_RADIUS
      d3GeoCircle.radius(radius)
      const ring = d3GeoCircle().coordinates[0].filter(filterFnc)
      retPositions.push(ring)
    }
    return retPositions
  }

  /**
   * @private
   * @param {Number} degress  北を0度とした角度 (時計回りを正)
   * @return {Number} 西を0度とした角度 (0 <= θ <= 360)
   */
  _convertDegress(degress) {
    degress += 90
    return degress <= 360 ? degress : degress - 360
  }

  /**
   * positionsで受け取った同心円座標群の各座標を後処理のためにJSON化
   * @private
   * @param {Array.<Array.<Array>>} positions 同心円座標（not中心点）
   * @return {Array.<Object>} JSON化された同心円座標
   */
  _createGeoJson(positions) {
    const retJson = {
      type: 'FeatureCollection',
      features: []
    }
    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions[i].length; j++) {
        if (this._clipLineId && this._clipLineId === j) {
          continue
        }
        const polygon = []
        if (i !== positions.length - 1 && j !== positions[i].length - 1) {
          polygon.push([
            positions[i][j],
            positions[i][j + 1],
            positions[i + 1][j + 1],
            positions[i + 1][j],
            positions[i][j]
          ])
          const polygonId = retJson.features.length
          const feature = this._createPolygonFeature(polygonId, j, i, polygon)
          retJson.features.push(feature)
        }
      }
    }
    return retJson
  }

  /**
   * positionsで受け取った同心円座標群の各座標を後処理のためにJSON化
   * @private
   * @param {Number} id 同心円状のある矩形の通し番号（not中心点）
   * @param {Number} lineId 中心点からの見通し方向の線の通し番号（not中心点）
   * @param {Number} circleId 同心円の通し番号（not中心点）
   * @param {Number} polygon 同心円状のある矩形座標（not中心点）
   * @return {Array.<Object>} JSON化された同心円を構成するポリゴン情報
   */
  _createPolygonFeature(id, lineId, circleId, polygon) {
    return {
      type: 'Feature',
      id: id,
      properties: {
        line_id: lineId,
        circle_id: circleId,
        id: id,
        polyID: id
      },
      geometry: {
        type: 'Polygon',
        coordinates: polygon
      }
    }
  }

  /**
   * geoJsonで受け取ったポリゴンの重心を計算して、それぞれのproperties.centroidに入れる
   * @private
   * @param {Array.<Object>} geoJson JSON化された同心円を構成するポリゴン情報
   */
  _calcCentroid(geoJson) {
    for (let i = 0; i < geoJson.features.length; i++) {
      const centroid = geoCentroid({
        type: 'Polygon',
        coordinates: geoJson.features[i].geometry.coordinates
      })
      // propertyに centroidの座標を追加
      geoJson.features[i].properties.centroid = [
        this._roundFloat(centroid[0], 10),
        this._roundFloat(centroid[1], 10)
      ]
    }
  }

  /**
   * xで渡された数値をprecision桁目で四捨五入して、その値を返す
   * @private
   * @param {Number} x 対象の数値
   * @param {Number} precision 何桁目で四捨五入するか
   * @return {Number} precision桁目で四捨五入されたx
   */
  _roundFloat(x, precision) {
    precision = Math.pow(10, precision)
    return Math.round(x * precision) / precision
  }

  /**
   * geoJsonで指定されたポリゴン情報に、Cesiumの機能で取得した標高情報を設定する
   * @private
   * @param {Array.<Object>} geoJson JSON化された同心円を構成するポリゴン情報
   * @param {Array.<Cesium.Cartographic>} cartographicArray sampleTerrainの戻り値
   */
  _setElevations(geoJson, cartographicArray) {
    for (let i = 0; i < cartographicArray.length; i++) {
      geoJson.features[i].properties.elevation = cartographicArray[i].height
    }
  }

  /**
   * geoJsonで指定されたポリゴン情報から見通し方向ごとにポリゴンを取り出して見通し領域解析を行い、ポリゴンごとに見通し可・不可を設定する
   * @private
   * @param {Array.<Object>} geoJson JSON化された同心円を構成するポリゴン情報
   */
  _setVisibility(geoJson) {
    const jsonPropertyHashGroupByLineId = this._getJsonPropertyHashGroupByLineId(
      geoJson
    )
    for (let i = 0; i < jsonPropertyHashGroupByLineId.length; i++) {
      const values = jsonPropertyHashGroupByLineId[i].values
      for (let j = 0; j < values.length; j++) {
        const polygonID = values[j].id
        const elevationsToTarget = values
          .filter((v, idx) => idx <= j)
          .map(value => value.elevation)
        this._setVisible(
          polygonID,
          this._analyseVisibility(elevationsToTarget),
          geoJson
        )
      }
    }
  }

  /**
   * geoJsonで指定されたポリゴン情報を見通し方向線にグループ化して返す
   * @private
   * @param {Array.<Object>} geoJson JSON化された同心円を構成するポリゴン情報
   * @return {Array.<Object>} keyをline_idにした見通し方向でグルーピングしたポリゴン配列
   */
  _getJsonPropertyHashGroupByLineId(geoJson) {
    const properties = geoJson.features.map(feature => feature.properties)
    return nest()
      .key(polygon => polygon.line_id)
      .entries(properties)
  }

  /**
   * ある座標（elevations[0]）から見て、elevations[1]からelevations[n]までの点が見通し可能かどうか判定して返す
   * @private
   * @param {Array.<Number>} elevations 見通し方向の標高配列
   * @return {Boolean} 見通し可・不可
   */
  _analyseVisibility(elevations) {
    if (elevations.length === 1) {
      return true
    }
    const slopeOfSite =
      (elevations[elevations.length - 1] - elevations[0]) / elevations.length
    // 中心座標からの指定標高までの傾き
    const eyeHeight = this._params.eyeHeight || 2.0
    for (let i = 1; i < elevations.length; i++) {
      if (elevations[0] + eyeHeight + slopeOfSite * (i + 1) < elevations[i]) {
        return false // 見通し不可
      }
    }
    return true // 見通し可
  }

  /**
   * geoJsonのidで示されるfeatureに見通し可・不可を設定する
   * @private
   * @param {Number} id 座標id
   * @param {Boolean} visible 見通し可・不可
   * @param {Array.<Object>} geoJson JSON化された同心円を構成するポリゴン情報
   */
  _setVisible(id, visible, geoJson) {
    geoJson.features[id].properties.visible = visible ? 1 : 0
  }

  /**
   * 同刻みライン上の可視領域のポリゴンを結合する
   * @private
   * @param {Array.<Object>} geoJson JSON化された同心円を構成するポリゴン情報
   * @return {Array.<Object>} 同刻みライン上で結合された可視領域のポリゴンのみを含むgeoJson
   */
  _reducePolygon(geoJson) {
    const retJson = Object.assign({}, geoJson)
    retJson.features = []
    const featureGroupByLine = nest()
      .key(feature => feature.properties.line_id)
      .entries(geoJson.features)

    for (let i = 0; i < featureGroupByLine.length; i++) {
      const features = featureGroupByLine[i].values
      let newfeature = null
      for (let j = 0; j < features.length; j++) {
        const feature = features[j]
        if (!newfeature && feature.properties.visible === 1) {
          newfeature = Object.assign({}, feature)
          continue
        }
        if (!newfeature && feature.properties.visible === 0) {
          continue
        }
        if (feature.properties.visible === 1) {
          // ポリゴンを結合する
          newfeature.geometry.coordinates[0][2] =
            feature.geometry.coordinates[0][2]
          newfeature.geometry.coordinates[0][3] =
            feature.geometry.coordinates[0][3]
        } else {
          retJson.features.push(newfeature)
          newfeature = null
        }
      }
      if (newfeature) {
        retJson.features.push(newfeature)
      }
    }
    return retJson
  }

  /**
   * 見通し領域解析結果を表示しない領域のポリゴンを切り取る
   * @private
   * @param {Array.<Object>} geoJson
   * @param {Number} radialResolution 見通し方向の解像度(刻み)[m]
   * @param {Number} [params.radialRangeMin=0] 解析対象距離レンジ_見通し開始距離[m] 50kmを上限値とする
   * @return {Array.<Object>}
   */
  _clipCircle(geoJson, radialResolution, radialRangeMin) {
    const retJson = Object.assign({}, geoJson)
    radialRangeMin = radialRangeMin || 0
    const stepStart = radialRangeMin / radialResolution
    retJson.features = retJson.features.filter(
      f => f.properties.circle_id >= stepStart
    )
    return retJson
  }
}
