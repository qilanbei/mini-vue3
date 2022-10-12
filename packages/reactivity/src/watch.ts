import { isFunction, isObject } from "@my-vue/shared"
import { ReactiveEffect } from "./effect"

const initVal = {}
export function watch(source, cb, options) {
  const { immediate } = options || {}
  // 处理source
  let getter = () => {}
  if (isObject(source)) {
    // 考虑到 source 是一个对象的话，里面的值发生改变也需要收集，所以遍历一遍，按个收集一下
    getter = () => traverse(source)
  } else if (isFunction(source)) {
    getter = source
  }
  let oldValue = initVal
  const job = () => {
    const newValue = effect.run()
    // oldValue 如果 重新设置成一个原来的值，oldValue 为 undefined
    cb(newValue, oldValue === initVal ? undefined : oldValue)
    oldValue = newValue
  }
  let effect = new ReactiveEffect(getter, {
    scheduler: job,
  })
  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  }
}
/* 考虑到循环引用的问题：
  var o = {a: 1} o.a = o
  seen Set结构保存遍历过的值
*/
function traverse(obj, seen = new Set()) {
  if (!isObject(obj)) return obj
  if (seen.has(obj)) return obj
  seen.add(obj)
  for (const k in obj) {
    traverse(obj[k], seen)
  }
  return obj
}
