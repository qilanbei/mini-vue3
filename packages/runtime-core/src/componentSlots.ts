import { ShapeFlags } from "@my-vue/shared"

export function initSlots(instance, slots) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = slots
  }
}
