import React, { useState, useEffect, useCallback } from 'react';
import {
  Building, MapPin, Globe, Briefcase, Clock, DollarSign,
  Users, Calendar, Share2, Check, Facebook, Twitter,
  Instagram, Youtube, ExternalLink, Search, X, Copy, ArrowUpRight
} from 'lucide-react';

import jobService, { Job } from '@/services/job.service';
import companyService from '@/services/company.service';
import authService from '@/services/auth.service';
import candidateAuthService from '@/services/candidate-auth.service';
import applicationService from '@/services/application.service';
import { useToast } from '@/hooks/use-toast';
import JobApplicationDialog from '@/components/JobApplicationDialog';

/* ─── Responsive Hooks ─────────────────────────────────────────────────────── */
const useIsMobile = () => {
  const [v, setV] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setV(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return v;
};
const useIsTablet = () => {
  const [v, setV] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => setV(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return v;
};

/* ─── Share Modal ──────────────────────────────────────────────────────────── */
const ShareModal: React.FC<{ job: Job; onClose: () => void }> = ({ job, onClose }) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);
  const jobUrl = `${window.location.origin}/careers/job/${job.id}`;
  const shareText = `*${job.title}* at *${job.company}*\nLocation: ${job.location || 'Remote'}\nType: ${job.type?.replace('-', ' ')}\n${job.salary ? `Salary: ${job.salary}\n` : ''}Apply: ${jobUrl}\n#Jobs #Hiring`;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const copyLink = async () => { await navigator.clipboard.writeText(jobUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); };
  const copyText = () => { navigator.clipboard.writeText(shareText); setTextCopied(true); setTimeout(() => setTextCopied(false), 3000); };

  const options = [
    {
      label: 'WhatsApp', bg: '#25D366',
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank'),
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
    },
    {
      label: 'LinkedIn', bg: '#0077B5',
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`, '_blank'),
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
    },
    {
      label: textCopied ? 'Copied!' : 'Instagram',
      bg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',
      action: copyText,
      icon: textCopied ? <Check size={18} /> : <Instagram size={18} />
    },
    {
      label: linkCopied ? 'Copied!' : 'Copy Link',
      bg: '#18181b', action: copyLink,
      icon: linkCopied ? <Check size={18} /> : <Copy size={18} />
    },
  ];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '16px' }}
    >
      <div style={{ background: '#fff', width: '100%', maxWidth: 440, borderRadius: 20, animation: 'popIn .28s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
        <div style={{ height: 8 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>Share this role</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555', flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#f9fafb', margin: '14px 16px', borderRadius: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
            {(job.company || 'J')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111' }}>{job.title}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{job.company} · {job.location || 'Remote'}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 16px' }}>
          {options.map(o => (
            <button key={o.label} onClick={o.action}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 16px', borderRadius: 12, border: 'none', background: o.bg, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', WebkitTapHighlightColor: 'transparent' }}>
              {o.icon}<span>{o.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: 16, border: 'none', borderTop: '1px solid #f3f4f6', background: 'transparent', fontSize: 14, color: '#9ca3af', cursor: 'pointer', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>Cancel</button>
      </div>
    </div>
  );
};

/* ─── Job Card ─────────────────────────────────────────────────────────────── */
const JobCard: React.FC<{ job: Job; applied: boolean; onApply: () => void; onShare: () => void; index: number; isMobile: boolean }> = ({ job, applied, onApply, onShare, index, isMobile }) => {
  const [hov, setHov] = useState(false);
  const typeColors: Record<string, string> = { 'full-time': '#6366f1', 'part-time': '#0891b2', 'contract': '#d97706', 'internship': '#059669', 'remote': '#7c3aed' };
  const tc = typeColors[job.type] || '#6366f1';

  return (
    <div
      onMouseEnter={() => !isMobile && setHov(true)}
      onMouseLeave={() => !isMobile && setHov(false)}
      style={{
        background: '#fff', borderRadius: 16,
        border: `1.5px solid ${hov ? '#e0e0ff' : '#f0f0f0'}`,
        padding: isMobile ? '18px 16px' : '24px 28px',
        transition: 'all .22s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 14px 44px rgba(0,0,0,0.07)' : '0 1px 4px rgba(0,0,0,0.04)',
        animation: 'fadeInUp .45s ease both',
        animationDelay: `${index * 0.06}s`,
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      }}
    >
      {/* Top */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: tc, background: tc + '18', padding: '3px 10px', borderRadius: 20, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            {job.department || job.type?.replace('-', ' ') || 'General'}
          </span>
          <h3 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: '#111', margin: 0, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', lineHeight: 1.2, wordBreak: 'break-word' as const }}>
            {job.title}
          </h3>
        </div>
        <button onClick={onShare} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', WebkitTapHighlightColor: 'transparent' }}>
          <Share2 size={14} />
        </button>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 14 }}>
        {job.location && <MetaChip icon={<MapPin size={11} />} label={`${job.location}${job.isRemote ? ' · Remote' : ''}`} />}
        {job.salary && <MetaChip icon={<DollarSign size={11} />} label={job.salary} color="#059669" bg="#ecfdf5" border="#d1fae5" />}
        {job.experience && <MetaChip icon={<Briefcase size={11} />} label={job.experience} />}
        {job.deadline && <MetaChip icon={<Clock size={11} />} label={`by ${new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} color="#dc2626" bg="#fef2f2" border="#fecaca" />}
      </div>

      {/* Desc */}
      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#6b7280', margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
        {job.description}
      </p>

      {/* Skills */}
      {(() => {
        const skills = Array.isArray(job.skills) ? job.skills : typeof job.skills === "string" ? (() => { try { return JSON.parse(job.skills); } catch { return []; } })() : [];
        const limit = isMobile ? 4 : 7;
        return skills.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 18 }}>
          {skills.slice(0, limit).map((s: string, i: number) => (
            <span key={i} style={{ fontSize: 11.5, fontWeight: 500, color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '3px 10px', borderRadius: 6 }}>{s}</span>
          ))}
          {skills.length > limit && (
            <span style={{ fontSize: 11.5, color: '#9ca3af', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '3px 10px', borderRadius: 6 }}>
              +{skills.length - limit}
            </span>
          )}
        </div>
        ) : null;
      })()}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' as const, gap: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9ca3af' }}>
          <Calendar size={12} />
          Posted {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        {applied ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 16px', borderRadius: 10 }}>
            <Check size={13} />Applied
          </div>
        ) : (
          <button onClick={onApply}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: '#fff', background: '#111', padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', WebkitTapHighlightColor: 'transparent', width: isMobile ? '100%' : 'auto' }}>
            Apply Now <ArrowUpRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Tiny atoms ───────────────────────────────────────────────────────────── */
const MetaChip: React.FC<{ icon: React.ReactNode; label: string; color?: string; bg?: string; border?: string }> = ({ icon, label, color = '#6b7280', bg = '#f9fafb', border = '#f0f0f0' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color, background: bg, border: `1px solid ${border}`, padding: '4px 10px', borderRadius: 20 }}>
    {icon}{label}
  </span>
);
const Chip: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.82)', background: 'rgba(255,255,255,0.11)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.13)' }}>
    {icon}<span>{label}</span>
  </div>
);
const AboutCard: React.FC<{ icon: string; title: string; text: string; light: string }> = ({ icon, title, text, light }) => (
  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 22, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{icon}</div>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 8px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>{title}</h3>
    <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#6b7280', margin: 0 }}>{text}</p>
  </div>
);
const SocialBtn: React.FC<{ href: string; label: string; icon: React.ReactNode; color: string }> = ({ href, label, icon, color }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', WebkitTapHighlightColor: 'transparent' }}>
    <span style={{ color }}>{icon}</span>{label}
  </a>
);

