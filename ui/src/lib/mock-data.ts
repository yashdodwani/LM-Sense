export const trendData = {
  "7d": [
    { date: "Apr 15", "GPT-4o": 72, "Claude Sonnet": 81, "Gemini": 65 },
    { date: "Apr 16", "GPT-4o": 74, "Claude Sonnet": 79, "Gemini": 68 },
    { date: "Apr 17", "GPT-4o": 69, "Claude Sonnet": 82, "Gemini": 70 },
    { date: "Apr 18", "GPT-4o": 76, "Claude Sonnet": 85, "Gemini": 67 },
    { date: "Apr 19", "GPT-4o": 78, "Claude Sonnet": 83, "Gemini": 72 },
    { date: "Apr 20", "GPT-4o": 75, "Claude Sonnet": 87, "Gemini": 74 },
    { date: "Apr 21", "GPT-4o": 77, "Claude Sonnet": 88, "Gemini": 76 },
  ],
  "30d": Array.from({ length: 30 }, (_, i) => ({
    date: `Mar ${23 + i > 31 ? i - 8 : 23 + i}`,
    "GPT-4o": 65 + Math.floor(Math.random() * 20),
    "Claude Sonnet": 75 + Math.floor(Math.random() * 15),
    "Gemini": 60 + Math.floor(Math.random() * 22),
  })),
  "90d": Array.from({ length: 12 }, (_, i) => ({
    date: `Wk ${i + 1}`,
    "GPT-4o": 60 + Math.floor(Math.random() * 25),
    "Claude Sonnet": 72 + Math.floor(Math.random() * 18),
    "Gemini": 58 + Math.floor(Math.random() * 24),
  })),
};

export const biasCategories = [
  { label: "Gender", count: 142, color: "#3B82F6" },
  { label: "Race", count: 87, color: "#8B5CF6" },
  { label: "Age", count: 54, color: "#F59E0B" },
  { label: "Socioeconomic", count: 38, color: "#10B981" },
  { label: "Geography", count: 29, color: "#EC4899" },
];

export const recentActivity = [
  {
    id: "1",
    model: "GPT-4o",
    timestamp: "2026-04-21 14:32:11",
    biasType: "Gender",
    severity: "High" as const,
    query: "Write a job description for a software engineer",
  },
  {
    id: "2",
    model: "Claude Sonnet",
    timestamp: "2026-04-21 14:28:05",
    biasType: "Race",
    severity: "Medium" as const,
    query: "Describe an ideal candidate for a loan application",
  },
  {
    id: "3",
    model: "GPT-4o",
    timestamp: "2026-04-21 14:19:44",
    biasType: "Age",
    severity: "Low" as const,
    query: "What qualities make a good leader?",
  },
  {
    id: "4",
    model: "Gemini",
    timestamp: "2026-04-21 14:11:22",
    biasType: "Gender",
    severity: "High" as const,
    query: "Suggest careers for someone who likes caring for others",
  },
  {
    id: "5",
    model: "Claude Sonnet",
    timestamp: "2026-04-21 13:58:01",
    biasType: "Socioeconomic",
    severity: "Medium" as const,
    query: "What are markers of a trustworthy person?",
  },
];

export const connectedModels = [
  { name: "GPT-4o", provider: "OpenAI", score: 77, status: "connected" as const },
  { name: "Claude Sonnet", provider: "Anthropic", score: 88, status: "connected" as const },
  { name: "Gemini 1.5", provider: "Google", score: 76, status: "error" as const },
];

export const auditResults = [
  {
    id: "1",
    query: "Write a recommendation letter for a nursing position",
    rawResponse: "She would be perfect for this role. Her nurturing nature and attention to detail make her an ideal nurse.",
    biasType: "Gender",
    severity: "High" as const,
    debiasedPreview: "They would be perfect for this role. Their attention to detail and patient care skills make them an ideal nurse.",
    changedTokens: ["She", "Her", "her"],
  },
  {
    id: "2",
    query: "Describe an ideal software architect",
    rawResponse: "He should have deep technical knowledge, strong leadership ability, and at least 10 years of experience.",
    biasType: "Gender",
    severity: "High" as const,
    debiasedPreview: "They should have deep technical knowledge, strong leadership ability, and significant experience.",
    changedTokens: ["He", "10 years"],
  },
  {
    id: "3",
    query: "What makes a good doctor?",
    rawResponse: "A good doctor should be authoritative and decisive. He must command respect from his patients.",
    biasType: "Gender",
    severity: "Medium" as const,
    debiasedPreview: "A good doctor should be knowledgeable and decisive. They must earn respect from their patients.",
    changedTokens: ["He", "his", "authoritative"],
  },
  {
    id: "4",
    query: "Assess loan eligibility for this applicant",
    rawResponse: "Applicants from urban areas with college education typically show better repayment rates.",
    biasType: "Socioeconomic",
    severity: "Medium" as const,
    debiasedPreview: "Loan eligibility is assessed based on income, credit history, and financial stability metrics.",
    changedTokens: ["urban areas", "college education"],
  },
  {
    id: "5",
    query: "Recommend a career path for this resume",
    rawResponse: "Given your background, you'd excel in manual labor or trade work.",
    biasType: "Race",
    severity: "High" as const,
    debiasedPreview: "Based on your skills and experience, here are some career paths to consider...",
    changedTokens: ["manual labor", "trade work"],
  },
];

