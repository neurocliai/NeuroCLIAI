// scratchpad.js

const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const container = document.querySelector('.canvas-container');

// Drawing State
let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#ffffff';
let currentSize = 6;

// Resize canvas to fit container
function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    // Set default background so captured image isn't transparent
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Drawing Logic
function startPosition(e) {
    isDrawing = true;
    draw(e);
}

function endPosition() {
    isDrawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!isDrawing) return;

    // Get precise mouse/touch coordinates
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';

    if (currentTool === 'eraser') {
        ctx.strokeStyle = '#111827'; // match canvas background
    } else {
        ctx.strokeStyle = currentColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// Event Listeners for drawing
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);

// Touch support
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startPosition(e); });
canvas.addEventListener('touchend', endPosition);
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); });

// Tools UI logic
document.querySelectorAll('.draw-tool').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.draw-tool').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentTool = e.currentTarget.dataset.tool;
    });
});

document.getElementById('color-picker').addEventListener('input', (e) => {
    currentColor = e.target.value;
    if (currentTool === 'eraser') {
        // switch back to pen automatically if picking color
        document.querySelector('[data-tool="pen"]').click();
    }
});

document.getElementById('size-picker').addEventListener('input', (e) => {
    currentSize = e.target.value;
});

document.getElementById('clear-btn').addEventListener('click', () => {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    document.getElementById('results-content').innerHTML = `
        <div class="empty-state">
            <i class="ph ph-pencil-line"></i>
            <p>Canvas cleared. Draw something new!</p>
        </div>
    `;
});

// AI Analysis Logic via Secure Backend Proxy
document.getElementById('analyze-btn').addEventListener('click', async () => {
    const resultsPanel = document.getElementById('results-content');
    
    resultsPanel.innerHTML = `
        <div class="ocr-loading" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-secondary);">
            <div class="spinner" style="width:30px;height:30px;border-width:3px;margin-bottom:15px;"></div>
            <p id="loading-text">Securely analyzing your drawing...</p>
        </div>
    `;

    try {
        // Capture canvas and get raw base64
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = imageDataUrl.split(',')[1];

        let apiKey = localStorage.getItem('GEMINI_API_KEY');
        if (!apiKey) {
            apiKey = prompt('NeuroCLI AI: Please enter your Gemini API Key to use Vision Scratchpad (it will be saved locally):');
            if (!apiKey) throw new Error("API Key is required to use the AI Scratchpad.");
            localStorage.setItem('GEMINI_API_KEY', apiKey);
        }

        const promptText = "You are an advanced interactive AI assistant connected to a visual scratchpad. The user has hand-drawn something, written a math equation, or sketched a UI layout. Carefully analyze the image and execute the intent. If it looks like code, write the code. If it looks like math, solve it. If it looks like a UI wireframe description, provide HTML/CSS. If it's just a regular drawing, describe it. Format your output in beautifully styled Markdown.";

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: promptText },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Data
                            }
                        }
                    ]
                }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 400 && data.error && data.error.message.includes('API key not valid')) {
                localStorage.removeItem('GEMINI_API_KEY');
                throw new Error("Invalid API Key. Please refresh and try again.");
            }
            throw new Error(data.error?.message || "Failed to analyze image via Gemini API");
        }
        
        const aiText = data.candidates[0].content.parts[0].text;

        // Render Markdown
        resultsPanel.innerHTML = `
            <div id="ai-response-container" class="ai-response">
                ${marked.parse(aiText)}
            </div>
        `;
        
        // Highlight code blocks
        if (window.Prism) Prism.highlightAllUnder(document.getElementById('ai-response-container'));

    } catch (error) {
        console.error(error);
        resultsPanel.innerHTML = `
            <div class="empty-state" style="color: #ef4444;">
                <i class="ph ph-warning-circle"></i>
                <p>Analysis failed: ${error.message}</p>
                <button onclick="localStorage.removeItem('GEMINI_API_KEY'); location.reload();" style="margin-top: 15px; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Reset API Key</button>
            </div>
            </div>
        `;
    }
});
