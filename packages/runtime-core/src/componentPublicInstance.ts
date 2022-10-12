import { hasOwn } from "@my-vue/shared"

export const publicPropertiesMap = {
  $attrs: (i) => i.attrs,
  $props: (i) => i.props,
  $data: (i) => i.data,
}

export const PublicComponentProxyHandlers = {
  get(instance, key) {
    const { data, props } = instance
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
    const { data, props } = instance
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
