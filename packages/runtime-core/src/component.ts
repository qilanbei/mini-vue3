import { isFunction } from "@my-vue/shared"
import { proxyRefs } from "."
import { emit } from "./componentEmits"
import { initProps } from "./componentProps"
import { PublicComponentProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

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
    setupState: {}, // setup函数返回的是对象，那就是对象的数据
    setupContext: null,
    emit: null, // emit 分发事件函数
    slots: {}, // 组件插槽
    bm: null, // beforeMount
    m: null, // mount
    bu: null, // beforeUpdate
    u: null, // update
  }

  instance.ctx = { _: instance }
  instance.emit = emit.bind(null, instance)
  return instance
}

export function setUpComponent(instance) {
  const { props, children } = instance.vnode
  // 分离 props  和  attrs
  initProps(instance, props)
  initSlots(instance, children)

  // 做访问数据的 代理处理
  instance.proxy = new Proxy(instance, PublicComponentProxyHandlers)

  const { setup, render } = instance.type
  if (setup) {
    const setupContext = (instance.setupContext = createSetupContext(instance))
    setCurrentInstance(instance)
    const setupResult = setup(instance.props, setupContext)
    setCurrentInstance(null)
    if (isFunction(setupResult)) {
      // setup 使用时候：setup(props, {emit, slots,attrs,expose})
      instance.render = setupResult
    } else {
      instance.setupState = proxyRefs(setupResult)
      // proxyRefs 帮助我们在定义了 ref数据之后 在render 函数中直接this.value 调用
      // proxyRefs 内部自动帮助我们解绑
    }
  }
  if (!instance.render) {
    if (isFunction(render)) {
      instance.render = render
    } else {
      // if 源码中还有 template 模板 render 判断
    }
  }

  if (!instance.render) {
    instance.render = () => {}
  }
}

function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    emit: instance.emit,
    slots: instance.slots,
  }
}

export let currentInstance
export const getCurrentInstance = () => currentInstance
export const setCurrentInstance = (i) => (currentInstance = i)
export const enum LifecycleHooks {
  BEFORE_MOUNT = "bm", // beforeMount
  MOUNTED = "m", // mounted
  BEFORE_UPDATE = "bu", // beforeUpdate
  UPDATED = "u", // updated
}
