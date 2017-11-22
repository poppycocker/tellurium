import Draw from 'ol/interaction/draw'
import GeometryType from 'ol/geom/geometrytype'
import GeomPoint from 'ol/geom/point'
import GeomLineString from 'ol/geom/linestring'
import GeomPolygon from 'ol/geom/polygon'
import Feature from 'ol/feature'
import Style from 'ol/style/style'
import CircleStyle from 'ol/style/circle'
import FillStyle from 'ol/style/fill'

/**
 * @classdesc
 * 描画中の形状点削除に対応したDrawInteraction<br>
 * based on OL 3.10.1
 * @constructor
 * @extends {ol.interaction.Draw}
 * @fires ol.interaction.DrawEvent
 * @param {olx.interaction.DrawOptions} options Options.
 */
export default class DeletableDraw extends Draw {
  constructor(options) {
    super(options)
    /**
     * Sketch edit point.
     * @type {ol.Feature}
     * @private
     */
    this.sketchEditPoint_ = null
  }

  /**
 * Determine if an event is within the snapping tolerance of the start coord.
 * @param {ol.MapBrowserEvent} event Event.
 * @return {boolean} The event is within the snapping tolerance of the start.
 * @private
 */
  atFinish_(event) {
    let at = false
    if (this.sketchFeature_) {
      let potentiallyDone = false
      let potentiallyFinishCoordinates = [this.finishCoordinate_]
      if (this.mode_ === GeometryType.LINE_STRING) {
        potentiallyDone = this.sketchCoords_.length > this.minPoints_
        // ここを追加
        potentiallyFinishCoordinates = [
          this.sketchCoords_[this.sketchCoords_.length - 2]
        ]
      } else if (this.mode_ === GeometryType.POLYGON) {
        potentiallyDone = this.sketchCoords_[0].length > this.minPoints_
        potentiallyFinishCoordinates = [
          this.sketchCoords_[0][0],
          this.sketchCoords_[0][this.sketchCoords_[0].length - 2]
        ]
      }
      if (potentiallyDone) {
        const map = event.map
        for (let i = 0, ii = potentiallyFinishCoordinates.length; i < ii; i++) {
          const finishCoordinate = potentiallyFinishCoordinates[i]
          const finishPixel = map.getPixelFromCoordinate(finishCoordinate)
          const pixel = event.pixel
          const dx = pixel[0] - finishPixel[0]
          const dy = pixel[1] - finishPixel[1]
          const freehand = this.freehand_ && this.freehandCondition_(event)
          const snapTolerance = freehand ? 1 : this.snapTolerance_
          at = Math.sqrt(dx * dx + dy * dy) <= snapTolerance
          if (at) {
            this.finishCoordinate_ = finishCoordinate
            break
          }
        }
      }
    }
    return at
  }

  atPoint_(event) {
    // console.log("atPoint_method.");
    let at = false
    let idx = -1
    let coordinates = null
    if (this.mode_ === GeometryType.POLYGON) {
      coordinates = this.sketchCoords_[0]
    } else if (this.mode_ === GeometryType.LINE_STRING) {
      coordinates = this.sketchCoords_
    } else {
      return idx
    }
    const map = event.map
    for (let i = 0, ii = coordinates.length; i < ii; i++) {
      const coordinate = coordinates[i]
      const coordinatePixel = map.getPixelFromCoordinate(coordinate)
      const pixel = event.pixel
      const dx = pixel[0] - coordinatePixel[0]
      const dy = pixel[1] - coordinatePixel[1]
      const freehand = this.freehand_ && this.freehandCondition_(event)
      const snapTolerance = freehand ? 1 : this.snapTolerance_
      at = Math.sqrt(dx * dx + dy * dy) <= snapTolerance
      if (at) {
        idx = i
        // マッチしたら、ブレーク
        break
      }
    }
    return idx
  }

