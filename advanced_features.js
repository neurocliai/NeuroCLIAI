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
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = function() {
        console.log("Voice-to-UI listening...");
        // Add a visual indicator
        if(!document.getElementById('voice-listening-indicator')) {
            const ind = document.createElement('div');
            ind.id = 'voice-listening-indicator';
            ind.innerHTML = '<i class="ph ph-microphone"></i> Voice UI Active';
            ind.style.position = 'fixed';
            ind.style.bottom = '20px';
            ind.style.left = '20px';
            ind.style.background = 'rgba(16, 185, 129, 0.2)';
            ind.style.color = '#10b981';
            ind.style.border = '1px solid #10b981';
            ind.style.padding = '8px 12px';
            ind.style.borderRadius = '20px';
            ind.style.fontSize = '12px';
            ind.style.zIndex = '9999';
            ind.style.display = 'flex';
            ind.style.alignItems = 'center';
            ind.style.gap = '6px';
            ind.style.animation = 'voicepulse 2s infinite';
            
            const style = document.createElement('style');
            style.innerHTML = '@keyframes voicepulse { 0% { opacity: 0.7; } 50% { opacity: 1; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); } 100% { opacity: 0.7; } }';
            document.head.appendChild(style);
            document.body.appendChild(ind);
        }
    };
    
    let lastProcessedTranscript = '';
    
    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        const text = (finalTranscript || interimTranscript).toLowerCase();
        
        if (text === lastProcessedTranscript) return;
        lastProcessedTranscript = text;
        
        // UI Morphing logic based on speech
        if (text.includes('make that last paragraph red') || text.includes('make it red')) {
            const msgs = document.querySelectorAll('.message-content, p, div');
            if(msgs.length > 0) {
                // Find a decent target, like the last message or element
                const target = document.querySelector('.message:last-child') || msgs[msgs.length - 1];
                target.style.transition = 'all 0.5s ease';
                target.style.color = '#f87171'; // red
            }
        }
        
        if (text.includes('actually make it blue') || text.includes('make it blue')) {
            const msgs = document.querySelectorAll('.message:last-child, .message-content');
            if(msgs.length > 0) {
                const target = document.querySelector('.message:last-child') || msgs[msgs.length - 1];
                target.style.transition = 'all 0.5s ease';
                target.style.color = '#60a5fa'; // blue
            }
        }
        
        if (text.includes('move it to the top') || text.includes('move to top') || text.includes('move to the top')) {
            const container = document.getElementById('chat-container') || document.body;
            const target = document.querySelector('.message:last-child');
            if(target && container) {
                target.style.transition = 'transform 0.5s ease';
                container.prepend(target);
                container.scrollTop = 0;
            }
        }
    };
    
    recognition.onend = function() {
        // Auto-restart if it stops naturally
        setTimeout(() => {
            try { recognition.start(); } catch(e) {}
        }, 1000);
    };
    
    // Start listening on first user interaction to bypass browser autoplay blocks
    document.addEventListener('click', () => {
        try { recognition.start(); } catch(e) {}
    }, { once: true });
}
