const express = require('express');
const router = express.Router();
const db = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { authenticate } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');

const MEMBERS_LIMIT_BY_PLAN = { free: 1, silver: 3, gold: 5, diamond: 10 };

async function getMembersLimitForOwner(ownerId) {
  const sub = await db.user_subscription.findOne({
    where: { userId: ownerId, status: 'active' },
    include: [{ model: db.subscription_plan, as: 'plan' }]
  });
  const trial = await db.user_trial.findOne({ where: { userId: ownerId } });
  if (sub?.plan) return sub.plan.membersLimit || MEMBERS_LIMIT_BY_PLAN[sub.plan.slug] || 1;
  if (trial) return MEMBERS_LIMIT_BY_PLAN.silver;
  return MEMBERS_LIMIT_BY_PLAN.free;
}

async function getCurrentMemberCount(ownerId) {
  const owner = await db.user.findByPk(ownerId);
  const invitedCount = await db.company_member.count({
    where: { companyOwnerId: ownerId, status: 'active' }
  });
  return 1 + invitedCount;
}

router.get('/members', authenticate, async (req, res) => {
  try {
    const companyId = req.user.invitedByUserId || req.user.id;
    const members = await db.company_member.findAll({
      where: { companyOwnerId: companyId, status: 'active' },
      include: [{ model: db.user, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });
    const owner = await db.user.findByPk(companyId, { attributes: ['id', 'firstName', 'lastName', 'email'] });
    const list = [
      {
        id: owner.id,
        name: `${owner.firstName} ${owner.lastName}`.trim(),
        email: owner.email,
        role: 'Owner',
        status: 'Active',
        isOwner: true,
        permissions: { canViewCandidates: true, canEditJobs: true, canManageTeam: true, canAccessReports: true }
      },
      ...members.map(m => ({
        id: m.userId,
        name: m.member ? `${m.member.firstName} ${m.member.lastName}`.trim() : '',
        email: m.member?.email || '',
        role: m.role,
        status: 'Active',
        isOwner: false,
        permissions: {
          canViewCandidates: m.canViewCandidates !== false,
          canEditJobs: !!m.canEditJobs,
          canManageTeam: !!m.canManageTeam,
          canAccessReports: !!m.canAccessReports
        }
      }))
    ];
    res.json({ success: true, members: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/invite', authenticate, validate([
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['HR', 'Recruiter']).withMessage('Role must be HR or Recruiter')
]), async (req, res) => {
  try {
    if (req.user.invitedByUserId) {
      return res.status(403).json({ success: false, message: 'Invited members cannot invite others' });
    }
    const ownerId = req.user.id;
    const { name, email, role } = req.body;

    const membersLimit = await getMembersLimitForOwner(ownerId);
    const currentCount = await getCurrentMemberCount(ownerId);
    if (currentCount >= membersLimit) {
      return res.status(400).json({
        success: false,
        message: `Your plan allows up to ${membersLimit} team members. Upgrade your subscription to add more.`
      });
    }

    const existing = await db.user.findOne({ where: { email } });
    if (existing && existing.userType === 'candidate') {
      return res.status(400).json({ success: false, message: 'This email is registered as a candidate. Use a different email for team invitations.' });
    }
    if (existing && existing.userType === 'company') {
      const alreadyMember = await db.company_member.findOne({
        where: { companyOwnerId: ownerId, userId: existing.id, status: 'active' }
      });
      if (alreadyMember) {
        return res.status(400).json({ success: false, message: 'This user is already a team member' });
      }
      if (existing.invitedByUserId && existing.invitedByUserId !== ownerId) {
        return res.status(400).json({ success: false, message: 'This email is already part of another company' });
      }
      if (!existing.invitedByUserId) {
        return res.status(400).json({ success: false, message: 'This email already has a company account. Use a different email.' });
      }
    }

    const [firstName, ...lastParts] = name.trim().split(/\s+/);
    const lastName = lastParts.join(' ') || '';

    let user;
    const plainPassword = crypto.randomBytes(6).toString('hex');

    if (existing) {
      await existing.update({
        invitedByUserId: ownerId,
        role,
        password: await bcrypt.hash(plainPassword, 10),
        firstName: firstName || existing.firstName,
        lastName: lastName || existing.lastName
      });
      user = existing;
    } else {
      user = await db.user.create({
        userType: 'company',
        firstName: firstName || 'User',
        lastName: lastName || '',
        email,
        password: await bcrypt.hash(plainPassword, 10),
        company: req.user.company || '',
        role,
        invitedByUserId: ownerId,
        profile_completed: true
      });
    }

    await db.company_member.create({
      companyOwnerId: ownerId,
      userId: user.id,
      role,
      status: 'active'
    });

    const companyName = req.user.company || 'Your Company';
    const inviterName = `${req.user.firstName} ${req.user.lastName}`.trim() || 'Your colleague';
    await emailService.sendInviteEmail({
      to: email,
      name: `${firstName} ${lastName}`.trim() || email,
      email,
      password: plainPassword,
      companyName,
      inviterName
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully. The team member will receive an email with login credentials.',
      member: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/members/:userId', authenticate, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    // Only owner or admin can delete members
    if (req.user.invitedByUserId && req.user.userType !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Only the company owner or admin can remove members' });
    }
    const ownerId = req.user.invitedByUserId || req.user.id;
    const targetUserId = parseInt(req.params.userId);
    
    if (targetUserId === ownerId && req.user.userType !== 'admin') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Cannot remove the owner' });
    }
    
    // Verify member belongs to this company (unless admin)
    const member = await db.company_member.findOne({
      where: { companyOwnerId: ownerId, userId: targetUserId },
      transaction
    });
    
    if (!member && req.user.userType !== 'admin') {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    
    // Verify user exists and is a team member (invited user)
    const targetUser = await db.user.findByPk(targetUserId, { transaction });
    if (!targetUser) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Admin can delete any user, owner can only delete their team members
    if (req.user.userType !== 'admin') {
      if (targetUser.invitedByUserId !== ownerId) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: 'Not authorized to delete this user' });
      }
    }
    
    // Delete company_member record (if exists)
    if (member) {
      await member.destroy({ transaction });
    }
    
    // Actually delete the user from database - this will prevent login
    // CASCADE DELETE will handle related records (company_members, etc.)
    await targetUser.destroy({ transaction });
    
    await transaction.commit();
    res.json({ success: true, message: 'Member deleted successfully. User can no longer login.' });
  } catch (err) {
    await transaction.rollback();
    console.error('Delete member error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to delete member' });
  }
});

router.put('/members/:userId/permissions', authenticate, async (req, res) => {
  try {
    if (req.user.invitedByUserId) {
      return res.status(403).json({ success: false, message: 'Only the owner can update permissions' });
    }
    const ownerId = req.user.id;
    const targetUserId = parseInt(req.params.userId);
    const { canViewCandidates, canEditJobs, canManageTeam, canAccessReports } = req.body;
    if (targetUserId === ownerId) {
      return res.status(400).json({ success: false, message: 'Cannot change owner permissions' });
    }
    const member = await db.company_member.findOne({
      where: { companyOwnerId: ownerId, userId: targetUserId, status: 'active' }
    });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    await member.update({
      canViewCandidates: canViewCandidates !== false,
      canEditJobs: !!canEditJobs,
      canManageTeam: !!canManageTeam,
      canAccessReports: !!canAccessReports
    });
    res.json({ success: true, message: 'Permissions updated', member: member.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/invite-limit', authenticate, async (req, res) => {
  try {
    if (req.user.invitedByUserId) {
      return res.json({ success: true, canInvite: false, current: 0, limit: 0 });
    }
    const limit = await getMembersLimitForOwner(req.user.id);
    const current = await getCurrentMemberCount(req.user.id);
    res.json({ success: true, canInvite: current < limit, current, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
