import type { Component, Editor } from 'grapesjs';
import { EMAIL_LOGO_URL } from '@/lib/email-branding';
import { compileEditorHtmlWithDedupe, isMjmlTextComponent, reconcileMjmlTextComponent } from '@/lib/email-mjml-compile';
import { getSbmLogoBlockContent, ensureEmailLinksOpenInNewTab } from '@/lib/email-mjml-starters';

export async function uploadEmailAsset(file: File): Promise<{ src: string; name: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/comms/upload-image', {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as { url?: string; name?: string; error?: string } | null;
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error ?? 'Upload failed.');
  }

  return { src: payload.url, name: payload.name ?? file.name };
}

export async function fetchEmailAssets(): Promise<Array<{ src: string; name: string }>> {
  const response = await fetch('/api/comms/email-assets', { cache: 'no-store' });
  const payload = (await response.json().catch(() => null)) as {
    assets?: Array<{ src: string; name: string }>;
    error?: string;
  } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Failed to load assets.');
  }

  return payload?.assets ?? [];
}

export function compileEditorHtml(editor: Editor): string {
  return compileEditorHtmlWithDedupe(editor, () => {
    const result = editor.runCommand('mjml-code-to-html') as string | { html?: string } | undefined;
    const html = typeof result === 'string' ? result : (result?.html ?? '');
    return ensureEmailLinksOpenInNewTab(html);
  });
}

export function loadStarterMjml(editor: Editor, mjml: string) {
  editor.setComponents(mjml.trim());
}

export const CANVAS_DEVICES = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile portrait',
} as const;

export type CanvasDeviceId = keyof typeof CANVAS_DEVICES;

export function setEditorCanvasDevice(editor: Editor, device: CanvasDeviceId) {
  editor.setDevice(CANVAS_DEVICES[device]);
}

export function undoEditorChange(editor: Editor) {
  editor.runCommand('core:undo');
}

export function redoEditorChange(editor: Editor) {
  editor.runCommand('core:redo');
}

export function getEditorHistoryState(editor: Editor) {
  return {
    canUndo: editor.UndoManager.hasUndo(),
    canRedo: editor.UndoManager.hasRedo(),
  };
}

/** Drop init-time history so undo cannot revert to an empty canvas. */
export function resetEditorHistoryBaseline(editor: Editor) {
  editor.UndoManager.clear();
}

export function enableEditorComponentOutlines(editor: Editor) {
  if (!editor.Commands.isActive('core:component-outline')) {
    editor.runCommand('core:component-outline');
  }
}

export function stripBuiltInEditorChrome(editor: Editor) {
  if (!editor.Panels) return;

  const devicesPanel = editor.Panels.getPanel('devices-c');
  if (devicesPanel) {
    editor.Panels.removePanel(devicesPanel);
  }
}

export function registerSbmBlocks(editor: Editor) {
  editor.BlockManager.add('sbm-logo', {
    label: 'SBM Logo',
    category: 'Brand',
    content: getSbmLogoBlockContent(),
    attributes: { title: 'Slow Burn Method wordmark with homepage link' },
  });
}

export function protectLogoFromImageEditor(editor: Editor) {
  const command = editor.Commands.get('tui-image-editor');
  if (!command) return;

  const originalRun = command.run.bind(command);
  editor.Commands.add('tui-image-editor', {
    ...command.attributes,
    run(ed, sender, opts: { target?: unknown } = {}) {
      const target = (opts.target ?? ed.getSelected()) as {
        getAttributes?: () => Record<string, string>;
      } | null;
      const attrs = target?.getAttributes?.() ?? {};
      if (attrs['data-sbm-logo'] === 'true' || attrs.src === EMAIL_LOGO_URL) {
        ed.Modal.setTitle('SBM Logo');
        ed.Modal.setContent(
          '<p style="padding:16px;font-family:system-ui,sans-serif;color:#334155;">The brand logo cannot be cropped or rotated.</p>'
        );
        ed.Modal.open();
        return;
      }
      return originalRun(ed, sender, opts);
    },
  });
}

