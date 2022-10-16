const queue = [] // 将 job （也就是需要异步缓存的 effectFn ）缓存到这里
let isFlushing = false
let resolvePromise = Promise.resolve()
export function queueJob(job) {
  // job 也就是 effect.run() 的时候 effectFn 也就是 componentUpdateFn
  if (!queue.length || !queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}

function queueFlush() {
  if (!isFlushing) {
    isFlushing = true
    resolvePromise.then(flushJob)
  }
}

// 执行 缓存的 effectFn
function flushJob() {
  for (let i = 0; i < queue.length; i++) {
    queue[i]()
  }
  queue.length = 0
  isFlushing = false
}

export function nextTick(fn) {
  return fn ? resolvePromise.then(fn) : resolvePromise
}
