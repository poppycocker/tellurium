import ImageStyle from 'ol/style/image'
import ImageState from 'ol/imagestate'
import rendercanvas from 'ol/render/canvas'
import color from 'ol/color'
import has from 'ol/has'
import Util from '@@/util'

const nullFunction = () => {}

/**
 * @classdesc
 * Set regular shape style for vector features. The resulting shape will be
 * a regular polygon when `radius` is provided, or a star when `radius1` and
 * `radius2` are provided.
 * @constructor
 * @private
 * @param {olx.style.RegularShapeOptions} options Options.
 * @extends {ol.style.Image}
 * @implements {ol.structs.IHasChecksum}
 */
export default class ArrowShape extends ImageStyle {
  constructor(options) {
    /**
     * @type {boolean}
     */
    const snapToPixel =
      options.snapToPixel !== undefined ? options.snapToPixel : true
    super({
      opacity: 1,
      rotateWithView: !!options.rotateWithView,
      rotation: options.rotation !== undefined ? options.rotation : 0,
      scale: 1,
      snapToPixel: snapToPixel
    })

    /**
     * @private
     * @type {Array.<string>}
     */
    this.checksums_ = null
    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = null
    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.hitDetectionCanvas_ = null
    /**
     * @private
     * @type {ol.style.Fill}
     */
    this.fill_ = options.fill !== undefined ? options.fill : null
    /**
     * @private
     * @type {Array.<number>}
     */
    this.origin_ = [0, 0]
    /**
     * @private
     * @type {number}
     */
    this.points_ = options.points
    /**
     * @private
     * @type {number}
     */
    this.radius_ =
      /** @type {number} */ (options.radius !== undefined
        ? options.radius
        : options.radius1)
    /**
     * @private
     * @type {number}
     */
    this.radius2_ =
      options.radius2 !== undefined ? options.radius2 : this.radius_
    /**
     * @private
     * @type {number}
     */
    this.angle_ = options.angle !== undefined ? options.angle : 0
    /**
     * @private
     * @type {ol.style.Stroke}
     */
    this.stroke_ = options.stroke !== undefined ? options.stroke : null
    /**
     * @private
     * @type {Array.<number>}
     */
    this.anchor_ = null
    /**
     * @private
     * @type {ol.Size}
     */
    this.size_ = null
    /**
     * @private
     * @type {ol.Size}
     */
    this.imageSize_ = null
    /**
     * @private
     * @type {ol.Size}
     */
    this.hitDetectionImageSize_ = null
    this.render_(options.atlasManager)
  }

  /**
   * @inheritDoc
   */
  getAnchor() {
    return this.anchor_
  }

  /**
   * Get the angle used in generating the shape.
   * @return {number} Shape's rotation in radians.
   */
  getAngle() {
    return this.angle_
  }

  /**
   * Get the fill style for the shape.
   * @return {ol.style.Fill} Fill style.
   */
  getFill() {
    return this.fill_
  }

  /**
   * @inheritDoc
   */
  getHitDetectionImage(pixelRatio) {
    return this.hitDetectionCanvas_
  }

  /**
   * @inheritDoc
   */
  getImage(pixelRatio) {
    return this.canvas_
  }

  /**
   * @inheritDoc
   */
  getImageSize() {
    return this.imageSize_
  }

  /**
   * @inheritDoc
   */
  getHitDetectionImageSize() {
    return this.hitDetectionImageSize_
  }

  /**
   * @inheritDoc
   */
  getImageState() {
    return ImageState.LOADED
  }

  /**
   * @inheritDoc
   */
  getOrigin() {
    return this.origin_
  }

  /**
   * Get the number of points for generating the shape.
   * @return {number} Number of points for stars and regular polygons.
   */
  getPoints() {
    return this.points_
  }

  /**
   * Get the (primary) radius for the shape.
   * @return {number} Radius.
   */
  getRadius() {
    return this.radius_
  }

  /**
   * Get the secondary radius for the shape.
   * @return {number} Radius2.
   */
  getRadius2() {
    return this.radius2_
  }

  /**
   * @inheritDoc
   */
  getSize() {
    return this.size_
  }

  /**
   * Get the stroke style for the shape.
   * @return {ol.style.Stroke} Stroke style.
   */
  getStroke() {
    return this.stroke_
  }

