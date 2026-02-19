'use client';

import { useEffect, useState, useRef } from 'react';
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

// ─── Pong Easter Egg ───────────────────────────────────────────────────────────────────────
const PW = 400, PH = 260, PPH = 64, PPW = 10, PB = 10;
function PongGame() {
  const init = () => ({ py: PH/2-PPH/2, ay: PH/2-PPH/2, bx: PW/2, by: PH/2, vx: 3, vy: 2, ps: 0, as: 0 });
  const r = useRef(init());
  const [pY, setPY] = useState(r.current.py);
  const [aY, setAY] = useState(r.current.ay);
  const [ball, setBall] = useState({ x: PW/2, y: PH/2 });
  const [sc, setSc] = useState({ p: 0, a: 0 });
  const [go, setGo] = useState(false);
  const [win, setWin] = useState<'p'|'a'|null>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key==='ArrowUp'||e.key==='w') { r.current.py=Math.max(0,r.current.py-22); setPY(r.current.py); if(!go)setGo(true); e.preventDefault(); }
      if (e.key==='ArrowDown'||e.key==='s') { r.current.py=Math.min(PH-PPH,r.current.py+22); setPY(r.current.py); if(!go)setGo(true); e.preventDefault(); }
    };
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h);
  },[go]);
  useEffect(() => {
    if (!go||win) return;
    const t = setInterval(() => {
      const s=r.current; let {bx,by,vx,vy}=s;
      bx+=vx; by+=vy;
      if(by<=0){by=0;vy=-vy;} if(by>=PH-PB){by=PH-PB;vy=-vy;}
      if(vx>0&&bx+PB>=PW-20&&bx+PB<=PW-10&&by+PB>=s.py&&by<=s.py+PPH){bx=PW-20-PB;vx=-(Math.abs(vx)+0.3);vy+=(Math.random()-0.5)*1.5;}
      if(vx<0&&bx<=20&&bx>=10&&by+PB>=s.ay&&by<=s.ay+PPH){bx=20;vx=Math.abs(vx)+0.3;vy+=(Math.random()-0.5)*1.5;}
      vx=Math.max(-9,Math.min(9,vx)); vy=Math.max(-7,Math.min(7,vy));
      const am=s.ay+PPH/2,bm=by+PB/2;
      if(am<bm-4)s.ay=Math.min(PH-PPH,s.ay+3); else if(am>bm+4)s.ay=Math.max(0,s.ay-3); setAY(s.ay);
      if(bx<0){s.ps+=1;setSc({p:s.ps,a:s.as});if(s.ps>=5){setWin('p');return;}Object.assign(s,{bx:PW/2,by:PH/2,vx:3,vy:Math.random()>.5?2:-2});bx=s.bx;by=s.by;vx=s.vx;vy=s.vy;}
      if(bx>PW){s.as+=1;setSc({p:s.ps,a:s.as});if(s.as>=5){setWin('a');return;}Object.assign(s,{bx:PW/2,by:PH/2,vx:-3,vy:Math.random()>.5?2:-2});bx=s.bx;by=s.by;vx=s.vx;vy=s.vy;}
      s.bx=bx;s.by=by;s.vx=vx;s.vy=vy; setBall({x:bx,y:by});
    },16); return ()=>clearInterval(t);
  },[go,win]);
  const reset=()=>{const i=init();r.current=i;setPY(i.py);setAY(i.ay);setBall({x:i.bx,y:i.by});setSc({p:0,a:0});setGo(false);setWin(null);};
  const mv=(dy:number)=>{r.current.py=Math.max(0,Math.min(PH-PPH,r.current.py+dy));setPY(r.current.py);if(!go&&!win)setGo(true);};
  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="flex items-center gap-8 text-xs font-black uppercase tracking-widest">
        <span>AI: {sc.a}</span><span className="text-[#FF3000]">VS</span><span>You: {sc.p}</span>
      </div>
      <div className="border-4 border-black bg-white overflow-hidden relative" style={{width:PW,height:PH}}>
        <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-black/20" />
        <div className="absolute bg-black/70" style={{left:10,top:aY,width:PPW,height:PPH}} />
        <div className="absolute bg-[#FF3000]" style={{right:10,top:pY,width:PPW,height:PPH}} />
        <div className="absolute bg-black" style={{left:ball.x,top:ball.y,width:PB,height:PB}} />
        {!go&&!win&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90"><p className="text-[10px] font-black uppercase tracking-widest">↑↓ / W S to start</p><p className="text-[10px] font-bold uppercase tracking-widest text-black/50">First to 5 wins</p></div>}
        {win&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95"><p className="text-xl font-black uppercase tracking-widest">{win==='p'?'🏆 You Win!':'🤖 AI Wins'}</p><button type="button" onClick={reset} className="border-4 border-black bg-black text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors">Rematch</button></div>}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={()=>mv(-25)} className="w-9 h-9 border-2 border-black bg-[#F2F2F2] font-black text-sm hover:bg-black hover:text-white transition-colors">▲</button>
        <button type="button" onClick={()=>mv(25)} className="w-9 h-9 border-2 border-black bg-[#F2F2F2] font-black text-sm hover:bg-black hover:text-white transition-colors">▼</button>
      </div>
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

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

  // Easter egg: click title 7× to open Pong
  const [pongOpen, setPongOpen] = useState(false);
  const eggCountRef = useRef(0);
  const eggTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTitleClick = () => {
    eggCountRef.current += 1;
    if (eggTimerRef.current) clearTimeout(eggTimerRef.current);
    if (eggCountRef.current >= 7) { eggCountRef.current = 0; setPongOpen(true); return; }
    eggTimerRef.current = setTimeout(() => { eggCountRef.current = 0; }, 2000);
  };

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
      status?: {
        planTier: PlanTier;
        remaining: {
          cvCreations: number | 'unlimited';
          cvImports: number | 'unlimited';
          jobSearches: number;
        };
      };
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

  const handleSetDefaultResume = async (resumeId: string) => {
    // Clear default on all resumes in DB first
    for (const r of resumes) {
      if (r.is_default && r.id !== resumeId) {
        await updateResume(r.id, { is_default: false });
      }
    }
    // Set the new default in DB
    await updateResume(resumeId, { is_default: true });
    // Update store
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
          <h1 className="text-3xl font-black uppercase tracking-widest cursor-default" onClick={handleTitleClick} title="">My CVs</h1>
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
          <Button onClick={() => setUploadDialogOpen(true)} variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import CV
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="accent"
                className="gap-2"
                onClick={(e) => {
                  if (planTier === 'freemium' && remainingCvCreations <= 0) {
                    e.preventDefault();
                    setShowUpgradeModal(true);
                  }
                }}
              >
                <Plus className="w-4 h-4" />
                Create New CV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-4 border-black">
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
          <DialogContent className="sm:max-w-md border-4 border-black">
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
          <div className="border-4 border-black bg-[#F2F2F2] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Total CVs</p>
                <p className="text-4xl font-black mt-2 tabular-nums">{resumes.length}</p>
              </div>
              <div className="border-2 border-black bg-white p-2 self-start">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div
            className={`border-4 border-black bg-white p-6 ${defaultResume ? 'cursor-pointer hover:bg-[#F2F2F2]' : 'opacity-60'}`}
            onClick={() => defaultResume && router.push(`/editor/${defaultResume.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Default CV</p>
                <p className="text-xl font-black mt-2 truncate">
                  {defaultResume?.title || 'None'}
                </p>
                {defaultResume && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mt-1">Click to edit</p>
                )}
              </div>
              <div className="border-2 border-black p-2 self-start flex-shrink-0">
                <Star className="w-6 h-6" fill="currentColor" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumes Grid */}
      {resumes.length === 0 ? (
        <div className="border-4 border-black bg-white py-20 flex flex-col items-center justify-center">
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
          <Button onClick={() => setCreateDialogOpen(true)} variant="accent" className="gap-2">
            <Plus className="w-4 h-4" />
            Create My First CV
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div key={resume.id} className="border-4 border-black bg-white flex flex-col">
              {/* Card Header */}
              <div className="p-5 border-b-2 border-black flex flex-row items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-base font-black uppercase tracking-widest leading-tight truncate">
                    {resume.title}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">
                    Updated: {new Date(resume.updated_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  {resume.is_default && (
                    <span className="inline-block border-2 border-black bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 border-2 border-black">
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
                      onClick={() => window.open(`/preview/username/${resume.slug}`, '_blank')}
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
              </div>
              {/* Card Footer */}
              <div className="p-5 flex items-center gap-2 mt-auto">
                <Button
                  variant="accent"
                  className="flex-1 gap-2"
                  onClick={() => router.push(`/editor/${resume.id}`)}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-black h-9 w-9 shrink-0"
                  onClick={() => window.open(`/preview/username/${resume.slug}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
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

      {/* ── Pong Easter Egg Dialog ── */}
      <Dialog open={pongOpen} onOpenChange={setPongOpen}>
        <DialogContent className="sm:max-w-[480px] border-4 border-black">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-widest flex items-center gap-2">
              🎮 Hidden Game
              <span className="text-[9px] font-black uppercase tracking-[0.3em] border-2 border-black px-2 py-0.5">Easter Egg</span>
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-black/60">
              You found the secret Pong game. You control the 🟥 red paddle.
            </DialogDescription>
          </DialogHeader>
          <PongGame />
        </DialogContent>
      </Dialog>

      <UploadCVDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        userId={userId}
      />
    </div>
  );
}
