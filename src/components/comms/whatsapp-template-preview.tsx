'use client';

import type { WhatsAppTemplateFormContent } from '@/lib/whatsapp-template-content';
import { renderWhatsAppPreviewText } from '@/lib/whatsapp-template-content';

type WhatsAppTemplatePreviewProps = {
  form: WhatsAppTemplateFormContent;
  className?: string;
};

export function WhatsAppTemplatePreview({ form, className }: WhatsAppTemplatePreviewProps) {
  const preview = renderWhatsAppPreviewText(form);
  const hasContent = Boolean(preview.header || preview.body.trim() || preview.footer || preview.buttons.length);

  return (
    <div className={className}>
      <p className="mb-3 text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">Preview</p>
      <div className="rounded-2xl border border-slate-200 bg-[#efeae2] p-4">
        <div className="mx-auto max-w-sm">
          {!hasContent ? (
            <p className="rounded-xl bg-white/80 px-4 py-6 text-center text-sm text-slate-500">
              Start typing your message to see a preview.
            </p>
          ) : (
            <div className="rounded-xl bg-white px-3 py-2.5 shadow-sm">
              {preview.header ? <p className="mb-2 text-sm font-bold text-slate-900">{preview.header}</p> : null}
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{preview.body || ' '}</p>
              {preview.footer ? <p className="mt-2 text-xs text-slate-500">{preview.footer}</p> : null}
              {preview.buttons.length > 0 ? (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-2">
                  {preview.buttons.map((label) => (
                    <div
                      key={label}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-[#008069]"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="mt-2 text-right text-[10px] text-slate-400">12:00</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
