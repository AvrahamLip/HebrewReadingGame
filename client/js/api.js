import { API_URL } from './config.js';
import { state } from './state.js';
import { shuffleArray } from './utils.js';

export async function fetchWords(level) {
    try {
        const res = await fetch(`${API_URL}/api/words/${level}`);
        const data = await res.json();
        if (data.message === 'success') {
            let words = data.data;
            if (words.length === 0) {
                alert(`לא נמצאו מילים ברמה ${level}.`);
                return [];
            }
            state.words = shuffleArray(words);
            return state.words;
        } else {
            alert('שגיאה בטעינת המילים');
            return [];
        }
    } catch (e) {
        console.error(e);
        alert('לא ניתן להתחבר לשרת. וודא שהשרת רץ.');
        return [];
    }
}
