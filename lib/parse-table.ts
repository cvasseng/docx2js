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

import { extractRunsFromColumn, Run } from './extract-runs.js';

////////////////////////////////////////////////////////////////////////////////

export interface Table {
  caption: string;
  rows: Array<Array<Run>>;
  type: 'table';
}

////////////////////////////////////////////////////////////////////////////////

export const parseTable = (name: string, tbl: any) => {
  const table : Table = {
    caption: name,
    rows: [],
    type: 'table'
  };

  for (const a of tbl) {
    if (a['w:tr']) {
      const row : Run[] = [];
      for (const b of a['w:tr']) {
        if (b['w:tc']) {
          const runs = extractRunsFromColumn(b['w:tc']);
          if (runs?.length) {
            row.push(...runs);
          }
        }
      }

      if (row.length) {
        table.rows.push(row);
      }
    }
  }

  return table;
};
