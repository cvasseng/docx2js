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

import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

import type { Run } from './extract-runs.js';
import { readAttr } from './utils.js';
import { Paragraph, parseParagraph } from './parse-paragraph.js';
import { Table, parseTable } from './parse-table.js';

////////////////////////////////////////////////////////////////////////////////

type DocumentContent = Paragraph | Table;

interface Comment {
  id: string;
  author: string;
  date: string;
  contents: DocumentContent[];
}

export interface ParseOptions {
  /** Include regular paragraphs? Defaults to true. */
  includeParagraphs?: boolean;
  /** Include tables? Defaults to true. */
  includeTables?: boolean;
  /** Include comments? Defaults to true. */
  includeComments?: boolean;
  /**
   * How to handle change tracking
   * - 'resolve' will resolve all changes, ie apply all deletions and insertions.
   * - 'reject' will reject all changes, ie remove all deletions and insertions.
   * - 'include_changes' will include all changes, ie keep deletions 
   *    and insertions in the document content.
   */
  changeTracking?: 'resolve' | 'reject' | 'include_changes';
}

export interface Document {
  comments: Comment[];
  contents: DocumentContent[];
}

////////////////////////////////////////////////////////////////////////////////

export const Parse = async (file: string) => {
  const fileBuffer = await readFile(file);
  return await ParseBuffer(fileBuffer);
};

export const ParseBuffer = async (fileBuffer: Buffer) => {
  const data = await JSZip.loadAsync(fileBuffer);

  if (data.files['word/document.xml']) {
    const docContent =
      await data.files['word/document.xml'].async('binarystring');

    const commentContent = data.files['word/comments.xml']
      ? await data.files['word/comments.xml'].async('binarystring')
      : '';

    const numContent = data.files['word/numbering.xml']
      ? await data.files['word/numbering.xml'].async('binarystring')
      : '';

    const parser = new XMLParser({
      preserveOrder: true,
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });

    const parsedDoc = parser.parse(docContent);
    const parsedNum = parser.parse(numContent);
    const parsedComments = parser.parse(commentContent);

    const document: Document = {
      comments: [],
      // numbering: [],
      contents: []
    };

    ////////////////////////////////////////////////////////////////////////////
    // Parse the body node
    const parseBody = (body: any) => {
      for (const child of body) {
        if (child['w:p']) {
          const p = parseParagraph(child['w:p']);
          document.contents.push(p);
        } else if (child['w:tbl']) {
          let tableCaption = '';

          // Deduce name by going backwards until we hit a paragraph
          for (let i = document.contents.length - 1; i >= 0; i--) {
            if (document.contents[i].type === 'paragraph') {
              // @ts-ignore
              tableCaption = document.contents[i].runs
                .map((run: Run) => run.text)
                .join(' ')
                .trim();
              if (tableCaption?.length) {
                break;
              }
            }
          }

          const t = parseTable(tableCaption, child['w:tbl']);
          document.contents.push(t);
        }
      }
    };

    ////////////////////////////////////////////////////////////////////////////
    // Parse numbering information
    for (const a of parsedNum) {
      if (a['w:numbering']) {
        for (const b of a['w:numbering']) {
          if (b['w:abstractNum']) {
            for (const c of b['w:abstractNum']) {
              // console.log('ABSTRACT NUM', JSON.stringify(c, undefined, '  '));
            }
          }
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Find the w:document -> w:body node, and parse it.
    for (const a of parsedDoc) {
      if (a['w:document']) {
        for (const b of a['w:document']) {
          if (b['w:body']) {
            parseBody(b['w:body']);
          }
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Find comments
    for (const a of parsedComments) {
      if (a['w:comments']) {
        for (const b of a['w:comments']) {
          if (b['w:comment']) {
            const comment = {
              id: readAttr(b['w:comment'], 'w:id'),
              author: readAttr(b['w:comment'], 'w:author'),
              date: readAttr(b['w:comment'], 'w:date'),
              contents: []
            };

            for (const c of b['w:comment']) {
              if (c['w:p']) {
                const p = parseParagraph(c['w:p']);
                if (typeof p === 'object') {
                  // @ts-ignore
                  comment.contents.push(p);
                }
              }
            }
            document.comments.push(comment);
          }
        }
      }
    }

    return document;
  }

  return false;
};
