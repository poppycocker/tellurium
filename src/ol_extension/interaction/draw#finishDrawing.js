;(function() {
  var original = ol.interaction.Draw.prototype.finishDrawing
  var getExtentSize = function(extent) {
    if (!extent) {
      return 0
    }
    var size = ol.extent.getSize(extent)
    return size[0] * size[1]
  }
  /**
   * サイズ0の図形を弾くコードを挿入
   * @private
   */
  ol.interaction.Draw.prototype.finishDrawing = function() {
    var sketchFeature = this.sketchFeature_
    var geometry = sketchFeature.getGeometry()
    var extent = geometry.getExtent ? geometry.getExtent() : null
    if (this.mode_ === ol.interaction.DrawMode.POINT) {
      original.call(this)
      return
    }
    if (getExtentSize(extent) === 0) {
      this.abortDrawing_()
      return
    }
    original.call(this)
  }
}.call(this))
