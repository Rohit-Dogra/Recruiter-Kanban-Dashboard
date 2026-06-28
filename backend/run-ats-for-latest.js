const db = require('./models');
const atsService = require('./services/ats.service');

async function run() {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');

    const Application = db.application;
    const Job = db.job;

    // Find latest application with resumeUrl
    const application = await Application.findOne({
      where: { resumeUrl: { [db.Sequelize.Op.ne]: null } },
      include: [{ model: Job, as: 'job' }],
      order: [['createdAt', 'DESC']]
    });

    if (!application) {
      console.log('No application with resume found');
      process.exit(0);
    }

    console.log('Found application id:', application.id);
    const resumeFileName = require('path').basename(application.resumeUrl);
    const jobDescription = `${application.job.title}\n${application.job.description}\nRequired Skills: ${application.job.requirements || ''}`;

    const result = await atsService.processResume(resumeFileName, jobDescription);
    console.log('ATS Result:\n', JSON.stringify(result, null, 2));

    // Optionally update application
    await application.update({
      aiScore: result.atsScore,
      resumeMatch: result.skillsMatchPercentage,
      skillsMatch: { matched: result.matchedSkills, missing: result.missingSkills },
      aiNotes: result.recommendation
    });

    console.log('Application updated with ATS results.');
    process.exit(0);
  } catch (err) {
    console.error('Error running ATS:', err);
    process.exit(1);
  }
}

run();
