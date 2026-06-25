import type { EmailBlock, EmailTemplateLayout } from '@/lib/email-template-types';
import { blocksInColumn } from '@/lib/email-layout-starters';
import { EMAIL_BRAND_NAME, EMAIL_LOGO_URL, EMAIL_WEBSITE_URL } from '@/lib/email-branding';

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

type BlockStyle = 'default' | 'centered' | 'hero-title' | 'receipt-row' | 'cta-button';

function renderBlockHtml(block: EmailBlock, style: BlockStyle = 'default'): string {
  switch (block.type) {
    case 'heading':
      if (style === 'hero-title') {
        return `<h1 style="margin:0;font-size:28px;line-height:1.25;color:#ffffff;font-weight:800;">${escapeHtml(block.text)}</h1>`;
      }
      if (style === 'centered') {
        return `<h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;color:#0f172a;text-align:center;">${escapeHtml(block.text)}</h1>`;
      }
      return `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#0f172a;">${escapeHtml(block.text)}</h1>`;
    case 'paragraph':
      if (style === 'receipt-row') {
        return `<tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;line-height:1.5;color:#334155;">${escapeHtml(block.text).replace(/\n/g, '<br />')}</td></tr>`;
      }
      if (style === 'centered') {
        return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;text-align:center;">${escapeHtml(block.text).replace(/\n/g, '<br />')}</p>`;
      }
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(block.text).replace(/\n/g, '<br />')}</p>`;
    case 'button':
      if (style === 'cta-button') {
        return `<p style="margin:28px 0 8px;text-align:center;"><a href="${escapeHtml(block.url)}" style="display:inline-block;background:#5C65CF;color:#fff;text-decoration:none;font-weight:800;font-size:16px;padding:16px 32px;border-radius:999px;">${escapeHtml(block.text)}</a></p>`;
      }
      if (style === 'centered') {
        return `<p style="margin:24px 0;text-align:center;"><a href="${escapeHtml(block.url)}" style="display:inline-block;background:#5C65CF;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px;">${escapeHtml(block.text)}</a></p>`;
      }
      return `<p style="margin:24px 0;"><a href="${escapeHtml(block.url)}" style="display:inline-block;background:#5C65CF;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">${escapeHtml(block.text)}</a></p>`;
    case 'divider':
      return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
    case 'image':
      if (style === 'hero-title') {
        return `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />`;
      }
      return `<p style="margin:0 0 16px;"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" style="max-width:100%;border-radius:12px;" /></p>`;
    default:
      return '';
  }
}

function renderBlocksHtml(blocks: EmailBlock[], style: BlockStyle = 'default'): string {
  return blocks.map((block) => renderBlockHtml(block, style)).join('');
}

function brandLogoHtml(): string {
  return `<a href="${EMAIL_WEBSITE_URL}" style="text-decoration:none;display:inline-block;" target="_blank" rel="noopener noreferrer"><img src="${EMAIL_LOGO_URL}" alt="${EMAIL_BRAND_NAME}" width="220" style="display:block;margin:0 auto;width:220px;max-width:100%;height:auto;border:0;" /></a>`;
}

function brandHeader(): string {
  return `<div style="background:#f8f9fe;border-bottom:1px solid #e2e8f0;padding:28px 32px;margin:-32px -32px 24px;text-align:center;">${brandLogoHtml()}</div>`;
}

function emailFooterHtml(classification: 'transactional' | 'marketing'): string {
  const wrap = 'margin:24px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;';
  const lineStyle = 'margin:0;font-size:12px;line-height:1.6;color:#90a1b9;';
  const linkStyle = 'color:#5C65CF;text-decoration:none;font-weight:600;';
  const siteLink = `<a href="${EMAIL_WEBSITE_URL}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">slowburnmethod.in</a>`;
  const brandLine = `<p style="${lineStyle}">&copy; ${EMAIL_BRAND_NAME} &middot; ${siteLink}</p>`;

  if (classification === 'marketing') {
    const consentLine = `<p style="${lineStyle}margin-bottom:8px;">You’re on our list because you shared your details with ${EMAIL_BRAND_NAME}.</p>`;
    const unsubscribeLine = `<p style="${lineStyle}margin-top:8px;"><a href="{{links.unsubscribe}}" style="${linkStyle}">Unsubscribe</a></p>`;
    return `<div style="${wrap}">${consentLine}${brandLine}${unsubscribeLine}</div>`;
  }

  return `<div style="${wrap}">${brandLine}</div>`;
}

