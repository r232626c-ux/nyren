const MAX_HISTORY = 20;

class MemoryGraph {
  constructor() {
    this.interactions = [];
  }

  addInteraction(role, text) {
    if (!text?.trim()) return;

    this.interactions.push({
      role,
      text: text.trim(),
      timestamp: Date.now(),
    });

    if (this.interactions.length > MAX_HISTORY) {
      this.interactions.splice(0, this.interactions.length - MAX_HISTORY);
    }
  }

  addUserInteraction(text) {
    this.addInteraction("user", text);
  }

  addAssistantInteraction(text) {
    this.addInteraction("assistant", text);
  }

  getContext(activeMode = "chat") {
    const recent = [...this.interactions];
    return {
      activeMode,
      recentInteractions: recent,
      lastUserInteraction:
        recent
          .slice()
          .reverse()
          .find((item) => item.role === "user")?.text || "",
      lastAssistantInteraction:
        recent
          .slice()
          .reverse()
          .find((item) => item.role === "assistant")?.text || "",
    };
  }

  clear() {
    this.interactions = [];
  }
}

export default MemoryGraph;
