import {
  NodeTypes,
  type RootNode,
  type TemplateChildNode,
  type InterpolationNode,
  type SimpleExpressionNode,
  type ForNode,
  type IfNode,
  type ElementNode,
  type CommentNode,
  type TextNode,
  type CompoundExpressionNode,
  type AttributeNode,
  type DirectiveNode,
  type IfBranchNode,
} from '@vue/compiler-core';

/**
 * 可遍历的所有节点类型联合
 */
export type AnyTemplateNode =
  | RootNode
  | TemplateChildNode
  | InterpolationNode
  | SimpleExpressionNode
  | CompoundExpressionNode
  | ForNode
  | IfNode
  | IfBranchNode
  | ElementNode
  | AttributeNode
  | DirectiveNode
  | CommentNode
  | TextNode;

export interface TemplateAstVisitor {
  enter?: (node: AnyTemplateNode, parent: AnyTemplateNode | null) => void;
  leave?: (node: AnyTemplateNode, parent: AnyTemplateNode | null) => void;
}

/**
 * 类型安全的 Vue template AST 遍历器
 */
export function walkTemplateAst(
  node: AnyTemplateNode,
  visitor: TemplateAstVisitor,
  parent: AnyTemplateNode | null = null,
): void {
  if (visitor.enter) {
    visitor.enter(node, parent);
  }

  switch (node.type) {
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
    case NodeTypes.FOR:
      if (node.type === NodeTypes.ELEMENT) {
        for (const prop of node.props) {
          walkTemplateAst(prop, visitor, node);
        }
      }
      for (const child of node.children) {
        walkTemplateAst(child, visitor, node);
      }
      break;

    case NodeTypes.COMPOUND_EXPRESSION:
      for (const child of node.children) {
        if (typeof child === 'string' || typeof child === 'symbol') {
          continue;
        } else {
          walkTemplateAst(child, visitor, node);
        }
      }
      break;

    case NodeTypes.IF:
      for (const branch of node.branches) {
        walkTemplateAst(branch, visitor, node);
      }
      break;

    case NodeTypes.IF_BRANCH:
      if (node.condition) {
        walkTemplateAst(node.condition, visitor, node);
      }
      for (const child of node.children) {
        walkTemplateAst(child, visitor, node);
      }
      break;

    case NodeTypes.INTERPOLATION:
      walkTemplateAst(node.content, visitor, node);
      break;

    case NodeTypes.DIRECTIVE:
      if (node.arg) walkTemplateAst(node.arg, visitor, node);
      if (node.exp) walkTemplateAst(node.exp, visitor, node);
      break;

    case NodeTypes.ATTRIBUTE:
      if (node.value) {
        walkTemplateAst(node.value, visitor, node);
      }
      break;

    // SIMPLE_EXPRESSION / TEXT / COMMENT 没有子节点
    case NodeTypes.SIMPLE_EXPRESSION:
    case NodeTypes.TEXT:
    case NodeTypes.COMMENT:
      break;

    default:
      console.warn('unknown node', node);
      break;
  }
  if (visitor.leave) {
    visitor.leave(node, parent);
  }
}
