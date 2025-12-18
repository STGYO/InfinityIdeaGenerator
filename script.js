/**
 * Infinity Idea Generator
 * A client-side app that generates infinite idea options based on user choices
 */

// Constants
const MIN_OPTIONS = 4;
const MAX_OPTIONS = 6;
const MAX_RANDOM_NUMBER = 20;

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
const domainError = document.getElementById('domain-error');
const currentDomainDisplay = document.getElementById('current-domain');
const historyPath = document.getElementById('history-path');
const generationPrompt = document.getElementById('generation-prompt');
const optionsContainer = document.getElementById('options-container');
const customInput = document.getElementById('custom-input');
const customSubmitBtn = document.getElementById('custom-submit-btn');
const customError = document.getElementById('custom-error');
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
 * Show error message
 */
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => {
        element.classList.remove('show');
    }, 3000);
}

/**
 * Clear error message
 */
function clearError(element) {
    element.textContent = '';
    element.classList.remove('show');
}

/**
 * Start the generation process
 */
function startGeneration() {
    const domain = domainInput.value.trim();
    
    if (!domain) {
        showError(domainError, 'Please enter a domain to explore!');
        domainInput.focus();
        return;
    }
    
    clearError(domainError);
    
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
    const numOptions = Math.floor(Math.random() * (MAX_OPTIONS - MIN_OPTIONS + 1)) + MIN_OPTIONS;
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
    const options = new Set();
    const templates = getTemplatesForDomain();
    
    // Generate unique options (prevent duplicates)
    let attempts = 0;
    const maxAttempts = count * 10; // Prevent infinite loop
    
    while (options.size < count && attempts < maxAttempts) {
        const option = generateSingleOption(templates);
        options.add(option);
        attempts++;
    }
    
    return Array.from(options);
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
    
    // Replace {target} with specific target users
    const targets = ['beginners', 'experts', 'enterprises', 'teenagers', 'seniors', 
                     'small businesses', 'developers', 'creators', 'students', 'professionals'];
    option = option.replace(/{target}/g, targets[Math.floor(Math.random() * targets.length)]);
    
    // Replace {constraint} with specific constraints
    const constraints = ['a dependency', 'a feature', 'the middleman', 'manual steps', 'a cost center',
                         'a bottleneck', 'complexity', 'a requirement', 'friction', 'an intermediary'];
    option = option.replace(/{constraint}/g, constraints[Math.floor(Math.random() * constraints.length)]);
    
    // Replace {multiplier} with scale factors
    const multipliers = ['10x', '100x', '2x', '5x', 'half'];
    option = option.replace(/{multiplier}/g, multipliers[Math.floor(Math.random() * multipliers.length)]);
    
    // Replace {assumption} with common assumptions
    const assumptions = ['the pricing model', 'the delivery method', 'the user flow', 'the monetization strategy',
                        'the target market', 'the value proposition', 'the distribution channel', 'the core feature'];
    option = option.replace(/{assumption}/g, assumptions[Math.floor(Math.random() * assumptions.length)]);
    
    // Replace {number} with random numbers
    option = option.replace(/{number}/g, Math.floor(Math.random() * MAX_RANDOM_NUMBER) + 1);
    
    return option;
}

/**
 * Get relevant templates based on domain and history
 */
function getTemplatesForDomain() {
    const baseTemplates = [
        // Removal operators
        'Remove {constraint}',
        'Eliminate {constraint} entirely',
        'Cut cost by {multiplier}',
        'Reduce complexity by {multiplier}',
        
        // Inversion operators
        'Invert {assumption}',
        'Flip the {assumption}',
        'Reverse the user journey',
        'Do the opposite of current approach',
        
        // Target change operators
        'Change target user to {target}',
        'Shift focus to {target}',
        'Reposition for {target}',
        
        // Scale operators
        'Scale {multiplier}',
        'Multiply capacity by {multiplier}',
        'Shrink to {multiplier} the size',
        'Increase speed by {multiplier}',
        
        // Addition operators
        'Add constraint: {number}-minute time limit',
        'Introduce {number} competing variations',
        'Layer on peer-to-peer element',
        
        // Transformation operators
        'Automate the manual parts',
        'Make it self-service',
        'Turn it into a platform',
        'Convert to subscription model',
        'Shift from B2C to B2B',
        'Move from software to service',
        
        // Constraint operators
        'Limit to {number} core features only',
        'Operate with zero budget for {assumption}',
        'Launch in {number} days',
        'Build with single person team',
        
        // Combination operators
        'Merge with adjacent market',
        'Bundle with complementary offering',
        'Combine {last} with physical product',
        
        // Unbundling operators
        'Extract one feature as standalone',
        'Split into {number} separate products',
        'Unbundle the {last}'
    ];
    
    // Add context-aware templates based on history
    if (context.history.length > 2) {
        baseTemplates.push(
            'Pivot to opposite direction',
            'Return to initial concept',
            'Merge last {number} ideas',
            'Challenge the core assumption'
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
    
    // Show only last 10 items
    const recentHistory = context.history.slice(-10);
    const startIndex = context.history.length - recentHistory.length;
    
    recentHistory.forEach((choice, index) => {
        const item = document.createElement('span');
        item.className = 'history-item';
        item.textContent = `${startIndex + index + 1}. ${choice}`;
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
        showError(customError, 'Please enter your custom idea!');
        customInput.focus();
        return;
    }
    
    clearError(customError);
    
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
