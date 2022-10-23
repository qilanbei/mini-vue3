import { NodeTypes } from "./ast"

export function createParseContext(content) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: content, // 需要截取的内容
    originalSource: content, // 备份一份原内容
  }
}

// 获取当前内容的 行 列 偏移位置
function getCursor(content) {
  const { line, column, offset } = content
  return { line, column, offset }
}

// 当获取的内容一点点被截取到，到最后没有内容了，就说明已经遍历结束了
function isEnd(context) {
  const s = context.source
  // 如果解析的内容  是以 </ 一个结束标签 开始的 那就不进行了，防止被当做文本解析掉
  if (startsWith(s, "</")) return true
  return !s
}

function startsWith(s, key) {
  return s.startsWith(key)
}

function pushNode(nodes, node) {
  nodes.push(node)
}

// 截取掉内容字符串
function advanceBy(context, length) {
  const source = context.source
  // 获取截取字符串的 行 列 位移
  advancePositionWithMutation(context, source, length)
  context.source = source.slice(length)
}

// 跳过空格
function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

function advancePositionWithMutation(context, source, length) {
  // debugger
  let linesCount = 0
  let lastNewPos = -1
  for (let i = 0; i < length; i++) {
    // 判断每一项 有没有 换行符

    if (source.charCodeAt(i) === 10) {
      // 遇到一个换行符，行号数量就 ++
      linesCount++
      lastNewPos = i
    }
  }

  context.line += linesCount
  context.offset += length

  /**
   * column 情况：
   * 1、只有文本  那就是原来的 column + 现在截取到的文本的length
   * 2、如果有换行:
   * `a
      b
      c123 {{d}} <div></div>`
      变成字符串文本为：'a\n    b\n     c123 {{d}} <div></div>'
      linesCount 2 （2个换行符）
      lastNewPos 7 （换行结束的位置）
      'a\n    b\n     c123 {{d}} <div></div>'
      a(0)\n(1)   (四个空格符号 5) b(6) \n(7)
   */
  context.column =
    lastNewPos === -1 ? context.column + length : length - lastNewPos
  // column  10
}

function getSelection(context, start, end?) {
  end = end || getCursor(context)
  return {
    start,
    end,
    // start.offset, end.offset 截取到的就是扫描到的 文本内容
    source: context.originalSource.slice(start.offset, end.offset),
  }
}

export function baseParse(content) {
  console.log(content)
  // 1、创建上下文
  const context = createParseContext(content)
  return parseChildren(context)
}

function parseChildren(context) {
  const nodes = [] // 返回的节点数组
  // 一直遍历内容字符串，解析，返回
  while (!isEnd(context)) {
    // 开始解析
    const s = context.source // 传入的内容字符串
    let node // 被解析之后的内容 临时存储
    if (startsWith(s, "{{")) {
      // 解析插值语法
      node = parseInterPolation(context)
    } else if (s[0] === "<" && /[a-z]/i.test(s[1])) {
      // 解析 是  <div 这种标签
      node = parseElement(context)
    }
    if (!node) {
      // 通过上面解析判断 都不满足，node 还是空的，下面就会被当做文本解析
      node = parseText(context)
    }
    pushNode(nodes, node)
  }
  return nodes
}

function parseElement(context) {
  const element = parseTag(context, "START") // 解析标签
  if (element.isSelfClosing) return element // 如果是自闭合标签，没有 children 无需递归解析
  // 递归解析
  const children = parseChildren(context)
  element.children = children
  parseTag(context, "END")
  // 截取之后  获取最新的 位置信息
  element.loc = getSelection(context, element.loc.start)
  return element
}

function parseAttributes(context) {
  const props = []
  while (
    context.source.length > 0 &&
    !startsWith(context.source, ">") &&
    !startsWith(context.source, "/>")
  ) {
    const attr = parseAttribute(context)
    // 处理 class value 空格 trim 掉
    if (attr && attr.name === "class" && attr.value.value) {
      // 将全局的空格 替换成 一个 空格，还保留 名字中间的空格
      attr.value.value = attr.value.value.replace(/\s+/g, " ").trim()
    }
    props.push(attr)
    advanceSpaces(context)
  }
  return props
}

