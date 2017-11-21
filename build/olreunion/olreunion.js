import olAttribution from 'ol/attribution'
import olCanvasMap from 'ol/canvasmap'
import olCollection from 'ol/collection'
import olcolor from 'ol/color'
import olcolorlike from 'ol/colorlike'
import olcontrolAttribution from 'ol/control/attribution'
import olcontrolControl from 'ol/control/control'
import olcontrolFullScreen from 'ol/control/fullscreen'
import olcontrolMousePosition from 'ol/control/mouseposition'
import olcontrolOverviewMap from 'ol/control/overviewmap'
import olcontrolRotate from 'ol/control/rotate'
import olcontrolScaleLine from 'ol/control/scaleline'
import olcontrolZoom from 'ol/control/zoom'
import olcontrolZoomSlider from 'ol/control/zoomslider'
import olcontrolZoomToExtent from 'ol/control/zoomtoextent'
import olcoordinate from 'ol/coordinate'
import olDeviceOrientation from 'ol/deviceorientation'
import oleasing from 'ol/easing'
import olextent from 'ol/extent'
import olFeature from 'ol/feature'
import olfeatureloader from 'ol/featureloader'
import olGeolocation from 'ol/geolocation'
import olGraticule from 'ol/graticule'
import olhas from 'ol/has'
import olinteraction from 'ol/interaction'
import olKinetic from 'ol/kinetic'
import olloadingstrategy from 'ol/loadingstrategy'
import olMap from 'ol/map'
import olObject from 'ol/object'
import olObservable from 'ol/observable'
import olOverlay from 'ol/overlay'
import olPluggableMap from 'ol/pluggablemap'
import olproj from 'ol/proj'
import olrender from 'ol/render'
import olsize from 'ol/size'
import olSphere from 'ol/sphere'
import oltilegrid from 'ol/tilegrid'
import olView from 'ol/view'
import olxml from 'ol/xml'
import olstyleAtlasManager from 'ol/style/atlasmanager'
import olstyleCircle from 'ol/style/circle'
import olstyleFill from 'ol/style/fill'
import olstyleIcon from 'ol/style/icon'
import olstyleImage from 'ol/style/image'
import olstyleRegularShape from 'ol/style/regularshape'
import olstyleStroke from 'ol/style/stroke'
import olstyleStyle from 'ol/style/style'
import olstyleText from 'ol/style/text'
import olsourceBingMaps from 'ol/source/bingmaps'
import olsourceCartoDB from 'ol/source/cartodb'
import olsourceCluster from 'ol/source/cluster'
import olsourceImage from 'ol/source/image'
import olsourceImageArcGISRest from 'ol/source/imagearcgisrest'
import olsourceImageCanvas from 'ol/source/imagecanvas'
import olsourceImageMapGuide from 'ol/source/imagemapguide'
import olsourceImageStatic from 'ol/source/imagestatic'
import olsourceImageVector from 'ol/source/imagevector'
import olsourceImageWMS from 'ol/source/imagewms'
import olsourceOSM from 'ol/source/osm'
import olsourceRaster from 'ol/source/raster'
import olsourceSource from 'ol/source/source'
import olsourceStamen from 'ol/source/stamen'
import olsourceTile from 'ol/source/tile'
import olsourceTileArcGISRest from 'ol/source/tilearcgisrest'
import olsourceTileDebug from 'ol/source/tiledebug'
import olsourceTileImage from 'ol/source/tileimage'
import olsourceTileJSON from 'ol/source/tilejson'
import olsourceTileUTFGrid from 'ol/source/tileutfgrid'
import olsourceTileWMS from 'ol/source/tilewms'
import olsourceVector from 'ol/source/vector'
import olsourceVectorTile from 'ol/source/vectortile'
import olsourceWMTS from 'ol/source/wmts'
import olsourceXYZ from 'ol/source/xyz'
import olsourceZoomify from 'ol/source/zoomify'
import olrendererwebglImageLayer from 'ol/renderer/webgl/imagelayer'
import olrendererwebglMap from 'ol/renderer/webgl/map'
import olrendererwebglTileLayer from 'ol/renderer/webgl/tilelayer'
import olrendererwebglVectorLayer from 'ol/renderer/webgl/vectorlayer'
import olrenderercanvasImageLayer from 'ol/renderer/canvas/imagelayer'
import olrenderercanvasMap from 'ol/renderer/canvas/map'
import olrenderercanvasTileLayer from 'ol/renderer/canvas/tilelayer'
import olrenderercanvasVectorLayer from 'ol/renderer/canvas/vectorlayer'
import olrenderercanvasVectorTileLayer from 'ol/renderer/canvas/vectortilelayer'
import ollayerBase from 'ol/layer/base'
import ollayerGroup from 'ol/layer/group'
import ollayerHeatmap from 'ol/layer/heatmap'
import ollayerImage from 'ol/layer/image'
import ollayerLayer from 'ol/layer/layer'
import ollayerTile from 'ol/layer/tile'
import ollayerVector from 'ol/layer/vector'
import ollayerVectorTile from 'ol/layer/vectortile'
import olgeomCircle from 'ol/geom/circle'
import olgeomGeometry from 'ol/geom/geometry'
import olgeomGeometryCollection from 'ol/geom/geometrycollection'
import olgeomLinearRing from 'ol/geom/linearring'
import olgeomLineString from 'ol/geom/linestring'
import olgeomMultiLineString from 'ol/geom/multilinestring'
import olgeomMultiPoint from 'ol/geom/multipoint'
import olgeomMultiPolygon from 'ol/geom/multipolygon'
import olgeomPoint from 'ol/geom/point'
import olgeomPolygon from 'ol/geom/polygon'
import olgeomSimpleGeometry from 'ol/geom/simplegeometry'
import olformatEsriJSON from 'ol/format/esrijson'
import olformatFeature from 'ol/format/feature'
import olformatfilter from 'ol/format/filter'
import olformatGeoJSON from 'ol/format/geojson'
import olformatGML from 'ol/format/gml'
import olformatGML2 from 'ol/format/gml2'
import olformatGML3 from 'ol/format/gml3'
import olformatGPX from 'ol/format/gpx'
import olformatIGC from 'ol/format/igc'
import olformatKML from 'ol/format/kml'
import olformatMVT from 'ol/format/mvt'
import olformatOSMXML from 'ol/format/osmxml'
import olformatPolyline from 'ol/format/polyline'
import olformatTopoJSON from 'ol/format/topojson'
import olformatWFS from 'ol/format/wfs'
import olformatWKT from 'ol/format/wkt'
import olformatWMSCapabilities from 'ol/format/wmscapabilities'
import olformatWMSGetFeatureInfo from 'ol/format/wmsgetfeatureinfo'
import olformatWMTSCapabilities from 'ol/format/wmtscapabilities'
import oleventscondition from 'ol/events/condition'

