import { hasOwn } from "@my-vue/shared"
import { nextTick } from "./scheduler"

export const publicPropertiesMap = {
  $attrs: (i) => i.attrs,
  $props: (i) => i.props,
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
  $data: (i) => i.data,
  $nextTick: () => nextTick,
}

export const PublicComponentProxyHandlers = {
  get(instance, key) {
    const { data, props, setupState } = instance
    if (hasOwn(setupState, key)) {
      return setupState[key]
    }
    if (hasOwn(data, key)) {
      return data[key]
    }
    if (hasOwn(props, key)) {
      return props[key]
    }
    const publicGetter = publicPropertiesMap[key]

    if (publicGetter) return publicGetter(instance)
  },
  set(instance, key, value) {
    const { data, props, setupState } = instance
    if (hasOwn(setupState, key)) {
      setupState[key] = value
      return true
    }
    if (hasOwn(data, key)) {
      data[key] = value
      return true
    }
    if (hasOwn(props, key)) {
      console.warn("props is readonly")
      return false
    }
  },
}
