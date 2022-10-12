/*
 * @Description: 比对class
 * @Author: your name
 * @Date: 2022-09-19 01:03:24
 * @LastEditors: your name
 * @LastEditTime: 2022-10-12 21:26:46
 */
export const patchClass = (el, nextValue) => {
  if (!nextValue) {
    el.removeAttribute("class")
  } else {
    el.className = nextValue
  }
}
