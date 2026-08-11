'use client';

import { type ReactNode, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Archive, Monitor, Palette, Redo2, Save, Settings, Smartphone, Tablet, Undo2 } from 'lucide-react';
import type { Editor } from 'grapesjs';
import grapesjs from 'grapesjs';
import grapesjsMjml from 'grapesjs-mjml';
import grapesjsTuiImageEditor from 'grapesjs-tui-image-editor';
import 'grapesjs/dist/css/grapes.min.css';
import '@/components/comms/grapes-font-awesome.css';
import '@/components/comms/grapes-editor.css';
import { EmailVariablesPicker, insertTokenIntoInput } from '@/components/comms/email-variables-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { Skeleton } from '@/components/loading/skeleton';
import { saveEmailTemplateAction } from '@/app/(crm)/communications/actions';
import { commsTemplateHref } from '@/lib/comms-channel';
import {
  compileEditorHtml,
  cacheAllMergeTargetContent,
  configureEditorSelectionUx,
  createAssetUploadHandler,
  enableEditorComponentOutlines,
  fetchEmailAssets,
  flushActiveTextEditing,
  getEditorHistoryState,
  initializeEditorSidebar,
  insertMergeToken,
  installDefaultLinkTargetSupport,
  installEmailLinkEditingSupport,
  installMergeTokenEditorSupport,
  loadStarterMjml,
  protectLogoFromImageEditor,
  redoEditorChange,
  registerSbmBlocks,
  resetEditorHistoryBaseline,
  runEditorPanelCommand,
  setEditorCanvasDevice,
  shouldOpenTraitsPanel,
  stripBuiltInEditorChrome,
  undoEditorChange,
  type CanvasDeviceId,
  type SidebarPanelId,
} from '@/lib/grapes-email-editor';
import {
  emailFromDomain,
  emailFromLocalPartPlaceholder,
  emailFromNamePlaceholder,
  formatEmailFromAddress,
  normalizeEmailLocalPart,
} from '@/lib/email-branding';
import { substitutePreviewVariables } from '@/lib/email-preview-vars';
import { getStarterMjml, isGrapesProjectData, stripHtmlToText } from '@/lib/email-mjml-starters';
import {
  emailVariablesForClassification,
  type EmailTemplateClassification,
  type EmailTemplateStatus,
} from '@/lib/email-template-types';
import { toTitleCase } from '@/lib/title-case';
import { cn } from '@/lib/cn';
import type { EmailTemplate } from '@/utils/api';

type GrapesMjmlEditorProps = {
  template?: EmailTemplate;
};

type PreviewDevice = CanvasDeviceId;

const CLASSIFICATION_OPTIONS: Array<{ id: EmailTemplateClassification; label: string }> = [
  { id: 'marketing', label: 'Marketing' },
  { id: 'transactional', label: 'Transactional' },
];

const CLASSIFICATION_HELP: Record<EmailTemplateClassification, string> = {
  marketing: 'Promotional — only for contacts with marketing consent.',
  transactional: 'Account and program updates — not promotional.',
};

const CANVAS_DEVICE_OPTIONS: Array<{ id: CanvasDeviceId; label: string; icon: typeof Monitor }> = [
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
];

const PREVIEW_DEVICE_MAX_WIDTH: Record<CanvasDeviceId, string> = {
  desktop: 'max-w-3xl',
  tablet: 'max-w-[600px]',
  mobile: 'max-w-[375px]',
};

const SIDEBAR_TAB_OPTIONS: Array<{ id: SidebarPanelId; label: string; icon: typeof LayoutGrid }> = [
  { id: 'open-blocks', label: 'Blocks', icon: LayoutGrid },
  { id: 'open-sm', label: 'Styles', icon: Palette },
  { id: 'open-tm', label: 'Settings', icon: Settings },
];

type SegmentedOption<T extends string> = {
  id: T;
  label: string;
  icon?: typeof Monitor;
};

function SegmentedSwitcher<T extends string>({
  value,
  options,
  onChange,
  disabled,
  size = 'md',
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (id: T) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5',
        size === 'sm' ? 'gap-0' : 'gap-0.5'
      )}
      role="tablist"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-all',
              size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
              active
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 disabled:opacity-50'
            )}
          >
            {Icon ? <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ToolbarIconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors',
        'hover:bg-slate-200/60 hover:text-slate-900',
        'disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent disabled:hover:text-slate-400'
      )}
    >
      {children}
    </button>
  );
}

