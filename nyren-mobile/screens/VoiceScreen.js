import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import NeonHeader from '../components/NeonHeader';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from "expo-file-system";
import * as Calendar from "expo-calendar";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiService, getUserId } from "../services/apiService";
import AIOrchestrator from "../services/AIOrchestrator";
import VoiceOutputEngine from "../services/VoiceOutputEngine";
import StateManager from "../services/StateManager";
import MemoryGraph from "../services/MemoryGraph";
import VoiceEngine from "../services/VoiceEngine";
import MemoryStore from "../services/MemoryStore";
import Avatar from "../components/Avatar";
import { useAuth } from "../src/contexts/AuthContext";

export default function VoiceScreen({ navigation }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(
    "Tap microphone to start"
  );

  const [emotion, setEmotion] = useState("neutral");

  const [typing, setTyping] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [assistantResponseId, setAssistantResponseId] = useState(null);
  const [interpretation, setInterpretation] = useState(null);

  const [speaking, setSpeaking] = useState(false);

  const [isActive, setIsActive] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);

  // Web browsers only allow a camera/file dialog to open from a direct,
  // synchronous tap — not from an async voice-command callback. When that
  // happens we surface a one-tap button instead of silently failing.
  const [pendingVoiceAction, setPendingVoiceAction] = useState(null); // null | 'camera' | 'document'
  const [inboxSummary, setInboxSummary] = useState({ conversations: 0, pendingRequests: 0 });
  const [voiceLanguage, setVoiceLanguage] = useState("auto");

  const voiceEngineRef = useRef(null);
  const stateManagerRef = useRef(new StateManager());
  const memoryGraphRef = useRef(new MemoryGraph());
  const aiOrchestratorRef = useRef(null);
  const voiceOutputRef = useRef(new VoiceOutputEngine());
  const micPulse = useRef(new Animated.Value(0)).current;
  const bgPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    memoryGraphRef.current.clear();
    MemoryStore.clear();
  }, [user?.uuid]);

  const createMessage = (speaker, text) => ({
    id: `${speaker}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    speaker,
    text: text?.trim() || "",
    timestamp: new Date().toISOString(),
  });

  const sanitizeCommandText = (text) => {
    if (!text) return "";
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^(hey\s*coli[,:]?\s*)/i, "");
    cleaned = cleaned.replace(/^(hey[,:]?\s*)/i, "");
    return cleaned.trim();
  };

  // Deterministic keyword shortcuts for device-control commands, checked
  // before the AI intent classifier so these always work reliably offline.
  const LOCAL_COMMAND_PATTERNS = [
    { key: "camera", regex: /\b(open|launch|start)\s+(the\s+|my\s+)?camera\b|take\s+a\s+(photo|picture)\b/i },
    { key: "latestFeeds", regex: /\blatest\s+feeds?\b|\bshow\s+(me\s+)?(the\s+)?feed\b|\bwhat'?s\s+new\s+(in|on)\s+the\s+feed\b/i },
    { key: "openDocument", regex: /\bopen\s+(a\s+|the\s+|my\s+)?(document|file)\b/i },
  ];

  const matchLocalCommand = (text) => {
    const found = LOCAL_COMMAND_PATTERNS.find(({ regex }) => regex.test(text));
    return found?.key || null;
  };

  const addUserMessage = useCallback((text) => {
    if (!text?.trim()) return;
    setConversation((prev) => [...prev, createMessage("user", text)]);
  }, []);

  const addAssistantMessage = useCallback((text) => {
    if (!text?.trim()) return;
    setConversation((prev) => [...prev, createMessage("assistant", text)]);
  }, []);

  const appendAssistantChunk = useCallback(
    (chunk) => {
      if (!chunk?.trim()) return;
      setConversation((prev) => {
        if (assistantResponseId) {
          return prev.map((item) =>
            item.id === assistantResponseId
              ? { ...item, text: `${item.text}${chunk}` }
              : item
          );
        }

        const message = createMessage("assistant", chunk);
        setAssistantResponseId(message.id);
        return [...prev, message];
      });
    },
    [assistantResponseId]
  );

  const resetAssistantResponse = useCallback(() => {
    setAssistantResponseId(null);
  }, []);

  const speakText = useCallback(
    async (text) => {
      if (!text?.trim()) return;
      const engine = voiceEngineRef.current;

      engine?.setSpeaking(true);
      await engine?.stopListening();
      stateManagerRef.current.transitionTo("SPEAKING");
      voiceOutputRef.current.appendChunk(text);
    },
    []
  );

  const cancelSpeech = useCallback(async () => {
    try {
      await voiceOutputRef.current.interrupt();
      aiOrchestratorRef.current?.cancel();
      const engine = voiceEngineRef.current;
      engine?.setSpeaking(false, { startListening: false });
      stateManagerRef.current.transitionTo("INTERRUPTING");
      setStatus("Interrupted");
      setEmotion("sad");
    } catch (error) {
      // Silently suppress cancelSpeech errors
    }
  }, []);

  const bindVoiceOutputEvents = useCallback(() => {
    const output = voiceOutputRef.current;

    output.on("speechSegmentStarted", () => {
      setSpeaking(true);
      setStatus("Speaking...");
      setEmotion("talking");
    });

    output.on("speechFinished", () => {
      setSpeaking(false);
      const engine = voiceEngineRef.current;
      engine?.setSpeaking(false, { startListening: false });
      setEmotion("neutral");
      if (engine?.shouldListen) {
        stateManagerRef.current.transitionTo("LISTENING");
        engine.startListening({ preserveIntent: true });
      }
    });

    output.on("interrupted", () => {
      setSpeaking(false);
      setEmotion("sad");
      setStatus("Interrupted");
    });

    output.on("error", (error) => {
      // Silently suppress voice output errors - continue with text
      setSpeaking(false);
      setEmotion("neutral");
      stateManagerRef.current.transitionTo("LISTENING");
      if (voiceEngineRef.current?.shouldListen) {
        voiceEngineRef.current.startListening({ preserveIntent: true });
      }
    });
  }, []);

  const flushVoiceOutput = useCallback(() => {
    voiceOutputRef.current.flushBuffer();
  }, []);

  const appendVoiceChunk = useCallback((chunk) => {
    voiceOutputRef.current.appendChunk(chunk);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const engine = voiceEngineRef.current;
      if (engine?.shouldListen) engine.startListening({ preserveIntent: true });
      const loadInboxSummary = async () => {
        try {
          const [requestsResponse, conversationsResponse] = await Promise.all([
            apiService.get("/api/inbox/requests"),
            apiService.get("/api/inbox/conversations"),
          ]);
          const pendingRequests = requestsResponse?.data?.data || requestsResponse?.data || [];
          const conversations = conversationsResponse?.data?.data || conversationsResponse?.data || [];
          const summary = {
            pendingRequests: Array.isArray(pendingRequests) ? pendingRequests.length : 0,
            conversations: Array.isArray(conversations) ? conversations.length : 0,
          };
          if (!active) return;
          setInboxSummary(summary);

        } catch (error) {
          if (active) console.warn("[COMPANION] Inbox status unavailable:", error.message);
        }
      };

      loadInboxSummary();
      return () => {
        active = false;
        voiceEngineRef.current?.stopListening({ preserveIntent: true });
        cancelSpeech();
      };
    }, [cancelSpeech, user?.uuid])
  );

  useEffect(() => {
    let active = true;
    getUserId()
      .then((userId) => AsyncStorage.getItem(`coli_language_${userId}`))
      .then((language) => {
        if (active && language) setVoiceLanguage(language);
      })
      .catch((error) => console.warn("[COMPANION] Language preference unavailable:", error.message));
    return () => {
      active = false;
    };
  }, []);

  // =========================================
  // INITIALIZE VOICE ENGINE
  // =========================================
  useEffect(() => {
    // start subtle mic pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(micPulse, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ])
    ).start();

    // background pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, { toValue: 1, duration: 3000, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(bgPulse, { toValue: 0, duration: 3000, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();

    const engine = new VoiceEngine();

    voiceEngineRef.current = engine;

    // ASSISTANT STATE EVENTS
    engine.on("assistantListening", () => {
      setStatus("Listening...");
      setEmotion("listening");
    });

    engine.on("assistantThinking", () => {
      setStatus("Thinking...");
      setEmotion("thinking");
    });

    engine.on("assistantSpeaking", () => {
      setStatus("Speaking...");
      setEmotion("talking");
    });

    engine.on("assistantInterrupted", async () => {
      await cancelSpeech();
    });

    voiceOutputRef.current.setVoiceEngine(engine);

    const orchestrator = new AIOrchestrator({
      stateManager: stateManagerRef.current,
      memoryGraph: memoryGraphRef.current,
    });
    aiOrchestratorRef.current = orchestrator;

    orchestrator.on("ai_stream_chunk", (chunk) => {
      appendVoiceChunk(chunk);
      appendAssistantChunk(chunk);
    });

    orchestrator.on("ai_stream_complete", () => {
      flushVoiceOutput();
      resetAssistantResponse();
    });

    orchestrator.on("ai_stream_cancel", async () => {
      await cancelSpeech();
      resetAssistantResponse();
    });

    orchestrator.on("ai_stream_error", (error) => {
      // Silently suppress stream errors
      setStatus("Thinking...");
      setEmotion("neutral");
    });

    bindVoiceOutputEvents();

    // WAKE WORD
    engine.on("wakeWordDetected", async () => {
      setIsActive(true);
      setStatus("Activated");
      setEmotion("neutral");

      await speakText("What can I do for you?");
    });

    // COMMAND
    engine.on("command", async (text) => {
      console.log("[VOICE SCREEN] COMMAND RECEIVED:", text);
      await handleCommand(text);
    });

    // TIMEOUT
    engine.on("commandTimeout", () => {
      setIsActive(false);

      setStatus("Inactive - Say Hey Coli");
      setEmotion("neutral");
    });

    // ERROR
    // Ignore routine recognizer hiccups (silence timeouts, our own restarts,
    // "no match") — only surface errors the user actually needs to act on.
    const BENIGN_SPEECH_ERRORS = new Set([
      "no-speech",
      "aborted",
      "no_match",
      "speech_timeout",
      "recognition_fail",
    ]);
    engine.on("speechError", (errorCode) => {
      if (BENIGN_SPEECH_ERRORS.has(errorCode)) return;
      setStatus("Voice error");
      setEmotion("sad");
    });

    engine.initialize();

    return () => {
      cancelSpeech();
      engine.destroy?.();
    };
  }, [bindVoiceOutputEvents, cancelSpeech, appendVoiceChunk, flushVoiceOutput]);

  // =========================================
  // HANDLE COMMAND
  // =========================================
  const handleCommand = async (text) => {
    try {
      if (!text?.trim()) return;

      const cleanText = sanitizeCommandText(text);
      if (!cleanText) return;

      addUserMessage(cleanText);
      resetAssistantResponse();

      console.log("[VOICE SCREEN] handleCommand called with:", cleanText);

      memoryGraphRef.current.addUserInteraction(text);
      MemoryStore.addCommand(text);

      const localKey = matchLocalCommand(cleanText);
      if (localKey) {
        setTyping(true);
        if (localKey === "camera") await executeCamera();
        else if (localKey === "latestFeeds") await executeLatestFeeds();
        else if (localKey === "openDocument") await executeOpenDocument();
        setTyping(false);
        setStatus(isActive ? "Listening..." : "Inactive - Say Hey Coli");
        return;
      }

      setTyping(true);
      setStatus("Thinking...");
      setEmotion("thinking");

      const context = memoryGraphRef.current.getContext("chat");
      const command = await apiService.interpretCommand(cleanText, context);
      setInterpretation({ ...command, rawText: cleanText });

      const handled = await routeCommand({ ...command, rawText: cleanText });

      if (!handled) {
        try {
          await aiOrchestratorRef.current?.processCommand(text, "chat", voiceLanguage);
        } catch (streamError) {
          // Silently suppress stream errors and fall back
          const response = await apiService.sendMessage(text, { language: voiceLanguage });
          const answer = response?.answer || "I do not have a response.";
          addAssistantMessage(answer);
          await speakText(answer);
          setEmotion(response?.emotion || "neutral");
        }
      }
    } catch (error) {
      // Silently suppress handleCommand errors
      setEmotion("neutral");
      await speakText("Sorry, I encountered an error processing your request.");
    } finally {
      setTyping(false);
      const engine = voiceEngineRef.current;
      if (engine?.shouldListen && !engine.isSpeaking) {
        engine.startListening({ preserveIntent: true });
      }
      setStatus(isActive ? "Listening..." : "Inactive - Say Hey Coli");
    }
  };

  // =========================================
  // ROUTE COMMAND
  // =========================================
  const routeCommand = async (command) => {
    try {
      if (!command) {
        return false;
      }

      if (command.intent === "unknown" && command.confidence >= 0.2) {
        if (command.action === "search") {
          return executeSearch(command);
        }

        if (command.action === "answer" || command.action === "ask_question") {
          return executeAskQuestion({
            parameters: {
              question:
                command.parameters?.question || command.rawText || "",
            },
          });
        }
      }

      if (command.intent === "unknown" || command.confidence < 0.3) {
        return false;
      }

      switch (command.intent) {
        case "open_app":
          return executeOpenApp(command);

        case "search":
          return executeSearch(command);

        case "ask_question":
          return executeAskQuestion(command);

        case "system_control":
          return executeSystemControl(command);

        case "navigate":
          await speakText("Navigation is not ready yet.");
          return true;

        case "device_action":
          await speakText(
            "Device controls are not implemented yet."
          );
          return true;

        default:
          return false;
      }

    } catch (error) {
      // Silently suppress routing errors
      return false;
    }
  };

  // =========================================
  // OPEN APP
  // =========================================
  const executeOpenApp = async (command) => {
    const appName =
      command?.parameters?.appName ||
      command?.action;

    if (!appName) return false;

    const normalized = appName.toLowerCase();

    MemoryStore.addFrequentlyUsedApp(appName);

    if (normalized.includes("camera")) {
      await executeCamera();

      return true;
    }

    if (normalized.includes("file") || normalized.includes("document")) {
      await executeOpenDocument();

      return true;
    }

    if (normalized.includes("feed")) {
      await executeLatestFeeds();

      return true;
    }

    if (normalized.includes("calendar")) {
      await openCalendar();

      return true;
    }

    await speakText(`${appName} is not supported yet.`);

    return true;
  };

  // =========================================
  // CAMERA — capture a photo and share it to the Science Feed
  // =========================================
  const captureAndSharePhoto = async () => {
    try {
      setStatus("Opening camera...");

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        await speakText("I need camera permission to do that.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        await speakText("Okay, camera closed.");
        return;
      }

      const asset = result.assets[0];
      setStatus("Uploading photo...");

      const fileName = asset.fileName || `photo-${Date.now()}.jpg`;
      const fileType = asset.mimeType || "image/jpeg";

      const formData = new FormData();
      if (Platform.OS === "web") {
        const blob = await fetch(asset.uri).then((r) => r.blob());
        formData.append("file", new File([blob], fileName, { type: fileType }));
      } else {
        formData.append("file", { uri: asset.uri, name: fileName, type: fileType });
      }

      const uploadHeaders = Platform.OS === "web" ? {} : { "Content-Type": "multipart/form-data" };
      const uploadRes = await apiService.post("/api/feed/upload", formData, { headers: uploadHeaders });
      const uploaded = uploadRes?.data?.data || uploadRes?.data;

      if (!uploaded?.attachmentUrl) {
        await speakText("I took the photo but couldn't upload it.");
        return;
      }

      await apiService.post("/api/feed/posts", {
        content: "Shared via voice companion 📸",
        postType: "image",
        attachmentUrl: uploaded.attachmentUrl,
        attachmentName: uploaded.attachmentName,
        attachmentType: uploaded.attachmentType,
      });

      addAssistantMessage("Photo captured and shared to the Science Feed.");
      await speakText("Photo captured and shared to the feed.");
      navigation.navigate("Feed");
    } catch (error) {
      await speakText("I couldn't access the camera.");
    }
  };

  const executeCamera = async () => {
    if (Platform.OS === "web") {
      // Browsers block camera/file dialogs triggered outside a direct tap.
      setPendingVoiceAction("camera");
      addAssistantMessage("Tap the camera button on screen to continue.");
      await speakText("Tap the camera button on screen to continue.");
      return true;
    }

    await captureAndSharePhoto();
    return true;
  };

  // =========================================
  // LATEST FEEDS — read out and open the Science Feed
  // =========================================
  const executeLatestFeeds = async () => {
    try {
      setStatus("Checking the feed...");

      const res = await apiService.get("/api/feed/posts?limit=5");
      const posts = res?.data?.data || res?.data || [];

      if (!posts.length) {
        await speakText("There are no posts in the feed yet.");
        navigation.navigate("Feed");
        return true;
      }

      const summary = posts
        .slice(0, 3)
        .map((p, i) => {
          const snippet = (p.content || "shared an attachment").split(/\s+/).slice(0, 18).join(" ");
          return `${i + 1}. ${p.userName} says: ${snippet}`;
        })
        .join(". ");

      addAssistantMessage(`Latest feed posts: ${summary}`);
      await speakText(`Here are the latest posts. ${summary}`);
      navigation.navigate("Feed");
    } catch (error) {
      await speakText("I couldn't load the feed right now.");
    }

    return true;
  };

  // =========================================
  // OPEN DOCUMENT/FILE — pick a file and open it in doc chat
  // =========================================
  const pickAndUploadDocument = async () => {
    try {
      setStatus("Opening file picker...");

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain", "text/html"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        await speakText("No file was selected.");
        return;
      }

      const file = result.assets[0];
      setStatus("Uploading document...");

      const fileName = file.name || "document";
      const fileType = file.mimeType || "application/octet-stream";

      const formData = new FormData();
      if (Platform.OS === "web") {
        const blob = await fetch(file.uri).then((r) => r.blob());
        formData.append("file", new File([blob], fileName, { type: fileType }));
      } else {
        formData.append("file", { uri: file.uri, name: fileName, type: fileType });
      }

      const uploadRes = await apiService.uploadDocument(formData);
      const documentId = uploadRes?.documentId;

      if (documentId) {
        addAssistantMessage(`Opened ${fileName}. Ask me anything about it.`);
        await speakText(`I've opened ${fileName}. Ask me anything about it.`);
        navigation.navigate("Chat", { presetDocId: documentId, presetDocName: fileName });
      } else {
        await speakText("I couldn't process that document.");
      }
    } catch (error) {
      await speakText("I couldn't open a file.");
    }
  };

  const executeOpenDocument = async () => {
    if (Platform.OS === "web") {
      // Browsers block camera/file dialogs triggered outside a direct tap.
      setPendingVoiceAction("document");
      addAssistantMessage("Tap the file button on screen to continue.");
      await speakText("Tap the file button on screen to continue.");
      return true;
    }

    await pickAndUploadDocument();
    return true;
  };

  // =========================================
  // SEARCH
  // =========================================
  const executeSearch = async (command) => {
    const query = command?.parameters?.query || "";

    if (!query.trim()) return false;

    setStatus("Searching...");

    const result = await apiService.search(query, { language: voiceLanguage });

    const assistantText =
      result?.answer || result?.reply || "Search completed.";
    addAssistantMessage(assistantText);
    await speakText(assistantText);

    return true;
  };

  // =========================================
  // ASK QUESTION
  // =========================================
  const executeAskQuestion = async (command) => {
    const question =
      command?.parameters?.question || "";

    if (!question.trim()) return false;

    setStatus("Thinking...");

    const response = await apiService.sendMessage(question, { language: voiceLanguage });

    const assistantText =
      response?.answer || response?.reply || "I do not have an answer.";
    addAssistantMessage(assistantText);
    await speakText(assistantText);

    return true;
  };

  // =========================================
  // SYSTEM CONTROL
  // =========================================
  const executeSystemControl = async (command) => {
    const action = (
      command?.action || ""
    ).toLowerCase();

    if (
      action.includes("stop") ||
      action.includes("deactivate")
    ) {
      setIsActive(false);

      setStatus("Assistant deactivated");

      await speakText(
        "Shutting down. Looking forward to our next interaction."
      );

      return true;
    }

    return false;
  };

  // =========================================
  // FILES
  // =========================================
  const openFiles = async () => {
    try {
      const dir = FileSystem.documentDirectory;

      if (!dir) {
        await speakText("File system unavailable.");
        return;
      }

      const files =
        await FileSystem.readDirectoryAsync(dir);

      await speakText(
        `You currently have ${files.length} files stored.`
      );

    } catch (error) {
      // Silently suppress file access errors
      await speakText("Unable to access files.");
    }
  };

  // =========================================
  // CALENDAR
  // =========================================
  const openCalendar = async () => {
    try {
      const permission =
        await Calendar.requestCalendarPermissionsAsync();

      if (permission.status !== "granted") {
        await speakText(
          "Calendar permission was denied."
        );

        return;
      }

      const calendars =
        await Calendar.getCalendarsAsync();

      await speakText(
        `You currently have ${calendars.length} calendars available.`
      );

    } catch (error) {
      console.error(error);

      await speakText("Unable to access calendar.");
    }
  };

  // =========================================
  // UI
  // =========================================
  const bgScale = bgPulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const bgOpacity = bgPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#080E1D', '#070A16']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <Animated.View pointerEvents="none" style={[styles.heroGlow, { transform: [{ scale: bgScale }], opacity: bgOpacity }]} />
      <Animated.View pointerEvents="none" style={[styles.heroGlowSecondary, { opacity: bgOpacity }]} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.getParent?.()?.openDrawer?.()} style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color="#38bdf8" />
        </TouchableOpacity>
        <NeonHeader title="Voice Companion" subtitle="Tap the mic or say 'Hey Coli'" />
      </View>
      <View style={styles.avatarRow}>
        <Avatar emotion={emotion} />

        <View style={styles.statusBlock}>
          <Text style={styles.status}>
            {status}
          </Text>

          <Text style={styles.smallText}>
            {typing
              ? 'Thinking...'
              : speaking
              ? 'Speaking...'
              : isActive
              ? 'Active'
              : 'Inactive'}
          </Text>

          {interpretation ? (
            <View style={styles.interpretationBlock}>
              <Text style={styles.interpretationLabel}>Interpreted:</Text>
              <Text style={styles.interpretationText}>
                intent: {interpretation.intent || 'unknown'};
                action: {interpretation.action || 'none'};
                confidence: {Math.round((interpretation.confidence || 0) * 100)}%
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.companionActions}>
        <TouchableOpacity style={styles.companionCameraAction} onPress={executeCamera}>
          <Ionicons name="camera" size={18} color="#020617" />
          <Text style={styles.companionCameraText}>Open camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.companionInboxAction} onPress={() => navigation.navigate("Inbox")}>
          <Ionicons name="mail" size={18} color="#38bdf8" />
          <Text style={styles.companionInboxText}>
            Inbox · {inboxSummary.pendingRequests} pending · {inboxSummary.conversations} conversations
          </Text>
        </TouchableOpacity>
      </View>

      {pendingVoiceAction ? (
        <TouchableOpacity
          style={styles.pendingActionBtn}
          onPress={() => {
            const action = pendingVoiceAction;
            setPendingVoiceAction(null);
            if (action === "camera") captureAndSharePhoto();
            else if (action === "document") pickAndUploadDocument();
          }}
        >
          <Ionicons name={pendingVoiceAction === "camera" ? "camera" : "document-attach"} size={20} color="#05101f" />
          <Text style={styles.pendingActionBtnText}>
            {pendingVoiceAction === "camera" ? "Tap to open camera" : "Tap to choose a file"}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.historyWrapper}>
        <View style={styles.hiddenConversationPlaceholder}>
          <Text style={styles.emptyText}>Conversation history is kept private and not shown here.</Text>
        </View>
      </View>

      {/* MIC BUTTON */}
      <Animated.View style={{
        position: 'absolute',
        bottom: 28,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
        transform: [{ scale: micPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }]
      }}>
        <TouchableOpacity
          style={[
            styles.micButton,
            {
              backgroundColor: micEnabled
                ? '#0f766e'
                : '#111827',
            },
          ]}
          onPress={async () => {
          try {
            const engine = voiceEngineRef.current;

            if (!engine) return;

            // STOP
            if (engine.shouldListen) {
              await engine.stopListening();

              setMicEnabled(false);
              setIsActive(false);
              setStatus('Voice stopped');
              return;
            }

            // START
            engine.isActive = true;
            await engine.startListening();
            setMicEnabled(true);
            setIsActive(true);
            setStatus('Listening...');
          } catch (error) {
            // Silently suppress mic button errors
          }
        }}
      >
        <Ionicons
          name={micEnabled ? 'mic' : 'mic-off'}
          size={42}
          color='#fff'
        />
      </TouchableOpacity>

      {typing && (
        <ActivityIndicator
          style={styles.indicator}
          size='large'
          color='#38bdf8'
        />
      )}
      </Animated.View>
    </View>
  );
}

