/**
 * AI Code Assistant Chatbot - FIXED VERSION
 * This script creates a floating chatbot interface that connects to AI services via API
 * to provide code debugging and snippet generation capabilities.
 */
// Configuration
const CONFIG = {
    apiEndpoint: "/api/chat", // This needs to be changed to match your actual API endpoint
    apiMethod: "GET",        // Changed from POST to GET since your server might only accept GET
    model: "gpt-3.5-turbo",  // The AI model to use
    systemPrompt: "You are an AI assistant specialized in helping with coding problems and generating code snippets. Keep responses clear and concise with well-formatted code examples.",
    maxRetries: 3,
    retryDelay: 2000,
    temperature: 0.7,
    bubbleSize: "60px",
    primaryColor: "#4a6cf7",
    secondaryColor: "#6c757d",
    lightColor: "#f8f9fa",
    darkColor: "#343a40",
    maxChatHistory: 20,
    useLocalFallback: true,  // Enable fallback mode if API fails
    corsProxyUrl: ""         // Optional CORS proxy if needed: "https://cors-anywhere.herokuapp.com/"
};

// Chat history storage
let chatHistory = [];

// DOM elements reference (will be initialized when DOM is ready)
let elements = {};

/**
 * Initialize the chatbot by creating necessary DOM elements and setting up event listeners
 */
function initChatbot() {
    createChatbotElements();
    setupEventListeners();
    loadChatHistory();
    
    // Check API connectivity on initialization
    checkApiConnectivity();
}

/**
 * Check if the API is accessible
 */
async function checkApiConnectivity() {
    try {
        // Simple API health check - modify according to your API
        const apiUrl = new URL(CONFIG.apiEndpoint, window.location.origin);
        const response = await fetch(apiUrl.toString(), {
            method: 'HEAD',  // Just check if endpoint exists without sending data
            cache: 'no-cache'
        });
        
        if (response.ok) {
            console.log("Chatbot API connection successful");
            setStatusIndicator("Connected to AI service", false);
        } else {
            console.warn(`API connectivity check failed with status ${response.status}`);
            setStatusIndicator("Using offline mode - API connection failed", true);
            CONFIG.useLocalFallback = true;
        }
    } catch (error) {
        console.warn("API connectivity check failed:", error);
        setStatusIndicator("Using offline mode - API unreachable", true);
        CONFIG.useLocalFallback = true;
    }
}

/**
 * Create all chatbot DOM elements and append them to the body
 */
