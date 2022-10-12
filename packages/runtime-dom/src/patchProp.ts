import { isOn } from "@my-vue/shared"
import { patchAttr } from "./modules/patchAttr"
import { patchClass } from "./modules/patchClass"
import { patchEvent } from "./modules/patchEvent"
import { patchStyle } from "./modules/patchStyle"

export const patchProp = (el, key, preVal, nextVal) => {
  if (key === "class") {
    patchClass(el, nextVal)
  } else if (key === "style") {
    patchStyle(el, preVal, nextVal)
  } else if (isOn(key)) {
    patchEvent(el, key, preVal, nextVal)
  } else {
    patchAttr(el, key, nextVal)
  }
}
