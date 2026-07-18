'use client';

import { ChevronDown, ChevronUp, FileText, Pencil, Plus, Star, Trash2, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  createAdminResourceAction,
  createResourceUploadUrlAction,
  deleteAdminResourceAction,
  getCohortResourceCategoriesAction,
  getCohortResourcesAction,
  patchAdminResourceAction,
  putCohortResourceCategoriesAction,
  putCohortResourcesAction,
} from '@/app/(crm)/resources/actions';
import { TabBar } from '@/components/crm/tab-bar';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { FilterChip } from '@/components/ui/filter-chip';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import type {
  AdminResource,
  CohortResourceCategory,
  CohortResourceCategoryInput,
  CreateAdminResourceInput,
  ResourceCategory,
  ResourceKind,
} from '@/utils/api';

const TABS = ['Library', 'Cohort assignments'] as const;
type TabId = (typeof TABS)[number];

const RESOURCE_CATEGORIES: { id: ResourceCategory; label: string }[] = [
  { id: 'plans', label: 'Plans' },
  { id: 'webinars', label: 'Webinars' },
  { id: 'exercise', label: 'Exercise Videos' },
  { id: 'guides', label: 'Guides' },
  { id: 'recipes', label: 'Recipes' },
];

const CATEGORY_LABELS = Object.fromEntries(RESOURCE_CATEGORIES.map((c) => [c.id, c.label])) as Record<
  ResourceCategory,
  string
>;

export type ProgramCohortOption = {
  id: string;
  name: string;
  cohorts: { id: string; name: string; startsOn: string }[];
};

type ResourceManagerViewProps = {
  resources: AdminResource[];
  programCohorts: ProgramCohortOption[];
};

type CohortAssignment = {
  resourceId: string;
  isFeatured: boolean;
};

type ResourceFormState = {
  category: ResourceCategory;
  kind: ResourceKind;
  title: string;
  tag: string;
  summary: string;
  thumbnailUrl: string;
  speaker: string;
  duration: string;
  youtubeUrl: string;
  published: boolean;
  pdfFile: File | null;
};

function defaultFormState(category: ResourceCategory = 'plans'): ResourceFormState {
  return {
    category,
    kind: 'pdf',
    title: '',
    tag: '',
    summary: '',
    thumbnailUrl: '',
    speaker: '',
    duration: '',
    youtubeUrl: '',
    published: true,
    pdfFile: null,
  };
}

function formStateFromResource(resource: AdminResource): ResourceFormState {
  return {
    category: resource.category,
    kind: resource.kind === 'youtube' ? 'youtube' : 'pdf',
    title: resource.title,
    tag: resource.tag,
    summary: resource.summary,
    thumbnailUrl: resource.thumbnailUrl ?? '',
    speaker: resource.speaker ?? '',
    duration: resource.duration ?? '',
    youtubeUrl: resource.youtubeVideoId ?? '',
    published: resource.published,
    pdfFile: null,
  };
}

async function uploadResourcePdf(file: File): Promise<string> {
  const { path, uploadUrl, token } = await createResourceUploadUrlAction(file.name);
  // Supabase signed uploads authenticate via ?token= on the URL (not Bearer).
  let target = uploadUrl;
  if (token && !target.includes('token=')) {
    const sep = target.includes('?') ? '&' : '?';
    target = `${target}${sep}token=${encodeURIComponent(token)}`;
  }
  const response = await fetch(target, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/pdf',
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error('PDF upload failed.');
  }
  return path;
}

function groupAssignmentsByCategory(resources: AdminResource[]): Record<ResourceCategory, CohortAssignment[]> {
  const grouped = Object.fromEntries(RESOURCE_CATEGORIES.map((c) => [c.id, [] as CohortAssignment[]])) as Record<
    ResourceCategory,
    CohortAssignment[]
  >;

  const sorted = [...resources].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  for (const resource of sorted) {
    if (!grouped[resource.category]) continue;
    grouped[resource.category].push({
      resourceId: resource.id,
      isFeatured: resource.isFeatured ?? false,
    });
  }
  return grouped;
}

function flattenAssignments(
  byCategory: Record<ResourceCategory, CohortAssignment[]>
): { resource_id: string; sort_order: number; is_featured: boolean }[] {
  const result: { resource_id: string; sort_order: number; is_featured: boolean }[] = [];
  let order = 0;
  for (const { id } of RESOURCE_CATEGORIES) {
    for (const item of byCategory[id] ?? []) {
      result.push({
        resource_id: item.resourceId,
        sort_order: order++,
        is_featured: item.isFeatured,
      });
    }
  }
  return result;
}

