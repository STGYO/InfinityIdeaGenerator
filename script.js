/**
 * Infinity Idea Generator
 * A client-side app that generates infinite idea options based on user choices
 */

// Context object to store domain and history
const context = {
    domain: '',
    history: []
};

// DOM elements
const domainInputScreen = document.getElementById('domain-input-screen');
const generationScreen = document.getElementById('generation-screen');
const domainInput = document.getElementById('domain-input');
const startBtn = document.getElementById('start-btn');
const currentDomainDisplay = document.getElementById('current-domain');
const historyPath = document.getElementById('history-path');
const generationPrompt = document.getElementById('generation-prompt');
const optionsContainer = document.getElementById('options-container');
const customInput = document.getElementById('custom-input');
const customSubmitBtn = document.getElementById('custom-submit-btn');
const resetBtn = document.getElementById('reset-btn');

/**
 * Initialize the app
 */
function init() {
    // Event listeners
    startBtn.addEventListener('click', startGeneration);
    domainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startGeneration();
    });
    
    customSubmitBtn.addEventListener('click', handleCustomInput);
    customInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCustomInput();
    });
    
    resetBtn.addEventListener('click', resetApp);
}

/**
 * Start the generation process
 */
function startGeneration() {
    const domain = domainInput.value.trim();
    
    if (!domain) {
        alert('Please enter a domain to explore!');
        return;
    }
    
    // Set the domain in context
    context.domain = domain;
    context.history = [];
    
    // Switch screens
    domainInputScreen.classList.remove('active');
    generationScreen.classList.add('active');
    
    // Display domain
    currentDomainDisplay.textContent = domain;
    
    // Generate first set of options
    generateNextStep();
}

/**
 * Generate the next step in the infinite loop
 */
function generateNextStep() {
    // Clear previous options
    optionsContainer.innerHTML = '';
    customInput.value = '';
    
    // Update history display
    updateHistoryDisplay();
    
    // Update prompt
    updatePrompt();
    
    // Generate 4-6 random options
    const numOptions = Math.floor(Math.random() * 3) + 4; // Random number between 4-6
    const options = generateOptions(numOptions);
    
    // Create option buttons
    options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.innerHTML = `<span>${option}</span>`;
        button.addEventListener('click', () => selectOption(option));
        optionsContainer.appendChild(button);
    });
}

/**
 * Generate creative options based on current context
 */
function generateOptions(count) {
    const options = [];
    const templates = getTemplatesForDomain();
    
    for (let i = 0; i < count; i++) {
        const option = generateSingleOption(templates);
        options.push(option);
    }
    
    return options;
}

/**
 * Generate a single option using templates and randomization
 */
function generateSingleOption(templates) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Replace placeholders with contextual or random values
    let option = template;
    
    // Replace {domain} with actual domain
    option = option.replace(/{domain}/g, context.domain);
    
    // Replace {last} with last choice if exists
    if (context.history.length > 0) {
        const lastChoice = context.history[context.history.length - 1];
        option = option.replace(/{last}/g, lastChoice);
    } else {
        option = option.replace(/{last}/g, context.domain);
    }
    
    // Replace {adjective} with random adjectives
    const adjectives = ['innovative', 'sustainable', 'minimalist', 'bold', 'elegant', 
                       'futuristic', 'retro', 'premium', 'affordable', 'experimental',
                       'collaborative', 'personalized', 'automated', 'eco-friendly', 'smart'];
    option = option.replace(/{adjective}/g, adjectives[Math.floor(Math.random() * adjectives.length)]);
    
    // Replace {feature} with random features
    const features = ['with AI integration', 'with social features', 'with gamification',
                     'with real-time updates', 'with custom themes', 'with analytics',
                     'with voice control', 'with offline mode', 'with cloud sync',
                     'with community-driven content', 'with subscription model', 'with freemium tier'];
    option = option.replace(/{feature}/g, features[Math.floor(Math.random() * features.length)]);
    
    // Replace {number} with random numbers
    option = option.replace(/{number}/g, Math.floor(Math.random() * 20) + 1);
    
    return option;
}

/**
 * Get relevant templates based on domain and history
 */
function getTemplatesForDomain() {
    const baseTemplates = [
        'Focus on {adjective} approach',
        'Add {feature}',
        'Target {adjective} user segment',
        'Implement {adjective} design',
        'Optimize for {adjective} performance',
        'Create {adjective} variation',
        'Expand into {adjective} market',
        'Partner with {adjective} platforms',
        'Introduce {number} new aspects',
        'Simplify the {last}',
        'Enhance {last} with premium features',
        'Make it more {adjective}',
        'Combine with trending technology',
        'Scale for enterprise use',
        'Design for mobile-first experience',
        'Add community-driven features',
        'Implement subscription-based model',
        'Focus on accessibility',
        'Integrate with popular services',
        'Create niche version for specific audience'
    ];
    
    // Add context-aware templates based on history
    if (context.history.length > 2) {
        baseTemplates.push(
            'Pivot to different angle',
            'Return to core concept',
            'Merge previous ideas',
            'Explore opposite direction'
        );
    }
    
    return baseTemplates;
}

/**
 * Update the prompt based on context
 */
function updatePrompt() {
    const step = context.history.length + 1;
    let prompt = '';
    
    if (step === 1) {
        prompt = `Let's explore ideas in the "${context.domain}" space. Where should we start?`;
    } else if (step === 2) {
        prompt = `Great! You chose "${context.history[context.history.length - 1]}". What's the next refinement?`;
    } else {
        const recentChoices = context.history.slice(-2).join('" → "');
        prompt = `Building on "${recentChoices}"... What direction next?`;
    }
    
    generationPrompt.textContent = prompt;
}

/**
 * Update the history display
 */
function updateHistoryDisplay() {
    historyPath.innerHTML = '';
    
    if (context.history.length === 0) {
        historyPath.innerHTML = '<span class="history-item" style="color: #999;">Start your journey...</span>';
        return;
    }
    
    context.history.forEach((choice, index) => {
        const item = document.createElement('span');
        item.className = 'history-item';
        item.textContent = `${index + 1}. ${choice}`;
        historyPath.appendChild(item);
    });
}

/**
 * Handle option selection
 */
function selectOption(option) {
    // Add to history
    context.history.push(option);
    
    // Generate next set of options (infinite loop)
    generateNextStep();
}

/**
 * Handle custom input submission
 */
function handleCustomInput() {
    const customValue = customInput.value.trim();
    
    if (!customValue) {
        alert('Please enter your custom idea!');
        return;
    }
    
    // Add to history
    context.history.push(customValue);
    
    // Generate next set of options (infinite loop)
    generateNextStep();
}

/**
 * Reset the app to initial state
 */
function resetApp() {
    // Clear context
    context.domain = '';
    context.history = [];
    
    // Clear inputs
    domainInput.value = '';
    customInput.value = '';
    
    // Switch back to domain input screen
    generationScreen.classList.remove('active');
    domainInputScreen.classList.add('active');
    
    // Focus on domain input
    domainInput.focus();
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
