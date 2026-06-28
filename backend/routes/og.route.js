// // ─────────────────────────────────────────────────────────────────
// // FILE: routes/og.route.js  (Node.js + Express)
// // Install: npm install @vercel/og  OR  npm install canvas
// // Hum yahan simple HTML→PNG approach use karenge via "puppeteer-core"
// // EASIER alternative: satori + resvg-js (recommended, no browser needed)
// //
// // npm install satori @resvg/resvg-js
// // ─────────────────────────────────────────────────────────────────

// const express = require('express');
// const router = express.Router();
// const satori = require('satori').default;
// const { Resvg } = require('@resvg/resvg-js');
// const fs = require('fs');
// const path = require('path');

// // Font load karo (Inter ya koi bhi .ttf)
// // Download: https://fonts.google.com/specimen/Inter → download → Inter-Bold.ttf
// const fontBold = fs.readFileSync(path.join(__dirname, '../fonts/Inter-Bold.ttf'));
// const fontRegular = fs.readFileSync(path.join(__dirname, '../fonts/Inter-Regular.ttf'));

// // Job model/service import karo (apne hisaab se adjust karo)
// const Job = require('../models/job.model'); // ya jobService

// // ─── OG Image Route ───────────────────────────────────────────────
// // GET /api/og/job/:id
// router.get('/job/:id', async (req, res) => {
//   try {
//     const jobId = req.params.id;

//     // Job fetch karo DB se
//     const job = await Job.findByPk(jobId); // Sequelize
//     // const job = await Job.findById(jobId); // Mongoose ke liye

//     if (!job) {
//       return res.status(404).send('Job not found');
//     }

//     const jobData = job.toJSON ? job.toJSON() : job;

//     const title = jobData.title || 'Job Opening';
//     const company = jobData.company || 'Company';
//     const location = jobData.location || 'Remote';
//     const type = (jobData.type || 'Full Time').replace('-', ' ');
//     const salary = jobData.salary || 'Competitive';
//     const logoUrl = jobData.logoUrl || jobData.companyLogo || null;

//     // ─── OG Card Design (exactly jaisa image mein hai) ────────────
//     const svg = await satori(
//       {
//         type: 'div',
//         props: {
//           style: {
//             width: '1200px',
//             height: '630px',
//             background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #42A5F5 100%)',
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             justifyContent: 'center',
//             padding: '48px',
//             fontFamily: 'Inter',
//           },
//           children: [
//             // "WE ARE HIRING NOW" header
//             {
//               type: 'div',
//               props: {
//                 style: {
//                   color: 'white',
//                   fontSize: '64px',
//                   fontWeight: '800',
//                   letterSpacing: '-2px',
//                   marginBottom: '32px',
//                   textAlign: 'center',
//                   textShadow: '0 2px 8px rgba(0,0,0,0.2)',
//                 },
//                 children: 'WE ARE HIRING NOW',
//               },
//             },
//             // White Card
//             {
//               type: 'div',
//               props: {
//                 style: {
//                   background: 'white',
//                   borderRadius: '24px',
//                   padding: '36px 40px',
//                   width: '900px',
//                   display: 'flex',
//                   flexDirection: 'column',
//                   gap: '12px',
//                   boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
//                 },
//                 children: [
//                   // Top row: logo + title + company
//                   {
//                     type: 'div',
//                     props: {
//                       style: {
//                         display: 'flex',
//                         alignItems: 'flex-start',
//                         gap: '20px',
//                       },
//                       children: [
//                         // Logo
//                         {
//                           type: 'div',
//                           props: {
//                             style: {
//                               width: '80px',
//                               height: '80px',
//                               borderRadius: '50%',
//                               background: '#1a1a2e',
//                               display: 'flex',
//                               alignItems: 'center',
//                               justifyContent: 'center',
//                               overflow: 'hidden',
//                               flexShrink: '0',
//                             },
//                             children: logoUrl
//                               ? {
//                                   type: 'img',
//                                   props: {
//                                     src: logoUrl,
//                                     style: { width: '80px', height: '80px', objectFit: 'cover' },
//                                   },
//                                 }
//                               : {
//                                   type: 'div',
//                                   props: {
//                                     style: {
//                                       color: 'white',
//                                       fontSize: '32px',
//                                       fontWeight: '700',
//                                     },
//                                     children: company[0]?.toUpperCase(),
//                                   },
//                                 },
//                           },
//                         },
//                         // Title + Company + Badge
//                         {
//                           type: 'div',
//                           props: {
//                             style: { display: 'flex', flexDirection: 'column', gap: '6px' },
//                             children: [
//                               {
//                                 type: 'div',
//                                 props: {
//                                   style: {
//                                     fontSize: '36px',
//                                     fontWeight: '800',
//                                     color: '#111827',
//                                     lineHeight: '1.15',
//                                   },
//                                   children: title,
//                                 },
//                               },
//                               {
//                                 type: 'div',
//                                 props: {
//                                   style: {
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     gap: '12px',
//                                   },
//                                   children: [
//                                     {
//                                       type: 'div',
//                                       props: {
//                                         style: {
//                                           fontSize: '22px',
//                                           fontWeight: '600',
//                                           color: '#1565C0',
//                                         },
//                                         children: company,
//                                       },
//                                     },
//                                     {
//                                       type: 'div',
//                                       props: {
//                                         style: {
//                                           background: '#E3F2FD',
//                                           color: '#1565C0',
//                                           fontSize: '14px',
//                                           fontWeight: '700',
//                                           padding: '4px 12px',
//                                           borderRadius: '6px',
//                                           letterSpacing: '0.5px',
//                                         },
//                                         children: jobData.isRemote ? 'REMOTE' : 'ONSITE',
//                                       },
//                                     },
//                                   ],
//                                 },
//                               },
//                             ],
//                           },
//                         },
//                       ],
//                     },
//                   },
//                   // Bottom row: type + salary
//                   {
//                     type: 'div',
//                     props: {
//                       style: {
//                         display: 'flex',
//                         alignItems: 'center',
//                         gap: '12px',
//                         marginTop: '8px',
//                         fontSize: '20px',
//                         color: '#6B7280',
//                         fontWeight: '500',
//                       },
//                       children: [
//                         { type: 'div', props: { children: type } },
//                         {
//                           type: 'div',
//                           props: {
//                             style: {
//                               width: '6px',
//                               height: '6px',
//                               borderRadius: '50%',
//                               background: '#9CA3AF',
//                             },
//                           },
//                         },
//                         { type: 'div', props: { children: salary } },
//                       ],
//                     },
//                   },
//                 ],
//               },
//             },
//             // Footer
//             {
//               type: 'div',
//               props: {
//                 style: {
//                   color: 'rgba(255,255,255,0.8)',
//                   fontSize: '18px',
//                   marginTop: '20px',
//                   fontWeight: '400',
//                 },
//                 children: 'Powered By JuggleHire',
//               },
//             },
//           ],
//         },
//       },
//       {
//         width: 1200,
//         height: 630,
//         fonts: [
//           { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
//           { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
//           { name: 'Inter', data: fontBold, weight: 800, style: 'normal' },
//         ],
//       }
//     );

//     // SVG → PNG
//     const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
//     const png = resvg.render().asPng();

//     // Cache karo 1 ghante ke liye
//     res.setHeader('Content-Type', 'image/png');
//     res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
//     res.send(png);

//   } catch (error) {
//     console.error('OG Image Error:', error);
//     res.status(500).send('Failed to generate image');
//   }
// });

// module.exports = router;