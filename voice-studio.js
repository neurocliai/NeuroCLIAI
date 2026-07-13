// voice-studio.js — Full Voice Conversation Loop

// ─── PERSONAS (Web-Search Aware) ──────────────────────────────────────────
const personas = [
    {
        id: 'airline',
        icon: 'ph-airplane-tilt',
        name: 'Airline Booking Agent',
        color: '#0ea5e9',
        description: 'Search live flights, prices & schedules',
        searchKeywords: ['flight','fly','flights','ticket','book','travel','airline','airport','route','destination','depart','arrive','visa','baggage','price'],
        prompt: `You are a professional airline booking agent for NeuroCLI Airways.
You have access to real-time flight data from the web.
When a user asks about flights, ALWAYS:
1. If you don't have the date yet, politely ask for it first.
2. Once you have origin, destination, and date, search the web for real flight options.
3. Present 2-3 realistic flight options with airline names, departure times, and approximate prices.
4. Ask if they want to proceed with any option.
For other questions answer professionally. Keep responses concise for voice (max 3 sentences).`
    },
    {
        id: 'restaurant',
        icon: 'ph-pizza',
        name: 'Restaurant Host',
        color: '#f59e0b',
        description: 'Find restaurants, menus & book tables',
        searchKeywords: ['restaurant','food','eat','menu','table','reserve','booking','cuisine','dine','order','delivery','near','open','close','hours','rating'],
        prompt: `You are a friendly restaurant concierge for NeuroCLI Dining.
You have access to real-time restaurant data.
When a user asks to find or book a restaurant:
1. If location or cuisine is missing, ask for it.
2. Search the web for real, highly rated restaurants matching their criteria.
3. Suggest 2-3 real restaurants with their name, cuisine, rating, and approximate price range.
4. Offer to help with reservations.
Keep responses concise for voice (max 3 sentences).`
    },
    {
        id: 'medical',
        icon: 'ph-first-aid',
        name: 'Medical Receptionist',
        color: '#10b981',
        description: 'Find doctors, clinics & book appointments',
        searchKeywords: ['doctor','clinic','hospital','appointment','specialist','symptom','treatment','medicine','health','pharmacy','emergency','near'],
        prompt: `You are a calm and empathetic medical receptionist for NeuroCLI Health.
You have access to real-time healthcare provider data.
When a user asks about doctors, clinics, or hospitals:
1. Ask for their location and the type of specialist if not provided.
2. Search the web for real clinics or hospitals in their area.
3. Present 2-3 real options with name, address, contact, and available slots if found.
4. Remind them to call ahead to confirm.
Keep responses concise for voice (max 3 sentences).`
    },
    {
        id: 'banking',
        icon: 'ph-bank',
        name: 'Banking Assistant',
        color: '#8b5cf6',
        description: 'Live rates, branch locations & account help',
        searchKeywords: ['rate','interest','exchange','currency','loan','mortgage','invest','branch','atm','forex','stock','crypto','price','gold','dollar','euro'],
        prompt: `You are a professional banking assistant for NeuroCLI Bank.
You have access to real-time financial data.
When a user asks about exchange rates, interest rates, or financial news:
1. Search the web to get the most current data.
2. Present the real, live information clearly.
3. For account or service questions, answer helpfully.
4. Always recommend consulting a financial advisor for investments.
Keep responses concise for voice (max 3 sentences).`
    },
    {
        id: 'it_support',
        icon: 'ph-desktop',
        name: 'IT Support Tech',
        color: '#06b6d4',
        description: 'Live troubleshooting with web solutions',
        searchKeywords: ['error','fix','bug','crash','update','driver','install','download','windows','mac','linux','network','wifi','slow','virus','hack','code'],
        prompt: `You are an expert IT support technician for NeuroCLI Tech.
You have access to real-time tech documentation and solutions.
When a user reports an error or technical issue:
1. Ask for the exact error message or device details if not provided.
2. Search the web for the latest, verified solutions for their specific problem.
3. Provide step-by-step troubleshooting instructions from real sources.
4. Ask if the solution worked.
Keep responses concise for voice (max 3 sentences).`
    },
    {
        id: 'sales',
        icon: 'ph-trend-up',
        name: 'Sales Representative',
        color: '#f43f5e',
        description: 'Live product prices, reviews & comparisons',
        searchKeywords: ['price','buy','product','review','compare','cheap','best','deal','offer','sale','discount','amazon','flipkart','brand','specs','feature'],
        prompt: `You are an energetic sales representative for NeuroCLI Store.
You have access to real-time product data from the web.
When a user asks about a product:
1. Search the web for the latest prices, reviews, and availability.
2. Present real pricing from 2-3 major retailers with a brief comparison.
3. Highlight the best deal and why it's worth it.
4. Ask if they'd like to know more or proceed.
Keep responses concise for voice (max 3 sentences).`
    },
];

