import { describe, expect, it } from 'vitest';
import {
  getComponentType,
  insertContentBelowSelection,
  isMjmlLeafComponent,
  moveComponentBy,
  wrapOrphanContentUnderBody,
} from './email-editor-structure';

type FakeCmp = {
  _type: string;
  _id: string;
  _parent: FakeCmp | null;
  _kids: FakeCmp[];
  is: (name: string) => boolean;
  get: (key: string) => unknown;
  getId: () => string;
  parent: () => FakeCmp | null;
  components: () => FakeCollection;
  append: (htmlOrCmp: string | FakeCmp, opts?: { at?: number }) => FakeCmp | FakeCmp[];
  remove: () => void;
};

type FakeCollection = {
  models: FakeCmp[];
  length: number;
  indexOf: (c: FakeCmp) => number;
  at: (i: number) => FakeCmp | undefined;
  remove: (c: FakeCmp, _opts?: unknown) => void;
  add: (c: FakeCmp, opts?: { at?: number }) => FakeCmp;
  filter: (fn: (c: FakeCmp) => boolean) => FakeCmp[];
  find: (fn: (c: FakeCmp) => boolean) => FakeCmp | undefined;
};

let idSeq = 0;

function makeCollection(owner: FakeCmp): FakeCollection {
  const col: FakeCollection = {
    get models() {
      return owner._kids;
    },
    get length() {
      return owner._kids.length;
    },
    indexOf(c) {
      return owner._kids.indexOf(c);
    },
    at(i) {
      return owner._kids[i];
    },
    remove(c) {
      const i = owner._kids.indexOf(c);
      if (i >= 0) owner._kids.splice(i, 1);
      c._parent = null;
    },
    add(c, opts) {
      // Grapes re-parents on add: detach from the previous parent first.
      if (c._parent && c._parent !== owner) {
        c._parent.components().remove(c);
      }
      c._parent = owner;
      const at = opts?.at ?? owner._kids.length;
      owner._kids.splice(at, 0, c);
      return c;
    },
    filter(fn) {
      return owner._kids.filter(fn);
    },
    find(fn) {
      return owner._kids.find(fn);
    },
  };
  return col;
}

function makeCmp(type: string, kids: FakeCmp[] = []): FakeCmp {
  const cmp: FakeCmp = {
    _type: type,
    _id: `c${++idSeq}`,
    _parent: null,
    _kids: [],
    is(name) {
      return name === 'wrapper' ? type === 'wrapper' : false;
    },
    get(key) {
      if (key === 'type') return type;
      if (key === 'tagName') return type;
      return undefined;
    },
    getId() {
      return this._id;
    },
    parent() {
      return this._parent;
    },
    components() {
      return makeCollection(this);
    },
    append(htmlOrCmp, opts) {
      if (typeof htmlOrCmp !== 'string') {
        return this.components().add(htmlOrCmp, opts);
      }
      // Minimal MJML parse for tests we care about
      if (htmlOrCmp.includes('<mj-section') && htmlOrCmp.includes('<mj-column')) {
        const section = makeCmp('mj-section');
        const column = makeCmp('mj-column');
        section.components().add(column);
        if (htmlOrCmp.includes('<mj-text')) {
          column.components().add(makeCmp('mj-text'));
        }
        if (htmlOrCmp.includes('<mj-button')) {
          column.components().add(makeCmp('mj-button'));
        }
        if (htmlOrCmp.includes('<mj-divider')) {
          column.components().add(makeCmp('mj-divider'));
        }
        this.components().add(section, opts);
        return section;
      }
      if (htmlOrCmp.includes('<mj-text')) {
        const text = makeCmp('mj-text');
        this.components().add(text, opts);
        return text;
      }
      if (htmlOrCmp.includes('<mj-button')) {
        const button = makeCmp('mj-button');
        this.components().add(button, opts);
        return button;
      }
      if (htmlOrCmp.includes('<mj-divider')) {
        const divider = makeCmp('mj-divider');
        this.components().add(divider, opts);
        return divider;
      }
      if (htmlOrCmp.includes('<mj-section') && !htmlOrCmp.includes('<mj-column')) {
        const section = makeCmp('mj-section');
        this.components().add(section, opts);
        return section;
      }
      const fallback = makeCmp('mj-raw');
      this.components().add(fallback, opts);
      return fallback;
    },
    remove() {
      this._parent?.components().remove(this);
    },
  };
  for (const kid of kids) {
    cmp.components().add(kid);
  }
  return cmp;
}

