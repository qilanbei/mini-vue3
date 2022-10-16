import { reactive } from "@my-vue/reactivity"
import { hasOwn } from "@my-vue/shared"

export function initProps(instance, rawProps) {
  let props = {}
  let attrs = {}
  // 拿到外层的 props 和 组件本身的props
  const vnodeProps = instance.vnode.props
  const componentProps = instance.type.props

  // console.log(vnodeProps, "vnode props")
  // console.log(componentProps, "componentProps")

  if (rawProps) {
    for (const key in rawProps) {
      if (hasOwn(componentProps, key)) {
        props[key] = rawProps[key]
      } else {
        attrs[key] = rawProps[key]
      }
    }
  }
  // 一般 props 父组件传递的 props 更新，子组件也需要更新，所以需要响应式
  instance.props = reactive(props)
  // 而 attrs 一般外层定义之后，基本不改变，只做透传
  instance.attrs = attrs
}

export const updateProps = (prevProps, nextProps) => {
  // console.log("updateProps")
  if (prevProps) {
    for (const key in prevProps) {
      if (hasOwn(nextProps, key)) {
        // console.log(333)

        prevProps[key] = nextProps[key]
        // updateComponent 更新的时候  调用了 update 方法 会创建一个 new ReactiveEffect
        // 由于 prevProps 是响应式的，这里赋值 会触发 effectFn（也就是updateComponentFn）吗 ??
        // 解答（废弃）：key 收集的所有 effect 会被这样 收集到 WeakMap结构: {target(obj): depsMap{key: Set[effect1,effect2]}}}
        // 因为 set 结构 会帮助去重，发现再次收集到的  是同一个 effect 就不会再收集

        // TODO：赋值后 再次run的时候 cleanUpEffect 掉了 effect，
        // 当要执行 trackEffect 的时候，获取不到的set里的 effect，就不会在执行 effectFn （也就是updateComponentFn）了
      } else {
        delete prevProps[key]
      }
    }
  }
}
