import Tellurium, { ol } from 'tellurium'
import markers from '@/assets/markers'

const TelluriumUtil = {
  generateOlStyle: styleProps => {
    let stroke = null
    let fill = null
    let text = null
    let image = null
    // let zIndex = null
    if (
      styleProps.strokeWidth ||
      styleProps.strokeColor ||
      styleProps.lineDash
    ) {
      stroke = new ol.style.Stroke({
        color: styleProps.strokeColor,
        width: styleProps.strokeWidth,
        lineDash: styleProps.lineDash
      })
    }
    if (styleProps.fillColor) {
      fill = new ol.style.Fill({
        color: styleProps.fillColor
      })
    }
    if (styleProps.imageSrc) {
      image = new ol.style.Icon({
        src: styleProps.imageSrc,
        scale: styleProps.imageScale || 1.0,
        opacity: styleProps.imageOpacity || 1.0,
        rotation: styleProps.imageRotation
          ? styleProps.imageRotation * Math.PI / 180
          : 0,
        rotateWithView: !!styleProps.imageRotateWithView
      })
    }
    if (
      styleProps.text ||
      styleProps.font ||
      styleProps.textAlign ||
      styleProps.textBaseline
    ) {
      text = new ol.style.Text({
        textAlign: styleProps.textAlign,
        textBaseline: styleProps.textBaseline,
        font: styleProps.font,
        text: styleProps.text,
        stroke: new ol.style.Stroke({
          color: styleProps.fontStrokeColor,
          width: styleProps.fontStrokeWidth
        }),
        fill: new ol.style.Fill({
          color: styleProps.fontFillColor
        })
      })
    }
    const olStyle = new ol.style.Style({
      stroke,
      fill,
      image,
      text
      // zIndex
    })

    return olStyle
  },
  generateStyleProps(olStyle) {
    const stroke = olStyle.getStroke()
    const fill = olStyle.getFill()
    const image = olStyle.getImage()
    const text = olStyle.getText()
    const props = {}
    if (stroke) {
      props.strokeWidth = stroke.getWidth()
      props.strokeColor = stroke.getColor()
      props.lineDash = stroke.getLineDash()
    }
    if (fill) {
      props.fillColor = fill.getColor()
    }
    if (image) {
      props.imageSrc = image.getSrc()
      props.imageScale = image.getScale()
      props.imageOpacity = image.getOpacity()
      props.imageRotation = image.getRotation() * 180 / Math.PI
      props.imageRotateWithView = image.getRotateWithView()
    }
    if (text) {
      props.text = text.getText()
      props.font = text.getFont()
      props.textAlign = text.getTextAlign()
      props.textBaseline = text.getTextBaseline()
      const textFill = text.getFill()
      if (textFill) {
        props.fontFillColor = textFill.getColor()
      }
      const textStroke = text.getStroke()
      if (textStroke) {
        props.fontStrokeColor = textStroke.getColor()
        props.fontStrokeWidth = textStroke.getWidth()
      }
    }
    return props
    // return Object.assign(TelluriumUtil.defaultStyleProps, props)
  },
  defaultStyleProps: {
    strokeWidth: 3,
    strokeColor: '#409eff',
    lineDash: null,
    fillColor: '#ffffff',
    imageSrc: markers[0],
    imageScale: 1.0,
    imageOpacity: 1.0,
    imageRotation: 0,
    imageRotateWithView: false,
    text: 'tellurium.js',
    font: 'normal 18px Meiryo',
    fontFillColor: '#333333',
    fontStrokeColor: '#ffffff',
    fontStrokeWidth: 3,
    textAlign: 'center',
    textBaseline: 'bottom'
  },
  defaultLineStringStyleProps() {
    return TelluriumUtil.filterObj(TelluriumUtil.defaultStyleProps, [
      'strokeWidth',
      'strokeColor',
      'lineDash',
      'arrow'
    ])
  },
  defaultPolygonLikeStyleProps() {
    return TelluriumUtil.filterObj(TelluriumUtil.defaultStyleProps, [
      'strokeWidth',
      'strokeColor',
      'fillColor'
    ])
  },
  defaultPointStyleProps() {
    return TelluriumUtil.filterObj(TelluriumUtil.defaultStyleProps, [
      'imageSrc',
      'imageScale',
      'imageOpacity',
      'imageRotation',
      'imageRotateWithView',
      'text',
      'font',
      'fontFillColor',
      'fontStrokeColor',
      'fontStrokeWidth',
      'textAlign',
      'textBaseline'
    ])
  },
  filterObj(target, props) {
    const ret = {}
    props.forEach(prop => {
      ret[prop] = target[prop]
    })
    return ret
  },
  to4326(coord3857) {
    return Tellurium.to4326(coord3857)
  },
  to3857(coord4326) {
    return Tellurium.to3857(coord4326)
  }
}

export default TelluriumUtil