import olOrg from 'ol/index'
const ol = Object.assign({}, olOrg)

ol.control = {}
ol.style = {}
ol.source = {}
ol.renderer = {}
ol.renderer.webgl = {}
ol.renderer.canvas = {}
ol.layer = {}
ol.geom = {}
ol.format = {}
ol.events = {}

// both namespace and module: merge module to namespace
import olcontrol__ from 'ol/control'
Object.assign(ol.control, olcontrol__)
// for ol.control.defaults
import olcontrolDefaults from 'ol/control'
Object.assign(ol.control, olcontrolDefaults)

ol.Attribution = olAttribution
ol.CanvasMap = olCanvasMap
ol.Collection = olCollection
ol.color = olcolor
ol.colorlike = olcolorlike
ol.control.Attribution = olcontrolAttribution
ol.control.Control = olcontrolControl
ol.control.FullScreen = olcontrolFullScreen
ol.control.MousePosition = olcontrolMousePosition
ol.control.OverviewMap = olcontrolOverviewMap
ol.control.Rotate = olcontrolRotate
ol.control.ScaleLine = olcontrolScaleLine
ol.control.Zoom = olcontrolZoom
ol.control.ZoomSlider = olcontrolZoomSlider
ol.control.ZoomToExtent = olcontrolZoomToExtent
ol.coordinate = olcoordinate
ol.DeviceOrientation = olDeviceOrientation
ol.easing = oleasing
ol.extent = olextent
ol.Feature = olFeature
ol.featureloader = olfeatureloader
ol.Geolocation = olGeolocation
ol.Graticule = olGraticule
ol.has = olhas
ol.interaction = olinteraction
ol.Kinetic = olKinetic
ol.loadingstrategy = olloadingstrategy
ol.Map = olMap
ol.Object = olObject
ol.Observable = olObservable
ol.Overlay = olOverlay
ol.PluggableMap = olPluggableMap
ol.proj = olproj
ol.render = olrender
ol.size = olsize
ol.Sphere = olSphere
ol.tilegrid = oltilegrid
ol.View = olView
ol.xml = olxml
ol.style.AtlasManager = olstyleAtlasManager
ol.style.Circle = olstyleCircle
ol.style.Fill = olstyleFill
ol.style.Icon = olstyleIcon
ol.style.Image = olstyleImage
ol.style.RegularShape = olstyleRegularShape
ol.style.Stroke = olstyleStroke
ol.style.Style = olstyleStyle
ol.style.Text = olstyleText
ol.source.BingMaps = olsourceBingMaps
ol.source.CartoDB = olsourceCartoDB
ol.source.Cluster = olsourceCluster
ol.source.Image = olsourceImage
ol.source.ImageArcGISRest = olsourceImageArcGISRest
ol.source.ImageCanvas = olsourceImageCanvas
ol.source.ImageMapGuide = olsourceImageMapGuide
ol.source.ImageStatic = olsourceImageStatic
ol.source.ImageVector = olsourceImageVector
ol.source.ImageWMS = olsourceImageWMS
ol.source.OSM = olsourceOSM
ol.source.Raster = olsourceRaster
ol.source.Source = olsourceSource
ol.source.Stamen = olsourceStamen
ol.source.Tile = olsourceTile
ol.source.TileArcGISRest = olsourceTileArcGISRest
ol.source.TileDebug = olsourceTileDebug
ol.source.TileImage = olsourceTileImage
ol.source.TileJSON = olsourceTileJSON
ol.source.TileUTFGrid = olsourceTileUTFGrid
ol.source.TileWMS = olsourceTileWMS
ol.source.Vector = olsourceVector
ol.source.VectorTile = olsourceVectorTile
ol.source.WMTS = olsourceWMTS
ol.source.XYZ = olsourceXYZ
ol.source.Zoomify = olsourceZoomify
ol.renderer.webgl.ImageLayer = olrendererwebglImageLayer
ol.renderer.webgl.Map = olrendererwebglMap
ol.renderer.webgl.TileLayer = olrendererwebglTileLayer
ol.renderer.webgl.VectorLayer = olrendererwebglVectorLayer
ol.renderer.canvas.ImageLayer = olrenderercanvasImageLayer
ol.renderer.canvas.Map = olrenderercanvasMap
ol.renderer.canvas.TileLayer = olrenderercanvasTileLayer
ol.renderer.canvas.VectorLayer = olrenderercanvasVectorLayer
ol.renderer.canvas.VectorTileLayer = olrenderercanvasVectorTileLayer
ol.layer.Base = ollayerBase
ol.layer.Group = ollayerGroup
ol.layer.Heatmap = ollayerHeatmap
ol.layer.Image = ollayerImage
ol.layer.Layer = ollayerLayer
ol.layer.Tile = ollayerTile
ol.layer.Vector = ollayerVector
ol.layer.VectorTile = ollayerVectorTile
ol.geom.Circle = olgeomCircle
ol.geom.Geometry = olgeomGeometry
ol.geom.GeometryCollection = olgeomGeometryCollection
ol.geom.LinearRing = olgeomLinearRing
ol.geom.LineString = olgeomLineString
ol.geom.MultiLineString = olgeomMultiLineString
ol.geom.MultiPoint = olgeomMultiPoint
ol.geom.MultiPolygon = olgeomMultiPolygon
ol.geom.Point = olgeomPoint
ol.geom.Polygon = olgeomPolygon
ol.geom.SimpleGeometry = olgeomSimpleGeometry
ol.format.EsriJSON = olformatEsriJSON
ol.format.Feature = olformatFeature
ol.format.filter = olformatfilter
ol.format.GeoJSON = olformatGeoJSON
ol.format.GML = olformatGML
ol.format.GML2 = olformatGML2
ol.format.GML3 = olformatGML3
ol.format.GPX = olformatGPX
ol.format.IGC = olformatIGC
ol.format.KML = olformatKML
ol.format.MVT = olformatMVT
ol.format.OSMXML = olformatOSMXML
ol.format.Polyline = olformatPolyline
ol.format.TopoJSON = olformatTopoJSON
ol.format.WFS = olformatWFS
ol.format.WKT = olformatWKT
ol.format.WMSCapabilities = olformatWMSCapabilities
ol.format.WMSGetFeatureInfo = olformatWMSGetFeatureInfo
ol.format.WMTSCapabilities = olformatWMTSCapabilities
ol.events.condition = oleventscondition

export default ol
