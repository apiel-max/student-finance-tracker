// scripts/search.js
// ── Regex search utilities ──

/**
 * Safely compile a regex from user input.
 * Returns null if input is empty or pattern is invalid.
 */
export function compileRegex(input, caseInsensitive = true) {
  if (!input || !input.trim()) return null;
  try {
    const flags = caseInsensitive ? 'i' : '';
    return new RegExp(input.trim(), flags);
  } catch(e) {
    return null; // invalid pattern
  }
}

/**
 * Test whether a regex pattern string is valid without throwing.
 */
export function isValidRegex(input) {
  try {
    new RegExp(input);
    return true;
  } catch(e) {
    return false;
  }
}

/**
 * Highlight all matches of `re` in `text` using <mark> tags.
 * Returns the original text if no regex is provided.
 * Escapes HTML entities BEFORE inserting <mark> to prevent XSS.
 */
export function highlight(text, re) {
  if (!re) {
    return String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  try {
    const globalRe = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    // match on raw text first, then escape non-matched parts
    let result = '';
    let last = 0;
    const str = String(text);
    str.replace(globalRe, (m, offset) => {
      result += str.slice(last, offset)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      result += `<mark>${m.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</mark>`;
      last = offset + m.length;
    });
    result += str.slice(last)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return result;
  } catch(e) {
    return String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

/**
 * Return a human-friendly message about the current search.
 */
export function searchStatus(pattern, matchCount, totalCount) {
  if (!pattern) return '';
  if (matchCount === 0) return `No matches for /${pattern}/`;
  return `${matchCount} of ${totalCount} transaction${totalCount !== 1 ? 's' : ''} match /${pattern}/`;
}