import { EMAIL_BRAND_NAME, EMAIL_LOGO_URL, EMAIL_WEBSITE_URL } from '@/lib/email-branding';
import type { EmailTemplateClassification } from '@/lib/email-template-types';

function logoSection(): string {
  return `
    <mj-section padding="24px 0 8px">
      <mj-column>
        <mj-image
          src="${EMAIL_LOGO_URL}"
          href="${EMAIL_WEBSITE_URL}"
          alt="${EMAIL_BRAND_NAME}"
          width="180px"
          align="center"
          data-sbm-logo="true"
        />
      </mj-column>
    </mj-section>
  `;
}

function transactionalFooter(): string {
  return `
    <mj-section padding="16px 0 32px">
      <mj-column>
        <mj-text align="center" color="#64748b" font-size="12px" line-height="1.5">
          © ${EMAIL_BRAND_NAME} · slowburnmethod.in
        </mj-text>
      </mj-column>
    </mj-section>
  `;
}

function marketingFooter(): string {
  return `
    <mj-section padding="16px 0 32px">
      <mj-column>
        <mj-text align="center" color="#64748b" font-size="12px" line-height="1.6">
          You are receiving this because you opted in to updates from ${EMAIL_BRAND_NAME}.
        </mj-text>
        <mj-text align="center" color="#64748b" font-size="12px" line-height="1.6">
          © ${EMAIL_BRAND_NAME} · slowburnmethod.in ·
          <a href="{{links.unsubscribe}}" style="color:#64748b;">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  `;
}

const letterMjml = `
<mjml>
  <mj-body background-color="#f8fafc">
    ${logoSection()}
    <mj-section padding="8px 0">
      <mj-column>
        <mj-text font-size="22px" font-weight="700" color="#1e293b">Hello {{lead.first_name}},</mj-text>
        <mj-text color="#475569" line-height="1.6">
          Write your message here. Keep it personal and clear.
        </mj-text>
        <mj-button background-color="#0f766e" color="#ffffff" href="{{links.portal}}" border-radius="999px">
          Open portal
        </mj-button>
      </mj-column>
    </mj-section>
    ${transactionalFooter()}
  </mj-body>
</mjml>
`;

const announcementMjml = `
<mjml>
  <mj-body background-color="#f8fafc">
    ${logoSection()}
    <mj-section padding="8px 0 0">
      <mj-column>
        <mj-text font-size="28px" font-weight="800" color="#0f172a" align="center">
          Something new at ${EMAIL_BRAND_NAME}
        </mj-text>
        <mj-text color="#475569" line-height="1.6" align="center">
          Hi {{lead.first_name}}, share your announcement here.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="8px 0">
      <mj-column>
        <mj-button background-color="#0f766e" color="#ffffff" href="{{links.portal}}" border-radius="999px" align="center">
          Learn more
        </mj-button>
      </mj-column>
    </mj-section>
    ${marketingFooter()}
  </mj-body>
</mjml>
`;

const newsletterMjml = `
<mjml>
  <mj-body background-color="#f8fafc">
    ${logoSection()}
    <mj-section padding="8px 0 0">
      <mj-column>
        <mj-text font-size="26px" font-weight="800" color="#0f172a">This week at ${EMAIL_BRAND_NAME}</mj-text>
        <mj-text color="#475569" line-height="1.6">
          Hi {{lead.first_name}}, introduce your update here.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="8px 0">
      <mj-column>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="18px" font-weight="700" color="#1e293b">Section one</mj-text>
        <mj-text color="#475569" line-height="1.6">Add your first topic.</mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="8px 0">
      <mj-column>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="18px" font-weight="700" color="#1e293b">Section two</mj-text>
        <mj-text color="#475569" line-height="1.6">Add another topic or CTA below.</mj-text>
        <mj-button background-color="#0f766e" color="#ffffff" href="{{links.portal}}" border-radius="999px">
          Take action
        </mj-button>
      </mj-column>
    </mj-section>
    ${marketingFooter()}
  </mj-body>
</mjml>
`;

export function getStarterMjml(classification: EmailTemplateClassification): string {
  if (classification === 'transactional') {
    return letterMjml;
  }
  return announcementMjml;
}

export function getNewsletterMjml(): string {
  return newsletterMjml;
}

export function getSbmLogoBlockContent(): string {
  return `
    <mj-section>
      <mj-column>
        <mj-image
          src="${EMAIL_LOGO_URL}"
          href="${EMAIL_WEBSITE_URL}"
          alt="${EMAIL_BRAND_NAME}"
          width="180px"
          align="center"
          data-sbm-logo="true"
        />
      </mj-column>
    </mj-section>
  `;
}

export function isGrapesProjectData(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && 'pages' in value;
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