function createChatbotElements() {
    // Create chat bubble
    const chatBubble = document.createElement('div');
    chatBubble.className = 'chat-bubble';
    chatBubble.innerHTML = '<i class="fas fa-robot"></i>';
    chatBubble.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: ${CONFIG.bubbleSize};
        height: ${CONFIG.bubbleSize};
        background-color: ${CONFIG.primaryColor};
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 999;
        transition: all 0.3s ease;
    `;

    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    chatContainer.style.cssText = `
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        background-color: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        display: none;
        flex-direction: column;
        z-index: 998;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    // Create chat header
    const chatHeader = document.createElement('div');
    chatHeader.className = 'chat-header';
    chatHeader.style.cssText = `
        padding: 15px;
        background-color: ${CONFIG.primaryColor};
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    chatHeader.innerHTML = `
        <div class="chat-title" style="display: flex; align-items: center; gap: 10px;">
            <div class="avatar" style="width: 30px; height: 30px; background-color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: ${CONFIG.primaryColor}; font-weight: bold; font-size: 14px;">AI</div>
            <h3 style="font-weight: 600; font-size: 16px;">Code Assistant</h3>
        </div>
        <div style="display: flex; align-items: center;">
            <button class="clear-chat" style="background: none; border: none; color: white; cursor: pointer; margin-right: 10px;">
                <i class="fas fa-trash-alt"></i>
            </button>
            <button class="close-chat" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Create chat messages container
    const chatMessages = document.createElement('div');
    chatMessages.className = 'chat-messages';
    chatMessages.style.cssText = `
        flex: 1;
        padding: 15px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;

    // Add welcome message
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'welcome-message';
    welcomeMessage.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: ${CONFIG.secondaryColor};
    `;
    welcomeMessage.innerHTML = `
        <h2 style="margin-bottom: 10px; color: ${CONFIG.primaryColor};">AI Code Assistant</h2>
        <p style="margin-bottom: 20px;">Ask me questions about code debugging or request code snippets!</p>
    `;
    chatMessages.appendChild(welcomeMessage);

    // Create chat input area
    const chatInput = document.createElement('div');
    chatInput.className = 'chat-input';
    chatInput.style.cssText = `
        padding: 15px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 10px;
    `;

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Type your message here...';
    textarea.rows = 1;
    textarea.style.cssText = `
        flex: 1;
        padding: 10px 15px;
        border-radius: 20px;
        border: 1px solid #ddd;
        outline: none;
        resize: none;
        font-family: inherit;
        height: 45px;
        max-height: 120px;
        transition: height 0.3s ease;
    `;

    const sendButton = document.createElement('button');
    sendButton.className = 'send-button';
    sendButton.disabled = true;
    sendButton.style.cssText = `
        background-color: ${CONFIG.primaryColor};
        color: white;
        border: none;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
        opacity: 0.5;
    `;
    sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';

    // Add status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'status-indicator';
    statusIndicator.style.cssText = `
        padding: 5px 10px;
        text-align: center;
        font-size: 12px;
        color: #6c757d;
        border-top: 1px solid #eee;
        display: none;
    `;
    statusIndicator.textContent = 'Connected to AI service';

    // Assemble the chat input
    chatInput.appendChild(textarea);
    chatInput.appendChild(sendButton);

    // Assemble the chat container
    chatContainer.appendChild(chatHeader);
    chatContainer.appendChild(chatMessages);
    chatContainer.appendChild(statusIndicator);
    chatContainer.appendChild(chatInput);

    // Add all elements to the document
    document.body.appendChild(chatBubble);
    document.body.appendChild(chatContainer);

    // Add Font Awesome if not already present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }

    // Add highlight.js if not already present
    if (!document.querySelector('link[href*="highlight"]')) {
        const highlightCSS = document.createElement('link');
        highlightCSS.rel = 'stylesheet';
        highlightCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css';
        document.head.appendChild(highlightCSS);

        const highlightJS = document.createElement('script');
        highlightJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js';
        document.head.appendChild(highlightJS);
    }

    // Add marked for markdown parsing if not already present
    if (!window.marked && !document.querySelector('script[src*="marked"]')) {
        const markedJS = document.createElement('script');
        markedJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/5.0.2/marked.min.js';
        document.head.appendChild(markedJS);
    }

    // Store references to DOM elements
    elements = {
        chatBubble,
        chatContainer,
        chatMessages,
        textarea,
        sendButton,
        welcomeMessage,
        statusIndicator
    };
}

/**
 * Set up all event listeners for the chatbot interface
 */
