import type { Editor } from 'grapesjs';
import {
  getComponentType,
  insertContentBelowSelection,
  isMjmlContentComponent,
  revealComponent,
  type InsertContentKind,
} from '@/lib/email-editor-structure';

const BODY_TEXT =
  '<mj-text color="#475569" font-size="16px" line-height="1.6" padding-top="8px" padding-bottom="8px">Write your message here.</mj-text>';

const BODY_BUTTON =
  '<mj-button background-color="#0f766e" color="#ffffff" href="https://slowburnmethod.in" target="_blank" rel="noopener noreferrer" border-radius="999px">Watch the full episode</mj-button>';

/** Plugin options helper for grapesjs-mjml `block(id)` curation. */
export function grapesMjmlBlockOptions(blockId: string): Record<string, unknown> {
  switch (blockId) {
    case 'mj-text':
      return {
        label: 'Text',
        content: BODY_TEXT,
        activate: true,
        select: true,
        attributes: { title: 'Insert a text paragraph' },
      };
    case 'mj-button':
      return {
        label: 'Button',
        content: BODY_BUTTON,
        activate: false,
        select: true,
        attributes: { title: 'Insert a button' },
      };
    case 'mj-1-column':
      return {
        label: 'New section',
        content: `<mj-section padding="8px 0"><mj-column>${BODY_TEXT}</mj-column></mj-section>`,
        select: true,
        attributes: { title: 'Add a new section with one column' },
      };
    case 'mj-divider':
      return {
        label: 'Divider',
        content: '<mj-divider border-color="#e2e8f0"/>',
        select: true,
      };
    case 'mj-image':
      return {
        label: 'Image',
        select: true,
      };
    case 'mj-2-columns':
      return { label: '2 columns', select: true };
    case 'mj-3-columns':
      return { label: '3 columns', select: true };
    case 'mj-navbar':
      return { label: 'Navbar', category: 'Advanced' };
    case 'mj-social-group':
      return { label: 'Social', category: 'Advanced' };
    case 'mj-spacer':
      return { label: 'Spacer' };
    default:
      return {};
  }
}

function blockIdToInsertKind(blockId: string): InsertContentKind | null {
  if (blockId === 'mj-text') return 'text';
  if (blockId === 'mj-button') return 'button';
  if (blockId === 'mj-divider') return 'divider';
  if (blockId === 'mj-1-column') return 'section-1-col';
  return null;
}

/**
 * Curate blocks and prefer click-to-insert below the current selection for content blocks.
 */
export function installEmailEditorBlocks(editor: Editor): () => void {
  // Relabel / restyle existing plugin blocks after they are registered.
  for (const block of editor.BlockManager.getAll().models) {
    const id = block.get('id') as string;
    const opts = grapesMjmlBlockOptions(id);
    if (Object.keys(opts).length === 0) continue;
    block.set(opts);
  }

  // Click on a block tile → insert below selection when we have a content target.
  const onBlockClick = (block: { get?: (k: string) => unknown; id?: string }) => {
    const id = String(block.get?.('id') ?? block.id ?? '');
    const kind = blockIdToInsertKind(id);
    if (!kind) return;

    // Only intercept when something useful is selected (column/content/section).
    const selected = editor.getSelected();
    if (!selected || selected.is('wrapper')) return;

    const type = getComponentType(selected);
    const canRelativeInsert =
      type === 'mj-column' || type === 'mj-section' || type === 'mj-hero' || isMjmlContentComponent(selected);
    if (!canRelativeInsert) return;

    const inserted = insertContentBelowSelection(editor, kind);
    if (inserted) {
      // Prevent default drop-on-canvas for this click path when possible.
      revealComponent(editor, inserted);
    }
  };

  // Grapes block manager: `block:click` may not exist in all versions — also flash after canvas drop.
  editor.on('block:click', onBlockClick as never);

  const onBlockDragStop = (component?: Parameters<typeof revealComponent>[1]) => {
    if (!component) {
      const selected = editor.getSelected();
      if (selected && isMjmlContentComponent(selected)) {
        revealComponent(editor, selected);
      }
      return;
    }
    const type = getComponentType(component);
    if (!type.startsWith('mj-') || type === 'mj-body' || type === 'mj-head') return;
    window.requestAnimationFrame(() => {
      const still = editor.Components.getById(component.getId());
      if (still) revealComponent(editor, still);
    });
  };

  editor.on('block:drag:stop', onBlockDragStop as never);

  return () => {
    editor.off('block:click', onBlockClick as never);
    editor.off('block:drag:stop', onBlockDragStop as never);
  };
}
