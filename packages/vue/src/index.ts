import { readFile } from 'node:fs/promises';
import { parse } from '@vue/compiler-sfc';
import { walkTemplateAst } from './walk.js';

const main = async () => {
  const code = await readFile('src/App.vue', {
    encoding: 'utf8',
  });
  const { descriptor } = parse(code);
  if (descriptor.template) {
    const ast = descriptor.template.ast;
    if (ast) {
      walkTemplateAst(ast, {
        enter(node, parent) {
          console.log('node', node);
        },
      });
    }
  }
};

main();
