/**
 * Resume Parser Service
 * Primary: OpenAI GPT-4 for accurate structured extraction
 * Fallback: Regex/heuristic parsing when AI is unavailable
 */

const pdf = require('pdf-parse');

const resumeParserService = {
  /**
   * Parse a PDF buffer and return structured candidate data.
   */
  async parseResume(buffer) {
    const data = await pdf(buffer);
    const text = data.text;
    if (!text || text.trim().length < 30) {
      throw new Error('PDF appears empty or contains too little text.');
    }

    // Try OpenAI first for accuracy, fall back to regex
    try {
      const result = await this.parseWithAI(text);
      if (result && (result.firstName || result.email)) {
        return result;
      }
    } catch (err) {
      console.warn('AI resume parse unavailable, using regex fallback:', err.message);
    }

    return this.extractFromText(text);
  },

  /**
   * AI-powered extraction using OpenAI GPT-4
   */
  async parseWithAI(text) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('No OpenAI API key configured');

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    // Truncate to ~6000 chars to stay within token limits
    const truncated = text.substring(0, 6000);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert resume parser. Extract structured candidate information from resume text.
Return ONLY valid JSON — no markdown, no explanation, no code blocks.
Use null for any field you cannot confidently extract.
For skills, extract ALL technical skills, tools, frameworks, and languages mentioned.
For experience, calculate total years as an integer.`
        },
        {
          role: 'user',
          content: `Extract candidate info from this resume:\n\n${truncated}\n\nReturn JSON with exactly these fields:
{
  "firstName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "city, state/country or null",
  "currentTitle": "most recent job title or null",
  "currentCompany": "most recent company or null",
  "experience": total_years_as_integer_or_null,
  "education": "highest degree and institution or null",
  "skills": ["skill1", "skill2", ...],
  "summary": "1-2 sentence professional summary or null"
}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content.trim();
    // Strip markdown code blocks if present
    let jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response as JSON');

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure skills is always an array
    if (!Array.isArray(parsed.skills)) parsed.skills = [];

    return parsed;
  },

  // ─── Regex/Heuristic Fallback ───────────────────────────────────────────

  extractFromText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const email = this.extractEmail(text);
    const phone = this.extractPhone(text);
    const name = this.extractName(lines, email);
    const location = this.extractLocation(text);
    const { title, company } = this.extractCurrentRole(text, lines);
    const experience = this.extractExperience(text);
    const education = this.extractEducation(text, lines);
    const skills = this.extractSkills(text, lines);
    const summary = this.extractSummary(lines);

    return {
      firstName: name.firstName,
      lastName: name.lastName,
      email,
      phone,
      location,
      currentTitle: title,
      currentCompany: company,
      experience,
      education,
      skills,
      summary,
    };
  },

  extractEmail(text) {
    const m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    return m ? m[0].toLowerCase() : null;
  },

  extractPhone(text) {
    const patterns = [
      /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
      /(?:\+?\d{1,3}[-.\s]?)?\d{5}[-.\s]?\d{5}/,
      /(?:\+?\d{1,3}[-.\s]?)?\d{10,12}/,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return m[0].trim();
    }
    return null;
  },

  extractName(lines, email) {
    const skip = new Set([
      'resume','cv','curriculum','vitae','profile','summary','objective',
      'experience','education','skills','contact','address','phone','email',
      'references','portfolio','about','page',
    ]);
    for (const line of lines.slice(0, 8)) {
      if (line.includes('@') || /https?:\/\//.test(line) || /\d{5,}/.test(line)) continue;
      if (skip.has(line.toLowerCase().replace(/[^a-z]/g, ''))) continue;
      if (line.length > 60) continue;
      const words = line.split(/\s+/).filter(w => /^[A-Z][a-zA-Z'-]+$/.test(w) && w.length >= 2);
      if (words.length >= 2 && words.length <= 4) {
        return { firstName: words[0], lastName: words.slice(1).join(' ') };
      }
    }
    if (email) {
      const prefix = email.split('@')[0].replace(/[._-]/g, ' ').split(/\s+/);
      if (prefix.length >= 2) {
        return {
          firstName: prefix[0].charAt(0).toUpperCase() + prefix[0].slice(1),
          lastName: prefix.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        };
      }
    }
    return { firstName: null, lastName: null };
  },

  extractLocation(text) {
    const patterns = [
      /(?:location|address|based in|residing)[:\s]*([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/i,
      /\b(Mumbai|Delhi|Bangalore|Bengaluru|Hyderabad|Chennai|Kolkata|Pune|Ahmedabad|Noida|Gurgaon|Gurugram|Chandigarh|Lucknow|Kochi|Coimbatore|Indore)(?:\s*,\s*[A-Za-z\s]+)?\b/i,
      /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2})\b/,
      /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*(?:India|USA|UK|Canada|Australia|Germany|Singapore|UAE))\b/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return (m[1] || m[0]).trim();
    }
    return null;
  },

  extractCurrentRole(text, lines) {
    let title = null, company = null;
    const expH = /(?:work\s*experience|professional\s*experience|employment\s*history|experience)/i;
    let inExp = false;
    const expLines = [];
    for (const line of lines) {
      if (expH.test(line) && line.length < 50) { inExp = true; continue; }
      if (inExp) {
        if (/^(education|skills|projects|certifications|achievements|awards|publications)/i.test(line) && line.length < 40) break;
        expLines.push(line);
        if (expLines.length > 10) break;
      }
    }
    for (const line of expLines.slice(0, 5)) {
      if (/^\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i.test(line) && line.length < 30) continue;
      const m = line.match(/^(.+?)(?:\s+at\s+|\s*[|–—-]\s*)(.+)$/i);
      if (m) { title = m[1].trim(); company = m[2].replace(/[|–—-]\s*$/, '').trim(); break; }
      if (!title && /(?:engineer|developer|manager|analyst|designer|architect|lead|director|consultant|specialist|intern|executive|officer)/i.test(line)) {
        title = line.replace(/\s*[|–—-]\s*.*$/, '').trim();
        break;
      }
    }
    if (title && title.length > 80) title = title.substring(0, 80);
    if (company && company.length > 80) company = company.substring(0, 80);
    return { title, company };
  },

  extractExperience(text) {
    const explicit = text.match(/(\d{1,2})\+?\s*(?:years?|yrs?)[\s]*(?:of\s+)?(?:experience|exp)/i);
    if (explicit) return parseInt(explicit[1], 10);
    const dateRanges = text.matchAll(/(\d{4})\s*[-–—to]+\s*(\d{4}|present|current|now)/gi);
    let earliest = null, latest = null;
    const cur = new Date().getFullYear();
    for (const m of dateRanges) {
      const s = parseInt(m[1], 10);
      const e = /present|current|now/i.test(m[2]) ? cur : parseInt(m[2], 10);
      if (s >= 1970 && s <= cur && e >= s && e <= cur + 1) {
        if (!earliest || s < earliest) earliest = s;
        if (!latest || e > latest) latest = e;
      }
    }
    return earliest && latest ? latest - earliest : null;
  },

  extractEducation(text, lines) {
    const eduH = /^(?:education|academic|qualification|degree)/i;
    let inEdu = false;
    const eduLines = [];
    for (const line of lines) {
      if (eduH.test(line) && line.length < 40) { inEdu = true; continue; }
      if (inEdu) {
        if (/^(experience|skills|projects|certifications|work|employment)/i.test(line) && line.length < 40) break;
        eduLines.push(line);
        if (eduLines.length > 8) break;
      }
    }
    const degP = /(?:B\.?(?:Tech|E|Sc|A|Com|S|Eng)|Bachelor|M\.?(?:Tech|E|Sc|A|Com|S|BA|Eng)|Master|Ph\.?D|MBA|BCA|MCA|Diploma)/i;
    for (const line of eduLines) {
      if (degP.test(line)) return line.replace(/\s+/g, ' ').trim().substring(0, 120);
    }
    const m = text.match(new RegExp(`(${degP.source}[^\\n]{0,80})`, 'i'));
    return m ? m[0].replace(/\s+/g, ' ').trim() : null;
  },

  extractSkills(text, lines) {
    const skillH = /^(?:skills|technical\s*skills|core\s*competencies|technologies|tech\s*stack|key\s*skills)/i;
    let inSkill = false;
    const skillLines = [];
    for (const line of lines) {
      if (skillH.test(line) && line.length < 50) { inSkill = true; continue; }
      if (inSkill) {
        if (/^(experience|education|projects|certifications|work|employment|achievements|summary|objective)/i.test(line) && line.length < 40) break;
        skillLines.push(line);
        if (skillLines.length > 15) break;
      }
    }
    const skills = new Set();
    const skillText = skillLines.join(' ');
    if (skillText) {
      skillText.split(/[,|•·●■▪►▸–—\n]+/).map(s => s.replace(/^[-*\s]+/, '').trim())
        .filter(s => s.length >= 2 && s.length <= 40 && !/^\d+$/.test(s))
        .forEach(t => skills.add(t));
    }
    const known = [
      'JavaScript','TypeScript','Python','Java','C\\+\\+','C#','Ruby','Go','Rust','PHP','Swift','Kotlin',
      'React','Angular','Vue','Next\\.js','Node\\.js','Express','Django','Flask','Spring Boot','Laravel',
      'AWS','Azure','GCP','Docker','Kubernetes','Terraform','Jenkins','CI/CD',
      'MongoDB','PostgreSQL','MySQL','Redis','Elasticsearch','DynamoDB','Firebase',
      'HTML','CSS','SASS','Tailwind','Bootstrap','Git','Linux','REST API','GraphQL','Microservices',
      'Machine Learning','Deep Learning','NLP','TensorFlow','PyTorch',
      'Figma','Sketch','Photoshop','Agile','Scrum','Jira','SQL','NoSQL','Power BI','Tableau','Excel',
    ];
    for (const s of known) {
      if (new RegExp(`\\b${s}\\b`, 'i').test(text)) {
        skills.add(s.replace(/\\\+/g, '+').replace(/\\\./g, '.'));
      }
    }
    return [...skills].slice(0, 30);
  },

  extractSummary(lines) {
    const sumH = /^(?:summary|profile|objective|about\s*me|professional\s*summary|career\s*objective)/i;
    let inSum = false;
    const sumLines = [];
    for (const line of lines) {
      if (sumH.test(line) && line.length < 40) { inSum = true; continue; }
      if (inSum) {
        if (/^(experience|education|skills|projects|certifications|work|technical|core)/i.test(line) && line.length < 40) break;
        sumLines.push(line);
        if (sumLines.length > 5) break;
      }
    }
    if (sumLines.length > 0) {
      const s = sumLines.join(' ').replace(/\s+/g, ' ').trim();
      return s.length > 250 ? s.substring(0, 250) + '...' : s;
    }
    return null;
  },
};

module.exports = resumeParserService;
