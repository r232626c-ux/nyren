/* global window */

import { Platform } from "react-native";
import EventEmitter from "eventemitter3";
import Voice from "@react-native-voice/voice";
import { Audio } from "expo-av";

class VoiceEngine extends EventEmitter {
  constructor() {
    super();

    this.isListening = false;
    this.isStarting = false;
    this.isSpeaking = false;
    this.isDestroyed = false;

    this.state = "IDLE";
    this.isActive = false;

    this.wakeWord = "hey coli";

    this.commandTimer = null;
    this.silenceTimer = null;
    this.restartTimer = null;

    this.commandBuffer = "";
    this.commandWindowMs = 10000;
    this.silenceWindowMs = 800;

    this.webRecognition = null;
    this.webSupported = false;

    this.lastTranscript = "";
    this.transcriptCooldown = false;

    this.currentSound = null;
  }

  // Chrome's built-in speech recognition service occasionally surfaces this
  // benign "message channel closed" rejection when a recognition session is
  // restarted mid-flight — it doesn't affect functionality, just console noise.
  static suppressBenignWebSpeechRejections() {
    if (typeof window === "undefined" || window.__coliSpeechRejectionFilterInstalled) return;
    window.__coliSpeechRejectionFilterInstalled = true;

    window.addEventListener("unhandledrejection", (event) => {
      const message = String(event?.reason?.message || event?.reason || "");
      if (message.includes("message channel closed") || message.includes("listener indicated an asynchronous response")) {
        event.preventDefault();
      }
    });
  }

  // ================================
  // INIT
  // ================================
  async initialize() {
    try {
      if (Platform.OS !== "web") {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== "granted") {
          throw new Error("Microphone permission denied");
        }
      }

      if (Platform.OS === "web") {
        this.initWeb();
      } else {
        this.initNative();
      }
    } catch (err) {
      // Silently suppress init errors
      this.emit("speechError", err);
    }
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;

