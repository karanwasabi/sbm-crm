import { RuleBuilder } from '@/components/crm/rule-builder';
import { SequencePanel } from '@/components/crm/sequence-panel';
import { TemplateLibrary } from '@/components/crm/template-library';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { MOCK_RULES, MOCK_SEQUENCES, MOCK_TEMPLATES } from '@/lib/mock/communications';

export function CommunicationsView() {
  return (
    <CrmPageLayout>
      <RuleBuilder rules={MOCK_RULES} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TemplateLibrary templates={MOCK_TEMPLATES} />
        <SequencePanel sequences={MOCK_SEQUENCES} />
      </div>
    </CrmPageLayout>
  );
}
