import { isFunction } from "@my-vue/shared"

export function emit(instance, eventName, ...args) {
  const props = instance.vnode.props
  const handleName = `on${eventName[0].toUpperCase()}${eventName.slice(1)}`
  console.log(handleName, "handleName")

  const handler = props[handleName]
  handler && handler(...args)
  // if (handler && isFunction(handler)) {
  //   handler.call(instance, ...args)
  // }
}
