/*
 * @Description:
 * @Author: your name
 * @Date: 2022-08-25 20:09:37
 * @LastEditors: your name
 * @LastEditTime: 2022-10-12 21:23:11
 */
import { isObject } from "@my-vue/shared"
import { track, trigger } from "./effect"
import { reactive, Reactive_FLAGS } from "./reactive"

export const baseHandler = {
  // 拦截对象属性的读取
  get(target, key, receiver) {
    if (key === Reactive_FLAGS.IS_REACTIVE) {
      return true
    }
    const res = Reflect.get(target, key, receiver)
    // 用来收集绑定当前的 key 以及执行的当前fn
    track(target, key)
    // reactive 深度代理是懒代理的(读取到是一个对象时，触发 get 才会进行代理)
    if (res && isObject(res)) {
      return reactive(res)
    }
    return res
  },
  // 拦截对象属性的设置
  set(target, key, value, receiver) {
    const oldValue = target[key]
    // 同 get 里面的 Reflect 设置 value，Reflect.set 返回一个 boolean 值
    const res = Reflect.set(target, key, value, receiver)
    // 新老值 不相等 才需要set
    // 使用 Object.is 避免 NaN !== NaN
    if (!Object.is(oldValue, value)) {
      trigger(target, key, value, oldValue)
    }
    return res
  },
}
