import { initProps } from "./componentProps"
import { PublicComponentProxyHandlers } from "./componentPublicInstance"

let uid = 0

export function createComponentInstance(vnode) {
  const instance = {
    uid: uid++, // 组件唯一标识
    data: {},
    props: {},
    attrs: {},
    ctx: {}, // 组件上下文
    subTree: {}, // 组件内部render函数返回的 vnode
    vnode, // h(component) 创建出来的组件本身的虚拟节点
    type: vnode.type, // 组件对象
    effect: null, // 组件的effect
    update: null, // 组件更新的fn
    isMounted: false, // 组件是否挂载
  }

  instance.ctx = { _: instance }

  return instance
}

export function setUpComponent(instance) {
  const { props } = instance.vnode
  // 分离 props  和  attrs
  initProps(instance, props)

  // 做访问数据的 代理处理
  instance.proxy = new Proxy(instance, PublicComponentProxyHandlers)
}