function setupEventListeners() {
    // Ensure all elements exist before adding listeners
    if (!elements.chatBubble || !elements.chatContainer) {
        console.error('Chatbot elements not initialized');
        return;
    }

    // Auto-resize textarea
    elements.textarea.addEventListener('input', () => {
        elements.textarea.style.height = 'auto';
        elements.textarea.style.height = (elements.textarea.scrollHeight < 120) ? 
            `${elements.textarea.scrollHeight}px` : '120px';
        
        // Enable/disable send button based on input
        const isEmpty = elements.textarea.value.trim() === '';
        elements.sendButton.disabled = isEmpty;
        elements.sendButton.style.opacity = isEmpty ? '0.5' : '1';
    });
    
    // Open chat
    elements.chatBubble.addEventListener('click', () => {
        elements.chatContainer.style.display = 'flex';
        // Trigger reflow
        void elements.chatContainer.offsetWidth;
        elements.chatContainer.style.opacity = '1';
        elements.chatContainer.style.transform = 'translateY(0)';
        
        // Show welcome message or initial bot message
        if (chatHistory.length === 0) {
            setTimeout(() => {
                const initialMessage = "Hi there! 👋 I'm your AI Code Assistant. How can I help you with your coding questions today?";
                addBotMessage(initialMessage);
                elements.welcomeMessage.style.display = 'none';
                
                // Add to chat history
                chatHistory.push({
                    role: 'assistant',
                    content: initialMessage
                });
                saveChatHistory();
            }, 500);
        }
    });
    
    // Close chat
    document.querySelector('.close-chat').addEventListener('click', () => {
        elements.chatContainer.style.opacity = '0';
        elements.chatContainer.style.transform = 'translateY(20px)';
        setTimeout(() => {
            elements.chatContainer.style.display = 'none';
        }, 300);
    });
    
    // Clear chat history
    document.querySelector('.clear-chat').addEventListener('click', () => {
        clearChatHistory();
    });
    
    // Send message on button click
    elements.sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter (but allow Shift+Enter for new line)
    elements.textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

/**
 * Handle sending a message from the user
 */
function sendMessage() {
    const message = elements.textarea.value.trim();
    if (message === '') return;
    
    // Add user message to chat
    addUserMessage(message);
    
    // Save to chat history
    chatHistory.push({
        role: 'user',
        content: message
    });
    saveChatHistory();
    
    // Clear input
    elements.textarea.value = '';
    elements.textarea.style.height = '45px';
    elements.sendButton.disabled = true;
    elements.sendButton.style.opacity = '0.5';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process with AI API
    processWithAI(message);
}

/**
 * Add a user message to the chat display
 * @param {string} message - The message text
 */
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.style.cssText = `
        display: flex;
        flex-direction: column;
        max-width: 80%;
        align-self: flex-end;
    `;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.style.cssText = `
        padding: 10px 15px;
        border-radius: 18px;
        background-color: ${CONFIG.primaryColor};
        color: white;
        border-bottom-right-radius: 5px;
    `;
    messageContent.textContent = message;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.style.cssText = `
        font-size: 12px;
        color: ${CONFIG.secondaryColor};
        margin-top: 5px;
        align-self: flex-end;
    `;
    messageTime.textContent = getCurrentTime();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    elements.chatMessages.appendChild(messageDiv);
    
    scrollToBottom();
}

/**
 * Add a bot message to the chat display
 * @param {string} message - The message text (can include markdown)
 */
function addBotMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.style.cssText = `
        display: flex;
        flex-direction: column;
        max-width: 80%;
        align-self: flex-start;
    `;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.style.cssText = `
        padding: 10px 15px;
        border-radius: 18px;
        background-color: ${CONFIG.lightColor};
        border-bottom-left-radius: 5px;
    `;
    
    // Process markdown and code blocks
    const markedOptions = {
        mangle: false,
        headerIds: false,
        highlight: function(code, lang) {
            if (window.hljs && lang && window.hljs.getLanguage(lang)) {
                return window.hljs.highlight(code, { language: lang }).value;
            }
            return code;
        }
    };
    
    // Check if marked library is loaded
    if (window.marked) {
        // Workaround for marked deprecation warning
        if (typeof window.marked === 'function') {
            messageContent.innerHTML = window.marked(message, markedOptions);
        } else if (window.marked.parse) {
            messageContent.innerHTML = window.marked.parse(message, markedOptions);
        } else {
            messageContent.textContent = message;
        }
    } else {
        // Fallback if marked is not loaded
        messageContent.textContent = message;
    }
    
    // Add copy buttons to code blocks
    const codeBlocks = messageContent.querySelectorAll('pre');
    codeBlocks.forEach((block) => {
        // Wrap in a div for positioning
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        wrapper.style.cssText = `position: relative;`;
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);
        
        // Add copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background-color: rgba(255, 255, 255, 0.8);
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        copyButton.textContent = 'Copy';
        copyButton.onclick = function() {
            const code = block.textContent;
            navigator.clipboard.writeText(code).then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            });
        };
        wrapper.appendChild(copyButton);
    });
    
    // Highlight code if highlight.js is available
    if (window.hljs) {
        messageContent.querySelectorAll('pre code').forEach((block) => {
            window.hljs.highlightElement(block);
        });
    }
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.style.cssText = `
        font-size: 12px;
        color: ${CONFIG.secondaryColor};
        margin-top: 5px;
        align-self: flex-start;
    `;
    messageTime.textContent = getCurrentTime();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    elements.chatMessages.appendChild(messageDiv);
    
    scrollToBottom();
}

