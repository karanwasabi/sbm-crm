import type { Component, Editor } from 'grapesjs';
import { isMjmlTextComponent, reconcileMjmlTextComponent } from '@/lib/email-mjml-compile';
import { sanitizeEmailRichHtml } from '@/lib/email-editor-typography';
import { emailCaretOffset, emailContentLength, placeEmailCaretAtOffset } from '@/lib/email-rich-text';

// Local copies — avoid importing email-editor-structure (circular via grapes-email-editor).
const MJML_LEAF_TYPES = new Set(['mj-text', 'mj-button', 'mj-image', 'mj-divider', 'mj-spacer']);
const MJML_CONTENT_TYPES = new Set([
  ...MJML_LEAF_TYPES,
  'mj-social',
  'mj-social-element',
  'mj-navbar',
  'mj-navbar-link',
  'mj-raw',
]);

function getComponentType(component: Component | null | undefined): string {
  if (!component) return '';
  return String(component.get('type') ?? '');
}

function isMjmlLeafComponent(component: Component | null | undefined): boolean {
  return MJML_LEAF_TYPES.has(getComponentType(component));
}

function isMjmlContentComponent(component: Component | null | undefined): boolean {
  return MJML_CONTENT_TYPES.has(getComponentType(component));
}

export type CanvasDeviceId = 'desktop' | 'tablet' | 'mobile';

export const CANVAS_DEVICE_LABELS = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile portrait',
} as const;

export type CanvasSessionPhase = 'idle' | 'selected' | 'editing' | 'flushing';

export type ChromeTargetKind = 'rte-toolbar' | 'structure-toolbar' | 'sbm-chrome' | 'outside' | 'canvas' | 'other';

type TextComponentView = {
  model: Component;
  rteEnabled?: boolean;
  el?: HTMLElement;
  disableEditing?: (opts?: Record<string, unknown>) => void | Promise<void>;
  onActive?: (ev?: Event) => void;
  getChildrenContainer?: () => HTMLElement | null;
  __sbmDisablePatched?: boolean;
};

type EditorModel = {
  setHovered?: (c: Component | null | undefined, opts?: { useValid?: boolean }) => void;
};

type CaretSnapshot = {
  componentId: string;
  offset: number;
  html: string;
};

type ScrollSnapshot = {
  x: number;
  y: number;
};

type CanvasLayerState = {
  phase: CanvasSessionPhase;
  /** Preserve Grapes disableEditing while interacting with safe parent chrome. */
  preserveEditing: boolean;
  lastEditableComponentId: string | null;
  caretByComponentId: Map<string, number>;
  contentByComponentId: Map<string, string>;
  pointer: { x: number; y: number; inFrame: boolean };
  redirectingHover: boolean;
  redirectingSelect: boolean;
  deviceId: CanvasDeviceId;
  frameDoc: Document | null;
  teardownFrame?: () => void;
  teardownParent?: () => void;
};

const MERGE_TOKEN_TEXT_TYPES = new Set(['mj-text', 'text', 'mj-button', 'link']);
const STRUCTURE_TYPES = new Set(['mj-section', 'mj-column', 'mj-group', 'mj-wrapper', 'mj-body', 'wrapper', 'mj-hero']);

const layerByEditor = new WeakMap<Editor, EmailCanvasLayer>();

export function getEmailCanvasLayer(editor: Editor): EmailCanvasLayer | null {
  return layerByEditor.get(editor) ?? null;
}

/** Pure classifier — unit-tested. RTE toolbar must NEVER flush. */
export function classifyChromeTarget(target: Element | null | undefined): ChromeTargetKind {
  if (!target) return 'other';
  if (target.closest('.gjs-rte-toolbar, .gjs-rte-action, .gjs-rte-actionbar')) {
    return 'rte-toolbar';
  }
  if (target.closest('.sbm-grapes-toolbar, [data-slot="popover-content"]')) {
    return 'sbm-chrome';
  }
  if (target.closest('.gjs-toolbar')) {
    return 'structure-toolbar';
  }
  if (target.closest('.gjs-cv-canvas, .gjs-frame, iframe.gjs-frame')) {
    return 'canvas';
  }
  if (target.closest('.sbm-grapes-editor, .gjs-editor')) {
    return 'other';
  }
  return 'outside';
}

