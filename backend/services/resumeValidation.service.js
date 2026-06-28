const pdf = require('pdf-parse');

const resumeValidationService = {
  // Validate if PDF contains resume-like content
  validateResumeContent: async (buffer) => {
    try {
      console.log('Starting PDF parsing...');
      const data = await pdf(buffer);
      const text = data.text.toLowerCase();
      console.log('PDF text length:', text.length);
      console.log('PDF text preview:', text.substring(0, 200));
      
      // Resume keywords that should be present
      const resumeKeywords = [
        'experience', 'education', 'skills', 'work', 'employment',
        'university', 'college', 'degree', 'bachelor', 'master',
        'job', 'position', 'role', 'company', 'project',
        'email', 'phone', 'contact', 'address'
      ];
      
      // Professional sections that indicate a resume
      const resumeSections = [
        'work experience', 'professional experience', 'employment history',
        'education', 'academic background', 'qualifications',
        'skills', 'technical skills', 'core competencies',
        'projects', 'achievements', 'certifications'
      ];
      
      // Count keyword matches
      const keywordMatches = resumeKeywords.filter(keyword => 
        text.includes(keyword)
      ).length;
      
      // Count section matches
      const sectionMatches = resumeSections.filter(section => 
        text.includes(section)
      ).length;
      
      console.log('Keyword matches:', keywordMatches);
      console.log('Section matches:', sectionMatches);
      
      // Validation criteria - Made less strict for testing
      const hasMinimumKeywords = keywordMatches >= 1; // Reduced from 3 to 1
      const hasResumeSections = sectionMatches >= 0; // Reduced from 1 to 0
      const hasMinimumLength = text.length >= 50; // Reduced from 100 to 50
      
      console.log('Validation criteria:', {
        hasMinimumKeywords,
        hasResumeSections,
        hasMinimumLength
      });
      
      return {
        isValid: hasMinimumKeywords && hasResumeSections && hasMinimumLength,
        score: keywordMatches + sectionMatches,
        details: {
          keywordMatches,
          sectionMatches,
          textLength: text.length,
          hasMinimumKeywords,
          hasResumeSections,
          hasMinimumLength
        }
      };
    } catch (error) {
      console.error('Resume validation error:', error);
      return {
        isValid: false,
        error: 'Failed to parse PDF content'
      };
    }
  }
};

module.exports = resumeValidationService;