const providers = {
  groq: require("../providers/groqProvider").callGroq,
  openrouter: require("../providers/openrouterProvider").callOpenRouter,
  ollama: require("../providers/ollamaProvider").callOllama,
};

async function executeWithResilience(model, messages) {
  const order = [model, "groq", "openrouter", "ollama"];

  for (let m of order) {
    try {
      console.log("Trying model:", m);
      return await providers[m](messages);
    } catch (err) {
      console.log(`Model ${m} failed`);
    }
  }

  return "I'm having trouble accessing my AI systems right now, but I can still try to help if you rephrase your question.";
}

module.exports = { executeWithResilience };