// ─── SEARCH DETECTION ─────────────────────────────────────────────────────
function needsWebSearch(userText, persona) {
    const lower = userText.toLowerCase();
    return persona.searchKeywords && persona.searchKeywords.some(kw => lower.includes(kw));
}


// ─── LANGUAGE LIST ────────────────────────────────────────────────────────
// id = gTTS/SpeechRecognition lang code, sr = SpeechRecognition lang, name = display
const aiVoices = [
    { id: 'en',    sr: 'en-US',  name: '🇺🇸 English (US)' },
    { id: 'en-uk', sr: 'en-GB',  name: '🇬🇧 English (UK)' },
    { id: 'en-au', sr: 'en-AU',  name: '🇦🇺 English (AU)' },
    { id: 'en-in', sr: 'en-IN',  name: '🇮🇳 English (IN)' },
    { id: 'hi',    sr: 'hi-IN',  name: '🇮🇳 Hindi' },
    { id: 'te',    sr: 'te-IN',  name: '🇮🇳 Telugu' },
    { id: 'ta',    sr: 'ta-IN',  name: '🇮🇳 Tamil' },
    { id: 'mr',    sr: 'mr-IN',  name: '🇮🇳 Marathi' },
    { id: 'gu',    sr: 'gu-IN',  name: '🇮🇳 Gujarati' },
    { id: 'ml',    sr: 'ml-IN',  name: '🇮🇳 Malayalam' },
    { id: 'bn',    sr: 'bn-BD',  name: '🇧🇩 Bengali' },
    { id: 'pa',    sr: 'pa-IN',  name: '🇮🇳 Punjabi' },
    { id: 'ur',    sr: 'ur-PK',  name: '🇵🇰 Urdu' },
    { id: 'fr',    sr: 'fr-FR',  name: '🇫🇷 French' },
    { id: 'es',    sr: 'es-ES',  name: '🇪🇸 Spanish' },
    { id: 'de',    sr: 'de-DE',  name: '🇩🇪 German' },
    { id: 'it',    sr: 'it-IT',  name: '🇮🇹 Italian' },
    { id: 'pt',    sr: 'pt-BR',  name: '🇧🇷 Portuguese' },
    { id: 'nl',    sr: 'nl-NL',  name: '🇳🇱 Dutch' },
    { id: 'pl',    sr: 'pl-PL',  name: '🇵🇱 Polish' },
    { id: 'ru',    sr: 'ru-RU',  name: '🇷🇺 Russian' },
    { id: 'ja',    sr: 'ja-JP',  name: '🇯🇵 Japanese' },
    { id: 'ko',    sr: 'ko-KR',  name: '🇰🇷 Korean' },
    { id: 'zh-CN', sr: 'zh-CN',  name: '🇨🇳 Chinese (Mandarin)' },
    { id: 'zh-TW', sr: 'zh-TW',  name: '🇹🇼 Chinese (Taiwan)' },
    { id: 'ar',    sr: 'ar-SA',  name: '🇸🇦 Arabic' },
    { id: 'tr',    sr: 'tr-TR',  name: '🇹🇷 Turkish' },
    { id: 'sv',    sr: 'sv-SE',  name: '🇸🇪 Swedish' },
    { id: 'da',    sr: 'da-DK',  name: '🇩🇰 Danish' },
    { id: 'fi',    sr: 'fi-FI',  name: '🇫🇮 Finnish' },
    { id: 'no',    sr: 'nb-NO',  name: '🇳🇴 Norwegian' },
    { id: 'el',    sr: 'el-GR',  name: '🇬🇷 Greek' },
    { id: 'cs',    sr: 'cs-CZ',  name: '🇨🇿 Czech' },
    { id: 'ro',    sr: 'ro-RO',  name: '🇷🇴 Romanian' },
    { id: 'hu',    sr: 'hu-HU',  name: '🇭🇺 Hungarian' },
    { id: 'uk',    sr: 'uk-UA',  name: '🇺🇦 Ukrainian' },
    { id: 'id',    sr: 'id-ID',  name: '🇮🇩 Indonesian' },
    { id: 'ms',    sr: 'ms-MY',  name: '🇲🇾 Malay' },
    { id: 'th',    sr: 'th-TH',  name: '🇹🇭 Thai' },
    { id: 'vi',    sr: 'vi-VN',  name: '🇻🇳 Vietnamese' },
    { id: 'af',    sr: 'af-ZA',  name: '🇿🇦 Afrikaans' },
    { id: 'sw',    sr: 'sw-KE',  name: '🇰🇪 Swahili' },
];

