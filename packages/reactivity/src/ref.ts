import { hasChanged } from "@my-vue/shared"
import { trackEffect, triggerEffect } from "./effect"
import { isReactive, toReactive } from "./reactive"

export function ref(value) {
  if (isRef(value)) return value
  return new RefImpl(value)
}

class RefImpl {
  public _rawValue // 用来存储原值
  public __v_isRef = true // ref标识，用来判断是否是ref变量
  public deps // deps 作为收集使用
  public _value
  constructor(value) {
    this._rawValue = value // 记录原值
    this._value = toReactive(value) // 为了处理如果value为复杂类型数据，转为reactive处理
  }
  get value() {
    trackEffect(this.deps || (this.deps = new Set()))
    return this._value
  }
  set value(newVal) {
    // 有变化才触发更新
    if (hasChanged(this._rawValue, newVal)) {
      this._rawValue = newVal
      // 设置的值 也要是响应式的，所以也需要toReactive处理一下
      this._value = toReactive(newVal)
      triggerEffect(this.deps)
    }
  }
}

export function isRef(v) {
  return !!(v && v.__v_isRef === true)
}

export function unref(v) {
  return isRef(v) ? v.value : v
}

export function toRef(target, key, defaultValue?) {
  if (isRef(target)) return target
  return new ObjectRefImpl(target, key, defaultValue)
}

class ObjectRefImpl {
  public __v_isRef = true
  constructor(public _object, public _key, public _defaultValue) {
    this._object = _object
    this._key = _key
    this._defaultValue = _defaultValue
  }
  get value() {
    const r = this._object[this._key]
    return r === undefined ? this._defaultValue : r
  }
  set value(newVal) {
    this._object[this._key] = newVal
  }
}

export function toRefs(target) {
  let result = {}
  if (!isReactive(target)) return target
  for (const key in target) {
    result[key] = toRef(target, key)
  }
  return result
}

export function customRef(fn) {
  return new CustomRefImpl(fn)
}

class CustomRefImpl {
  public __v_isRef = true
  public dep
  public _get
  public _set
  constructor(public factory) {
    // const { get, set } = factory(trackEffect, triggerEffect)
    // 考虑要把trackEffect， triggerEffect 和 dep 传进去
    const { get, set } = factory(
      () => trackEffect(this.dep || (this.dep = new Set())),
      () => triggerEffect(this.dep || (this.dep = new Set()))
    )
    this._get = get
    this._set = set
  }
  get value() {
    return this._get()
  }
  set value(newVal) {
    this._set(newVal)
  }
}
