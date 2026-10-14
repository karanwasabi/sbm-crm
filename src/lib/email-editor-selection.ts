import type { Editor } from 'grapesjs';

/**
 * Hit-testing / leaf-first hover is owned by `installEmailCanvasLayer`.
 * Kept as a no-op so older call sites remain valid.
 */
export function installEmailEditorSelectionHitTesting(_editor: Editor): () => void {
  return () => {};
}

// Re-export for tests / callers that still import leaf helpers from this module.
export { leafAtPoint, classifyChromeTarget } from '@/lib/email-canvas-layer';
