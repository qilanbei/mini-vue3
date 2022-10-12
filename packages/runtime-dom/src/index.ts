import { createRenderer } from "packages/runtime-core/src/renderer"
import { nodeOps } from "./nodeOps"
import { patchProp } from "./patchProp"

export const rendererOps = {
  patchProp,
  ...nodeOps,
}

export const render = (vnode, container) => {
  const { render: _render } = createRenderer(rendererOps)
  _render(vnode, container)
}

export * from "@my-vue/runtime-core"
