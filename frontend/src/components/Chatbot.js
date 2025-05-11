// chatbot.js - Floating Bubble AI Assistant
// This script creates a floating bubble chatbot UI that connects to an AI service

// Configuration options
const CONFIG = {
  bubbleSize: 60, // Size of the floating bubble in pixels
  apiEndpoint: "http://localhost:11434/api/generate", // Default Ollama API endpoint
  modelName: "llama3", // Default model
  systemPrompt: "You are a helpful AI assistant.", // Default system prompt
  userName: "User", // Default user name
  aiName: "Assistant", // Default AI name
  theme: {
    primary: "#2563eb", // Primary color (blue)
    secondary: "#f3f4f6", // Secondary color (light gray)
    text: "#1f2937", // Text color
    textLight: "#6b7280", // Light text color
    background: "#ffffff", // Background color
  }
};

class FloatingAIBubble {
  constructor(config = {}) {
    this.config = { ...CONFIG, ...config };
    this.isOpen = false;
    this.isProcessing = false;
    this.chatHistory = [];
    this.initUI();
    this.addEventListeners();
  }

  initUI() {
    // Create the main container
    this.container = document.createElement('div');
    this.container.id = 'floating-ai-bubble';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '20px';
    this.container.style.right = '20px';
    this.container.style.zIndex = '9999';
    this.container.style.fontFamily = 'Inter, system-ui, sans-serif';
    
    // Create the floating bubble
    this.bubble = document.createElement('div');
    this.bubble.className = 'floating-bubble';
    this.bubble.style.width = `${this.config.bubbleSize}px`;
    this.bubble.style.height = `${this.config.bubbleSize}px`;
    this.bubble.style.borderRadius = '50%';
    this.bubble.style.backgroundColor = this.config.theme.primary;
    this.bubble.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    this.bubble.style.display = 'flex';
    this.bubble.style.alignItems = 'center';
    this.bubble.style.justifyContent = 'center';
    this.bubble.style.cursor = 'pointer';
    this.bubble.style.transition = 'all 0.3s ease';
    
    // Create bubble icon
    this.bubbleIcon = document.createElement('div');
    this.bubbleIcon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8 12H8.01" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <path d="M12 12H12.01" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <path d="M16 12H16.01" stroke="white" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
    this.bubble.appendChild(this.bubbleIcon);
    
    // Create the chat interface container (hidden initially)
    this.chatInterface = document.createElement('div');
    this.chatInterface.className = 'chat-interface';
    this.chatInterface.style.position = 'absolute';
    this.chatInterface.style.bottom = `${this.config.bubbleSize + 20}px`;
    this.chatInterface.style.right = '0';
    this.chatInterface.style.width = '350px';
    this.chatInterface.style.height = '500px';
    this.chatInterface.style.backgroundColor = this.config.theme.background;
    this.chatInterface.style.borderRadius = '12px';
    this.chatInterface.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
    this.chatInterface.style.display = 'none';
    this.chatInterface.style.flexDirection = 'column';
    this.chatInterface.style.overflow = 'hidden';
    
    // Create chat header
    this.chatHeader = document.createElement('div');
    this.chatHeader.className = 'chat-header';
    this.chatHeader.style.padding = '16px';
    this.chatHeader.style.backgroundColor = this.config.theme.primary;
    this.chatHeader.style.color = 'white';
    this.chatHeader.style.fontWeight = 'bold';
    this.chatHeader.style.display = 'flex';
    this.chatHeader.style.justifyContent = 'space-between';
    this.chatHeader.style.alignItems = 'center';
    
    const headerTitle = document.createElement('div');
    headerTitle.textContent = this.config.aiName;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '0';
    closeButton.addEventListener('click', () => this.toggleChat());
    
    this.chatHeader.appendChild(headerTitle);
    this.chatHeader.appendChild(closeButton);
    
    // Create messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'messages-container';
    this.messagesContainer.style.flex = '1';
    this.messagesContainer.style.padding = '16px';
    this.messagesContainer.style.overflowY = 'auto';
    this.messagesContainer.style.display = 'flex';
    this.messagesContainer.style.flexDirection = 'column';
    this.messagesContainer.style.gap = '12px';
    
    // Add welcome message
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'message assistant-message';
    welcomeMessage.style.padding = '12px';
    welcomeMessage.style.borderRadius = '18px';
    welcomeMessage.style.maxWidth = '80%';
    welcomeMessage.style.alignSelf = 'flex-start';
    welcomeMessage.style.backgroundColor = this.config.theme.secondary;
    welcomeMessage.style.color = this.config.theme.text;
    welcomeMessage.textContent = `Hello! How can I help you today?`;
    this.messagesContainer.appendChild(welcomeMessage);
    
    // Create input container
    this.inputContainer = document.createElement('div');
    this.inputContainer.className = 'input-container';
    this.inputContainer.style.padding = '12px';
    this.inputContainer.style.borderTop = '1px solid #e5e7eb';
    this.inputContainer.style.display = 'flex';
    this.inputContainer.style.alignItems = 'center';
    this.inputContainer.style.gap = '8px';
    
    // Create text input
    this.textInput = document.createElement('input');
    this.textInput.type = 'text';
    this.textInput.placeholder = 'Type your message...';
    this.textInput.style.flex = '1';
    this.textInput.style.padding = '10px 14px';
    this.textInput.style.border = '1px solid #e5e7eb';
    this.textInput.style.borderRadius = '24px';
    this.textInput.style.outline = 'none';
    this.textInput.style.fontSize = '14px';
    
    // Create send button
    this.sendButton = document.createElement('button');
    this.sendButton.className = 'send-button';
    this.sendButton.style.width = '36px';
    this.sendButton.style.height = '36px';
    this.sendButton.style.borderRadius = '50%';
    this.sendButton.style.backgroundColor = this.config.theme.primary;
    this.sendButton.style.color = 'white';
    this.sendButton.style.border = 'none';
    this.sendButton.style.display = 'flex';
    this.sendButton.style.alignItems = 'center';
    this.sendButton.style.justifyContent = 'center';
    this.sendButton.style.cursor = 'pointer';
    this.sendButton.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    // Create settings button
    this.settingsButton = document.createElement('button');
    this.settingsButton.className = 'settings-button';
    this.settingsButton.style.background = 'none';
    this.settingsButton.style.border = 'none';
    this.settingsButton.style.cursor = 'pointer';
    this.settingsButton.style.padding = '6px';
    this.settingsButton.style.display = 'flex';
    this.settingsButton.style.alignItems = 'center';
    this.settingsButton.style.justifyContent = 'center';
    this.settingsButton.style.color = this.config.theme.textLight;
    this.settingsButton.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    // Assemble the chat interface
    this.inputContainer.appendChild(this.settingsButton);
    this.inputContainer.appendChild(this.textInput);
    this.inputContainer.appendChild(this.sendButton);
    
    this.chatInterface.appendChild(this.chatHeader);
    this.chatInterface.appendChild(this.messagesContainer);
    this.chatInterface.appendChild(this.inputContainer);
    
    this.container.appendChild(this.bubble);
    this.container.appendChild(this.chatInterface);
    
    // Create settings panel (hidden initially)
    this.settingsPanel = document.createElement('div');
    this.settingsPanel.className = 'settings-panel';
    this.settingsPanel.style.position = 'absolute';
    this.settingsPanel.style.bottom = '70px';
    this.settingsPanel.style.right = '0';
    this.settingsPanel.style.width = '280px';
    this.settingsPanel.style.backgroundColor = this.config.theme.background;
    this.settingsPanel.style.borderRadius = '12px';
    this.settingsPanel.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
    this.settingsPanel.style.padding = '16px';
    this.settingsPanel.style.display = 'none';
    this.settingsPanel.style.flexDirection = 'column';
    this.settingsPanel.style.gap = '12px';
    
    // Settings form
    const settingsForm = document.createElement('form');
    settingsForm.style.display = 'flex';
    settingsForm.style.flexDirection = 'column';
    settingsForm.style.gap = '12px';
    
    // API Endpoint setting
    const apiEndpointGroup = document.createElement('div');
    apiEndpointGroup.style.display = 'flex';
    apiEndpointGroup.style.flexDirection = 'column';
    apiEndpointGroup.style.gap = '4px';
    
    const apiEndpointLabel = document.createElement('label');
    apiEndpointLabel.textContent = 'API Endpoint:';
    apiEndpointLabel.style.fontSize = '14px';
    apiEndpointLabel.style.fontWeight = '500';
    
    this.apiEndpointInput = document.createElement('input');
    this.apiEndpointInput.type = 'text';
    this.apiEndpointInput.value = this.config.apiEndpoint;
    this.apiEndpointInput.style.padding = '8px 12px';
    this.apiEndpointInput.style.borderRadius = '6px';
    this.apiEndpointInput.style.border = '1px solid #e5e7eb';
    this.apiEndpointInput.style.fontSize = '14px';
    
    apiEndpointGroup.appendChild(apiEndpointLabel);
    apiEndpointGroup.appendChild(this.apiEndpointInput);
    
    // Model name setting
    const modelNameGroup = document.createElement('div');
    modelNameGroup.style.display = 'flex';
    modelNameGroup.style.flexDirection = 'column';
    modelNameGroup.style.gap = '4px';
    
    const modelNameLabel = document.createElement('label');
    modelNameLabel.textContent = 'Model Name:';
    modelNameLabel.style.fontSize = '14px';
    modelNameLabel.style.fontWeight = '500';
    
    this.modelNameInput = document.createElement('input');
    this.modelNameInput.type = 'text';
    this.modelNameInput.value = this.config.modelName;
    this.modelNameInput.style.padding = '8px 12px';
    this.modelNameInput.style.borderRadius = '6px';
    this.modelNameInput.style.border = '1px solid #e5e7eb';
    this.modelNameInput.style.fontSize = '14px';
    
    modelNameGroup.appendChild(modelNameLabel);
    modelNameGroup.appendChild(this.modelNameInput);
    
    // System prompt setting
    const systemPromptGroup = document.createElement('div');
    systemPromptGroup.style.display = 'flex';
    systemPromptGroup.style.flexDirection = 'column';
    systemPromptGroup.style.gap = '4px';
    
    const systemPromptLabel = document.createElement('label');
    systemPromptLabel.textContent = 'System Prompt:';
    systemPromptLabel.style.fontSize = '14px';
    systemPromptLabel.style.fontWeight = '500';
    
    this.systemPromptInput = document.createElement('textarea');
    this.systemPromptInput.value = this.config.systemPrompt;
    this.systemPromptInput.style.padding = '8px 12px';
    this.systemPromptInput.style.borderRadius = '6px';
    this.systemPromptInput.style.border = '1px solid #e5e7eb';
    this.systemPromptInput.style.fontSize = '14px';
    this.systemPromptInput.style.minHeight = '80px';
    this.systemPromptInput.style.resize = 'vertical';
    
    systemPromptGroup.appendChild(systemPromptLabel);
    systemPromptGroup.appendChild(this.systemPromptInput);
    
    // Save settings button
    const saveSettingsButton = document.createElement('button');
    saveSettingsButton.type = 'submit';
    saveSettingsButton.textContent = 'Save Settings';
    saveSettingsButton.style.padding = '8px 16px';
    saveSettingsButton.style.backgroundColor = this.config.theme.primary;
    saveSettingsButton.style.color = 'white';
    saveSettingsButton.style.border = 'none';
    saveSettingsButton.style.borderRadius = '6px';
    saveSettingsButton.style.fontWeight = '500';
    saveSettingsButton.style.cursor = 'pointer';
    saveSettingsButton.style.marginTop = '8px';
    
    // Assemble settings form
    settingsForm.appendChild(apiEndpointGroup);
    settingsForm.appendChild(modelNameGroup);
    settingsForm.appendChild(systemPromptGroup);
    settingsForm.appendChild(saveSettingsButton);
    
    this.settingsPanel.appendChild(settingsForm);
    this.container.appendChild(this.settingsPanel);
    
    // Add the main container to the document
    document.body.appendChild(this.container);
  }

