import type { Component, Editor } from 'grapesjs';
import { EMAIL_LOGO_URL } from '@/lib/email-branding';
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
  const result = editor.runCommand('mjml-code-to-html') as string | { html?: string } | undefined;
  const html = typeof result === 'string' ? result : (result?.html ?? '');
  return ensureEmailLinksOpenInNewTab(html);
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

export function insertMergeToken(editor: Editor, token: string) {
  const selected = editor.getSelected();
  if (!selected) return;

  const type = selected.get('type');
  if (type === 'mj-text') {
    const current = (selected.get('content') as string | undefined) ?? '';
    const spacer = current.length > 0 && !current.endsWith(' ') ? ' ' : '';
    selected.set('content', `${current}${spacer}${token}`);
    return;
  }

  if (type === 'mj-button') {
    const current = (selected.get('content') as string | undefined) ?? '';
    const spacer = current.length > 0 && !current.endsWith(' ') ? ' ' : '';
    selected.set('content', `${current}${spacer}${token}`);
    return;
  }

  const attributes = selected.getAttributes?.() ?? {};
  if (type === 'mj-image' && typeof attributes.href === 'string') {
    selected.addAttributes({ href: `${attributes.href}${token}` });
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

export type SidebarPanelId = 'open-blocks' | 'open-sm' | 'open-layers';

export type EditorPanelCommand = SidebarPanelId | 'open-assets' | 'open-tm';

const SIDEBAR_PANEL_IDS: SidebarPanelId[] = ['open-blocks', 'open-sm', 'open-layers'];

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
  const { onComponentSelected, onComponentDeselected, getEditorShellEl, getEditorContainerEl } = callbacks;

  editor.on('component:selected', (component: Component) => {
    if (component.is('wrapper')) {
      editor.select();
      return;
    }
    showStylesSidebar(editor, onComponentSelected);
  });

  editor.on('component:deselected', () => {
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
