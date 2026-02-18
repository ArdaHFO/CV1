'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import {
  Plus,
  FileText,
  MoreVertical,
  Edit,
  Trash,
  Copy,
  ExternalLink,
  Star,
  Pencil,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { UploadCVDialog } from '@/components/ui/upload-cv-dialog';
import { getCurrentUser } from '@/lib/auth/auth';
import { getUserResumes, createResumeWithResult, deleteResume, updateResume } from '@/lib/database/resumes';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import type { Resume } from '@/types';

type PlanTier = 'freemium' | 'pro';

export default function DashboardPage() {
  const router = useRouter();
  const { resumes, setResumes, addResume, deleteResume: removeResume, updateResume: updateResumeInStore, setDefaultResume } = useDashboardStore();
  const [loading, setLoading] = useState(false); // Set to false for development
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingResume, setRenamingResume] = useState<Resume | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [planTier, setPlanTier] = useState<PlanTier>('freemium');
  const [remainingCvCreations, setRemainingCvCreations] = useState(1);
  const [cvLimitMessage, setCvLimitMessage] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const { isDark } = useAppDarkModeState();

  const ensureProfileRow = async (): Promise<boolean> => {
    const response = await fetch('/api/profile/ensure', { method: 'POST' });
    const payload = (await response.json()) as { success?: boolean; message?: string };
    if (!response.ok || !payload.success) {
      setCvLimitMessage(payload.message || 'Account setup is incomplete. Please sign out and sign in again.');
      return false;
    }
    return true;
  };

  const loadBillingStatus = async () => {
    const response = await fetch('/api/billing/status');
    const payload = (await response.json()) as {
      success?: boolean;
      status?: { planTier: PlanTier; remaining: { cvCreations: number | 'unlimited' } };
    };

    console.log(`[LOAD_BILLING] response.ok=${response.ok}, payload.success=${payload.success}, payload.status=${JSON.stringify(payload.status)}`);

    if (!response.ok || !payload.success || !payload.status) {
      console.log(`[LOAD_BILLING_FALLBACK] Using default: tier=freemium, remainingCv=1`);
      setPlanTier('freemium');
      setRemainingCvCreations(1);
      return { tier: 'freemium' as PlanTier, remainingCv: 1 };
    }

    setPlanTier(payload.status.planTier);
    const remaining = payload.status.remaining.cvCreations === 'unlimited' ? Number.POSITIVE_INFINITY : payload.status.remaining.cvCreations;
    setRemainingCvCreations(remaining);
    console.log(`[LOAD_BILLING_SUCCESS] planTier=${payload.status.planTier}, remaining=${remaining}`);
    return { tier: payload.status.planTier, remainingCv: remaining };
  };

  useEffect(() => {
    async function loadResumes() {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      setUserId(user.id);

      // Ensure the FK target exists (some older accounts may be missing profiles rows).
      await ensureProfileRow();
      await loadBillingStatus();

      const userResumes = await getUserResumes(user.id);
      setResumes(userResumes);
      setLoading(false);
    }

    loadResumes();
  }, [router, setResumes]);

  const handleCreateResume = async () => {
    if (!newResumeTitle.trim()) return;

    setCvLimitMessage('');

    if (!userId) {
      router.replace('/login');
      return;
    }

    // If profile bootstrap fails, do NOT consume billing credits.
    const profileOk = await ensureProfileRow();
    if (!profileOk) {
      console.log(`[HANDLE_CREATE_PROFILE_FAIL] Profile row could not be ensured`);
      setCreating(false);
      return;
    }

    const latestBilling = await loadBillingStatus();
    const tier = latestBilling.tier;

    console.log(`[HANDLE_CREATE_CHECK] tier=${tier}, remainingCv=${latestBilling.remainingCv}, check_result=${tier === 'freemium' && latestBilling.remainingCv <= 0}`);

    if (tier === 'freemium' && latestBilling.remainingCv <= 0) {
      console.log(`[HANDLE_CREATE_BLOCKED] No remaining CV creations`);
      setCvLimitMessage('Ücretsiz paket ile 1 CV oluşturabilirsiniz. Sınırınıza ulaştınız.');
      setShowUpgradeModal(true);
      return;
    }

    setCreating(true);

    // Create URL-friendly slug
    const slug = newResumeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create resume FIRST, before consuming quota
    const { resume: newResume, reason } = await createResumeWithResult(userId, newResumeTitle, slug);
    
    if (!newResume) {
      // Resume creation failed - don't consume any quota
      setCreating(false);
      console.log(`[CREATE_RESUME_FAILED] reason=${reason}`);
      if (reason === 'missing_profile') {
        setCvLimitMessage('Your account profile is missing. Please sign out and sign in again.');
      } else if (reason === 'rls_denied') {
        setCvLimitMessage('Permission denied while creating CV. Please sign out and sign in again.');
      } else {
        setCvLimitMessage('Could not create CV right now. Please try again.');
      }
      return;
    }

    console.log(`[CREATE_RESUME_SUCCESS] resumeId=${newResume.id}`);

    // Resume created successfully - now consume the quota
    const consumeResponse = await fetch('/api/billing/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cv-creation' }),
    });

    const consumePayload = (await consumeResponse.json()) as {
      success?: boolean;
      allowed?: boolean;
      message?: string;
      status?: { remaining: { cvCreations: number | 'unlimited' } };
    };

    console.log(`[CONSUME_RESPONSE] ok=${consumeResponse.ok}, success=${consumePayload.success}, allowed=${consumePayload.allowed}`);

    if (!consumeResponse.ok || !consumePayload.success || !consumePayload.allowed) {
      // Quota consumption failed - clean up the resume we created
      setCreating(false);
      console.log(`[CONSUME_FAILED] Deleting resume ${newResume.id}`);
      
      // Delete the resume we just created since quota consumption was denied
      await deleteResume(newResume.id);
      
      // Show upgrade modal to user
      setShowUpgradeModal(true);
      return;
    }

    addResume(newResume);
    if (tier === 'freemium') {
      const remaining = consumePayload.status?.remaining.cvCreations;
      setRemainingCvCreations(typeof remaining === 'number' ? remaining : 0);
    }
    setCreateDialogOpen(false);
    setNewResumeTitle('');
    setCreating(false);
    
    // Redirect to editor
    router.push(`/editor/${newResume.id}`);
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this CV?')) return;

    const deleted = await deleteResume(resumeId);
    if (deleted) {
      removeResume(resumeId);
    }
  };

  const handleSetDefaultResume = (resumeId: string) => {
    setDefaultResume(resumeId);
  };

  const handleRenameResume = (resume: Resume) => {
    setRenamingResume(resume);
    setRenameTitle(resume.title);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!renamingResume || !renameTitle.trim()) return;

    const slug = renameTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Update in database first
    const dbResult = await updateResume(renamingResume.id, {
      title: renameTitle,
      slug,
      updated_at: new Date().toISOString(),
    });

    if (dbResult) {
      // Only update the store if database update succeeded
      updateResumeInStore(renamingResume.id, {
        title: renameTitle,
        slug,
        updated_at: new Date().toISOString(),
      });
    }

    setRenameDialogOpen(false);
    setRenamingResume(null);
    setRenameTitle('');
  };

  const copyResumeLink = (resume: Resume) => {
    const link = `${window.location.origin}/preview/username/${resume.slug}`;
    navigator.clipboard.writeText(link);
    // TODO: Show toast notification
    alert('Link copied!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 border-2 border-black bg-white px-4 py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
          <span className="text-xs font-black uppercase tracking-widest">Loading dashboard</span>
        </div>
      </div>
    );
  }

  const defaultResume = resumes.find(r => r.is_default);

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''} bg-white text-black`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 space-y-8 px-4 py-8">
        <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6 border-4 border-black bg-white p-6 swiss-grid-pattern">
        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-widest">My CVs</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-black/70">
            Manage and edit all your CV versions
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">
            {planTier === 'pro'
              ? 'Pro plan: Unlimited CV creation'
              : `Freemium plan: ${remainingCvCreations}/1 CV creation remaining`}
          </p>
          {cvLimitMessage && (
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF3000]">
              {cvLimitMessage}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setUploadDialogOpen(true)} variant="outline">
            <Upload className="w-4 h-4" />
            Import CV
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="w-4 h-4" />
                Create New CV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-black uppercase tracking-widest">Create New CV</DialogTitle>
                <DialogDescription className="text-sm font-bold uppercase tracking-widest text-black/60">
                  Enter a title for your CV. For example: "Frontend Developer", "Project Manager"
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest">CV Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Frontend Developer"
                  value={newResumeTitle}
                  onChange={(e) => setNewResumeTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !creating) {
                      handleCreateResume();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button 
                variant="accent"
                onClick={handleCreateResume} 
                disabled={creating || !newResumeTitle.trim() || (planTier === 'freemium' && remainingCvCreations <= 0)}
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-black uppercase tracking-widest">Rename CV</DialogTitle>
              <DialogDescription className="text-sm font-bold uppercase tracking-widest text-black/60">
                Enter a new title for your CV
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rename-title" className="text-xs font-black uppercase tracking-widest">CV Title</Label>
                <Input
                  id="rename-title"
                  placeholder="e.g., Frontend Developer"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameSubmit();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRenameDialogOpen(false);
                  setRenamingResume(null);
                  setRenameTitle('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="accent"
                onClick={handleRenameSubmit}
                disabled={!renameTitle.trim()}
              >
                Rename
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards - Only show if there are resumes */}
      {resumes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-[#F2F2F2]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Total CVs</p>
                  <p className="text-3xl font-black mt-2">{resumes.length}</p>
                </div>
                <div className="border-2 border-black p-2">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`${defaultResume ? 'cursor-pointer' : 'opacity-60'}`}
            onClick={() => defaultResume && router.push(`/editor/${defaultResume.id}`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-black uppercase tracking-widest">Default CV</p>
                  <p className="text-lg font-black mt-2 truncate">
                    {defaultResume?.title || 'None'}
                  </p>
                  {defaultResume && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">Click to edit</p>
                  )}
                </div>
                <div className="border-2 border-black p-2 flex-shrink-0">
                  <Star className="w-6 h-6" fill="currentColor" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumes Grid */}
      {resumes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="border-2 border-black p-4 mb-6">
              <FileText className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-widest mb-2">
              No CVs created yet
            </h3>
            <p className="text-xs font-bold uppercase tracking-widest text-black/60 mb-8 text-center max-w-md">
              Start by creating your first CV. With our AI-powered editor and templates, prepare
              your professional CV in minutes.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} variant="accent">
              <Plus className="w-4 h-4" />
              Create My First CV
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <Card key={resume.id} className="group">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-lg font-black uppercase tracking-widest">
                    {resume.title}
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-black/60">
                    Updated: {new Date(resume.updated_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => router.push(`/editor/${resume.id}`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRenameResume(resume)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    {!resume.is_default && (
                      <DropdownMenuItem onClick={() => handleSetDefaultResume(resume.id)}>
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => copyResumeLink(resume)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(`/preview/username/${resume.slug}`, '_blank')
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteResume(resume.id)}
                      className="text-[#FF3000]"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm h-6">
                  {resume.is_default && <Badge variant="destructive">Default</Badge>}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/editor/${resume.id}`)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`/preview/username/${resume.slug}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="cv-creation"
      />

      <UploadCVDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        userId={userId}
      />
    </div>
  );
}
