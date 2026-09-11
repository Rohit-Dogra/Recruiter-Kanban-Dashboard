import jsPDF from 'jspdf';
import { BRAND } from "@/lib/brand";

interface OfferLetterData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  salary: string;
  joiningDate: string;
  template: string;
  companyName?: string;
  companyAddress?: string;
  workLocation?: string;
  benefits?: string;
}

interface Template {
  id: string;
  name: string;
  style: 'modern' | 'classic' | 'executive';
}

class PDFGeneratorService {
  private templates: Template[] = [
    { id: 'modern', name: 'Modern Professional', style: 'modern' },
    { id: 'classic', name: 'Classic Corporate', style: 'classic' },
    { id: 'executive', name: 'Executive Premium', style: 'executive' }
  ];

  getTemplates(): Template[] {
    return this.templates;
  }

  generateOfferLetterPDF(data: OfferLetterData): Promise<Blob> {
    return new Promise((resolve) => {
      const pdf = new jsPDF();
      const template = this.templates.find(t => t.id === data.template) || this.templates[0];
      
      // Apply template styling
      this.applyTemplateStyle(pdf, template.style);
      
      // Add company header
      this.addCompanyHeader(pdf, data.companyName || BRAND.legalName);
      
      // Add offer letter content
      this.addOfferContent(pdf, data);
      
      // Add footer
      this.addFooter(pdf);
      
      // Convert to blob
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
    });
  }

  private applyTemplateStyle(pdf: jsPDF, style: string) {
    switch (style) {
      case 'modern':
        pdf.setFont('helvetica');
        break;
      case 'classic':
        pdf.setFont('times');
        break;
      case 'executive':
        pdf.setFont('helvetica');
        break;
      default:
        pdf.setFont('helvetica');
    }
  }

  private addCompanyHeader(pdf: jsPDF, companyName: string) {
    // Company logo placeholder
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, 20, 50, 20, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('[COMPANY LOGO]', 25, 32);
    
    // Company name and details
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(BRAND.nameUpper, 80, 28);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Innovative Recruitment Solutions', 80, 35);
    pdf.text(`${BRAND.email.contact} | ${BRAND.domain}`, 80, 40);
  }

  private addOfferContent(pdf: jsPDF, data: OfferLetterData) {
    let yPosition = 70;
    
    // Date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 150, yPosition);
    yPosition += 20;
    
    // Candidate address
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${data.candidateName}`, 20, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${data.candidateEmail}`, 20, yPosition);
    yPosition += 20;
    
    // Subject
    pdf.setFont('helvetica', 'bold');
    pdf.text('Subject: Job Offer - ' + data.jobTitle, 20, yPosition);
    yPosition += 15;
    
    // Salutation
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Dear ${data.candidateName},`, 20, yPosition);
    yPosition += 15;
    
    // Main content
    const content = [
      `We are pleased to offer you the position of ${data.jobTitle} at ${data.companyName || BRAND.legalName}.`,
      '',
      'Position Details:',
      `• Job Title: ${data.jobTitle}`,
      `• Annual Salary: ₹${parseFloat(data.salary.replace(/[^\\d.]/g, '')).toLocaleString('en-IN')} per annum`,
      `• Start Date: ${new Date(data.joiningDate).toLocaleDateString('en-IN')}`,
      `• Work Location: ${data.workLocation || 'Remote/Hybrid'}`,
      '',
      'Benefits Package:',
      ...(data.benefits || 'Health Insurance\nProvident Fund (PF)\nPaid Time Off (PTO)\nProfessional Development').split('\n').map(line => `• ${line.trim()}`).filter(line => line.length > 2),
      '',
      'Terms & Conditions:',
      '• This offer is contingent upon successful completion of background verification',
      '• Employment will be governed by company policies and Indian labor laws',
      '• Notice period: 30 days',
      '',
      'Please confirm your acceptance by replying to this email within 5 business days.',
      '',
      'We look forward to welcoming you to our team!',
      '',
      'Best regards,',
      'HR Team',
      data.companyName || BRAND.legalName
    ];
    
    content.forEach(line => {
      if (line.startsWith('•')) {
        pdf.setFont('helvetica', 'normal');
        pdf.text(line, 25, yPosition);
      } else if (line.includes('Details:') || line.includes('Package:') || line.includes('Conditions:')) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(line, 20, yPosition);
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.text(line, 20, yPosition);
      }
      yPosition += 6;
      
      // Add new page if needed
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
    });
  }

  private addFooter(pdf: jsPDF) {
    const pageCount = pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Footer line
      pdf.setDrawColor(41, 128, 185);
      pdf.line(20, 280, 190, 280);
      
      // Footer text
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('This is a system-generated offer letter.', 20, 285);
      pdf.text(`Page ${i} of ${pageCount}`, 170, 285);
    }
  }
}

export default new PDFGeneratorService();