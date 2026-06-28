import React, { useState, useEffect, useCallback } from 'react';
import {
  Building,
  Plus,
  Trash2,
  Mail,
  Check,
  X,
  Crown,
  Loader2,
  Upload,
  Bell,
  Users,
  Image,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import teamService, { TeamMember as ApiTeamMember } from '@/services/team.service';
import companyService from '@/services/company.service';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FileUpload } from '@/components/ui/FileUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface TeamMember {
  id: string | number;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer' | 'HR' | 'Recruiter';
  status: 'Active' | 'Pending' | 'Inactive';
  isOwner?: boolean;
}

interface CompanySettings {
  name: string;
  description: string;
  website: string;
  industry: string;
  size: string;
  logoUrl: string;
}

const ROLE_STYLES: Record<string, string> = {
  Owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  HR: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  Recruiter: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Member: 'bg-muted text-muted-foreground',
  Viewer: 'bg-muted text-muted-foreground',
};

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-500',
  Pending: 'bg-amber-500',
  Inactive: 'bg-muted-foreground',
};

const AVATAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500', 'bg-cyan-500'];

function avatarColor(name: string) {
  return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length];
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const canInvite = !user?.invitedByUserId;
  const isReadOnly = !!user?.invitedByUserId;

  // Company profile state
  const [companyLoading, setCompanyLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [company, setCompany] = useState<CompanySettings>({
    name: '', description: '', website: '', industry: '', size: '', logoUrl: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Team members state
  const [membersLoading, setMembersLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteLimit, setInviteLimit] = useState<{ canInvite: boolean; current: number; limit: number } | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'HR' | 'Recruiter'>('Recruiter');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    newApplications: { email: true, inApp: true },
    interviewReminders: { email: true, inApp: true },
    pipelineChanges: { email: false, inApp: true },
    offerUpdates: { email: true, inApp: true },
    teamUpdates: { email: false, inApp: true },
    systemUpdates: { email: true, inApp: false },
  });

  // Fetch company settings
  const fetchCompany = useCallback(async () => {
    setCompanyLoading(true);
    try {
      const data = await companyService.getCompany();
      if (data && typeof data === 'object' && !('success' in data && data.success === false)) {
        const c = data as { name?: string; description?: string; website?: string; industry?: string; size?: string; logoUrl?: string };
        setCompany({
          name: c.name || '', description: c.description || '', website: c.website || '',
          industry: c.industry || '', size: c.size || '', logoUrl: c.logoUrl || '',
        });
        if (c.logoUrl) setLogoPreview(c.logoUrl);
      }
    } catch { /* ignore */ } finally { setCompanyLoading(false); }
  }, []);

  // Fetch team members
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const { members } = await teamService.getMembers();
      setTeamMembers(members.map((m: ApiTeamMember) => ({
        id: m.id, name: m.name || m.email, email: m.email,
        role: (m.isOwner ? 'Owner' : m.role) as TeamMember['role'],
        status: 'Active' as const, isOwner: m.isOwner,
      })));
      const limit = await teamService.getInviteLimit();
      setInviteLimit(limit);
    } catch {
      toast({ title: 'Error', description: 'Failed to load team members', variant: 'destructive' });
    } finally { setMembersLoading(false); }
  }, [toast]);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);
  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Save company profile
  const handleSaveCompany = async () => {
    if (isReadOnly) return;
    if (!company.name.trim()) {
      toast({ title: 'Error', description: 'Company name is required', variant: 'destructive' });
      return;
    }
    setSaveLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', company.name.trim());
      fd.append('description', company.description.trim());
      fd.append('website', company.website.trim());
      fd.append('industry', company.industry.trim());
      fd.append('size', company.size.trim());
      fd.append('location', '');
      if (logoFile) fd.append('logo', logoFile);
      await companyService.upsertCompany(fd);
      toast({ title: 'Saved', description: 'Company profile updated.' });
      await fetchCompany();
      setLogoFile(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally { setSaveLoading(false); }
  };

  // Invite member
  const handleInviteMember = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast({ title: 'Error', description: 'Name and email are required', variant: 'destructive' });
      return;
    }
    if (inviteLimit && !inviteLimit.canInvite) {
      toast({ title: 'Limit reached', description: `Your plan allows up to ${inviteLimit.limit} members.`, variant: 'destructive' });
      return;
    }
    setInviteLoading(true);
    try {
      await teamService.inviteMember(inviteName.trim(), inviteEmail.trim(), inviteRole);
      toast({ title: 'Invitation sent', description: 'Login credentials have been emailed.' });
      setInviteName(''); setInviteEmail(''); setShowInviteDialog(false);
      fetchMembers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg || 'Failed to send invitation', variant: 'destructive' });
    } finally { setInviteLoading(false); }
  };

  // Remove member
  const handleRemoveMember = async (memberId: string | number) => {
    if (typeof memberId !== 'number') return;
    try {
      await teamService.removeMember(memberId);
      toast({ title: 'Member removed', description: 'Team member has been removed.' });
      fetchMembers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg || 'Failed to remove member', variant: 'destructive' });
    }
  };

  // Logo file handler
  const handleLogoFiles = (files: File[]) => {
    const file = files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Toggle notification preference
  const toggleNotification = (key: keyof typeof notifications, channel: 'email' | 'inApp') => {
    setNotifications(prev => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }));
  };

  const notificationItems: { key: keyof typeof notifications; title: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'newApplications', title: 'New Applications', desc: 'When candidates apply to your jobs', icon: <Mail className="h-4 w-4" /> },
    { key: 'interviewReminders', title: 'Interview Reminders', desc: 'Before scheduled interviews', icon: <Bell className="h-4 w-4" /> },
    { key: 'pipelineChanges', title: 'Pipeline Changes', desc: 'When candidates move between stages', icon: <Users className="h-4 w-4" /> },
    { key: 'offerUpdates', title: 'Offer Updates', desc: 'When offer letters are accepted or declined', icon: <Check className="h-4 w-4" /> },
    { key: 'teamUpdates', title: 'Team Activity', desc: 'Team member actions and updates', icon: <Users className="h-4 w-4" /> },
    { key: 'systemUpdates', title: 'System Updates', desc: 'Important platform announcements', icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your company profile, team, and notification preferences</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="company" className="gap-2">
            <Building className="h-4 w-4" />
            Company Profile
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* ── Company Profile Tab ── */}
        <TabsContent value="company">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Company Profile</CardTitle>
                <CardDescription>Update your company information and branding</CardDescription>
              </div>
              {!isReadOnly && (
                <Button onClick={handleSaveCompany} disabled={saveLoading || companyLoading}>
                  {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {companyLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Logo upload */}
                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-start gap-4">
                      {logoPreview ? (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          <img src={logoPreview} alt="Company logo" className="h-full w-full object-cover" />
                          {!isReadOnly && (
                            <button
                              onClick={() => { setLogoFile(null); setLogoPreview(''); }}
                              className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-sm"
                              aria-label="Remove logo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {!isReadOnly && (
                        <FileUpload
                          accept="image/png,image/jpeg,image/svg+xml"
                          maxSizeMB={2}
                          onFiles={handleLogoFiles}
                          className="flex-1 py-4"
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">Upload logo</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, or SVG up to 2MB</p>
                        </FileUpload>
                      )}
                    </div>
                  </div>

                  {/* Company fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="company-name"
                        value={company.name}
                        onChange={e => !isReadOnly && setCompany({ ...company, name: e.target.value })}
                        disabled={isReadOnly}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-industry">Industry</Label>
                      <Input
                        id="company-industry"
                        value={company.industry}
                        onChange={e => !isReadOnly && setCompany({ ...company, industry: e.target.value })}
                        disabled={isReadOnly}
                        placeholder="Technology"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-website">Website</Label>
                      <Input
                        id="company-website"
                        type="url"
                        value={company.website}
                        onChange={e => !isReadOnly && setCompany({ ...company, website: e.target.value })}
                        disabled={isReadOnly}
                        placeholder="https://yourcompany.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-size">Company Size</Label>
                      <Input
                        id="company-size"
                        value={company.size}
                        onChange={e => !isReadOnly && setCompany({ ...company, size: e.target.value })}
                        disabled={isReadOnly}
                        placeholder="e.g., 1-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-description">Description</Label>
                    <textarea
                      id="company-description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={company.description}
                      onChange={e => !isReadOnly && setCompany({ ...company, description: e.target.value })}
                      disabled={isReadOnly}
                      rows={3}
                      placeholder="What does your company do?"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Team Members Tab ── */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>
                  Manage your team
                  {inviteLimit && canInvite && (
                    <span className="ml-2 text-xs font-medium text-muted-foreground">
                      ({inviteLimit.current}/{inviteLimit.limit} members)
                    </span>
                  )}
                </CardDescription>
              </div>
              {canInvite && inviteLimit?.canInvite !== false && (
                <Button onClick={() => setShowInviteDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : teamMembers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No team members yet.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border">
                  {teamMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(m.name)}`}>
                          {(m.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            {m.name}
                            {m.isOwner && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                          </div>
                          <div className="text-xs text-muted-foreground">{m.email}</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_COLORS[m.status] || 'bg-muted-foreground'}`} />
                            <span className="text-xs text-muted-foreground">{m.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_STYLES[m.role] || ROLE_STYLES.Member}`}>
                          {m.role}
                        </span>
                        {!m.isOwner && canInvite && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveMember(m.id)}
                            aria-label={`Remove ${m.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified about activity</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Column headers */}
              <div className="mb-2 flex items-center justify-end gap-8 pr-1">
                <span className="text-xs font-medium text-muted-foreground w-12 text-center">Email</span>
                <span className="text-xs font-medium text-muted-foreground w-12 text-center">In-app</span>
              </div>
              <div className="divide-y divide-border rounded-lg border">
                {notificationItems.map(({ key, title, desc, icon }) => (
                  <div key={key} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        {icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{title}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex w-12 justify-center">
                        <Switch
                          checked={notifications[key].email}
                          onCheckedChange={() => toggleNotification(key, 'email')}
                          aria-label={`${title} email notifications`}
                        />
                      </div>
                      <div className="flex w-12 justify-center">
                        <Switch
                          checked={notifications[key].inApp}
                          onCheckedChange={() => toggleNotification(key, 'inApp')}
                          aria-label={`${title} in-app notifications`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Invite Member Dialog ── */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full Name</Label>
              <Input id="invite-name" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input id="invite-email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="jane@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as 'HR' | 'Recruiter')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="HR">HR</option>
                <option value="Recruiter">Recruiter</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} disabled={inviteLoading}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={inviteLoading}>
              {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {inviteLoading ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
