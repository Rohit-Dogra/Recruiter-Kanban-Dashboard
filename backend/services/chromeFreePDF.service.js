const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const s3Service = require('./s3.service');

class ChromeFreePDFService {
  async generateOfferLetterPDF(data) {
    try {
      console.log('Starting Chrome-free PDF generation for offer letter...');
      
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });
      
      // Create buffer to store PDF
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      // Generate PDF content
      this.generatePDFContent(doc, data);
      
      // Finalize the PDF
      doc.end();
      
      // Wait for PDF generation to complete
      await new Promise((resolve) => {
        doc.on('end', resolve);
      });
      
      const pdfBuffer = Buffer.concat(chunks);
      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      
      const fileName = `offer_${data.candidateId}_${Date.now()}.pdf`;

      // Upload to S3
      let s3Url = null;
      let s3Key = null;
      let s3Uploaded = false;
      
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
        
        console.log('PDF uploaded to S3 successfully:', {
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
          bucket: process.env.S3_BUCKET_NAME
        });
        
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`S3 upload required in production: ${s3Error.message}`);
        }
        
        console.warn('Continuing without S3 upload in development mode');
      }

      // Create local fallback only in development or if S3 upload failed
      let filePath = null;
      if (!s3Uploaded && process.env.NODE_ENV !== 'production') {
        try {
          const uploadsDir = path.join(__dirname, "..", "..", "uploads", "offer-letters");
          await fs.mkdir(uploadsDir, { recursive: true });
          const tempFilePath = path.join(uploadsDir, fileName);
          await fs.writeFile(tempFilePath, pdfBuffer);
          filePath = tempFilePath;
          console.log('Created local file for fallback:', filePath);
        } catch (localError) {
          console.warn('Failed to create local backup:', localError.message);
          // Continue without local backup
        }
      }

      console.log('Chrome-free PDF generation completed successfully');
      return {
        buffer: pdfBuffer,
        filePath,
        fileName,
        s3Url,
        s3Key,
        s3Uploaded,
        isLocalFile: !s3Uploaded,
        // Add location for backward compatibility
        location: s3Url
      };

    } catch (error) {
      console.error("Chrome-free PDF generation error:", {
        message: error.message,
        stack: error.stack,
        nodeEnv: process.env.NODE_ENV
      });
      
      if (error.message.includes('S3 upload')) {
        throw new Error(`File storage error: ${error.message}`);
      }
      
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  generatePDFContent(doc, data) {
    const salary = parseFloat(
      data.salary.toString().replace(/[^\d.]/g, "")
    ).toLocaleString("en-IN");

    const date = new Date(data.joiningDate).toLocaleDateString("en-IN");
    const currentDate = new Date().toLocaleDateString("en-IN");
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN");

    // Header
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text(data.companyName || 'HIRERMIND', { align: 'center' })
       .moveDown(0.5);
    
    doc.fontSize(12)
       .fillColor('#666666')
       .text(`Date: ${currentDate}`, { align: 'center' })
       .moveDown(1);
    
    // Draw header line
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .strokeColor('#2563eb')
       .lineWidth(3)
       .stroke()
       .moveDown(1);

    // Recipient
    doc.fontSize(16)
       .fillColor('#000000')
       .text(data.candidateName, { continued: false })
       .fontSize(12)
       .text(data.candidateEmail)
       .moveDown(1);

    // Subject
    doc.fontSize(14)
       .fillColor('#2563eb')
       .text(`Subject: Job Offer - ${data.jobTitle}`, { continued: false })
       .moveDown(1);

    // Content
    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Dear ${data.candidateName},`, { continued: false })
       .moveDown(0.5)
       .text(`We are delighted to offer you the position of ${data.jobTitle} at ${data.companyName || 'HirerMind'}. We believe your skills and experience will be a valuable addition to our team.`, {
         align: 'justify'
       })
       .moveDown(1);

    // Position Details Box
    const boxY = doc.y;
    doc.rect(50, boxY, 495, 120)
       .fillAndStroke('#f8f9fa', '#2563eb')
       .fillColor('#2563eb')
       .fontSize(14)
       .text('Position Details', 60, boxY + 10)
       .fillColor('#000000')
       .fontSize(11);

    let detailY = boxY + 35;
    const details = [
      `Job Title: ${data.jobTitle}`,
      `Annual Salary: ₹${salary} per annum`,
      `Start Date: ${date}`,
      `Work Location: ${data.workLocation || 'Remote'}`,
      `Benefits: ${data.benefits || 'Health Insurance, Provident Fund, Paid Time Off'}`
    ];

    details.forEach(detail => {
      doc.text(`• ${detail}`, 70, detailY);
      detailY += 15;
    });

    doc.y = boxY + 130;
    doc.moveDown(1);

    // Terms & Conditions
    doc.fontSize(14)
       .fillColor('#2563eb')
       .text('Terms & Conditions', { continued: false })
       .moveDown(0.5);

    const terms = [
      'This offer is contingent upon successful completion of background verification',
      'Employment will be governed by company policies and applicable labor laws',
      'Notice period: 30 days (as per company policy)',
      `This offer is valid until: ${validUntil}`,
      'Probation period: 6 months (as applicable)'
    ];

    doc.fontSize(11)
       .fillColor('#000000');
    
    terms.forEach(term => {
      doc.text(`• ${term}`, { continued: false });
      doc.moveDown(0.3);
    });

    doc.moveDown(1);

    // Closing
    doc.text('Please confirm your acceptance of this offer by replying to this communication within 5 business days. We are excited about the possibility of you joining our team and look forward to your positive response.', {
      align: 'justify'
    })
    .moveDown(0.5)
    .text('Should you have any questions regarding this offer, please feel free to contact our HR team.', {
      align: 'justify'
    })
    .moveDown(2);

    // Signature
    doc.text('Best regards,', { continued: false })
       .moveDown(0.5)
       .text('HR Team')
       .text(data.companyName || 'HirerMind')
       .moveDown(2);

    // Footer
    doc.fontSize(10)
       .fillColor('#666666')
       .text('This is a system-generated offer letter. Please retain this document for your records.', {
         align: 'center'
       });
  }
}

module.exports = new ChromeFreePDFService();