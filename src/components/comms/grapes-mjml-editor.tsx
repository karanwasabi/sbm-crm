'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import type { Editor } from 'grapesjs';
import grapesjs from 'grapesjs';
import grapesjsMjml from 'grapesjs-mjml';
import grapesjsTuiImageEditor from 'grapesjs-tui-image-editor';
import 'grapesjs/dist/css/grapes.min.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { saveEmailTemplateAction, sendEmailTemplateTestAction } from '@/app/(crm)/communications/actions';
import {
  compileEditorHtml,
  createAssetUploadHandler,
  fetchEmailAssets,
  insertMergeToken,
  loadStarterMjml,
  protectLogoFromImageEditor,
  registerSbmBlocks,
} from '@/lib/grapes-email-editor';
import { getStarterMjml, isGrapesProjectData, stripHtmlToText } from '@/lib/email-mjml-starters';
import { EMAIL_VARIABLES, type EmailTemplateClassification } from '@/lib/email-template-types';
import type { EmailTemplate } from '@/utils/api';

type GrapesMjmlEditorProps = {
  template?: EmailTemplate;
  staffEmail?: string;
};

export function GrapesMjmlEditor({ template, staffEmail }: GrapesMjmlEditorProps) {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState(template?.htmlCompiled ?? '');

  const [name, setName] = useState(template?.name ?? 'New email template');
  const [classification, setClassification] = useState<EmailTemplateClassification>(
    template?.classification ?? 'marketing'
  );
  const [subject, setSubject] = useState(template?.subject ?? 'A quick note from Slow Burn Method');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>(template?.status ?? 'draft');
  const [testEmail, setTestEmail] = useState(staffEmail ?? '');

  useEffect(() => {
    if (!containerRef.current || editorRef.current) {
      return;
    }

    let disposed = false;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: '640px',
      width: 'auto',
      fromElement: false,
      storageManager: false,
      noticeOnUnload: false,
      assetManager: {
        upload: false,
        autoAdd: true,
        assets: [],
      },
      deviceManager: {
        devices: [
          { id: 'desktop', name: 'Desktop', width: '' },
          { id: 'mobile', name: 'Mobile', width: '375px', widthMedia: '480px' },
        ],
      },
      plugins: [grapesjsMjml, grapesjsTuiImageEditor],
      pluginsOpts: {
        'grapesjs-mjml': {
          resetDevices: true,
          resetBlocks: true,
          resetStyleManager: true,
        },
        'grapesjs-tui-image-editor': {
          upload: true,
          addToAssets: true,
        },
      },
    });

    editorRef.current = editor;
    registerSbmBlocks(editor);
    protectLogoFromImageEditor(editor);

    const uploadHandler = createAssetUploadHandler(editor);
    editor.AssetManager.config.uploadFile = uploadHandler;

    const refreshPreview = () => {
      try {
        setPreviewHtml(compileEditorHtml(editor));
      } catch {
        // Editor may not be ready yet.
      }
    };

    editor.on('update', refreshPreview);
    editor.on('load', refreshPreview);

    void (async () => {
      try {
        const assets = await fetchEmailAssets();
        if (!disposed) {
          editor.AssetManager.add(assets.map((asset) => ({ ...asset, type: 'image' })));
        }
      } catch {
        // Bucket may not exist until migration is applied.
      }

      if (disposed) return;

      if (template?.contentJson && isGrapesProjectData(template.contentJson)) {
        editor.loadProjectData(template.contentJson);
      } else {
        loadStarterMjml(editor, getStarterMjml(classification));
      }

      refreshPreview();
    })();

    return () => {
      disposed = true;
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once; template/classification seed only on first mount
  }, []);

  function applyClassificationStarter(next: EmailTemplateClassification) {
    const editor = editorRef.current;
    if (!editor || template?.id) {
      setClassification(next);
      return;
    }

    setClassification(next);
    loadStarterMjml(editor, getStarterMjml(next));
    setPreviewHtml(compileEditorHtml(editor));
  }

  function buildSavePayload() {
    const editor = editorRef.current;
    if (!editor) {
      throw new Error('Editor is not ready yet.');
    }

    const htmlCompiled = compileEditorHtml(editor);
    return {
      name: name.trim(),
      classification,
      subject: subject.trim(),
      contentJson: editor.getProjectData() as Record<string, unknown>,
      htmlCompiled,
      textCompiled: stripHtmlToText(htmlCompiled),
      status,
    };
  }

  function handleSave() {
    setError(null);
    setMessage(null);

    if (!name.trim()) {
      setError('Template name is required.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = buildSavePayload();
        const saved = await saveEmailTemplateAction(template?.id ?? null, payload);
        setMessage('Template saved.');
        if (!template?.id) {
          router.replace(`/communications/templates/${saved.id}`);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save template.');
      }
    });
  }

  function handleTestSend() {
    setError(null);
    setMessage(null);

    if (!testEmail.trim()) {
      setError('Enter an email address for the test send.');
      return;
    }

    startTransition(async () => {
      try {
        let templateId = template?.id ?? null;
        if (!templateId) {
          const saved = await saveEmailTemplateAction(null, buildSavePayload());
          templateId = saved.id;
          router.replace(`/communications/templates/${saved.id}`);
        } else {
          await saveEmailTemplateAction(templateId, buildSavePayload());
        }

        await sendEmailTemplateTestAction(templateId, testEmail.trim());
        setMessage(`Test email sent to ${testEmail.trim()}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send test email.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-4 p-4">
        <SectionHead title="Template settings" subtitle="Name, classification, and subject line" />
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-800"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-800"
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            Classification
            <select
              value={classification}
              onChange={(event) => applyClassificationStarter(event.target.value as EmailTemplateClassification)}
              className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-800"
            >
              <option value="transactional">transactional</option>
              <option value="marketing">marketing</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-800"
            />
          </label>
        </div>
      </Card>

      <Card className="gap-3 p-4">
        <SectionHead title="Merge tags" subtitle="Select a text or button block, then insert a variable" />
        <div className="flex flex-wrap gap-2">
          {EMAIL_VARIABLES.map((variable) => (
            <button
              key={variable.token}
              type="button"
              onClick={() => {
                const editor = editorRef.current;
                if (!editor) return;
                insertMergeToken(editor, variable.token);
                setPreviewHtml(compileEditorHtml(editor));
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:border-brand/40"
            >
              {variable.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <SectionHead
          className="px-4 pt-4"
          title="Email designer"
          subtitle="MJML blocks, asset library, and image editor"
        />
        <div ref={containerRef} className="min-h-[640px] border-t border-slate-100" />
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-3 p-4">
          <SectionHead title="Preview" subtitle="Compiled HTML (mobile + desktop in designer above)" />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <iframe title="Email preview" srcDoc={previewHtml} className="h-[480px] w-full bg-white" />
          </div>
        </Card>

        <Card className="gap-3 p-4">
          <SectionHead title="Test send" subtitle="Saves first, then sends via Resend" />
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            Send to
            <input
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="you@slowburnmethod.in"
              className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-800"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleSave} disabled={isPending}>
              Save template
            </Button>
            <Button type="button" variant="light" onClick={handleTestSend} disabled={isPending}>
              <Send className="mr-1.5 h-4 w-4" />
              Send test
            </Button>
          </div>
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
        </Card>
      </div>
    </div>
  );
}
