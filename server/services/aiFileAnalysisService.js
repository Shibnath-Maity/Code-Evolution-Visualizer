const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function analyzeFileWithAI(file) {
  try {
    const prompt = `
You are a Senior Software Architect.

Analyze this source file.

Return ONLY valid JSON.

{
  "purpose":"",
  "responsibilities":[],
  "importantFunctions":[],
  "architecture":"",
  "dependencies":[],
  "dataFlow":"",
  "strengths":[],
  "weaknesses":[],
  "recommendations":[],
  "complexity":"Low|Medium|High",
  "maintainability":"Excellent|Good|Fair|Poor",
  "summary":""
}

Filename:
${file.name}

Path:
${file.path}

Code:
${file.content}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You are an expert software architect. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return JSON.parse(
      response.choices[0].message.content
    );

  } catch (err) {
    console.error(
      "AI Analysis Error:",
      err.message
    );

    return {
      purpose: "Unable to analyze file",
      responsibilities: [],
      importantFunctions: [],
      architecture: "",
      dependencies: [],
      dataFlow: "",
      strengths: [],
      weaknesses: [],
      recommendations: [],
      complexity: "Unknown",
      maintainability: "Unknown",
      summary: err.message,
    };
  }
}
async function analyzeRepositoryFiles(fileAnalysis) {

    const files = fileAnalysis.allFiles || [];

    console.log(`🤖 AI analyzing ${files.length} files...`);

    const analyzedFiles = [];

    for (const file of files) {

        const ai = await analyzeFileWithAI(file);

        analyzedFiles.push({
            ...file,
            ai,
        });

    }

    return {
        statistics: {
            totalFiles: analyzedFiles.length,
        },

        files: analyzedFiles,
    };

}

module.exports = {
  analyzeFileWithAI,
  analyzeRepositoryFiles,
};