// =========================================
// STYLES
// =========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
  },
  pageTitle: {
    color: '#38bdf8',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 18,
    letterSpacing: 1,
  },
  pendingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: '#22D3EE',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  pendingActionBtnText: {
    color: '#05101f',
    fontWeight: '800',
    fontSize: 14,
  },
  companionActions: {
    gap: 8,
    marginBottom: 14,
  },
  companionCameraAction: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#38bdf8',
  },
  companionCameraText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '700',
  },
  companionInboxAction: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.28)',
    backgroundColor: 'rgba(56,189,248,0.08)',
  },
  companionInboxText: {
    color: '#dbeafe',
    fontSize: 13,
    fontWeight: '600',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    
    elevation: 5,
  },
  statusBlock: {
    flex: 1,
    marginLeft: 16,
    paddingLeft: 8,
  },
  status: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  smallText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 14,
  },
  interpretationBlock: {
    marginTop: 14,
    padding: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
  },
  interpretationLabel: {
    color: '#A5F3FC',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  interpretationText: {
    color: '#E2F3FF',
    fontSize: 13,
    lineHeight: 20,
  },
  micButton: {
    width: 132,
    height: 132,
    borderRadius: 66,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 18,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    
    elevation: 8,
  },
  historyWrapper: {
    flex: 1,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.12)',
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    
    elevation: 7,
    minHeight: 280,
  },
  historyContent: {
    paddingBottom: 220,
  },
  emptyState: {
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 14,
  },
  hiddenConversationPlaceholder: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0f172a',
    padding: 14,
    marginBottom: 10,
    borderRadius: 22,
    maxWidth: '80%',
    borderColor: '#2563eb',
    borderWidth: 1,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 14,
    marginBottom: 10,
    borderRadius: 22,
    maxWidth: '80%',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    
    elevation: 3,
  },
  userText: {
    color: '#e2e8f0',
    fontSize: 15,
  },
  assistantText: {
    color: '#cbd5e1',
    fontSize: 15,
  },
  indicator: {
    marginTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  menuBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroGlow: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: 'rgba(56,189,248,0.06)',
    top: -80,
    left: -40,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(139,92,246,0.04)',
    top: -40,
    right: -20,
  },
  pageTitle: {
    color: '#E6F2FF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 18,
    letterSpacing: 0.6,
  },
  status: {
    color: '#E6F2FF',
    fontSize: 20,
    fontWeight: '800',
  },
  smallText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 14,
  },
});