import EventEmitter from "eventemitter3";

export const STATES = {
  IDLE: "IDLE",
  LISTENING: "LISTENING",
  PROCESSING: "PROCESSING",
  SPEAKING: "SPEAKING",
  INTERRUPTING: "INTERRUPTING",
};

const TRANSITIONS = {
  IDLE: [STATES.LISTENING],
  LISTENING: [STATES.PROCESSING, STATES.IDLE],
  PROCESSING: [STATES.SPEAKING, STATES.LISTENING],
  SPEAKING: [STATES.INTERRUPTING, STATES.LISTENING],
  INTERRUPTING: [STATES.LISTENING],
};

class StateManager extends EventEmitter {
  constructor() {
    super();
    this.state = STATES.IDLE;
  }

  getState() {
    return this.state;
  }

  transitionTo(nextState) {
    if (this.state === nextState) {
      return true;
    }

    const allowed = TRANSITIONS[this.state] || [];
    if (!allowed.includes(nextState)) {
      console.warn(
        "[StateManager] invalid transition",
        this.state,
        "→",
        nextState
      );
      return false;
    }

    this.state = nextState;
    this.emit("stateChanged", nextState);
    return true;
  }

  is(state) {
    return this.state === state;
  }
}

export default StateManager;