/* ─── Main Component ───────────────────────────────────────────────────────── */
const CompanyJobsPortal = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplication, setShowApplication] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [shareModalJob, setShareModalJob] = useState<Job | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState('all');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const checkAppliedJobs = useCallback(async () => {
    const candidate = candidateAuthService.getCurrentCandidate();
    if (!candidate?.email) return;
    try {
      const res = await applicationService.getCandidateApplications();
      if (res.success && res.applications) setAppliedJobs(new Set(res.applications.map((a: any) => a.jobId || a.job?.id)));
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const urlCompanyId = params.get('company');
      const urlUserId = params.get('u');
      const currentUser = authService.getCurrentUser();
      let company: any = null, jobs: Job[] = [];

      if (currentUser && !urlCompanyId) {
        const [cr, jr]: any = await Promise.all([
          companyService.getCompany().catch((e: any) => ({ error: e })),
          jobService.getUserJobs().catch((e: any) => ({ error: e }))
        ]);
        company = cr && !cr.error ? (cr.company || cr) : null;
        jobs = jr && !jr.error ? (jr.jobs || jr) : [];
      } else if (urlCompanyId) {
        const id = Number(urlCompanyId);
        const uid = urlUserId ? Number(urlUserId) : null;
        const cr: any = await companyService.getCompanyById(id).catch((e: any) => ({ error: e }));
        company = cr && !cr.error ? (cr.company || cr) : null;
        if (!company) {
          const cr2: any = await companyService.getCompanyByUserId(uid ?? id).catch((e: any) => ({ error: e }));
          company = cr2 && !cr2.error ? (cr2.company || cr2) : null;
        }
        const jr: any = await jobService.getAllJobs().catch((e: any) => ({ error: e }));
        const all = jr && !jr.error ? (jr.jobs || jr) : [];
        if (company && Array.isArray(all)) jobs = all.filter((j: Job) => j.status === 'active' && j.companyId === company.userId);
      } else {
        toast({ title: 'Authentication required', variant: 'destructive' });
        setData(null); setLoading(false); return;
      }
      if (Array.isArray(jobs)) jobs = jobs.filter((j: Job) => j.status === 'active');
      if (!company) { toast({ title: 'Company not found', variant: 'destructive' }); setData(null); return; }
      setData({ company, jobs });
    } catch {
      toast({ title: 'Error loading data', variant: 'destructive' }); setData(null);
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadData(); checkAppliedJobs(); }, [loadData, checkAppliedJobs]);
  useEffect(() => { if (data?.company?.name) document.title = `Careers at ${data.company.name}`; }, [data]);

  const handleCopyCompanyLink = async () => {
    try {
      const base = window.location.origin;
      const cId = data?.company?.id, uId = data?.company?.userId;
      if (!cId) { toast({ title: 'Unable to share', variant: 'destructive' }); return; }
      await navigator.clipboard.writeText(`${base}/careers?company=${cId}${uId ? `&u=${uId}` : ''}`);
      setCopiedLink(true); toast({ title: 'Link copied!' }); setTimeout(() => setCopiedLink(false), 2500);
    } catch { toast({ title: 'Failed to copy', variant: 'destructive' }); }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', gap: 16, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#111', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>Loading careers page...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Error ── */
  if (!data) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', gap: 8, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <p style={{ fontSize: 18, fontWeight: 600, color: '#374151', margin: 0 }}>Page not available</p>
      <p style={{ color: '#9ca3af', margin: 0 }}>This company page could not be loaded.</p>
    </div>
  );

  const { company, jobs } = data;
  const jobTypes = ['all', ...Array.from(new Set<string>(jobs.map((j: Job) => j.type).filter(Boolean))) as string[]];
  const filteredJobs = jobs.filter((j: Job) => {
    const ms = j.title.toLowerCase().includes(searchTerm.toLowerCase())
      || j.company.toLowerCase().includes(searchTerm.toLowerCase())
      || (j.department && j.department.toLowerCase().includes(searchTerm.toLowerCase()));
    return ms && (activeFilter === 'all' || j.type === activeFilter);
  });

  // Responsive padding
  const sidePad = isMobile ? 16 : isTablet ? 24 : 48;
  const maxW = 1400;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>


      {shareModalJob && <ShareModal job={shareModalJob} onClose={() => setShareModalJob(null)} />}

      {/* ══ HERO ══ */}
      <section style={{ background: 'linear-gradient(140deg,#0f0c29 0%,#302b63 55%,#1a1a3e 100%)', position: 'relative', overflow: 'hidden', paddingBottom: isMobile ? 56 : 80 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.055) 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(139,92,246,0.18)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(59,130,246,0.14)', filter: 'blur(70px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: maxW, margin: '0 auto', padding: `${isMobile ? 44 : 64}px ${sidePad}px 0`, position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ width: isMobile ? 64 : 80, height: isMobile ? 64 : 80, borderRadius: isMobile ? 16 : 20, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.28)', overflow: 'hidden', marginBottom: isMobile ? 20 : 28, flexShrink: 0, position: 'relative' }}>
            <img src={company.logoUrl || company.logo || ''} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e: any) => { e.target.style.display = 'none'; }} />
            <span style={{ position: 'absolute', fontSize: 30, fontWeight: 800, color: '#111', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
              {(company.name || 'C').charAt(0)}
            </span>
          </div>

          {/* Hiring badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: '#6ee7b7', background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.22)', padding: '5px 13px', borderRadius: 20, marginBottom: 18, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', animation: 'blink 2s ease infinite', flexShrink: 0, display: 'inline-block' }} />
            We're Hiring
          </div>

          <h1 style={{ fontSize: isMobile ? 30 : 50, fontWeight: 800, color: '#fff', margin: '0 0 14px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {company.name}
          </h1>
          <p style={{ fontSize: isMobile ? 14 : 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.62)', margin: '0 0 22px', maxWidth: 720 }}>
            {company.description}
          </p>

          {/* Stat chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 28 }}>
            {company.industry && <Chip icon={<Building size={12} />} label={company.industry} />}
            {company.size && <Chip icon={<Users size={12} />} label={company.size} />}
            {company.location && <Chip icon={<MapPin size={12} />} label={company.location} />}
            {company.founded && <Chip icon={<Calendar size={12} />} label={`Est. ${company.founded}`} />}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: isMobile ? '10px 18px' : '11px 22px', borderRadius: 12, background: '#fff', color: '#111', fontSize: isMobile ? 13 : 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.2)', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', WebkitTapHighlightColor: 'transparent' }}>
                <Globe size={14} /> Website <ExternalLink size={12} />
              </a>
            )}
            <button onClick={handleCopyCompanyLink}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: isMobile ? '10px 18px' : '11px 22px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: isMobile ? 13 : 14, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', WebkitTapHighlightColor: 'transparent' }}>
              {copiedLink ? <><Check size={14} /> Copied!</> : <><Share2 size={14} /> Share Page</>}
            </button>
          </div>
        </div>
      </section>

      {/* ══ ABOUT ══ */}
      {(company.mission || company.values || company.culture) && (
        <section style={{ padding: `${isMobile ? 48 : 64}px 0`, background: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ maxWidth: maxW, margin: '0 auto', padding: `0 ${sidePad}px` }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#111', margin: '0 0 4px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>Why Join Us</h2>
            <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 24px' }}>What sets us apart</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              {company.mission && <AboutCard icon="🎯" title="Our Mission" text={company.mission} light="#eef2ff" />}
              {company.values && <AboutCard icon="💎" title="Our Values" text={company.values} light="#ecfeff" />}
              {company.culture && <AboutCard icon="🌱" title="Our Culture" text={company.culture} light="#fffbeb" />}
            </div>
          </div>
        </section>
      )}

      {/* ══ SOCIAL ══ */}
      {company.social && Object.values(company.social).some(Boolean) && (
        <section style={{ padding: `${isMobile ? 32 : 44}px 0`, borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
          <div style={{ maxWidth: maxW, margin: '0 auto', padding: `0 ${sidePad}px` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 14px' }}>Follow along</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
              {company.social.facebook && <SocialBtn href={company.social.facebook} label="Facebook" icon={<Facebook size={15} />} color="#1877f2" />}
              {company.social.twitter && <SocialBtn href={company.social.twitter} label="Twitter" icon={<Twitter size={15} />} color="#1da1f2" />}
              {company.social.instagram && <SocialBtn href={company.social.instagram} label="Instagram" icon={<Instagram size={15} />} color="#e1306c" />}
              {company.social.youtube && <SocialBtn href={company.social.youtube} label="YouTube" icon={<Youtube size={15} />} color="#ff0000" />}
            </div>
          </div>
        </section>
      )}

      {/* ══ JOBS ══ */}
      <section style={{ padding: `${isMobile ? 44 : 64}px 0 100px` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', padding: `0 ${sidePad}px` }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: isMobile ? 20 : 28, flexWrap: 'wrap' as const }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#111', margin: '0 0 4px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>Open Positions</h2>
              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>{filteredJobs.length} {filteredJobs.length === 1 ? 'role' : 'roles'} available</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 20, padding: '6px 14px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0ea5e9', animation: 'blink 2s ease infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0369a1', whiteSpace: 'nowrap' as const }}>Actively hiring</span>
            </div>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
            <Search size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search roles or departments..." style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#111', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', outline: 'none', minWidth: 0 }} />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter tabs – scrollable on mobile */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto' as const, paddingBottom: 2, msOverflowStyle: 'none', scrollbarWidth: 'none' as const }}>
            {jobTypes.map(t => (
              <button key={t} onClick={() => setActiveFilter(t)}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${activeFilter === t ? '#111' : '#e5e7eb'}`, background: activeFilter === t ? '#111' : '#fff', color: activeFilter === t ? '#fff' : '#6b7280', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', transition: 'all .15s', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', WebkitTapHighlightColor: 'transparent' }}>
                {t === 'all' ? 'All Roles' : t.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Job list */}
          {filteredJobs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: isMobile ? '60px 0' : '90px 0', textAlign: 'center' as const }}>
              <Briefcase size={40} style={{ color: '#d1d5db', marginBottom: 14 }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: 0 }}>No roles found</p>
              <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 6 }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 1fr', gap: 14 }}>
              {filteredJobs.map((job: Job, i: number) => (
                <JobCard key={job.id} job={job} index={i} isMobile={isMobile}
                  applied={appliedJobs.has(job.id)}
                  onApply={() => { setSelectedJob(job); setShowApplication(true); }}
                  onShare={() => setShareModalJob(job)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: '#111', padding: isMobile ? '24px 16px' : `28px ${sidePad}px` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
          <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 800, color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>{company.name}</span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>© {new Date().getFullYear()} All rights reserved</span>
        </div>
      </footer>

      <JobApplicationDialog
        job={selectedJob}
        open={showApplication}
        onOpenChange={setShowApplication}
        onApplicationSubmitted={() => {
          if (selectedJob) setAppliedJobs(prev => new Set([...prev, selectedJob.id]));
          checkAppliedJobs();
        }}
      />

      <style>{`
        @keyframes fadeInUp { from { opacity:0;transform:translateY(18px); } to { opacity:1;transform:translateY(0); } }
        @keyframes spin     { to { transform:rotate(360deg); } }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes popIn    { from { transform:scale(0.88);opacity:0; } to { transform:scale(1);opacity:1; } }
        *  { box-sizing:border-box; }
        input:focus { outline:none; }
        ::-webkit-scrollbar { display:none; }
        a,button { -webkit-tap-highlight-color:transparent; }
      `}</style>
    </div>
  );
};

export default CompanyJobsPortal;