type TextComponentView = {
  getChildrenContainer?: () => HTMLElement;
  model?: Component;
  rteEnabled?: boolean;
  insertComponent?: (content: unknown, opts?: Record<string, unknown>) => Component | undefined;
};

type MergeTokenEditorState = {
  contentByComponentId: Map<string, string>;
  caretOffsetByComponentId: Map<string, number>;
  toolbarGuard: boolean;
  teardownCaretTracking?: () => void;
};

const MERGE_TOKEN_TEXT_TYPES = new Set(['mj-text', 'text', 'mj-button', 'link']);

/** GrapesJS wipes content on set() unless fromDisable is set — disableEditing syncs empty RTE output. */
const CONTENT_UPDATE_OPTS: Record<string, unknown> = { fromDisable: true };

const mergeTokenStateByEditor = new WeakMap<Editor, MergeTokenEditorState>();

function getMergeTokenState(editor: Editor): MergeTokenEditorState {
  let state = mergeTokenStateByEditor.get(editor);
  if (!state) {
    state = {
      contentByComponentId: new Map(),
      caretOffsetByComponentId: new Map(),
      toolbarGuard: false,
    };
    mergeTokenStateByEditor.set(editor, state);
  }
  return state;
}

function isMergeTokenTextComponent(component: Component): boolean {
  const type = component.get('type') as string;
  return MERGE_TOKEN_TEXT_TYPES.has(type) || component.is('text');
}

function findMergeTokenTarget(component: Component | null | undefined): Component | null {
  let current: Component | null | undefined = component;
  while (current && !current.is('wrapper')) {
    const type = current.get('type') as string;
    if (isMergeTokenTextComponent(current) || type === 'mj-image') {
      return current;
    }
    current = current.parent();
  }
  return null;
}

function readMergeTargetContent(component: Component): string {
  try {
    const inner = component.getInnerHTML();
    if (typeof inner === 'string' && inner.trim().length > 0) {
      return inner.trim();
    }
  } catch {
    // Fall through to other strategies.
  }

  const view = component.view as (TextComponentView & { el?: HTMLElement }) | undefined;
  const el = view?.getChildrenContainer?.();
  if (el) {
    const html = el.innerHTML.trim();
    if (html.length > 0) {
      return html;
    }
    const text = el.textContent?.trim() ?? '';
    if (text.length > 0) {
      return text;
    }
  }

  if (view?.el) {
    const inner = view.el.querySelector('td > div, td div, a, p');
    if (inner) {
      const html = inner.innerHTML.trim();
      if (html.length > 0) {
        return html;
      }
      const text = inner.textContent?.trim() ?? '';
      if (text.length > 0) {
        return text;
      }
    }
  }

  const stored = component.get('content');
  if (typeof stored === 'string' && stored.trim().length > 0) {
    return stored.trim();
  }

  const childText = component
    .components()
    .models.map((child: Component) => {
      if (child.get('type') === 'textnode') {
        return String(child.get('content') ?? '');
      }
      return '';
    })
    .join('')
    .trim();

  return childText;
}

function rememberMergeTargetContent(editor: Editor, component: Component | null | undefined) {
  const target = findMergeTokenTarget(component ?? undefined);
  if (!target) {
    return;
  }
  const content = readMergeTargetContent(target);
  if (!content.trim()) {
    return;
  }
  const state = getMergeTokenState(editor);
  const existing = state.contentByComponentId.get(target.getId()) ?? '';
  // Never replace a rich snapshot with a transient blank/partial sync.
  if (existing && htmlPlainLength(content) < htmlPlainLength(existing) / 2) {
    return;
  }
  state.contentByComponentId.set(target.getId(), content);
}

