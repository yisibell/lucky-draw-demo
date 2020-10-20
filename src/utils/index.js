export function isHtmlElement(node) {
  return node && node.nodeType === Node.ELEMENT_NODE;
}