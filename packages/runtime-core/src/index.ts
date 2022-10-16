export {
  ref,
  unref,
  isRef,
  customRef,
  reactive,
  computed,
  watch,
  effect,
  toRef,
  toRefs,
  proxyRefs,
} from "@my-vue/reactivity"

export { h } from "./h"

export { createVNode, isVNode, isSameVNodeType, Text, Fragment } from "./vnode"

export { nextTick } from "./scheduler"
export { getCurrentInstance } from "./component"

export { useSlots, useAttrs } from "./apiSetupHelpers"

export {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdate,
} from "./apiLifecycle"