export function cacheAllMergeTargetContent(editor: Editor) {
  const wrapper = editor.getWrapper();
  if (!wrapper) {
    return;
  }

  for (const type of ['mj-text', 'mj-button', 'text'] as const) {
    for (const component of wrapper.findType(type)) {
      rememberMergeTargetContent(editor, component);
    }
  }
}

function formatMergeTokenInsertion(token: string): string {
  const trimmed = token.trim();
  return trimmed.endsWith(' ') ? trimmed : `${trimmed} `;
}

function getEditableElement(component: Component): HTMLElement | null {
  const view = component.view as (TextComponentView & { el?: HTMLElement }) | undefined;
  const el = view?.getChildrenContainer?.();
  if (el) {
    return el;
  }
  if (view?.el) {
    return view.el.querySelector('td > div, td div, a, p');
  }
  return null;
}

function isRteEnabledOnComponent(component: Component): boolean {
  const view = component.view as TextComponentView | undefined;
  return !!view?.rteEnabled;
}

function getTextOffset(root: Node, targetNode: Node, targetOffset: number): number {
  const walker = root.ownerDocument?.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  if (!walker) {
    return 0;
  }

  let offset = 0;
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (current === targetNode) {
      return offset + targetOffset;
    }
    offset += current.textContent?.length ?? 0;
  }
  return offset;
}

function saveCaretForTarget(editor: Editor, target: Component) {
  const el = getEditableElement(target);
  if (!el) {
    return;
  }

  const doc = el.ownerDocument;
  const sel = doc?.getSelection();
  if (!sel?.rangeCount) {
    return;
  }

  const range = sel.getRangeAt(0);
  if (!el.contains(range.commonAncestorContainer)) {
    return;
  }

  const offset = getTextOffset(el, range.startContainer, range.startOffset);
  getMergeTokenState(editor).caretOffsetByComponentId.set(target.getId(), offset);
}

function appendTokenPreservingHtml(html: string, insertion: string): string {
  if (!html.trim()) {
    return insertion;
  }

  const match = html.match(/((?:\s*<\/(?:div|p|h[1-6]|li|td|span|strong|em|b|i|a|font)>)+)\s*$/i);
  if (match && match.index !== undefined) {
    return `${html.slice(0, match.index)}${insertion}${html.slice(match.index)}`;
  }

  return `${html}${insertion}`;
}

function htmlPlainLength(html: string): number {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length;
}

/** Best non-empty HTML snapshot for a text block (DOM → model → cache). */
function resolveMergeTargetHtml(editor: Editor, component: Component): string {
  const state = getMergeTokenState(editor);
  const cached = state.contentByComponentId.get(component.getId()) ?? '';
  const fromDom = getEditableElement(component)?.innerHTML?.trim() ?? '';
  const fromModel = readMergeTargetContent(component);

  const candidates = [fromDom, fromModel, cached].filter((value) => value.trim().length > 0);
  if (candidates.length === 0) {
    return '';
  }

  // Prefer the richest snapshot — empty/partial DOM after focus loss must not win.
  return candidates.reduce((best, current) => (htmlPlainLength(current) > htmlPlainLength(best) ? current : best));
}

function commitMergeTargetHtml(editor: Editor, component: Component, html: string) {
  const trimmed = html.trim();
  if (!trimmed) {
    return;
  }

  const state = getMergeTokenState(editor);
  state.contentByComponentId.set(component.getId(), trimmed);

  // Never mutate model content while RTE owns the DOM — it races and can blank the block.
  if (isRteEnabledOnComponent(component)) {
    const el = getEditableElement(component);
    if (el) {
      el.innerHTML = trimmed;
    }
    return;
  }

  if (isMjmlTextComponent(component)) {
    reconcileMjmlTextComponent(component, { forceHtml: trimmed });
  } else {
    component.set('content', trimmed, CONTENT_UPDATE_OPTS);
    const el = getEditableElement(component);
    if (el && el.innerHTML !== trimmed) {
      el.innerHTML = trimmed;
    }
  }

  editor.trigger('component:update', component);
}

