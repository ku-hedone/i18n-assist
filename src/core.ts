import ts from 'typescript';
import type {
    Node,
    CallExpression,
    Identifier,
    StringLiteral,
    JsxElement,
    JsxText,
    JsxSelfClosingElement,
} from 'typescript';
import { excludedTypes } from './constant';
import Collector from './collect';
import { readFileSync } from 'fs';

const {
    createSourceFile,
    ScriptTarget,
    ScriptKind,
    SyntaxKind,
    forEachChild
} = ts;

const handleCallExpression = (node: CallExpression, Collector: Collector) => {
    const { expression } = node;
    if (expression.kind === SyntaxKind.Identifier) {
        const { text } = expression as Identifier;
        if (text === 't') {
            const { arguments: args } = node;
            if (args.length > 0) {
                const arg = args[0];
                if (arg.kind === SyntaxKind.StringLiteral) {
                    const { text } = arg as StringLiteral;
                    Collector.record(text);
                }
            }
        }
    }
}

const handleJsxElement = (node: JsxElement, Collector: Collector) => {
    const { openingElement } = node;
    if (
        openingElement.tagName.kind === SyntaxKind.Identifier &&
        (openingElement.tagName.escapedText as string).startsWith('I18n')
    ) {
        const { children } = node;
        children.forEach((child) => {
            if (child.kind === SyntaxKind.JsxText) {
                const { text } = child as JsxText;
                const v = text.replaceAll('\n', '').trim();
                if (v) {
                    Collector.record(v);
                }
            }
        });
    }
}

const handleJsxSelfClosingElement = (node: JsxSelfClosingElement, Collector: Collector) => {
    const { tagName } = node;
    if (tagName.kind === SyntaxKind.Identifier && tagName.text === 'Trans') {
        const { attributes } = node;
        const n = attributes.properties.length;
        for (let i = 0; i < n; i++) {
            const attribute = attributes.properties[i];
            if (
                attribute.kind === SyntaxKind.JsxAttribute &&
                attribute.name.kind === SyntaxKind.Identifier &&
                attribute.name.text === 'defaults'
            ) {
                if (
                    attribute.initializer &&
                    attribute.initializer.kind === SyntaxKind.StringLiteral
                ) {
                    const { text } = attribute.initializer;
                    Collector.record(text);
                }
            }
        }
    }
}

// 定义一个访问器函数，用于遍历 AST
const visitor = (Collector: Collector) => (node: Node) => {
    const type = SyntaxKind[node.kind];
    if (excludedTypes[type]) return void 0;
    const nextVisitor = visitor(Collector);
    switch (type) {
        case 'CallExpression':
            handleCallExpression(node as CallExpression, Collector);
            forEachChild(node, nextVisitor);
            break;
        case 'JsxElement':
            handleJsxElement(node as JsxElement, Collector);
            forEachChild(node, nextVisitor);
            break;
        case 'JsxSelfClosingElement':
            handleJsxSelfClosingElement(node as JsxSelfClosingElement, Collector);
            forEachChild(node, nextVisitor);
            break;
        default:
            // 遍历子节点
            forEachChild(node, nextVisitor);
    }
}

const parser = async (pwd: string, Collector: Collector) => {
    // 读取 TypeScript 文件
    const sourceCode = readFileSync(pwd, 'utf8');
    // 创建一个 SourceFile 对象
    const sourceFile = createSourceFile(
        'file.ts',
        sourceCode,
        ScriptTarget.Latest,
        false,
        ScriptKind.TSX,
    );
    visitor(Collector)(sourceFile);
};


export default parser;