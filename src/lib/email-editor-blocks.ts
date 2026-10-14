import type { Editor } from 'grapesjs';
import { getComponentType, isMjmlContentComponent, revealComponent } from '@/lib/email-editor-structure';

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

/**
 * Curate blocks and flash/select after a canvas drop.
 * Intentional inserts use toolbar T+/B+ (not block-tile click) — click handlers race with drag-start
 * and can insert a duplicate before the user finishes dragging.
 */
export function installEmailEditorBlocks(editor: Editor): () => void {
  // Relabel / restyle existing plugin blocks after they are registered.
  for (const block of editor.BlockManager.getAll().models) {
    const id = block.get('id') as string;
    const opts = grapesMjmlBlockOptions(id);
    if (Object.keys(opts).length === 0) continue;
    block.set(opts);
  }

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
    editor.off('block:drag:stop', onBlockDragStop as never);
  };
}
