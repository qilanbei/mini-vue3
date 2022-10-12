// insert: hostInsert,
// remove: hostRemove,
// patchProp: hostPatchProp,
// createElement: hostCreateElement,
// createText: hostCreateText,
// createComment: hostCreateComment,
// setText: hostSetText,
// setElementText: hostSetElementText,
// parentNode: hostParentNode,
// nextSibling: hostNextSibling,
// setScopeId: hostSetScopeId,
// cloneNode: hostCloneNode,
// insertStaticContent: hostInsertStaticContent

export const nodeOps = {
  insert(el, container, anchor) {
    container.insertBefore(el, anchor ?? null)
    //  insertBefore：anchor 引用节点不是可选参数——你必须显式传入一个 Node 或者 null
  },
  remove(el) {
    const parentNode = el.parentNode
    if (parentNode) parentNode.removeChild(el)
  },
  createElement(type) {
    return document.createElement(type)
  },
  createText(text) {
    return document.createTextNode(text)
  },
  setText(node, text) {
    node.nodeValue = text
  },
  setElementText(el, text) {
    el.textContent = text
  },
  parentNode(el) {
    return el.parentNode
  },
  // 疑问  最后一项  参照物？
  nextSibling(el) {
    return el.nextSibling
  },
  // setScopeId () {},
  // cloneNode () {},
  // insertStaticContent () {},
  querySelector(selectors) {
    return document.querySelector(selectors)
  },
}
