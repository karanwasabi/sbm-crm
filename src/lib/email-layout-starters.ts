import type { EmailBlock, EmailTemplateLayout } from '@/lib/email-template-types';

export const LAYOUT_STARTERS: Record<EmailTemplateLayout, EmailBlock[]> = {
  simple: [
    { type: 'heading', text: 'Hi {{lead.first_name}},' },
    {
      type: 'paragraph',
      text: 'Thanks for your interest in {{lead.program_interest}}. We wanted to share a quick update.',
    },
    { type: 'button', text: 'Visit the portal', url: '{{links.portal}}' },
  ],
  hero: [
    { type: 'heading', text: 'Your journey with {{lead.program_interest}}' },
    {
      type: 'paragraph',
      text: 'Hi {{lead.first_name}}, we’re glad you reached out. Here’s what happens next and how we can support you.',
    },
    { type: 'button', text: 'Explore programs', url: '{{links.portal}}' },
  ],
  cta: [
    { type: 'heading', text: 'Ready for the next step?' },
    { type: 'paragraph', text: 'Hi {{lead.first_name}}, book a quick call or visit the portal to continue.' },
    { type: 'button', text: 'Continue in the portal', url: '{{links.portal}}' },
  ],
  two_column: [
    { type: 'heading', text: 'Hi {{lead.first_name}},', column: 'main' },
    {
      type: 'paragraph',
      text: 'Here’s an update about {{lead.program_interest}} and what we recommend for you right now.',
      column: 'main',
    },
    { type: 'button', text: 'Open portal', url: '{{links.portal}}', column: 'main' },
    { type: 'heading', text: 'Quick tip', column: 'sidebar' },
    {
      type: 'paragraph',
      text: 'Members who log in within 48 hours are more likely to find the right cohort fit.',
      column: 'sidebar',
    },
  ],
  receipt: [
    { type: 'heading', text: 'Payment received' },
    { type: 'paragraph', text: 'Program: {{member.program_name}}' },
    { type: 'paragraph', text: 'Cohort: {{member.cohort_name}}' },
    {
      type: 'paragraph',
      text: 'Hi {{lead.first_name}}, thank you — we’ve received your payment and your enrolment is being processed.',
    },
    { type: 'button', text: 'View in portal', url: '{{links.portal}}' },
  ],
  digest: [
    { type: 'heading', text: 'Hi {{lead.first_name}},' },
    { type: 'paragraph', text: 'Here’s what’s new at Slow Burn Method this week.' },
    { type: 'divider' },
    { type: 'heading', text: '{{lead.program_interest}} updates' },
    {
      type: 'paragraph',
      text: 'New cohort dates are open. If you’re still exploring, this is a good time to review options.',
    },
    { type: 'divider' },
    { type: 'heading', text: 'From the community' },
    { type: 'paragraph', text: 'Members in {{lead.city}} and beyond are sharing wins from their current programs.' },
    { type: 'button', text: 'Read more', url: '{{links.portal}}' },
  ],
};

export function normalizeEmailBlocks(blocks: EmailBlock[]): EmailBlock[] {
  return blocks.map((block) => {
    if (block.type === 'divider') return block;
    return { ...block, column: block.column ?? 'main' };
  });
}

export function blocksInColumn(blocks: EmailBlock[], column: 'main' | 'sidebar'): EmailBlock[] {
  return normalizeEmailBlocks(blocks).filter((block) => (block.column ?? 'main') === column);
}
