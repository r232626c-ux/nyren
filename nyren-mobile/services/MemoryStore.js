class MemoryStore {
  constructor() {
    this.memory = {
      lastCommand: null,
      userName: null,
      frequentlyUsedApps: [],
      recentQueries: [],
      preferences: {},
      context: [],
    };
    this.maxContextLength = 10;
    this.maxRecentQueries = 5;
  }

  // Add a command to memory
  addCommand(command) {
    this.memory.lastCommand = command;
    this.memory.context.push(command);
    if (this.memory.context.length > this.maxContextLength) {
      this.memory.context.shift();
    }
  }

  // Add a query to recent queries
  addQuery(query) {
    this.memory.recentQueries.push(query);
    if (this.memory.recentQueries.length > this.maxRecentQueries) {
      this.memory.recentQueries.shift();
    }
  }

  // Set user name
  setUserName(name) {
    this.memory.userName = name;
  }

  // Add frequently used app
  addFrequentlyUsedApp(appName) {
    if (!this.memory.frequentlyUsedApps.includes(appName)) {
      this.memory.frequentlyUsedApps.push(appName);
      if (this.memory.frequentlyUsedApps.length > 10) {
        this.memory.frequentlyUsedApps.shift();
      }
    }
  }

  // Get context for AI
  getContext() {
    return {
      lastCommand: this.memory.lastCommand,
      userName: this.memory.userName,
      frequentlyUsedApps: this.memory.frequentlyUsedApps,
      recentQueries: this.memory.recentQueries,
      context: this.memory.context,
    };
  }

  // Clear memory
  clear() {
    this.memory = {
      lastCommand: null,
      userName: null,
      frequentlyUsedApps: [],
      recentQueries: [],
      preferences: {},
      context: [],
    };
  }
}

export default new MemoryStore();