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

import { readAttr } from './utils.js';

interface RunStyle {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: 'bold' | 'normal';
  fontStyle?: 'italic' | 'normal';
  textDecoration?: 'underline' | 'none';
  color?: string;

  strikeThrough?: boolean;
  highlight?: string;
  backgroundColor?: string;
}

interface CommonRun {
  text: string;
  style?: RunStyle;
}

interface RunInsertion extends CommonRun {
  type: 'insertion';
  author?: string;
  date?: string;
}

interface RunDeletion extends CommonRun {
  type: 'deletion';
  author?: string;
  date?: string;
}

interface RunComment extends CommonRun {
  type: 'comment';
  commentID?: number;
  commentStart?: number;
  commentEnd?: number;
}

interface RunNormal extends CommonRun {
  type: 'normal';
}

export type Run = RunInsertion | RunDeletion | RunNormal | RunComment;

/** Options for the run extraction */
interface RunExtractionOptions {
  // Whether to include styling information. Defaults to `true`.
  includeStyling?: boolean;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts runs (i.e. text streams) from an XML node.
 */
export const extractRunsFromNode = (
  node: any,
  options?: RunExtractionOptions
): Run[] => {
  const runs: Run[] = [];

  options = Object.assign(
    {
      includeStyling: true
    },
    options || {}
  );

  node = Array.isArray(node) ? node : [node];

  const findRuns = (node: any, type?: 'normal' | 'insertion' | 'deletion') => {
    type = type || 'normal';

    for (const a of node) {
      if (a['w:ins']) {
        findRuns(a['w:ins'], 'insertion');
      } else if (a['w:del']) {
        findRuns(a['w:del'], 'deletion');
      } else if (a['w:r']) {
        const run: Run = {
          text: '',
          type
        };

        if (options.includeStyling) {
          run.style = {};
        }

        if (run.type === 'insertion') {
          run.author = readAttr(a, 'w:author');
          run.date = readAttr(a, 'w:date');
        }

        if (run.type === 'deletion') {
          run.author = readAttr(a, 'w:author');
          run.date = readAttr(a, 'w:date');
        }

        for (const b of a['w:r']) {
          if (b['w:rPr'] && options.includeStyling) {
            for (const c of b['w:rPr']) {
              if (c['w:b']) {
                run.style!.fontWeight =
                  readAttr(c, 'w:val') !== 'false' ? 'bold' : 'normal';
              } else if (c['w:i']) {
                run.style!.fontStyle =
                  readAttr(c, 'w:val') !== 'false' ? 'italic' : 'normal';
              } else if (c['w:u']) {
                // run.style['text-decoration'] =
                // readAttr(c, 'w:val') !== 'false' ? 'underline' : 'none';
              } else if (c['w:strike']) {
                // run.style['text-decoration'] =
                // readAttr(c, 'w:val') !== 'false' ? 'line-through' : 'none';
              } else if (c['w:color']) {
                const v = readAttr(c, 'w:val');
                if (v) {
                  run.style!.color = v;
                }
              } else if (c['w:sz']) {
                const v = readAttr(c, 'w:val');
                if (v) {
                  run.style!.fontSize = v;
                }
              } else if (c['w:rFonts']) {
                const v = readAttr(c, 'w:ascii');
                if (v) {
                  run.style!.fontFamily = v;
                }
              } else if (c['w:highlight']) {
                const v = readAttr(c, 'w:val');
                if (v !== 'none') {
                  run.style!.highlight = v;
                }
              } else if (c['w:shd']) {
                const style = readAttr(c, 'w:val');
                const fill = readAttr(c, 'w:fill');
                if (style || fill) {
                  run.style!.backgroundColor = fill;
                  // run.style.shading = { style, fill };
                }
              }
            }
          } else if (b['w:t']) {
            for (const c of b['w:t']) {
              if (c['#text']) {
                run.text += c['#text'];
              }
            }
          } else if (b['w:delText']) {
            for (const c of b['w:delText']) {
              if (c['#text']) {
                run.text += c['#text'];
              }
            }
          } else if (b['w:commentRangeStart']) {
            run.type = 'comment';
            (run as RunComment).commentStart = readAttr(b, 'w:id');
          } else if (b['w:commentRangeEnd']) {
            run.type = 'comment';
            (run as RunComment).commentEnd = readAttr(b, 'w:id');
          } else if (b['w:commentReference']) {
            run.type = 'comment';
            (run as RunComment).commentID = readAttr(b, 'w:id');
          }
        }

        if (run?.text?.length || run.type !== 'normal') {
          runs.push(run);
        }
      }
    }
  };

  findRuns(node);

  return runs;
};

export const extractRunsFromColumn = (
  col: any,
  options?: RunExtractionOptions
): Run[] => {
  col = Array.isArray(col) ? col : [col];

  const runs = [];

  for (const a of col) {
    if (a['w:p']) {
      runs.push(...extractRunsFromNode(a['w:p'], options));
    }
  }

  return runs;
};
