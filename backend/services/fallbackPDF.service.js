const fs = require('fs').promises;
const path = require('path');
const s3Service = require('./s3.service');
const simplePDFService = require('./simplePDF.service');

class FallbackPDFService {
  
  async generateOfferLetterPDF(data) {
    try {
      console.log('Using fallback PDF generation service');
      
      // Use simple PDF service for now
      return await simplePDFService.generateOfferLetterPDF(data);
      
    } catch (error) {
      console.error('Fallback PDF generation error:', error);
      
      // Last resort: create a plain text file
      return await this.generateTextFile(data);
    }
  }
  
  async generateTextFile(data) {
    try {
      console.log('Using text file generation as last resort');
      
      const textContent = this.generateTextContent(data);
      const pdfBuffer = Buffer.from(textContent, 'utf8');
      const fileName = `offer_${data.candidateId}_${Date.now()}.txt`;
      
      // Upload to S3
      let s3Url = null;
      let s3Key = null;
      let s3Uploaded = false;
      
      try {
        const s3Result = await s3Service.uploadFile(
          pdfBuffer, 
          fileName, 
          'text/plain',
          'offer-letter'
        );
        s3Url = s3Result.location;
        s3Key = s3Result.key;
        s3Uploaded = true;
        
        console.log('Text offer letter uploaded to S3 successfully');
        
      } catch (s3Error) {
        console.error('S3 upload failed for text file:', s3Error.message);
        
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`S3 upload required in production: ${s3Error.message}`);
        }
      }
      
      // Create local fallback
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'offer-letters');
      await fs.mkdir(uploadsDir, { recursive: true });
      const tempFilePath = path.join(uploadsDir, fileName);
      
      let filePath = null;
      if (!s3Uploaded) {
        await fs.writeFile(tempFilePath, pdfBuffer);
        filePath = tempFilePath;
        console.log('Created local text file:', filePath);
      } else {
        filePath = tempFilePath;
      }
      
      return {
        buffer: pdfBuffer,
        filePath,
        fileName,
        s3Url,
        s3Key,
        s3Uploaded,
        isLocalFile: !s3Uploaded,
        isFallback: true,
        contentType: 'text/plain'
      };
      
    } catch (error) {
      console.error('Text file generation error:', error);
      throw new Error(`Text file generation failed: ${error.message}`);
    }
  }
  
  generateTextContent(data) {
    const salary = parseFloat(
      data.salary.toString().replace(/[^\\d.]/g, '')
    ).toLocaleString('en-IN');
    
    const date = new Date(data.joiningDate).toLocaleDateString('en-IN');
    const currentDate = new Date().toLocaleDateString('en-IN');
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');
    
    return `
===============================================
           JOB OFFER LETTER
===============================================

${data.companyName || 'HIRERMIND'}
Date: ${currentDate}

-----------------------------------------------

${data.candidateName}
${data.candidateEmail}

Subject: Job Offer - ${data.jobTitle}

Dear ${data.candidateName},

We are pleased to offer you the position of ${data.jobTitle} at ${data.companyName || 'HirerMind'}.

POSITION DETAILS:
• Job Title: ${data.jobTitle}
• Annual Salary: ₹${salary} per annum
• Start Date: ${date}
• Work Location: ${data.workLocation || 'Remote'}
• Benefits: ${data.benefits || 'Health Insurance, PF, PTO'}

TERMS & CONDITIONS:
• This offer is contingent upon background verification
• Employment governed by company policies
• Notice period: 30 days
• Valid until: ${validUntil}

Please confirm acceptance within 5 business days.

Best regards,
HR Team
${data.companyName || 'HirerMind'}

===============================================
This is a system-generated offer letter.
===============================================
`;
  }
}

module.exports = new FallbackPDFService();