function editorModel(editor: Editor): EditorModel | undefined {
  return (editor as Editor & { em?: EditorModel }).em;
}

function isMergeTokenTextComponent(component: Component): boolean {
  const type = String(component.get('type') ?? '');
  return MERGE_TOKEN_TEXT_TYPES.has(type) || component.is('text');
}

function findMergeTokenTarget(component: Component | null | undefined): Component | null {
  let current: Component | null | undefined = component;
  while (current && !current.is('wrapper')) {
    const type = String(current.get('type') ?? '');
    if (isMergeTokenTextComponent(current) || type === 'mj-image') {
      return current;
    }
    current = current.parent();
  }
  return null;
}

function findComponentById(editor: Editor, id: string | null | undefined): Component | null {
  if (!id) return null;
  try {
    return editor.Components.getById(id) || null;
  } catch {
    return null;
  }
}

function getEditableElement(component: Component): HTMLElement | null {
  const view = component.view as TextComponentView | undefined;
  const el = view?.getChildrenContainer?.();
  if (el) return el;
  if (view?.el) {
    return view.el.querySelector('td > div, td div, a, p');
  }
  return null;
}

function getTextOffset(root: Node, targetNode: Node, targetOffset: number): number {
  if (!(root instanceof HTMLElement)) return 0;
  return emailCaretOffset(root, targetNode, targetOffset);
}

function placeCaretAtTextOffset(root: HTMLElement, targetOffset: number): boolean {
  return placeEmailCaretAtOffset(root, targetOffset);
}

function readLiveHtml(component: Component): string {
  const el = getEditableElement(component);
  if (el?.innerHTML?.trim()) return el.innerHTML.trim();
  try {
    const inner = component.getInnerHTML();
    if (typeof inner === 'string' && inner.trim()) return inner.trim();
  } catch {
    // ignore
  }
  const stored = component.get('content');
  if (typeof stored === 'string' && stored.trim()) return stored.trim();
  return '';
}

function componentFromElement(editor: Editor, el: Element | null): Component | null {
  if (!el) return null;
  try {
    let node: Element | null = el;
    while (node) {
      const byId = editor.Components.getById((node as HTMLElement).id);
      if (byId) return byId;
      const maybe = (
        editor.Canvas as unknown as { getComponent?: (e: Element) => Component | undefined }
      ).getComponent?.(node);
      if (maybe) return maybe;
      node = node.parentElement;
    }
  } catch {
    // ignore
  }
  return null;
}

export function leafAtPoint(editor: Editor, clientX: number, clientY: number): Component | null {
  const doc = editor.Canvas.getDocument();
  if (!doc?.elementsFromPoint) return null;
  let stack: Element[];
  try {
    stack = doc.elementsFromPoint(clientX, clientY);
  } catch {
    return null;
  }
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    if (el.classList?.contains('gjs-highlighter') || el.classList?.contains('gjs-badge')) continue;
    const cmp = componentFromElement(editor, el);
    if (cmp && isMjmlLeafComponent(cmp)) return cmp;
  }
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    const cmp = componentFromElement(editor, el);
    if (cmp && isMjmlContentComponent(cmp)) return cmp;
  }
  return null;
}

function preferLeafOverStructure(component: Component | null, clientX: number, clientY: number): Component | null {
  if (!component) return null;
  if (isMjmlLeafComponent(component)) return component;
  const type = getComponentType(component);
  if (!STRUCTURE_TYPES.has(type) && type !== '') return component;

  const stack = [...component.components().models];
  while (stack.length) {
    const current = stack.pop()!;
    if (isMjmlLeafComponent(current)) {
      const el = current.getEl?.() ?? (current.view as { el?: HTMLElement } | undefined)?.el;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
          return current;
        }
      }
    }
    stack.push(...current.components().models);
  }

  const kids = component.components().models;
  if (kids.length === 1) {
    const only = kids[0]!;
    if (isMjmlLeafComponent(only)) return only;
    if (getComponentType(only) === 'mj-column' || getComponentType(only) === 'mj-group') {
      const nested = only.components().models;
      if (nested.length === 1 && isMjmlLeafComponent(nested[0]!)) return nested[0]!;
    }
  }
  return component;
}

