import type { EmailBlock, EmailTemplateLayout } from '@/lib/email-template-types';

const SAMPLE_VARS: Record<string, string> = {
  '{{lead.first_name}}': 'Alex',
  '{{lead.last_name}}': 'Sample',
  '{{lead.email}}': 'alex@example.com',
  '{{lead.city}}': 'Mumbai',
  '{{lead.program_interest}}': 'Take Control',
  '{{member.program_name}}': 'Take Control',
  '{{member.cohort_name}}': 'Cohort 12',
  '{{links.portal}}': 'https://portal.example.com',
  '{{links.unsubscribe}}': 'https://portal.example.com/unsubscribe',
};

export function substituteVariables(input: string, vars: Record<string, string> = SAMPLE_VARS): string {
  let out = input;
  for (const [token, value] of Object.entries(vars)) {
    out = out.split(token).join(value);
  }
  return out;
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function renderBlockHtml(block: EmailBlock): string {
  switch (block.type) {
    case 'heading':
      return `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#0f172a;">${escapeHtml(block.text)}</h1>`;
    case 'paragraph':
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(block.text).replace(/\n/g, '<br />')}</p>`;
    case 'button':
      return `<p style="margin:24px 0;"><a href="${escapeHtml(block.url)}" style="display:inline-block;background:#5C65CF;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">${escapeHtml(block.text)}</a></p>`;
    case 'divider':
      return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
    case 'image':
      return `<p style="margin:0 0 16px;"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" style="max-width:100%;border-radius:12px;" /></p>`;
    default:
      return '';
  }
}

function renderBlocksHtml(blocks: EmailBlock[]): string {
  return blocks.map(renderBlockHtml).join('');
}

function shell(layout: EmailTemplateLayout, inner: string, classification: 'transactional' | 'marketing'): string {
  const footer =
    classification === 'marketing'
      ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">You received this because you shared your details with SBM. <a href="{{links.unsubscribe}}" style="color:#5C65CF;">Unsubscribe</a></p>`
      : `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">SBM · This is a service email related to your account or request.</p>`;

  const hero =
    layout === 'hero'
      ? `<div style="background:linear-gradient(135deg,#5C65CF,#8338EC);padding:28px;border-radius:16px 16px 0 0;color:#fff;"><p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">SBM</p></div>`
      : '';

  const receiptHeader =
    layout === 'receipt'
      ? `<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Payment confirmation</p>`
      : '';

  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f8fafc;font-family:Inter,Arial,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="100%" style="max-width:600px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;" cellspacing="0" cellpadding="0"><tr><td style="padding:32px;">${hero}${receiptHeader}${inner}${footer}</td></tr></table></td></tr></table></body></html>`;
}

export function compileEmailTemplate(input: {
  layout: EmailTemplateLayout;
  classification: 'transactional' | 'marketing';
  subject: string;
  blocks: EmailBlock[];
}): { html: string; text: string; subject: string } {
  const blocks = [...input.blocks];
  if (
    input.classification === 'marketing' &&
    !blocks.some((b) => b.type === 'paragraph' && b.text.includes('{{links.unsubscribe}}'))
  ) {
    // footer already has unsubscribe in HTML shell
  }

  let inner = renderBlocksHtml(blocks);

  if (input.layout === 'two_column') {
    const main = blocks.slice(0, Math.ceil(blocks.length / 2));
    const side = blocks.slice(Math.ceil(blocks.length / 2));
    inner = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="width:62%;vertical-align:top;padding-right:16px;">${renderBlocksHtml(main)}</td><td style="width:38%;vertical-align:top;background:#f8fafc;border-radius:12px;padding:16px;">${renderBlocksHtml(side)}</td></tr></table>`;
  }

  if (input.layout === 'digest' && blocks.length > 2) {
    inner = blocks
      .map((block, index) => {
        if (block.type === 'heading' && index > 0) {
          return `<div style="margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0;">${renderBlockHtml(block)}</div>`;
        }
        return renderBlockHtml(block);
      })
      .join('');
  }

  const html = substituteVariables(shell(input.layout, inner, input.classification));
  const text = substituteVariables(
    [
      input.subject,
      '',
      ...blocks.map((block) => {
        if (block.type === 'heading' || block.type === 'paragraph') return block.text;
        if (block.type === 'button') return `${block.text}: ${block.url}`;
        return '';
      }),
    ]
      .filter(Boolean)
      .join('\n\n')
  );

  return {
    subject: substituteVariables(input.subject),
    html,
    text,
  };
}