function insertIntoActiveRte(editor: Editor, insertion: string): boolean {
  const currentView = editor.RichTextEditor.model.get('currentView') as TextComponentView | undefined;
  if (!currentView?.rteEnabled) {
    return false;
  }

  const el = currentView.getChildrenContainer?.();
  if (!el) {
    return false;
  }

  const rte = (el as HTMLElement & { _rte?: { insertHTML: (value: string) => void } })._rte;
  if (!rte?.insertHTML) {
    return false;
  }

  rte.insertHTML(insertion);
  return true;
}

function insertMergeTokenAtPosition(editor: Editor, component: Component, token: string) {
  const insertion = formatMergeTokenInsertion(token);
  const state = getMergeTokenState(editor);

  // Snapshot BEFORE any insert/disable side effects.
  rememberMergeTargetContent(editor, component);
  const snapshot = resolveMergeTargetHtml(editor, component);
  if (snapshot) {
    state.contentByComponentId.set(component.getId(), snapshot);
  }

  const minPlainLength = Math.max(htmlPlainLength(snapshot), 1);

  // Try native RTE insert first (keeps caret). Verify it did not wipe the block.
  if (snapshot && insertIntoActiveRte(editor, insertion)) {
    const after = getEditableElement(component)?.innerHTML?.trim() ?? '';
    if (htmlPlainLength(after) >= minPlainLength && after.includes(insertion.trim())) {
      state.contentByComponentId.set(component.getId(), after);
      return;
    }
  }

  // Safe fallback: rewrite from snapshot + token (never from a possibly-empty live DOM).
  const next = appendTokenPreservingHtml(snapshot, insertion);
  commitMergeTargetHtml(editor, component, next);
  state.caretOffsetByComponentId.set(component.getId(), htmlPlainLength(next));
}

/**
 * Prevent GrapesJS from syncing empty RTE output when the toolbar is clicked, and
 * cache selected block text so merge tokens append instead of replacing content.
 */