function kindLabel(kind: string) {
  return kind === 'youtube' ? 'YouTube' : 'PDF';
}

type ResourceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  resource: AdminResource | null;
  defaultCategory?: ResourceCategory;
  onSaved: () => void;
};

function ResourceFormDialog({ open, onOpenChange, mode, resource, defaultCategory, onSaved }: ResourceFormDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ResourceFormState>(() => defaultFormState(defaultCategory));

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && resource) {
      setForm(formStateFromResource(resource));
    } else {
      setForm(defaultFormState(defaultCategory));
    }
  }, [open, mode, resource, defaultCategory]);

  const handleSubmit = () => {
    const title = form.title.trim();
    const tag = form.tag.trim();
    if (!title || !tag) {
      toast({ message: 'Title and tag are required.', variant: 'error' });
      return;
    }
    if (form.kind === 'youtube' && !form.youtubeUrl.trim()) {
      toast({ message: 'YouTube URL or video ID is required.', variant: 'error' });
      return;
    }
    if (mode === 'create' && form.kind === 'pdf' && !form.pdfFile) {
      toast({ message: 'PDF file is required.', variant: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        let pdfStoragePath: string | undefined;
        if (form.kind === 'pdf' && form.pdfFile) {
          pdfStoragePath = await uploadResourcePdf(form.pdfFile);
        }

        const payload: CreateAdminResourceInput = {
          category: form.category,
          kind: form.kind,
          title,
          tag,
          summary: form.summary.trim() || null,
          thumbnail_url: form.thumbnailUrl.trim() || null,
          speaker: form.speaker.trim() || null,
          duration: form.duration.trim() || null,
          published: form.published,
        };

        if (form.kind === 'youtube') {
          payload.youtube_url = form.youtubeUrl.trim();
        } else if (pdfStoragePath) {
          payload.pdf_storage_path = pdfStoragePath;
        }

        if (mode === 'create') {
          await createAdminResourceAction(payload);
          toast({ message: 'Resource created.', variant: 'success' });
        } else if (resource) {
          await patchAdminResourceAction(resource.id, payload);
          toast({ message: 'Resource updated.', variant: 'success' });
        }

        onOpenChange(false);
        onSaved();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to save resource.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create resource' : 'Edit resource'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a PDF or YouTube item to the global library.'
              : 'Update library metadata. Upload a new PDF below to replace the file.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kind">
              <select
                value={form.kind}
                disabled={mode === 'edit'}
                onChange={(e) => setForm((prev) => ({ ...prev, kind: e.target.value as ResourceKind }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="pdf">PDF</option>
                <option value="youtube">YouTube</option>
              </select>
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as ResourceCategory }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
              >
                {RESOURCE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Title">
            <TextInput value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} />
          </Field>
          <Field label="Tag">
            <TextInput value={form.tag} onChange={(value) => setForm((prev) => ({ ...prev, tag: value }))} />
          </Field>
          <Field label="Summary">
            <Textarea
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              rows={3}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Thumbnail URL">
              <TextInput
                value={form.thumbnailUrl}
                onChange={(value) => setForm((prev) => ({ ...prev, thumbnailUrl: value }))}
              />
            </Field>
            <Field label="Duration">
              <TextInput
                value={form.duration}
                onChange={(value) => setForm((prev) => ({ ...prev, duration: value }))}
                placeholder="e.g. 12 min"
              />
            </Field>
          </div>

          <Field label="Speaker">
            <TextInput value={form.speaker} onChange={(value) => setForm((prev) => ({ ...prev, speaker: value }))} />
          </Field>

          {form.kind === 'youtube' ? (
            <Field label="YouTube URL or video ID">
              <TextInput
                value={form.youtubeUrl}
                onChange={(value) => setForm((prev) => ({ ...prev, youtubeUrl: value }))}
                placeholder="https://youtube.com/watch?v=…"
              />
            </Field>
          ) : (
            <Field label={mode === 'edit' ? 'Replace PDF (optional)' : 'PDF file'}>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setForm((prev) => ({ ...prev, pdfFile: e.target.files?.[0] ?? null }))}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand"
              />
            </Field>
          )}

          <Checkbox
            checked={form.published}
            onChange={(checked) => setForm((prev) => ({ ...prev, published: checked }))}
            label="Published"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="light" size="sm" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="sm" loading={pending} onClick={handleSubmit}>
            {mode === 'create' ? 'Create' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ResourceManagerView({ resources, programCohorts }: ResourceManagerViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('Library');
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editResource, setEditResource] = useState<AdminResource | null>(null);
  const [deleteResource, setDeleteResource] = useState<AdminResource | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const filteredResources = useMemo(() => {
    if (categoryFilter === 'all') return resources;
    return resources.filter((r) => r.category === categoryFilter);
  }, [resources, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: resources.length };
    for (const { id } of RESOURCE_CATEGORIES) {
      counts[id] = resources.filter((r) => r.category === id).length;
    }
    return counts;
  }, [resources]);

  const refresh = useCallback(() => router.refresh(), [router]);

  const handleDelete = () => {
    if (!deleteResource) return;
    startDeleteTransition(async () => {
      try {
        await deleteAdminResourceAction(deleteResource.id);
        toast({ message: 'Resource deleted.', variant: 'success' });
        setDeleteResource(null);
        refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to delete resource.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <>
      <TabBar tabs={[...TABS]} active={activeTab} onChange={(tab) => setActiveTab(tab as TabId)} />

      {activeTab === 'Library' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={categoryFilter === 'all'}
                count={categoryCounts.all}
                onClick={() => setCategoryFilter('all')}
              >
                All
              </FilterChip>
              {RESOURCE_CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat.id}
                  active={categoryFilter === cat.id}
                  count={categoryCounts[cat.id]}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {cat.label}
                </FilterChip>
              ))}
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              New resource
            </Button>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <SectionHead
                title="Library"
                subtitle={`${filteredResources.length} resource${filteredResources.length === 1 ? '' : 's'}`}
                className="mb-0"
              />
            </div>
            <DataTable>
              <DataTableHead>
                <DataTableHeaderCell>Title</DataTableHeaderCell>
                <DataTableHeaderCell>Category</DataTableHeaderCell>
                <DataTableHeaderCell>Kind</DataTableHeaderCell>
                <DataTableHeaderCell>Tag</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right"> </DataTableHeaderCell>
              </DataTableHead>
              <DataTableBody>
                {filteredResources.length === 0 ? (
                  <DataTableRow>
                    <DataTableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                      No resources in this category yet.
                    </DataTableCell>
                  </DataTableRow>
                ) : (
                  filteredResources.map((resource) => (
                    <DataTableRow key={resource.id}>
                      <DataTableCell>
                        <div className="flex items-center gap-2">
                          {resource.kind === 'youtube' ? (
                            <Video className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
                          ) : (
                            <FileText className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                          )}
                          <span className="font-semibold text-slate-800">{resource.title}</span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>{CATEGORY_LABELS[resource.category] ?? resource.category}</DataTableCell>
                      <DataTableCell>{kindLabel(resource.kind)}</DataTableCell>
                      <DataTableCell>{resource.tag}</DataTableCell>
                      <DataTableCell>
                        <Pill tone={resource.published ? 'success' : 'neutral'}>
                          {resource.published ? 'Published' : 'Draft'}
                        </Pill>
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Edit resource"
                            onClick={() => setEditResource(resource)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Delete resource"
                            onClick={() => setDeleteResource(resource)}
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          </Card>
        </div>
      ) : (
        <CohortAssignmentsPanel resources={resources} programCohorts={programCohorts} />
      )}

      {createOpen ? (
        <ResourceFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          mode="create"
          resource={null}
          defaultCategory={categoryFilter === 'all' ? 'plans' : categoryFilter}
          onSaved={refresh}
        />
      ) : null}

      {editResource ? (
        <ResourceFormDialog
          open={Boolean(editResource)}
          onOpenChange={(open) => {
            if (!open) setEditResource(null);
          }}
          mode="edit"
          resource={editResource}
          onSaved={refresh}
        />
      ) : null}

      <Dialog open={Boolean(deleteResource)} onOpenChange={(open) => !open && setDeleteResource(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete resource</DialogTitle>
            <DialogDescription>
              Remove &ldquo;{deleteResource?.title}&rdquo; from the library? Cohort assignments referencing it will also
              be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="light"
              size="sm"
              onClick={() => setDeleteResource(null)}
              disabled={deletePending}
            >
              Cancel
            </Button>
            <Button type="button" variant="danger" size="sm" loading={deletePending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type CohortAssignmentsPanelProps = {
  resources: AdminResource[];
  programCohorts: ProgramCohortOption[];
};

function CohortAssignmentsPanel({ resources, programCohorts }: CohortAssignmentsPanelProps) {
  const { toast } = useToast();
  const [selectedProgramId, setSelectedProgramId] = useState(programCohorts[0]?.id ?? '');
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [categories, setCategories] = useState<CohortResourceCategory[]>([]);
  const [assignmentsByCategory, setAssignmentsByCategory] = useState<Record<ResourceCategory, CohortAssignment[]>>(() =>
    groupAssignmentsByCategory([])
  );
  const [loading, setLoading] = useState(false);
  const [savePending, startSaveTransition] = useTransition();
  const [addCategory, setAddCategory] = useState<ResourceCategory | null>(null);

  const selectedProgram = programCohorts.find((p) => p.id === selectedProgramId);
  const cohortOptions = selectedProgram?.cohorts ?? [];

  useEffect(() => {
    if (!selectedProgramId && programCohorts[0]) {
      setSelectedProgramId(programCohorts[0].id);
    }
  }, [programCohorts, selectedProgramId]);

  useEffect(() => {
    const firstCohort = cohortOptions[0]?.id ?? '';
    setSelectedCohortId(firstCohort);
  }, [selectedProgramId, cohortOptions]);

  const loadCohortData = useCallback(
    async (cohortId: string) => {
      if (!cohortId) {
        setCategories([]);
        setAssignmentsByCategory(groupAssignmentsByCategory([]));
        return;
      }
      setLoading(true);
      try {
        const [categoryData, resourceData] = await Promise.all([
          getCohortResourceCategoriesAction(cohortId),
          getCohortResourcesAction(cohortId),
        ]);
        setCategories(categoryData.categories);
        setAssignmentsByCategory(groupAssignmentsByCategory(resourceData.resources));
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to load cohort data.',
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    void loadCohortData(selectedCohortId);
  }, [selectedCohortId, loadCohortData]);

  const resourceById = useMemo(() => Object.fromEntries(resources.map((r) => [r.id, r])), [resources]);

  const setFeatured = (resourceId: string) => {
    setAssignmentsByCategory((prev) => {
      const next = { ...prev };
      for (const { id } of RESOURCE_CATEGORIES) {
        next[id] = (next[id] ?? []).map((item) => ({
          ...item,
          isFeatured: item.resourceId === resourceId,
        }));
      }
      return next;
    });
  };

  const moveAssignment = (category: ResourceCategory, index: number, direction: -1 | 1) => {
    setAssignmentsByCategory((prev) => {
      const list = [...(prev[category] ?? [])];
      const target = index + direction;
      if (target < 0 || target >= list.length) return prev;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, [category]: list };
    });
  };

  const removeAssignment = (category: ResourceCategory, resourceId: string) => {
    setAssignmentsByCategory((prev) => ({
      ...prev,
      [category]: (prev[category] ?? []).filter((item) => item.resourceId !== resourceId),
    }));
  };

  const addAssignment = (category: ResourceCategory, resourceId: string) => {
    setAssignmentsByCategory((prev) => {
      const existing = new Set(RESOURCE_CATEGORIES.flatMap((c) => (prev[c.id] ?? []).map((item) => item.resourceId)));
      if (existing.has(resourceId)) return prev;
      return {
        ...prev,
        [category]: [...(prev[category] ?? []), { resourceId, isFeatured: false }],
      };
    });
    setAddCategory(null);
  };

  const toggleCategoryVisible = (categoryId: ResourceCategory, visible: boolean) => {
    setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, visible } : cat)));
  };

  const handleSave = () => {
    if (!selectedCohortId) return;
    startSaveTransition(async () => {
      try {
        const categoryPayload: CohortResourceCategoryInput[] = categories.map((cat) => ({
          category: cat.id,
          visible: cat.visible,
        }));
        await putCohortResourceCategoriesAction(selectedCohortId, categoryPayload);
        await putCohortResourcesAction(selectedCohortId, flattenAssignments(assignmentsByCategory));
        toast({ message: 'Cohort assignments saved.', variant: 'success' });
        await loadCohortData(selectedCohortId);
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to save cohort assignments.',
          variant: 'error',
        });
      }
    });
  };

  const featuredResourceId = useMemo(() => {
    for (const { id } of RESOURCE_CATEGORIES) {
      const featured = (assignmentsByCategory[id] ?? []).find((item) => item.isFeatured);
      if (featured) return featured.resourceId;
    }
    return '';
  }, [assignmentsByCategory]);

  if (programCohorts.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">No programs or cohorts available yet.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Program">
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
            >
              {programCohorts.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cohort">
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              disabled={cohortOptions.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
            >
              {cohortOptions.length === 0 ? (
                <option value="">No cohorts</option>
              ) : (
                cohortOptions.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} · starts {cohort.startsOn}
                  </option>
                ))
              )}
            </select>
          </Field>
        </div>
      </Card>

      {loading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading cohort assignments…</p>
        </Card>
      ) : (
        RESOURCE_CATEGORIES.map((catDef) => {
          const categoryMeta = categories.find((c) => c.id === catDef.id);
          const visible = categoryMeta?.visible ?? true;
          const assignments = assignmentsByCategory[catDef.id] ?? [];
          const assignedIds = new Set(
            RESOURCE_CATEGORIES.flatMap((c) => (assignmentsByCategory[c.id] ?? []).map((a) => a.resourceId))
          );
          const availableToAdd = resources.filter(
            (r) => r.category === catDef.id && r.published && !assignedIds.has(r.id)
          );

          return (
            <Card key={catDef.id}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <SectionHead title={catDef.label} subtitle={`${assignments.length} assigned`} />
                <Checkbox
                  checked={visible}
                  onChange={(checked) => toggleCategoryVisible(catDef.id, checked)}
                  label="Visible to members"
                />
              </div>

              {assignments.length === 0 ? (
                <p className="mb-3 text-sm text-slate-500">No resources assigned in this category.</p>
              ) : (
                <ul className="mb-3 flex flex-col gap-2">
                  {assignments.map((assignment, index) => {
                    const resource = resourceById[assignment.resourceId];
                    if (!resource) return null;
                    const isFeatured = featuredResourceId === assignment.resourceId;
                    return (
                      <li
                        key={assignment.resourceId}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border border-slate-100 bg-canvas px-3 py-2.5',
                          isFeatured && 'border-brand/30 bg-brand/5'
                        )}
                      >
                        <button
                          type="button"
                          aria-label={isFeatured ? 'Featured resource' : 'Set as featured'}
                          onClick={() => setFeatured(assignment.resourceId)}
                          className={cn(
                            'shrink-0 rounded-full p-1 transition-colors',
                            isFeatured ? 'text-brand' : 'text-slate-300 hover:text-brand'
                          )}
                        >
                          <Star className={cn('h-4 w-4', isFeatured && 'fill-current')} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{resource.title}</p>
                          <p className="text-xs text-slate-500">
                            {kindLabel(resource.kind)} · {resource.tag}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Move up"
                            disabled={index === 0}
                            onClick={() => moveAssignment(catDef.id, index, -1)}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Move down"
                            disabled={index === assignments.length - 1}
                            onClick={() => moveAssignment(catDef.id, index, 1)}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Remove"
                            onClick={() => removeAssignment(catDef.id, assignment.resourceId)}
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Button
                type="button"
                variant="light"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                disabled={availableToAdd.length === 0}
                onClick={() => setAddCategory(catDef.id)}
              >
                Add from library
              </Button>
            </Card>
          );
        })
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={savePending}
          disabled={!selectedCohortId || loading}
          onClick={handleSave}
        >
          Save cohort assignments
        </Button>
      </div>

      <Dialog open={addCategory != null} onOpenChange={(open) => !open && setAddCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add from library</DialogTitle>
            <DialogDescription>
              Choose a published resource in {addCategory ? CATEGORY_LABELS[addCategory] : 'this category'}.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto">
            {addCategory &&
              resources
                .filter((r) => {
                  const assignedIds = new Set(
                    RESOURCE_CATEGORIES.flatMap((c) => (assignmentsByCategory[c.id] ?? []).map((a) => a.resourceId))
                  );
                  return r.category === addCategory && r.published && !assignedIds.has(r.id);
                })
                .map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => addAssignment(addCategory, resource.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    {resource.kind === 'youtube' ? (
                      <Video className="h-4 w-4 shrink-0 text-red-500" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-brand" />
                    )}
                    <span className="font-medium text-slate-800">{resource.title}</span>
                  </button>
                ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
