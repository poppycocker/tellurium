import Observable from 'ol/observable'

export default class Base extends Observable {
  constructor(olMap) {
    super()
    this._olMap = olMap
    this._interactions = []
    this._isActive = false
  }
  activate() {
    if (this._isActive) {
      return
    }
    this._interactions.forEach(interaction => this._olMap.addInteraction(interaction))
    this._isActive = true
  }
  deactivate() {
    if (!this._isActive) {
      return
    }
    this._interactions.forEach(interaction => this._olMap.removeInteraction(interaction))
    this._isActive = false
  }
  _generateInteractions() {
    console.error('ui_components/base#_generateInteractions is abstract method.')
  }
}