export function installMergeTokenEditorSupport(editor: Editor): () => void {
  const state = getMergeTokenState(editor);

  const onComponentSelected = (component: Component) => {
    const target = findMergeTokenTarget(component) ?? component;
    rememberMergeTargetContent(editor, target);
    saveCaretForTarget(editor, target);

    if (!state.caretOffsetByComponentId.has(target.getId())) {
      const el = getEditableElement(target);
      const textLength = el?.textContent?.length ?? readMergeTargetContent(target).replace(/<[^>]+>/g, '').length;
      state.caretOffsetByComponentId.set(target.getId(), textLength);
    }
  };
  const onComponentUpdate = (component: Component) => {
    rememberMergeTargetContent(editor, component);
  };

  editor.on('component:selected', onComponentSelected);
  editor.on('component:update', onComponentUpdate);

  const trackCaretInFrame = () => {
    const frame = editor.Canvas.getFrameEl();
    const doc = frame?.contentDocument;
    if (!doc) {
      return;
    }

    const onSelectionChange = () => {
      const target = findMergeTokenTarget(editor.getSelected());
      if (target) {
        saveCaretForTarget(editor, target);
        rememberMergeTargetContent(editor, target);
      }
    };

    doc.addEventListener('selectionchange', onSelectionChange);
    doc.addEventListener('keyup', onSelectionChange);
    doc.addEventListener('mouseup', onSelectionChange);

    state.teardownCaretTracking = () => {
      doc.removeEventListener('selectionchange', onSelectionChange);
      doc.removeEventListener('keyup', onSelectionChange);
      doc.removeEventListener('mouseup', onSelectionChange);
    };
  };

  editor.on('load', trackCaretInFrame);
  trackCaretInFrame();

  const guardToolbarInteraction = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    // Keep RTE alive while using our toolbar OR the variable picker popover.
    if (!target.closest('.sbm-grapes-toolbar, [data-slot="popover-content"]')) {
      return;
    }
    const selected = findMergeTokenTarget(editor.getSelected());
    if (selected) {
      rememberMergeTargetContent(editor, selected);
    }
    state.toolbarGuard = true;
    window.setTimeout(() => {
      state.toolbarGuard = false;
    }, 1000);
  };

  document.addEventListener('mousedown', guardToolbarInteraction, true);
  document.addEventListener('pointerdown', guardToolbarInteraction, true);

  const hideRteToolbar = () => {
    editor.RichTextEditor.hideToolbar();
  };

  const rteModule = editor.RichTextEditor;
  const originalDisable = rteModule.disable.bind(rteModule);
  rteModule.disable = async (view, rte, opts) => {
    const component = view?.model as Component | undefined;
    let liveHtml = '';
    if (component && isMjmlTextComponent(component)) {
      rememberMergeTargetContent(editor, component);
      liveHtml = resolveMergeTargetHtml(editor, component);
    }

    // Variable picker / custom toolbar clicks steal focus. Skip disable so Grapes does not
    // sync an empty RTE buffer and wipe the block; just tuck the format bar away.
    if (state.toolbarGuard) {
      hideRteToolbar();
      return {};
    }

    const result = await originalDisable(view, rte, opts);

    if (component && isMjmlTextComponent(component)) {
      const after = getEditableElement(component)?.innerHTML?.trim() || readMergeTargetContent(component) || '';
      const cached = state.contentByComponentId.get(component.getId()) ?? '';
      const restore = htmlPlainLength(after) > 0 ? after : htmlPlainLength(liveHtml) > 0 ? liveHtml : cached;

      if (restore.trim()) {
        reconcileMjmlTextComponent(component, { forceHtml: restore });
        state.contentByComponentId.set(component.getId(), restore);
      }
    }

    hideRteToolbar();
    return result;
  };

  const onRteEnable = () => {
    window.setTimeout(() => {
      if (rteModule.model.get('currentView')) {
        const toolbar = rteModule.getToolbarEl();
        if (toolbar) {
          toolbar.style.display = '';
        }
        rteModule.updatePosition();
      }
    }, 0);
  };

  editor.on('rte:enable', onRteEnable);
  editor.on('rte:disable', hideRteToolbar);

  return () => {
    editor.off('component:selected', onComponentSelected);
    editor.off('component:update', onComponentUpdate);
    editor.off('load', trackCaretInFrame);
    editor.off('rte:enable', onRteEnable);
    editor.off('rte:disable', hideRteToolbar);
    state.teardownCaretTracking?.();
    document.removeEventListener('mousedown', guardToolbarInteraction, true);
    document.removeEventListener('pointerdown', guardToolbarInteraction, true);
    rteModule.disable = originalDisable;
    mergeTokenStateByEditor.delete(editor);
  };
}

export function insertMergeToken(editor: Editor, token: string) {
  const selected = editor.getSelected();
  const target = findMergeTokenTarget(selected);
  if (!target) {
    return;
  }

  const type = target.get('type') as string;
  if (type === 'mj-image') {
    const attributes = target.getAttributes?.() ?? {};
    if (typeof attributes.href === 'string') {
      target.addAttributes({ href: `${attributes.href}${token}` });
    }
    return;
  }

  const state = getMergeTokenState(editor);
  state.toolbarGuard = true;
  try {
    insertMergeTokenAtPosition(editor, target, token);
  } finally {
    window.setTimeout(() => {
      state.toolbarGuard = false;
    }, 1000);
  }

  if (selected !== target) {
    editor.select(target);
  }

  const rteModule = editor.RichTextEditor;
  if (rteModule.model.get('currentView')) {
    const toolbar = rteModule.getToolbarEl();
    if (toolbar) {
      toolbar.style.display = '';
    }
    rteModule.updatePosition();
  }
}

