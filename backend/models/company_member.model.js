module.exports = (sequelize, DataTypes) => {
  const CompanyMember = sequelize.define("company_members", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    companyOwnerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'company_owner_id',
      references: { model: 'users', key: 'id' }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: { model: 'users', key: 'id' }
    },
    role: {
      type: DataTypes.ENUM('HR', 'Recruiter'),
      allowNull: false,
      defaultValue: 'Recruiter'
    },
    status: {
      type: DataTypes.ENUM('active', 'removed'),
      defaultValue: 'active'
    },
    canViewCandidates: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'can_view_candidates'
    },
    canEditJobs: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'can_edit_jobs'
    },
    canManageTeam: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'can_manage_team'
    },
    canAccessReports: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'can_access_reports'
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'company_members'
  });
  return CompanyMember;
};