function resolvePreferredTarget(
  editor: Editor,
  component: Component | null | undefined,
  clientX: number,
  clientY: number
): Component | null {
  if (!component) return null;
  return leafAtPoint(editor, clientX, clientY) ?? preferLeafOverStructure(component, clientX, clientY);
}

export class EmailCanvasLayer {
  private readonly editor: Editor;
  private readonly state: CanvasLayerState;
  private originalRteDisable: Editor['RichTextEditor']['disable'] | null = null;
  private preserveClearTimer: number | null = null;

  constructor(editor: Editor) {
    this.editor = editor;
    this.state = {
      phase: 'idle',
      preserveEditing: false,
      lastEditableComponentId: null,
      caretByComponentId: new Map(),
      contentByComponentId: new Map(),
      pointer: { x: 0, y: 0, inFrame: false },
      redirectingHover: false,
      redirectingSelect: false,
      deviceId: 'desktop',
      frameDoc: null,
    };
  }

  get phase(): CanvasSessionPhase {
    return this.state.phase;
  }

  get isEditing(): boolean {
    return this.state.phase === 'editing' || this.state.preserveEditing;
  }

  getCaret(): CaretSnapshot | null {
    const id = this.state.lastEditableComponentId;
    if (!id) return null;
    const offset = this.state.caretByComponentId.get(id);
    const html = this.state.contentByComponentId.get(id);
    if (offset === undefined || html === undefined) return null;
    return { componentId: id, offset, html };
  }

  /** Snapshot iframe scroll before layout-affecting work. */
  snapshotScroll(): ScrollSnapshot | null {
    const win = this.editor.Canvas.getFrameEl()?.contentWindow;
    if (!win) return null;
    return { x: win.scrollX, y: win.scrollY };
  }

  restoreScroll(snapshot: ScrollSnapshot | null) {
    if (!snapshot) return;
    const win = this.editor.Canvas.getFrameEl()?.contentWindow;
    if (!win) return;
    try {
      win.scrollTo(snapshot.x, snapshot.y);
    } catch {
      // ignore
    }
  }

  refreshCanvas() {
    const scroll = this.snapshotScroll();
    this.editor.refresh();
    window.requestAnimationFrame(() => this.restoreScroll(scroll));
  }

  setDevice(deviceId: CanvasDeviceId) {
    const scroll = this.snapshotScroll();
    this.state.deviceId = deviceId;
    this.editor.setDevice(CANVAS_DEVICE_LABELS[deviceId]);
    window.requestAnimationFrame(() => {
      this.restoreScroll(scroll);
      this.refreshCanvas();
    });
  }

  getDevice(): CanvasDeviceId {
    return this.state.deviceId;
  }

  rememberContent(component: Component | null | undefined) {
    const target = findMergeTokenTarget(component ?? undefined);
    if (!target || !isMergeTokenTextComponent(target)) return;
    const html = readLiveHtml(target);
    if (!html) return;
    this.state.contentByComponentId.set(target.getId(), html);
  }

  cacheAllTextContent() {
    const wrapper = this.editor.getWrapper();
    if (!wrapper) return;
    for (const type of ['mj-text', 'mj-button', 'text'] as const) {
      for (const component of wrapper.findType(type)) {
        this.rememberContent(component);
      }
    }
  }

  saveCaret(component: Component) {
    const el = getEditableElement(component);
    if (!el) return;
    const sel = el.ownerDocument?.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;
    this.state.caretByComponentId.set(component.getId(), getTextOffset(el, range.startContainer, range.startOffset));
    this.state.lastEditableComponentId = component.getId();
  }

