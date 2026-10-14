'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useMemo, useState, useTransition } from 'react';
import {
  activatePartnerAPIClientAction,
  createPartnerAPIClientAction,
  deactivatePartnerAPIClientAction,
  patchPartnerAPIClientAction,
  rotatePartnerAPIClientKeyAction,
  rotatePartnerWebhookSecretAction,
} from '@/app/(crm)/partners/actions';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import type { PartnerAPIClient } from '@/utils/api';

type PartnerAPIManagerViewProps = {
  clients: PartnerAPIClient[];
};

type SecretReveal = {
  title: string;
  apiKey?: string;
  webhookSecret?: string;
};

function parseAllowlist(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatAllowlist(entries: string[] | null | undefined): string {
  return (entries ?? []).join(', ');
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PartnerAPIManagerView({ clients }: PartnerAPIManagerViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [webhookURL, setWebhookURL] = useState('');
  const [rateLimitRPM, setRateLimitRPM] = useState('120');
  const [ipAllowlist, setIpAllowlist] = useState('');

  const [editing, setEditing] = useState<PartnerAPIClient | null>(null);
  const [editName, setEditName] = useState('');
  const [editWebhookURL, setEditWebhookURL] = useState('');
  const [editRateLimitRPM, setEditRateLimitRPM] = useState('120');
  const [editIpAllowlist, setEditIpAllowlist] = useState('');

  const [secrets, setSecrets] = useState<SecretReveal | null>(null);

  const { active, inactive } = useMemo(() => {
    const activeClients: PartnerAPIClient[] = [];
    const inactiveClients: PartnerAPIClient[] = [];
    for (const client of clients) {
      if (client.active) activeClients.push(client);
      else inactiveClients.push(client);
    }
    return { active: activeClients, inactive: inactiveClients };
  }, [clients]);

  const openEdit = (client: PartnerAPIClient) => {
    setEditing(client);
    setEditName(client.name);
    setEditWebhookURL(client.webhook_url ?? '');
    setEditRateLimitRPM(String(client.rate_limit_rpm ?? 120));
    setEditIpAllowlist(formatAllowlist(client.ip_allowlist));
  };

  const showSecrets = (title: string, client: PartnerAPIClient) => {
    if (!client.api_key && !client.webhook_secret) return;
    setSecrets({
      title,
      apiKey: client.api_key,
      webhookSecret: client.webhook_secret,
    });
  };

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ message: 'Name is required.', variant: 'error' });
      return;
    }
    const rpm = Number.parseInt(rateLimitRPM, 10);
    if (!Number.isFinite(rpm) || rpm <= 0 || rpm > 6000) {
      toast({ message: 'Rate limit must be between 1 and 6000.', variant: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        const result = await createPartnerAPIClientAction({
          name: trimmedName,
          webhook_url: webhookURL.trim() || undefined,
          rate_limit_rpm: rpm,
          ip_allowlist: parseAllowlist(ipAllowlist),
        });
        setName('');
        setWebhookURL('');
        setRateLimitRPM('120');
        setIpAllowlist('');
        toast({ message: `Created ${result.name}`, variant: 'success' });
        showSecrets('Partner created — copy secrets now', result);
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to create partner.',
          variant: 'error',
        });
      }
    });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast({ message: 'Name is required.', variant: 'error' });
      return;
    }
    const rpm = Number.parseInt(editRateLimitRPM, 10);
    if (!Number.isFinite(rpm) || rpm <= 0 || rpm > 6000) {
      toast({ message: 'Rate limit must be between 1 and 6000.', variant: 'error' });
      return;
    }

    const nextWebhook = editWebhookURL.trim();
    const clearWebhook = !nextWebhook && Boolean(editing.webhook_url);

    startTransition(async () => {
      try {
        const result = await patchPartnerAPIClientAction(editing.id, {
          name: trimmedName,
          webhook_url: clearWebhook ? undefined : nextWebhook || undefined,
          clear_webhook: clearWebhook || undefined,
          rate_limit_rpm: rpm,
          ip_allowlist: parseAllowlist(editIpAllowlist),
        });
        setEditing(null);
        toast({ message: `Updated ${result.name}`, variant: 'success' });
        showSecrets('Webhook secret created — copy now', result);
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to update partner.',
          variant: 'error',
        });
      }
    });
  };

  const handleToggleActive = (client: PartnerAPIClient) => {
    startTransition(async () => {
      try {
        if (client.active) {
          await deactivatePartnerAPIClientAction(client.id);
          toast({ message: `Deactivated ${client.name}`, variant: 'success' });
        } else {
          await activatePartnerAPIClientAction(client.id);
          toast({ message: `Activated ${client.name}`, variant: 'success' });
        }
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to update partner status.',
          variant: 'error',
        });
      }
    });
  };

  const handleRotateKey = (client: PartnerAPIClient) => {
    if (!window.confirm(`Rotate API key for ${client.name}? The old key stops working immediately.`)) {
      return;
    }
    startTransition(async () => {
      try {
        const result = await rotatePartnerAPIClientKeyAction(client.id);
        toast({ message: 'API key rotated', variant: 'success' });
        showSecrets('New API key — copy now', result);
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to rotate API key.',
          variant: 'error',
        });
      }
    });
  };

  const handleRotateWebhook = (client: PartnerAPIClient) => {
    if (!client.webhook_url) {
      toast({ message: 'Set a webhook URL before rotating the secret.', variant: 'error' });
      return;
    }
    if (!window.confirm(`Rotate webhook secret for ${client.name}? The old secret stops working immediately.`)) {
      return;
    }
    startTransition(async () => {
      try {
        const result = await rotatePartnerWebhookSecretAction(client.id);
        toast({ message: 'Webhook secret rotated', variant: 'success' });
        showSecrets('New webhook secret — copy now', result);
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to rotate webhook secret.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <Card>
          <SectionHead
            title="Create partner"
            subtitle="API keys and webhook secrets are shown once. Store them before closing the dialog."
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Name">
              <TextInput value={name} onChange={setName} placeholder="Agency name" disabled={pending} />
            </Field>
            <Field label="Webhook URL">
              <TextInput
                value={webhookURL}
                onChange={setWebhookURL}
                placeholder="https://partner.example/hooks/sbm"
                disabled={pending}
              />
            </Field>
            <Field label="Rate limit (RPM)">
              <TextInput value={rateLimitRPM} onChange={setRateLimitRPM} placeholder="120" disabled={pending} />
            </Field>
            <Field label="IP allowlist">
              <TextInput
                value={ipAllowlist}
                onChange={setIpAllowlist}
                placeholder="203.0.113.0/24, 198.51.100.10"
                disabled={pending}
              />
            </Field>
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={handleCreate} loading={pending} loadingLabel="Creating…">
              Create partner
            </Button>
          </div>
        </Card>

        <Card>
          <SectionHead title="Active partners" subtitle="Clients that can call the Partner API" />
          {active.length === 0 ? (
            <p className="text-sm text-slate-500">No active partners yet.</p>
          ) : (
            <PartnerTable>
              {active.map((client) => (
                <PartnerRow
                  key={client.id}
                  client={client}
                  disabled={pending}
                  onEdit={() => openEdit(client)}
                  onToggleActive={() => handleToggleActive(client)}
                  onRotateKey={() => handleRotateKey(client)}
                  onRotateWebhook={() => handleRotateWebhook(client)}
                />
              ))}
            </PartnerTable>
          )}
        </Card>

        <Card>
          <SectionHead title="Inactive partners" subtitle="Deactivated clients cannot authenticate" />
          {inactive.length === 0 ? (
            <p className="text-sm text-slate-500">No inactive partners.</p>
          ) : (
            <PartnerTable>
              {inactive.map((client) => (
                <PartnerRow
                  key={client.id}
                  client={client}
                  inactive
                  disabled={pending}
                  onEdit={() => openEdit(client)}
                  onToggleActive={() => handleToggleActive(client)}
                  onRotateKey={() => handleRotateKey(client)}
                  onRotateWebhook={() => handleRotateWebhook(client)}
                />
              ))}
            </PartnerTable>
          )}
        </Card>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent showCloseButton className="gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg">
          <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-12">
            <DialogTitle className="text-lg font-bold text-slate-900">Edit partner</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Update metadata. Rotating keys uses the row actions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-6 py-5">
            <Field label="Name">
              <TextInput value={editName} onChange={setEditName} disabled={pending} />
            </Field>
            <Field label="Webhook URL">
              <TextInput
                value={editWebhookURL}
                onChange={setEditWebhookURL}
                placeholder="Leave blank to clear"
                disabled={pending}
              />
            </Field>
            <Field label="Rate limit (RPM)">
              <TextInput value={editRateLimitRPM} onChange={setEditRateLimitRPM} disabled={pending} />
            </Field>
            <Field label="IP allowlist">
              <TextInput
                value={editIpAllowlist}
                onChange={setEditIpAllowlist}
                placeholder="Comma or newline separated"
                disabled={pending}
              />
            </Field>
          </div>
          <DialogFooter className="border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={pending} loadingLabel="Saving…">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={secrets !== null} onOpenChange={(open) => !open && setSecrets(null)}>
        <DialogContent showCloseButton className="gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg">
          <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-12">
            <DialogTitle className="text-lg font-bold text-slate-900">{secrets?.title ?? 'Secrets'}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              These values will not be shown again. Copy them now.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-6 py-5">
            {secrets?.apiKey ? (
              <SecretField
                label="API key"
                value={secrets.apiKey}
                onCopied={() => toast({ message: 'API key copied', variant: 'success' })}
              />
            ) : null}
            {secrets?.webhookSecret ? (
              <SecretField
                label="Webhook secret"
                value={secrets.webhookSecret}
                onCopied={() => toast({ message: 'Webhook secret copied', variant: 'success' })}
              />
            ) : null}
          </div>
          <DialogFooter className="border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
            <Button onClick={() => setSecrets(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PartnerTable({ children }: { children: ReactNode }) {
  return (
    <DataTable className="-mx-1">
      <DataTableHead>
        <DataTableHeaderCell className="w-[22%] min-w-[140px]">Name</DataTableHeaderCell>
        <DataTableHeaderCell className="w-[16%] min-w-[110px]">Key prefix</DataTableHeaderCell>
        <DataTableHeaderCell className="w-[12%] min-w-[90px]">Webhook</DataTableHeaderCell>
        <DataTableHeaderCell className="w-[10%] min-w-[70px]">RPM</DataTableHeaderCell>
        <DataTableHeaderCell className="w-[18%] min-w-[140px]">Created</DataTableHeaderCell>
        <DataTableHeaderCell className="w-[22%] min-w-[180px] text-right"> </DataTableHeaderCell>
      </DataTableHead>
      <DataTableBody>{children}</DataTableBody>
    </DataTable>
  );
}

function PartnerRow({
  client,
  inactive = false,
  disabled,
  onEdit,
  onToggleActive,
  onRotateKey,
  onRotateWebhook,
}: {
  client: PartnerAPIClient;
  inactive?: boolean;
  disabled: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onRotateKey: () => void;
  onRotateWebhook: () => void;
}) {
  return (
    <DataTableRow className={cn(inactive && 'bg-slate-50/60')}>
      <DataTableCell>
        <div className="text-[13px] font-semibold text-slate-800">{client.name}</div>
      </DataTableCell>
      <DataTableCell>
        <code className="text-[12px] text-slate-500">{client.key_prefix}</code>
      </DataTableCell>
      <DataTableCell>
        <span className="text-[12px] text-slate-600">{client.has_webhook ? 'Yes' : 'No'}</span>
      </DataTableCell>
      <DataTableCell>
        <span className="text-[12px] text-slate-600">{client.rate_limit_rpm}</span>
      </DataTableCell>
      <DataTableCell>
        <span className="text-[12px] text-slate-500">{formatCreatedAt(client.created_at)}</span>
      </DataTableCell>
      <DataTableCell className="text-right">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={disabled}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={onRotateKey} disabled={disabled}>
            Rotate key
          </Button>
          <Button size="sm" variant="ghost" onClick={onRotateWebhook} disabled={disabled || !client.webhook_url}>
            Rotate secret
          </Button>
          <Button size="sm" variant="ghost" onClick={onToggleActive} disabled={disabled}>
            {client.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </DataTableCell>
    </DataTableRow>
  );
}

function SecretField({ label, value, onCopied }: { label: string; value: string; onCopied: () => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] break-all text-slate-800">
          {value}
        </code>
        <Button
          size="sm"
          variant="light"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              onCopied();
            } catch {
              // ignore clipboard failures
            }
          }}
        >
          Copy
        </Button>
      </div>
    </Field>
  );
}
