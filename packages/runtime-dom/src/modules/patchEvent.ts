/*
 * @Description: 事件比对
 * @Author: your name
 * @Date: 2022-09-19 01:03:24
 * @LastEditors: your name
 * @LastEditTime: 2022-10-12 21:28:29
 */
export function patchEvent(el, key, oldHandler, newHandler) {
  // if (!key) return
  const invokers = el.vei || (el.vei = {}) // vue event invoker
  const existingInvoker = invokers[key]
  if (existingInvoker && newHandler) {
    // 更新
    invokers.value = newHandler
  } else {
    const eventName = key.slice(2).toLowerCase()
    if (newHandler) {
      // 新增
      const invoker = (invokers[key] = createInvoker(newHandler))
      // 增加事件绑定
      el.addEventListener(eventName, invoker)
    } else if (existingInvoker) {
      // 卸载
      el.removeEventListener(eventName, existingInvoker) // 事件始终绑定在event，所以将event卸载即可
      invokers[key] = undefined
    }
  }
}

function createInvoker(handler) {
  const invoker = (event) => {
    invoker.value(event)
  }
  invoker.value = handler
  return invoker
}
