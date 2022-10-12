/*
 * @Description: 共用方法
 * @Author: your name
 * @Date: 2022-08-22 19:26:35
 * @LastEditors: your name
 * @LastEditTime: 2022-10-12 20:20:02
 */
/**
 * 判断对象
 */
export const isObject = (value) => {
  return typeof value === "object" && value !== null
}
/**
 * 判断两个值 是否相等
 */
export const hasChanged = (value, oldValue) => !Object.is(value, oldValue)
/**
 * 判断函数
 */
export const isFunction = (value) => {
  return typeof value === "function"
}
/**
 * 判断字符串
 */
export const isString = (value) => {
  return typeof value === "string"
}
/**
 * 判断数字
 */
export const isNumber = (value) => {
  return typeof value === "number"
}
/**
 * 判断数组
 */
export const isArray = Array.isArray
/**
 * 判断是事件函数：例如 onClick
 */
const onRE = /on[^a-z]/
export const isOn = (key: string) => onRE.test(key)

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (obj, key) => hasOwnProperty.call(obj, key)

export const isOwn = () => {}

export const enum ShapeFlags {
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