/**
 * Show typing indicator in the chat
 */
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing';
    typingDiv.style.cssText = `
        display: flex;
        flex-direction: column;
        max-width: 80%;
        align-self: flex-start;
    `;
    
    const typingContent = document.createElement('div');
    typingContent.className = 'message-content';
    typingContent.style.cssText = `
        padding: 10px 15px;
        border-radius: 18px;
        background-color: ${CONFIG.lightColor};
        border-bottom-left-radius: 5px;
    `;
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.style.cssText = `
        display: flex;
        align-items: center;
        gap: 3px;
    `;
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        dot.style.cssText = `
            width: 6px;
            height: 6px;
            background-color: ${CONFIG.secondaryColor};
            border-radius: 50%;
            opacity: 0.7;
            animation: typing 1.5s infinite ease-in-out;
            animation-delay: ${i * 0.2}s;
        `;
        typingIndicator.appendChild(dot);
    }
    
    // Add keyframes for animation if not already present
    if (!document.querySelector('style[data-chatbot-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-chatbot-styles', 'true');
        style.textContent = `
            @keyframes typing {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    typingContent.appendChild(typingIndicator);
    typingDiv.appendChild(typingContent);
    elements.chatMessages.appendChild(typingDiv);
    
    scrollToBottom();
}

/**
 * Remove typing indicator from the chat
 */
function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Scroll to the bottom of the chat messages
 */
function scrollToBottom() {
    if (elements.chatMessages) {
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
}

/**
 * Get current time formatted as HH:MM AM/PM
 * @returns {string} Formatted time string
 */
function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    return `${hours}:${minutes} ${ampm}`;
}

/**
 * Set API status indicator
 * @param {string} status - Status message
 * @param {boolean} isError - Whether this is an error status
 */
function setStatusIndicator(status, isError = false) {
    if (elements.statusIndicator) {
        elements.statusIndicator.style.display = 'block';
        elements.statusIndicator.textContent = status;
        elements.statusIndicator.style.color = isError ? '#dc3545' : '#28a745';
        
        // Hide after 5 seconds
        setTimeout(() => {
            elements.statusIndicator.style.display = 'none';
        }, 5000);
    }
}

/**
 * Process a message using the AI API or fallback to local handler if API fails
 * @param {string} message - The user message to process
 */
async function processWithAI(message) {
    // If in fallback mode due to API issues, skip API call
    if (CONFIG.useLocalFallback && !CONFIG.apiEndpoint) {
        const fallbackResponse = fallbackMessageHandler(message);
        removeTypingIndicator();
        addBotMessage(fallbackResponse);
        
        // Save to chat history
        chatHistory.push({
            role: 'assistant',
            content: fallbackResponse
        });
        saveChatHistory();
        return;
    }
    
    // Prepare the chat history for the API call
    const messages = [
        {
            role: "system",
            content: CONFIG.systemPrompt
        }
    ];
    
    // Add up to the last 10 messages from chat history (to stay within context limits)
    const recentHistory = chatHistory.slice(-10);
    messages.push(...recentHistory);
    
    let apiSuccess = false;
    let retryCount = 0;
    let aiResponse = '';
    
    // Try API with retries
    while (!apiSuccess && retryCount <= CONFIG.maxRetries) {
        try {
            // Add jitter to retry delay to prevent thundering herd problem
            if (retryCount > 0) {
                const jitter = Math.floor(Math.random() * 1000);
                await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay + jitter));
                setStatusIndicator(`Retrying connection (${retryCount}/${CONFIG.maxRetries})...`, true);
            }
            
            // Create the API URL using the current origin to avoid cross-origin issues
            let apiUrl = CONFIG.apiEndpoint;
            
            // If it's not an absolute URL, make it relative to the current origin
            if (!apiUrl.startsWith('http')) {
                apiUrl = new URL(apiUrl, window.location.origin).toString();
            }
            
            // Use CORS proxy if provided
            if (CONFIG.corsProxyUrl && !apiUrl.startsWith(window.location.origin)) {
                apiUrl = CONFIG.corsProxyUrl + apiUrl;
            }
            
            let response;
            
            // Different handling for GET vs POST
            if (CONFIG.apiMethod.toUpperCase() === 'GET') {
                // For GET requests, encode the payload in the URL
                const queryParams = new URLSearchParams({
                    model: CONFIG.model,
                    messages: JSON.stringify(messages),
                    temperature: CONFIG.temperature
                });
                
                response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
            } else {
                // Default to POST
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        model: CONFIG.model,
                        messages: messages,
                        temperature: CONFIG.temperature
                    })
                });
            }
            
            if (!response.ok) {
                const statusCode = response.status;
                console.error(`API Error: ${statusCode} - ${response.statusText}`);
                
                // Special handling for rate limiting
                if (statusCode === 429) {
                    setStatusIndicator('Rate limited. Retrying...', true);
                    throw new Error('Rate limit exceeded');
                }
                // Special handling for Method Not Allowed
                else if (statusCode === 405) {
                    setStatusIndicator('Method not allowed. Try changing API method.', true);
                    
                    // Automatically switch methods if 405 error
                    if (CONFIG.apiMethod.toUpperCase() === 'POST') {
                        CONFIG.apiMethod = 'GET';
                        console.log('Switching to GET method for API requests');
                    } else {
                        CONFIG.apiMethod = 'POST';
                        console.log('Switching to POST method for API requests');
                    }
                    
                    throw new Error('Method not allowed');
                } else {
                    throw new Error(`API Error: ${statusCode}`);
                }
            }
            
            const data = await response.json();
            
            // Extract the response based on API response format
            if (data.choices && data.choices[0] && data.choices[0].message) {
                // Standard OpenAI format
                aiResponse = data.choices[0].message.content.trim();
            } else if (data.response) {
                // Simple API format
                aiResponse = data.response.trim();
            } else if (data.message) {
                // Another common format
                aiResponse = data.message.trim();
            } else if (data.content) {
                // Yet another format
                aiResponse = data.content.trim();
            } else {
                // Last resort, use the whole response
                aiResponse = JSON.stringify(data);
            }
            
            apiSuccess = true;
            
            // Show status if retried successfully
            if (retryCount > 0) {
                setStatusIndicator('Connected to AI service', false);
            }
            
        } catch (error) {
            console.warn(`API attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            // If last retry, use fallback
            if (retryCount > CONFIG.maxRetries) {
                setStatusIndicator('Using offline mode', true);
                
                if (CONFIG.useLocalFallback) {
                    aiResponse = fallbackMessageHandler(message);
                } else {
                    aiResponse = "Sorry, I'm having trouble connecting to the AI service. Please try again later.";
                }
            }
        }
    }
    
    // Remove typing indicator
    removeTypingIndicator();
    
    // Add response to chat
    addBotMessage(aiResponse);
    
    // Save to chat history
    chatHistory.push({
        role: 'assistant',
        content: aiResponse
    });
    
    // Ensure chat history doesn't exceed max length
    if (chatHistory.length > CONFIG.maxChatHistory) {
        // Keep the first message (usually welcome) and the most recent ones
        chatHistory = [chatHistory[0], ...chatHistory.slice(-(CONFIG.maxChatHistory - 1))];
    }
    
    saveChatHistory();
}

