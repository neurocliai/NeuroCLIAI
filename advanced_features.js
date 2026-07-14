// Thought-Lens (Drag-and-Drop Area Selection)

window.isLensModeActive = false;

// Setup Lens Toggle Button globally
window.toggleLensMode = function() {
    window.isLensModeActive = !window.isLensModeActive;
    const lensBtn = document.getElementById('lens-toggle-btn');
    
    if (window.isLensModeActive) {
        if (lensBtn) {
            lensBtn.style.background = 'rgba(192, 132, 252, 0.2)';
            lensBtn.style.boxShadow = '0 0 10px rgba(192, 132, 252, 0.5)';
        }
        enableLensOverlay();
    } else {
        if (lensBtn) {
            lensBtn.style.background = 'transparent';
            lensBtn.style.boxShadow = 'none';
        }
        disableLensOverlay();
    }
};

let startX = 0, startY = 0;
let isDragging = false;

function enableLensOverlay() {
    let overlay = document.getElementById('lens-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lens-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        overlay.style.cursor = 'crosshair';
        overlay.style.zIndex = '99997';
        document.body.appendChild(overlay);
        
        // Instruction text
        const instruction = document.createElement('div');
        instruction.innerHTML = '<i class="ph ph-scan"></i> Select any text to scan with AI Lens';
        instruction.style.position = 'absolute';
        instruction.style.top = '20px';
        instruction.style.left = '50%';
        instruction.style.transform = 'translateX(-50%)';
        instruction.style.background = 'rgba(15, 23, 42, 0.8)';
        instruction.style.color = '#e2e8f0';
        instruction.style.padding = '10px 20px';
        instruction.style.borderRadius = '30px';
        instruction.style.fontSize = '14px';
        instruction.style.fontFamily = 'Inter, sans-serif';
        instruction.style.backdropFilter = 'blur(10px)';
        instruction.style.display = 'flex';
        instruction.style.alignItems = 'center';
        instruction.style.gap = '8px';
        instruction.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        overlay.appendChild(instruction);
        
        overlay.addEventListener('mousedown', onLensMouseDown);
        overlay.addEventListener('mousemove', onLensMouseMove);
        overlay.addEventListener('mouseup', onLensMouseUp);
    }
    overlay.style.display = 'block';
}

function disableLensOverlay() {
    const overlay = document.getElementById('lens-overlay');
    if (overlay) overlay.style.display = 'none';
    
    const box = document.getElementById('lens-selection-box');
    if (box) box.style.display = 'none';
    
    const popover = document.getElementById('thought-lens-popover');
    if (popover) popover.style.display = 'none';
}

function onLensMouseDown(e) {
    if (e.target.closest('#thought-lens-popover')) return; // Don't draw if clicking inside popover
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    let box = document.getElementById('lens-selection-box');
    if (!box) {
        box = document.createElement('div');
        box.id = 'lens-selection-box';
        box.style.position = 'fixed';
        box.style.border = '2px solid #c084fc';
        box.style.backgroundColor = 'rgba(192, 132, 252, 0.15)';
        box.style.borderRadius = '8px';
        box.style.zIndex = '99998';
        box.style.pointerEvents = 'none';
        box.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)'; // Darken outside (Google Lens style effect)
        // Note: The huge box shadow is a neat trick to darken everything outside the box, but since we already have an overlay, it might compound. Let's just use simple styles.
        box.style.boxShadow = '0 0 15px rgba(192, 132, 252, 0.4)';
        document.body.appendChild(box);
    }
    
    box.style.left = startX + 'px';
    box.style.top = startY + 'px';
    box.style.width = '0px';
    box.style.height = '0px';
    box.style.display = 'block';
    
    // Hide popover while drawing
    const popover = document.getElementById('thought-lens-popover');
    if (popover) popover.style.display = 'none';
}

function onLensMouseMove(e) {
    if (!isDragging) return;
    
    const box = document.getElementById('lens-selection-box');
    if (!box) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(startX - currentX);
    const height = Math.abs(startY - currentY);
    
    box.style.left = left + 'px';
    box.style.top = top + 'px';
    box.style.width = width + 'px';
    box.style.height = height + 'px';
}

function onLensMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    
    const box = document.getElementById('lens-selection-box');
    if (!box || parseInt(box.style.width) < 10 || parseInt(box.style.height) < 10) {
        // Selection too small, ignore
        if (box) box.style.display = 'none';
        return;
    }
    
    const boxRect = box.getBoundingClientRect();
    
    // Extract text inside the box
    let selectedText = extractTextInRect(boxRect);
    if (!selectedText) {
        selectedText = "No text detected";
    } else if (selectedText.length > 100) {
        selectedText = selectedText.substring(0, 100) + '...';
    }
    
    showLensPopover(boxRect, selectedText);
}

function extractTextInRect(rect) {
    let text = "";
    // Check all text nodes or elements in the chat history
    const elements = document.querySelectorAll('.message-content p, .message-content span, .message-content h1, .message-content h2, .message-content h3, .message-content li, .message-content code');
    
    elements.forEach(el => {
        const elRect = el.getBoundingClientRect();
        // Check if rectangles intersect
        if (!(elRect.right < rect.left || 
              elRect.left > rect.right || 
              elRect.bottom < rect.top || 
              elRect.top > rect.bottom)) {
            // Element overlaps with selection box
            text += " " + (el.innerText || el.textContent);
        }
    });
    
    // Clean up extra spaces
    return text.replace(/\s+/g, ' ').trim();
}