  beginChromeInteraction(kind: ChromeTargetKind) {
    if (kind === 'rte-toolbar') {
      // Format bar must keep RTE alive — never flush, never set preserve that hides toolbar oddly.
      this.captureCaretFromSelection();
      return;
    }
    if (kind === 'sbm-chrome') {
      this.captureCaretFromSelection();
      // Only hold RTE open when a text session is actually active. Setting this while idle
      // left preserveEditing stuck true and blocked later double-click / structure toolbar.
      if (this.isActivelyEditing()) {
        this.state.preserveEditing = true;
        this.scheduleClearPreserveEditing();
      }
      return;
    }
    if (kind === 'structure-toolbar') {
      this.captureCaretFromSelection();
      void this.flushSession({ resume: false });
      return;
    }
    if (kind === 'outside') {
      void this.flushSession({ resume: false });
    }
  }

  endChromeInteraction() {
    this.clearPreserveEditing();
  }

  private isActivelyEditing(): boolean {
    const currentView = this.editor.RichTextEditor.model.get('currentView') as TextComponentView | undefined;
    if (currentView?.rteEnabled) return true;
    return this.state.phase === 'editing';
  }

  private clearPreserveEditing() {
    if (this.preserveClearTimer != null) {
      window.clearTimeout(this.preserveClearTimer);
      this.preserveClearTimer = null;
    }
    this.state.preserveEditing = false;
  }

  private scheduleClearPreserveEditing() {
    if (this.preserveClearTimer != null) {
      window.clearTimeout(this.preserveClearTimer);
    }
    // Clear after the chrome click finishes so format/variable pickers can keep focus briefly,
    // but never leave the flag stuck across the next canvas interaction.
    this.preserveClearTimer = window.setTimeout(() => {
      this.preserveClearTimer = null;
      this.state.preserveEditing = false;
    }, 0);
  }

  /** Recover if Grapes still thinks a view is editing after paste / chrome interactions. */
  private healStaleEditing() {
    this.clearPreserveEditing();
    const currentView = this.editor.RichTextEditor.model.get('currentView') as TextComponentView | undefined;
    // A live RTE session must not be torn down — only orphaned rteEnabled flags.
    if (currentView?.rteEnabled) return;

    const candidates = new Set<TextComponentView>();
    const selectedView = this.editor.getSelected()?.view as TextComponentView | undefined;
    if (selectedView) candidates.add(selectedView);
    const last = findComponentById(this.editor, this.state.lastEditableComponentId);
    const lastView = last?.view as TextComponentView | undefined;
    if (lastView) candidates.add(lastView);

    for (const view of candidates) {
      if (view.rteEnabled && view.disableEditing) {
        void view.disableEditing();
      }
    }

    if (this.state.phase === 'editing') {
      this.state.phase = this.editor.getSelected() ? 'selected' : 'idle';
    }
  }

  private captureCaretFromSelection() {
    const selected = findMergeTokenTarget(this.editor.getSelected());
    if (selected && isMergeTokenTextComponent(selected)) {
      this.saveCaret(selected);
      this.rememberContent(selected);
      return;
    }
    const last = findComponentById(this.editor, this.state.lastEditableComponentId);
    if (last) this.rememberContent(last);
  }

  async flushSession(options: { resume?: boolean } = {}) {
    if (this.state.phase === 'flushing') return;
    const currentView = this.editor.RichTextEditor.model.get('currentView') as TextComponentView | undefined;
    const active = currentView?.model ?? null;
    const last = findComponentById(this.editor, this.state.lastEditableComponentId);
    const component =
      (active && isMergeTokenTextComponent(active) ? active : null) ||
      (last && isMergeTokenTextComponent(last) ? last : null);
    if (!component) {
      this.state.phase = this.editor.getSelected() ? 'selected' : 'idle';
      return;
    }

    const view = (component.view as TextComponentView | undefined) ?? currentView;
    const caret = this.state.caretByComponentId.get(component.getId());
    const wasEditing = !!view?.rteEnabled;

    this.state.phase = 'flushing';
    this.rememberContent(component);
    if (wasEditing) this.saveCaret(component);

    this.clearPreserveEditing();
    try {
      if (view?.rteEnabled && view.disableEditing) {
        await view.disableEditing();
      }
    } finally {
      // Never restore a stale preserveEditing=true after a flush — that is what
      // left the canvas unable to leave text-edit mode after chrome clicks / paste.
      if (!options.resume) {
        this.clearPreserveEditing();
      }
    }

    this.rememberContent(component);
    const html = this.state.contentByComponentId.get(component.getId());
    if (html && isMjmlTextComponent(component)) {
      const clean = sanitizeEmailRichHtml(html);
      reconcileMjmlTextComponent(component, { forceHtml: clean || html });
      this.state.contentByComponentId.set(component.getId(), clean || html);
    }

    if (options.resume && wasEditing) {
      await this.ensureEditing(component);
      const el = getEditableElement(component);
      if (el && caret !== undefined) {
        placeCaretAtTextOffset(el, caret);
        this.state.caretByComponentId.set(component.getId(), caret);
      }
      el?.focus();
      this.state.phase = 'editing';
      return;
    }

    this.state.phase = this.editor.getSelected() ? 'selected' : 'idle';
  }

