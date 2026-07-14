// Thought-Lens (Hover-to-Explain)
document.addEventListener('mouseover', (e) => {
    // Trigger if Alt key is pressed and we are not hovering over the popover itself
    if (e.altKey && e.target.id !== 'thought-lens-popover' && !e.target.closest('#thought-lens-popover')) {
        let targetNode = e.target;
        
        if (!document.getElementById('thought-lens-popover')) {
            const popover = document.createElement('div');
            popover.id = 'thought-lens-popover';
            popover.style.position = 'absolute';
            popover.style.background = 'rgba(15, 23, 42, 0.95)';
            popover.style.border = '1px solid #3b82f6';
            popover.style.color = '#e2e8f0';
            popover.style.padding = '12px';
            popover.style.borderRadius = '8px';
            popover.style.zIndex = '99999';
            popover.style.pointerEvents = 'none';
            popover.style.backdropFilter = 'blur(4px)';
            popover.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
            popover.style.fontSize = '12px';
            popover.style.fontFamily = 'monospace';
            popover.style.maxWidth = '250px';
            document.body.appendChild(popover);
        }
        
        const popover = document.getElementById('thought-lens-popover');
        
        // Extract a word from the text content
        const textContent = targetNode.innerText || targetNode.textContent;
        if (!textContent || textContent.trim() === '') return;
        
        const wordMatch = textContent.trim().match(/\b\w+\b/g);
        const word = wordMatch ? wordMatch[0] : 'element';
        
        const probabilities = [0.98, 0.94, 0.89, 0.99, 0.95, 0.82];
        const prob = probabilities[Math.floor(Math.random() * probabilities.length)];
        const reasons = [
            "Matches semantic intent of user query.",
            "Highest probability token in this context.",
            "Aligned with system prompt formatting constraints.",
            "Optimal choice based on preceding n-gram context.",
            "Selected via beam search optimization.",
            "Maintains referential coherence with previous turn."
        ];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        
        // Highlight the hovered element temporarily
        const originalBg = targetNode.style.backgroundColor;
        const originalOutline = targetNode.style.outline;
        targetNode.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
        targetNode.style.outline = '1px dashed #3b82f6';
        targetNode.style.borderRadius = '4px';
        
        // Save the element so we can reset it on mouseout
        popover.dataset.targetElementId = Math.random().toString(36).substr(2, 9);
        targetNode.dataset.lensId = popover.dataset.targetElementId;
        targetNode.dataset.origBg = originalBg || '';
        targetNode.dataset.origOutline = originalOutline || '';
        
        popover.innerHTML = `
            <strong style="color: #60a5fa; font-size: 14px;">Focus: "${word.substring(0, 20)}"</strong><br/>
            <span style="color: #34d399;">Probability: ${(prob * 100).toFixed(1)}%</span><br/>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">
                <i class="ph ph-info"></i> ${reason}
            </div>
        `;
        
        popover.style.left = (e.pageX + 15) + 'px';
        popover.style.top = (e.pageY + 15) + 'px';
        popover.style.display = 'block';
    }
});

document.addEventListener('mousemove', (e) => {
    const popover = document.getElementById('thought-lens-popover');
    if (popover && popover.style.display === 'block') {
        if (!e.altKey) {
            popover.style.display = 'none';
            resetLensHighlight();
        } else {
            popover.style.left = (e.pageX + 15) + 'px';
            popover.style.top = (e.pageY + 15) + 'px';
        }
    }
});

document.addEventListener('mouseout', (e) => {
    // We only hide if we're moving completely out of a lens-targeted element
    if (e.target.dataset && e.target.dataset.lensId) {
        const popover = document.getElementById('thought-lens-popover');
        if (popover) {
            popover.style.display = 'none';
        }
        resetLensHighlight();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') {
        const popover = document.getElementById('thought-lens-popover');
        if (popover) {
            popover.style.display = 'none';
        }
        resetLensHighlight();
    }
});

function resetLensHighlight() {
    document.querySelectorAll('[data-lens-id]').forEach(el => {
        el.style.backgroundColor = el.dataset.origBg || '';
        el.style.outline = el.dataset.origOutline || '';
        delete el.dataset.lensId;
        delete el.dataset.origBg;
        delete el.dataset.origOutline;
    });
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
