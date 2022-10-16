import { getCurrentInstance } from "."

export const useSlots = () => getContext().slots
export const useAttrs = () => getContext().attrs

// getContext 获取 setup 的第二个参数
export function getContext() {
  const i = getCurrentInstance()
  return i.setupContext
}
