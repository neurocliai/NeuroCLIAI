// ── NeuroCLI AI Universal Voice Navigator v2 ───────────────────────────────
// Persists mic across ALL page navigations via sessionStorage.
// Bugs fixed: "stop" command, mic restart after navigation.

(function () {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    // ── State ──────────────────────────────────────────────────────────────
    let micActive    = false;   // logical intent: should mic be on?
    let isRecognizing = false;  // is recognition actually running right now?
    let lastFinal    = '';
    let silenceTimer = null;
    let restartTimer = null;

    const recognition = new SR();
    recognition.continuous    = true;
    recognition.interimResults = true;
    recognition.lang          = 'en-US';

    // ── Page routes ────────────────────────────────────────────────────────
    const ROUTES = {
        'go to chat':           'chat.html',
        'open chat':            'chat.html',
        'go home':              'chat.html',
        'split chat':           'split-chat.html',
        'co pilot':             'split-chat.html',
        'copilot':              'split-chat.html',
        'split view':           'split-chat.html',
        'mind map':             'mindmap.html',
        'infinite canvas':      'mindmap.html',
        'voice studio':         'voice-studio.html',
        'surgical analyzer':    'surgical-analyzer.html',
        'open surgical':        'surgical-analyzer.html',
        'medical imaging':      'medical-imaging.html',
        'open imaging':         'medical-imaging.html',
        'symptom checker':      'symptom-checker.html',
        'check symptoms':       'symptom-checker.html',
        'drug scanner':         'drug-scanner.html',
        'drug check':           'drug-scanner.html',
        'code analyzer':        'code-analyzer.html',
        'analyze code':         'code-analyzer.html',
        'legal analyzer':       'legal-analyzer.html',
        'open legal':           'legal-analyzer.html',
        'meeting transcriber':  'meeting-transcriber.html',
        'transcribe meeting':   'meeting-transcriber.html',
        'compliance checker':   'compliance-checker.html',
        'check compliance':     'compliance-checker.html',
    };

    // ── STOP/START PATTERNS (expanded — catches plain "stop", "pause" etc.) ─
    const STOP_PATTERNS = [
        /\bstop\b/, /\bstop mic\b/, /\bstop microphone\b/,
        /\bmute\b/, /\bmute mic\b/, /\bmic off\b/,
        /\bturn off mic\b/, /\bturn off microphone\b/,
        /\bsilence\b/, /\bpause mic\b/, /\bpause microphone\b/,
        /\bno mic\b/, /\bstop listening\b/, /\bstop voice\b/
    ];

    const START_PATTERNS = [
        /\bstart mic\b/, /\bstart microphone\b/, /\bstart listening\b/,
        /\bturn on mic\b/, /\bturn on microphone\b/, /\bmic on\b/,
        /\bmicrophone on\b/, /\bunmute\b/, /\bunmute mic\b/,
        /\bresume mic\b/, /\bstart voice\b/, /\blisten\b/,
        /\bhey neuro\b/, /\bactivate mic\b/
    ];

    // ── Toast ──────────────────────────────────────────────────────────────
    let toastTimer;
    function showToast(msg) {
        const t = document.getElementById('vnav-toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
    }

    // ── UI button state ───────────────────────────────────────────────────
    function setButtonState(on) {
        const btn = document.getElementById('vnav-mic-btn');
        if (!btn) return;
        if (on) {
            btn.classList.add('on');
            btn.title = 'Voice ON — click to mute';
        } else {
            btn.classList.remove('on');
            btn.title = 'Voice OFF — click to activate';
        }
    }

    // ── Core: safe start ───────────────────────────────────────────────────
    function safeStart() {
        if (isRecognizing) return;
        try {
            recognition.start();
        } catch (e) {
            // Already started or another error — retry after brief delay
            clearTimeout(restartTimer);
            restartTimer = setTimeout(safeStart, 500);
        }
    }

    // ── Start mic ──────────────────────────────────────────────────────────
    function startMic() {
        micActive = true;
        sessionStorage.setItem('vnav_mic', '1');
        setButtonState(true);
        showToast('🎙️ Mic ON — I\'m listening…');
        safeStart();
    }

    // ── Stop mic ───────────────────────────────────────────────────────────
    function stopMic() {
        micActive    = false;
        isRecognizing = false;
        sessionStorage.setItem('vnav_mic', '0');
        setButtonState(false);
        showToast('🔇 Mic OFF — stopped listening');
        clearTimeout(restartTimer);
        try { recognition.stop(); } catch (e) {}
        try { recognition.abort(); } catch (e) {}
    }

    window.startVoiceMic = startMic;
    window.stopVoiceMic  = stopMic;

    // ── Recognition lifecycle ──────────────────────────────────────────────
    recognition.onstart = function () {
        isRecognizing = true;
        setButtonState(true);
    };

    recognition.onend = function () {
        isRecognizing = false;
        // ONLY restart if user intends mic to be on
        if (micActive) {
            clearTimeout(restartTimer);
            restartTimer = setTimeout(safeStart, 400);
        } else {
            setButtonState(false);
        }
    };

    recognition.onerror = function (e) {
        isRecognizing = false;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            showToast('❌ Mic permission denied in browser');
            stopMic();
        } else if (e.error === 'aborted') {
            // Intentional stop — do nothing
        } else if (e.error === 'network') {
            showToast('⚠️ Network error — retrying mic…');
            if (micActive) {
                clearTimeout(restartTimer);
                restartTimer = setTimeout(safeStart, 1500);
            }
        }
        // no-speech is normal — let onend handle restart
    };

    recognition.onresult = function (e) {
        let interim = '', final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) final  += e.results[i][0].transcript;
            else                      interim += e.results[i][0].transcript;
        }

        // Show live transcript
        if (final || interim) showToast('🎙️ ' + (final || interim).trim());

        if (!final) return;
        const text = final.trim();
        if (!text || text === lastFinal) return;
        lastFinal = text;
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => { lastFinal = ''; }, 3500);

        const t = text.toLowerCase().trim();

        // ── 1. STOP COMMAND ─────────────────────────────────────────────
        if (STOP_PATTERNS.some(rx => rx.test(t))) {
            stopMic();
            return;
        }

        // ── 2. START COMMAND ────────────────────────────────────────────
        if (START_PATTERNS.some(rx => rx.test(t))) {
            showToast('🎙️ Mic is already ON!');
            return;
        }

        // ── 3. PAGE NAVIGATION ──────────────────────────────────────────
        for (const [phrase, url] of Object.entries(ROUTES)) {
            if (t.includes(phrase)) {
                showToast('🔀 Navigating to ' + url.replace('.html', '') + '…');
                // CRITICAL: persist mic=ON so new page restarts it
                sessionStorage.setItem('vnav_mic', '1');
                setTimeout(() => { window.location.href = url; }, 800);
                return;
            }
        }

        // ── 4. SCROLL ──────────────────────────────────────────────────
        if (/scroll down|go down|page down/.test(t)) {
            window.scrollBy({ top: 400, behavior: 'smooth' });
            showToast('⬇️ Scrolled down');
            return;
        }
        if (/scroll up|go up|page up|scroll to top/.test(t)) {
            window.scrollBy({ top: -400, behavior: 'smooth' });
            showToast('⬆️ Scrolled up');
            return;
        }

        // ── 5. SEND TO CHAT (only on chat.html) ────────────────────────
        const input = document.getElementById('prompt-input');
        const form  = document.getElementById('chat-form');
        if (input && form) {
            input.value = text;
            form.dispatchEvent(new Event('submit'));
        }
    };

    // ── Build floating button + toast ──────────────────────────────────────
    function buildUI() {
        if (document.getElementById('vnav-mic-btn')) return;

        const s = document.createElement('style');
        s.textContent = `
            #vnav-mic-btn {
                position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
                width: 54px; height: 54px; border-radius: 50%;
                background: rgba(15,23,42,0.9);
                border: 2px solid rgba(255,255,255,0.15);
                color: #64748b; font-size: 22px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                box-shadow: 0 6px 24px rgba(0,0,0,0.5);
                transition: border-color 0.3s, color 0.3s, box-shadow 0.3s;
            }
            #vnav-mic-btn:hover { border-color: rgba(255,255,255,0.3); color: #e2e8f0; }
            #vnav-mic-btn.on {
                border-color: #10b981; color: #10b981;
                animation: vnav-pulse 1.5s infinite;
            }
            @keyframes vnav-pulse {
                0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.6); }
                70%  { box-shadow: 0 0 0 14px rgba(16,185,129,0);   }
                100% { box-shadow: 0 0 0 0   rgba(16,185,129,0);    }
            }
            #vnav-toast {
                position: fixed; bottom: 90px; right: 24px; z-index: 2147483646;
                background: rgba(15,23,42,0.95);
                border: 1px solid rgba(255,255,255,0.12);
                color: #e2e8f0; font-family: Inter,system-ui,sans-serif;
                font-size: 13px; padding: 9px 16px; border-radius: 99px;
                max-width: 280px; white-space: nowrap;
                overflow: hidden; text-overflow: ellipsis;
                backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                opacity: 0; pointer-events: none;
                transition: opacity 0.25s ease;
            }
            #vnav-toast.show { opacity: 1; }
        `;
        document.head.appendChild(s);

        const btn = document.createElement('button');
        btn.id = 'vnav-mic-btn';
        btn.innerHTML = '<i class="ph ph-microphone"></i>';
        btn.addEventListener('click', () => { micActive ? stopMic() : startMic(); });
        document.body.appendChild(btn);

        const toast = document.createElement('div');
        toast.id = 'vnav-toast';
        document.body.appendChild(toast);
    }

    // ── Init on every page load ────────────────────────────────────────────
    function init() {
        buildUI();

        const savedState = sessionStorage.getItem('vnav_mic');

        if (savedState === '1') {
            // Give browser 600ms to fully load before starting mic
            // (avoids "already started" errors on fresh page load)
            setTimeout(() => {
                micActive = true;
                setButtonState(true);
                showToast('🎙️ Mic restored — listening…');
                safeStart();
            }, 600);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
