document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatPage = document.getElementById('chat-page');
    const startChatBtn = document.getElementById('start-chat-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const chatForm = document.getElementById('chat-form');
    const promptInput = document.getElementById('prompt-input');
    const chatContainer = document.getElementById('chat-container');
    const historyList = document.getElementById('history-list');
    const sendBtn = document.getElementById('send-btn');
    const currentChatTitle = document.getElementById('current-chat-title');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const filePreviewImg = document.getElementById('file-preview-img');
    const removeFileBtn = document.getElementById('remove-file-btn');
    
    // Premium UI Elements
    const modalOverlay = document.getElementById('modal-overlay');
    const promptModal = document.getElementById('custom-prompt-modal');
    const confirmModal = document.getElementById('custom-confirm-modal');
    const promptInputModal = document.getElementById('prompt-modal-input');
    
    const profileBtn = document.getElementById('profile-btn');
    const userProfilePanel = document.getElementById('user-profile-panel');
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const signoutBtn = document.getElementById('signout-btn');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const analyticsChartCanvas = document.getElementById('analyticsChart');

    // Developer HUD DOM
    const devHudBtn = document.getElementById('dev-hud-btn');
    const devHudPanel = document.getElementById('dev-hud-panel');
    const hudLatency = document.getElementById('hud-latency');
    const hudSpeed = document.getElementById('hud-speed');
    const hudLoad = document.getElementById('hud-load');
    let lastApiLatency = 0;
    
    let activeModalResolve = null;

    let currentImageBase64 = null;
    let currentFileBase64 = null;
    let currentFileName = null;
    let currentFileExt = null;

    // State
    let chats = JSON.parse(localStorage.getItem('neurocli_chats')) || [];
    let currentChatId = null;
    let usageChart = null;

    // Initialize
    renderHistory();
    // initThreeJS(); // Only on landing page now
    // initLandingAnimation(); // Only on landing page now

    // If history exists, load the first chat
    if (chats.length > 0) {
        loadChat(chats[0].id);
    } else {
        startNewChat();
    }

    // Event Listeners
    if (startChatBtn) {
        startChatBtn.addEventListener('click', () => {
            if (chats.length === 0) {
                startNewChat();
            } else {
                loadChat(chats[0].id);
            }
        });
    }

    const navStartBtn = document.getElementById('nav-start-btn');
    if (navStartBtn) {
        navStartBtn.addEventListener('click', () => {
            startChatBtn.click();
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            startNewChat(); // Call without arguments
        });
    }

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const ext = file.name.split('.').pop().toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Data = e.target.result;
                
                if (isImage) {
                    currentImageBase64 = base64Data;
                    currentFileBase64 = null;
                    const imgEl = document.getElementById('file-preview-img');
                    const docEl = document.getElementById('file-preview-doc');
                    if (imgEl) { imgEl.style.display = 'block'; imgEl.src = currentImageBase64; }
                    if (docEl) docEl.style.display = 'none';
                } else {
                    currentFileBase64 = base64Data;
                    currentImageBase64 = null;
                    currentFileName = file.name;
                    currentFileExt = ext;
                    const imgEl = document.getElementById('file-preview-img');
                    const docEl = document.getElementById('file-preview-doc');
                    const nameEl = document.getElementById('file-preview-name');
                    if (imgEl) imgEl.style.display = 'none';
                    if (docEl) docEl.style.display = 'flex';
                    if (nameEl) nameEl.textContent = file.name;
                }
                if (filePreviewContainer) filePreviewContainer.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        }
    });

    removeFileBtn.addEventListener('click', () => {
        fileInput.value = '';
        currentImageBase64 = null;
        currentFileBase64 = null;
        currentFileName = null;
        currentFileExt = null;
        if (filePreviewContainer) filePreviewContainer.style.display = 'none';
        const imgEl = document.getElementById('file-preview-img');
        if (imgEl) imgEl.src = '';
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = promptInput.value.trim();
        
        if (!prompt && !currentImageBase64 && !currentFileBase64) return;

        if (!currentChatId) {
            startNewChat(prompt || 'File Upload');
        }

        let finalPrompt = prompt;
        let imageUrl = currentImageBase64;
        
        // Extract text from document if present
        let extractedText = null;
        if (currentFileBase64) {
            const typingId = showTypingIndicator(); // Show loading while extracting
            try {
                const extractRes = await fetch('/api/extract-text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64_file: currentFileBase64, filename: currentFileName })
                });
                const extractData = await extractRes.json();
                removeTypingIndicator(typingId);
                
                if (extractData.success) {
                    extractedText = extractData.text;
                    finalPrompt += `\n\n[Attached File Content (${currentFileName})]:\n${extractData.text}`;
                } else {
                    addMessageToUI('ai', `System Error: Failed to extract text from ${currentFileName}. ${extractData.error}`);
                    return;
                }
            } catch (e) {
                removeTypingIndicator(typingId);
                console.error("Document extraction failed:", e);
                addMessageToUI('ai', `System Error: Could not connect to extraction service for ${currentFileName}.`);
                return;
            }
        }
        
        // Upload file to backend to get public URL (images and documents)
        let publicFileUrl = null;
        if (currentImageBase64 || currentFileBase64) {
            try {
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        base64_image: currentImageBase64 || currentFileBase64,
                        filename: currentFileName 
                    })
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    publicFileUrl = uploadData.url;
                }
            } catch (e) {
                console.error("File upload to backend failed:", e);
            }
        }
        
        imageUrl = currentImageBase64 ? publicFileUrl : null;
        let documentUrl = currentFileBase64 ? publicFileUrl : null;
        
        // Save to current chat
        const currentChat = chats.find(c => c.id === currentChatId);
        
        const newNodeId = 'node_' + Date.now();
        let fileInfo = currentFileName ? { name: currentFileName, text: extractedText, url: documentUrl } : null;
        
        currentChat.nodes[newNodeId] = {
            id: newNodeId,
            parent: currentChat.current_leaf || null,
            children: [],
            msg: { role: 'user', content: prompt, imageUrl: imageUrl, fileInfo: fileInfo }
        };
        if (currentChat.current_leaf && currentChat.nodes[currentChat.current_leaf]) {
            currentChat.nodes[currentChat.current_leaf].children.push(newNodeId);
        }
        currentChat.current_leaf = newNodeId;
        
        // Add user message (show original prompt in UI)
        addMessageToUI('user', prompt, true, imageUrl, newNodeId, currentChat, fileInfo);
        promptInput.value = '';
        autoResizeTextarea();
        
        let displayTitle = prompt;
        if (!prompt && imageUrl) displayTitle = "Image Upload";
        else if (!prompt && currentFileBase64) displayTitle = `File: ${currentFileName}`;
        
        if (currentChat.title === 'New Conversation') {
            currentChat.title = displayTitle.substring(0, 30) + (displayTitle.length > 30 ? '...' : '');
            currentChatTitle.textContent = currentChat.title;
            renderHistory();
        }
        saveChats();

        // Show typing indicator
        const typingId = showTypingIndicator();
        sendBtn.disabled = true;

        try {
            // Include image info in prompt for the text model
            let apiPrompt = finalPrompt;
            if (imageUrl) {
                apiPrompt = `[User attached an image] ${finalPrompt}`;
            }
            // Fetch from NeuroCLI AI
            if(typeof logToTerminal === 'function') logToTerminal('Encoding payload for NeuroCLI AI engine...', 'info');
            const start = performance.now();
            if(typeof logToTerminal === 'function') logToTerminal('Awaiting response stream...', 'warn');
            const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(apiPrompt)}`);
            const data = await response.text();
            if(typeof logToTerminal === 'function') logToTerminal(`Response received. Length: ${data.length} chars`, 'success');
            lastApiLatency = Math.round(performance.now() - start);

            // Extract important insights/code to spatial canvas
            if (typeof extractToCanvas === 'function') extractToCanvas(data);

            // Live DOM Morphing checks
            if (typeof applyThemeMorphing === 'function') applyThemeMorphing(data);

            removeTypingIndicator(typingId);

            // Add AI message
            const aiNodeId = 'node_' + Date.now() + '_ai';
            currentChat.nodes[aiNodeId] = {
                id: aiNodeId,
                parent: currentChat.current_leaf,
                children: [],
                msg: { role: 'ai', content: data }
            };
            if (currentChat.current_leaf && currentChat.nodes[currentChat.current_leaf]) {
                currentChat.nodes[currentChat.current_leaf].children.push(aiNodeId);
            }
            currentChat.current_leaf = aiNodeId;
            addMessageToUI('ai', data, true, null, aiNodeId, currentChat);
            saveChats();
        } catch (error) {
            removeTypingIndicator(typingId);
            addMessageToUI('ai', 'Sorry, I encountered an error. Please try again.');
        } finally {
            sendBtn.disabled = false;
            removeFileBtn.click(); // Clear the file attachment UI
        }
    });

    promptInput.addEventListener('input', autoResizeTextarea);
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    chatContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-card')) {
            promptInput.value = e.target.textContent;
            autoResizeTextarea();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    sidebarToggleBtn.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('open');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    });

    // Functions
    function startNewChat(initialPrompt = null) {
        currentChatId = Date.now().toString();
        const newChat = {
            id: currentChatId,
            title: initialPrompt ? initialPrompt.substring(0, 30) + '...' : 'New Conversation',
            nodes: {},
            current_leaf: null
        };
        chats.unshift(newChat);
        saveChats();
        renderHistory();
        
        currentChatTitle.textContent = newChat.title;
        chatContainer.innerHTML = `
            <div class="welcome-message">
                <img src="logo.svg" alt="NeuroCLI AI Logo" style="width: 3rem; height: 3rem; object-fit: contain;">
                <h3>How can I help you today?</h3>
                <div class="suggestions-grid">
                    <div class="suggestion-card">Explain quantum computing in simple terms</div>
                    <div class="suggestion-card">Write a Python script to automate file organization</div>
                    <div class="suggestion-card">What are the best practices for SEO in 2026?</div>
                    <div class="suggestion-card">Summarize the plot of Inception</div>
                    <div class="suggestion-card">Generate a creative story about a space explorer</div>
                    <div class="suggestion-card">How does blockchain technology actually work?</div>
                    <div class="suggestion-card">Give me a 3-day workout plan for beginners</div>
                    <div class="suggestion-card">Explain the difference between React and Vue</div>
                </div>
            </div>
        `;
    }

    function loadChat(id) {
        currentChatId = id;
        const chat = chats.find(c => c.id === id);
        if (!chat) return;

        currentChatTitle.textContent = chat.title;
        chatContainer.innerHTML = '';

        // Migration to tree structure
        if (chat.messages) {
            chat.nodes = {};
            let prevId = null;
            chat.messages.forEach((msg, idx) => {
                const nodeId = 'node_' + Date.now() + '_' + idx;
                chat.nodes[nodeId] = {
                    id: nodeId,
                    parent: prevId,
                    children: [],
                    msg: msg
                };
                if (prevId) {
                    chat.nodes[prevId].children.push(nodeId);
                }
                prevId = nodeId;
            });
            chat.current_leaf = prevId;
            delete chat.messages;
            saveChats();
        }

        if (!chat.current_leaf) {
            chatContainer.innerHTML = `
                <div class="welcome-message">
                    <img src="logo.svg" alt="NeuroCLI AI Logo" style="width: 3rem; height: 3rem; object-fit: contain;">
                    <h3>How can I help you today?</h3>
                    <div class="suggestions-grid">
                        <div class="suggestion-card">Explain quantum computing in simple terms</div>
                        <div class="suggestion-card">Write a Python script to automate file organization</div>
                        <div class="suggestion-card">What are the best practices for SEO in 2026?</div>
                        <div class="suggestion-card">Summarize the plot of Inception</div>
                        <div class="suggestion-card">Generate a creative story about a space explorer</div>
                        <div class="suggestion-card">How does blockchain technology actually work?</div>
                        <div class="suggestion-card">Give me a 3-day workout plan for beginners</div>
                        <div class="suggestion-card">Explain the difference between React and Vue</div>
                    </div>
                </div>
            `;
        } else {
            let activeNodes = [];
            let curr = chat.current_leaf;
            while(curr && chat.nodes[curr]) {
                activeNodes.unshift(chat.nodes[curr]);
                curr = chat.nodes[curr].parent;
            }
            activeNodes.forEach((node) => {
                addMessageToUI(node.msg.role, node.msg.content, false, node.msg.imageUrl, node.id, chat, node.msg.fileInfo);
            });
        }

        renderHistory();
        scrollToBottom();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
            
            li.innerHTML = `
                <div class="history-content">
                    <i class="ph ph-chat-circle"></i>
                    <span>${chat.title}</span>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn" onclick="renameChat('${chat.id}', event)" title="Rename">
                        <i class="ph ph-pencil-simple"></i>
                    </button>
                    <button class="history-action-btn delete" onclick="deleteChat('${chat.id}', event)" title="Delete">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;
            
            li.addEventListener('click', () => {
                loadChat(chat.id);
                document.querySelector('.sidebar').classList.remove('open');
            });
            historyList.appendChild(li);
        });
    }

    // Premium Modals Logic
    function openPromptModal(initialValue) {
        return new Promise((resolve) => {
            promptInputModal.value = initialValue;
            modalOverlay.classList.add('active');
            promptModal.classList.add('active');
            promptInputModal.focus();
            activeModalResolve = resolve;
        });
    }

    function closePromptModal(value) {
        modalOverlay.classList.remove('active');
        promptModal.classList.remove('active');
        if (activeModalResolve) activeModalResolve(value);
        activeModalResolve = null;
    }

    document.getElementById('prompt-cancel-btn').addEventListener('click', () => closePromptModal(null));
    document.getElementById('prompt-confirm-btn').addEventListener('click', () => closePromptModal(promptInputModal.value));
    promptInputModal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') closePromptModal(promptInputModal.value);
        if (e.key === 'Escape') closePromptModal(null);
    });

    function openConfirmModal() {
        return new Promise((resolve) => {
            modalOverlay.classList.add('active');
            confirmModal.classList.add('active');
            activeModalResolve = resolve;
        });
    }

    function closeConfirmModal(value) {
        modalOverlay.classList.remove('active');
        confirmModal.classList.remove('active');
        if (activeModalResolve) activeModalResolve(value);
        activeModalResolve = null;
    }

    document.getElementById('confirm-cancel-btn').addEventListener('click', () => closeConfirmModal(false));
    document.getElementById('confirm-action-btn').addEventListener('click', () => closeConfirmModal(true));

    window.renameChat = async function(id, event) {
        event.stopPropagation();
        const chat = chats.find(c => c.id === id);
        if (!chat) return;
        
        const newTitle = await openPromptModal(chat.title);
        if (newTitle !== null && newTitle.trim() !== '') {
            chat.title = newTitle.trim();
            saveChats();
            renderHistory();
            if (id === currentChatId) {
                currentChatTitle.textContent = chat.title;
            }
        }
    };

    window.deleteChat = async function(id, event) {
        event.stopPropagation();
        const confirmed = await openConfirmModal();
        if (!confirmed) return;
        
        chats = chats.filter(c => c.id !== id);
        saveChats();
        
        if (id === currentChatId) {
            if (chats.length > 0) {
                loadChat(chats[0].id);
            } else {
                startNewChat();
            }
        } else {
            renderHistory();
        }
    };

    window.previewFileText = function(nodeId) {
        if (!currentChatId || !nodeId) return;
        const currentChat = chats.find(c => c.id === currentChatId);
        if (!currentChat || !currentChat.nodes[nodeId]) return;
        
        const node = currentChat.nodes[nodeId];
        const contentDiv = document.getElementById('file-preview-modal-content');
        
        if (node.msg.fileInfo) {
            document.getElementById('file-preview-modal-title').textContent = node.msg.fileInfo.name;
            
            if (node.msg.fileInfo.url) {
                const ext = node.msg.fileInfo.name.split('.').pop().toLowerCase();
                let iframeSrc = node.msg.fileInfo.url;
                if (['docx', 'xlsx', 'pptx'].includes(ext)) {
                    iframeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(node.msg.fileInfo.url)}`;
                }
                contentDiv.innerHTML = `<iframe src="${iframeSrc}" style="width: 100%; height: 60vh; border: none; border-radius: 4px; background: white;"></iframe>`;
            } else if (node.msg.fileInfo.text) {
                contentDiv.innerHTML = `<div style="white-space: pre-wrap; font-family: monospace;">${node.msg.fileInfo.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
            } else {
                contentDiv.innerHTML = `<div>Preview not available</div>`;
            }
            
            document.getElementById('modal-overlay').classList.add('active');
            document.getElementById('file-preview-modal').classList.add('active');
        } else {
            alert("Preview is not available for this file.");
        }
    };

    window.closeFilePreviewModal = function() {
        document.getElementById('modal-overlay').classList.remove('active');
        document.getElementById('file-preview-modal').classList.remove('active');
    };

    function addMessageToUI(role, content, animate = true, imageUrl = null, nodeId = null, currentChat = null, fileInfo = null) {
        const welcome = document.querySelector('.welcome-message');
        if (welcome) welcome.remove();

        const div = document.createElement('div');
        div.className = `message ${role}`;

        let avatarContent = '';
        if (role === 'user') {
            avatarContent = '<i class="ph ph-user"></i>';
        } else {
            avatarContent = '<img src="logo.svg" alt="AI">';
        }

        let formattedContent = '';
        
        if (fileInfo) {
            formattedContent += `
                <div class="message-file-badge" onclick="previewFileText('${nodeId}')" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(15, 23, 42, 0.4); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.85rem; margin-bottom: 8px; color: var(--text-secondary); cursor: pointer; transition: all 0.2s;">
                    <i class="ph ph-file-text" style="color: var(--accent-primary);"></i>
                    <span>${fileInfo.name}</span>
                </div><br>`;
        }
        
        if (imageUrl) {
            formattedContent += `<img class="message-image" src="${imageUrl}" alt="Uploaded Image"><br>`;
        }
        
        if (role === 'ai') {
            formattedContent += marked.parse(content || '');
        } else {
            formattedContent += (content || '').replace(/\n/g, '<br>');
        }

        let actionsHtml = '';
        const encodedContent = encodeURIComponent(content || '');
        if (role === 'user') {
            actionsHtml = `
                <div class="message-actions">
                    <button class="message-action-btn" onclick="editMessage(this, '${encodedContent}', '${nodeId}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
                    <button class="message-action-btn" onclick="copyMessage('${encodedContent}')" title="Copy"><i class="ph ph-copy"></i></button>
                </div>
            `;
        } else {
            actionsHtml = `
                <div class="message-actions">
                    <button class="message-action-btn" onclick="readAloud('${encodedContent}')" title="Read Aloud"><i class="ph ph-speaker-high"></i></button>
                    <button class="message-action-btn" onclick="copyMessage('${encodedContent}')" title="Copy"><i class="ph ph-copy"></i></button>
                </div>
            `;
        }

        let branchNavHtml = '';
        if (nodeId && currentChat && currentChat.nodes[nodeId]) {
            const node = currentChat.nodes[nodeId];
            if (node.parent) {
                const parentNode = currentChat.nodes[node.parent];
                if (parentNode.children.length > 1) {
                    const idx = parentNode.children.indexOf(nodeId);
                    branchNavHtml = `
                        <div class="branch-nav">
                            <button onclick="switchBranch('${parentNode.id}', ${idx - 1})" ${idx === 0 ? 'disabled' : ''}><i class="ph ph-caret-left"></i></button>
                            <span>${idx + 1} / ${parentNode.children.length}</span>
                            <button onclick="switchBranch('${parentNode.id}', ${idx + 1})" ${idx === parentNode.children.length - 1 ? 'disabled' : ''}><i class="ph ph-caret-right"></i></button>
                        </div>
                    `;
                }
            }
        }

        div.innerHTML = `
            <div class="avatar">
                ${avatarContent}
                ${branchNavHtml}
            </div>
            <div class="message-content">${formattedContent}</div>
            ${actionsHtml}
        `;

        if (!animate) {
            div.style.animation = 'none';
        }

        chatContainer.appendChild(div);
        scrollToBottom();
        
        if (typeof updateHud === 'function') updateHud();
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.className = 'message ai';
        div.id = id;
        div.innerHTML = `
            <div class="avatar"><img src="logo.svg" alt="AI"></div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        chatContainer.appendChild(div);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const indicator = document.getElementById(id);
        if (indicator) indicator.remove();
    }

    function scrollToBottom() {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    function saveChats() {
        localStorage.setItem('neurocli_chats', JSON.stringify(chats));
        
        // Sync to backend
        if (window.currentUserUid && currentChatId) {
            const currentChat = chats.find(c => c.id === currentChatId);
            if (currentChat) {
                fetch('/api/chats/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: window.currentUserUid,
                        chat_id: currentChat.id,
                        title: currentChat.title,
                        messages: currentChat.messages
                    })
                }).catch(e => console.error("Error syncing chat to backend", e));
            }
        }
    }

    function autoResizeTextarea() {
        promptInput.style.height = 'auto';
        promptInput.style.height = (promptInput.scrollHeight) + 'px';
        if (promptInput.value === '') {
            promptInput.style.height = 'auto';
        }
    }

    // Three.js 3D Animation Background
    function initThreeJS() {
        const canvas = document.getElementById('webgl-canvas');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Create a 3D Particle Sphere
        const geometry = new THREE.IcosahedronGeometry(10, 2);
        
        // Instead of basic material, use points
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.1,
            color: 0x8b5cf6, // Accent color
            transparent: true,
            opacity: 0.8
        });

        const particlesMesh = new THREE.Points(geometry, particlesMaterial);
        scene.add(particlesMesh);
        
        // Add a secondary wireframe for a cool tech effect
        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.15
        });
        const wireframe = new THREE.LineSegments(new THREE.WireframeGeometry(geometry), wireframeMaterial);
        wireframe.scale.set(1.05, 1.05, 1.05);
        scene.add(wireframe);

        camera.position.z = 25;

        // Mouse interaction
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - window.innerWidth / 2);
            mouseY = (event.clientY - window.innerHeight / 2);
        });

        // Animation Loop
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();

            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;

            particlesMesh.rotation.y += 0.002;
            particlesMesh.rotation.x += 0.001;
            
            wireframe.rotation.y -= 0.001;
            wireframe.rotation.x -= 0.002;

            // Interactive rotation based on mouse
            particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
            particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);
            
            // Add a floating bobbing effect
            particlesMesh.position.y = Math.sin(elapsedTime * 0.5) * 1.5;
            wireframe.position.y = Math.sin(elapsedTime * 0.5) * 1.5;

            renderer.render(scene, camera);
        }

        animate();

        // Handle Resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Landing Page Fake Chat Animation
    function initLandingAnimation() {
        const fakeInput = document.getElementById('animated-chat-input');
        const fakeBody = document.getElementById('animated-chat-body');
        if (!fakeInput || !fakeBody) return;

        const script = [
            { type: 'type', text: "Explain quantum computing in simple terms." },
            { type: 'send' },
            { type: 'receive', text: "Quantum computing uses the principles of quantum mechanics to process information. While classic computers use bits (0 or 1), quantum computers use 'qubits' which can be both 0 and 1 at the same time, allowing them to solve complex problems much faster!" },
            { type: 'type', text: "That's amazing! How fast is it?" },
            { type: 'send' },
            { type: 'receive', text: "It depends on the problem! For tasks like cryptography or simulating molecules, a quantum computer could take seconds to solve what would take a supercomputer millions of years." }
        ];

        let step = 0;
        let charIndex = 0;
        
        async function runScript() {
            if (step >= script.length) {
                // reset after a delay
                await new Promise(r => setTimeout(r, 5000));
                fakeBody.innerHTML = '';
                step = 0;
            }

            const current = script[step];
            
            if (current.type === 'type') {
                if (charIndex === 0) fakeInput.textContent = '';
                
                if (charIndex < current.text.length) {
                    fakeInput.textContent += current.text.charAt(charIndex);
                    charIndex++;
                    setTimeout(runScript, Math.random() * 50 + 50); // Typing speed
                } else {
                    step++;
                    charIndex = 0;
                    setTimeout(runScript, 500); // Pause before send
                }
            } else if (current.type === 'send') {
                const text = fakeInput.textContent;
                fakeInput.textContent = '';
                addFakeMsg('user', text);
                step++;
                setTimeout(runScript, 1000); // Pause before reply
            } else if (current.type === 'receive') {
                addFakeMsg('ai', current.text);
                step++;
                setTimeout(runScript, 2000); // Pause before next input
            }
        }

        function addFakeMsg(role, text) {
            const div = document.createElement('div');
            div.className = `fake-msg fake-${role}`;
            div.textContent = text;
            fakeBody.appendChild(div);
            fakeBody.scrollTop = fakeBody.scrollHeight;
        }

        // Start loop
        setTimeout(runScript, 1000);
    }

    // User Profile Logic
    if (profileBtn) {
        profileBtn.addEventListener('click', async () => {
            userProfilePanel.classList.add('active');
            
            // Set user details
            if (window.currentUserUid) {
                profileName.textContent = window.currentUserName || "NeuroCLI User";
                profileEmail.textContent = window.currentUserEmail || "User ID: " + window.currentUserUid.substring(0, 8);
            }
            
            await fetchAndRenderAnalytics();
        });
    }

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => {
            userProfilePanel.classList.remove('active');
        });
    }

    if (signoutBtn) {
        signoutBtn.addEventListener('click', () => {
            if (window.handleSignOut) {
                window.handleSignOut();
            }
        });
    }

    async function fetchAndRenderAnalytics() {
        if (!window.currentUserUid) return;
        
        try {
            const res = await fetch(`/api/users/analytics?user_id=${window.currentUserUid}`);
            const data = await res.json();
            
            if (data.success) {
                renderChart(data.metrics);
            }
        } catch (e) {
            console.error("Error fetching analytics", e);
        }
    }

    function renderChart(metrics) {
        const ctx = document.getElementById('apiUsageChart');
        if (!ctx) return;
        
        if (usageChart) {
            usageChart.destroy();
        }

        usageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Last 24 Hrs', 'Last 7 Days', 'Last 30 Days'],
                datasets: [{
                    label: 'API Requests (Messages)',
                    data: [metrics.day, metrics.week, metrics.month],
                    backgroundColor: [
                        'rgba(56, 189, 248, 0.6)',
                        'rgba(168, 85, 247, 0.6)',
                        'rgba(236, 72, 153, 0.6)'
                    ],
                    borderColor: [
                        'rgba(56, 189, 248, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(236, 72, 153, 1)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#94a3b8',
                            stepSize: 1,
                            precision: 0
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Developer HUD Logic
    if (devHudBtn) {
        devHudBtn.addEventListener('click', () => {
            devHudPanel.classList.toggle('active');
            if (devHudPanel.classList.contains('active')) {
                updateHud();
            }
        });
    }

    window.updateHud = function() {
        if (!devHudPanel || !devHudPanel.classList.contains('active')) return;
        
        if (hudLatency) {
            const seconds = (lastApiLatency / 1000).toFixed(2);
            hudLatency.textContent = lastApiLatency ? `${seconds}s` : '0.00s';
        }
        
        // Mock speed logic based on latency
        if (hudSpeed) {
            const speed = lastApiLatency ? Math.floor(Math.random() * 20 + 15) : 0;
            hudSpeed.textContent = `${speed} t/s`;
        }
        
        // Mock load logic
        if (hudLoad) {
            const load = Math.floor(Math.random() * 30 + 30);
            hudLoad.textContent = `${load}%`;
        }
    };

    // Global Message Actions
    window.copyMessage = function(encodedText) {
        navigator.clipboard.writeText(decodeURIComponent(encodedText)).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    };

    window.readAloud = function(encodedText) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const text = decodeURIComponent(encodedText).replace(/[#*`_>]/g, '');
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Your browser does not support text-to-speech.");
        }
    };

    window.switchBranch = function(parentId, childIdx) {
        const currentChat = chats.find(c => c.id === currentChatId);
        if (!currentChat || !currentChat.nodes[parentId]) return;
        const parentNode = currentChat.nodes[parentId];
        if (childIdx >= 0 && childIdx < parentNode.children.length) {
            let leafId = parentNode.children[childIdx];
            while (currentChat.nodes[leafId] && currentChat.nodes[leafId].children.length > 0) {
                leafId = currentChat.nodes[leafId].children[currentChat.nodes[leafId].children.length - 1];
            }
            currentChat.current_leaf = leafId;
            saveChats();
            loadChat(currentChatId);
        }
    };

    window.editMessage = function(btnElement, encodedText, nodeId) {
        if (!nodeId) return;
        const messageDiv = btnElement.closest('.message');
        const contentDiv = messageDiv.querySelector('.message-content');
        const originalText = decodeURIComponent(encodedText);
        
        const textarea = document.createElement('textarea');
        textarea.className = 'edit-textarea';
        textarea.value = originalText;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'edit-actions';
        actionsDiv.innerHTML = `
            <button class="secondary-btn small-btn" onclick="cancelEdit(this, '${encodedText}')">Cancel</button>
            <button class="primary-btn small-btn" onclick="saveEdit(this, '${nodeId}')">Save & Resubmit</button>
        `;
        
        contentDiv.innerHTML = '';
        contentDiv.appendChild(textarea);
        contentDiv.appendChild(actionsDiv);
        btnElement.closest('.message-actions').style.display = 'none';
    };

    window.cancelEdit = function(btnElement, encodedText) {
        const messageDiv = btnElement.closest('.message');
        const contentDiv = messageDiv.querySelector('.message-content');
        const text = decodeURIComponent(encodedText);
        contentDiv.innerHTML = text.replace(/\\n/g, '<br>');
        messageDiv.querySelector('.message-actions').style.display = 'flex';
    };

    window.saveEdit = async function(btnElement, nodeId) {
        const messageDiv = btnElement.closest('.message');
        const textarea = messageDiv.querySelector('.edit-textarea');
        const newText = textarea.value.trim();
        if (!newText) return;
        
        const currentChat = chats.find(c => c.id === currentChatId);
        if (!currentChat || !currentChat.nodes[nodeId]) return;

        // Branching: Create a new child of the edited node's parent
        const parentId = currentChat.nodes[nodeId].parent;
        const newNodeId = 'node_' + Date.now();
        currentChat.nodes[newNodeId] = {
            id: newNodeId,
            parent: parentId,
            children: [],
            msg: { role: 'user', content: newText }
        };
        
        if (parentId && currentChat.nodes[parentId]) {
            currentChat.nodes[parentId].children.push(newNodeId);
        } else if (!parentId) {
            // It's the root node being edited, but since we don't have multiple roots, we can just replace or we can handle it if we ever support multiple roots. Usually chat always has 1 root or we just let it be disconnected and reset leaf.
            // Wait, actually if parentId is null, it's the very first message!
            // Let's just create a new root-like structure, but for simplicity, we usually don't branch the absolute root without a container, but it's fine since we traverse from leaf up. 
        }
        currentChat.current_leaf = newNodeId;
        saveChats();
        loadChat(currentChatId);
        saveChats();
        loadChat(currentChatId);
        
        // Trigger AI Fetch
        const typingId = showTypingIndicator();
        try {
            const start = performance.now();
            const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(newText)}`);
            const data = await response.text();
            lastApiLatency = Math.round(performance.now() - start);

            if (typeof extractToCanvas === 'function') extractToCanvas(data);

            removeTypingIndicator(typingId);
            const aiNodeId = 'node_' + Date.now() + '_ai';
            currentChat.nodes[aiNodeId] = {
                id: aiNodeId,
                parent: currentChat.current_leaf,
                children: [],
                msg: { role: 'ai', content: data }
            };
            if (currentChat.current_leaf && currentChat.nodes[currentChat.current_leaf]) {
                currentChat.nodes[currentChat.current_leaf].children.push(aiNodeId);
            }
            currentChat.current_leaf = aiNodeId;
            saveChats();
            loadChat(currentChatId);
        } catch (error) {
            removeTypingIndicator(typingId);
            addMessageToUI('ai', 'Error getting response.');
        }
    };
});
// ============================================================================
// SPATIAL MEMORY CANVAS
// ============================================================================

const canvasBtn = document.getElementById('canvas-btn');
const spatialCanvas = document.getElementById('spatial-canvas');
const canvasBoard = document.getElementById('canvas-board');
const chatInputArea = document.querySelector('.input-area');
const promptInputTextarea = document.getElementById('prompt-input');

if (canvasBtn && spatialCanvas) {
    canvasBtn.addEventListener('click', () => {
        spatialCanvas.classList.toggle('open');
        canvasBtn.classList.toggle('active');
    });
}

function extractToCanvas(aiResponse) {
    if (!spatialCanvas || !canvasBoard) return;
    
    // Look for code blocks
    const codeRegex = /`[\s\S]*?`/g;
    const codes = aiResponse.match(codeRegex);
    
    if (codes && codes.length > 0) {
        // Automatically open the canvas if closed to show the user
        if (!spatialCanvas.classList.contains('open')) {
            spatialCanvas.classList.add('open');
            if (canvasBtn) canvasBtn.classList.add('active');
        }

        codes.forEach(codeText => {
            // Strip the markdown ticks if we want, but keeping them is fine for the sticky note
            createStickyNote(codeText, 'Code Snippet');
        });
    }
}

function createStickyNote(content, title="Note") {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    
    // Random position within canvas board bounds
    // Rough estimate, width ~250px
    const maxX = Math.max(0, canvasBoard.clientWidth - 260);
    const maxY = Math.max(0, canvasBoard.clientHeight - 200);
    
    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY) + 10;
    
    note.style.left = randomX + 'px';
    note.style.top = randomY + 'px';

    const header = document.createElement('div');
    header.className = 'sticky-header';
    header.innerHTML = `
        <div class="sticky-drag-handle"><i class="ph ph-dots-six"></i> ${title}</div>
        <button class="sticky-close"><i class="ph ph-x"></i></button>
    `;

    const body = document.createElement('div');
    body.className = 'sticky-content';
    // Use marked if available to render code nicely
    if (window.marked) {
        body.innerHTML = marked.parse(content);
    } else {
        body.innerText = content;
    }

    note.appendChild(header);
    note.appendChild(body);
    canvasBoard.appendChild(note);

    // Close btn
    header.querySelector('.sticky-close').addEventListener('click', () => {
        note.remove();
    });

    // Drag and Drop Logic
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    const dragHandle = header.querySelector('.sticky-drag-handle');
    
    dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = parseInt(note.style.left || 0);
        initialTop = parseInt(note.style.top || 0);
        note.style.zIndex = '999';
        
        // Add overlay effect on chat input
        if (chatInputArea) chatInputArea.classList.add('drag-over');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        note.style.left = (initialLeft + dx) + 'px';
        note.style.top = (initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        note.style.zIndex = '100';
        
        if (chatInputArea) chatInputArea.classList.remove('drag-over');

        // Check if dropped over chat input
        if (chatInputArea && promptInputTextarea) {
            const rect = chatInputArea.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                
                // Append text to chat input
                const currentVal = promptInputTextarea.value;
                promptInputTextarea.value = currentVal + (currentVal ? '\n\n' : '') + content;
                // Auto resize textarea
                if (typeof autoResizeTextarea === 'function') {
                    autoResizeTextarea({ target: promptInputTextarea });
                }
                
                // Optional: flash input to show drop success
                chatInputArea.style.background = 'rgba(139, 92, 246, 0.2)';
                setTimeout(() => chatInputArea.style.background = '', 300);
            }
        }
    });
}
// ============================================================================
// GLASS BOX TERMINAL
// ============================================================================

const hudTerminal = document.getElementById('hud-terminal');
function logToTerminal(message, type = 'info') {
    if (!hudTerminal) return;
    const line = document.createElement('div');
    line.className = 'terminal-line';
    
    const time = new Date().toISOString().substring(11, 19);
    let typeClass = '';
    if (type === 'warn') typeClass = 'term-warn';
    if (type === 'error') typeClass = 'term-err';
    if (type === 'success') typeClass = 'term-success';
    
    line.innerHTML = `<span class="term-time">[${time}]</span> <span class="${typeClass}">${message}</span>`;
    hudTerminal.appendChild(line);
    hudTerminal.scrollTop = hudTerminal.scrollHeight;
}
// ============================================================================
// LIVE DOM MORPHING (THEMES)
// ============================================================================

function applyThemeMorphing(aiResponse) {
    if (aiResponse.includes('[THEME:HACKER]')) {
        document.body.className = 'theme-hacker';
        if(typeof logToTerminal === 'function') logToTerminal('Executing DOM Morph: HACKER THEME applied', 'warn');
    } 
    else if (aiResponse.includes('[THEME:MINIMAL]')) {
        document.body.className = 'theme-minimal';
        if(typeof logToTerminal === 'function') logToTerminal('Executing DOM Morph: MINIMAL THEME applied', 'info');
    }
    else if (aiResponse.includes('[THEME:DEFAULT]')) {
        document.body.className = '';
        if(typeof logToTerminal === 'function') logToTerminal('Executing DOM Morph: DEFAULT THEME restored', 'info');
    }
}
// ============================================================================
// DIRECT SAVE TO DISK (HOLOGRAM EDITOR)
// ============================================================================

async function saveCodeToDisk(codeText, filename = 'script.py') {
    if(typeof logToTerminal === 'function') logToTerminal(`Saving ${filename} to local disk...`, 'info');
    try {
        // Assume backend is on port 5000 as configured in typical setups
        // Need to know the actual backend URL, but let's assume it's running locally 
        const response = await fetch('http://127.0.0.1:5000/api/save_file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, content: codeText })
        });
        const data = await response.json();
        if (data.success) {
            if(typeof logToTerminal === 'function') logToTerminal(`Saved successfully: ${data.path}`, 'success');
            alert(`File saved to your PC: ${data.path}`);
        } else {
            if(typeof logToTerminal === 'function') logToTerminal(`Save error: ${data.error}`, 'error');
            alert(`Failed to save: ${data.error}`);
        }
    } catch (e) {
        console.error(e);
        if(typeof logToTerminal === 'function') logToTerminal(`Save failed (Is Python backend running?): ${e.message}`, 'error');
        alert('Could not connect to Python backend to save file. Make sure it is running.');
    }
}

// Event delegation to add "Save to PC" buttons to code blocks
document.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'PRE') {
        if (!e.target.querySelector('.save-to-pc-btn')) {
            const btn = document.createElement('button');
            btn.className = 'save-to-pc-btn';
            btn.innerHTML = '<i class="ph ph-hard-drives"></i> Save to PC';
            btn.style.position = 'absolute';
            btn.style.top = '5px';
            btn.style.right = '40px'; // Next to standard copy button if it exists
            btn.style.padding = '4px 8px';
            btn.style.background = 'rgba(139, 92, 246, 0.8)';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '0.75rem';
            
            // Ensure pre is positioned relative so the absolute button works
            e.target.style.position = 'relative';
            
            btn.addEventListener('click', () => {
                // Find the code element inside
                const codeEl = e.target.querySelector('code');
                const text = codeEl ? codeEl.innerText : e.target.innerText.replace('Save to PC', '').trim();
                
                // Prompt user for filename
                const filename = prompt('Enter filename to save as:', 'script.py');
                if (filename) {
                    saveCodeToDisk(text, filename);
                }
            });
            
            e.target.appendChild(btn);
        }
    }
});
