/*
 * @Description: 比对自定义属性
 * @Author: your name
 * @Date: 2022-09-19 01:03:24
 * @LastEditors: your name
 * @LastEditTime: 2022-10-12 21:26:23
 */

export const patchAttr = (el, key, value) => {
  if (value == null) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
