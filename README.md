# docx2js

Simple docx parser and transformer for JavaScript/TypeScript

** THIS IS EARLY DAYS WORK IN PROGRESS, NOT READY FOR WIDE-SPREAD USE **

## Does the world need another docx parser?

Good question - maybe? What I found was that I needed to be able extract more information in a structured way for further processing than the up-to-date (or maintained, as it were) packages I could find. So here we are.

At the heart, the docx (or rather, the OpenXML format) is a zipped file containing a bunch of XML files, so this package is essentially a glorified XML traverser. There are quite a few intricacies to the format though, and as such is not a feature complete parser. 

## Features

  * Converts DOCX to a JSON structure with the following information:
    - Paragraphs
    - Tables
    - Suggestions (inserts and deletions)
    - Comments
    - Basic styling for runs
  * Uses `fast-xml-parser` for parsing the XML, so it's fairly fast

## Installation

```bash
yarn add docx2js
```

## Usage, CLI

You can convert a DOCX file to JSON using the CLI:

```bash
docx2js path/to/docx/file [path/to/output/file]
```

If you don't specify an output file, stdout will be used instead.

## Usage, API

For a simple demo on how to use the API, take a look at [markdown.ts](./lib/transformers/markdown.ts) which contains a very silly and simple markdown transformer.

**Loading and parsing from a filename**

```javascript
import { Parse } from 'docx2js';

const main = async () => {
  const doc = await Parse('path/to/docx/file');
  console.log(doc);
};

```

**Loading and parsing from a buffer**

```javascript
import { readFile } from 'fs/promises';
import { ParseBuffer } from 'docx2js';

const main = async () => {
  const buffer = await readFile('path/to/docx/file');
  const doc = await ParseBuffer(buffer);
  console.log(doc);
};

```

The parse functions return a document consisting of some meta information, and the actual contents. The content is in sequence, so iterating through it makes it possible to reproduce the text of the original document. 

There are two kinds of content - `Paragraph` and `Table`.

Table content is an object containing the following properties:

  * `type` - the type of content, in this case `table`
  * `rows` - an array of rows, each row being an array of cells
  * `caption` - the caption of the table - fetched from the first preceeding paragraph contents

Paragraph content is an object containing the following properties:

  * `type` - the type of content, one of:
    - `paragraph` - a regular paragraph
    - `paragraph-deletion` - a paragraph that's tracked as "deleted"
    - `paragraph-insertion` - a paragraph that's tracked as "inserted"
    - `paragraph-comment` - a paragraph that has a comment attached to all of it
  * `contents` - an array of runs (see below)
  * `properties` - paragraph properties
    - `style` - the style of the paragraph
    - `alignment` - the alignment of the paragraph
    - `indent` - the indentation of the paragraph
    - `spacing` - the spacing of the paragraph
    - `shading` - the shading of the paragraph
    - `outlineLevel` - the outline level of the paragraph
    - `bidi` - the bidi of the paragraph

## License

MIT. See LICENSE for the full license text.