/**
 * Save chat history to localStorage
 */
function saveChatHistory() {
    try {
        localStorage.setItem('ai-chatbot-history', JSON.stringify(chatHistory));
    } catch (e) {
        console.error('Error saving chat history:', e);
    }
}

/**
 * Load chat history from localStorage
 */
function loadChatHistory() {
    try {
        const savedHistory = localStorage.getItem('ai-chatbot-history');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            
            // Display previous messages if there are any
            if (chatHistory.length > 0) {
                elements.welcomeMessage.style.display = 'none';
                
                // Display the last 10 messages at most to avoid cluttering the interface
                const recentMessages = chatHistory.slice(-10);
                
                recentMessages.forEach(msg => {
                    if (msg.role === 'user') {
                        addUserMessage(msg.content);
                    } else if (msg.role === 'assistant') {
                        addBotMessage(msg.content);
                    }
                });
            }
        }
    } catch (e) {
        console.error('Error loading chat history:', e);
        // Reset if there's an error
        chatHistory = [];
    }
}

/**
 * Clear the chat history
 */
function clearChatHistory() {
    chatHistory = [];
    localStorage.removeItem('ai-chatbot-history');
    
    // Clear chat messages
    while (elements.chatMessages.firstChild) {
        elements.chatMessages.removeChild(elements.chatMessages.firstChild);
    }
    
    // Show welcome message again
    elements.welcomeMessage.style.display = 'block';
    
    // Add initial message after a short delay
    setTimeout(() => {
        const initialMessage = "I've cleared our conversation history. How else can I help you with your coding questions?";
        addBotMessage(initialMessage);
        elements.welcomeMessage.style.display = 'none';
        
        // Add to chat history
        chatHistory.push({
            role: 'assistant',
            content: initialMessage
        });
        saveChatHistory();
    }, 500);
}