  async ensureEditing(component: Component): Promise<HTMLElement | null> {
    if (this.editor.getSelected() !== component) {
      this.editor.select(component);
    }
    const view = component.view as TextComponentView | undefined;
    if (!view) return getEditableElement(component);

    if (!view.rteEnabled) {
      try {
        view.onActive?.();
      } catch {
        // ignore
      }
      try {
        await this.editor.RichTextEditor.enable(view as never, undefined as never, {} as never);
      } catch {
        // ignore
      }
    }

    const el = getEditableElement(component);
    if (el && !el.isContentEditable) el.contentEditable = 'true';
    el?.focus();
    this.state.phase = 'editing';
    this.state.lastEditableComponentId = component.getId();
    return el;
  }

  async insertAtCaret(text: string): Promise<boolean> {
    const selected = findMergeTokenTarget(this.editor.getSelected());
    const target =
      selected && isMergeTokenTextComponent(selected)
        ? selected
        : findComponentById(this.editor, this.state.lastEditableComponentId);
    if (!target) return false;

    const type = String(target.get('type') ?? '');
    if (type === 'mj-image') {
      const attributes = target.getAttributes?.() ?? {};
      if (typeof attributes.href === 'string') {
        target.addAttributes({ href: `${attributes.href}${text}` });
        return true;
      }
      return false;
    }

    const insertion = text.trimEnd().endsWith(' ') ? text : `${text.trimEnd()} `;
    const caretBefore = this.state.caretByComponentId.get(target.getId());
    this.state.preserveEditing = true;
    try {
      this.patchDisableEditing(target.view as TextComponentView | undefined);
      const el = await this.ensureEditing(target);
      if (!el) return false;
      if (caretBefore !== undefined) {
        this.state.caretByComponentId.set(target.getId(), caretBefore);
      }
      const ok = this.insertTokenDom(target, el, insertion);
      if (!ok) {
        el.appendChild(el.ownerDocument.createTextNode(insertion));
        this.state.contentByComponentId.set(target.getId(), el.innerHTML);
        placeCaretAtTextOffset(el, emailContentLength(el));
      }
      if (!el.isContentEditable) el.contentEditable = 'true';
      el.focus();
      const rte = this.editor.RichTextEditor;
      if (rte.model.get('currentView')) {
        const toolbar = rte.getToolbarEl();
        if (toolbar) toolbar.style.display = '';
        rte.updatePosition();
      }
      return true;
    } finally {
      this.state.preserveEditing = false;
    }
  }

  private insertTokenDom(component: Component, el: HTMLElement, insertion: string): boolean {
    const doc = el.ownerDocument;
    if (!doc) return false;
    const savedOffset = this.state.caretByComponentId.get(component.getId());
    if (savedOffset !== undefined) {
      placeCaretAtTextOffset(el, savedOffset);
    } else {
      const sel = doc.getSelection();
      if (!sel?.rangeCount || !sel.anchorNode || !el.contains(sel.anchorNode)) {
        placeCaretAtTextOffset(el, emailContentLength(el));
      }
    }
    const selection = doc.getSelection();
    if (!selection?.rangeCount) return false;
    const range = selection.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return false;
    range.deleteContents();
    const textNode = doc.createTextNode(insertion);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    this.state.caretByComponentId.set(component.getId(), getTextOffset(el, textNode, textNode.data.length));
    this.state.lastEditableComponentId = component.getId();
    this.state.contentByComponentId.set(component.getId(), el.innerHTML);
    el.focus();
    return true;
  }

