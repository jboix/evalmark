/**
 * A small, tolerant XML reader for test reports: elements, attributes, text, CDATA and entities.
 * It skips comments, processing instructions and doctypes, and closes unclosed elements rather
 * than failing, as reports written by hand or cut short are common.
 */

/** An element with its attributes, child elements and text. */
export interface XmlElement {
  /** Its name, such as `testcase`. */
  readonly name: string;
  /** Its attributes, decoded. */
  readonly attributes: Readonly<Record<string, string>>;
  /** Its child elements, in order. */
  readonly children: XmlElement[];
  /** Its text and CDATA, decoded and concatenated. */
  text: string;
}

/** The reader's position and open elements. */
interface ReaderState {
  /** The source. */
  readonly source: string;
  /** The next character to read. */
  index: number;
  /** The open elements, the document first. */
  readonly stack: XmlElement[];
}

/** The predefined entities. */
const namedEntities: Readonly<Record<string, string>> = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
};

/**
 * Decodes entity and character references. An unknown reference is kept as it is.
 *
 * @param text - The raw text.
 * @returns The decoded text.
 */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (whole, reference: string) => {
    if (reference.startsWith('#x'))
      return String.fromCodePoint(Number.parseInt(reference.slice(2), 16));
    if (reference.startsWith('#'))
      return String.fromCodePoint(Number.parseInt(reference.slice(1), 10));
    return namedEntities[reference] ?? whole;
  });
}

/**
 * Reads the attributes of a start tag.
 *
 * @param text - The tag's text after its name.
 * @returns The attributes, decoded.
 */
function attributesOf(text: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of text.matchAll(/([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attributes[match[1] ?? ''] = decodeEntities(match[2] ?? match[3] ?? '');
  }
  return attributes;
}

/**
 * The element being filled.
 *
 * @param state - The reader.
 * @returns The innermost open element.
 */
function current(state: ReaderState): XmlElement {
  return state.stack.at(-1) ?? (state.stack[0] as XmlElement);
}

/**
 * Moves past a construct that ends with a marker, or to the end of the source.
 *
 * @param state - The reader.
 * @param marker - The marker, such as `-->`.
 * @returns The text between the current position and the marker.
 */
function readUntil(state: ReaderState, marker: string): string {
  const end = state.source.indexOf(marker, state.index);
  const stop = end === -1 ? state.source.length : end;
  const text = state.source.slice(state.index, stop);
  state.index = end === -1 ? stop : end + marker.length;
  return text;
}

/**
 * Reads a tag's text up to its closing `>`, which may not be inside a quoted attribute value.
 *
 * @param state - The reader, after the tag's `<`.
 * @returns The text between `<` and `>`.
 */
function readTagText(state: ReaderState): string {
  const start = state.index;
  const quoted = /(?:[^>"']+|"[^"]*"|'[^']*')*/y;
  quoted.lastIndex = start;
  quoted.exec(state.source);
  const close = state.source.indexOf('>', quoted.lastIndex);
  const end = close === -1 ? state.source.length : close;
  state.index = close === -1 ? end : end + 1;
  return state.source.slice(start, end);
}

/**
 * Reads a start or end tag, opening or closing an element. An end tag closes up to the matching
 * open element and is ignored when none matches.
 *
 * @param state - The reader, at the tag's `<`.
 */
function readTag(state: ReaderState): void {
  state.index += 1;
  const tag = readTagText(state);
  if (tag.startsWith('/')) {
    const name = tag.slice(1).trim();
    const open = state.stack.findLastIndex((element) => element.name === name);
    if (open > 0) state.stack.length = open;
    return;
  }
  const name = /^[^\s/>]+/.exec(tag)?.[0] ?? '';
  const element: XmlElement = {
    name,
    attributes: attributesOf(tag.slice(name.length)),
    children: [],
    text: '',
  };
  current(state).children.push(element);
  if (!tag.trimEnd().endsWith('/')) state.stack.push(element);
}

/**
 * Reads the construct at a `<`: a comment, CDATA, a processing instruction, a doctype or a tag.
 *
 * @param state - The reader, at a `<`.
 */
function readMarkup(state: ReaderState): void {
  const at = (marker: string): boolean => state.source.startsWith(marker, state.index);
  if (at('<!--')) {
    state.index += 4;
    readUntil(state, '-->');
  } else if (at('<![CDATA[')) {
    state.index += 9;
    current(state).text += readUntil(state, ']]>');
  } else if (at('<?') || at('<!')) {
    readUntil(state, '>');
  } else {
    readTag(state);
  }
}

/**
 * Parses an XML document.
 *
 * @param source - The document.
 * @returns A root element named `#document` whose children are the document's elements.
 */
export function parseXml(source: string): XmlElement {
  const document: XmlElement = { name: '#document', attributes: {}, children: [], text: '' };
  const state: ReaderState = { source, index: 0, stack: [document] };
  while (state.index < source.length) {
    const next = source.indexOf('<', state.index);
    const stop = next === -1 ? source.length : next;
    if (stop > state.index) current(state).text += decodeEntities(source.slice(state.index, stop));
    state.index = stop;
    if (next !== -1) readMarkup(state);
  }
  return document;
}

/**
 * The child elements with a name.
 *
 * @param element - The parent.
 * @param name - The name.
 * @returns The children with that name, in order.
 */
export function childrenNamed(element: XmlElement, name: string): XmlElement[] {
  return element.children.filter((child) => child.name === name);
}

/**
 * Every element with a name under an element, nested ones included.
 *
 * @param element - Where to look.
 * @param name - The name.
 * @returns The matching elements, in document order.
 */
export function descendantsNamed(element: XmlElement, name: string): XmlElement[] {
  return element.children.flatMap((child) => [
    ...(child.name === name ? [child] : []),
    ...descendantsNamed(child, name),
  ]);
}
