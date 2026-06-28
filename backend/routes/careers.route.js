

// const express = require('express');
// const router = express.Router();
// const path = require('path');
// const fs = require('fs');

// // Job model (apne hisaab se adjust karo)
// const Job = require('../models/job.model');

// // Aapki React build ka index.html path
// const INDEX_HTML = path.join(__dirname, '../client/dist/index.html');
// // Ya: const INDEX_HTML = path.join(__dirname, '../public/index.html');

// // ─── /careers/job/:id ────────────────────────────────────────────
// router.get('/careers/job/:id', async (req, res) => {
//   try {
//     const jobId = req.params.id;
//     const baseUrl = 'https://strata.naukarinavigator.com';

//     // Job fetch karo
//     let title = 'Job Opening';
//     let description = 'We are hiring! Check out this opportunity.';
//     let ogImage = `${baseUrl}/og-default.png`; // fallback image

//     try {
//       const job = await Job.findByPk(jobId);
//       if (job) {
//         const jobData = job.toJSON ? job.toJSON() : job;
//         title = `${jobData.title} at ${jobData.company}`;
//         description = [
//           jobData.type?.replace('-', ' '),
//           jobData.location || 'Remote',
//           jobData.salary || 'Competitive',
//           jobData.description?.substring(0, 120),
//         ].filter(Boolean).join(' • ');

//         // Dynamic OG image URL (og.route.js se)
//         ogImage = `${baseUrl}/api/og/job/${jobId}`;
//       }
//     } catch (e) {
//       console.error('Job fetch error for OG:', e);
//     }

//     const pageUrl = `${baseUrl}/careers/job/${jobId}`;

//     // index.html padhke meta tags inject karo
//     let html = fs.readFileSync(INDEX_HTML, 'utf-8');

//     const metaTags = `
//     <title>${escapeHtml(title)}</title>
//     <meta name="description" content="${escapeHtml(description)}" />

//     <!-- Open Graph (Facebook, LinkedIn, WhatsApp) -->
//     <meta property="og:type"        content="website" />
//     <meta property="og:url"         content="${pageUrl}" />
//     <meta property="og:title"       content="${escapeHtml(title)}" />
//     <meta property="og:description" content="${escapeHtml(description)}" />
//     <meta property="og:image"       content="${ogImage}" />
//     <meta property="og:image:width"  content="1200" />
//     <meta property="og:image:height" content="630" />
//     <meta property="og:site_name"   content="JuggleHire" />

//     <!-- Twitter Card -->
//     <meta name="twitter:card"        content="summary_large_image" />
//     <meta name="twitter:title"       content="${escapeHtml(title)}" />
//     <meta name="twitter:description" content="${escapeHtml(description)}" />
//     <meta name="twitter:image"       content="${ogImage}" />
//     `;

//     // <head> ke andar inject karo
//     html = html.replace('<head>', `<head>${metaTags}`);

//     res.send(html);

//   } catch (error) {
//     console.error('Careers route error:', error);
//     // Fallback: normal React app serve karo
//     res.sendFile(INDEX_HTML);
//   }
// });

// // HTML escape helper
// function escapeHtml(str = '') {
//   return str
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .replace(/"/g, '&quot;')
//     .replace(/'/g, '&#039;');
// }

// module.exports = router;