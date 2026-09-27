const axios = require("axios");

/* ---------------- CONFIG ---------------- */
const OLLAMA_URL = `${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}/api/chat`;

/**
 * Ask a question about document content
 * ONLY answers from provided document
 */
async function askDocument(docContent, question, options = {}) {
  try {
    console.log(`[DocService] Question: ${question.slice(0, 50)}...`);

    const systemPrompt = `
You are a document analysis assistant.

STRICT RULES:
- ONLY answer using the provided document
- If answer is not in document → say: "This information is not in the document"
- Be concise and accurate
- Quote relevant parts when useful
${options.language === "sn" || options.language === "Shona" ? '- Answer in fluent, natural Shona (chiShona). Preserve names, numbers, and technical terms when needed. Example: Q: What is the capital city of Zimbabwe? A: Guta guru reZimbabwe iHarare. Example translation: Good morning = Mangwanani.' : ""}
`;

    const maxTokens = Math.min(Math.max(Number(options.max_tokens) || 400, 64), 900);

    const response = await axios.post(OLLAMA_URL, {
      model: process.env.OLLAMA_MODEL || "qwen2.5:0.5b",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `DOCUMENT:\n${docContent}\n\nQUESTION:\n${question}`,
        },
      ],
      stream: false,
      options: { num_predict: maxTokens, temperature: 0.2 },
    });

    const answer =
      response?.data?.message?.content ||
      "Unable to process the question.";

    return {
      answer,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[DocService ERROR]", error.message);

    return {
      answer: "Error processing document question.",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Summarize document
 */
async function summarizeDocument(docContent, docName = "Document") {
  try {
    console.log(`[DocService] Summarizing: ${docName}`);

    const response = await axios.post(OLLAMA_URL, {
      model: process.env.OLLAMA_MODEL || "qwen2.5:0.5b",
      messages: [
        {
          role: "system",
          content:
            "Summarize the document into 3-5 clear bullet points.",
        },
        {
          role: "user",
          content: `DOCUMENT NAME: ${docName}\n\nCONTENT:\n${docContent}`,
        },
      ],
      stream: false,
      options: { num_predict: 400, temperature: 0.2 },
    });

    const summary =
      response?.data?.message?.content ||
      "Unable to summarize document.";

    return {
      summary,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[DocService ERROR]", error.message);

    return {
      summary: "Error summarizing document.",
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = {
  askDocument,
  summarizeDocument,
};