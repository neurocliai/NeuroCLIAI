// ── NeuroCLI AI Universal Voice Navigator ─────────────────────────────────
// Loaded on EVERY page. Persists mic ON/OFF state via sessionStorage.
// Handles: page navigation, mic toggle, stop/start commands.

(function () {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous   = true;
    recognition.interimResults = true;
    recognition.lang         = 'en-US';

    let micActive     = false;
    let lastFinal     = '';
    let silenceTimer  = null;

    // ── Page routes map ────────────────────────────────────────────────────
    const ROUTES = {
        'go to chat':          'chat.html',   'open chat':          'chat.html',
        'go home':             'chat.html',   'home':               'chat.html',
        'split chat':          'split-chat.html', 'copilot':        'split-chat.html',
        'co pilot':            'split-chat.html', 'split view':     'split-chat.html',
        'mind map':            'mindmap.html','infinite canvas':    'mindmap.html',
        'voice studio':        'voice-studio.html',
        'surgical analyzer':   'surgical-analyzer.html', 'open surgical': 'surgical-analyzer.html',
        'medical imaging':     'medical-imaging.html',   'open imaging':  'medical-imaging.html',
        'symptom checker':     'symptom-checker.html',   'check symptoms':'symptom-checker.html',
        'drug scanner':        'drug-scanner.html',      'scan drugs':    'drug-scanner.html',
        'code analyzer':       'code-analyzer.html',     'analyze code':  'code-analyzer.html',
        'legal analyzer':      'legal-analyzer.html',    'open legal':    'legal-analyzer.html',
        'meeting transcriber': 'meeting-transcriber.html','transcribe meeting':'meeting-transcriber.html',
        'compliance checker':  'compliance-checker.html','check compliance':'compliance-checker.html',
    };

    // ── Floating mic button ────────────────────────────────────────────────
    function buildMicBtn() {
        if (document.getElementById('vnav-mic-btn')) return;

        const style = document.createElement('style');
        style.textContent = `
            #vnav-mic-btn {
                position: fixed; bottom: 24px; right: 24px; z-index: 999999;
                width: 52px; height: 52px; border-radius: 50%;
                background: rgba(15,23,42,0.85); border: 2px solid rgba(255,255,255,0.12);
                color: #94a3b8; font-size: 22px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(12px);
                transition: all 0.25s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            }
            #vnav-mic-btn.on {
                border-color: #10b981; color: #10b981;
                box-shadow: 0 0 0 0 rgba(16,185,129,0.7);
                animation: mic-ring 1.5s infinite;
            }
            @keyframes mic-ring {
                0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.7); }
                70%  { box-shadow: 0 0 0 12px rgba(16,185,129,0);   }
                100% { box-shadow: 0 0 0 0   rgba(16,185,129,0);    }
            }
            #vnav-toast {
                position: fixed; bottom: 88px; right: 24px; z-index: 999999;
                background: rgba(15,23,42,0.92); border: 1px solid rgba(255,255,255,0.1);
                color: #e2e8f0; font-family: Inter, sans-serif; font-size: 13px;
                padding: 9px 16px; border-radius: 30px; max-width: 260px;
                backdrop-filter: blur(12px); opacity: 0;
                transition: opacity 0.3s ease; pointer-events: none;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            #vnav-toast.show { opacity: 1; }
        `;
        document.head.appendChild(style);

        const btn = document.createElement('button');
        btn.id = 'vnav-mic-btn';
        btn.title = 'Click to toggle voice navigation';
        btn.innerHTML = '<i class="ph ph-microphone"></i>';
        btn.addEventListener('click', () => {
            if (micActive) stopMic(); else startMic();
        });
        document.body.appendChild(btn);

        const toast = document.createElement('div');
        toast.id = 'vnav-toast';
        document.body.appendChild(toast);
    }

    // ── Toast message ──────────────────────────────────────────────────────
    let toastTimer;
    function showToast(msg) {
        const t = document.getElementById('vnav-toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
    }

    // ── Start / Stop ───────────────────────────────────────────────────────
    function startMic() {
        micActive = true;
        sessionStorage.setItem('vnav_mic', '1');
        try { recognition.start(); } catch (e) {}
        const btn = document.getElementById('vnav-mic-btn');
        if (btn) btn.classList.add('on');
        showToast('🎙️ Mic ON — listening…');
    }

    function stopMic() {
        micActive = false;
        sessionStorage.setItem('vnav_mic', '0');
        try { recognition.stop(); } catch (e) {}
        const btn = document.getElementById('vnav-mic-btn');
        if (btn) btn.classList.remove('on');
        showToast('🔇 Mic OFF');
    }

    // expose globally so chat.html / other buttons can call these
    window.startVoiceMic = startMic;
    window.stopVoiceMic  = stopMic;

    // ── Recognition events ─────────────────────────────────────────────────
    recognition.onresult = function (e) {
        let interim = '', final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) final  += e.results[i][0].transcript;
            else                      interim += e.results[i][0].transcript;
        }

        const display = final || interim;
        if (display) showToast('🎙️ ' + display);

        if (!final) return;
        const text = final.trim();
        if (text === lastFinal) return;
        lastFinal = text;
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => { lastFinal = ''; }, 3000);

        const t = text.toLowerCase();

        // ── Stop/Start mic by voice ────────────────────────────────────────
        if (/stop mic|turn off mic|stop microphone|mute mic|mic off/.test(t)) {
            stopMic(); return;
        }
        if (/start mic|turn on mic|start microphone|unmute mic|mic on|microphone on/.test(t)) {
            // Already on (user said start while already running), just confirm
            showToast('🎙️ Mic is already ON!'); return;
        }

        // ── Page navigation ────────────────────────────────────────────────
        for (const [phrase, url] of Object.entries(ROUTES)) {
            if (t.includes(phrase)) {
                showToast('🔀 Going to ' + url.replace('.html', '') + '…');
                // Keep mic alive after navigation
                sessionStorage.setItem('vnav_mic', '1');
                setTimeout(() => { window.location.href = url; }, 700);
                return;
            }
        }

        // ── Scroll ────────────────────────────────────────────────────────
        if (/scroll down|go down/.test(t)) {
            window.scrollBy({ top: 400, behavior: 'smooth' }); return;
        }
        if (/scroll up|go up/.test(t)) {
            window.scrollBy({ top: -400, behavior: 'smooth' }); return;
        }

        // ── Forward remaining text to chat input (only on chat page) ──────
        const input = document.getElementById('prompt-input');
        const form  = document.getElementById('chat-form');
        if (input && form && !Object.values(ROUTES).some(u => window.location.href.endsWith(u) === false)) {
            input.value = text;
            form.dispatchEvent(new Event('submit'));
        }
    };

    recognition.onend = function () {
        // Auto-restart ONLY if mic is supposed to be on
        if (micActive) {
            setTimeout(() => {
                try { recognition.start(); } catch (e) {}
            }, 300);
        }
    };

    recognition.onerror = function (e) {
        if (e.error === 'not-allowed') {
            showToast('❌ Mic permission denied');
            stopMic();
        } else if (e.error !== 'no-speech') {
            showToast('⚠️ ' + e.error);
        }
    };

    // ── On page load: build button, restore state ──────────────────────────
    function init() {
        buildMicBtn();
        // If mic was ON before navigation, auto-restart it
        if (sessionStorage.getItem('vnav_mic') === '1') {
            startMic();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
