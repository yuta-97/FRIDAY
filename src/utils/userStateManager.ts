interface UserState {
  userId: string;
  chatId: number;
  currentCommand: string;
  step: number;
  data: Record<string, any>;
  timestamp: number;
}

class UserStateManager {
  private states = new Map<string, UserState>();
  private readonly STATE_TIMEOUT = 5 * 60 * 1000; // 5분 타임아웃

  setUserState(
    userId: string,
    chatId: number,
    command: string,
    step: number = 0,
    data: Record<string, any> = {}
  ): void {
    const key = `${userId}_${chatId}`;
    this.states.set(key, {
      userId,
      chatId,
      currentCommand: command,
      step,
      data,
      timestamp: Date.now()
    });
  }

  getUserState(userId: string, chatId: number): UserState | null {
    const key = `${userId}_${chatId}`;
    const state = this.states.get(key);

    if (!state) return null;

    // 타임아웃 체크
    if (Date.now() - state.timestamp > this.STATE_TIMEOUT) {
      this.clearUserState(userId, chatId);
      return null;
    }

    return state;
  }

  updateUserState(
    userId: string,
    chatId: number,
    updates: Partial<UserState>
  ): void {
    const key = `${userId}_${chatId}`;
    const currentState = this.states.get(key);

    if (currentState) {
      this.states.set(key, {
        ...currentState,
        ...updates,
        timestamp: Date.now()
      });
    }
  }

  clearUserState(userId: string, chatId: number): void {
    const key = `${userId}_${chatId}`;
    this.states.delete(key);
  }

  // 주기적으로 만료된 상태 정리
  cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [key, state] of this.states.entries()) {
      if (now - state.timestamp > this.STATE_TIMEOUT) {
        this.states.delete(key);
      }
    }
  }
}

export const userStateManager = new UserStateManager();

// 주기적으로 만료된 상태 정리 (1분마다)
setInterval(() => {
  userStateManager.cleanupExpiredStates();
}, 60 * 1000);
