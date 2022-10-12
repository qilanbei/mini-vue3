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
