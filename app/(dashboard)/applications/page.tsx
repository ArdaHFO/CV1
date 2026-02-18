'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const getStatusColor = (status: ApplicationStatus) => {
  switch (status) {
    case 'Applied':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Screening':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Interview':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'Offer':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200';
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
      setApplications((prev) =>
        prev.map((item) =>
          item.id === selectedApplication.id
            ? { ...item, notes: [...(item.notes || []), note] }
            : item
        )
      );
      setNoteText('');
      setNoteOpen(false);
    }
    setSaving(false);
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
      setApplications((prev) =>
        prev.map((item) =>
          item.id === selectedApplication.id
            ? { ...item, interviews: [...(item.interviews || []), interview] }
            : item
        )
      );
      setInterviewStage('Interview');
      setInterviewDate('');
      setInterviewNotes('');
      setInterviewOpen(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className={`min-h-screen relative flex items-center justify-center ${isDark ? 'dark' : ''}`}>
        <ShaderBackground isDark={isDark} />
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Application Tracker
            </h1>
            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Track your applications, interviews, and CV versions in one workflow.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            + Add Application
          </Button>
        </div>

        <div className="grid gap-6">
          {applications.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  No applications yet. Add your first application to start tracking progress.
                </p>
              </CardContent>
            </Card>
          )}

          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {application.job_title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {application.company}
                    {application.location ? ` • ${application.location}` : ''}
                  </CardDescription>
                  {application.job_url && (
                    <a
                      href={application.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View job posting
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                  <Button variant="outline" size="sm" onClick={() => openEdit(application)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(application.id)}>
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    Dates
                  </p>
                  <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    Applied: {application.applied_at ? application.applied_at : 'Not set'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    Reminder: {application.reminder_at ? application.reminder_at : 'Not set'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    Notes
                  </p>
                  <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    {application.notes?.length ?? 0} notes
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedApplication(application);
                      setNoteOpen(true);
                    }}
                  >
                    Add Note
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    Interviews
                  </p>
                  <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    {application.interviews?.length ?? 0} interviews
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedApplication(application);
                      setInterviewOpen(true);
                    }}
                  >
                    Log Interview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
            <DialogDescription>Track a new job application.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                value={formState.job_title}
                onChange={(e) => setFormState((prev) => ({ ...prev, job_title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formState.company}
                onChange={(e) => setFormState((prev) => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formState.location}
                onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-url">Job URL</Label>
              <Input
                id="job-url"
                value={formState.job_url}
                onChange={(e) => setFormState((prev) => ({ ...prev, job_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value as ApplicationStatus }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Applied Date</Label>
              <Input
                type="date"
                value={formState.applied_at}
                onChange={(e) => setFormState((prev) => ({ ...prev, applied_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reminder</Label>
              <Input
                type="datetime-local"
                value={formState.reminder_at}
                onChange={(e) => setFormState((prev) => ({ ...prev, reminder_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Resume</Label>
              <Select
                value={formState.resume_id}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, resume_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumeOptions.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Saving...' : 'Add Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>Update status, dates, and linked CV.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job-title-edit">Job Title</Label>
              <Input
                id="job-title-edit"
                value={formState.job_title}
                onChange={(e) => setFormState((prev) => ({ ...prev, job_title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-edit">Company</Label>
              <Input
                id="company-edit"
                value={formState.company}
                onChange={(e) => setFormState((prev) => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-edit">Location</Label>
              <Input
                id="location-edit"
                value={formState.location}
                onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-url-edit">Job URL</Label>
              <Input
                id="job-url-edit"
                value={formState.job_url}
                onChange={(e) => setFormState((prev) => ({ ...prev, job_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value as ApplicationStatus }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Applied Date</Label>
              <Input
                type="date"
                value={formState.applied_at}
                onChange={(e) => setFormState((prev) => ({ ...prev, applied_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reminder</Label>
              <Input
                type="datetime-local"
                value={formState.reminder_at}
                onChange={(e) => setFormState((prev) => ({ ...prev, reminder_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Resume</Label>
              <Select
                value={formState.resume_id}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, resume_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumeOptions.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Capture key details or feedback.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={saving}>
              {saving ? 'Saving...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={interviewOpen} onOpenChange={setInterviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Interview</DialogTitle>
            <DialogDescription>Track interview stages and notes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={interviewStage} onValueChange={setInterviewStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {['Screening', 'Interview', 'Offer'].map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddInterview} disabled={saving}>
              {saving ? 'Saving...' : 'Log Interview'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
