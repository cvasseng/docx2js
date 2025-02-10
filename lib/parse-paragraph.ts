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
import { extractRunsFromNode, Run } from './extract-runs.js';

interface ParagraphProperties {
  style?: string;
  alignment?: string;
  indent?: string;
  spacing?: string;
  shading?: string;
  outlineLevel?: string;
  bidi?: string;
}

interface ParagraphNumberingReference {
  numId: number;
  ilvl: number;
}

interface CommonParagraph {
  properties?: ParagraphProperties;
  numRef?: ParagraphNumberingReference;
  runs: Run[];
}

interface ParagraphInsertion extends CommonParagraph {
  type: 'paragraph-insertion';
}

interface ParagraphDeletion extends CommonParagraph {
  type: 'paragraph-deletion';
}

interface ParagraphNormal extends CommonParagraph {
  type: 'paragraph';
}

export type Paragraph =
  | ParagraphInsertion
  | ParagraphDeletion
  | ParagraphNormal;

////////////////////////////////////////////////////////////////////////////////

export const parseParagraph = (p: any) : Paragraph => {
  const paragraph : Paragraph = {
    properties: {},
    runs: [],
    type: 'paragraph'
  };

  if (!Array.isArray(p)) {
    return paragraph;
  }

  for (const a of p) {
    if (a['w:pPr']) {
      for (const b of a['w:pPr']) {
        if (b['w:numPr']) {
          paragraph!.numRef = { ilvl: 0, numId: 0 };
          for (const c of b['w:numPr']) {
            if (c['w:ilvl']) {
              paragraph.numRef.ilvl = readAttr(c, 'w:val');
            } else if (c['w:numId']) {
              paragraph.numRef.numId = readAttr(c, 'w:val');
            }
          }
        } else if (b['w:pStyle']) {
          paragraph.properties!.style = readAttr(b, 'w:val');
        } else if (b['w:jc']) {
          paragraph.properties!.alignment = readAttr(b, 'w:val');
        } else if (b['w:ind']) {
          paragraph.properties!.indent = readAttr(b, 'w:left');
        } else if (b['w:spacing']) {
          paragraph.properties!.spacing = readAttr(b, 'w:line');
        } else if (b['w:shd']) {
          paragraph.properties!.shading = readAttr(b, 'w:fill');
        } else if (b['w:outlineLvl']) {
          paragraph.properties!.outlineLevel = readAttr(b, 'w:val');
        } else if (b['w:bidi']) {
          paragraph.properties!.bidi = readAttr(b, 'w:val');
        }
      }
    }
    // } else if (a['w:ins']) {
    //   paragraph.author = {
    //     name: readAttr(a, 'w:author'),
    //     date: readAttr(a, 'w:date')
    //   };

    //   paragraph.runs = extractRunsFromNode(a['w:ins']);
    //   paragraph.type = 'paragraph-insertion';
    // } else if (a['w:del']) {
    //   paragraph.author = {
    //     name: readAttr(a, 'w:author'),
    //     date: readAttr(a, 'w:date')
    //   };

    //   paragraph.runs = extractRunsFromNode(a['w:del']);
    //   paragraph.type = 'paragraph-deletion';
    // }
  }

  if (!paragraph?.runs?.length) {
    paragraph.runs = extractRunsFromNode(p);
  }

  return paragraph;
};