  private patchDisableEditing(view: TextComponentView | null | undefined) {
    if (!view?.disableEditing || view.__sbmDisablePatched) return;
    const original = view.disableEditing.bind(view);
    view.__sbmDisablePatched = true;
    view.disableEditing = async (opts?: Record<string, unknown>) => {
      if (this.state.preserveEditing) {
        this.editor.RichTextEditor.hideToolbar();
        const component = view.model;
        if (component && isMergeTokenTextComponent(component)) {
          this.saveCaret(component);
          this.rememberContent(component);
        }
        return;
      }
      return original(opts);
    };
  }

  private applyHoverableDefaults() {
    for (const type of MJML_LEAF_TYPES) {
      this.editor.Components.addType(type, {
        model: { defaults: { highlightable: true, hoverable: true, selectable: true } },
      });
    }
    for (const type of ['mj-section', 'mj-wrapper', 'mj-body', 'mj-group'] as const) {
      this.editor.Components.addType(type, {
        model: { defaults: { highlightable: false, hoverable: false } },
      });
    }
    this.editor.Components.addType('mj-column', {
      model: { defaults: { highlightable: true, hoverable: true } },
    });
  }

  private bindFrame() {
    this.state.teardownFrame?.();
    const doc = this.editor.Canvas.getDocument();
    if (!doc) {
      this.state.frameDoc = null;
      this.state.teardownFrame = undefined;
      return;
    }
    this.state.frameDoc = doc;

    const onPointerMove = (event: MouseEvent) => {
      this.state.pointer.x = event.clientX;
      this.state.pointer.y = event.clientY;
      this.state.pointer.inFrame = true;
    };
    const onPointerLeave = () => {
      this.state.pointer.inFrame = false;
    };
    const onSelectionChange = () => {
      const target = findMergeTokenTarget(this.editor.getSelected());
      if (!target || !isMergeTokenTextComponent(target)) return;
      const view = target.view as TextComponentView | undefined;
      if (!view?.rteEnabled) return;
      this.saveCaret(target);
      const el = getEditableElement(target);
      if (el?.innerHTML) this.state.contentByComponentId.set(target.getId(), el.innerHTML);
    };
    const onFrameBlur = () => {
      const target =
        findMergeTokenTarget(this.editor.getSelected()) ||
        findComponentById(this.editor, this.state.lastEditableComponentId);
      if (!target || !isMergeTokenTextComponent(target)) return;
      this.saveCaret(target);
      this.rememberContent(target);
    };
    const onFramePointerDown = (event: Event) => {
      const wasPreserving = this.state.preserveEditing;
      // Clear a leftover preserveEditing from chrome clicks so disableEditing can run.
      if (wasPreserving) {
        this.clearPreserveEditing();
      }

      const currentView = this.editor.RichTextEditor.model.get('currentView') as TextComponentView | undefined;
      if (!currentView) {
        this.healStaleEditing();
        return;
      }

      // If preserveEditing was stuck, clicks outside the active editable must force-exit RTE
      // so double-click / structure toolbar work again.
      if (!wasPreserving || !currentView.rteEnabled) return;
      const editable = getEditableElement(currentView.model);
      const target = event.target;
      if (editable && target instanceof Node && editable.contains(target)) return;
      if (currentView.disableEditing) {
        void currentView.disableEditing();
      }
      this.state.phase = this.editor.getSelected() ? 'selected' : 'idle';
    };

    doc.addEventListener('mousemove', onPointerMove, true);
    doc.addEventListener('mouseleave', onPointerLeave, true);
    doc.addEventListener('selectionchange', onSelectionChange);
    doc.addEventListener('keyup', onSelectionChange);
    doc.addEventListener('mouseup', onSelectionChange);
    doc.addEventListener('mousedown', onFramePointerDown, true);
    doc.addEventListener('dblclick', onFramePointerDown, true);
    doc.defaultView?.addEventListener('blur', onFrameBlur);

    this.state.teardownFrame = () => {
      doc.removeEventListener('mousemove', onPointerMove, true);
      doc.removeEventListener('mouseleave', onPointerLeave, true);
      doc.removeEventListener('selectionchange', onSelectionChange);
      doc.removeEventListener('keyup', onSelectionChange);
      doc.removeEventListener('mouseup', onSelectionChange);
      doc.removeEventListener('mousedown', onFramePointerDown, true);
      doc.removeEventListener('dblclick', onFramePointerDown, true);
      doc.defaultView?.removeEventListener('blur', onFrameBlur);
    };
  }

