
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

router.post("/rewrite-job", async (req, res) => {
  try {
    // ── Check key first 
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set in .env");
      return res.status(500).json({ message: "OPENAI_API_KEY is not set in .env" });
    }

    // ── Create client here 
    const client = new OpenAI({ apiKey });

    const { title, company, department, type, experience, location, workType, existingDescription, existingRequirements, existingBenefits } =
      req.body;

    // ── Validation 
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Job title is required" });
    }

    const hasExisting = Boolean(
      (existingDescription && existingDescription.trim()) ||
      (existingRequirements && existingRequirements.trim()) ||
      (existingBenefits && existingBenefits.trim())
    );

    // ── Build the prompt 
    const prompt = hasExisting
      ? `You are a professional job posting writer. The user has provided some existing content for a job posting. Your task is to IMPROVE and ENHANCE it — make it more professional, clearer, and more compelling. Keep the same structure but polish the language.

Job Details:
- Job Title: ${title}
- Company: ${company || "the company"}
- Department: ${department || "Not specified"}
- Job Type: ${type || "Full Time"}
- Experience Level: ${experience || "Entry"}
- Location: ${location || "Not specified"}
- Work Type: ${workType || "On-site"}

Existing content to improve:
${existingDescription ? `Description:\n${existingDescription}\n\n` : ""}${existingRequirements ? `Requirements:\n${existingRequirements}\n\n` : ""}${existingBenefits ? `Benefits:\n${existingBenefits}` : ""}

Return ONLY valid JSON with exactly these keys — no extra text, no markdown, no code fences. For any section that was empty, generate it from scratch. For sections with content, improve and enhance them:

{
  "description": "Improved 3-4 paragraph job description",
  "requirements": "Improved bullet-point list (use • symbol) of 6-8 requirements",
  "benefits": "Improved bullet-point list (use • symbol) of 5-7 benefits"
}`
      : `You are a professional job posting writer. Based on the following job details, generate a compelling job posting.

Job Details:
- Job Title: ${title}
- Company: ${company || "the company"}
- Department: ${department || "Not specified"}
- Job Type: ${type || "Full Time"}
- Experience Level: ${experience || "Entry"}
- Location: ${location || "Not specified"}
- Work Type: ${workType || "On-site"}

Generate the following three sections. Return ONLY valid JSON with exactly these keys — no extra text, no markdown, no code fences:

{
  "description": "A 3-4 paragraph professional job description that highlights the role, what the candidate will work on, and why they should join ${company || "this company"}. Make it engaging and specific to a ${title} role.",
  "requirements": "A bullet-point list (use • symbol) of 6-8 realistic requirements for a ${experience || "entry"}-level ${title}. Include education, experience years, technical skills, and soft skills.",
  "benefits": "A bullet-point list (use • symbol) of 5-7 attractive benefits appropriate for a ${type || "full-time"} ${workType || "on-site"} role."
}`;

    // ── Call OpenAI 
    console.log("Calling OpenAI for job:", title);
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are an expert HR copywriter. Always respond with valid JSON only. No preamble, no markdown code fences, just raw JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("OpenAI responded successfully");

    // ── Parse the response 
    const content = response.choices[0]?.message?.content || "";

    // Strip any accidental markdown code fences if present
    const cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // ── Validate returned keys 
    if (!parsed.description || !parsed.requirements || !parsed.benefits) {
      return res
        .status(500)
        .json({ message: "AI returned incomplete data. Please try again." });
    }

    // ── Return to frontend 
    return res.status(200).json({
      description: parsed.description,
      requirements: parsed.requirements,
      benefits: parsed.benefits,
    });
  } catch (error) {
    console.error("AI Rewrite Error:", error.message);
    console.error("Full error:", error);

    // Handle OpenAI specific errors
    if (error.status === 401) {
      return res
        .status(401)
        .json({ message: "Invalid OpenAI API key. Check your .env file." });
    }
    if (error.status === 429) {
      return res
        .status(429)
        .json({ message: "OpenAI rate limit reached. Please try again later." });
    }

    return res
      .status(500)
      .json({ message: error.message || "AI rewrite failed" });
  }
});

// Define a POST route for generating interview questions

router.post("/generate-questions", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "OPENAI_API_KEY is not set in .env" });
    }

    const client = new OpenAI({ apiKey });
    const { title, department, experience } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Job title is required" });
    }

    const prompt = `Generate 5 specific, role-relevant screening questions for a ${title} position${department ? ` in the ${department} department` : ""} at ${experience || "entry"} level.

Requirements:
- Questions should assess practical experience and skills specific to this role
- Make them open-ended to encourage detailed responses
- Focus on real-world scenarios and problem-solving
- Avoid generic questions that could apply to any job

Return ONLY a valid JSON array of 5 question strings. No extra text, no markdown, no code fences:

["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

    console.log("Generating questions for:", title);
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional. Always respond with valid JSON only. No preamble, no markdown, just raw JSON array.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "";
    const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ message: "AI returned invalid questions format" });
    }

    return res.status(200).json({ questions });
  } catch (error) {
    console.error("Question Generation Error:", error.message);
    
    if (error.status === 401) {
      return res.status(401).json({ message: "Invalid OpenAI API key" });
    }
    if (error.status === 429) {
      return res.status(429).json({ message: "OpenAI rate limit reached" });
    }

    return res.status(500).json({ message: error.message || "Failed to generate questions" });
  }
});

module.exports = router;
