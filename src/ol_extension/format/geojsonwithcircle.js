import FormatGeoJSON from 'ol/format/geojson'
import FormatFeature from 'ol/format/feature'
import GeomPolygon from 'ol/geom/polygon'
import olObj from 'ol/obj'

export default class FormatGeoJSONWithCircle extends FormatGeoJSON {
  /**
   * Encode a feature as a GeoJSON Feature object.
   *
   * @override
   * @param {ol.Feature} feature Feature.
   * @param {olx.format.WriteOptions=} opt_options Write options.
   * @return {GeoJSONFeature} Object.
   * @override
   * @api
   */
  writeFeatureObject(feature, opt_options) {
    opt_options = this.adaptOptions(opt_options)

    const object = /** @type {GeoJSONFeature} */ ({
      type: 'Feature'
    })
    const id = feature.getId()
    if (id !== undefined) {
      object.id = id
    }
    const geometry = feature.getGeometry()
    if (geometry) {
      object.geometry = this.writeGeometry_(geometry, opt_options)
    } else {
      object.geometry = null
    }
    const properties = feature.getProperties()
    delete properties[feature.getGeometryName()]
    if (!olObj.isEmpty(properties)) {
      object.properties = properties
    } else {
      object.properties = null
    }
    return object
  }
  /**
   * @param {ol.geom.Geometry} geometry Geometry.
   * @param {olx.format.WriteOptions=} opt_options Write options.
   * @private
   * @return {GeoJSONGeometry|GeoJSONGeometryCollection} GeoJSON geometry.
   */
  writeGeometry_(geometry, opt_options) {
    const geometryWriter =
      FormatGeoJSONWithCircle.GEOMETRY_WRITERS_[geometry.getType()]
    return geometryWriter(
      /** @type {ol.geom.Geometry} */ (FormatFeature.transformWithOptions(
        geometry,
        true,
        opt_options
      )),
      opt_options
    )
  }
}

// Circleに対してEmptyGeometryを返す関数を置換
FormatGeoJSONWithCircle.GEOMETRY_WRITERS_ = Object.assign(
  {},
  FormatGeoJSON.GEOMETRY_WRITERS_,
  {
    Circle: (geometry, opt_options) => {
      const polygonized = GeomPolygon.fromCircle(geometry)
      return FormatGeoJSON.GEOMETRY_WRITERS_.Polygon(
        polygonized,
        opt_options
      )
    }
  }
)
