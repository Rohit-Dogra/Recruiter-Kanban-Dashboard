const axios = require('axios');
const s3Service = require('./s3.service');
const path = require('path');

// Load environment variables if not already loaded
if (!process.env.OPENAI_API_KEY) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

class ATSService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * Extract text from PDF buffer
   */
  async extractTextFromPDFBuffer(buffer) {
    try {
      const pdfParse = require('pdf-parse');
      
      const options = {
        normalizeWhitespace: true,
        disableFontFace: true,
        disableCombineTextItems: false
      };
      
      const data = await pdfParse(buffer, options);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF contains no extractable text');
      }
      
      return data.text;
    } catch (error) {
      // Try alternative extraction method for corrupted PDFs
      try {
        const pdfParse = require('pdf-parse');
        
        const fallbackOptions = {
          normalizeWhitespace: true,
          disableFontFace: true,
          disableCombineTextItems: true,
          verbosity: 0
        };
        
        const data = await pdfParse(buffer, fallbackOptions);
        
        if (data.text && data.text.trim().length > 0) {
          return data.text;
        }
      } catch (fallbackError) {
        // Silent fallback
      }
      
      // Return fallback text for corrupted PDFs
      return 'Resume content could not be extracted from PDF. This may be due to a corrupted or encrypted PDF file. Please ensure the PDF is readable and try uploading again.';
    }
  }

  /**
   * Download file from S3 and extract text
   */
  async downloadAndExtractFromS3(s3Key) {
    try {
      const buffer = await s3Service.downloadFile(s3Key);
      return await this.extractTextFromPDFBuffer(buffer);
    } catch (error) {
      throw new Error(`Failed to download and extract PDF from S3: ${error.message}`);
    }
  }

  /**
   * Analyze resume with ATS using OpenAI
   */
  async analyzeResumeWithATS(resumeText, jobDescription) {
    try {
      const prompt = `
You are an expert ATS (Applicant Tracking System).

Analyze the resume against the job description.
Return ONLY valid JSON, no extra text.

Job Description:
${jobDescription}

Resume:
${resumeText}

JSON format:
{
  "atsScore": 0-100,
  "skillsMatchPercentage": 0-100,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "experienceRelevance": "short text",
  "recommendation": "HIRE | MAYBE | NOT RECOMMENDED"
}
`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a fair ATS that considers transferable skills and context.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1500
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Extract JSON safely
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from OpenAI');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error(
        'OpenAI ATS analysis error:',
        error.response?.data || error.message
      );
      throw new Error('Failed to analyze resume with ATS');
    }
  }

  /**
   * Process resume from S3 key
   */
  async processResume(s3KeyOrPath, jobDescription) {
    try {
      let s3Key;
      
      // Convert various path formats to S3 key
      if (s3KeyOrPath.startsWith('resumes/')) {
        s3Key = s3KeyOrPath;
      } else if (s3KeyOrPath.includes('/uploads/resumes/')) {
        const filename = s3KeyOrPath.split('/').pop();
        s3Key = `resumes/${filename}`;
      } else if (s3KeyOrPath.startsWith('/uploads/resumes/')) {
        const filename = s3KeyOrPath.split('/').pop();
        s3Key = `resumes/${filename}`;
      } else {
        s3Key = `resumes/${s3KeyOrPath}`;
      }

      // Check if file exists in S3
      const exists = await s3Service.fileExists(s3Key);
      if (!exists) {
        throw new Error(`Resume file not found in S3: ${s3Key}`);
      }

      const resumeText = await this.downloadAndExtractFromS3(s3Key);
      return await this.analyzeResumeWithATS(resumeText, jobDescription);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process resume from buffer (for direct upload analysis)
   */
  async processResumeBuffer(buffer, jobDescription) {
    try {
      const resumeText = await this.extractTextFromPDFBuffer(buffer);
      return await this.analyzeResumeWithATS(resumeText, jobDescription);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ATSService();