export function createAssetUploadHandler(editor: Editor) {
  return async (event: DragEvent | Event): Promise<void> => {
    const files =
      'dataTransfer' in event && event.dataTransfer
        ? event.dataTransfer.files
        : (event.target as HTMLInputElement | null)?.files;

    if (!files?.length) {
      return;
    }

    const uploads = await Promise.all(
      Array.from(files).map(async (file) => {
        const uploaded = await uploadEmailAsset(file);
        return { src: uploaded.src, name: uploaded.name, type: 'image' as const };
      })
    );

    editor.AssetManager.add(uploads);
  };
}

export type SidebarPanelId = 'open-blocks' | 'open-sm' | 'open-tm';

export type EditorPanelCommand = SidebarPanelId | 'open-assets' | 'open-tm';

const SIDEBAR_PANEL_IDS: SidebarPanelId[] = ['open-blocks', 'open-sm', 'open-tm'];

const TRAIT_PANEL_COMPONENT_TYPES = new Set(['mj-button', 'link', 'mj-image', 'mj-social-element']);

function readComponentHtml(component: Component): string {
  try {
    const inner = component.getInnerHTML();
    if (typeof inner === 'string' && inner.trim()) {
      return inner;
    }
  } catch {
    // Fall through.
  }
  const content = component.get('content');
  return typeof content === 'string' ? content : '';
}