// ─── POPULATE UI ──────────────────────────────────────────────────────────
let activePersona = null;
let conversationHistory = []; // Multi-turn history per session
let emailTranscript = [];     // Stores {role, text} for email
let callStartTime   = null;   // Track call duration

// Personas grid
const grid = document.getElementById('personas-grid');
personas.forEach(p => {
    const card = document.createElement('div');
    card.className = 'persona-card';
    card.style.setProperty('--persona-color', p.color || '#7c3aed');
    card.innerHTML = `
        <div class="persona-icon-wrap"><i class="ph ${p.icon} persona-icon"></i></div>
        <h3>${p.name}</h3>
        <p>${p.description || 'Click to start a live voice call.'}</p>
        <span class="start-badge">Start Call →</span>
    `;
    card.addEventListener('click', () => openSimulator(p));
    grid.appendChild(card);
});

// Voice/language select
const voiceSelect = document.getElementById('voice-select');
aiVoices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.dataset.sr = v.sr;
    opt.innerText = v.name;
    voiceSelect.appendChild(opt);
});

// ─── SIMULATOR OPEN/CLOSE ─────────────────────────────────────────────────
const simulatorPanel  = document.getElementById('simulator-panel');
const activePersonaName = document.getElementById('active-persona-name');
const closeSimulatorBtn = document.getElementById('close-simulator');

function openSimulator(persona) {
    activePersona = persona;
    activePersonaName.innerText = persona.name;
    conversationHistory = []; // Reset history for new call
    emailTranscript     = []; // Reset email transcript
    callStartTime       = Date.now();
    simulatorPanel.classList.add('open');
    const liveDot = document.getElementById('live-dot');
    if (liveDot) liveDot.style.display = 'inline-block';
    resetConversationLog();
    stopListening();
}

closeSimulatorBtn.addEventListener('click', () => {
    simulatorPanel.classList.remove('open');
    const liveDot = document.getElementById('live-dot');
    if (liveDot) liveDot.style.display = 'none';
    stopListening();
    window.speechSynthesis.cancel();
    // Auto-send call summary email if there was a conversation
    if (emailTranscript.length > 0) {
        sendCallSummaryEmail();
    }
});

// ─── SEND CALL SUMMARY EMAIL (FRONTEND) ──────────────────────────────────
async function sendCallSummaryEmail() {
    if (!activePersona) return;

    // Calculate call duration
    const durationMs  = callStartTime ? Date.now() - callStartTime : 0;
    const durationMin = Math.floor(durationMs / 60000);
    const durationSec = Math.floor((durationMs % 60000) / 1000);
    const durationStr = durationMin > 0 ? `${durationMin}m ${durationSec}s` : `${durationSec}s`;

    let body = `Call with ${activePersona.name}\nDuration: ${durationStr}\n\nTranscript:\n`;
    emailTranscript.forEach(msg => {
        body += `${msg.role === 'user' ? 'You' : activePersona.name}: ${msg.text}\n\n`;
    });

    const subject = encodeURIComponent(`NeuroCLI Call Summary - ${activePersona.name}`);
    const encodedBody = encodeURIComponent(body);
    
    // Open default mail app instead of using backend server SMTP
    window.location.href = `mailto:?subject=${subject}&body=${encodedBody}`;
    showEmailToast("📧 Opening your email client...");
}

