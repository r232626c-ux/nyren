import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Text,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  Modal,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import NeonHeader from "../components/NeonHeader";
import { useScreenSize } from "../src/utils/responsive";
import { TypingIndicator } from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import { apiService, getUserId } from "../services/apiService";
import billingService from "../services/billingService";

const { width } = Dimensions.get("window");

const createThreadId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = (Math.random() * 16) | 0;
      return (
        character === "x"
          ? random
          : (random & 3) | 8
      ).toString(16);
    }
  );

export default function ChatScreen({ navigation, route }) {
  const screenSize = useScreenSize();

  const pulse = useRef(new Animated.Value(0)).current;
  const flatRef = useRef(null);
  const sendingRef = useRef(false);

  const welcomeMessage = {
    id: "welcome",
    role: "assistant",
    content:
      "I’m Coli — your AI assistant. Ask me anything, I can search, reason, and analyze documents.",
  };

  /* =========================
     MESSAGE STATE
  ========================= */

  const [messages, setMessages] = useState([welcomeMessage]);

  const [input, setInput] = useState("");
  const [mode, setMode] = useState("chat");

  /* =========================
     LANGUAGE STATE
  ========================= */

  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [languagePreferenceKey, setLanguagePreferenceKey] = useState(null);

  /* =========================
     CHAT STATE
  ========================= */

  const [loading, setLoading] = useState(false);
  const [startingNewChat, setStartingNewChat] = useState(false);
  const [threadId, setThreadId] = useState(createThreadId);

  const [threads, setThreads] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* =========================
     DOCUMENT STATE
  ========================= */

  const [currentDocId, setCurrentDocId] = useState(null);
  const [currentDocName, setCurrentDocName] = useState(null);
  const [currentSourceFile, setCurrentSourceFile] = useState(null);
  const [sharingDocument, setSharingDocument] = useState(false);

  /* =========================
     BILLING STATE
  ========================= */

  const [currentPlan, setCurrentPlan] = useState("free");
  const [billingInitialized, setBillingInitialized] = useState(false);

  /* =========================
     BILLING INITIALIZATION
  ========================= */

  useEffect(() => {
    initializeBillingState();
  }, []);

  const initializeBillingState = async () => {
    try {
      const state = await billingService.initializeBillingState();

      setCurrentPlan(state?.currentPlan || "free");
      setBillingInitialized(true);
    } catch (error) {
      console.error("[ChatScreen] Billing init error:", error);
      setBillingInitialized(true);
    }
  };

  /* =========================
     LOAD LANGUAGE PREFERENCE
  ========================= */

  useEffect(() => {
    let active = true;

    getUserId()
      .then(async (userId) => {
        if (!userId) return;

        const key = `coli_language_${userId}`;
        const savedLanguage = await AsyncStorage.getItem(key);

        if (!active) return;

        setLanguagePreferenceKey(key);

        if (savedLanguage) {
          setSelectedLanguage(savedLanguage);
        }
      })
      .catch((error) => {
        console.warn(
          "[ChatScreen] Language preference unavailable:",
          error?.message
        );
      });

    return () => {
      active = false;
    };
  }, []);

  /* =========================
     PRESET DOCUMENT
  ========================= */

  useEffect(() => {
    const presetDocId = route?.params?.presetDocId;
    const presetDocName = route?.params?.presetDocName;

    if (presetDocId) {
      setCurrentDocId(presetDocId);
      setCurrentDocName(presetDocName || "Document");
      setMode("docs");
    }
  }, [
    route?.params?.presetDocId,
    route?.params?.presetDocName,
  ]);

  /* =========================
     ANIMATED PULSE
  ========================= */

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  /* =========================
     AUTO SCROLL
  ========================= */

  useEffect(() => {
    const timeout = setTimeout(() => {
      flatRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [messages]);

  /* =========================
     BILLING HELPERS
  ========================= */

  const createMessageId = () =>
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

  const checkCanSendMessage = async () => {
    try {
      const quota = await billingService.canSendMessage();

      if (!quota?.allowed) {
        Alert.alert(
          "Daily Limit Reached",
          "You've reached your daily message limit. Upgrade your plan to send more messages.",
          [
            {
              text: "OK",
            },
            {
              text: "Upgrade",
              onPress: () =>
                navigation.openDrawer?.(),
            },
          ]
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "[ChatScreen] Quota check failed:",
        error
      );

      /*
       * Preserve existing behaviour by allowing
       * the request if the quota service itself fails.
       */
      return true;
    }
  };

  const recordMessageUsage = async () => {
    try {
      await billingService.recordMessageUsage(1);
    } catch (error) {
      console.error(
        "[ChatScreen] Failed to record message usage:",
        error
      );
    }
  };

  /* =========================
     SEND MESSAGE
  ========================= */

  const sendMessage = async () => {
    try {
      console.log(
        "[ChatScreen] sendMessage called, input=",
        input
      );
    } catch (error) {}

    if (loading || sendingRef.current) {
      return;
    }

    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    sendingRef.current = true;
    let aiMessageId = null;

    try {
      const canSend = await checkCanSendMessage();

      if (!canSend) {
        return;
      }

      const userMessageId = createMessageId();
      aiMessageId = `${createMessageId()}-ai`;

      const userMsg = {
        id: userMessageId,
        role: "user",
        content: trimmedInput,
      };

      const aiMsg = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        sources: [],
        reasoning: [],
        structured: null,
        documentName: currentDocName || null,
        savedTurnId: null,
        isImportant: false,
      };

      /* Add user message + empty AI message */
      setMessages((previous) => {
        const next = [
          ...previous,
          userMsg,
          aiMsg,
        ];

        try {
          console.log(
            "[ChatScreen] appended messages, new length=",
            next.length
          );
        } catch (error) {}

        return next;
      });

      setInput("");
      setLoading(true);

      let res = null;

      /*
       * =========================
       * API REQUEST
       * =========================
       */

      if (mode === "search") {
        res = await apiService.search(
          trimmedInput,
          {
            language: selectedLanguage,
            threadId,
          }
        );
      } else if (mode === "reason") {
        res = await apiService.reason(
          trimmedInput,
          {
            language: selectedLanguage,
            threadId,
          }
        );
      } else if (
        mode === "docs" &&
        currentDocId
      ) {
        res = await apiService.docChat(
          trimmedInput,
          currentDocId,
          {
            language: selectedLanguage,
            threadId,
          }
        );
      } else {
        res = await apiService.sendMessage(
          trimmedInput,
          {
            language: selectedLanguage,
            threadId,
          }
        );
      }

      try {
        console.log(
          "[ChatScreen] api response=",
          res
        );
      } catch (error) {}

      /*
       * =========================
       * UPDATE AI MESSAGE
       * =========================
       */

      setMessages((previous) =>
        previous.map((message) => {
          if (message.id !== aiMessageId) {
            return message;
          }

          return {
            ...message,

            content:
              message.content ||
              res?.answer ||
              "No response",

            sources:
              res?.sources ||
              message.sources ||
              [],

            reasoning:
              res?.reasoning ||
              message.reasoning ||
              [],

            structured:
              res?.structured ||
              message.structured ||
              null,

            savedTurnId:
              res?.conversationId ||
              res?.turnId ||
              message.savedTurnId ||
              null,

            isImportant:
              message.isImportant || false,
          };
        })
      );

      /*
       * Record successful message usage.
       */
      await recordMessageUsage();

      const answer =
        res?.answer || "No response";

      let savedTurnId = res?.conversationId || res?.turnId || null;
      if (!savedTurnId && answer !== "No response") {
        const saved = await apiService.saveChatTurn({
          message: trimmedInput,
          answer,
          threadId,
          mode,
        });
        savedTurnId = saved?.conversationId || null;
      }

      if (savedTurnId) {
        setMessages((previous) => previous.map((message) =>
          message.id === userMessageId || message.id === aiMessageId
            ? { ...message, savedTurnId, isImportant: message.isImportant || false }
            : message
        ));
      }

      try {
        console.log(
          "[ChatScreen] answer received:",
          answer
        );
      } catch (error) {}
    } catch (error) {
      console.error(
        "[ChatScreen] sendMessage error:",
        error
      );

      const errorText =
        error?.message ||
        "Something went wrong. Please try again.";

      /*
       * Update the existing AI placeholder rather
       * than creating a second assistant message.
       */
      setMessages((previous) => {
        const aiMessageExists = previous.some(
          (message) =>
            message.id === aiMessageId
        );

        if (!aiMessageExists) {
          return [
            ...previous,
            {
              id: `${Date.now()}-err`,
              role: "assistant",
              content: `⚠️ ${errorText}`,
              isError: true,
            },
          ];
        }

        return previous.map((message) =>
          message.id === aiMessageId
            ? {
                ...message,
                content: `⚠️ ${errorText}`,
                isError: true,
              }
            : message
        );
      });

      Alert.alert("Error", errorText);
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  /* =========================
     START NEW CHAT
  ========================= */

  const startNewChat = async () => {
    if (loading || sendingRef.current || startingNewChat) return;

    setStartingNewChat(true);
    try {
      const unsavedTurns = messages.reduce((pending, message, index) => {
        if (message.role !== "user" || message.savedTurnId) return pending;
        const answer = messages
          .slice(index + 1)
          .find((candidate) => candidate.role === "assistant" && !candidate.isError && candidate.content?.trim());
        if (answer) pending.push({ message: message.content, answer: answer.content });
        return pending;
      }, []);

      for (const turn of unsavedTurns) {
        const saved = await apiService.saveChatTurn({
          ...turn,
          threadId,
          mode,
        });
        if (saved?.status !== "success" || !saved?.conversationId) {
          throw new Error(saved?.message || "The current chat could not be saved.");
        }
      }

      setMessages([welcomeMessage]);
      setInput("");
      setCurrentDocId(null);
      setCurrentDocName(null);
      setCurrentSourceFile(null);
      setMode("chat");
      setThreadId(createThreadId());
    } catch (error) {
      Alert.alert("Chat not saved", error?.message || "Could not save this chat. Your conversation is still open.");
    } finally {
      setStartingNewChat(false);
    }
  };

  /* =========================
     CHAT HISTORY
  ========================= */

  const loadChatHistory = async () => {
    setShowHistory(true);
    setLoadingHistory(true);

    try {
      const result =
        await apiService.getChatThreads();

      setThreads(result?.threads || []);
    } catch (error) {
      console.error(
        "[ChatScreen] Failed to load chat history:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to load chat history."
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const resumeThread = async (selectedThread) => {
    if (!selectedThread?.id) {
      return;
    }

    setLoadingHistory(true);

    try {
      const result =
        await apiService.getChatThread(
          selectedThread.id
        );

      const turns = (
        result?.turns || []
      ).flatMap((turn) => {
        const userTurn = {
          id: `${turn.id}-user`,
          role: "user",
          content: turn.message || "",
          savedTurnId: turn.id,
          isImportant:
            turn.isImportant || false,
        };

        const assistantTurn =
          turn.coli_response
            ? {
                id: `${turn.id}-assistant`,
                role: "assistant",
                content:
                  turn.coli_response,
                savedTurnId: turn.id,
                isImportant:
                  turn.isImportant || false,
              }
            : null;

        return assistantTurn
          ? [userTurn, assistantTurn]
          : [userTurn];
      });

      setThreadId(selectedThread.id);

      setMessages(
        turns.length
          ? turns
          : [welcomeMessage]
      );

      setCurrentDocId(null);
      setCurrentDocName(null);
      setMode("chat");
      setShowHistory(false);
    } catch (error) {
      console.error(
        "[ChatScreen] Failed to resume thread:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to open this conversation."
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  /* =========================
     COPY MESSAGE
  ========================= */

  const copyMessage = async (content) => {
    try {
      await Clipboard.setStringAsync(
        content || ""
      );

      Alert.alert(
        "Copied",
        "Message copied to clipboard."
      );
    } catch (error) {
      console.error(
        "[ChatScreen] Copy failed:",
        error
      );
    }
  };

  /* =========================
     IMPORTANT MESSAGE
  ========================= */

  const toggleImportant = async (item) => {
    if (!item?.savedTurnId) {
      return;
    }

    const isImportant =
      !item.isImportant;

    try {
      const result =
        await apiService.setChatTurnImportant(
          item.savedTurnId,
          isImportant
        );

      if (result?.status === "success") {
        setMessages((previous) =>
          previous.map((message) =>
            message.savedTurnId ===
            item.savedTurnId
              ? {
                  ...message,
                  isImportant,
                }
              : message
          )
        );
      }
    } catch (error) {
      console.error(
        "[ChatScreen] Failed to update important status:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to update message."
      );
    }
  };

  /* =========================
     DOCUMENT UPLOAD
  ========================= */

  const uploadDocument = async () => {
    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: [
            "application/pdf",
            "text/plain",
          ],
        });

      if (
        result?.canceled ||
        !result?.assets?.length
      ) {
        return;
      }

      const selectedFile = result.assets[0];
      if (selectedFile.fileSize > 10 * 1024 * 1024) {
        Alert.alert("File too large", "Chat uploads must be 10 MB or smaller.");
        return;
      }
      const extension = selectedFile.name?.split(".").pop()?.toLowerCase();
      const inferredMimeType = {
        pdf: "application/pdf",
        txt: "text/plain",
        html: "text/html",
        htm: "text/html",
      }[extension];
      const file = {
        ...selectedFile,
        mimeType: selectedFile.mimeType && selectedFile.mimeType !== "application/octet-stream"
          ? selectedFile.mimeType
          : inferredMimeType || selectedFile.mimeType,
      };
      if (!file.mimeType || !["application/pdf", "text/plain", "text/html"].includes(file.mimeType)) {
        Alert.alert("Unsupported file", "Upload a PDF, text, or HTML document.");
        return;
      }
      setCurrentSourceFile(file);

      setCurrentDocName(
        file.name || "Document"
      );

      setMode("docs");

      try {
        const fileName =
          file.name || "document";

        const fileType =
          file.mimeType ||
          "application/octet-stream";

        const formData = new FormData();

        if (Platform.OS === "web") {
          /*
           * React Native Web's FormData requires
           * a real Blob/File.
           */
          const blob = await fetch(
            file.uri
          ).then((response) =>
            response.blob()
          );

          formData.append(
            "file",
            new File(
              [blob],
              fileName,
              {
                type: fileType,
              }
            )
          );
        } else {
          formData.append("file", {
            uri: file.uri,
            type: fileType,
            name: fileName,
          });
        }

        const uploadRes =
          await apiService.uploadDocument(
            formData
          );

        if (uploadRes?.documentId) {
          setCurrentDocId(
            uploadRes.documentId
          );
        } else {
          throw new Error(
            "Document upload did not return a document ID."
          );
        }

        Alert.alert(
          "Success",
          file.name || "Document uploaded."
        );
      } catch (error) {
        console.error(
          "[ChatScreen] Document upload error:",
          error
        );

        Alert.alert(
          "Upload Error",
          error?.message ||
            "Unable to upload document."
        );
      }
    } catch (error) {
      console.error(
        "[ChatScreen] Document picker error:",
        error
      );

      Alert.alert(
        "Error",
        "Upload failed."
      );
    }
  };

  const shareCurrentDocument = async () => {
    if (!currentSourceFile || sharingDocument) return;
    if (currentSourceFile.mimeType !== "application/pdf") {
      Alert.alert("Sharing unavailable", "Only PDFs can be shared from this chat upload. You can share images and videos from the Feed page.");
      return;
    }

    setSharingDocument(true);
    try {
      const fileName = currentSourceFile.name || "research-paper.pdf";
      const fileType = currentSourceFile.mimeType || "application/pdf";
      const formData = new FormData();
      if (Platform.OS === "web") {
        const blob = await fetch(currentSourceFile.uri).then((response) => response.blob());
        formData.append("file", new File([blob], fileName, { type: fileType }));
      } else {
        formData.append("file", { uri: currentSourceFile.uri, name: fileName, type: fileType });
      }

      const upload = await apiService.post("/api/feed/upload", formData, {
        headers: Platform.OS === "web" ? {} : { "Content-Type": "multipart/form-data" },
      });
      const attachment = upload?.data?.data || upload?.data;
      if (!attachment?.attachmentUrl) throw new Error("The feed upload did not return a file URL.");

      await apiService.post("/api/feed/posts", {
        content: `Shared a document: ${fileName}`,
        postType: "abstract",
        attachmentUrl: attachment.attachmentUrl,
        attachmentName: attachment.attachmentName || fileName,
        attachmentType: attachment.attachmentType || fileType,
      });
      Alert.alert("Shared", "Your PDF is now visible in the Research Feed.");
    } catch (error) {
      console.error("[ChatScreen] Share document error:", error);
      Alert.alert("Share failed", error?.message || "Unable to share the PDF.");
    } finally {
      setSharingDocument(false);
    }
  };

  /* =========================
     RESPONSIVE LAYOUT
  ========================= */

  const maxChatWidth =
    screenSize.isDesktop
      ? 1180
      : screenSize.isTablet
      ? 880
      : "100%";

  const messageMaxWidth =
    screenSize.isDesktop
      ? "58%"
      : screenSize.isTablet
      ? "68%"
      : "82%";

  const headerPadding =
    screenSize.isDesktop
      ? 18
      : screenSize.isTablet
      ? 14
      : 8;

  /* =========================
     RENDER
  ========================= */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[
          "#080E1D",
          "#070A16",
        ]}
        style={
          StyleSheet.absoluteFillObject
        }
        pointerEvents="none"
      />

      {/* HERO GLOW */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.heroGlow,
          {
            transform: [
              {
                scale: pulseScale,
              },
            ],
            opacity: pulseOpacity,
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.heroGlowSecondary,
          {
            opacity: pulseOpacity,
          },
        ]}
      />

      <View
        style={[
          styles.chatArea,
          {
            maxWidth: maxChatWidth,
            alignSelf: "center",
          },
        ]}
      >
        {/* =========================
            HEADER
        ========================= */}

        <View
          style={[
            styles.header,
            {
              paddingHorizontal:
                headerPadding,
            },
          ]}
        >
          {/* MENU */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() =>
              navigation
                .getParent?.()
                ?.openDrawer?.()
            }
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Ionicons
              name="menu"
              size={24}
              color="#38bdf8"
            />
          </TouchableOpacity>

          {/* NEW CHAT */}
          <TouchableOpacity
            style={[
              styles.menuBtn,
              {
                marginLeft: 8,
              },
            ]}
            onPress={startNewChat}
            disabled={loading || startingNewChat}
            accessibilityRole="button"
            accessibilityLabel="New chat"
          >
            <Ionicons
              name="add"
              size={20}
              color="#38bdf8"
            />
          </TouchableOpacity>

          {/* HISTORY */}
          <TouchableOpacity
            style={[
              styles.menuBtn,
              {
                marginLeft: 6,
              },
            ]}
            onPress={loadChatHistory}
            accessibilityRole="button"
            accessibilityLabel="Chat history"
          >
            <Ionicons
              name="time-outline"
              size={20}
              color="#38bdf8"
            />
          </TouchableOpacity>

          {/* TITLE */}
          <View style={styles.titleBox}>
            <Ionicons
              name="sparkles"
              size={16}
              color="#38bdf8"
            />

            <NeonHeader title="COLI" />

            {/* LANGUAGE */}
            <TouchableOpacity
              onPress={() => {
                const languages = [
                  "auto",
                  "en",
                  "sn",
                  "es",
                  "fr",
                ];

                const currentIndex =
                  languages.indexOf(
                    selectedLanguage ||
                      "auto"
                  );

                const nextLanguage =
                  languages[
                    (currentIndex + 1) %
                      languages.length
                  ];

                setSelectedLanguage(
                  nextLanguage
                );

                if (
                  languagePreferenceKey
                ) {
                  AsyncStorage.setItem(
                    languagePreferenceKey,
                    nextLanguage
                  ).catch((error) => {
                    console.warn(
                      "[ChatScreen] Could not save language preference:",
                      error?.message
                    );
                  });
                }
              }}
              style={[
                styles.langBtn,
                styles.langBtnSpacing,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Change language"
            >
              <Text
                style={styles.langLabel}
              >
                {selectedLanguage ===
                "auto"
                  ? "Auto"
                  : (
                      selectedLanguage ||
                      "auto"
                    ).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================
            MESSAGES
        ========================= */}

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBlock,

                item.role === "user"
                  ? styles.userBlock
                  : styles.assistantBlock,

                {
                  alignSelf:
                    item.role === "user"
                      ? "flex-end"
                      : "flex-start",

                  maxWidth:
                    messageMaxWidth,
                },
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.isError &&
                    styles.errorMessageText,
                ]}
              >
                {item.content}
              </Text>

              {/* DOCUMENT TAG */}
              {item.documentName ? (
                <Text
                  style={styles.docTag}
                >
                  {item.documentName}
                </Text>
              ) : null}

              {/* MESSAGE ACTIONS */}
              {item.id !== "welcome" ? (
                <View
                  style={
                    styles.messageActions
                  }
                >
                  {/* COPY */}
                  <TouchableOpacity
                    onPress={() =>
                      copyMessage(
                        item.content
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Copy message"
                  >
                    <Ionicons
                      name="copy-outline"
                      size={16}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>

                  {/* EDIT USER MESSAGE */}
                  {item.role ===
                  "user" ? (
                    <TouchableOpacity
                      onPress={() =>
                        setInput(
                          item.content
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Edit prompt"
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                  ) : null}

                  {/* IMPORTANT */}
                  {item.savedTurnId ? (
                    <TouchableOpacity
                      onPress={() =>
                        toggleImportant(
                          item
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={
                        item.isImportant
                          ? "Remove important marker"
                          : "Mark important"
                      }
                    >
                      <Ionicons
                        name={
                          item.isImportant
                            ? "star"
                            : "star-outline"
                        }
                        size={16}
                        color={
                          item.isImportant
                            ? "#fbbf24"
                            : "#94a3b8"
                        }
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}
          keyboardShouldPersistTaps="always"
          ListFooterComponent={
            loading ? (
              <TypingIndicator />
            ) : null
          }
          contentContainerStyle={
            styles.list
          }
        />
      </View>

      {/* =========================
          CHAT INPUT
      ========================= */}

      {currentDocId && currentSourceFile?.mimeType === "application/pdf" ? (
        <TouchableOpacity
          style={styles.shareDocumentButton}
          onPress={shareCurrentDocument}
          disabled={sharingDocument}
          accessibilityRole="button"
          accessibilityLabel="Share uploaded PDF to Research Feed"
        >
          {sharingDocument ? <ActivityIndicator size="small" color="#06111f" /> : <Ionicons name="share-social-outline" size={18} color="#06111f" />}
          <Text style={styles.shareDocumentText}>{sharingDocument ? "Sharing PDF..." : "Share PDF to Research Feed"}</Text>
        </TouchableOpacity>
      ) : null}

      <ChatInput
        value={input}
        onChangeText={setInput}
        onSend={sendMessage}
        onUploadPress={
          uploadDocument
        }
        mode={mode}
        setMode={setMode}
        isLoading={loading}
      />

      {/* =========================
          CHAT HISTORY MODAL
      ========================= */}

      <Modal
        visible={showHistory}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowHistory(false)
        }
      >
        <View
          style={
            styles.historyOverlay
          }
        >
          <View
            style={
              styles.historySheet
            }
          >
            {/* HISTORY HEADER */}
            <View
              style={
                styles.historyHeader
              }
            >
              <Text
                style={
                  styles.historyTitle
                }
              >
                Your chats
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowHistory(false)
                }
                accessibilityRole="button"
                accessibilityLabel="Close chat history"
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#e2e8f0"
                />
              </TouchableOpacity>
            </View>

            {/* HISTORY CONTENT */}
            {loadingHistory ? (
              <ActivityIndicator
                color="#38bdf8"
              />
            ) : (
              <FlatList
                data={threads}
                keyExtractor={(item) =>
                  String(item.id)
                }
                ListEmptyComponent={
                  <Text
                    style={
                      styles.emptyHistory
                    }
                  >
                    Saved conversations
                    will appear here.
                  </Text>
                }
                renderItem={({
                  item,
                }) => (
                  <TouchableOpacity
                    style={
                      styles.threadRow
                    }
                    onPress={() =>
                      resumeThread(
                        item
                      )
                    }
                  >
                    <View
                      style={
                        styles.threadCopy
                      }
                    >
                      <Text
                        style={
                          styles.threadTitle
                        }
                        numberOfLines={2}
                      >
                        {item.title ||
                          "New chat"}
                      </Text>

                      <Text
                        style={
                          styles.threadMeta
                        }
                      >
                        {item.turns || 0}{" "}
                        turns ·{" "}
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleDateString()
                          : ""}
                      </Text>
                    </View>

                    {item.isImportant ? (
                      <Ionicons
                        name="star"
                        size={16}
                        color="#fbbf24"
                      />
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },

  chatArea: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 10,
  },

  heroGlow: {
    position: "absolute",
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor:
      "rgba(56,189,248,0.06)",
    top: -80,
    left: -40,
  },

  heroGlowSecondary: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor:
      "rgba(139,92,246,0.04)",
    top: -40,
    right: -20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor:
      "rgba(255,255,255,0.04)",
    marginBottom: 12,
  },

  menuBtn: {
    padding: 12,
    borderRadius: 12,
    backgroundColor:
      "rgba(255,255,255,0.03)",

    ...Platform.select({
      web: {
        boxShadow:
          "0 6px 12px rgba(0,0,0,0.18)",
      },

      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 6,
        },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },

  titleBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    color: "#38bdf8",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginLeft: 8,
  },

  langBtnSpacing: {
    marginLeft: 12,
  },

  list: {
    paddingBottom: 120,
    maxWidth: 860,
    alignSelf: "center",
    width: "100%",
  },

  langBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor:
      "rgba(56,189,248,0.12)",
  },

  langLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "700",
  },

  messageBlock: {
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    maxWidth: "85%",

    ...Platform.select({
      web: {
        boxShadow:
          "0 6px 10px rgba(0,0,0,0.12)",
      },

      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 6,
        },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 2,
      },
    }),
  },

  messageActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 10,
  },
  shareDocumentButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: "#38bdf8",
  },
  shareDocumentText: {
    color: "#06111f",
    fontSize: 13,
    fontWeight: "700",
  },

  historyOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor:
      "rgba(0,0,0,0.55)",
  },

  historySheet: {
    width: "100%",
    maxHeight: "78%",
    alignSelf: "center",
    maxWidth: 720,
    padding: 20,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#0b1425",
    borderWidth: 1,
    borderColor:
      "rgba(56,189,248,0.25)",
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  historyTitle: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "800",
  },

  emptyHistory: {
    color: "#94a3b8",
    textAlign: "center",
    paddingVertical: 28,
  },

  threadRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor:
      "rgba(148,163,184,0.12)",
  },

  threadCopy: {
    flex: 1,
  },

  threadTitle: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "600",
  },

  threadMeta: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },

  assistantBlock: {
    backgroundColor:
      "rgba(255,255,255,0.03)",
  },

  userBlock: {
    backgroundColor:
      "rgba(56,189,248,0.06)",
  },

  messageText: {
    color: "#E6F2FF",
    fontSize: 15,
    lineHeight: 20,
  },

  errorMessageText: {
    color: "#fca5a5",
  },

  docTag: {
    marginTop: 8,
    color: "#9ca3af",
    fontSize: 12,
  },
});
