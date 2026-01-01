import { state } from './gamestate.js';

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function stripNikud(str) {
    return str.replace(/[\u0591-\u05C7]/g, '').trim();
}

export function logToDebug(msg) {
    const log = document.getElementById('debug-log');
    if (log) {
        try {
            log.innerHTML += `<div>${new Date().toLocaleTimeString()} - ${msg}</div>`;
            if (log.childElementCount > 5) log.removeChild(log.firstChild);
        } catch (e) { }
    }
}

export function renderAsset(element, imagePath, fallbackEmoji) {
    element.innerHTML = '';
    element.className = 'emoji';

    if (imagePath && (imagePath.startsWith('/') || imagePath.startsWith('http'))) {
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = fallbackEmoji || "Image";
        img.className = "game-asset-image";

        img.onerror = () => {
            console.warn(`Failed to load image: ${imagePath}. Falling back to: ${fallbackEmoji}`);
            element.textContent = fallbackEmoji;
            element.classList.remove('has-image');
        };

        element.appendChild(img);
        element.classList.add('has-image');
    } else {
        element.textContent = fallbackEmoji;
        element.classList.remove('has-image');
    }
}

export function speakWord(text, onEnd = null) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = state.currentLanguage === 'en' ? 'en-US' : 'he-IL';
        utterance.rate = 0.7;
        utterance.volume = 1.0;
        utterance.pitch = 1.0;

        let hasCalledEnd = false;
        const safeOnEnd = () => {
            if (hasCalledEnd) return;
            hasCalledEnd = true;
            if (onEnd) onEnd();
        };

        utterance.onend = safeOnEnd;
        utterance.onerror = safeOnEnd;
        setTimeout(safeOnEnd, 2000);

        window.speechSynthesis.speak(utterance);
    } else {
        if (onEnd) onEnd();
    }
}

export function triggerConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD93D', '#6BCB77', '#4D96FF', '#FF6B6B']
    });
}

export function goHome() {
    state.userIntentionalStop = true;
    if (state.recognition) try { state.recognition.abort(); } catch (e) { }
    // Stop speech synthesis too
    window.speechSynthesis.cancel();
    location.reload();
}

export function playSound(type) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'success') {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = freq;
            osc2.type = 'triangle';
            gain2.gain.setValueAtTime(0.1, now + i * 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
            osc2.start(now + i * 0.1);
            osc2.stop(now + i * 0.1 + 0.3);
        });
    }
}
