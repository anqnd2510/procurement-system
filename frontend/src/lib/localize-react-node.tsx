import { Fragment, cloneElement, isValidElement, type ReactNode } from 'react';

export function localizeReactNode(
  node: ReactNode,
  translate: (key: string) => string,
): ReactNode {
  if (typeof node === 'string') return translate(node);
  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <Fragment key={index}>{localizeReactNode(child, translate)}</Fragment>
    ));
  }
  if (isValidElement<{ children?: ReactNode }>(node) && node.props.children) {
    return cloneElement(node, {
      children: localizeReactNode(node.props.children, translate),
    });
  }
  return node;
}