/**
 * Helper function to handle fallback behavior when no AI API is available
 * @param {string} message - The user message
 * @returns {string} - A response message
 */
function fallbackMessageHandler(message) {
    message = message.toLowerCase();
    
    // Common programming and debugging patterns
    if (message.includes('error') || message.includes('bug') || message.includes('fix')) {
        return "To debug your code effectively:\n\n1. Check for syntax errors\n2. Use console.log() to trace values\n3. Try using a debugger to step through your code\n4. Look for common issues like undefined variables\n\nCould you share the specific error you're seeing?";
    }
    
    if (message.includes('function') || message.includes('method')) {
        return "```javascript\n// Basic function syntax\nfunction functionName(param1, param2) {\n  // function body\n  return result;\n}\n\n// Arrow function syntax\nconst functionName = (param1, param2) => {\n  // function body\n  return result;\n};\n```";
    }
    
    if (message.includes('array') || message.includes('loop')) {
        return "```javascript\n// Working with arrays\nconst myArray = [1, 2, 3, 4];\n\n// Looping through an array\nfor (let i = 0; i < myArray.length; i++) {\n  console.log(myArray[i]);\n}\n\n// Modern ways to loop\nmyArray.forEach(item => console.log(item));\n\n// Map, filter, reduce\nconst doubled = myArray.map(item => item * 2);\nconst evens = myArray.filter(item => item % 2 === 0);\nconst sum = myArray.reduce((total, item) => total + item, 0);\n```";
    }
    
    if (message.includes('api') || message.includes('fetch') || message.includes('ajax')) {
        return "```javascript\n// Fetching data from an API\nasync function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    \n    if (!response.ok) {\n      throw new Error(`HTTP error! Status: ${response.status}`);\n    }\n    \n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Fetch error:', error);\n  }\n}\n\n// Usage\nfetchData('https://api.example.com/data')\n  .then(data => console.log(data))\n  .catch(error => console.error(error));\n```";
    }
    
    // Default response for any other message
    return "I'm your AI code assistant. I can help you with coding problems, provide code examples, and explain programming concepts. What would you like to know more about?";
}

/**
 * Initialize the chatbot when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', initChatbot);


// Optional: Expose some functions to the global scope for debugging or manual control
window.aiChatbot = {
    clearHistory: clearChatHistory,
    toggleChat: function() {
        if (elements.chatContainer.style.display === 'none' || elements.chatContainer.style.display === '') {
            elements.chatBubble.click();
        } else {
            document.querySelector('.close-chat').click();
        }
    }
};