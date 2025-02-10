/*******************************************************************************
 *
 * docx2js - Simple docx to json converter
 *
 * Copyright (c) 2025, Chris Vasseng <hello@vasseng.com>
 *
 * Released under the MIT license.
 * See the LICENSE file for more info.
 *
 ******************************************************************************/

import { writeFileSync } from 'fs';
import { Parse } from './index.js';
import MarkdownOutput from './transformers/markdown.js';

const main = async () => {
  const file = process.argv[2];
  const output = process.argv[3];

  if (!file) {
    console.log('Usage: docx2js <input file> [output file]');
    process.exit(1);
  }

  const doc = await Parse(file);

  if (output) {
    writeFileSync(output, JSON.stringify(doc, null, 2));
  } else {
    console.log(JSON.stringify(doc, null, 2));
  }
};

main();