  /**
 * @param editCoordinate Coordinate.
 * @private
 */
  createOrUpdateEditSketchPoint_(editCoordinate) {
    if (!editCoordinate) {
      this.sketchEditPoint_ = null
      return
    }

    if (null == this.sketchEditPoint_) {
      this.sketchEditPoint_ = new Feature(new GeomPoint(editCoordinate))
      this.sketchEditPoint_.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 10,
            fill: new FillStyle({
              color: '#ff0000'
            })
          })
        })
      )
    } else {
      const sketchPointGeom = this.sketchEditPoint_.getGeometry()
      // console.log("sketchPointGeom");
      sketchPointGeom.setCoordinates(editCoordinate)
    }
  }

  /**
 * Modify the drawing.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
  modifyDrawing_(event) {
    let coordinate = event.coordinate
    const geometry = this.sketchFeature_.getGeometry()
    let coordinates
    let last
    let editCoordinate
    let idx
    if (this.mode_ === GeometryType.POINT) {
      last = this.sketchCoords_
    } else if (this.mode_ === GeometryType.POLYGON) {
      coordinates = this.sketchCoords_[0]
      last = coordinates[coordinates.length - 1]
      if (this.atFinish_(event)) {
        // snap to finish
        coordinate = this.finishCoordinate_.slice()
      }

      idx = this.atPoint_(event)
      if (
        -1 !== idx &&
        0 !== idx &&
        idx !== coordinates.length - 1 &&
        idx !== coordinates.length - 2
      ) {
        editCoordinate = coordinates[idx].slice()
      }
    } else {
      coordinates = this.sketchCoords_
      last = coordinates[coordinates.length - 1]
      // linestringの場合に
      idx = this.atPoint_(event)
      if (
        -1 !== idx &&
        idx !== coordinates.length - 1 &&
        idx !== coordinates.length - 2
      ) {
        editCoordinate = coordinates[idx].slice()
      }
    }
    last[0] = coordinate[0]
    last[1] = coordinate[1]
    this.geometryFunction_(this.sketchCoords_, geometry)
    if (this.sketchPoint_) {
      const sketchPointGeom = this.sketchPoint_.getGeometry()
      // console.log("sketchPointGeom");
      sketchPointGeom.setCoordinates(coordinate)
    }

    this.createOrUpdateEditSketchPoint_(editCoordinate)

    let sketchLineGeom
    if (
      geometry instanceof GeomPolygon &&
      this.mode_ !== GeometryType.POLYGON
    ) {
      if (!this.sketchLine_) {
        this.sketchLine_ = new Feature(new GeomLineString(null))
      }
      const ring = geometry.getLinearRing(0)
      sketchLineGeom = this.sketchLine_.getGeometry()
      sketchLineGeom.setFlatCoordinates(
        ring.getLayout(),
        ring.getFlatCoordinates()
      )
    } else if (this.sketchLineCoords_) {
      sketchLineGeom = this.sketchLine_.getGeometry()
      sketchLineGeom.setCoordinates(this.sketchLineCoords_)
    }
    this.updateSketchFeatures_()
  }

  /**
 * Add a new coordinate to the drawing.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
  addToDrawing_(event) {
    const coordinate = event.coordinate
    const geometry = this.sketchFeature_.getGeometry()
    let done = false
    let coordinates = null
    let idx = 0
    if (this.mode_ === GeometryType.LINE_STRING) {
      this.finishCoordinate_ = coordinate.slice()
      coordinates = this.sketchCoords_
      // add or remove チェック
      idx = this.atPoint_(event)
      if (
        -1 === idx ||
        idx === coordinates.length - 1 ||
        idx === coordinates.length - 2
      ) {
        coordinates.push(coordinate.slice())
        done = coordinates.length > this.maxPoints_
      } else {
        coordinates.splice(idx, 1)
      }

      this.geometryFunction_(coordinates, geometry)
    } else if (this.mode_ === GeometryType.POLYGON) {
      coordinates = this.sketchCoords_[0]
      // add or remove チェック
      idx = this.atPoint_(event)
      if (
        -1 === idx ||
        0 === idx ||
        idx === coordinates.length - 1 ||
        idx === coordinates.length - 2
      ) {
        coordinates.push(coordinate.slice())
        done = coordinates.length > this.maxPoints_
        if (done) {
          this.finishCoordinate_ = coordinates[0]
        }
      } else {
        coordinates.splice(idx, 1)
      }
      this.geometryFunction_(this.sketchCoords_, geometry)
    }
    this.updateSketchFeatures_()
    if (done) {
      this.finishDrawing()
    }
  }

  /**
 * Stop drawing without adding the sketch feature to the target layer.
 * @return {ol.Feature} The sketch feature (or null if none).
 * @private
 */
  abortDrawing_() {
    this.finishCoordinate_ = null
    const sketchFeature = this.sketchFeature_
    if (sketchFeature) {
      this.sketchFeature_ = null
      this.sketchPoint_ = null
      this.sketchEditPoint_ = null
      this.sketchLine_ = null
      this.overlay_.getSource().clear(true)
    }
    return sketchFeature
  }

  /**
 * Redraw the sketch features.
 * @private
 */
  updateSketchFeatures_() {
    const sketchFeatures = []
    if (this.sketchFeature_) {
      sketchFeatures.push(this.sketchFeature_)
    }
    if (this.sketchLine_) {
      sketchFeatures.push(this.sketchLine_)
    }
    if (this.sketchPoint_) {
      sketchFeatures.push(this.sketchPoint_)
    }
    if (this.sketchEditPoint_) {
      sketchFeatures.push(this.sketchEditPoint_)
    }
    const overlaySource = this.overlay_.getSource()
    overlaySource.clear(true)
    overlaySource.addFeatures(sketchFeatures)
  }
}
