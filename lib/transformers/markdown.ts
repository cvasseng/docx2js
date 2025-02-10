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

import type { Document } from './../index.js';

const pad = (str: string, len: number, c?: string) =>
  str +
  Array(len - str.length)
    .fill(c || ' ')
    .join('');

export default (doc: Document) => {
  let md = '';

  for (const p of doc.contents) {
    if (p.type === 'paragraph') {
      if (p.properties?.style?.indexOf('Heading') === 0) {
        md +=
          '#'.repeat(parseInt(p.properties.style.replace('Heading', ''))) + ' ';
      }

      for (const r of p.runs) {
        let text = r.text;

        if (r.style?.fontWeight === 'bold') {
          text = '**' + text + '**';
        }

        if (r.style?.fontStyle === 'italic') {
          text = '_' + text + '_';
        }

        if (r.style?.textDecoration === 'underline') {
          text = '__' + text + '__';
        }

        md += (md[md.length - 1] === ' ' ? '' : ' ') + r.text;
      }
      md += '\n\n';
    }

    if (p.type === 'table') {
      for (const [rowNum, row] of p.rows.entries()) {
        for (const [colNum, cell] of row.entries()) {
          if (!colNum) {
            md += '| ';
          }

          md += pad(cell.text, 20);
          md += ' | ';
        }
        if (!rowNum) {
          md += '\n';
          for (let i = 0; i < p.rows[0].length; i++) {
            md += '|' + pad('', 22, '-');
          }
          md += '|';
        }
        md += '\n';
      }
      md += '\n';
    }
  }

  return md;
};
