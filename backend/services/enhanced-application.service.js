const applicationService = require('./application.service');
const pipelineService = require('../services/pipeline.service');

const enhancedApplicationService = {
  // Get applications with company-specific pipeline context
  getApplicationsWithPipeline: async (companyId, filters = {}) => {
    try {
      // Get company's pipeline configuration
      const pipeline = await pipelineService.getCompanyPipeline(companyId);
      
      // Get applications using existing service
      const applications = await applicationService.getAllApplications(filters);
      
      // Enhance applications with pipeline context
      const enhancedApplications = applications.map(app => ({
        ...app,
        pipelineStage: pipeline.find(stage => stage.id === app.status) || {
          id: app.status,
          title: app.status,
          color: 'bg-gray-500',
          icon: 'FileText',
          actionType: 'email'
        }
      }));

      return {
        applications: enhancedApplications,
        pipeline
      };
    } catch (error) {
      throw error;
    }
  },

  // Update application status with pipeline validation
  updateApplicationStatusWithPipeline: async (applicationId, newStatus, companyId, notes) => {
    try {
      // Get company pipeline to validate status
      const pipeline = await pipelineService.getCompanyPipeline(companyId);
      const validStatuses = pipeline.map(stage => stage.id);
      
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status '${newStatus}' for company pipeline`);
      }

      // Use existing application service for the update
      return await applicationService.updateApplicationStatus(applicationId, newStatus, notes);
    } catch (error) {
      throw error;
    }
  }
};

module.exports = enhancedApplicationService;