    switch (newState) {
      case "LISTENING":
        this.emit("assistantListening");
        break;
      case "PROCESSING":
        this.emit("assistantThinking");
        break;
      case "SPEAKING":
        this.emit("assistantSpeaking");
        break;
      case "IDLE":
      default:
        break;
    }
  }

  cancelCommandTimers() {
    if (this.commandTimer) {
      clearTimeout(this.commandTimer);
      this.commandTimer = null;
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  resetCommandSession() {
    this.commandBuffer = "";
    this.isActive = false;
    this.cancelCommandTimers();

    if (!this.isSpeaking && !this.isDestroyed) {
      this.setState("LISTENING");
      this.startListening();
    }

    this.emit("commandTimeout");
  }

  scheduleCommandTimeout() {
    if (this.commandTimer) clearTimeout(this.commandTimer);
    this.commandTimer = setTimeout(() => {
      this.resetCommandSession();
    }, this.commandWindowMs);
  }

  scheduleSilenceTimeout() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      if (this.commandBuffer.trim()) {
        this.commitCommand();
      }
    }, this.silenceWindowMs);
  }

  activateWakeWord() {
    this.isActive = true;
    this.commandBuffer = "";
    this.setState("PROCESSING");
    this.emit("wakeWordDetected");
    this.scheduleCommandTimeout();
    this.scheduleSilenceTimeout();
  }

  commitCommand() {
    const command = this.commandBuffer.trim();
    this.cancelCommandTimers();
    this.commandBuffer = "";

    if (!command) {
      this.resetCommandSession();
      return;
    }

    console.log("[VOICE ENGINE] COMMIT COMMAND:", command);
    this.setState("PROCESSING");
    this.emit("command", command);
  }

  async interruptSpeech() {
    if (!this.isSpeaking) return;

    this.emit("assistantInterrupted");
    this.setState("LISTENING");

    try {
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }
    } catch (e) {
      // Silently suppress interrupt errors
    }

    this.isSpeaking = false;
    if (!this.isDestroyed) {
      this.startListening();
    }
  }

  // ================================
  // WEB
  // ================================
  initWeb() {
    VoiceEngine.suppressBenignWebSpeechRejections();

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.emit("speechUnsupported");
      return;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.emit("speechError", "mic_blocked");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        this.webSupported = true;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          this.isListening = true;
          this.isStarting = false;
          this.setState("LISTENING");
          this.emit("speechStart");
        };

        recognition.onend = () => {
          this.isListening = false;
          this.isStarting = false;
          this.emit("speechEnd");

          if (this.state === "LISTENING" && !this.isSpeaking && !this.isDestroyed) {
            this.safeRestart();
          }
        };

        recognition.onerror = (e) => {
          this.isListening = false;
          this.isStarting = false;

          if (e?.error === "not-allowed" || e?.error === "permission_denied") {
            console.warn("[VoiceEngine] mic blocked");
            this.emit("speechError", "mic_blocked");
            return;
          }

          if (this.state === "LISTENING" && !this.isSpeaking) {
            this.safeRestart();
          }

          // "no-speech" (user just went quiet) and "aborted" (we stopped it
          // ourselves, e.g. during a restart) are routine, not real errors —
          // don't surface them to the UI, just let safeRestart recover.
          if (e?.error === "no-speech" || e?.error === "aborted") {
            return;
          }

          this.emit("speechError", e?.error);
        };

        recognition.onresult = (event) => {
          const text =
            event.results?.[event.results.length - 1]?.[0]?.transcript;

          if (text?.trim()) {
            this.handleTranscript(text);
          }
        };

        this.webRecognition = recognition;
        this.startListening();
      })
      .catch((error) => {
        // Silently handle permission denied - don't log
        const errMsg = error?.message || String(error);
        if (errMsg.includes('Permission') || errMsg.includes('NotAllowed')) {
          this.emit("speechError", "mic_blocked");
          return;
        }
        // Silently suppress mic init errors
        this.emit("speechError", "init_failed");
      });
    return;
  }

  // ================================
  // NATIVE
  // ================================
  initNative() {
    Voice.onSpeechStart = () => {
      this.isListening = true;
      this.setState("LISTENING");
      this.emit("speechStart");
    };

    Voice.onSpeechEnd = () => {
      this.isListening = false;
      this.emit("speechEnd");

      if (!this.isSpeaking && !this.isDestroyed) {
        this.safeRestart();
      }
    };

    Voice.onSpeechResults = (r) => {
      const text = r?.value?.[0];
      if (text?.trim()) this.handleTranscript(text);
    };

    Voice.onSpeechError = (e) => {
      this.isListening = false;

      if (this.state === "LISTENING" && !this.isSpeaking) {
        this.safeRestart();
      }

      this.emit("speechError", e);
    };

    this.startListening();
  }

  // ================================
  // START LISTENING (SAFE)
  // ================================
  async startListening() {
    if (this.isListening || this.isStarting || this.isSpeaking) return;

    this.isStarting = true;

    try {
      if (Platform.OS === "web") {
        await this.webRecognition?.start();
      } else {
        await Voice.start("en-US");
      }
      this.setState("LISTENING");
    } catch (err) {
      if (err?.message?.includes("already started")) {
        this.isListening = true;
        return;
      }

      console.warn("[VoiceEngine] start error:", err);
    } finally {
      this.isStarting = false;
    }
  }

  // ================================
  // STOP LISTENING
  // ================================
  async stopListening() {
    try {
      if (Platform.OS === "web") {
        this.webRecognition?.stop();
      } else {
        await Voice.stop();
      }

      this.isListening = false;
      this.isStarting = false;

    } catch {}
  }

  // ================================
  // SPEAK CONTROL (LIKE CHATSCREEN)
  // ================================
  setSpeaking(value, options = { startListening: true }) {
    this.isSpeaking = value;

    if (value) {
      this.setState("SPEAKING");
      // Pause the mic while the assistant talks — on web, TTS audio can leak
      // into the mic and get re-recognized as a new command / self-interrupt,
      // which was leaving the session stuck oscillating instead of responding.
      this.stopListening();
      return;
    }

    if (!this.isDestroyed && options.startListening) {
      this.setState("LISTENING");
      this.startListening();
    }
  }

  // ================================
  // SAFE RESTART (NO LOOP BUGS)
  // ================================
  safeRestart() {
    if (this.restartTimer) clearTimeout(this.restartTimer);

    this.restartTimer = setTimeout(() => {
      if (this.state === "LISTENING" && !this.isSpeaking && !this.isDestroyed) {
        this.startListening();
      }
    }, 1200);
  }

  // ================================
  // TRANSCRIPT HANDLER
  // ================================
  handleTranscript(text) {
    const msg = text?.toLowerCase().trim();
    if (!msg) return;

    console.log("[VoiceEngine] Transcript:", msg);

    if (this.state === "SPEAKING") {
      this.interruptSpeech();
      return;
    }

    if (msg === this.lastTranscript || this.transcriptCooldown) {
      return;
    }

    this.lastTranscript = msg;
    this.transcriptCooldown = true;
    setTimeout(() => {
      this.transcriptCooldown = false;
    }, 1200);

    // Emit recognized speech to listeners (for direct use in ChatScreen)
    this.emit("speechRecognized", msg);

    const wakeIndex = msg.indexOf(this.wakeWord);
    if (wakeIndex !== -1) {
      const afterWake = msg.slice(wakeIndex + this.wakeWord.length).trim();
      if (afterWake) {
        const commandText = afterWake;
        this.isActive = true;
        console.log("[VoiceEngine] Wake word payload detected:", commandText);
        console.log("[VOICE ENGINE] COMMAND EMITTED:", commandText);
        this.setState("PROCESSING");
        this.emit("command", commandText);
        return;
      }

      this.activateWakeWord();
      return;
    }

    if (this.state === "PROCESSING") {
      this.commandBuffer += ` ${msg}`;
      this.scheduleSilenceTimeout();
      return;
    }

    if (!this.isActive) {
      console.log("[VoiceEngine] Forcing active command mode for debugging");
      this.isActive = true;
    }

    const commandText = msg;
    console.log("[VOICE ENGINE] COMMAND EMITTED:", commandText);
    this.setState("PROCESSING");
    this.emit("command", commandText);
  }

  // ================================
  // DESTROY
  // ================================
  async destroy() {
    this.isDestroyed = true;

    if (this.restartTimer) clearTimeout(this.restartTimer);

    await this.stopListening();

    if (Platform.OS !== "web") {
      await Voice.destroy();
      Voice.removeAllListeners();
    }
  }
}

export default VoiceEngine;