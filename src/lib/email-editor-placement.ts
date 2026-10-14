import type { Component, Editor } from 'grapesjs';
import {
  insertContentBelowSelection,
  installEmailEditorDragFlush,
  moveComponentBy,
  revealComponent,
} from '@/lib/email-editor-structure';

const STRUCTURE_TOOLBAR_COMMANDS = {
  moveUp: 'sbm-email-move-up',
  moveDown: 'sbm-email-move-down',
  insertText: 'sbm-email-insert-text',
  insertButton: 'sbm-email-insert-button',
} as const;

type ToolbarButton = {
  attributes?: Record<string, string>;
  label?: string;
  command: string;
};

function toolbarButton(command: string, label: string, title: string): ToolbarButton {
  return {
    // Avoid bare `.fa` (empty glyph). Plain label buttons are clearer for ↑↓/T+/B+.
    attributes: { class: 'sbm-email-tlb', title, 'data-sbm-toolbar': command },
    label,
    command,
  };
}

function withStructureToolbar(component: Component) {
  const existing = (component.get('toolbar') as ToolbarButton[] | undefined) ?? [];
  const filtered = existing.filter((btn) => !String(btn.command ?? '').startsWith('sbm-email-'));

  const toolbar: ToolbarButton[] = [
    toolbarButton(STRUCTURE_TOOLBAR_COMMANDS.moveUp, '↑', 'Move up'),
    toolbarButton(STRUCTURE_TOOLBAR_COMMANDS.moveDown, '↓', 'Move down'),
    toolbarButton(STRUCTURE_TOOLBAR_COMMANDS.insertText, 'T+', 'Insert text below'),
    toolbarButton(STRUCTURE_TOOLBAR_COMMANDS.insertButton, 'B+', 'Insert button below'),
    ...filtered,
  ];

  component.set('toolbar', toolbar);
}

/**
 * Toolbar move/insert actions, drag RTE flush, and post-op reveal.
 */
export function installEmailEditorPlacementUx(editor: Editor): () => void {
  const teardownDragFlush = installEmailEditorDragFlush(editor);

  editor.Commands.add(STRUCTURE_TOOLBAR_COMMANDS.moveUp, {
    run(ed) {
      const selected = ed.getSelected();
      if (!selected) return;
      const moved = moveComponentBy(selected, -1);
      if (moved) revealComponent(ed, moved);
    },
  });

  editor.Commands.add(STRUCTURE_TOOLBAR_COMMANDS.moveDown, {
    run(ed) {
      const selected = ed.getSelected();
      if (!selected) return;
      const moved = moveComponentBy(selected, 1);
      if (moved) revealComponent(ed, moved);
    },
  });

  editor.Commands.add(STRUCTURE_TOOLBAR_COMMANDS.insertText, {
    run(ed) {
      const inserted = insertContentBelowSelection(ed, 'text');
      if (inserted) revealComponent(ed, inserted);
    },
  });

  editor.Commands.add(STRUCTURE_TOOLBAR_COMMANDS.insertButton, {
    run(ed) {
      const inserted = insertContentBelowSelection(ed, 'button');
      if (inserted) revealComponent(ed, inserted);
    },
  });

  const onSelected = (component: Component) => {
    if (!component || component.is('wrapper')) return;
    const type = String(component.get('type') ?? '');
    if (!type.startsWith('mj-') || type === 'mj-body' || type === 'mj-head') return;
    const view = component.view as { rteEnabled?: boolean } | undefined;
    if (view?.rteEnabled) {
      // While editing text, keep Grapes' format bar only — hide structure ↑↓/T+/B+.
      component.set('toolbar', []);
      return;
    }
    withStructureToolbar(component);
  };

  const onRteEnable = () => {
    const selected = editor.getSelected();
    if (selected) selected.set('toolbar', []);
  };

  const onRteDisable = () => {
    const selected = editor.getSelected();
    if (selected) onSelected(selected);
  };

  editor.on('component:selected', onSelected);
  editor.on('rte:enable', onRteEnable);
  editor.on('rte:disable', onRteDisable);

  return () => {
    teardownDragFlush();
    editor.off('component:selected', onSelected);
    editor.off('rte:enable', onRteEnable);
    editor.off('rte:disable', onRteDisable);
    for (const cmd of Object.values(STRUCTURE_TOOLBAR_COMMANDS)) {
      editor.Commands.remove(cmd);
    }
  };
}