function orderTypes(parent: FakeCmp): string[] {
  return parent._kids.map((k) => k._type);
}

describe('email-editor-structure helpers', () => {
  it('classifies leaf content types', () => {
    expect(isMjmlLeafComponent(makeCmp('mj-text') as never)).toBe(true);
    expect(isMjmlLeafComponent(makeCmp('mj-section') as never)).toBe(false);
    expect(getComponentType(makeCmp('mj-button') as never)).toBe('mj-button');
  });

  it('moves a text block down within a column', () => {
    const column = makeCmp('mj-column');
    const a = makeCmp('mj-text');
    const b = makeCmp('mj-button');
    const c = makeCmp('mj-text');
    column.components().add(a);
    column.components().add(b);
    column.components().add(c);

    moveComponentBy(a as never, 1);
    expect(orderTypes(column)).toEqual(['mj-button', 'mj-text', 'mj-text']);
    expect(column._kids[1]).toBe(a);
  });

  it('moves a text block up within a column', () => {
    const column = makeCmp('mj-column');
    const a = makeCmp('mj-text');
    const b = makeCmp('mj-button');
    column.components().add(a);
    column.components().add(b);

    moveComponentBy(b as never, -1);
    expect(orderTypes(column)).toEqual(['mj-button', 'mj-text']);
    expect(column._kids[0]).toBe(b);
  });

  it('crosses into the previous section when moving up from the first slot', () => {
    const body = makeCmp('mj-body');
    const section1 = makeCmp('mj-section');
    const section2 = makeCmp('mj-section');
    const col1 = makeCmp('mj-column');
    const col2 = makeCmp('mj-column');
    const greeting = makeCmp('mj-text');
    const later = makeCmp('mj-text');
    col1.components().add(greeting);
    col2.components().add(later);
    section1.components().add(col1);
    section2.components().add(col2);
    body.components().add(section1);
    body.components().add(section2);

    moveComponentBy(later as never, -1);
    expect(orderTypes(col1)).toEqual(['mj-text', 'mj-text']);
    expect(col1._kids[1]).toBe(later);
    expect(orderTypes(col2)).toEqual([]);
  });

  it('inserts text below the selected content in the same column', () => {
    const body = makeCmp('mj-body');
    const section = makeCmp('mj-section');
    const column = makeCmp('mj-column');
    const greeting = makeCmp('mj-text');
    const button = makeCmp('mj-button');
    column.components().add(greeting);
    column.components().add(button);
    section.components().add(column);
    body.components().add(section);

    const ed = {
      getSelected: () => button,
      getWrapper: () => null,
    };

    const inserted = insertContentBelowSelection(ed as never, 'text');
    expect(inserted).toBeTruthy();
    expect(orderTypes(column)).toEqual(['mj-text', 'mj-button', 'mj-text']);
    expect(column._kids[2]?._type).toBe('mj-text');
  });

  it('wraps orphan content under mj-body into a section/column', () => {
    const body = makeCmp('mj-body');
    const orphan = makeCmp('mj-text');
    body.components().add(orphan);

    const editor = { getWrapper: () => null };
    wrapOrphanContentUnderBody(editor as never, orphan as never);

    expect(body._kids).toHaveLength(1);
    expect(body._kids[0]?._type).toBe('mj-section');
    const section = body._kids[0]!;
    expect(section._kids[0]?._type).toBe('mj-column');
    expect(section._kids[0]?._kids[0]).toBe(orphan);
  });
});