export function GrapesMjmlEditor({ template }: GrapesMjmlEditorProps) {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const editorReadyRef = useRef(false);
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const subjectInputRef = useRef<HTMLInputElement | null>(null);
  const applyLinkTargetsRef = useRef<(() => void) | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState(() => substitutePreviewVariables(template?.htmlCompiled ?? ''));
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [canvasDevice, setCanvasDevice] = useState<CanvasDeviceId>('desktop');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarPanelId>('open-blocks');

  const [name, setName] = useState(template?.name ?? 'New email template');
  const [classification, setClassification] = useState<EmailTemplateClassification>(
    template?.classification ?? 'marketing'
  );
  const [subject, setSubject] = useState(template?.subject ?? 'A quick note from Slow Burn Method');
  const [fromName, setFromName] = useState(template?.fromName ?? '');
  const [fromLocalPart, setFromLocalPart] = useState(template?.fromLocalPart ?? '');
  const [templateStatus, setTemplateStatus] = useState<EmailTemplateStatus>(
    template?.status === 'archived' ? 'archived' : 'active'
  );

  const previewSubject = substitutePreviewVariables(subject);
  const previewFrom = formatEmailFromAddress(classification, fromName, fromLocalPart);
  const fromDomain = emailFromDomain(classification);
  const templateVariables = emailVariablesForClassification(classification);

  function refreshHistoryState(editor: Editor) {
    const history = getEditorHistoryState(editor);
    setCanUndo(history.canUndo);
    setCanRedo(history.canRedo);
  }

  function refreshPreview(editor: Editor) {
    try {
      setPreviewHtml(substitutePreviewVariables(compileEditorHtml(editor)));
    } catch {
      // Editor may not be ready yet.
    }
  }

  async function buildSavePayload(status: 'active' | 'archived' = 'active') {
    const editor = editorRef.current;
    if (!editor) {
      throw new Error('Editor is not ready yet.');
    }

    await flushActiveTextEditing(editor);
    const htmlCompiled = compileEditorHtml(editor);
    return {
      name: name.trim(),
      classification,
      subject: subject.trim(),
      fromName: fromName.trim() || null,
      fromLocalPart: fromLocalPart.trim() || null,
      contentJson: editor.getProjectData() as Record<string, unknown>,
      htmlCompiled,
      textCompiled: stripHtmlToText(htmlCompiled),
      status,
    };
  }

  useEffect(() => {
    if (!containerRef.current || editorRef.current) {
      return;
    }

    let disposed = false;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: '720px',
      width: 'auto',
      fromElement: false,
      storageManager: false,
      noticeOnUnload: false,
      showOffsets: false,
      richTextEditor: {
        // Keep a simple formatting bar (users aren't expected to know Cmd+B / Cmd+I).
        actions: ['bold', 'italic', 'underline', 'link'],
      },
      undoManager: {
        trackSelection: false,
      },
      assetManager: {
        upload: false,
        autoAdd: true,
        assets: [],
      },
      plugins: [grapesjsMjml, grapesjsTuiImageEditor],
      pluginsOpts: {
        'grapesjs-mjml': {
          resetDevices: true,
          resetBlocks: true,
          resetStyleManager: true,
          useCustomTheme: false,
        },
        'grapesjs-tui-image-editor': {
          upload: true,
          addToAssets: true,
        },
      },
      panels: {
        defaults: [
          { id: 'commands', buttons: [] },
          { id: 'options', buttons: [] },
          {
            id: 'views',
            buttons: [
              {
                id: 'open-sm',
                className: 'fa fa-paint-brush',
                command: 'open-sm',
                active: false,
                togglable: false,
                attributes: { title: 'Styles' },
              },
              {
                id: 'open-tm',
                className: 'fa fa-cog',
                command: 'open-tm',
                togglable: false,
                attributes: { title: 'Settings' },
              },
              {
                id: 'open-blocks',
                className: 'fa fa-th-large',
                command: 'open-blocks',
                active: true,
                togglable: false,
                attributes: { title: 'Blocks' },
              },
            ],
          },
        ],
      },
    });

    editorRef.current = editor;
    editor.UndoManager.stop();
    registerSbmBlocks(editor);
    protectLogoFromImageEditor(editor);
    const linkTargetSupport = installDefaultLinkTargetSupport(editor);
    applyLinkTargetsRef.current = () => linkTargetSupport.applyAll();
    const teardownMergeTokens = installMergeTokenEditorSupport(editor);
    const teardownSelectionUx = configureEditorSelectionUx(editor, {
      getEditorShellEl: () => editorShellRef.current,
      getEditorContainerEl: () => containerRef.current,
      isInteractive: () => editorReadyRef.current,
      onComponentSelected: () => {
        if (!editorReadyRef.current) {
          return;
        }
        const selected = editor.getSelected();
        setSidebarTab(selected && shouldOpenTraitsPanel(selected) ? 'open-tm' : 'open-sm');
      },
      onComponentDeselected: () => {
        if (editorReadyRef.current) {
          setSidebarTab('open-blocks');
        }
      },
    });

    const uploadHandler = createAssetUploadHandler(editor);
    editor.AssetManager.config.uploadFile = uploadHandler;

    editor.on('update', () => {
      refreshPreview(editor);
      refreshHistoryState(editor);
    });
    editor.on('load', () => {
      stripBuiltInEditorChrome(editor);
      enableEditorComponentOutlines(editor);
      refreshPreview(editor);
      refreshHistoryState(editor);
      // Recalculate highlighter positions after layout settles.
      window.requestAnimationFrame(() => editor.refresh());
    });
    const onWindowResize = () => {
      editor.refresh();
    };
    window.addEventListener('resize', onWindowResize);

    for (const panelId of ['open-blocks', 'open-sm', 'open-tm'] as const) {
      editor.on(`run:${panelId}`, () => setSidebarTab(panelId));
    }

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

      try {
        if (template?.contentJson && isGrapesProjectData(template.contentJson)) {
          editor.loadProjectData(template.contentJson);
        } else {
          loadStarterMjml(editor, getStarterMjml(classification));
        }
      } catch (loadError) {
        console.error('Failed to load email template into editor', loadError);
        loadStarterMjml(editor, getStarterMjml(classification));
      }

      installEmailLinkEditingSupport(editor);
      linkTargetSupport.applyAll();

      refreshPreview(editor);
      stripBuiltInEditorChrome(editor);
      enableEditorComponentOutlines(editor);
      initializeEditorSidebar(editor);
      setEditorCanvasDevice(editor, 'desktop');
      setCanvasDevice('desktop');
      resetEditorHistoryBaseline(editor);
      cacheAllMergeTargetContent(editor);
      editor.UndoManager.start();
      refreshHistoryState(editor);
      setSidebarTab('open-blocks');
      editorReadyRef.current = true;
      setEditorReady(true);
    })();

    return () => {
      disposed = true;
      editorReadyRef.current = false;
      applyLinkTargetsRef.current = null;
      setEditorReady(false);
      window.removeEventListener('resize', onWindowResize);
      teardownMergeTokens();
      linkTargetSupport.teardown();
      teardownSelectionUx();
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  function applyClassificationStarter(next: EmailTemplateClassification) {
    const editor = editorRef.current;
    if (!editor || template?.id) {
      setClassification(next);
      return;
    }

    setClassification(next);
    loadStarterMjml(editor, getStarterMjml(next));
    applyLinkTargetsRef.current?.();
    refreshPreview(editor);
  }

  function openSidebarTab(tab: SidebarPanelId) {
    const editor = editorRef.current;
    if (!editor) return;
    setSidebarTab(tab);
    runEditorPanelCommand(editor, tab);
  }

  function handleCanvasDevice(device: CanvasDeviceId) {
    const editor = editorRef.current;
    if (!editor) return;
    setEditorCanvasDevice(editor, device);
    setCanvasDevice(device);
  }

  function handleUndo() {
    const editor = editorRef.current;
    if (!editor || !canUndo) return;
    undoEditorChange(editor);
    refreshPreview(editor);
    refreshHistoryState(editor);
  }

  function handleRedo() {
    const editor = editorRef.current;
    if (!editor || !canRedo) return;
    redoEditorChange(editor);
    refreshPreview(editor);
    refreshHistoryState(editor);
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
        const wasArchived = templateStatus === 'archived';
        const payload = await buildSavePayload('active');
        const saved = await saveEmailTemplateAction(template?.id ?? null, payload);
        setTemplateStatus('active');
        setMessage(wasArchived ? 'Template activated.' : 'Template saved.');
        if (!template?.id) {
          router.replace(commsTemplateHref('email', saved.id));
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save template.');
      }
    });
  }

  function handleArchive() {
    setError(null);
    setMessage(null);

    if (!template?.id) {
      return;
    }

    if (!name.trim()) {
      setError('Template name is required.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = await buildSavePayload('archived');
        await saveEmailTemplateAction(template.id, payload);
        setTemplateStatus('archived');
        setMessage('Template archived.');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to archive template.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-4 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Classification</span>
                {template?.id && templateStatus === 'active' ? <Pill tone="success">Active</Pill> : null}
                {template?.id && templateStatus === 'archived' ? <Pill tone="neutral">Archived</Pill> : null}
              </div>
              <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="shrink-0">
                  <SegmentedSwitcher
                    value={classification}
                    options={CLASSIFICATION_OPTIONS}
                    onChange={applyClassificationStarter}
                    disabled={!!template?.id}
                  />
                  {template?.id ? (
                    <span className="mt-1 block text-[11px] font-medium text-slate-400">Locked after save</span>
                  ) : null}
                </div>
                <p className="max-w-md text-sm leading-snug font-medium text-slate-500">
                  {CLASSIFICATION_HELP[classification]}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {template?.id && templateStatus === 'active' ? (
                <Button
                  type="button"
                  variant="light"
                  leftIcon={<Archive className="h-4 w-4" />}
                  onClick={handleArchive}
                  disabled={isPending}
                  loading={isPending}
                  loadingLabel="Archiving…"
                >
                  Archive
                </Button>
              ) : null}
              <Button
                type="button"
                variant="primary"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={handleSave}
                disabled={isPending}
                loading={isPending}
                loadingLabel="Saving…"
              >
                {templateStatus === 'archived' ? 'Save & activate' : 'Save'}
              </Button>
            </div>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-800 ring-brand/20 outline-none focus:ring-2"
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="email-template-subject" className="text-sm font-semibold text-slate-700">
                Subject
              </label>
              <EmailVariablesPicker
                variables={templateVariables}
                label="Add variable"
                tip="Tip: click in the subject first to insert at the cursor."
                onInsert={(token) => {
                  insertTokenIntoInput(subjectInputRef.current, token, setSubject);
                }}
              />
            </div>
            <input
              id="email-template-subject"
              ref={subjectInputRef}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-800 ring-brand/20 outline-none focus:ring-2"
            />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
              From name
              <input
                value={fromName}
                onChange={(event) => setFromName(toTitleCase(event.target.value))}
                placeholder={emailFromNamePlaceholder()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-800 ring-brand/20 outline-none focus:ring-2"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
              From address
              <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white ring-brand/20 focus-within:ring-2">
                <input
                  value={fromLocalPart}
                  onChange={(event) => setFromLocalPart(normalizeEmailLocalPart(event.target.value))}
                  placeholder={emailFromLocalPartPlaceholder(classification)}
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 font-medium text-slate-800 outline-none"
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <span className="shrink-0 border-l border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
                  @{fromDomain}
                </span>
              </div>
            </label>
          </div>
          <p className="text-xs font-medium text-slate-400">
            Leave blank to use the default sender for this classification.
          </p>
        </div>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      </Card>

      <div ref={editorShellRef}>
        <Card className="p-0">
          <div className="sbm-grapes-toolbar">
            <SegmentedSwitcher
              value={canvasDevice}
              options={CANVAS_DEVICE_OPTIONS}
              onChange={handleCanvasDevice}
              disabled={!editorReady}
              size="sm"
            />

            <div className="sbm-grapes-toolbar-divider" aria-hidden />

            <div className="flex shrink-0 items-center gap-0.5">
              <ToolbarIconButton label="Undo" disabled={!editorReady || !canUndo} onClick={handleUndo}>
                <Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              </ToolbarIconButton>
              <ToolbarIconButton label="Redo" disabled={!editorReady || !canRedo} onClick={handleRedo}>
                <Redo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              </ToolbarIconButton>
            </div>

            <div className="sbm-grapes-toolbar-divider" aria-hidden />

            <div className="sbm-grapes-toolbar-variables">
              <EmailVariablesPicker
                variables={templateVariables}
                disabled={!editorReady}
                onInsert={(token) => {
                  const editor = editorRef.current;
                  if (!editor) return;
                  void insertMergeToken(editor, token).then(() => {
                    // Do not flush/disable here — that recreates the freeze. Canvas already
                    // shows the token; preview/save commit via real disableEditing later.
                    refreshPreview(editor);
                  });
                }}
              />
            </div>

            <div className="sbm-grapes-toolbar-sidebar">
              <SegmentedSwitcher
                value={sidebarTab}
                options={SIDEBAR_TAB_OPTIONS}
                onChange={openSidebarTab}
                disabled={!editorReady}
                size="sm"
              />
            </div>
          </div>

          <div className="relative">
            <div ref={containerRef} className="sbm-grapes-editor" />
            {!editorReady ? (
              <div className="absolute inset-0 bg-white" aria-hidden>
                <Skeleton className="h-full w-full rounded-none" />
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="gap-4 p-4">
        <SectionHead
          title="Preview"
          right={
            <SegmentedSwitcher
              value={previewDevice}
              options={CANVAS_DEVICE_OPTIONS}
              onChange={setPreviewDevice}
              size="sm"
            />
          }
        />
        <div className="flex justify-center overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
          <div
            className={cn(
              'w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-[max-width] duration-200',
              PREVIEW_DEVICE_MAX_WIDTH[previewDevice]
            )}
          >
            <div className="space-y-2 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-sm">
                <span className="font-semibold text-slate-500">From</span>
                <span className="font-medium text-slate-800">{previewFrom}</span>
                <span className="font-semibold text-slate-500">Subject</span>
                <span className="font-medium text-slate-800">{previewSubject || '—'}</span>
              </div>
            </div>
            <iframe
              title="Email preview"
              srcDoc={previewHtml}
              sandbox=""
              className="block h-[min(720px,75vh)] w-full border-0 bg-white"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
