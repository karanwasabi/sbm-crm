import type { Editor } from 'grapesjs';
import { EMAIL_LOGO_URL } from '@/lib/email-branding';
import { getSbmLogoBlockContent } from '@/lib/email-mjml-starters';

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
  if (typeof result === 'string') {
    return result;
  }
  return result?.html ?? '';
}

export function loadStarterMjml(editor: Editor, mjml: string) {
  editor.setComponents(mjml.trim());
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
