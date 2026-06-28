import api from './api';

export interface MemberPermissions {
  canViewCandidates: boolean;
  canEditJobs: boolean;
  canManageTeam: boolean;
  canAccessReports: boolean;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  isOwner?: boolean;
  permissions?: MemberPermissions;
}

export interface InviteLimit {
  canInvite: boolean;
  current: number;
  limit: number;
}

const teamService = {
  getMembers: async (): Promise<{ members: TeamMember[] }> => {
    const res = await api.get('/team/members');
    return res.data;
  },

  inviteMember: async (name: string, email: string, role: 'HR' | 'Recruiter'): Promise<{ member: TeamMember }> => {
    const res = await api.post('/team/invite', { name, email, role });
    return res.data;
  },

  removeMember: async (userId: number): Promise<void> => {
    await api.delete(`/team/members/${userId}`);
  },

  getInviteLimit: async (): Promise<InviteLimit> => {
    const res = await api.get('/team/invite-limit');
    return res.data;
  },

  updateMemberPermissions: async (userId: number, permissions: MemberPermissions): Promise<void> => {
    await api.put(`/team/members/${userId}/permissions`, permissions);
  }
};

export default teamService;
