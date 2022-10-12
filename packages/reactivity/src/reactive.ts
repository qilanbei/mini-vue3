import { isObject } from "@my-vue/shared"
import { baseHandler } from "./baseHandlers"

export const enum Reactive_FLAGS {
  IS_REACTIVE = "_v_isReactive", //用来标识当前值是否已经被reactive过
}

export const isReactive = (v) => v && v[Reactive_FLAGS.IS_REACTIVE]

export const toReactive = (v) => (isObject(v) ? reactive(v) : v)

const proxyMap = new WeakMap()

export function reactive(value) {
  // 不是对象直接返回
  if (!isObject(value)) {
    return value
  }
  // 已经被 reactive 代理过的数据会被缓存起来,再次用 reactive 代理时会返回缓存的数据
  // 如果已经被代理过，无需重复代理
  const existingProxy = proxyMap.get(value)
  if (existingProxy) {
    return existingProxy
  }
  // 如果是代理对象会返回之前的代理对象
  // 技巧：由于进行了 value["_v_isReactive"] 的操作，会触发get方法，
  // 在get方法中， 将 value[_v_isReactive] 设置为true，作为经过get，做过收集的标识
  // 所以这里判断，是 就就证明进行过get操作 已经收集过了，就可以直接返回了
  if (value[Reactive_FLAGS.IS_REACTIVE]) {
    return value
  }
  // Proxy 的 handler 拦截属性

  const proxy = new Proxy(value, baseHandler)
  proxyMap.set(value, proxy)
  return proxy
}
