/*
 * @Description: computed 实现
 * @Author: your name
 * @Date: 2022-08-28 18:26:45
 * @LastEditors: your name
 * @LastEditTime: 2022-08-28 19:36:21
 */

import { isFunction } from "@my-vue/shared"
import { ReactiveEffect, trackEffect, triggerEffect } from "./effect"

/*
  computed特性：
    1. 缓存功能
    2. 一上来没有调用的情况下，不会触发
*/
export function computed(getterOrOptions) {
  // 如果是fun，说明getterOrOptions是一个getter，否则是 options: {get, set}
  const isOnlyGetter = isFunction(getterOrOptions)
  let getter
  let setter
  if (isOnlyGetter) {
    getter = getterOrOptions
    setter = () => {}
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedImpl(getter, setter)
}
// 传入一个 getter 函数，返回一个默认不可手动修改的 ref 对象。
// 或者传入一个拥有 get 和 set 函数的对象，创建一个可手动修改的计算状态。
class ComputedImpl {
  public __v_isRef = true // 标识是一个 ref
  public _effect
  public _dirty = true // 此变量控制getter函数是否被缓存
  public _value
  public deps // 定义自己的收集桶
  constructor(public getter, public setter) {
    // 基于 ReactiveEffect 利用 之前实现的 自定义调度 scheduler 用来处理缓存 _dirty
    this._effect = new ReactiveEffect(getter, {
      scheduler: () => {
        /* 关键点1：_dirty 不是脏的 我才会执行 effect，这个 effect 哪里找
           当外边调用 computedName.value 的时候，触发get, get trackEffect 收集到了 deps
           所以 triggerEffect 的时候 要执行的就是 ReactiveEffect 里面的deps，也就是this.deps
           关键点2： this._dirty false 的时候 说明外界进行调用了，触发了get 才将 _dirty 置为 false
           computed有调用，说明需要 trigger run 了
        */
        if (!this._dirty) {
          this._dirty = true
          triggerEffect(this.deps)
        }
      },
    })
  }
  // 定义 get set 方法
  get value() {
    // track deps
    trackEffect(this.deps || (this.deps = new Set()))
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
  set value(val) {
    // 执行外界的 setter
    this.setter(val)
  }
}
