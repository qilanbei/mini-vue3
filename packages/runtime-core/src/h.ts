/*
   h 函数的各种使用：
   h('div', { id: 'foo' })
*/

import { isArray, isObject } from "@my-vue/shared"
import { createVNode, isVNode } from "./vnode"

export function h (type, propsOrChildren, children) {
  
  // 2 个参数，那就是 propsOrChildren 为 string 或者 object 或者 数组 的时候
  // 如果是 object 那就是单个虚拟dom的节点 也就是 createVNode [propsOrChildren]
  // 大于三个参数 就需要将后面的参数合并成数组，作为children参数
  // 等于三个参数 判断 children 是否是vnode，是的话 createVNode [children]
  const l = arguments.length
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 判断 propsOrChildren 是否是 vnode
      if (isVNode(propsOrChildren)) {
        // h('div', h('span', 'hello')) 
        return createVNode(type, null, [propsOrChildren]) 
      }
      // h('div', { style:{color: 'red' }, innerHTML: 'hello' })
      return createVNode(type, propsOrChildren)
    }
    // h('div', ['hello1', h('span', 'hello2')])
    // const vnode = h('div', 'hello word')
    return createVNode(type, null, propsOrChildren)
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVNode(children)) {
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}