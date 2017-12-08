import Tellurium, { ol } from 'tellurium'
import pinStart from '@/assets/markers/circle-stroked-15.svg'
import pinGoal from '@/assets/markers/square-15.svg'
import pinVia from '@/assets/markers/triangle-stroked-15.svg'
import pinPoi from '@/assets/markers/marker-15.svg'

const generatePinFeat = () => {
  return new ol.Feature(new ol.geom.Point(Tellurium.to3857([0, 0])))
}
const setPinStyle = (feat, pin, scale) => {
  feat.setStyle(
    new ol.style.Style({
      image: new ol.style.Icon({
        src: pin,
        scale: scale
      })
    })
  )
}
const pins = {
  pinPoi: generatePinFeat(),
  pinStart: generatePinFeat(),
  pinGoal: generatePinFeat(),
  pinVia: generatePinFeat()
}
setPinStyle(pins.pinPoi, pinPoi, 2.0)
setPinStyle(pins.pinStart, pinStart, 2.0)
setPinStyle(pins.pinGoal, pinGoal, 2.0)
setPinStyle(pins.pinVia, pinVia, 1.0)

export default pins
