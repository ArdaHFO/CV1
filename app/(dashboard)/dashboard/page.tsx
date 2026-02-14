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
import { getCurrentUser } from '@/lib/auth/auth';
import { getUserResumes, createResume, deleteResume } from '@/lib/database/resumes';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import type { Resume } from '@/types';

type PlanTier = 'freemium' | 'pro';

export default function DashboardPage() {
  const router = useRouter();
  const { resumes, setResumes, addResume, deleteResume: removeResume, updateResume, setDefaultResume } = useDashboardStore();
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
  const [userId, setUserId] = useState('');
  const { isDark } = useAppDarkModeState();

  const loadBillingStatus = async () => {
    const response = await fetch('/api/billing/status');
    const payload = (await response.json()) as {
      success?: boolean;
      status?: { planTier: PlanTier; remaining: { cvCreations: number | 'unlimited' } };
    };

    if (!response.ok || !payload.success || !payload.status) {
      setPlanTier('freemium');
      setRemainingCvCreations(1);
      return { tier: 'freemium' as PlanTier, remainingCv: 1 };
    }

    setPlanTier(payload.status.planTier);
    const remaining = payload.status.remaining.cvCreations === 'unlimited' ? Number.POSITIVE_INFINITY : payload.status.remaining.cvCreations;
    setRemainingCvCreations(remaining);
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

    const latestBilling = await loadBillingStatus();
    const tier = latestBilling.tier;

    if (tier === 'freemium' && latestBilling.remainingCv <= 0) {
      setCvLimitMessage('Freemium allows only 1 CV creation. Upgrade to Pro for unlimited CVs.');
      return;
    }

    setCreating(true);

    // Create URL-friendly slug
    const slug = newResumeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

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

    if (!consumeResponse.ok || !consumePayload.success || !consumePayload.allowed) {
      setCreating(false);
      setCvLimitMessage(
        consumePayload.message || 'Freemium allows only 1 CV creation. Upgrade to Pro for unlimited CVs.'
      );
      return;
    }

    const newResume = await createResume(userId, newResumeTitle, slug);
    if (!newResume) {
      setCreating(false);
      setCvLimitMessage('Could not create CV right now. Please try again.');
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

  const handleRenameSubmit = () => {
    if (!renamingResume || !renameTitle.trim()) return;

    const slug = renameTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    updateResume(renamingResume.id, {
      title: renameTitle,
      slug,
      updated_at: new Date().toISOString(),
    });

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
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-zinc-200 dark:border-zinc-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  const defaultResume = resumes.find(r => r.is_default);

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 space-y-8 px-4 py-8">
        <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with Animation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            My CVs
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage and edit all your CV versions
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {planTier === 'pro'
              ? 'Pro plan: Unlimited CV creation'
              : `Freemium plan: ${remainingCvCreations}/1 CV creation remaining`}
          </p>
          {cvLimitMessage && <p className="text-xs text-amber-700 dark:text-amber-400">{cvLimitMessage}</p>}
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Create New CV
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl">Create New CV</DialogTitle>
              <DialogDescription className="text-base">
                Enter a title for your CV. For example: "Frontend Developer", "Project Manager"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">CV Title</Label>
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
                  className="h-11 border-zinc-300 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-500 transition-colors duration-300"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={creating}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateResume} 
                disabled={creating || !newResumeTitle.trim() || (planTier === 'freemium' && remainingCvCreations <= 0)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl">Rename CV</DialogTitle>
              <DialogDescription className="text-base">
                Enter a new title for your CV
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rename-title" className="text-sm font-medium">CV Title</Label>
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
                  className="h-11 border-zinc-300 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-500 transition-colors duration-300"
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
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRenameSubmit}
                disabled={!renameTitle.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Rename
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards - Only show if there are resumes */}
      {resumes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total CVs</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{resumes.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 backdrop-blur-sm hover:scale-105 transition-all duration-300 ${defaultResume ? 'cursor-pointer hover:shadow-2xl hover:border-purple-400 dark:hover:border-purple-600' : 'opacity-60'}`}
            onClick={() => defaultResume && router.push(`/editor/${defaultResume.id}`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Default CV</p>
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-100 mt-2 truncate">
                    {defaultResume?.title || 'None'}
                  </p>
                  {defaultResume && (
                    <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">Click to edit</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumes Grid */}
      {resumes.length === 0 ? (
        <Card className="border-dashed border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              No CVs created yet
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-center max-w-md">
              Start by creating your first CV. With our AI-powered editor and templates, prepare
              your professional CV in minutes.
            </p>
            <Button 
              onClick={() => setCreateDialogOpen(true)} 
              className="gap-2 group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Create My First CV
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {resumes.map((resume, index) => (
            <Card 
              key={resume.id} 
              className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700"
              style={{
                animationName: 'fadeInUp',
                animationDuration: '0.6s',
                animationTimingFunction: 'ease-out',
                animationFillMode: 'forwards',
                animationDelay: `${index * 100}ms`,
              }}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {resume.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Updated: {new Date(resume.updated_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
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
                      className="text-red-600"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm h-6">
                  <Badge
                    className={`bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none shadow-sm ${
                      resume.is_default ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    Default
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 group/btn border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300"
                    onClick={() => router.push(`/editor/${resume.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform duration-300" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300 hover:scale-110"
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
    </div>
  );
}
