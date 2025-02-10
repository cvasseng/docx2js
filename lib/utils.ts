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

export const readAttr = (obj: any, attr: string) => {
  if (obj[':@']) {
    return obj[':@']['@_' + attr];
  }
  return false; 
};
