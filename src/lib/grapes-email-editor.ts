import type { Component, Editor } from 'grapesjs';
import { EMAIL_LOGO_URL } from '@/lib/email-branding';
import { type CanvasDeviceId, getEmailCanvasLayer, installEmailCanvasLayer } from '@/lib/email-canvas-layer';
import { compileEditorHtmlWithDedupe, reconcileMjmlTextComponent } from '@/lib/email-mjml-compile';
import { getSbmLogoBlockContent, ensureEmailLinksOpenInNewTab } from '@/lib/email-mjml-starters';

export type { CanvasDeviceId };
export { installEmailCanvasLayer, getEmailCanvasLayer };

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

export function setEditorCanvasDevice(editor: Editor, device: CanvasDeviceId) {
  const layer = getEmailCanvasLayer(editor);
  if (layer) {
    layer.setDevice(device);
    return;
  }
  editor.setDevice(CANVAS_DEVICES[device]);
}

/** Scroll-preserving canvas refresh. */
export function refreshEditorCanvas(editor: Editor) {
  const layer = getEmailCanvasLayer(editor);
  if (layer) {
    layer.refreshCanvas();
    return;
  }
  editor.refresh();
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

/** Commit active RTE via the canvas layer (scroll/focus-safe). */
export async function flushActiveTextEditing(editor: Editor, options: { resumeEditing?: boolean } = {}) {
  const layer = getEmailCanvasLayer(editor);
  if (layer) {
    await layer.flushSession({ resume: options.resumeEditing });
    return;
  }
}

export function cacheAllMergeTargetContent(editor: Editor) {
  getEmailCanvasLayer(editor)?.cacheAllTextContent();
}

/**
 * Merge-token / RTE chrome is owned by the canvas layer.
 * Kept as a no-op installer for call-site compatibility.
 */
export function installMergeTokenEditorSupport(_editor: Editor): () => void {
  return () => {};
}

export async function insertMergeToken(editor: Editor, token: string) {
  const layer = getEmailCanvasLayer(editor);
  if (!layer) return;
  const trimmed = token.trim();
  const insertion = trimmed.endsWith(' ') ? trimmed : `${trimmed} `;
  await layer.insertAtCaret(insertion);
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
  /** When true (default), keep Blocks open on select if Blocks is already the active sidebar. */
  keepBlocksSticky?: boolean;
  /**
   * When false, deselection will not force the Blocks panel open.
   * Used after the user manually picks Styles/Settings so the sidebar doesn't snap back.
   */
  shouldAutoShowBlocksOnDeselect?: () => boolean;
};

function showBlocksSidebar(editor: Editor, onComponentDeselected?: () => void) {
  activateSidebarPanel(editor, 'open-blocks');
  onComponentDeselected?.();
}

function showStylesSidebar(editor: Editor, onComponentSelected?: () => void) {
  activateSidebarPanel(editor, 'open-sm');
  onComponentSelected?.();
}

function isSidebarPanelActive(editor: Editor, id: SidebarPanelId): boolean {
  return Boolean(editor.Panels.getButton('views', id)?.get('active'));
}

/** Style/traits on select only when not browsing Blocks; Blocks on deselect; click-outside clears selection. */
export function configureEditorSelectionUx(editor: Editor, callbacks: EditorSelectionUxCallbacks = {}) {
  const {
    onComponentSelected,
    onComponentDeselected,
    getEditorShellEl,
    getEditorContainerEl,
    isInteractive,
    keepBlocksSticky = true,
    shouldAutoShowBlocksOnDeselect,
  } = callbacks;

  editor.on('component:selected', (component: Component) => {
    if (isInteractive && !isInteractive()) {
      return;
    }
    if (component.is('wrapper')) {
      editor.select();
      return;
    }

    // Stay on Blocks while inserting/browsing blocks — yanking to Styles hides new drops.
    if (keepBlocksSticky && isSidebarPanelActive(editor, 'open-blocks')) {
      onComponentSelected?.();
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
      // Don't yank back to Blocks when the user explicitly opened Styles/Settings.
      if (shouldAutoShowBlocksOnDeselect && !shouldAutoShowBlocksOnDeselect()) {
        onComponentDeselected?.();
        return;
      }
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
