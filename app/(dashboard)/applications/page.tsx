'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import { getCurrentUser } from '@/lib/auth/auth';
import { getUserResumes, getActiveResumeVersion } from '@/lib/database/resumes';
import {
  addApplicationInterview,
  addApplicationNote,
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
} from '@/lib/database/applications';
import type { Application, ApplicationStatus, Resume } from '@/types';

const STATUS_OPTIONS: ApplicationStatus[] = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];

const getStatusStyle = (status: ApplicationStatus) => {
  switch (status) {
    case 'Applied':    return 'border-black bg-black text-white';
    case 'Screening':  return 'border-[#FF8C00] bg-[#FF8C00] text-white';
    case 'Interview':  return 'border-[#0A66C2] bg-[#0A66C2] text-white';
    case 'Offer':      return 'border-[#16a34a] bg-[#16a34a] text-white';
    case 'Rejected':   return 'border-[#FF3000] bg-[#FF3000] text-white';
    default:           return 'border-black bg-white text-black';
  }
};

type ApplicationFormState = {
  job_title: string;
  company: string;
  location: string;
  job_url: string;
  status: ApplicationStatus;
  applied_at: string;
  reminder_at: string;
  resume_id: string;
};

const emptyForm: ApplicationFormState = {
  job_title: '',
  company: '',
  location: '',
  job_url: '',
  status: 'Applied',
  applied_at: '',
  reminder_at: '',
  resume_id: '',
};

