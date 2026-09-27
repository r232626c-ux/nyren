<View style={styles.header}>

  {/* LEFT MENU */}
  <TouchableOpacity onPress={() => setSidebarOpen(true)}>
    <Ionicons name="menu" size={24} color="#38bdf8" />
  </TouchableOpacity>

  {/* CENTER TITLE */}
  <Text style={styles.title}>COLI</Text>

  {/* TOP RIGHT MODE TOGGLE */}
  <View style={styles.modeCorner}>
    <TouchableOpacity onPress={() => setMode("chat")}>
      <Ionicons name="chatbubble" size={18} color={mode === "chat" ? "#38bdf8" : "#64748b"} />
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setMode("search")}>
      <Ionicons name="search" size={18} color={mode === "search" ? "#38bdf8" : "#64748b"} />
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setMode("reason")}>
      <Ionicons name="bulb" size={18} color={mode === "reason" ? "#facc15" : "#64748b"} />
    </TouchableOpacity>
  </View>

</View>