  /**
   * @private
   * @param {ol.style.AtlasManager|undefined} atlasManager
   */
  render_(atlasManager) {
    let imageSize = 0
    let lineCap = ''
    let lineJoin = ''
    let miterLimit = 0
    let lineDash = null
    let strokeStyle = null
    let strokeWidth = 0

    if (this.stroke_) {
      strokeStyle = color.asString(this.stroke_.getColor())
      strokeWidth = this.stroke_.getWidth()
      if (strokeWidth === undefined) {
        strokeWidth = rendercanvas.defaultLineWidth
      }
      lineDash = this.stroke_.getLineDash()
      if (!has.CANVAS_LINE_DASH) {
        lineDash = null
      }
      lineJoin = this.stroke_.getLineJoin()
      if (lineJoin === undefined) {
        lineJoin = rendercanvas.defaultLineJoin
      }
      lineCap = this.stroke_.getLineCap()
      if (lineCap === undefined) {
        lineCap = rendercanvas.defaultLineCap
      }
      miterLimit = this.stroke_.getMiterLimit()
      if (miterLimit === undefined) {
        miterLimit = rendercanvas.defaultMiterLimit
      }
    }

    let size = 2 * (this.radius_ + strokeWidth) + 1

    /** @type {ol.style.ArrowShape.RenderOptions} */
    const renderOptions = {
      strokeStyle: strokeStyle,
      strokeWidth: strokeWidth,
      size: size,
      lineCap: lineCap,
      lineDash: lineDash,
      lineJoin: lineJoin,
      miterLimit: miterLimit
    }

    if (atlasManager === undefined) {
      // no atlas manager is used, create a new canvas
      this.canvas_ = document.createElement('canvas')
      this.canvas_.height = size
      this.canvas_.width = size
      // canvas.width and height are rounded to the closest integer
      size = this.canvas_.width
      imageSize = size

      const context = this.canvas_.getContext('2d')
      this.draw_(renderOptions, context, 0, 0)

      this.createHitDetectionCanvas_(renderOptions)
    } else {
      // an atlas manager is used, add the symbol to an atlas
      size = Math.round(size)

      const hasCustomHitDetectionImage = !this.fill_
      let renderHitDetectionCallback = null
      if (hasCustomHitDetectionImage) {
        // render the hit-detection image into a separate atlas image
        renderHitDetectionCallback = Util.googbind(
          this.drawHitDetectionCanvas_,
          this,
          renderOptions
        )
      }
      const id = this.getChecksum()
      const info = atlasManager.add(
        id,
        size,
        size,
        Util.googbind(this.draw_, this, renderOptions),
        renderHitDetectionCallback
      )

      this.canvas_ = info.image
      this.origin_ = [info.offsetX, info.offsetY]
      imageSize = info.image.width

      if (hasCustomHitDetectionImage) {
        this.hitDetectionCanvas_ = info.hitImage
        this.hitDetectionImageSize_ = [
          info.hitImage.width,
          info.hitImage.height
        ]
      } else {
        this.hitDetectionCanvas_ = this.canvas_
        this.hitDetectionImageSize_ = [imageSize, imageSize]
      }
    }

    this.anchor_ = [size / 2, size / 2]
    this.size_ = [size, size]
    this.imageSize_ = [imageSize, imageSize]
  }

  /**
   * @private
   * @param {ol.style.ArrowShape.RenderOptions} renderOptions
   * @param {CanvasRenderingContext2D} context
   * @param {number} x The origin for the symbol (x).
   * @param {number} y The origin for the symbol (y).
   */
  draw_(renderOptions, context, x, y) {
    // reset transform
    context.setTransform(1, 0, 0, 1, 0, 0)
    // then move to (x, y)
    context.translate(x, y)
    context.beginPath()
    if (this.radius2_ !== this.radius_) {
      this.points_ = 2 * this.points_
    }
    const radiusC = this.radius_
    // start
    let angle0 = -1 * 2 * Math.PI / this.points_ + Math.PI / 2 + this.angle_
    context.lineTo(
      renderOptions.size / 2 + radiusC * Math.cos(angle0),
      renderOptions.size / 2 + radiusC * Math.sin(angle0)
    )
    // mid
    angle0 = 0 * 2 * Math.PI / this.points_ + Math.PI / 2 + this.angle_
    context.lineTo(renderOptions.size / 2, renderOptions.size / 2)
    // end
    angle0 = 1 * 2 * Math.PI / this.points_ + Math.PI / 2 + this.angle_
    context.lineTo(
      renderOptions.size / 2 + radiusC * Math.cos(angle0),
      renderOptions.size / 2 + radiusC * Math.sin(angle0)
    )
    if (this.fill_) {
      context.fillStyle = color.asString(this.fill_.getColor())
      context.fill()
    }
    if (this.stroke_) {
      context.strokeStyle = renderOptions.strokeStyle
      context.lineWidth = renderOptions.strokeWidth
      if (renderOptions.lineDash) {
        context.setLineDash(renderOptions.lineDash)
      }
      context.lineCap = renderOptions.lineCap
      context.lineJoin = renderOptions.lineJoin
      context.miterLimit = renderOptions.miterLimit
      context.stroke()
    }
    context.closePath()
  }