function showEmailToast(message) {
    let toast = document.getElementById('email-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'email-toast';
        toast.style.cssText = `
            position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
            background:linear-gradient(135deg,#7c3aed,#4f46e5);
            color:white; padding:10px 22px; border-radius:30px;
            font-size:0.85rem; font-weight:500;
            box-shadow:0 8px 30px rgba(124,58,237,0.4);
            z-index:9999; opacity:0; transition:opacity 0.3s;
            white-space:nowrap;
        `;
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 4000);
}

function resetConversationLog() {
    const log = document.getElementById('conversation-log');
    log.innerHTML = '<p class="conv-hint">🎙️ Press the mic button and speak. The AI will reply in your chosen language.</p>';
}

// ─── CONVERSATION LOG HELPERS ─────────────────────────────────────────────
function addUserBubble(text) {
    const log = document.getElementById('conversation-log');
    const el = document.createElement('div');
    el.className = 'conv-bubble user-bubble';
    el.innerHTML = `
        <div class="bubble-avatar"><i class="ph-fill ph-user"></i></div>
        <div class="bubble-content"><div class="bubble-text">${text}</div></div>
    `;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
}

function addAIBubble(text, voiceNote) {
    const log = document.getElementById('conversation-log');
    const el = document.createElement('div');
    el.className = 'conv-bubble ai-bubble';
    const textDiv = document.createElement('div');
    textDiv.className = 'bubble-text';
    textDiv.innerText = text;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'bubble-content';
    contentDiv.appendChild(textDiv);
    if (voiceNote) contentDiv.appendChild(voiceNote);
    el.innerHTML = `<div class="bubble-avatar"><i class="ph-fill ph-robot"></i></div>`;
    el.appendChild(contentDiv);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
}

// ─── STATUS BAR ───────────────────────────────────────────────────────────
const aiStatusBar = document.getElementById('ai-status');
function setStatus(icon, text, colorClass) {
    aiStatusBar.innerHTML = `<i class="ph ${icon}"></i> ${text}`;
    aiStatusBar.className = 'ai-status-bar' + (colorClass ? ' ' + colorClass : '');
    const hint = document.getElementById('mic-hint');
    if (hint) hint.innerText = colorClass === 'listening' ? 'tap to stop' : (colorClass === 'ready' ? 'tap to speak again' : 'please wait...');
}

// ─── AUDIO ELEMENT ────────────────────────────────────────────────────────
const ttsAudio = document.getElementById('tts-audio');

// ─── MIC BUTTON & SPEECH RECOGNITION ─────────────────────────────────────
const micBtn  = document.getElementById('mic-btn');
const micIcon = document.getElementById('mic-icon');
const micPulse = document.getElementById('mic-pulse');

let recognition = null;
let isListening  = false;
let isProcessing = false; // true while waiting for AI / TTS

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    micBtn.disabled = true;
    setStatus('ph-warning', 'Your browser does not support voice recording. Use Chrome.');
}

