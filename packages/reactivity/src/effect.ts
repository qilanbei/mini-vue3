/*
 * @Description: effect 源码实现
 * @Author: your name
 * @Date: 2022-08-23 19:27:06
 * @LastEditors: your name
 * @LastEditTime: 2022-10-12 21:23:15
 */
// 收集绑定 value fn effect WeakMap() => obj: Map[set:{targetValue:activeEffect},set]
export let activeEffect
export function effect(fn, options) {
  // 劫持函数执行，记录指针activeEffect
  const effect = new ReactiveEffect(fn, options)
  // 上来先执行一次
  effect.run()
  // 外界自定义调用的时候，需要返回runner，bind this 为 当前 effect
  const runner = effect.run.bind(effect)
  runner.effect = effect // 并把 effect 也暴露出去，方便使用
  return runner
}
// effect 结构为：
function cleanUpEffect(effect) {
  // deps set集合 清理之前收集到的effect
  const deps = effect.deps
  if (deps.length > 0) {
    for (let i = 0; i < deps.length; i++) {
      // console.log("proxyMap", proxyMap)
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}
export class ReactiveEffect {
  public parent // 需要记录父亲是谁
  public active = true // 当前是否是激活状态 当reactive().stop()的时候 active 为 false, 不再代理
  public deps = [] // 用来清理依赖的
  constructor(public fn, public options?) {}
  run() {
    if (!this.active) {
      return this.fn()
    } else {
      try {
        this.parent = activeEffect
        activeEffect = this

        cleanUpEffect(this)
        return this.fn()
      } finally {
        activeEffect = this.parent
        this.parent = undefined
      }
    }
  }
}
// WeakMap结构: {target(obj): depsMap{key: Set[effect1,effect2]}}}
const proxyMap = new WeakMap() // 收集到的map

export function track(target, key) {
  if (!activeEffect) return

  let depsMap = proxyMap.get(target)
  // 判断 depsMap 没有的话，设置空的map
  if (!depsMap) {
    proxyMap.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  // 判断 dep 没有的话，设置空的set
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  console.log("track", key, deps)
  trackEffect(deps)
}

export function trackEffect(deps) {
  if (activeEffect) {
    // 添加当前 activeEffect
    deps.add(activeEffect)
    // 同步给全局的 activeEffect deps 最后好用来清理
    activeEffect.deps.push(deps)
  }
}

export function trigger(target, key, value, oldValue) {
  // 就是需要 拿到 track 中的 deps 然后 run
  const depsMap = proxyMap.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  triggerEffect(effects)
}

export function triggerEffect(effects) {
  if (effects) {
    // 拷贝一份effect，解决clear run 的死循环问题
    effects = [...new Set(effects)]
    effects.forEach((effect) => {
      // 判断一下，以防止，同一个 key 重复执行同一个 effect
      // TODO: 这里 effect 为什么能判断相等 set[]
      if (effect !== activeEffect) {
        if (effect.options?.scheduler) {
          effect.options.scheduler()
        } else {
          effect.run()
        }
      }
    })
  }
}
