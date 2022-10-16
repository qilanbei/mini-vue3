import {
  currentInstance,
  LifecycleHooks,
  setCurrentInstance,
} from "./component"

export function injectHook(type, hook, instance) {
  const hooks = instance[type] || (instance[type] = [])
  const wrappedHook = () => {
    setCurrentInstance(instance)
    hook()
    setCurrentInstance(null)
  }
  hooks.push(wrappedHook)
}

export const createHook =
  (type) =>
  (hook, instance = currentInstance) =>
    injectHook(type, hook, instance)

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdate = createHook(LifecycleHooks.UPDATED)