  /**
   * @private
   * @param {ol.style.ArrowShape.RenderOptions} renderOptions
   */
  createHitDetectionCanvas_(renderOptions) {
    this.hitDetectionImageSize_ = [renderOptions.size, renderOptions.size]
    if (this.fill_) {
      this.hitDetectionCanvas_ = this.canvas_
      return
    }
    // if no fill style is set, create an extra hit-detection image with a
    // default fill style
    this.hitDetectionCanvas_ = document.createElement('canvas')
    const canvas = this.hitDetectionCanvas_
    canvas.height = renderOptions.size
    canvas.width = renderOptions.size
    const context = canvas.getContext('2d')
    this.drawHitDetectionCanvas_(renderOptions, context, 0, 0)
  }

  /**
   * @private
   * @param {ol.style.ArrowShape.RenderOptions} renderOptions
   * @param {CanvasRenderingContext2D} context
   * @param {number} x The origin for the symbol (x).
   * @param {number} y The origin for the symbol (y).
   */
  drawHitDetectionCanvas_(renderOptions, context, x, y) {
    // reset transform
    context.setTransform(1, 0, 0, 1, 0, 0)
    // then move to (x, y)
    context.translate(x, y)
    context.beginPath()
    if (this.radius2_ !== this.radius_) {
      this.points_ = 2 * this.points_
    }
    const radiusC = this.radius_
    // start
    let angle0 = -1 * 2 * Math.PI / this.points_ + Math.PI / 2 + this.angle_
    context.lineTo(
      renderOptions.size / 2 + radiusC * Math.cos(angle0),
      renderOptions.size / 2 + radiusC * Math.sin(angle0)
    )
    // mid
    angle0 = 0 * 2 * Math.PI / this.points_ + Math.PI / 2 + this.angle_
    context.lineTo(renderOptions.size / 2, renderOptions.size / 2)
    // end
    angle0 = 1 * 2 * Math.PI / this.points_ + Math.PI / 2 + this.angle_
    context.lineTo(
      renderOptions.size / 2 + radiusC * Math.cos(angle0),
      renderOptions.size / 2 + radiusC * Math.sin(angle0)
    )
    context.fillStyle = rendercanvas.defaultFillStyle
    context.fill()
    if (this.stroke_) {
      context.strokeStyle = renderOptions.strokeStyle
      context.lineWidth = renderOptions.strokeWidth
      if (renderOptions.lineDash) {
        context.setLineDash(renderOptions.lineDash)
      }
      context.stroke()
    }
    context.closePath()
  }

  /**
   * @inheritDoc
   */
  getChecksum() {
    const strokeChecksum = this.stroke_ ? this.stroke_.getChecksum() : '-'
    const fillChecksum = this.fill_ ? this.fill_.getChecksum() : '-'
    const recalculate =
      !this.checksums_ ||
      (strokeChecksum !== this.checksums_[1] ||
        fillChecksum !== this.checksums_[2] ||
        this.radius_ !== this.checksums_[3] ||
        this.radius2_ !== this.checksums_[4] ||
        this.angle_ !== this.checksums_[5] ||
        this.points_ !== this.checksums_[6])

    if (recalculate) {
      const checksum =
        'r' +
        strokeChecksum +
        fillChecksum +
        (this.radius_ !== undefined ? this.radius_.toString() : '-') +
        (this.radius2_ !== undefined ? this.radius2_.toString() : '-') +
        (this.angle_ !== undefined ? this.angle_.toString() : '-') +
        (this.points_ !== undefined ? this.points_.toString() : '-')
      this.checksums_ = [
        checksum,
        strokeChecksum,
        fillChecksum,
        this.radius_,
        this.radius2_,
        this.angle_,
        this.points_
      ]
    }

    return this.checksums_[0]
  }
}

/**
 * @inheritDoc
 */
ArrowShape.prototype.listenImageChange = nullFunction

/**
 * @inheritDoc
 */
ArrowShape.prototype.load = nullFunction

/**
 * @inheritDoc
 */
ArrowShape.prototype.unlistenImageChange = nullFunction

/**
 * @typedef {{
 *   strokeStyle: (string|undefined),
 *   strokeWidth: number,
 *   size: number,
 *   lineCap: string,
 *   lineDash: Array.<number>,
 *   lineJoin: string,
 *   miterLimit: number
 * }}
 */
ArrowShape.RenderOptions = null
