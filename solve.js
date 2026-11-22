// Fast csv-reader-compatible reader for make.fun's csv-reader-speed-01.
//
// `run(input)` answers {columns, rows, errors} exactly as make.fun's own csv-reader 1.0.0 does, but in a single
// left-to-right pass over the text's characters: no regex, no split, no per-character helper calls, one
// charCodeAt comparison chain per character and string accumulation per field.

// How a field ended: at a comma, at a line break or at the end of the text.
const QUOTE = 34;
const COMMA = 44;
const LF = 10;
const CR = 13;
const BOM = 0xfeff;
const ENDED = 0;
const AT_COMMA = 1;
const AT_LINE_BREAK = 2;

// One character per code unit, so a field accumulates as a string: value += ONE[c].
const ONE = new Array(65536);
for (let i = 0; i < 65536; i += 1) ONE[i] = String.fromCharCode(i);

// The reading of one CSV input {text, header}: {columns, rows, errors} (the header).

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  const len = text.length;
  const t = text;
  const one = ONE;
  let pos = t.charCodeAt(0) === BOM ? 1 : 0;
  let line = 1;
  let recordLine = 1;
  let recordRow = null;

  const fail = (code) => { errors.push({ code, line: recordLine, row: recordRow }); };

  // The record loop: a line left with no characters is no record, and the first record is the columns when the
  // header is on.
  while (true) {
    while (pos < len) {
      const c = t.charCodeAt(pos);
      if (c === LF) { pos += 1; line += 1; }
      else if (c === CR && t.charCodeAt(pos + 1) === LF) { pos += 2; line += 1; }
      else break;
    }
    if (pos >= len) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let quoted = false;
    let field;
    let value;
    let ended;
    let added;
    // One field at a time: quoted when it opens with a quote, unquoted otherwise, the closing quote's trailing
    // characters as its junk.
    for (;;) {
      quoted = t.charCodeAt(pos) === QUOTE;
      value = '';
      ended = ENDED;
      added = 0;
      let checkJunk = false;
      if (quoted) {
        const open = pos;
        const openLine = line;
        let v = '';
        pos += 1;
        let closed = false;
        while (pos < len) {
          const c = t.charCodeAt(pos);
          if (c === QUOTE) {
            if (t.charCodeAt(pos + 1) === QUOTE) { v += '"'; pos += 2; continue; }
            pos += 1;
            closed = true;
            break;
          }
          if (c === CR) { v += '\n'; line += 1; pos += t.charCodeAt(pos + 1) === LF ? 2 : 1; continue; }
          if (c === LF) { line += 1; v += '\n'; pos += 1; continue; }
          v += one[c];
          pos += 1;
        }
        value = v;
        checkJunk = closed;
        if (!closed) { pos = open + 1; line = openLine; fail('unterminated_quote'); value = '"'; added = 0; }
      }
      while (pos < len) {
        const c = t.charCodeAt(pos);
        if (c === COMMA) { pos += 1; ended = AT_COMMA; break; }
        if (c === LF) { pos += 1; line += 1; ended = AT_LINE_BREAK; break; }
        if (c === CR) {
          if (t.charCodeAt(pos + 1) === LF) { pos += 2; line += 1; ended = AT_LINE_BREAK; break; }
          fail('stray_cr');
          pos += 1;
          continue;
        }
        value += one[c];
        added += 1;
        pos += 1;
      }
      if (pos >= len) ended = ENDED;
      if (checkJunk && added > 0) fail('quote_junk');
      field = value;
      fields.push(field);
      if (ended !== AT_COMMA) break;
    }

    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) { columns = fields; continue; }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  // The header is the columns when the header is on, and the rows hold the records after it.
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
