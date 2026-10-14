/** Single body typography contract — starters, blocks, and style-default must match. */
export const EMAIL_BODY_TYPOGRAPHY = {
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#475569',
} as const;

/** MJML attribute string for body text inserts. */
export const EMAIL_BODY_TEXT_MJML_ATTRS = `font-family="${EMAIL_BODY_TYPOGRAPHY.fontFamily}" font-size="${EMAIL_BODY_TYPOGRAPHY.fontSize}" line-height="${EMAIL_BODY_TYPOGRAPHY.lineHeight}" color="${EMAIL_BODY_TYPOGRAPHY.color}"`;
