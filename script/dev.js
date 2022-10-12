/*
 * @Description: 开发阶段的构建脚本
 * @Author: your name
 * @Date: 2022-08-22 19:31:45
 * @LastEditors: your name
 * @LastEditTime: 2022-08-23 10:39:57
 */
// 使用 minimist 解析命令行参数
const args = require("minimist")(process.argv.slice(2))

const path = require("path")

// 使用esbuild 构建工具
const { build } = require("esbuild")

// 需要打包的模块  默认打包  reactivity 模块
const target = args._[0] || "reactivity"

// 打包格式  默认为 global 即 打包成 IIFE 格式。 在浏览器种使用
const format = args.format || "global"

// 打包的入口文件，每个模块的 src/index.ts 作为该模块的入口文件
const pkg = require(path.resolve(
  __dirname,
  `../packages/${target}/package.json`
))

const entry = path.resolve(__dirname, `../packages/${target}/src/index.ts`)
// 输出文件路径
const outfile = path.resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
)

console.log(pkg?.buildOptions?.name, "buildOptions")

// 打包文件的输出格式
// "cjs" ? "cjs" : "esm"区别：
const outputFormat =
  format === "global" ? "iife" : format === "cjs" ? "cjs" : "esm"

build({
  entryPoints: [entry],
  outfile,
  globalName: pkg?.buildOptions?.name, // 作为打包后的自执行函数的函数名
  bundle: true, // 把你的依赖 打包进来
  format: outputFormat, // 打包格式
  sourcemap: true, // 开启 sourcemap
  watch: {
    onRebuild(err) {
      if (!err) console.log("rebuilt~~~")
    },
  },
}).then(() => {
  console.log("watch~~~")
})
