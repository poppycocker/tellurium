import OLCesium from 'olcs/olcesium'
import olMap from 'ol/map'

class Tellurium {
  constructor() {
    this._config = null
  }
  init(config) {
    this._config = config
    this._olcs = new OLCesium({})
  }
}

export default () => {
  return new Tellurium()
}
