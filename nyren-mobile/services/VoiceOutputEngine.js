import EventEmitter from "eventemitter3";
import { Platform } from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";

const SENTENCE_REGEX = /[^.!?]+[.!?]+(?:\s|$)/g;

class VoiceOutputEngine extends EventEmitter {
  constructor() {
    super();
    this.sound = null;
    this.voiceEngine = null;
    this.queue = [];
    this.pendingBuffer = "";
    this.isPlaying = false;
    this.isInterrupted = false;
  }

  setVoiceEngine(engine) {
    this.voiceEngine = engine;
  }

  appendChunk(chunk) {
    if (!chunk?.trim()) return;

    this.pendingBuffer += chunk;
    const matches = this.pendingBuffer.match(SENTENCE_REGEX) || [];

    if (matches.length > 0) {
      const consumed = matches.join("");
      this.pendingBuffer = this.pendingBuffer.slice(consumed.length);
      matches.forEach((sentence) => {
        const trimmed = sentence.trim();
        if (trimmed) {
          this.queue.push(trimmed);
        }
      });
    }

    this.playNext();
  }

  flushBuffer() {
    const remaining = this.pendingBuffer.trim();
    if (remaining) {
      this.queue.push(remaining);
      this.pendingBuffer = "";
    }
    this.playNext();
  }

  async interrupt() {
    this.isInterrupted = true;
    this.queue = [];

    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        // Silently suppress interrupt errors
      }
      this.sound = null;
    }

    try {
      Speech.stop();
    } catch (error) {
      // ignore stop errors
    }

    this.isPlaying = false;
    this.pendingBuffer = "";
    this.emit("interrupted");
    this.isInterrupted = false;
  }

  async playNext() {
    if (this.isPlaying || this.queue.length === 0 || this.isInterrupted) {
      return;
    }

    const nextSegment = this.queue.shift();
    if (!nextSegment?.trim()) {
      return this.playNext();
    }

    this.isPlaying = true;
    this.emit("speechSegmentStarted", nextSegment);

    try {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        typeof window.speechSynthesis !== "undefined"
      ) {
        await this.playWebSpeech(nextSegment);
        return;
      }

      await this.playNativeSpeech(nextSegment);
      return;
    } catch (error) {
      // Silently fail and continue to next segment instead of emitting error
      this.isPlaying = false;
      await this.finishSegment();
    }
  }

  async playWebSpeech(text) {
    return new Promise((resolve, reject) => {
      try {
        if (!window.speechSynthesis) {
          this.isPlaying = false;
          resolve(); // Skip web speech if not available
          return;
        }

        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.onstart = () => {
          this.isPlaying = true;
        };
        utterance.onend = async () => {
          this.isPlaying = false;
          await this.finishSegment();
          resolve();
        };
        utterance.onerror = async (event) => {
          // Silently suppress speech errors and continue
          this.isPlaying = false;
          await this.finishSegment();
          resolve(); // Continue without error
        };
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        this.isPlaying = false;
        resolve(); // Silently continue
      }
    });
  }

  async playNativeSpeech(text) {
    return new Promise((resolve, reject) => {
      try {
        this.isPlaying = true;

        Speech.speak(text, {
          language: "en-US",
          pitch: 1.0,
          rate: 1.0,
          onDone: async () => {
            this.isPlaying = false;
            await this.finishSegment();
            resolve();
          },
          onStopped: async () => {
            this.isPlaying = false;
            await this.finishSegment();
            resolve();
          },
          onError: async (error) => {
            // Silently suppress speech errors and continue
            this.isPlaying = false;
            await this.finishSegment();
            resolve(); // Continue without error
          },
        });
      } catch (error) {
        this.isPlaying = false;
        resolve(); // Silently continue
      }
    });
  }

  async finishSegment() {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        // Silently suppress unload errors
      }
      this.sound = null;
    }

    this.isPlaying = false;
    this.emit("speechSegmentFinished");

    if (this.queue.length > 0 && !this.isInterrupted) {
      await this.playNext();
      return;
    }

    if (!this.isInterrupted) {
      this.emit("speechFinished");
    }
  }
}

export default VoiceOutputEngine;
