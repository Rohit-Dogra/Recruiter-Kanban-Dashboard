const OpenAI = require('openai');

let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not set - OpenAI features will be unavailable');
      return null;
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

const openaiService = {
  async generateInterviewQuestions({ role, skills, experienceLevel, difficulty, count = 5 }) {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client not available - API key not configured');
    }
    
    const prompt = `Generate ${count} interview questions for a ${role} position across any domain (technical, non-technical, manufacturing, automotive, healthcare, finance, etc.).
    
Required Skills: ${skills}
Experience Level: ${experienceLevel}
Difficulty: ${difficulty}

Generate domain-appropriate questions that:
1. Test relevant knowledge and competencies for the specific role
2. Assess problem-solving abilities within the domain context
3. Evaluate communication and interpersonal skills
4. Are appropriate for ${experienceLevel} level candidates
5. Match ${difficulty} difficulty level
6. Include both technical/domain-specific and behavioral questions
7. Consider industry-specific scenarios and challenges

For technical roles: Include coding, system design, or technical problem-solving questions
For manufacturing: Include process optimization, quality control, safety protocols
For automotive: Include vehicle systems, diagnostics, compliance, safety standards
For healthcare: Include patient care, medical procedures, safety protocols, ethics
For business roles: Include strategy, leadership, customer relations, market analysis
For creative roles: Include portfolio discussion, creative process, project management

Return ONLY a JSON array of questions in this exact format:
[
  {
    "question": "Question text here",
    "skill": "Primary skill being tested",
    "type": "technical|behavioral|problem-solving|situational|domain-specific"
  }
]`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert interviewer with deep knowledge across all industries and domains. Generate relevant, insightful interview questions tailored to the specific role and industry context.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content.trim();
      let jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('OpenAI response content:', content);
        throw new Error('Failed to parse questions from OpenAI response');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate and ensure proper structure
      return questions.map((q, index) => ({
        question: q.question || `Question ${index + 1}`,
        skill: q.skill || role,
        type: q.type || 'general'
      }));
    } catch (error) {
      console.error('OpenAI question generation error:', error);
      // Fallback to domain-specific questions if OpenAI fails
      return this.getFallbackQuestions(role, skills, count);
    }
  },

  async evaluateResponse({ question, response, skill, role }) {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client not available - API key not configured');
    }
    const prompt = `Evaluate this interview response for a ${role} position.

Question: ${question}
Skill Being Tested: ${skill}
Candidate Response: ${response}

Provide evaluation in this exact JSON format (return ONLY valid JSON, no markdown or extra text):
{
  "score": <number 0-10>,
  "skillScores": {
    "${skill}": <number 0-10>,
    "communication": <number 0-10>,
    "clarity": <number 0-10>
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "feedback": "Detailed feedback paragraph"
}`;

    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert technical interviewer evaluating candidate responses. Return ONLY valid JSON without markdown code blocks or extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const content = completion.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      let jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to extract JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('OpenAI response content:', content);
        throw new Error('Failed to parse evaluation from OpenAI response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('OpenAI evaluation error:', error);
      if (error.message.includes('parse')) {
        console.error('Raw OpenAI response could not be parsed');
      }
      throw error;
    }
  },

  async generateOverallFeedback({ responses, role, skills }) {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client not available - API key not configured');
    }
    const responseSummary = responses.map((r, i) => 
      `Q${i + 1}: ${r.question}\nScore: ${r.score}/10\nSkills: ${JSON.stringify(r.skillScores)}`
    ).join('\n\n');

    const prompt = `Generate overall interview feedback for a ${role} candidate.

Required Skills: ${skills}

Interview Performance:
${responseSummary}

Provide comprehensive feedback in this JSON format (return ONLY valid JSON, no markdown or extra text):
{
  "overallScore": <number 0-10>,
  "technicalScore": <number 0-10>,
  "communicationScore": <number 0-10>,
  "summary": "Overall performance summary",
  "strengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2"],
  "recommendation": "STRONG_HIRE|HIRE|MAYBE|NO_HIRE",
  "detailedFeedback": "Comprehensive feedback paragraph"
}`;

    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert technical interviewer providing comprehensive candidate evaluation. Return ONLY valid JSON without markdown code blocks or extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = completion.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      let jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to extract JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('OpenAI response content:', content);
        throw new Error('Failed to parse feedback from OpenAI response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('OpenAI feedback generation error:', error);
      if (error.message.includes('parse')) {
        console.error('Raw OpenAI response could not be parsed');
      }
      throw error;
    }
  },

  async generatePhoneScreeningQuestions({ jobTitle, companyName, description, requirements, count = 4 }) {
    const client = getOpenAIClient();
    if (!client) {
      return this.getFallbackPhoneScreeningQuestions(jobTitle, count);
    }
    const prompt = `You are an HR expert. Generate exactly ${count} short phone screening questions for candidates applying for this job.
Job Title: ${jobTitle || 'Not specified'}
Company: ${companyName || 'Our company'}
Description: ${(description || '').slice(0, 500)}
Requirements: ${(requirements || '').slice(0, 300)}

Rules:
- Questions should be clear and easy to ask over the phone.
- Mix: motivation, experience, availability, and one role-specific question.
- Each question one or two sentences max.
- Return ONLY a JSON array of strings, e.g. ["Question 1?", "Question 2?"]`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You return only valid JSON arrays. No markdown, no explanation.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 800
      });
      const content = response.choices[0].message.content.trim();
      let jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const arrMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (!arrMatch) throw new Error('Invalid response');
      const arr = JSON.parse(arrMatch[0]);
      return arr.slice(0, count).map((q, i) => (typeof q === 'string' ? q : q.question || `Question ${i + 1}`));
    } catch (err) {
      console.error('generatePhoneScreeningQuestions error:', err);
      return this.getFallbackPhoneScreeningQuestions(jobTitle, count);
    }
  },

  getFallbackPhoneScreeningQuestions(jobTitle, count = 4) {
    const role = jobTitle || 'this role';
    return [
      `Why are you interested in the ${role} position?`,
      `Can you briefly describe your relevant experience?`,
      `What is your current notice period or availability to start?`,
      `What are your salary expectations for this role?`
    ].slice(0, count);
  },

  getFallbackQuestions(role, skills, count = 5) {
    const fallbackQuestions = [
      {
        question: `What interests you most about working as a ${role}?`,
        skill: role,
        type: 'behavioral'
      },
      {
        question: `Describe your most relevant experience for this ${role} position.`,
        skill: 'Experience',
        type: 'behavioral'
      },
      {
        question: `What do you consider the biggest challenges in the ${role} field today?`,
        skill: 'Industry Knowledge',
        type: 'domain-specific'
      },
      {
        question: `How do you stay updated with the latest developments in your field?`,
        skill: 'Continuous Learning',
        type: 'behavioral'
      },
      {
        question: `Describe a time when you had to solve a complex problem in your work.`,
        skill: 'Problem Solving',
        type: 'problem-solving'
      },
      {
        question: `How do you handle working under pressure or tight deadlines?`,
        skill: 'Stress Management',
        type: 'behavioral'
      }
    ];
    
    return fallbackQuestions.slice(0, count);
  }
};

module.exports = openaiService;
