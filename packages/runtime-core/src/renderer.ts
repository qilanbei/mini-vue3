import { reactive, ReactiveEffect } from "@my-vue/reactivity"
import { isNumber, isString } from "@my-vue/shared"
import { patchProp } from "packages/runtime-dom/src/patchProp"
import { ShapeFlags } from "packages/shared/src/shapeFlags"
import { createComponentInstance, setUpComponent } from "./component"
import { isSameVNodeType, normalizeVNode, Text, Fragment } from "./vnode"

export function createRenderer(options) {
  // default options
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = options

  // 挂载
  const mountElement = (vnode, container, anchor) => {
    const { type, shapeFlag, children, props } = vnode
    // vnode 转化为 真实 el
    const el = (vnode.el = hostCreateElement(type))

    // 判断是 text 文本 还是 array children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    hostInsert(el, container, anchor)
  }

  // 组件挂载
  const mountComponent = (vnode, container, anchor) => {
    console.log("mountComponent")

    // 创建一个组件的实例
    const instance = (vnode.component = createComponentInstance(vnode))
    // 设置对应的  props slots 等
    setUpComponent(instance)
    // 挂载组件
    setupRenderEffect(instance, container, anchor)
  }

  // 挂载 children
  const mountChildren = (children, el) => {
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] =
        isString(children[i]) || isNumber(children[i])
          ? normalizeVNode(children[i])
          : children[i])
      patch(null, child, el)
    }
  }
  const setupRenderEffect = (instance, container, anchor) => {
    const { data, render } = instance.type

    // 1、定义响应式数据 将组件的 data
    const state = (instance.data = reactive(data()))
    // 3、effectFn  只要这里面调用了响应式数据，便会触发get方法，便会收集依赖，等到有变化更新的时候 trigger，达到更新的目的
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        // 挂载
        // render 函数里面使用的this，要修改成当前的
        // render return 返回的 h 创建出来的 组件本部的虚拟节点, 也就是subTree
        // render.call 的时候 触发了 get 依赖收集
        const subTree = (instance.subTree = render.call(instance.proxy, state))

        patch(null, subTree, container, anchor)
        instance.isMounted = true
      } else {
        // 更新
        const nextTree = render.call(instance.proxy, state)
        const prevTree = instance.subTree

        patch(prevTree, nextTree, container, anchor)
        // 更新subtree
        instance.subTree = nextTree
      }
    }

    // * 每次组件的创建 都new了新的实例，所以组件颗粒度越小，就会创建更多的实例，所以组件的颗粒度并不是越小越好
    // 2、定义一个 effect componentUpdateFn 就是 effect 传入的 effectFn
    const effect = (instance.effect = new ReactiveEffect(componentUpdateFn))
    // 将组件更新方法 也挂载到组件实例上，以便其他地方调用
    const update = (instance.update = effect.run.bind(effect))
    update()
  }

  // 对比 element
  const patchElement = (n1, n2, container) => {
    // 到这里说明 n1 = n2，可以复用 n1 dom
    const el = (n2.el = n1.el)
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(oldProps, newProps, el)
    patchChildren(n1, n2, el)
  }
  /**
   * 新     旧
   * 文本   文本 ✓
   * 文本   数组  ✓
   * 文本   空  ✓
   *
   * 数组   文本  ✓
   * 数组   数组
   * 数组   空 ✓
   *
   * 空   文本  ✓
   * 空   数组 ✓
   * 空   空 不用处理
   **/
  const patchChildren = (n1, n2, el) => {
    const c1 = n1 && n1.children
    const c2 = n2 && n2.children
    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag
    //  新文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 旧数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 当前新的 shapeFlag 是文本， 旧的是 数组
        unmountChildren(c1)
      }
      // 新文本  空
      // 新文本  文本
      // 这两种直接判断 c1 c2 如果不相等 直接重置 c2 就行了
      if (c1 !== c2) {
        hostSetElementText(el, c2)
      }
    } else {
      // 旧数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // full diff
          // console.log("full diff")
          patchKeyedChildren(c1, c2, el)
        } else {
          // 旧数组  新空
          unmountChildren(c1)
        }
      } else {
        // 旧文本 新数组  旧文本  新空
        // 这种情况 直接先将 就文本 干掉
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "")
        }
        // 逻辑到这里：有可能是新数组 或者 新空，如果是新数组  mountChildren；空就不管了
        // 还包括 旧空 的情况
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }
    }
  }

  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    // 优化1：
    // (a, b)
    // (a, b) c d
    // i = 0; e1 = 1; e2 = 2
    // (a, b) c
    // (a, b)
    // i = 0; e1 = 1; e2 = 2
    // console.log(i, e1, e2)

    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = normalizeVNode(c2[i])

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      i++
    }
    // i = 2; e1 = 1; e2 = 2
    // console.log(i, e1, e2)

    // 优化2：
    //   (b, a)
    // c (b, a)
    // i = 0; e1 = -1; e2 = 0
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = normalizeVNode(c2[e2])
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }

    // 找到我要新增的节点
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextIndex = e2 + 1
          const anchor = nextIndex < c2.length ? c2[nextIndex].el : null
          patch(null, normalizeVNode(c2[i]), el, anchor)
          i++
        }
      }
      // 找到需要删除的节点
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    } else {
      // 移动：复用节点，
      // a b [c d e] f g
      // a b [d e h] f g
      // 优化后: i = 2；e1 = 4；e2 = 4
      // 以上：d e 节点可以复用，移动一下位置就行，c 节点删除，h 节点新增

      // 记录之前的i
      const s1 = i
      const s2 = i
      let j
      // 根据新虚拟节点 创建map映射表 【d -> 2, e -> 3, h -> 4】
      const keyToNewIndexMap = new Map()

      const toBePatched = e2 - s2 + 1 // 获取需要操作的节点数量

      const newIndexToOldIndexMap = Array(toBePatched).fill(0) // 得到 toBePatched 长度的数组 [0, 0, 0]

      // 后面 使用 newIndexToOldIndexMap 记录每一项对应的 需要变动的老节点 对应的 index
      // 遍历 [c d e]
      for (let i = s2; i <= e2; i++) {
        keyToNewIndexMap.set(c2[i].key, i)
      }
      // console.log(keyToNewIndexMap)

      // 比较不同：卸载 和 相同节点 patch 逻辑
      // 比较老节点里面 是否 新节点里面 （map映射表里面）有，
      // 老节点有  新节点里没有  直接卸载
      // 如果存在，patch 比对
      // console.log(s1, "s1")
      // console.log(e1, "e1")
      // console.log(s2, "s2")

      // 相当于遍历 [c d e]
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]
        const newIndex = keyToNewIndexMap.get(prevChild.key)
        // console.log(prevChild, newIndex)
        if (newIndex == undefined) {
          unmount(prevChild)
        } else {
          // a b [c d e] f g
          // a b [d e h] f g
          // 记录每一项对应的 需要变动的老节点 对应的 index
          // 因为 初始 newIndexToOldIndexMap [0, 0, 0] 所以 减去s2
          // 找到 a b [c d e] f g 中 d 的时候 i = 3；e的时候  i = 4 结束

          newIndexToOldIndexMap[newIndex - s2] = i + 1
          // i + 1 避免出现 需要比对的节点 对应的 index 为 0 的情况，如果不 + 1 的话，后面就被当做无效值 过滤掉了
          // 所以 newIndexToOldIndexMap 结果是 [3, 4, 0]

          patch(prevChild, c2[newIndex], el)
        }
      }
      // console.log(newIndexToOldIndexMap, "newIndexToOldIndexMap")

      // 获取 newIndexToOldIndexMap 中最长递增子序列对应的 索引

      // a b [c d e] f g
      // a b [e d h] f g
      const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap) // [0,1]
      // const increasingNewIndexSequence = getSequence([7, 3, 6, 4, 9, 3, 8, 2]) // [0,1]
      // console.log(increasingNewIndexSequence, "increasingNewIndexSequence")

      j = increasingNewIndexSequence.length - 1

      // 比较不同：移动 和 新增 逻辑
      // 因为新增，通过 insertBefore 实现，需要找到 anchor，所以从后开始遍历，容易找到下一个参照物，并插入
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null
        // console.log(nextIndex, nextChild)
        if (!nextChild.el) {
          patch(null, nextChild, el, anchor)
        } else {
          // 举例：什么情况会走到这里的逻辑
          // a b [c d e] f g
          // a b [e d h] f g
          // newIndexToOldIndexMap [4, 3, 0]
          // increasingNewIndexSequence  [2]
          // i = 1 0
          // console.log(i, j, increasingNewIndexSequence[j])
          if (i !== increasingNewIndexSequence[j]) {
            // console.log(33333)
            // insertBefore 方法 会帮我们移动到新位置
            hostInsert(nextChild.el, el, anchor)
          } else {
            j--
          }
        }
      }
    }
  }

  const patchProps = (oldProps, newProps, el) => {
    for (const k in newProps) {
      patchProp(el, k, oldProps[k], newProps[k])
    }
    // 如果 newProps 的 key 对应的值为null 直接patchProp 置空
    for (const k in oldProps) {
      if (newProps[k] == null) {
        patchProp(el, k, oldProps[k], null)
      }
    }
  }

  // 卸载逻辑处理
  const unmount = (vnode) => {
    console.log(vnode, "vnode")
    const { el, type } = vnode
    if (type === Fragment) {
      unmountChildren(vnode.children)
    } else {
      // 虚拟 dom 把 真实的元素挂载到了el属性上
      hostRemove(el)
    }
  }

  // 卸载 children
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }
  // patch 核心方法
  const patch = (n1, n2, container, anchor = null) => {
    /*
        。div  。p
      。  。  。 。
      如果上面的节点  div，p 不一样 直接卸载，不用继续遍历对比了
    */
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    // 处理 n2 逻辑
    const { shapeFlag, type } = n2

    // shapeFlag 判断是文本节点 还是 array element
    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      case Fragment:
        processFragment(n1, n2, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, anchor)
        }
        break
    }
  }

  // 处理文本进程
  const processText = (n1, n2, container) => {
    // n1 null 首次创建，或者 n1 被卸载，直接创建n2
    if (n1 == null) {
      const el = (n2.el = hostCreateText(n2.children))

      hostInsert(el, container)
    } else {
      // n1 存在 且 n1 n2 isSameVNodeType true
      // 所以可以复用老vnode的dom
      const el = (n2.el = n1.el)
      if (n2.children !== n1.children) {
        // 1
        // hostSetElementText(el, n2.children)
        // 2
        hostSetText(el, n2.children)
      }
    }
  }

  const processFragment = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 新增
      mountChildren(n2.children, container)
    } else {
      // 更新
      // patchChildren(n1, n2, container)
    }
  }

  const processElement = (n1, n2, container, anchor) => {
    // 首次创建，或者 n1 被卸载，直接创建n2
    if (n1 == null) {
      mountElement(n2, container, anchor)
    } else {
      patchElement(n1, n2, container)
    }
  }

  const processComponent = (n1, n2, container, anchor) => {
    console.log("processComponent")

    if (n1 == null) {
      // 走新增
      mountComponent(n2, container, anchor)
    } else {
      // 更新逻辑
      console.log(3333)
    }
  }

  const render = (vnode, container) => {
    // 卸载逻辑
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode)
      }
    } else {
      // 新增  更新 逻辑：patch 对比后更新
      patch(container._vnode || null, vnode, container)
    }
    // 将第一次的 vnode 保存起来，挂载到 元素的 _vnode 上
    // 为了接下来 做卸载  或者 更新对比 使用
    container._vnode = vnode
  }

  return { render }
}
// [1, 2, 3, 4]
// [10, 9, 2, 5, 3, 7, 101, 18]
// i 0 j 0 10 10 false result = [0]
function getSequence(arr) {
  let len = arr.length
  // 取出 第一个 当初始值
  let result = [0]
  let start, end, mid
  let p = arr.slice()
  for (let i = 0; i < len; i++) {
    const arrI = arr[i] // 后一项
    const j = result[result.length - 1] // 前一项
    // if (arrI === 0) return result
    if (arrI > arr[j]) {
      // 记录当前要push 到 result 的索引
      p[i] = j
      // 说明 递增 取到
      result.push(i)
      continue
    }
    start = 0
    end = result.length - 1
    while (start < end) {
      mid = (start + end) >> 1 // 4
      // arrI 3 2
      if (arr[result[mid]] < arrI) {
        start = mid + 1
      } else {
        end = mid
      }
    }

    if (arrI < arr[result[start]]) {
      if (start > 0) {
        // 在追加之前 记录上一个被替换掉的索引
        p[i] = result[start - 1]
      }
      result[start] = i
    }
  }
  let i = result.length // 通过数组p，修正最长递增子序列对应的值
  let lastIndex = result[i - 1] // 最后一项
  // 倒序
  while (i-- > 0) {
    result[i] = lastIndex
    lastIndex = p[lastIndex]
  }

  return result
}
// getSequence([7, 3, 6, 4, 9, 3, 8, 2])
// getSequence([1, 5, 6, 7, 8, 2, 3, 4, 9])
// 2 3 7 18
// getSequence([10, 9, 2, 5, 3, 7, 101, 18])
// 7 3 6 4 9 3 8 2
