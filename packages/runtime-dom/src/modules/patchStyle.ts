/*
 * @Description: 样式比对
 * @Author: your name
 * @Date: 2022-09-19 01:03:24
 * @LastEditors: your name
 * @LastEditTime: 2022-09-19 01:07:25
 */
export const patchStyle = (el, oldStyle, newStyle) => {
  // { color: red }  { color: blue }
  const style = el.style
  // 设置新样式
  for (const key in newStyle) {
    style[key] = newStyle[key]
  }
  // 如果之前的旧样式的属性，在新样式中没有那就直接删除
  if (oldStyle) {
    for (const key in oldStyle) {
      if (!newStyle[key]) {
        style[key] = ''
      }
    }
  }
}