function renderHeroLayout(blocks: EmailBlock[]): string {
  if (blocks.length === 0) return '';

  const [first, ...rest] = blocks;

  if (first.type === 'image') {
    const hero = `<div style="margin:-32px -32px 24px;overflow:hidden;">${renderBlockHtml(first, 'hero-title')}</div>`;
    return `${hero}${renderBlocksHtml(rest)}`;
  }

  if (first.type === 'heading') {
    const hero = `<div style="margin:-32px -32px 24px;background:linear-gradient(135deg,#5C65CF 0%,#8338EC 100%);padding:36px 32px;text-align:center;">${renderBlockHtml(first, 'hero-title')}</div>`;
    return `${hero}${renderBlocksHtml(rest)}`;
  }

  return renderBlocksHtml(blocks);
}

function renderCtaLayout(blocks: EmailBlock[]): string {
  return `<div style="padding:8px 0 4px;">${blocks
    .map((block) => {
      if (block.type === 'button') return renderBlockHtml(block, 'cta-button');
      if (block.type === 'heading' || block.type === 'paragraph') return renderBlockHtml(block, 'centered');
      return renderBlockHtml(block);
    })
    .join('')}</div>`;
}

function renderTwoColumnLayout(blocks: EmailBlock[]): string {
  const main = blocksInColumn(blocks, 'main');
  const sidebar = blocksInColumn(blocks, 'sidebar');

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
    <td style="width:62%;vertical-align:top;padding-right:16px;">${renderBlocksHtml(main)}</td>
    <td style="width:38%;vertical-align:top;background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0;">${renderBlocksHtml(sidebar)}</td>
  </tr></table>`;
}

function renderReceiptLayout(blocks: EmailBlock[]): string {
  const heading = blocks.find((block) => block.type === 'heading');
  const paragraphs = blocks.filter((block) => block.type === 'paragraph');
  const buttons = blocks.filter((block) => block.type === 'button');
  const others = blocks.filter(
    (block) => block.type !== 'heading' && block.type !== 'paragraph' && block.type !== 'button'
  );

  const title = heading && heading.type === 'heading' ? escapeHtml(heading.text) : 'Confirmation';
  const rows = paragraphs.map((block) => renderBlockHtml(block, 'receipt-row')).join('');
  const actions = renderBlocksHtml(buttons);
  const extra = renderBlocksHtml(others);

  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">Confirmation</p>
    <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#0f172a;">${title}</h1>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">${rows}</table>
    ${extra}
    ${actions}
  </div>`;
}

function renderDigestLayout(blocks: EmailBlock[]): string {
  const sections: EmailBlock[][] = [];
  let current: EmailBlock[] = [];

  for (const block of blocks) {
    if (block.type === 'heading' && current.length > 0) {
      sections.push(current);
      current = [block];
    } else if (block.type === 'divider') {
      if (current.length > 0) sections.push(current);
      current = [];
    } else {
      current.push(block);
    }
  }
  if (current.length > 0) sections.push(current);

  if (sections.length <= 1) {
    return blocks
      .map((block, index) => {
        if (block.type === 'heading' && index > 0) {
          return `<div style="margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0;">${renderBlockHtml(block)}</div>`;
        }
        return renderBlockHtml(block);
      })
      .join('');
  }

  return sections
    .map((section, index) => {
      const body = renderBlocksHtml(section);
      const spacing = index === 0 ? '' : 'margin-top:16px;';
      return `<div style="${spacing}padding:20px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;">${body}</div>`;
    })
    .join('');
}

function renderLayoutInner(layout: EmailTemplateLayout, blocks: EmailBlock[]): string {
  switch (layout) {
    case 'hero':
      return renderHeroLayout(blocks);
    case 'cta':
      return renderCtaLayout(blocks);
    case 'two_column':
      return renderTwoColumnLayout(blocks);
    case 'receipt':
      return renderReceiptLayout(blocks);
    case 'digest':
      return renderDigestLayout(blocks);
    case 'simple':
    default:
      return renderBlocksHtml(blocks);
  }
}

function shell(inner: string, classification: 'transactional' | 'marketing'): string {
  const footer = emailFooterHtml(classification);

  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f8fafc;font-family:Inter,Arial,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="100%" style="max-width:600px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;" cellspacing="0" cellpadding="0"><tr><td style="padding:32px;">${brandHeader()}${inner}${footer}</td></tr></table></td></tr></table></body></html>`;
}

export function compileEmailTemplate(input: {
  layout: EmailTemplateLayout;
  classification: 'transactional' | 'marketing';
  subject: string;
  blocks: EmailBlock[];
}): { html: string; text: string; subject: string } {
  const inner = renderLayoutInner(input.layout, input.blocks);
  const html = substituteVariables(shell(inner, input.classification));
  const text = substituteVariables(
    [
      input.subject,
      '',
      ...input.blocks.map((block) => {
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