function parseAttribute(context) {
  const start = getCursor(context)
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
  let name = match[0] // 属性名
  advanceBy(context, name.length)
  let value
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    // 删除属性后面的空格
    advanceSpaces(context)
    // 删除掉属性后面的 =
    advanceBy(context, 1)
    // 删除=后面的空格
    advanceSpaces(context)
    value = parseAttributeValue(context)
  }
  // 解析指令
  if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    const match =
      /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name
      )
    const dirName =
      // startsWith(match[0], ":") 需要匹配 ':a'
      match[1] ||
      (startsWith(match[0], ":")
        ? "bind"
        : startsWith(match[0], "@")
        ? "on"
        : "slot")

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value,
      loc: getSelection(context, start),
    }
  }
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value,
    loc: getSelection(context, start),
  }
}

function parseAttributeValue(context) {
  const start = getCursor(context)
  const quote = context.source[0]
  const isQuote = quote === '"' || quote === "'"
  let value
  if (isQuote) {
    advanceBy(context, 1) // 删除 前面的 引号
    // 如果有引号 一定是成对出现的，所以找到下一个 引号的位置 作为结束标记， 就能拿到value
    const index = context.source.indexOf(quote)
    value = parseTextData(context, index)
    advanceBy(context, 1) // 删除 后面的 引号
  } else {
    const match = /^[^\t\r\n\f >]+/.exec(context.source)
    value = parseTextData(context, match[0].length) // 取到value值，并且删掉 advanceBy
  }
  return {
    type: NodeTypes.TEXT,
    value,
    loc: getSelection(context, start),
  }
}

function parseTag(context, type) {
  const start = getCursor(context)
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  // 1、解析标签
  const tag = match[1] // div
  advanceBy(context, match[0].length) // 删掉 <div
  advanceSpaces(context) // 尝试跳过空格
  // 2、解析 props
  const props = parseAttributes(context)
  /**
   * <div></div>
   * <div />
   * 判断是否是自闭合标签，如果是  删除掉 "/>" 2个 不是的话 ">" 删除掉 这一个
   */
  const isSelfClosing = startsWith(context.source, "/>")
  advanceBy(context, isSelfClosing ? 2 : 1)

  if (type === "END") return

  return {
    type: NodeTypes.ELEMENT,
    children: [],
    isSelfClosing,
    tag,
    props,
    loc: getSelection(context, start),
  }
}

// 解析插值语法
/**
 *  {{ a }} 解析成 两个type
 *  外层的 {{ }} 是插值语法的type类型
 *  内层的 内容 type 被认为是 简单表达式的 type 类型
 *
 * 一般编辑器 格式化 会把 代码格式为  {{ a }}
 * 其实 等价于 写成 {{a}} vue 内部解析的时候 会将多余的空格 trim 掉
 */
function parseInterPolation(context) {
  const start = getCursor(context)
  const open = "{{"
  const close = "}}"
  // 要解析 close  那就从 open.length 的位置开始，因为{{ 肯定不是 }}
  const endIndex = context.source.indexOf(close, open.length)
  // 源码容错，如果 endIndex = -1 那说明 闭合 丢失了 会有提示
  advanceBy(context, open.length) // 删掉  {{
  // 获取 里面 内容表达式的  start
  const innerStart = getCursor(context)
  const rawContentLength = endIndex - open.length
  const content = parseTextData(context, rawContentLength) // 解析出 插值语法中的  内容表达式
  // 获取 里面 内容表达式的  start
  const innerEnd = getCursor(context)
  // 最后 将 }} 也删除掉，内容全部解析完成 截取完 就空了
  advanceBy(context, close.length) // 删掉  }}
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc: getSelection(context, innerStart, innerEnd),
    },
    loc: getSelection(context, start),
  }
}

// 'abc123 {{a}} <div></div>'
/**
 * 逻辑处理：
 * 1、先找到文本
 * 2、扫描到文本 就 截掉
 */
function parseText(context) {
  const endTokens = ["<", "{{"] // 作为结束的标识
  const start = getCursor(context) // 在解析截取之前 拿到开始时候的位置信息
  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    // 走到这里的逻辑 说明 第一项 肯定不是 < 或者 {{，因为parseChildren方法拦截了，所以这里从 1 开始查找
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      // 如果找到 结束标识的 索引后，就将endIndex 设置成 结束标识对应的index，那么endIndex之前的就是文本内容了
      endIndex = index
    }
    const content = parseTextData(context, endIndex)

    // const = getCursor(context)
    return {
      type: NodeTypes.TEXT,
      content,
      loc: getSelection(context, start),
    }
  }
}

function parseTextData(context, length) {
  const rawText = context.source.slice(0, length)

  advanceBy(context, length)
  return rawText
}
