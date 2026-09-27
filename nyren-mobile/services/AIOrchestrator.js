import EventEmitter from "eventemitter3";
import { apiService } from "./apiService";

class AIOrchestrator extends EventEmitter {
  constructor({ stateManager, memoryGraph }) {
    super();
    this.stateManager = stateManager;
    this.memoryGraph = memoryGraph;
    this.abortController = null;
  }

  async processCommand(text, mode = "chat", language = "auto") {
    if (!text?.trim()) return null;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.emit("ai_stream_cancel");
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.stateManager.transitionTo("PROCESSING");
    this.memoryGraph.addUserInteraction(text);

    let finalAnswer = "";
    let response = null;

    try {
      response = await apiService.streamMessage(
        text,
        { language },
        mode,
        (chunk) => {
          if (!chunk) return;
          finalAnswer += chunk;
          this.emit("ai_stream_chunk", chunk);
        },
        signal
      );

      if (!response?.answer && finalAnswer) {
        response = { answer: finalAnswer, sources: [], reasoning: [] };
      }

      this.memoryGraph.addAssistantInteraction(response.answer || finalAnswer);
      this.stateManager.transitionTo("SPEAKING");
      this.emit("ai_stream_complete", response);
      return response;
    } catch (error) {
      if (signal.aborted) {
        this.emit("ai_stream_cancel", error);
      } else {
        this.emit("ai_stream_error", error);
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.stateManager.transitionTo("INTERRUPTING");
      this.emit("ai_stream_cancel");
    }
  }
}

export default AIOrchestrator;