  private onParentPointerDown = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const kind = classifyChromeTarget(target);
    if (kind === 'rte-toolbar' || kind === 'sbm-chrome' || kind === 'structure-toolbar' || kind === 'outside') {
      this.beginChromeInteraction(kind);
    }
  };

  private onParentPointerUp = () => {
    if (!this.state.preserveEditing) return;
    this.scheduleClearPreserveEditing();
  };

  private onHoverBefore = (component: Component, opts: { abort?: boolean }) => {
    if (this.state.redirectingHover || !component || !this.state.pointer.inFrame) return;
    const preferred = resolvePreferredTarget(this.editor, component, this.state.pointer.x, this.state.pointer.y);
    if (!preferred || preferred === component) {
      const type = getComponentType(component);
      if (type === 'mj-section' || type === 'mj-wrapper' || type === 'mj-body') {
        opts.abort = true;
      }
      return;
    }
    if (!isMjmlLeafComponent(preferred) && !isMjmlContentComponent(preferred)) return;
    opts.abort = true;
    this.state.redirectingHover = true;
    try {
      editorModel(this.editor)?.setHovered?.(preferred, { useValid: false });
    } finally {
      this.state.redirectingHover = false;
    }
  };

  private onSelectBefore = (component: Component, opts: { abort?: boolean; event?: Event }) => {
    if (this.state.redirectingSelect || !component) return;
    const mouse = opts.event && 'clientX' in opts.event ? (opts.event as MouseEvent) : null;
    const x = mouse?.clientX ?? this.state.pointer.x;
    const y = mouse?.clientY ?? this.state.pointer.y;
    if (!mouse && !this.state.pointer.inFrame) return;
    const preferred = resolvePreferredTarget(this.editor, component, x, y);
    if (!preferred || preferred === component) return;
    if (!isMjmlLeafComponent(preferred) && !isMjmlContentComponent(preferred)) return;
    opts.abort = true;
    this.state.redirectingSelect = true;
    try {
      this.editor.select(preferred);
    } finally {
      this.state.redirectingSelect = false;
    }
  };

  private onRteEnable = (...args: unknown[]) => {
    // Grapes fires rte:enable before currentView is set; prefer the view from the event.
    const eventView = args[0] as TextComponentView | undefined;
    const currentView =
      eventView?.model != null
        ? eventView
        : ((this.editor.RichTextEditor.model.get('currentView') as TextComponentView | undefined) ?? undefined);
    this.clearPreserveEditing();
    this.patchDisableEditing(currentView);
    this.state.phase = 'editing';
    if (currentView?.model) {
      this.state.lastEditableComponentId = currentView.model.getId();
    }
    window.setTimeout(() => {
      const live = this.editor.RichTextEditor.model.get('currentView') as TextComponentView | undefined;
      if (live) this.patchDisableEditing(live);
      if (!live) return;
      const toolbar = this.editor.RichTextEditor.getToolbarEl();
      if (toolbar) toolbar.style.display = '';
      this.editor.RichTextEditor.updatePosition();
    }, 0);
  };

  private onRteDisable = () => {
    this.editor.RichTextEditor.hideToolbar();
    if (this.state.phase === 'flushing') return;
    if (!this.state.preserveEditing) {
      this.state.phase = this.editor.getSelected() ? 'selected' : 'idle';
    }
  };

  private onComponentSelected = (component: Component) => {
    const target = findMergeTokenTarget(component) ?? component;
    if (!isMergeTokenTextComponent(target) && String(target.get('type') ?? '') !== 'mj-image') return;
    this.rememberContent(target);
    this.saveCaret(target);
    if (this.state.phase !== 'editing') {
      this.state.phase = 'selected';
    }
  };

  private onFrameLoad = () => {
    this.bindFrame();
  };

  private onFrameUnload = () => {
    this.state.teardownFrame?.();
    this.state.teardownFrame = undefined;
    this.state.frameDoc = null;
  };

  install(): () => void {
    this.applyHoverableDefaults();

    const rte = this.editor.RichTextEditor;
    this.originalRteDisable = rte.disable.bind(rte);
    rte.disable = async (view, rteInst, opts) => {
      const component = view?.model as Component | undefined;
      if (component && isMjmlTextComponent(component)) {
        const snapshot =
          getEditableElement(component)?.innerHTML?.trim() ||
          this.state.contentByComponentId.get(component.getId()) ||
          readLiveHtml(component);
        if (snapshot) this.state.contentByComponentId.set(component.getId(), snapshot);
      }

      if (this.state.preserveEditing) {
        rte.hideToolbar();
        return {};
      }

      const result = await this.originalRteDisable!(view, rteInst, opts);

      if (component && isMjmlTextComponent(component)) {
        const after = getEditableElement(component)?.innerHTML?.trim() || readLiveHtml(component);
        const restore = after.trim() ? after : this.state.contentByComponentId.get(component.getId()) || '';
        if (restore.trim()) {
          const clean = sanitizeEmailRichHtml(restore);
          reconcileMjmlTextComponent(component, { forceHtml: clean || restore });
          this.state.contentByComponentId.set(component.getId(), clean || restore);
        }
      }

      rte.hideToolbar();
      return result;
    };

    document.addEventListener('mousedown', this.onParentPointerDown, true);
    document.addEventListener('pointerdown', this.onParentPointerDown, true);
    document.addEventListener('mouseup', this.onParentPointerUp, true);
    document.addEventListener('pointerup', this.onParentPointerUp, true);

    this.editor.on('canvas:frame:load', this.onFrameLoad);
    this.editor.on('canvas:frame:unload', this.onFrameUnload);
    this.editor.on('load', this.onFrameLoad);
    this.editor.on('component:hover:before', this.onHoverBefore as never);
    this.editor.on('component:select:before', this.onSelectBefore as never);
    this.editor.on('component:selected', this.onComponentSelected);
    this.editor.on('rte:enable', this.onRteEnable as never);
    this.editor.on('rte:disable', this.onRteDisable);

    this.bindFrame();

    return () => this.teardown();
  }

  teardown() {
    this.clearPreserveEditing();
    this.state.teardownFrame?.();
    document.removeEventListener('mousedown', this.onParentPointerDown, true);
    document.removeEventListener('pointerdown', this.onParentPointerDown, true);
    document.removeEventListener('mouseup', this.onParentPointerUp, true);
    document.removeEventListener('pointerup', this.onParentPointerUp, true);
    this.editor.off('canvas:frame:load', this.onFrameLoad);
    this.editor.off('canvas:frame:unload', this.onFrameUnload);
    this.editor.off('load', this.onFrameLoad);
    this.editor.off('component:hover:before', this.onHoverBefore as never);
    this.editor.off('component:select:before', this.onSelectBefore as never);
    this.editor.off('component:selected', this.onComponentSelected);
    this.editor.off('rte:enable', this.onRteEnable as never);
    this.editor.off('rte:disable', this.onRteDisable);
    if (this.originalRteDisable) {
      this.editor.RichTextEditor.disable = this.originalRteDisable;
      this.originalRteDisable = null;
    }
    layerByEditor.delete(this.editor);
  }
}

export function installEmailCanvasLayer(editor: Editor): EmailCanvasLayer {
  const existing = layerByEditor.get(editor);
  if (existing) {
    existing.teardown();
  }
  const layer = new EmailCanvasLayer(editor);
  layerByEditor.set(editor, layer);
  layer.install();
  return layer;
}