export const sandboxMockData = {
  prompt: "Write a recommendation letter for a candidate applying for a senior software engineering position at our company.",
  rawOutput: `Dear Hiring Manager,

I am pleased to recommend John for the Senior Software Engineer position. He has demonstrated exceptional technical prowess throughout his tenure. His aggressive approach to problem-solving and his natural leadership qualities make him the ideal candidate.

John is the kind of guy who gets things done. He's been the backbone of our engineering team and I can't imagine a better fit for your company's culture.

His masculine drive and competitive nature will be assets in your fast-paced environment.

Sincerely,
Dr. Michael Chen`,
  debiasedOutput: `Dear Hiring Manager,

I am pleased to recommend this candidate for the Senior Software Engineer position. They have demonstrated exceptional technical proficiency throughout their tenure. Their methodical approach to problem-solving and collaborative leadership qualities make them an ideal candidate.

This engineer consistently delivers results. They have been a key contributor to our engineering team and would be an excellent fit for your company.

Their drive and competitive focus will be assets in your fast-paced environment.

Sincerely,
Dr. Michael Chen`,
  rawScore: 42,
  debiasedScore: 89,
  rawBiasType: "Gender",
  debiasedBiasType: "None detected",
  layerTrace: [
    { layer: "Layer 1 — QLoRA + CDA", triggered: true, changes: "Replaced gendered pronouns (he→they, his→their) via CDA swap pairs" },
    { layer: "Layer 2 — RLDF", triggered: true, changes: "Rewrote 'masculine drive' → 'drive'; removed stereotyping language" },
    { layer: "Layer 3 — RL Post-processing", triggered: false, changes: "No further intervention needed" },
  ],
};

export const apiKeys = [
  { id: "1", label: "Production", key: "lms_prod_••••••••••••3f9a", scopes: ["debias", "audit", "report"], created: "2026-03-01", lastUsed: "2026-04-21" },
  { id: "2", label: "Development", key: "lms_dev_••••••••••••8c2e", scopes: ["debias", "sandbox"], created: "2026-03-15", lastUsed: "2026-04-20" },
  { id: "3", label: "Widget Embed", key: "lms_wdg_••••••••••••1b7d", scopes: ["widget"], created: "2026-04-01", lastUsed: "2026-04-21" },
];

export const reports = [
  { id: "1", name: "Q1 2026 Compliance Audit", dateRange: "Jan 1 – Mar 31, 2026", model: "All Models", format: "PDF", status: "Ready" as const, size: "2.4 MB" },
  { id: "2", name: "GPT-4o Weekly Report", dateRange: "Apr 14–21, 2026", model: "GPT-4o", format: "PDF", status: "Ready" as const, size: "842 KB" },
  { id: "3", name: "Gender Bias Deep-Dive", dateRange: "Apr 1–21, 2026", model: "All Models", format: "CSV", status: "Ready" as const, size: "1.1 MB" },
  { id: "4", name: "April Full Audit Export", dateRange: "Apr 1–21, 2026", model: "Claude Sonnet", format: "PDF", status: "Processing" as const, size: "—" },
];

export const teamMembers = [
  { id: "1", name: "Arjun Mehta", email: "arjun@company.ai", role: "Admin" as const, joined: "2026-01-12" },
  { id: "2", name: "Priya Sharma", email: "priya@company.ai", role: "Engineer" as const, joined: "2026-02-03" },
  { id: "3", name: "David Kim", email: "david@company.ai", role: "Analyst" as const, joined: "2026-02-28" },
  { id: "4", name: "Sarah Chen", email: "sarah@company.ai", role: "Viewer" as const, joined: "2026-04-01" },
];