function showLensPopover(boxRect, scannedText) {
    let popover = document.getElementById('thought-lens-popover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'thought-lens-popover';
        popover.style.position = 'fixed';
        popover.style.background = 'rgba(15, 23, 42, 0.65)';
        popover.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        popover.style.color = '#f8fafc';
        popover.style.padding = '14px';
        popover.style.borderRadius = '16px';
        popover.style.zIndex = '99999';
        popover.style.backdropFilter = 'blur(20px) saturate(180%)';
        popover.style.WebkitBackdropFilter = 'blur(20px) saturate(180%)';
        popover.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
        popover.style.fontFamily = 'Inter, sans-serif';
        popover.style.width = '260px';
        popover.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        document.body.appendChild(popover);
        
        // Add global hover styles for the buttons
        const style = document.createElement('style');
        style.innerHTML = `
            .lens-action-btn {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.05);
                color: #e2e8f0;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
                width: 100%;
            }
            .lens-action-btn:hover {
                background: rgba(255,255,255,0.12);
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Position the popover near the selection box (bottom right corner or below)
    popover.style.left = (boxRect.right + 10) + 'px';
    popover.style.top = boxRect.top + 'px';
    
    // Keep it on screen
    setTimeout(() => {
        const popRect = popover.getBoundingClientRect();
        if (popRect.right > window.innerWidth) {
            popover.style.left = (boxRect.left - popRect.width - 10) + 'px';
        }
        if (popRect.bottom > window.innerHeight) {
            popover.style.top = (window.innerHeight - popRect.height - 20) + 'px';
        }
    }, 0);
    
    const safeText = scannedText.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    
    popover.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #c084fc, #818cf8); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                    <i class="ph ph-scan" style="color: white; font-size: 14px;"></i>
                </div>
                <strong style="color: #f8fafc; font-size: 14px; font-weight: 600;">AI Lens</strong>
            </div>
            <button onclick="disableLensOverlay(); window.toggleLensMode();" style="background:transparent; border:none; color: #94a3b8; cursor:pointer;"><i class="ph ph-x"></i></button>
        </div>
        <div style="color: #94a3b8; font-size: 12px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); line-height: 1.4;">
            Scanned: <span style="color: #e2e8f0; font-weight: 500;">"${scannedText}"</span>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="lens-action-btn" onclick="document.getElementById('prompt-input').value = 'Explain this in more detail: ${safeText}'; document.getElementById('chat-form').dispatchEvent(new Event('submit')); disableLensOverlay(); window.toggleLensMode();">
                <i class="ph ph-magnifying-glass" style="color: #60a5fa; font-size: 14px;"></i> Deep Dive
            </button>
            <button class="lens-action-btn" onclick="document.getElementById('prompt-input').value = 'Rewrite this to be more professional: ${safeText}'; document.getElementById('chat-form').dispatchEvent(new Event('submit')); disableLensOverlay(); window.toggleLensMode();">
                <i class="ph ph-arrows-clockwise" style="color: #c084fc; font-size: 14px;"></i> Rewrite
            </button>
            <button class="lens-action-btn" onclick="document.getElementById('prompt-input').value = 'Fix any errors in this: ${safeText}'; document.getElementById('chat-form').dispatchEvent(new Event('submit')); disableLensOverlay(); window.toggleLensMode();">
                <i class="ph ph-wrench" style="color: #fbbf24; font-size: 14px;"></i> Scan & Fix
            </button>
        </div>
    `;
    
    popover.style.display = 'block';
}


// Frictionless Voice-to-UI Architecture
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let voiceActive = false;
    let silenceTimer = null;
    
    // ── Visual indicator badge ──────────────────────────────────────────────
    function createVoiceIndicator() {
        if (document.getElementById('voice-listening-indicator')) return;
        
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes voicepulse { 
                0%   { opacity: 0.8; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
                50%  { opacity: 1;   box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
                100% { opacity: 0.8; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            #voice-listening-indicator { animation: voicepulse 1.5s infinite; }
        `;
        document.head.appendChild(style);
        
        const ind = document.createElement('div');
        ind.id = 'voice-listening-indicator';
        ind.style.cssText = `
            position: fixed; bottom: 80px; left: 20px;
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.4);
            padding: 10px 16px;
            border-radius: 30px;
            font-size: 13px;
            font-family: Inter, sans-serif;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 8px;
            backdrop-filter: blur(10px);
            max-width: 280px;
        `;
        ind.innerHTML = `<i class="ph ph-microphone" style="font-size:16px;"></i><span id="voice-transcript-text">Listening…</span>`;
        document.body.appendChild(ind);
    }
    
    function setVoiceTranscript(text) {
        const el = document.getElementById('voice-transcript-text');
        if (el) el.textContent = text || 'Listening…';
    }
    
    function hideVoiceIndicator() {
        const ind = document.getElementById('voice-listening-indicator');
        if (ind) ind.style.display = 'none';
    }
    
    function showVoiceIndicator() {
        const ind = document.getElementById('voice-listening-indicator');
        if (ind) { ind.style.display = 'flex'; }
        else { createVoiceIndicator(); }
    }
    
    // ── Core: dispatch a spoken phrase as a real chat message ──────────────
    function sendVoicePrompt(text) {
        const input = document.getElementById('prompt-input');
        const form  = document.getElementById('chat-form');
        if (!input || !form) return;
        input.value = text;
        form.dispatchEvent(new Event('submit'));
    }
    
    // ── UI command handler ─────────────────────────────────────────────────
    function handleVoiceCommand(text) {
        const t = text.toLowerCase().trim();
        
        // ── PAGE NAVIGATION ────────────────────────────────────────────────
        const pageRoutes = {
            // Main chat
            'go to chat':              'chat.html',
            'open chat':               'chat.html',
            'go home':                 'chat.html',
            'home':                    'chat.html',
            // Split Co-Pilot
            'split chat':              'split-chat.html',
            'co pilot':                'split-chat.html',
            'copilot':                 'split-chat.html',
            'split view':              'split-chat.html',
            // Mind Map / Infinite Canvas
            'mind map':                'mindmap.html',
            'infinite canvas':         'mindmap.html',
            'open canvas':             'mindmap.html',
            'canvas':                  'mindmap.html',
            // Voice Studio
            'voice studio':            'voice-studio.html',
            'open voice studio':       'voice-studio.html',
            'go to voice':             'voice-studio.html',
            // Medical Tools
            'surgical analyzer':       'surgical-analyzer.html',
            'open surgical':           'surgical-analyzer.html',
            'medical imaging':         'medical-imaging.html',
            'open imaging':            'medical-imaging.html',
            'symptom checker':         'symptom-checker.html',
            'check symptoms':          'symptom-checker.html',
            'drug scanner':            'drug-scanner.html',
            'scan drugs':              'drug-scanner.html',
            'drug check':              'drug-scanner.html',
            // Pro Tools
            'code analyzer':           'code-analyzer.html',
            'analyze code':            'code-analyzer.html',
            'open code':               'code-analyzer.html',
            'legal analyzer':          'legal-analyzer.html',
            'open legal':              'legal-analyzer.html',
            'meeting transcriber':     'meeting-transcriber.html',
            'transcribe meeting':      'meeting-transcriber.html',
            'open meeting':            'meeting-transcriber.html',
            'compliance checker':      'compliance-checker.html',
            'check compliance':        'compliance-checker.html',
        };
        
        for (const [phrase, url] of Object.entries(pageRoutes)) {
            if (t.includes(phrase)) {
                setVoiceTranscript(`🔀 Navigating to ${url.replace('.html', '')}…`);
                setTimeout(() => { window.location.href = url; }, 600);
                return true;
            }
        }
        
        // ── SCROLL COMMANDS ────────────────────────────────────────────────
        if (t.includes('scroll down') || t.includes('go down') || t.includes('page down')) {
            const c = document.getElementById('chat-container');
            if (c) c.scrollBy({ top: 400, behavior: 'smooth' });
            setVoiceTranscript('⬇️ Scrolled down');
            return true;
        }
        if (t.includes('scroll up') || t.includes('go up') || t.includes('page up')) {
            const c = document.getElementById('chat-container');
            if (c) c.scrollBy({ top: -400, behavior: 'smooth' });
            setVoiceTranscript('⬆️ Scrolled up');
            return true;
        }
        if (t.includes('scroll to top') || t.includes('go to top') || t.includes('jump to top')) {
            const c = document.getElementById('chat-container');
            if (c) c.scrollTo({ top: 0, behavior: 'smooth' });
            setVoiceTranscript('⬆️ Scrolled to top');
            return true;
        }
        if (t.includes('scroll to bottom') || t.includes('go to bottom') || t.includes('jump to bottom')) {
            const c = document.getElementById('chat-container');
            if (c) c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' });
            setVoiceTranscript('⬇️ Scrolled to bottom');
            return true;
        }
        
        // ── CHAT MANAGEMENT ────────────────────────────────────────────────
        if (t.includes('new chat') || t.includes('start new chat') || t.includes('clear chat') || t.includes('fresh chat')) {
            const btn = document.getElementById('new-chat-btn');
            if (btn) btn.click();
            setVoiceTranscript('🆕 New chat started!');
            return true;
        }
        
        if (t.includes('copy last') || t.includes('copy response') || t.includes('copy that') || t.includes('copy the response')) {
            const msgs = document.querySelectorAll('.message.ai .message-content');
            if (msgs.length > 0) {
                navigator.clipboard.writeText(msgs[msgs.length - 1].innerText).catch(() => {});
                setVoiceTranscript('📋 Response copied!');
            }
            return true;
        }
        
        if (t.includes('delete last chat') || t.includes('remove last chat')) {
            const firstHistory = document.querySelector('.history-action-btn.delete');
            if (firstHistory) firstHistory.click();
            return true;
        }
        
        // ── PANEL TOGGLES ──────────────────────────────────────────────────
        if (t.includes('open sidebar') || t.includes('show sidebar') || t.includes('toggle sidebar') || t.includes('open menu') || t.includes('show menu')) {
            const btn = document.getElementById('sidebar-toggle-btn');
            if (btn) btn.click();
            setVoiceTranscript('📂 Sidebar toggled');
            return true;
        }
        
        if (t.includes('open canvas') || t.includes('show canvas') || t.includes('memory canvas') || t.includes('open memory')) {
            const btn = document.getElementById('canvas-btn');
            if (btn) btn.click();
            setVoiceTranscript('🖼️ Canvas toggled');
            return true;
        }
        
        if (t.includes('developer hud') || t.includes('open hud') || t.includes('show hud') || t.includes('terminal') || t.includes('dev mode')) {
            const btn = document.getElementById('dev-hud-btn');
            if (btn) btn.click();
            setVoiceTranscript('🖥️ Developer HUD toggled');
            return true;
        }
        
        if (t.includes('open profile') || t.includes('show profile') || t.includes('my profile') || t.includes('account')) {
            const btn = document.getElementById('profile-btn');
            if (btn) btn.click();
            setVoiceTranscript('👤 Profile panel opened');
            return true;
        }
        
        // ── LENS TOGGLE ────────────────────────────────────────────────────
        if (t.includes('open lens') || t.includes('activate lens') || t.includes('ai lens') || t.includes('close lens')) {
            if (typeof window.toggleLensMode === 'function') window.toggleLensMode();
            setVoiceTranscript('🔍 Lens toggled');
            return true;
        }
        
        // ── TEXT SIZE COMMANDS ─────────────────────────────────────────────
        if (t.includes('increase font') || t.includes('bigger text') || t.includes('zoom in') || t.includes('larger text')) {
            const current = parseFloat(document.body.style.fontSize) || 1;
            document.body.style.fontSize = Math.min(current + 0.1, 1.5) + 'em';
            setVoiceTranscript('🔠 Text size increased');
            return true;
        }
        if (t.includes('decrease font') || t.includes('smaller text') || t.includes('zoom out') || t.includes('smaller font')) {
            const current = parseFloat(document.body.style.fontSize) || 1;
            document.body.style.fontSize = Math.max(current - 0.1, 0.7) + 'em';
            setVoiceTranscript('🔡 Text size decreased');
            return true;
        }
        if (t.includes('reset font') || t.includes('default font') || t.includes('normal text size')) {
            document.body.style.fontSize = '';
            setVoiceTranscript('✅ Font reset to default');
            return true;
        }
        
        // ── READ ALOUD ─────────────────────────────────────────────────────
        if (t.includes('read last') || t.includes('read response') || t.includes('read aloud') || t.includes('speak response')) {
            const msgs = document.querySelectorAll('.message.ai .message-content');
            if (msgs.length > 0 && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utter = new SpeechSynthesisUtterance(msgs[msgs.length - 1].innerText);
                utter.rate = 1;
                utter.pitch = 1;
                window.speechSynthesis.speak(utter);
                setVoiceTranscript('🔊 Reading aloud…');
            }
            return true;
        }
        if (t.includes('stop reading') || t.includes('stop speaking') || t.includes('silence') || t.includes('quiet')) {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            setVoiceTranscript('🔇 Stopped reading');
            return true;
        }
        
        // ── FOCUS INPUT ────────────────────────────────────────────────────
        if (t.includes('focus input') || t.includes('type message') || t.includes('start typing')) {
            const input = document.getElementById('prompt-input');
            if (input) input.focus();
            setVoiceTranscript('⌨️ Input focused');
            return true;
        }
        
        // ── HELP OVERLAY ───────────────────────────────────────────────────
        if (t.includes('voice help') || t.includes('what can i say') || t.includes('show commands') || t.includes('voice commands')) {
            showVoiceHelp();
            return true;
        }
        
        // ── HIGHLIGHT ─────────────────────────────────────────────────────
        const colorMap = {
            'yellow':  '#fef08a',
            'red':     '#fca5a5',
            'blue':    '#93c5fd',
            'green':   '#86efac',
            'pink':    '#f9a8d4',
            'orange':  '#fdba74',
            'purple':  '#c4b5fd',
            'cyan':    '#67e8f9',
            'white':   '#ffffff',
            'lime':    '#bef264',
        };
        
        const highlightPattern = /highlight|color|colour|mark|make it/i;
        if (highlightPattern.test(t)) {
            for (const [colorName, hex] of Object.entries(colorMap)) {
                if (t.includes(colorName)) {
                    document.querySelectorAll('.voice-highlighted').forEach(el => {
                        el.style.backgroundColor = '';
                        el.style.borderRadius = '';
                        el.style.padding = '';
                        el.style.color = '';
                        el.classList.remove('voice-highlighted');
                    });
                    const aiMsgs = document.querySelectorAll('.message.ai .message-content');
                    if (aiMsgs.length > 0) {
                        const lastMsg = aiMsgs[aiMsgs.length - 1];
                        lastMsg.style.transition = 'background-color 0.4s ease';
                        lastMsg.style.backgroundColor = hex;
                        lastMsg.style.borderRadius = '8px';
                        lastMsg.style.padding = '8px';
                        lastMsg.style.color = '#0f172a';
                        lastMsg.classList.add('voice-highlighted');
                        setVoiceTranscript(`✅ Highlighted in ${colorName}!`);
                    }
                    return true;
                }
            }
        }
        
        if (t.includes('remove highlight') || t.includes('clear highlight') || t.includes('unhighlight')) {
            document.querySelectorAll('.voice-highlighted').forEach(el => {
                el.style.transition = 'background-color 0.4s ease';
                el.style.backgroundColor = '';
                el.style.borderRadius = '';
                el.style.padding = '';
                el.style.color = '';
                el.classList.remove('voice-highlighted');
            });
            setVoiceTranscript('✅ Highlight removed!');
            return true;
        }
        
        return false; // Not a UI command — treat as a chat message
    }
    
    // ── Voice Help Overlay ─────────────────────────────────────────────────
    function showVoiceHelp() {
        let helpPanel = document.getElementById('voice-help-panel');
        if (helpPanel) { helpPanel.remove(); return; }
        
        helpPanel = document.createElement('div');
        helpPanel.id = 'voice-help-panel';
        helpPanel.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px; padding: 24px; z-index: 999999; width: 480px; max-height: 70vh;
            overflow-y: auto; font-family: Inter, sans-serif; color: #e2e8f0;
            backdrop-filter: blur(20px); box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        `;
        helpPanel.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;background:linear-gradient(135deg,#10b981,#3b82f6);border-radius:8px;display:flex;align-items:center;justify-content:center;">
                        <i class="ph ph-microphone" style="color:white;font-size:16px;"></i>
                    </div>
                    <strong style="font-size:16px;">Voice Commands</strong>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:18px;">✕</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
                <div>
                    <div style="color:#c084fc;font-weight:600;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Navigation</div>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${[
                            ['Go to chat','Main chat page'],
                            ['Split chat','Split co-pilot'],
                            ['Mind map','Infinite canvas'],
                            ['Voice studio','Voice tools'],
                            ['Code analyzer','Code analysis'],
                            ['Legal analyzer','Legal tools'],
                            ['Drug scanner','Drug checks'],
                            ['Symptom checker','Medical help'],
                        ].map(([cmd,desc]) => `<div style="padding:6px 10px;background:rgba(255,255,255,0.04);border-radius:8px;"><span style="color:#f8fafc;">"${cmd}"</span><br><span style="color:#64748b;font-size:11px;">${desc}</span></div>`).join('')}
                    </div>
                </div>
                <div>
                    <div style="color:#60a5fa;font-weight:600;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Actions</div>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${[
                            ['New chat','Start fresh conversation'],
                            ['Scroll down / up','Navigate the chat'],
                            ['Read last response','Speak AI reply aloud'],
                            ['Stop reading','Stop text-to-speech'],
                            ['Copy response','Copy to clipboard'],
                            ['Highlight in yellow','Color last response'],
                            ['Open lens','Toggle AI Lens'],
                            ['Open sidebar','Toggle sidebar'],
                            ['Open canvas','Toggle memory canvas'],
                            ['Bigger text / Smaller text','Adjust font size'],
                            ['Open profile','View your profile'],
                            ['Developer HUD','Toggle dev panel'],
                        ].map(([cmd,desc]) => `<div style="padding:6px 10px;background:rgba(255,255,255,0.04);border-radius:8px;"><span style="color:#f8fafc;">"${cmd}"</span><br><span style="color:#64748b;font-size:11px;">${desc}</span></div>`).join('')}
                    </div>
                </div>
            </div>
            <p style="color:#64748b;font-size:11px;text-align:center;margin-top:16px;">Any other phrase is sent directly as a message to the AI</p>
        `;
        document.body.appendChild(helpPanel);
        setVoiceTranscript('📖 Voice commands guide shown');
    }

    
    // ── Speech result handler ──────────────────────────────────────────────
    let lastFinalTranscript = '';
    
    recognition.onresult = function(event) {
        let interimText = '';
        let finalText   = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
                finalText += res[0].transcript;
            } else {
                interimText += res[0].transcript;
            }
        }
        
        // Show live transcript in indicator
        setVoiceTranscript(finalText || interimText || 'Listening…');
        
        if (finalText) {
            const text = finalText.trim();
            if (text === lastFinalTranscript) return; // Deduplicate
            lastFinalTranscript = text;
            
            // Try UI command first; if not, send to AI
            const wasCommand = handleVoiceCommand(text);
            if (!wasCommand) {
                setVoiceTranscript(`Sending: "${text}"`);
                sendVoicePrompt(text);
            }
            
            // Reset silence timer
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                setVoiceTranscript('Listening…');
                lastFinalTranscript = '';
            }, 2000);
        }
    };
    
    recognition.onstart = function() {
        voiceActive = true;
        showVoiceIndicator();
        console.log('[AI Voice] Listening…');
    };
    
    recognition.onerror = function(e) {
        console.warn('[AI Voice] Error:', e.error);
        if (e.error !== 'no-speech') {
            setVoiceTranscript(`Error: ${e.error}`);
        }
    };
    
    recognition.onend = function() {
        // Auto-restart to keep it alive
        if (voiceActive) {
            setTimeout(() => {
                try { recognition.start(); } catch(err) {}
            }, 300);
        }
    };
    
    // ── Expose start/stop for voice studio button ──────────────────────────
    window.startVoiceUI = function() {
        voiceActive = true;
        try { recognition.start(); } catch(e) {}
    };
    window.stopVoiceUI = function() {
        voiceActive = false;
        hideVoiceIndicator();
        try { recognition.stop(); } catch(e) {}
    };
    
    // Start on first user interaction (browser policy requires this)
    document.addEventListener('click', function startOnce() {
        if (!voiceActive) {
            voiceActive = true;
            try { recognition.start(); } catch(e) {}
        }
        document.removeEventListener('click', startOnce);
    });

} else {
    console.warn('[AI Voice] SpeechRecognition not supported in this browser.');
}