function firstAnchorHref(html: string): string | null {
  const match = html.match(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["']/i);
  return match?.[1] ?? null;
}

function replaceFirstAnchorHref(html: string, href: string): string {
  if (!/<a\b/i.test(html)) {
    return html;
  }
  return html.replace(/<a\b([^>]*)>/i, (match, attrs: string) => {
    let nextAttrs = attrs;
    if (/\bhref\s*=/i.test(nextAttrs)) {
      nextAttrs = nextAttrs.replace(/\bhref\s*=\s*["'][^"']*["']/i, `href="${href}"`);
    } else {
      nextAttrs = `${nextAttrs.trimEnd()} href="${href}"`;
    }
    if (!/\btarget\s*=/i.test(nextAttrs)) {
      nextAttrs = `${nextAttrs.trimEnd()} target="_blank"`;
    }
    if (!/\brel\s*=/i.test(nextAttrs)) {
      nextAttrs = `${nextAttrs.trimEnd()} rel="noopener noreferrer"`;
    }
    const spacer = nextAttrs.trimStart();
    return `<a ${spacer}>`;
  });
}

const HREF_COMPONENT_TYPES = new Set(['mj-button', 'mj-image', 'mj-social-element', 'mj-navbar-link']);

const DEFAULT_LINK_REL = 'noopener noreferrer';
const DEFAULT_LINK_TARGET = '_blank';

function ensureComponentHrefTarget(component: Component) {
  const type = component.get('type') as string;
  if (!HREF_COMPONENT_TYPES.has(type)) {
    return;
  }

  const attrs = component.getAttributes();
  const href = attrs.href;
  if (typeof href !== 'string' || !href.trim()) {
    return;
  }

  const updates: Record<string, string> = {};
  if (attrs.target !== DEFAULT_LINK_TARGET) {
    updates.target = DEFAULT_LINK_TARGET;
  }
  if (typeof attrs.rel !== 'string' || !attrs.rel.includes('noopener')) {
    updates.rel = DEFAULT_LINK_REL;
  }

  if (Object.keys(updates).length > 0) {
    component.addAttributes(updates);
  }
}

function ensureTextComponentLinkTargets(component: Component) {
  const type = component.get('type') as string;
  if (type !== 'mj-text' && type !== 'text' && !component.is('text')) {
    return;
  }

  const html = readComponentHtml(component);
  if (!/<a\b/i.test(html)) {
    return;
  }

  const next = ensureEmailLinksOpenInNewTab(html);
  if (next !== html) {
    reconcileMjmlTextComponent(component, { forceHtml: next });
  }
}

function applyDefaultLinkTargets(component: Component) {
  ensureComponentHrefTarget(component);
  ensureTextComponentLinkTargets(component);
  component.components().forEach((child: Component) => applyDefaultLinkTargets(child));
}

/** Default all template links (buttons, images, inline text) to open in a new tab. */
export function installDefaultLinkTargetSupport(editor: Editor) {
  const onComponentAdd = (component: Component) => {
    applyDefaultLinkTargets(component);
  };

  const onHrefChange = (component: Component) => {
    ensureComponentHrefTarget(component);
  };

  const onComponentUpdate = (component: Component) => {
    ensureTextComponentLinkTargets(component);
  };

  editor.on('component:add', onComponentAdd);
  editor.on('component:update:attributes:href', onHrefChange);
  editor.on('component:update', onComponentUpdate);

  return {
    applyAll() {
      editor
        .getWrapper()
        ?.components()
        .forEach((component: Component) => applyDefaultLinkTargets(component));
    },
    teardown() {
      editor.off('component:add', onComponentAdd);
      editor.off('component:update:attributes:href', onHrefChange);
      editor.off('component:update', onComponentUpdate);
    },
  };
}

export function traitPanelComponent(component: Component | null | undefined): Component | null {
  let current: Component | null | undefined = component;
  while (current && !current.is('wrapper')) {
    const type = current.get('type') as string;
    if (TRAIT_PANEL_COMPONENT_TYPES.has(type)) {
      return current;
    }
    current = current.parent();
  }
  return null;
}

export function shouldOpenTraitsPanel(component: Component | null | undefined): boolean {
  if (traitPanelComponent(component)) {
    return true;
  }
  if (!component) {
    return false;
  }
  const type = component.get('type') as string;
  if (type === 'mj-text' || type === 'text' || component.is('text')) {
    return firstAnchorHref(readComponentHtml(component)) !== null;
  }
  return false;
}

export function showTraitsSidebar(editor: Editor, onComponentSelected?: () => void) {
  activateSidebarPanel(editor, 'open-tm');
  onComponentSelected?.();
}

function componentHasTrait(component: Component, name: string, type?: string): boolean {
  const traits = component.getTraits?.() ?? component.get('traits');
  if (!traits || !Array.isArray(traits)) {
    return false;
  }
  return traits.some((trait) => {
    const traitModel = trait as { get?: (key: string) => unknown; name?: string; type?: string };
    const traitNameValue =
      typeof traitModel.get === 'function' ? (traitModel.get('name') as string | undefined) : traitModel.name;
    const traitTypeValue =
      typeof traitModel.get === 'function' ? (traitModel.get('type') as string | undefined) : traitModel.type;
    if (traitNameValue === name) {
      return true;
    }
    return type ? traitTypeValue === type : false;
  });
}

/** Expose href / link URL editing in the trait (Settings) panel — hidden by custom toolbar until now. */
export function installEmailLinkEditingSupport(editor: Editor) {
  editor.TraitManager.addType('sbm-inline-link-href', {
    createInput({ component }) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'sbm-inline-link-href-input';
      input.placeholder = 'https://example.com or {{links.portal}}';

      const syncFromComponent = () => {
        input.value = firstAnchorHref(readComponentHtml(component)) ?? '';
      };

      syncFromComponent();
      input.addEventListener('change', () => {
        const current = readComponentHtml(component);
        const next = replaceFirstAnchorHref(current, input.value.trim());
        if (next !== current) {
          reconcileMjmlTextComponent(component, { forceHtml: next });
          editor.trigger('component:update', component);
        }
      });

      component.on('change:content', syncFromComponent);
      return input;
    },
  });

  editor.on('component:selected', (component) => {
    if (component.get('type') !== 'mj-text') {
      return;
    }
    if (!firstAnchorHref(readComponentHtml(component))) {
      return;
    }
    if (componentHasTrait(component, 'sbm-inline-link-href', 'sbm-inline-link-href')) {
      return;
    }
    const addTrait = component.addTrait as unknown as (trait: { type: string; label: string; name: string }) => void;
    addTrait({
      type: 'sbm-inline-link-href',
      label: 'Inline link URL',
      name: 'sbm-inline-link-href',
    });
  });
}

function isSidebarPanel(command: EditorPanelCommand): command is SidebarPanelId {
  return SIDEBAR_PANEL_IDS.includes(command as SidebarPanelId);
}

/** Activate a right-sidebar panel the same way a toolbar click would (syncs button + view). */
export function activateSidebarPanel(editor: Editor, command: SidebarPanelId) {
  const button = editor.Panels.getButton('views', command);
  if (button) {
    button.set('active', true);
    return;
  }
  editor.runCommand(command);
}

export function runEditorPanelCommand(editor: Editor, command: EditorPanelCommand) {
  if (isSidebarPanel(command)) {
    activateSidebarPanel(editor, command);
    return;
  }
  editor.runCommand(command);
}

/** Blocks open by default; style manager must be stopped or both panels stack in views-container. */
export function initializeEditorSidebar(editor: Editor) {
  for (const id of SIDEBAR_PANEL_IDS) {
    if (id === 'open-blocks') continue;
    const button = editor.Panels.getButton('views', id);
    if (button?.get('active')) {
      button.set('active', false);
    }
  }
  activateSidebarPanel(editor, 'open-blocks');
}

type EditorSelectionUxCallbacks = {
  onComponentSelected?: () => void;
  onComponentDeselected?: () => void;
  getEditorShellEl?: () => HTMLElement | null;
  getEditorContainerEl?: () => HTMLElement | null;
  isInteractive?: () => boolean;
};

function showBlocksSidebar(editor: Editor, onComponentDeselected?: () => void) {
  activateSidebarPanel(editor, 'open-blocks');
  onComponentDeselected?.();
}

function showStylesSidebar(editor: Editor, onComponentSelected?: () => void) {
  activateSidebarPanel(editor, 'open-sm');
  onComponentSelected?.();
}

/** Style manager on select, blocks on deselect; click-outside and canvas backdrop clear selection. */
export function configureEditorSelectionUx(editor: Editor, callbacks: EditorSelectionUxCallbacks = {}) {
  const { onComponentSelected, onComponentDeselected, getEditorShellEl, getEditorContainerEl, isInteractive } =
    callbacks;

  editor.on('component:selected', (component: Component) => {
    if (isInteractive && !isInteractive()) {
      return;
    }
    if (component.is('wrapper')) {
      editor.select();
      return;
    }
    if (shouldOpenTraitsPanel(component)) {
      showTraitsSidebar(editor, onComponentSelected);
      return;
    }
    showStylesSidebar(editor, onComponentSelected);
  });

  editor.on('component:deselected', () => {
    if (isInteractive && !isInteractive()) {
      return;
    }
    if (!editor.getSelected()) {
      showBlocksSidebar(editor, onComponentDeselected);
    }
  });

  const handleDocumentMouseDown = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.gjs-mdl-container')) return;

    const shell = getEditorShellEl?.();
    if (!shell || shell.contains(target)) return;

    if (editor.getSelected()) {
      editor.select();
    }
  };

  const handleContainerMouseDown = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('.gjs-cv-canvas')) return;
    if (target.closest('iframe, .gjs-pn-views-container, .gjs-toolbar')) return;

    const container = getEditorContainerEl?.();
    if (!container?.contains(target)) return;

    if (editor.getSelected()) {
      editor.select();
    }
  };

  document.addEventListener('mousedown', handleDocumentMouseDown);
  const container = getEditorContainerEl?.();
  container?.addEventListener('mousedown', handleContainerMouseDown);

  return () => {
    document.removeEventListener('mousedown', handleDocumentMouseDown);
    container?.removeEventListener('mousedown', handleContainerMouseDown);
  };
}

export async function uploadAndOpenAssets(editor: Editor, file: File) {
  const uploaded = await uploadEmailAsset(file);
  editor.AssetManager.add({ src: uploaded.src, name: uploaded.name, type: 'image' });
  editor.runCommand('open-assets');
  return uploaded;
}
