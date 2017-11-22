/**
 * 操作モードの定義
 * @const
 * @typedef {object} Tellurium.availableMode
 * @prop {String} VIEW_2DMAP 2D地図表示・操作
 * @prop {String} VIEW_3DMAP 3D地形表示・操作
 * @prop {String} PICK_FEATURE フィーチャー選択
 * @prop {String} MEASURE_DISTANCE 距離計測
 * @prop {String} DESIGNATE_RECT 矩形範囲指定
 * @prop {String} DRAW_POLYLINE ポリライン描画
 * @prop {String} DRAW_POLYLINE_FREEHAND ポリライン描画(フリーハンド)
 * @prop {String} DRAW_SQUARE 矩形(正方形)描画
 * @prop {String} DRAW_RECTANGLE 矩形(長方形)描画
 * @prop {String} DRAW_POLYGON ポリゴン(多角形)描画
 * @prop {String} DRAW_CIRCLE サークル(正円)描画
 * @prop {String} DRAW_ELLIPSE サークル(楕円)描画
 * @prop {String} DRAW_LABEL ラベル描画
 * @prop {String} DRAW_ICON アイコン描画
 * @prop {String} GENERATE_ARC 円弧生成
 * @api stable
 */
const availableMode = {
  VIEW_2DMAP: 'view_2dmap',
  VIEW_3DMAP: 'view_3dmap',
  PICK_FEATURE: 'pick_feature',
  MEASURE_DISTANCE: 'measure_distance',
  DESIGNATE_RECT: 'designate_rect',
  DRAW_POLYLINE: 'draw_polyline',
  DRAW_POLYLINE_FREEHAND: 'draw_polyline_freehand',
  DRAW_SQUARE: 'draw_square',
  DRAW_RECTANGLE: 'draw_rectangle',
  DRAW_POLYGON: 'draw_polygon',
  DRAW_CIRCLE: 'draw_circle',
  DRAW_ELLIPSE: 'draw_ellipse',
  DRAW_LABEL: 'draw_label',
  DRAW_ICON: 'draw_icon',
  GENERATE_ARC: 'generate_arc'
}

availableMode.isDrawing = mode => {
  const m = availableMode
  switch (mode) {
    case m.DRAW_POLYLINE:
    case m.DRAW_POLYLINE_FREEHAND:
    case m.DRAW_SQUARE:
    case m.DRAW_RECTANGLE:
    case m.DRAW_POLYGON:
    case m.DRAW_CIRCLE:
    case m.DRAW_ELLIPSE:
    case m.DRAW_LABEL:
    case m.DRAW_ICON:
      return true
  }
  return false
}

export default availableMode
