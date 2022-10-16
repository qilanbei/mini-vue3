import {
  isArray,
  isNumber,
  isObject,
  isString,
  ShapeFlags,
} from "@my-vue/shared"

export const Text = Symbol("text")
export const Fragment = Symbol("fragment")

export const createVNode = (type, props, children = null) => {
  // 初始化 ShapeFlags 标识自己 为 element 类型
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0

  const vnode = {
    __v_isVNode: true,
    type,
    key: props?.key ?? null, // 标识唯一性
    props,
    el: null, // 标记vnode的真实dom节点是那个
    children,
    shapeFlag, // 标记自己和孩子是什么类型的
  }

  if (children) {
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
      type = ShapeFlags.SLOTS_CHILDREN
    } else {
      type = ShapeFlags.TEXT_CHILDREN
      children = String(children)
    }
    vnode.shapeFlag |= type
  }

  return vnode
}

export const normalizeVNode = (child) => {
  if (isString(child) || isNumber(child)) {
    return createVNode(Text, null, String(child))
  }
  return child
}

export const isSameVNodeType = (n1, n2) => {
  return n1.type === n2.type && n1.key === n2.key
}

export const isVNode = (v) => v && v.__v_isVNode
