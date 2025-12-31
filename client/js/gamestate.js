import { UI_TEXT } from './config.js';

export const state = {
    currentLevel: 1,
    currentLanguage: 'he',
    words: [],
    currentIndex: 0,
    gameRound: 1,
    score: 0,
    gameMode: 'read', // 'read', 'match', 'memory'
    // Speech
    isListening: false,
    userIntentionalStop: false,
    lastError: '',
    recognition: null,
    // Memory
    memoryCards: [],
    flippedCards: [],
    matchedPairs: 0,
    lockBoard: false
};

// State Getters/Setters Helpers
export function setLanguage(lang) {
    state.currentLanguage = lang;
    if (lang === 'en') {
        document.documentElement.dir = "ltr";
        document.documentElement.lang = "en";
    } else {
        document.documentElement.dir = "rtl";
        document.documentElement.lang = "he";
    }
}

export function getText(key) {
    return UI_TEXT[state.currentLanguage][key] || key;
}

export function resetState() {
    state.score = 0;
    state.currentIndex = 0;
    state.gameRound = 1;
    state.userIntentionalStop = false;
}