  addEventListeners() {
    // Toggle chat interface when bubble is clicked
    this.bubble.addEventListener('click', () => this.toggleChat());
    
    // Handle sending messages
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.textInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Toggle settings panel
    this.settingsButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleSettings();
    });
    
    // Handle settings form submission
    this.settingsPanel.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });
    
    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
      if (this.settingsPanel.style.display === 'flex') {
        if (!this.settingsPanel.contains(e.target) && e.target !== this.settingsButton) {
          this.settingsPanel.style.display = 'none';
        }
      }
    });

    // Make bubble draggable
    let isDragging = false;
    let offsetX, offsetY;

    this.bubble.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - this.container.getBoundingClientRect().left;
      offsetY = e.clientY - this.container.getBoundingClientRect().top;
      this.bubble.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // Keep bubble within window boundaries
        const maxX = window.innerWidth - this.bubble.offsetWidth;
        const maxY = window.innerHeight - this.bubble.offsetHeight;
        
        this.container.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
        this.container.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        
        // Remove the default positioning
        this.container.style.right = 'auto';
        this.container.style.bottom = 'auto';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.bubble.style.cursor = 'pointer';
      }
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.chatInterface.style.display = 'flex';
      this.bubble.style.transform = 'scale(0.8)';
      setTimeout(() => {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        this.textInput.focus();
      }, 100);
    } else {
      this.chatInterface.style.display = 'none';
      this.bubble.style.transform = 'scale(1)';
      // Also close settings panel if open
      this.settingsPanel.style.display = 'none';
    }
  }

  toggleSettings() {
    if (this.settingsPanel.style.display === 'flex') {
      this.settingsPanel.style.display = 'none';
    } else {
      this.settingsPanel.style.display = 'flex';
    }
  }

  saveSettings() {
    this.config.apiEndpoint = this.apiEndpointInput.value;
    this.config.modelName = this.modelNameInput.value;
    this.config.systemPrompt = this.systemPromptInput.value;
    
    this.settingsPanel.style.display = 'none';
    
    // Add a system message to indicate settings were updated
    this.addSystemMessage('Settings updated successfully.');
  }

  addSystemMessage(text) {
    const systemMessage = document.createElement('div');
    systemMessage.className = 'message system-message';
    systemMessage.style.padding = '6px 12px';
    systemMessage.style.borderRadius = '12px';
    systemMessage.style.backgroundColor = '#f0f9ff';
    systemMessage.style.fontSize = '12px';
    systemMessage.style.color = '#4b5563';
    systemMessage.style.textAlign = 'center';
    systemMessage.style.margin = '8px auto';
    systemMessage.style.maxWidth = '90%';
    systemMessage.textContent = text;
    
    this.messagesContainer.appendChild(systemMessage);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    // System messages disappear after 5 seconds
    setTimeout(() => {
      systemMessage.style.opacity = '0';
      systemMessage.style.transition = 'opacity 0.5s ease';
      setTimeout(() => systemMessage.remove(), 500);
    }, 5000);
  }

  addMessage(text, isUser = true) {
    const message = document.createElement('div');
    message.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
    message.style.padding = '12px';
    message.style.borderRadius = '18px';
    message.style.maxWidth = '80%';
    message.style.wordBreak = 'break-word';
    message.style.whiteSpace = 'pre-wrap';
    
    if (isUser) {
      message.style.backgroundColor = this.config.theme.primary;
      message.style.color = 'white';
      message.style.alignSelf = 'flex-end';
    } else {
      message.style.backgroundColor = this.config.theme.secondary;
      message.style.color = this.config.theme.text;
      message.style.alignSelf = 'flex-start';
    }
    
    // Handle markdown-like code blocks
    if (text.includes('```')) {
      const parts = text.split('```');
      let formattedText = '';
      
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          // Regular text
          formattedText += parts[i];
        } else {
          // Code block
          const codeBlock = document.createElement('pre');
          codeBlock.style.backgroundColor = '#272822';
          codeBlock.style.color = '#f8f8f2';
          codeBlock.style.padding = '10px';
          codeBlock.style.borderRadius = '4px';
          codeBlock.style.overflowX = 'auto';
          codeBlock.style.fontSize = '14px';
          codeBlock.style.margin = '8px 0';
          
          // Check if there's a language specified
          const codeLines = parts[i].trim().split('\n');
          if (codeLines.length > 0 && !codeLines[0].includes(' ')) {
            const language = codeLines[0];
            codeBlock.innerHTML = codeLines.slice(1).join('\n');
            codeBlock.classList.add(`language-${language}`);
          } else {
            codeBlock.innerHTML = parts[i];
          }
          
          message.appendChild(codeBlock);
        }
      }
      
      if (formattedText) {
        const textNode = document.createTextNode(formattedText);
        message.insertBefore(textNode, message.firstChild);
      }
    } else {
      message.textContent = text;
    }
    
    this.messagesContainer.appendChild(message);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    // Add to chat history
    this.chatHistory.push({
      role: isUser ? 'user' : 'assistant',
      content: text
    });
  }

  async sendMessage() {
    const userInput = this.textInput.value.trim();
    if (userInput === '' || this.isProcessing) return;
    
    // Clear input
    this.textInput.value = '';
    
    // Add user message to chat
    this.addMessage(userInput, true);
    
    // Show typing indicator
    this.addTypingIndicator();
    
    // Set processing flag
    this.isProcessing = true;
    
    try {
      // Prepare conversation history
      const messages = [
        { role: 'system', content: this.config.systemPrompt }
      ];
      
      // Add conversation history (limited to last 10 messages for performance)
      const recentHistory = this.chatHistory.slice(-10);
      messages.push(...recentHistory);
      
      // Call API
      const response = await this.callAPI(messages);
      
      // Remove typing indicator
      this.removeTypingIndicator();
      
      // Add assistant response
      this.addMessage(response, false);
    } catch (error) {
      console.error('Error calling API:', error);
      
      // Remove typing indicator
      this.removeTypingIndicator();
      
      // Add error message
      this.addSystemMessage('Error: Could not connect to AI service.');
    } finally {
      // Reset processing flag
      this.isProcessing = false;
    }
  }

  addTypingIndicator() {
    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'typing-indicator';
    this.typingIndicator.style.padding = '12px';
    this.typingIndicator.style.borderRadius = '18px';
    this.typingIndicator.style.maxWidth = '60px';
    this.typingIndicator.style.backgroundColor = this.config.theme.secondary;
    this.typingIndicator.style.alignSelf = 'flex-start';
    this.typingIndicator.style.display = 'flex';
    this.typingIndicator.style.gap = '4px';
    this.typingIndicator.style.justifyContent = 'center';
    
    // Create the three dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.backgroundColor = this.config.theme.textLight;
      dot.style.borderRadius = '50%';
      dot.style.animation = 'typing-animation 1s infinite';
      dot.style.animationDelay = `${i * 0.2}s`;
      this.typingIndicator.appendChild(dot);
    }
    
    // Add animation keyframes
    if (!document.getElementById('typing-animation-style')) {
      const style = document.createElement('style');
      style.id = 'typing-animation-style';
      style.textContent = `
        @keyframes typing-animation {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    this.messagesContainer.appendChild(this.typingIndicator);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  removeTypingIndicator() {
    if (this.typingIndicator) {
      this.typingIndicator.remove();
      this.typingIndicator = null;
    }
  }

  async callAPI(messages) {
    // For Ollama, we use the /api/generate endpoint
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.modelName,
        prompt: this.formatMessagesForOllama(messages),
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response || 'No response from AI service.';
  }

  formatMessagesForOllama(messages) {
    // Ollama uses a simpler format with a single string prompt
    // We'll convert our messages array into a format Ollama understands
    let formattedPrompt = '';
    
    messages.forEach(message => {
      switch (message.role) {
        case 'system':
          formattedPrompt += `SYSTEM: ${message.content}\n\n`;
          break;
        case 'user':
          formattedPrompt += `USER: ${message.content}\n\n`;
          break;
        case 'assistant':
          formattedPrompt += `ASSISTANT: ${message.content}\n\n`;
          break;
      }
    });
    
    // Add final prompt for the assistant to respond to
    formattedPrompt += 'ASSISTANT:';
    
    return formattedPrompt;
  }
}

// Create a global CSS for the bubble chat
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  #floating-ai-bubble * {
    box-sizing: border-box;
  }
  
  .floating-bubble:hover {
    transform: scale(1.05);
  }
`;
document.head.appendChild(globalStyle);

// Initialize the chatbot when the script loads
document.addEventListener('DOMContentLoaded', () => {
  // You can customize the configuration here
  const chatbot = new FloatingAIBubble({
    bubbleSize: 60,
    apiEndpoint: "http://localhost:11434/api/generate",
    modelName: "llama3",
    systemPrompt: "You are a helpful AI assistant.",
    theme: {
      primary: "#2563eb",
      secondary: "#f3f4f6",
      text: "#1f2937",
      textLight: "#6b7280",
      background: "#ffffff",
    }
  });
  
  // Expose chatbot to global scope for advanced usage
  window.aiChatbot = chatbot;
});

// Export the class for module usage
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = FloatingAIBubble;
}