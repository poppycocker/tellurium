export default {
  mouseRight: mapBrowserEvent => {
    // マウスのボタンがホイールがない場合、ボタンの値が変わる可能性があるかも
    return (
      mapBrowserEvent.pointerEvent.pointerId === 1 &&
      mapBrowserEvent.pointerEvent.button === 2
    )
  },
  mouseWheelDrag: mapBrowserEvent => {
    // マウスのボタンがホイールがない場合、ボタンの値が変わる可能性があるかも
    return (
      mapBrowserEvent.pointerEvent.pointerId === 1 &&
      mapBrowserEvent.pointerEvent.button === 1
    )
  }
}
