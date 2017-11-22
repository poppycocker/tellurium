import Event from 'ol/events/event'

/**
 * @classdesc
 * Events emitted as map browser events are instances of this type.
 * See {@link ol.Map} for which events trigger a map browser event.
 *
 * @constructor
 */
export default class FeatureDragEvent extends Event {
  constructor(type, features) {
    super(type)
    this.features = features
  }
  /**
   * Constants for event names.
   * @enum {string}
   */
  static get Types() {
    return {
      MOVESTART: 'movestart',
      MOVEEND: 'moveend'
    }
  }
}
