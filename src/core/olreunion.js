/*
var buildApiNameSpaceTree = current => {
  const ret = {}
  Object.keys(current).forEach(v => {
    if (v.match(/^[a-z].+/)) {
      if (typeof current[v] === 'object') {
        // namespace
        ret[v] = buildApiNameSpaceTree(current[v], v)
      }
    } else {
      // class name
      ret[v] = null
    }
  })
  return Object.keys(ret).length > 0 ? ret : null
}
JSON.stringify(buildApiNameSpaceTree(ol))
*/

const apiNameSpace = {
  Attribution: null,
  CanvasMap: null,
  Collection: null,
  color: null,
  colorlike: null,
  control: {
    Attribution: null,
    Control: null,
    FullScreen: null,
    MousePosition: null,
    OverviewMap: null,
    Rotate: null,
    ScaleLine: null,
    Zoom: null,
    ZoomSlider: null,
    ZoomToExtent: null
  },
  coordinate: null,
  DeviceOrientation: null,
  easing: null,
  extent: null,
  Feature: null,
  featureloader: null,
  Geolocation: null,
  Graticule: null,
  has: {
    DEVICE_PIXEL_RATIO: null,
    CANVAS: null,
    DEVICE_ORIENTATION: null,
    GEOLOCATION: null,
    TOUCH: null,
    WEBGL: null
  },
  interaction: {
    DoubleClickZoom: null,
    DragAndDrop: null,
    DragBox: null,
    DragPan: null,
    DragRotate: null,
    DragRotateAndZoom: null,
    DragZoom: null,
    Draw: null,
    Extent: null,
    Interaction: null,
    KeyboardPan: null,
    KeyboardZoom: null,
    Modify: null,
    MouseWheelZoom: null,
    PinchRotate: null,
    PinchZoom: null,
    Pointer: null,
    Select: null,
    Snap: null,
    Translate: null
  },
  Kinetic: null,
  loadingstrategy: null,
  Map: null,
  Object: null,
  Observable: null,
  Overlay: null,
  PluggableMap: null,
  proj: { METERS_PER_UNIT: null, common: null, Projection: null, Units: null },
  render: { VectorContext: null },
  size: null,
  Sphere: null,
  tilegrid: { TileGrid: null, WMTS: null },
  View: null,
  xml: null,
  style: {
    AtlasManager: null,
    Circle: null,
    Fill: null,
    Icon: null,
    Image: null,
    RegularShape: null,
    Stroke: null,
    Style: null,
    Text: null
  },
  source: {
    BingMaps: null,
    CartoDB: null,
    Cluster: null,
    Image: null,
    ImageArcGISRest: null,
    ImageCanvas: null,
    ImageMapGuide: null,
    ImageStatic: null,
    ImageVector: null,
    ImageWMS: null,
    OSM: null,
    Raster: null,
    Source: null,
    Stamen: null,
    Tile: null,
    TileArcGISRest: null,
    TileDebug: null,
    TileImage: null,
    TileJSON: null,
    TileUTFGrid: null,
    TileWMS: null,
    Vector: null,
    VectorTile: null,
    WMTS: null,
    XYZ: null,
    Zoomify: null
  },
  renderer: {
    webgl: { ImageLayer: null, Map: null, TileLayer: null, VectorLayer: null },
    canvas: {
      ImageLayer: null,
      Map: null,
      TileLayer: null,
      VectorLayer: null,
      VectorTileLayer: null
    }
  },
  layer: {
    Base: null,
    Group: null,
    Heatmap: null,
    Image: null,
    Layer: null,
    Tile: null,
    Vector: null,
    VectorTile: null
  },
  geom: {
    Circle: null,
    Geometry: null,
    GeometryCollection: null,
    LinearRing: null,
    LineString: null,
    MultiLineString: null,
    MultiPoint: null,
    MultiPolygon: null,
    Point: null,
    Polygon: null,
    SimpleGeometry: null
  },
  format: {
    EsriJSON: null,
    Feature: null,
    filter: {
      And: null,
      Bbox: null,
      Comparison: null,
      ComparisonBinary: null,
      During: null,
      EqualTo: null,
      Filter: null,
      GreaterThan: null,
      GreaterThanOrEqualTo: null,
      Intersects: null,
      IsBetween: null,
      IsLike: null,
      IsNull: null,
      LessThan: null,
      LessThanOrEqualTo: null,
      Not: null,
      NotEqualTo: null,
      Or: null,
      Spatial: null,
      Within: null
    },
    GeoJSON: null,
    GML: null,
    GML2: null,
    GML3: null,
    GPX: null,
    IGC: null,
    KML: null,
    MVT: null,
    OSMXML: null,
    Polyline: null,
    TopoJSON: null,
    WFS: null,
    WKT: null,
    WMSCapabilities: null,
    WMSGetFeatureInfo: null,
    WMTSCapabilities: null
  },
  events: { condition: null }
}

// todo dynamic requiring
const ol = apiNameSpace

export default ol