export default function ApplicationsPage() {
  const router = useRouter();
  const { isDark } = useAppDarkModeState();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [formState, setFormState] = useState<ApplicationFormState>(emptyForm);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [noteText, setNoteText] = useState('');
  const [interviewStage, setInterviewStage] = useState('Interview');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [reminderSending, setReminderSending] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const resumeOptions = useMemo(() => resumes, [resumes]);

  const loadData = async (userId: string) => {
    const [apps, userResumes] = await Promise.all([
      getApplications(userId),
      getUserResumes(userId),
    ]);
    setApplications(apps);
    setResumes(userResumes);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setCurrentUserId(user.id);
      await loadData(user.id);
      setLoading(false);
    };

    bootstrap();
  }, [router]);

  const resetForm = () => {
    setFormState(emptyForm);
  };

  const openCreate = () => {
    resetForm();
    setCreateError('');
    setCreateOpen(true);
  };

  const openEdit = (application: Application) => {
    setSelectedApplication(application);
    setFormState({
      job_title: application.job_title,
      company: application.company,
      location: application.location ?? '',
      job_url: application.job_url ?? '',
      status: application.status,
      applied_at: application.applied_at ? application.applied_at.slice(0, 10) : '',
      reminder_at: application.reminder_at ? application.reminder_at.slice(0, 16) : '',
      resume_id: application.resume_id ?? '',
    });
    setEditOpen(true);
  };

  const handleCreate = async () => {
    if (!currentUserId) return;
    if (!formState.job_title.trim() || !formState.company.trim()) return;

    setSaving(true);
    setCreateError('');
    const version = formState.resume_id
      ? await getActiveResumeVersion(formState.resume_id)
      : null;

    const created = await createApplication({
      user_id: currentUserId,
      job_title: formState.job_title,
      company: formState.company,
      location: formState.location || null,
      job_url: formState.job_url || null,
      status: formState.status,
      applied_at: formState.applied_at || null,
      reminder_at: formState.reminder_at || null,
      resume_id: formState.resume_id || null,
      resume_version_id: version?.id ?? null,
    });

    if (created) {
      setApplications((prev) => [created, ...prev]);
      setCreateOpen(false);
      resetForm();
    } else {
      setCreateError('Could not add application. Make sure the tracker tables are deployed and try again.');
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!selectedApplication) return;
    setSaving(true);

    const version = formState.resume_id
      ? await getActiveResumeVersion(formState.resume_id)
      : null;

    const updated = await updateApplication(selectedApplication.id, {
      job_title: formState.job_title,
      company: formState.company,
      location: formState.location || null,
      job_url: formState.job_url || null,
      status: formState.status,
      applied_at: formState.applied_at || null,
      reminder_at: formState.reminder_at || null,
      resume_id: formState.resume_id || null,
      resume_version_id: version?.id ?? null,
    });

    if (updated) {
      setApplications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditOpen(false);
      setSelectedApplication(null);
    }

    setSaving(false);
  };

  const handleDelete = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    const success = await deleteApplication(applicationId);
    if (success) {
      setApplications((prev) => prev.filter((item) => item.id !== applicationId));
    }
  };

  const handleAddNote = async () => {
    if (!selectedApplication || !currentUserId || !noteText.trim()) return;

    setSaving(true);
    const note = await addApplicationNote(selectedApplication.id, currentUserId, noteText.trim());
    if (note) {
      const updatedNotes = [...(selectedApplication.notes || []), note];
      const updatedApplication = { ...selectedApplication, notes: updatedNotes };
      setApplications((prev) =>
        prev.map((item) => (item.id === selectedApplication.id ? updatedApplication : item))
      );
      setSelectedApplication(updatedApplication);
      setNoteText('');
      // Keep dialog open so user can see the newly added note
    }
    setSaving(false);
  };

  const handleSendReminder = async (application: Application) => {
    if (!application.reminder_at) {
      alert('No reminder date set. Edit the application to set a reminder date and time.');
      return;
    }
    setReminderSending(application.id);
    setReminderSuccess(null);
    try {
      const response = await fetch('/api/reminders/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: application.job_title,
          company: application.company,
          reminderAt: application.reminder_at,
        }),
      });
      const data = await response.json() as { success: boolean; error?: string };
      if (data.success) {
        setReminderSuccess(application.id);
        setTimeout(() => setReminderSuccess(null), 4000);
      } else {
        alert(`Could not schedule reminder: ${data.error || 'Unknown error'}`);
      }
    } catch {
      alert('Could not reach the reminder service. Please try again.');
    } finally {
      setReminderSending(null);
    }
  };

  const handleAddInterview = async () => {
    if (!selectedApplication || !currentUserId) return;

    setSaving(true);
    const interview = await addApplicationInterview(
      selectedApplication.id,
      currentUserId,
      interviewStage,
      interviewDate || null,
      interviewNotes || null
    );

    if (interview) {
      const updatedInterviews = [...(selectedApplication.interviews || []), interview];
      const updatedApplication = { ...selectedApplication, interviews: updatedInterviews };
      setApplications((prev) =>
        prev.map((item) => (item.id === selectedApplication.id ? updatedApplication : item))
      );
      setSelectedApplication(updatedApplication);
      setInterviewStage('Interview');
      setInterviewDate('');
      setInterviewNotes('');
      // Keep dialog open so user can see the newly logged interview
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className={`min-h-screen relative flex items-center justify-center ${isDark ? 'dark' : ''} bg-white text-black`}>
        <ShaderBackground isDark={isDark} />
        <div className="relative z-10">
          <div className="w-10 h-10 border-4 border-black border-t-[#FF3000] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''} bg-white text-black`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest">Application Tracker</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">
              Track applications, interviews, and CV versions in one workflow.
            </p>
          </div>
          <Button onClick={openCreate} variant="accent" className="gap-2">
            + Add Application
          </Button>
        </div>

        {/* Application list */}
        <div className="space-y-4">
          {applications.length === 0 && (
            <div className="border-4 border-black bg-white py-16 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60">
                No applications yet. Add your first application to start tracking progress.
              </p>
            </div>
          )}

          {applications.map((application) => (
            <div key={application.id} className="border-4 border-black bg-white">

              {/* Card header */}
              <div className="p-5 border-b-2 border-black flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-black uppercase tracking-widest leading-tight">{application.job_title}</h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-black/60 mt-1">
                    {application.company}{application.location ? ` · ${application.location}` : ''}
                  </p>
                  {application.job_url && (
                    <a href={application.job_url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase tracking-widest text-[#FF3000] hover:underline mt-1 inline-block">
                      View posting ↗
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 border-2 text-[10px] font-black uppercase tracking-widest ${getStatusStyle(application.status)}`}>
                    {application.status}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openEdit(application)}>Edit</Button>
                  <Button variant="outline" size="sm"
                    className="border-[#FF3000] text-[#FF3000] hover:bg-[#FF3000] hover:text-white hover:border-[#FF3000]"
                    onClick={() => handleDelete(application.id)}>
                    Delete
                  </Button>
                </div>
              </div>

              {/* Card body — 3 columns */}
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x-2 divide-black">

                {/* Dates + Reminder */}
                <div className="p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Dates</p>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest">
                      Applied: <span className="font-normal normal-case tracking-normal">{application.applied_at ?? 'Not set'}</span>
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold uppercase tracking-widest">
                        Reminder:{' '}
                        <span className="font-normal normal-case tracking-normal">
                          {application.reminder_at
                            ? new Date(application.reminder_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                            : 'Not set'}
                        </span>
                      </p>
                      {/* Tooltip */}
                      <div className="relative inline-flex items-center">
                        <button type="button"
                          onMouseEnter={() => setTooltipVisible(true)}
                          onMouseLeave={() => setTooltipVisible(false)}
                          onFocus={() => setTooltipVisible(true)}
                          onBlur={() => setTooltipVisible(false)}
                          className="w-4 h-4 rounded-full border-2 border-black bg-[#F2F2F2] flex items-center justify-center text-[9px] font-black cursor-default"
                          aria-label="Reminder info">?</button>
                        {tooltipVisible && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000] z-50">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1">Email Reminder</p>
                            <p className="text-[10px] text-black/70 leading-relaxed">
                              Click &quot;Send Reminder&quot; to schedule an email to your account address at the selected date and time. Delivered automatically — no action needed at reminder time.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {reminderSuccess === application.id ? (
                      <p className="text-[10px] font-black uppercase tracking-widest border-2 border-black bg-[#F2F2F2] px-3 py-1.5 inline-block">
                        ✓ Reminder scheduled!
                      </p>
                    ) : (
                      <Button size="sm" variant="secondary" className="gap-1.5 text-[10px]"
                        disabled={!application.reminder_at || reminderSending === application.id}
                        onClick={() => handleSendReminder(application)}>
                        {reminderSending === application.id ? 'Scheduling...' : 'Send Reminder'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="p-5 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Notes</p>
                    <span className="text-[9px] font-black uppercase tracking-widest border border-black px-1.5 py-0.5 bg-[#F2F2F2]">
                      {application.notes?.length ?? 0}
                    </span>
                  </div>
                  {(application.notes?.length ?? 0) === 0 ? (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">No notes yet</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {application.notes?.map((n) => (
                        <div key={n.id} className="border-2 border-black bg-[#F2F2F2] p-2">
                          <p className="text-[11px] font-medium text-black leading-relaxed whitespace-pre-wrap break-words">{n.note}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mt-1.5">
                            {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button size="sm" variant="outline" className="mt-auto"
                    onClick={() => { setSelectedApplication(application); setNoteOpen(true); }}>
                    + Add Note
                  </Button>
                </div>

                {/* Interviews */}
                <div className="p-5 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Interviews</p>
                    <span className="text-[9px] font-black uppercase tracking-widest border border-black px-1.5 py-0.5 bg-[#F2F2F2]">
                      {application.interviews?.length ?? 0}
                    </span>
                  </div>
                  {(application.interviews?.length ?? 0) === 0 ? (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">No interviews logged</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {application.interviews?.map((iv) => (
                        <div key={iv.id} className="border-2 border-black bg-[#F2F2F2] p-2">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest border-2 border-black bg-white px-1.5 py-0.5">
                              {iv.stage}
                            </span>
                            {iv.scheduled_at && (
                              <span className="text-[10px] font-bold text-black/60">
                                {new Date(iv.scheduled_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            )}
                          </div>
                          {iv.notes && (
                            <p className="text-[11px] font-medium text-black leading-relaxed whitespace-pre-wrap break-words">{iv.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button size="sm" variant="outline" className="mt-auto"
                    onClick={() => { setSelectedApplication(application); setInterviewOpen(true); }}>
                    + Log Interview
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl border-4 border-black">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-widest">Add Application</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-black/60">Track a new job application.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {createError && (
              <div className="md:col-span-2 border-2 border-[#FF3000] p-3 text-xs font-bold text-[#FF3000] uppercase tracking-widest">{createError}</div>
            )}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Job Title</Label>
              <Input value={formState.job_title} onChange={(e) => setFormState((prev) => ({ ...prev, job_title: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Company</Label>
              <Input value={formState.company} onChange={(e) => setFormState((prev) => ({ ...prev, company: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Location</Label>
              <Input value={formState.location} onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Job URL</Label>
              <Input value={formState.job_url} onChange={(e) => setFormState((prev) => ({ ...prev, job_url: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Status</Label>
              <Select value={formState.status} onValueChange={(v) => setFormState((prev) => ({ ...prev, status: v as ApplicationStatus }))}>
                <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Applied Date</Label>
              <Input type="date" value={formState.applied_at} onChange={(e) => setFormState((prev) => ({ ...prev, applied_at: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                Reminder Date &amp; Time
                <span className="relative group/tip">
                  <span className="w-4 h-4 rounded-full border-2 border-black bg-[#F2F2F2] flex items-center justify-center text-[9px] font-black cursor-default inline-flex">?</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000] z-50 hidden group-hover/tip:block text-[10px] font-normal normal-case tracking-normal text-black/70 leading-relaxed whitespace-normal">
                    Set a date and time. After saving, click &quot;Send Reminder&quot; on the card — an email will be automatically sent to your account address at that exact time.
                  </span>
                </span>
              </Label>
              <Input type="datetime-local" value={formState.reminder_at} onChange={(e) => setFormState((prev) => ({ ...prev, reminder_at: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Resume</Label>
              <Select value={formState.resume_id} onValueChange={(v) => setFormState((prev) => ({ ...prev, resume_id: v }))}>
                <SelectTrigger className="border-2 border-black"><SelectValue placeholder="Select resume" /></SelectTrigger>
                <SelectContent>{resumeOptions.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Add Application'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl border-4 border-black">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-widest">Edit Application</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-black/60">Update status, dates, and linked CV.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Job Title</Label>
              <Input value={formState.job_title} onChange={(e) => setFormState((prev) => ({ ...prev, job_title: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Company</Label>
              <Input value={formState.company} onChange={(e) => setFormState((prev) => ({ ...prev, company: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Location</Label>
              <Input value={formState.location} onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Job URL</Label>
              <Input value={formState.job_url} onChange={(e) => setFormState((prev) => ({ ...prev, job_url: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Status</Label>
              <Select value={formState.status} onValueChange={(v) => setFormState((prev) => ({ ...prev, status: v as ApplicationStatus }))}>
                <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Applied Date</Label>
              <Input type="date" value={formState.applied_at} onChange={(e) => setFormState((prev) => ({ ...prev, applied_at: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                Reminder Date &amp; Time
                <span className="relative group/tip">
                  <span className="w-4 h-4 rounded-full border-2 border-black bg-[#F2F2F2] flex items-center justify-center text-[9px] font-black cursor-default inline-flex">?</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000] z-50 hidden group-hover/tip:block text-[10px] font-normal normal-case tracking-normal text-black/70 leading-relaxed whitespace-normal">
                    Set a date and time. After saving, click &quot;Send Reminder&quot; on the card — an email will be automatically sent to your account address at that exact time.
                  </span>
                </span>
              </Label>
              <Input type="datetime-local" value={formState.reminder_at} onChange={(e) => setFormState((prev) => ({ ...prev, reminder_at: e.target.value }))} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Resume</Label>
              <Select value={formState.resume_id} onValueChange={(v) => setFormState((prev) => ({ ...prev, resume_id: v }))}>
                <SelectTrigger className="border-2 border-black"><SelectValue placeholder="Select resume" /></SelectTrigger>
                <SelectContent>{resumeOptions.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Note Dialog ── */}
      <Dialog open={noteOpen} onOpenChange={(open) => { setNoteOpen(open); if (!open) setNoteText(''); }}>
        <DialogContent className="sm:max-w-lg border-4 border-black">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-widest">
              Notes{selectedApplication ? ` — ${selectedApplication.job_title} @ ${selectedApplication.company}` : ''}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-black/60">
              {(selectedApplication?.notes?.length ?? 0) === 0 ? 'No notes yet.' : `${selectedApplication?.notes?.length} note${(selectedApplication?.notes?.length ?? 0) !== 1 ? 's' : ''} saved.'`}
            </DialogDescription>
          </DialogHeader>

          {/* Existing notes */}
          {(selectedApplication?.notes?.length ?? 0) > 0 && (
            <div className="max-h-52 overflow-y-auto space-y-2 border-2 border-black p-3 bg-[#F2F2F2]">
              {selectedApplication?.notes?.map((n) => (
                <div key={n.id} className="border-2 border-black bg-white p-3">
                  <p className="text-sm font-medium text-black leading-relaxed whitespace-pre-wrap break-words">{n.note}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mt-2">
                    {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add new note */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">New Note</Label>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              placeholder="Type your note here…"
              className="border-2 border-black"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Close</Button>
            <Button variant="accent" onClick={handleAddNote} disabled={saving || !noteText.trim()}>
              {saving ? 'Saving...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Interview Dialog ── */}
      <Dialog open={interviewOpen} onOpenChange={(open) => { setInterviewOpen(open); if (!open) { setInterviewStage('Interview'); setInterviewDate(''); setInterviewNotes(''); } }}>
        <DialogContent className="sm:max-w-lg border-4 border-black">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-widest">
              Interviews{selectedApplication ? ` — ${selectedApplication.job_title} @ ${selectedApplication.company}` : ''}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-black/60">
              {(selectedApplication?.interviews?.length ?? 0) === 0 ? 'No interviews logged yet.' : `${selectedApplication?.interviews?.length} interview stage${(selectedApplication?.interviews?.length ?? 0) !== 1 ? 's' : ''} logged.`}
            </DialogDescription>
          </DialogHeader>

          {/* Existing interviews */}
          {(selectedApplication?.interviews?.length ?? 0) > 0 && (
            <div className="max-h-52 overflow-y-auto space-y-2 border-2 border-black p-3 bg-[#F2F2F2]">
              {selectedApplication?.interviews?.map((iv) => (
                <div key={iv.id} className="border-2 border-black bg-white p-3">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest border-2 border-black px-2 py-0.5 bg-[#F2F2F2]">
                      {iv.stage}
                    </span>
                    {iv.scheduled_at && (
                      <span className="text-xs font-bold text-black/60">
                        {new Date(iv.scheduled_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                  {iv.notes ? (
                    <p className="text-sm font-medium text-black leading-relaxed whitespace-pre-wrap break-words">{iv.notes}</p>
                  ) : (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">No notes for this stage.</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Log new interview */}
          <div className="border-t-2 border-black pt-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Log New Stage</p>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Stage</Label>
              <Select value={interviewStage} onValueChange={setInterviewStage}>
                <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Phone Screen', 'Screening', 'Technical', 'Interview', 'Final Round', 'Offer', 'Other'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Date &amp; Time</Label>
              <Input type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="border-2 border-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Notes</Label>
              <Textarea
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                rows={3}
                placeholder="Questions asked, impressions, next steps…"
                className="border-2 border-black"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterviewOpen(false)}>Close</Button>
            <Button variant="accent" onClick={handleAddInterview} disabled={saving}>
              {saving ? 'Saving...' : 'Log Interview'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