micBtn.addEventListener('click', () => {
    if (isProcessing) return; // ignore clicks while AI is working
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

function startListening() {
    if (!activePersona) return;
    isListening = true;
    micIcon.classList.replace('ph-microphone', 'ph-stop-circle');
    micPulse.classList.add('active');
    micBtn.classList.add('recording');
    setStatus('ph-record', 'Listening… speak now', 'listening');

    const selectedOption = voiceSelect.options[voiceSelect.selectedIndex];
    const srLang = selectedOption ? selectedOption.dataset.sr : 'en-US';

    recognition = new SpeechRecognition();
    recognition.lang = srLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        stopListening();
        handleUserSpeech(transcript);
    };

    recognition.onerror = (event) => {
        stopListening();
        setStatus('ph-warning', `Mic error: ${event.error}. Tap mic to try again.`);
    };

    recognition.onend = () => {
        if (isListening) stopListening(); // ended without result
    };

    recognition.start();
}

function stopListening() {
    isListening = false;
    micIcon.classList.replace('ph-stop-circle', 'ph-microphone');
    micPulse.classList.remove('active');
    micBtn.classList.remove('recording');
    setStatus('ph-microphone', 'Tap mic to speak', '');
    const hint = document.getElementById('mic-hint');
    if (hint) hint.innerText = 'tap to speak';
    if (recognition) {
        try { recognition.stop(); } catch(e) {}
        recognition = null;
    }
}

// ─── MAIN CONVERSATION HANDLER ────────────────────────────────────────────
async function handleUserSpeech(userText) {
    if (!userText.trim()) {
        setStatus('ph-microphone', 'Tap mic to speak');
        return;
    }

    isProcessing = true;
    micBtn.disabled = true;
    addUserBubble(userText);
    emailTranscript.push({ role: 'user', text: userText }); // Track for email

    const selectedOption = voiceSelect.options[voiceSelect.selectedIndex];
    const ttsLang  = selectedOption ? selectedOption.value : 'en';

    // Safe emoji strip that works in all browsers
    let langName = 'English';
    try {
        langName = (selectedOption?.innerText || 'English')
            .replace(/[\uD83C][\uDDE0-\uDDFF][\uD83C][\uDDE0-\uDDFF]/g, '')
            .replace(/[^\x00-\x7F\u0900-\u097F\u0C00-\u0C7F\u0C80-\u0CFF\u0B80-\u0BFF\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F]/g, '')
            .trim() || 'English';
    } catch(e) { langName = 'English'; }

    // Detect if this message needs real-time web search
    const useWebSearch = needsWebSearch(userText, activePersona);

    if (useWebSearch) {
        setStatus('ph-globe ph-spin', 'Searching the web…', 'searching');
    } else {
        setStatus('ph-spinner ph-spin', 'AI is thinking…', 'active');
    }

    // Step 1: AI text response with timeout + automatic fallback
    let aiText;
    const systemPrompt = `${activePersona.prompt}\nIMPORTANT: Reply ONLY in ${langName} language. Keep response under 3 sentences, suitable for voice output. Do NOT use markdown, asterisks, or bullet points — plain speech only.`;

    const tryFetch = async (model) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000); // 18s timeout
        try {
            const resp = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...conversationHistory
                    ],
                    model
                }),
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const text = (await resp.text()).trim();
            if (!text) throw new Error('Empty response');
            return text;
        } catch(e) {
            clearTimeout(timeout);
            throw e;
        }
    };

    try {
        // Append user message to history before fetching
        conversationHistory.push({ role: 'user', content: userText });

        if (useWebSearch) {
            try {
                // Try searchgpt first for real-time data
                aiText = await tryFetch('searchgpt');
            } catch(e) {
                // Fallback to openai if searchgpt fails/times out
                console.warn('[Voice] searchgpt failed, falling back to openai:', e.message);
                setStatus('ph-spinner ph-spin', 'AI is thinking…', 'active');
                aiText = await tryFetch('openai');
            }
        } else {
            aiText = await tryFetch('openai');
        }

        // Strip any markdown that slipped through (asterisks, hashes, etc.)
        aiText = aiText
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/#{1,6}\s/g, '')
            .replace(/\n{2,}/g, ' ')
            .trim();

        // Save to history for multi-turn context
        conversationHistory.push({ role: 'assistant', content: aiText });
        emailTranscript.push({ role: 'ai', text: aiText });

        // Keep history manageable (last 12 turns = 24 messages)
        if (conversationHistory.length > 24) conversationHistory.splice(0, 2);

    } catch(e) {
        console.error('[Voice] AI fetch failed completely:', e);
        // Don't interrupt the call — just show a soft warning and re-enable mic
        setStatus('ph-warning-circle', 'Could not reach AI. Tap mic to try again.', '');
        conversationHistory.pop(); // Remove the failed user message
        isProcessing = false;
        micBtn.disabled = false;
        return;
    }


    // Step 2 & 3: Frontend Native TTS (No backend API required!)
    setStatus('ph-speaker-high', 'Generating voice…', 'active');
    
    // Build dummy player for the chat history
    const playerEl = buildVoiceNotePlayerNative(aiText, ttsLang);
    addAIBubble(aiText, playerEl);

    // Stop any existing speech before speaking the new one
    window.speechSynthesis.cancel();

    // Generate Audio natively on the user's OS
    const utterance = new SpeechSynthesisUtterance(aiText);
    utterance.lang = ttsLang;
    
    utterance.onstart = () => {
        setStatus('ph-speaker-simple-high', 'Playing response…', 'ready');
    };

    utterance.onend = () => {
        isProcessing = false;
        micBtn.disabled = false;
        setStatus('ph-microphone', 'Tap mic to respond', '');
        const hint = document.getElementById('mic-hint');
        if (hint) hint.innerText = 'tap to speak';
        
        // Auto prompt next message
        setTimeout(() => {
            if (!isProcessing && simulatorPanel.classList.contains('open')) {
                startListening();
            }
        }, 800);
    };

    utterance.onerror = () => {
        setStatus('ph-warning', 'Voice generation failed. Tap mic to retry.');
        isProcessing = false;
        micBtn.disabled = false;
    };

    window.speechSynthesis.speak(utterance);
}

