#!/usr/bin/env node
import travesAll from './index';
import { resolve } from 'path';
import pkg from '../package.json';

console.log(`${pkg.name} version: ${pkg.version}`);

let flag: string;
let config: string = '';

process.argv.forEach((i) => {
  if (flag === 'p') {
    config = resolve(process.cwd(), i);
  }
  if (i === '--p') {
    flag = 'p';
  }
});

travesAll(config);
