const fs = require('fs').promises;
const path = require('path');
const s3Service = require('./s3.service');

class SimplePDFService {
  
  async generateOfferLetterPDF(data) {
    try {
      // Generate PDF content as a simple structured text document
      const pdfContent = this.generatePDFContent(data);
      
      // Create buffer from content
      const pdfBuffer = Buffer.from(pdfContent, 'utf8');
      
      const fileName = `offer_${data.candidateId}_${Date.now()}.pdf`;
      
      // Upload to S3
      let s3Url = null;
      let s3Key = null;
      let s3Uploaded = false;
      
      console.log('Using simple PDF generation service');
      console.log('Starting S3 upload for offer letter:', fileName);
      
      try {
        const s3Result = await s3Service.uploadFile(
          pdfBuffer, 
          fileName, 
          'application/pdf',
          'offer-letter'
        );
        s3Url = s3Result.location;
        s3Key = s3Result.key;
        s3Uploaded = true;
        
        console.log('Offer letter uploaded to S3 successfully:', {
          url: s3Url,
          key: s3Key,
          bucket: s3Result.bucket
        });
        
        // Verify the upload
        const fileExists = await s3Service.fileExists(s3Key);
        if (!fileExists) {
          throw new Error('S3 upload verification failed - file not found after upload');
        }
        
        console.log('S3 upload verified successfully');
        
      } catch (s3Error) {
        console.error('S3 upload failed:', {
          error: s3Error.message,
          fileName,
          stack: s3Error.stack,
          bucket: process.env.S3_BUCKET_NAME
        });
        
        if (process.env.NODE_ENV === 'production') {\n          throw new Error(`S3 upload required in production: ${s3Error.message}`);\n        }\n        \n        console.warn('Continuing without S3 upload in development mode');\n      }\n      \n      // Create local fallback\n      const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'offer-letters');\n      await fs.mkdir(uploadsDir, { recursive: true });\n      const tempFilePath = path.join(uploadsDir, fileName);\n      \n      let filePath = null;\n      if (!s3Uploaded) {\n        await fs.writeFile(tempFilePath, pdfBuffer);\n        filePath = tempFilePath;\n        console.log('Created local fallback file:', filePath);\n      } else {\n        filePath = tempFilePath;\n      }\n      \n      return {\n        buffer: pdfBuffer,\n        filePath,\n        fileName,\n        s3Url,\n        s3Key,\n        s3Uploaded,\n        isLocalFile: !s3Uploaded\n      };\n      \n    } catch (error) {\n      console.error('Simple PDF generation error:', error);\n      throw new Error(`PDF generation failed: ${error.message}`);\n    }\n  }\n  \n  generatePDFContent(data) {\n    const salary = parseFloat(\n      data.salary.toString().replace(/[^\\\\d.]/g, '')\n    ).toLocaleString('en-IN');\n    \n    const date = new Date(data.joiningDate).toLocaleDateString('en-IN');\n    const currentDate = new Date().toLocaleDateString('en-IN');\n    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');\n    \n    // Create a simple PDF-like text format\n    return `%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n\n4 0 obj\n<<\n/Length ${this.calculateContentLength(data)}\n>>\nstream\nBT\n/F1 12 Tf\n50 750 Td\n(${data.companyName || 'HIRERMIND'}) Tj\n0 -20 Td\n(Date: ${currentDate}) Tj\n0 -40 Td\n(${data.candidateName}) Tj\n0 -15 Td\n(${data.candidateEmail}) Tj\n0 -30 Td\n(Subject: Job Offer - ${data.jobTitle}) Tj\n0 -30 Td\n(Dear ${data.candidateName},) Tj\n0 -20 Td\n(We are pleased to offer you the position of ${data.jobTitle}) Tj\n0 -15 Td\n(at ${data.companyName || 'HirerMind'}.) Tj\n0 -30 Td\n(Position Details:) Tj\n0 -20 Td\n(• Job Title: ${data.jobTitle}) Tj\n0 -15 Td\n(• Annual Salary: ₹${salary} per annum) Tj\n0 -15 Td\n(• Start Date: ${date}) Tj\n0 -15 Td\n(• Work Location: ${data.workLocation || 'Remote'}) Tj\n0 -15 Td\n(• Benefits: ${data.benefits || 'Health Insurance, PF, PTO'}) Tj\n0 -30 Td\n(Terms & Conditions:) Tj\n0 -20 Td\n(• This offer is contingent upon background verification) Tj\n0 -15 Td\n(• Employment governed by company policies) Tj\n0 -15 Td\n(• Notice period: 30 days) Tj\n0 -15 Td\n(• Valid until: ${validUntil}) Tj\n0 -30 Td\n(Please confirm acceptance within 5 business days.) Tj\n0 -40 Td\n(Best regards,) Tj\n0 -15 Td\n(HR Team) Tj\n0 -15 Td\n(${data.companyName || 'HirerMind'}) Tj\nET\nendstream\nendobj\n\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000173 00000 n \n0000000301 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n${this.calculateXrefOffset()}\n%%EOF`;\n  }\n  \n  calculateContentLength(data) {\n    // Approximate content length calculation\n    return 1500; // Fixed length for simplicity\n  }\n  \n  calculateXrefOffset() {\n    // Approximate xref offset\n    return 2000; // Fixed offset for simplicity\n  }\n}\n\nmodule.exports = new SimplePDFService();"