// ─── MINI WHATSAPP PLAYER FOR NATIVE TTS BUBBLES ──────────────────────────
function buildVoiceNotePlayerNative(text, lang) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wa-voice-note';

    const playBtn = document.createElement('button');
    playBtn.className = 'wa-play-btn';
    playBtn.innerHTML = '<i class="ph-fill ph-play"></i>';

    const waveWrap = document.createElement('div');
    waveWrap.className = 'wa-waveform-container';
    const scrubber = document.createElement('input');
    scrubber.type = 'range';
    scrubber.className = 'wa-scrubber';
    scrubber.min = 0; scrubber.max = 100; scrubber.value = 100;
    scrubber.disabled = true; // Native TTS can't scrub easily
    waveWrap.appendChild(scrubber);

    const timeEl = document.createElement('span');
    timeEl.className = 'wa-time';
    timeEl.innerText = 'Live';

    wrapper.append(playBtn, waveWrap, timeEl);

    playBtn.addEventListener('click', () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            playBtn.innerHTML = '<i class="ph-fill ph-play"></i>';
        } else {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = lang;
            u.onstart = () => playBtn.innerHTML = '<i class="ph-fill ph-stop"></i>';
            u.onend = () => playBtn.innerHTML = '<i class="ph-fill ph-play"></i>';
            window.speechSynthesis.speak(u);
        }
    });

    return wrapper;
}

// ─── MINI WHATSAPP PLAYER FOR EACH AI BUBBLE ─────────────────────────────
function buildVoiceNotePlayer(blobUrl) {
    const audio = new Audio(blobUrl);
    const wrapper = document.createElement('div');
    wrapper.className = 'wa-voice-note';

    const playBtn = document.createElement('button');
    playBtn.className = 'wa-play-btn';
    playBtn.innerHTML = '<i class="ph-fill ph-play"></i>';

    const waveWrap = document.createElement('div');
    waveWrap.className = 'wa-waveform-container';
    const scrubber = document.createElement('input');
    scrubber.type = 'range';
    scrubber.className = 'wa-scrubber';
    scrubber.min = 0; scrubber.max = 100; scrubber.value = 0;
    waveWrap.appendChild(scrubber);

    const timeEl = document.createElement('span');
    timeEl.className = 'wa-time';
    timeEl.innerText = '0:00';

    wrapper.append(playBtn, waveWrap, timeEl);

    // Events
    playBtn.addEventListener('click', () => {
        if (audio.paused) { audio.play(); } else { audio.pause(); }
    });
    audio.addEventListener('play',  () => playBtn.innerHTML = '<i class="ph-fill ph-pause"></i>');
    audio.addEventListener('pause', () => playBtn.innerHTML = '<i class="ph-fill ph-play"></i>');
    audio.addEventListener('ended', () => { playBtn.innerHTML = '<i class="ph-fill ph-play"></i>'; scrubber.value = 0; });
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            scrubber.value = (audio.currentTime / audio.duration) * 100;
            const s = Math.floor(audio.currentTime);
            timeEl.innerText = `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
        }
    });
    scrubber.addEventListener('input', e => {
        if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
    });

    return wrapper;
}
