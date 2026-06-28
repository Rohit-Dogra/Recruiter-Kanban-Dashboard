const chromeFreePDFService = require('./chromeFreePDF.service');
const fs = require("fs").promises;
const path = require("path");
const s3Service = require('./s3.service');

class PDFGeneratorService {

  async generateOfferLetterPDF(data) {
    // Use Chrome-free PDF generation
    return await chromeFreePDFService.generateOfferLetterPDF(data);
  }
}

module.exports = new PDFGeneratorService();