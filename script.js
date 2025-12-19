/**
 * Infinity Idea Generator
 * A client-side app that generates infinite idea options based on user choices
 */

// Constants
const MIN_OPTIONS = 4;
const MAX_OPTIONS = 6;
const MAX_RANDOM_NUMBER = 20;
const GENERIC_TEMPLATE_RATIO = 0.2; // 20% of templates will be generic for variety
const MAX_ATTEMPTS_MULTIPLIER = 10; // Safety multiplier for selection loops

// Cached operator mappings loaded from JSON
let operatorMappings = null;

// Context object to store domain and history
const context = {
    domain: '',
    history: []
};

// Operator usage tracking for frequency-based biasing
const operatorUsageCount = {};

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
 * Load operator mappings from JSON file
 */
async function loadOperatorMappings() {
    try {
        const response = await fetch('operator-mappings.json');
        if (!response.ok) {
            throw new Error(`Failed to load operator mappings: ${response.status}`);
        }
        operatorMappings = await response.json();
        console.log('Operator mappings loaded successfully');
    } catch (error) {
        console.error('Error loading operator mappings:', error);
        // Fallback to basic default operators if JSON fails to load
        operatorMappings = { 
            categories: { 
                default: { 
                    keywords: [], 
                    operators: [
                        'Remove {constraint}',
                        'Invert {assumption}',
                        'Change target user to {target}',
                        'Scale {multiplier}',
                        'Automate the manual parts',
                        'Make it self-service',
                        'Turn it into a platform'
                    ] 
                } 
            } 
        };
    }
}

/**
 * Initialize the app
 */
async function init() {
    // Load operator mappings first
    await loadOperatorMappings();
    
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
    const options = [];
    const templates = getTemplatesForDomain();
    
    // Generate unique options (prevent duplicates)
    let attempts = 0;
    const maxAttempts = count * MAX_ATTEMPTS_MULTIPLIER;
    const usedTemplates = new Set();
    
    while (options.length < count && attempts < maxAttempts) {
        const selectedTemplate = selectWeightedTemplate(templates, usedTemplates);
        if (selectedTemplate) {
            const option = generateSingleOption([selectedTemplate]);
            // Check for duplicate generated text
            if (!options.some(opt => opt.text === option)) {
                const templateKey = getTemplateKey(selectedTemplate);
                options.push({
                    text: option,
                    template: selectedTemplate,
                    templateKey: templateKey
                });
                usedTemplates.add(templateKey);
            }
        }
        attempts++;
    }
    
    // Rank options before returning
    const rankedOptions = rankOptions(options);
    
    return rankedOptions.map(opt => opt.text);
}

/**
 * Normalize operator to a standard format
 * Supports both string operators and object operators with metadata
 */
function normalizeOperator(operator) {
    if (typeof operator === 'string') {
        // Backward compatibility: string operators get default values
        return {
            text: operator,
            weight: 1.0,
            difficulty: 'medium',
            phase: 'exploration'
        };
    }
    // Object operator: fill in missing fields with defaults
    return {
        text: operator.text,
        weight: operator.weight !== undefined ? operator.weight : 1.0,
        difficulty: operator.difficulty || 'medium',
        phase: operator.phase || 'exploration'
    };
}

/**
 * Get a unique key for a template (handles both string and object templates)
 */
function getTemplateKey(template) {
    if (typeof template === 'string') {
        return template;
    }
    return template.text;
}

/**
 * Select a template using weighted random selection with frequency bias
 */
function selectWeightedTemplate(templates, usedTemplates) {
    if (templates.length === 0) return null;
    
    // Normalize all templates
    const normalizedTemplates = templates.map(normalizeOperator);
    
    // Filter out already used templates
    const availableTemplates = normalizedTemplates.filter(t => 
        !usedTemplates.has(t.text)
    );
    
    if (availableTemplates.length === 0) {
        // If all templates used, allow reuse
        return normalizedTemplates[Math.floor(Math.random() * normalizedTemplates.length)];
    }
    
    // Calculate weights with frequency bias
    const weightedTemplates = availableTemplates.map(template => {
        const usageCount = operatorUsageCount[template.text] || 0;
        // Frequency bias: reduce weight for frequently used operators
        // Formula: weight / (1 + usageCount * 0.1)
        const frequencyBias = 1 / (1 + usageCount * 0.1);
        const adjustedWeight = template.weight * frequencyBias;
        
        return {
            template: template,
            weight: adjustedWeight
        };
    });
    
    // Calculate total weight
    const totalWeight = weightedTemplates.reduce((sum, wt) => sum + wt.weight, 0);
    
    // Select using weighted random
    let random = Math.random() * totalWeight;
    for (const wt of weightedTemplates) {
        random -= wt.weight;
        if (random <= 0) {
            return wt.template;
        }
    }
    
    // Fallback to last template
    return weightedTemplates[weightedTemplates.length - 1].template;
}

/**
 * Rank generated options by relevance and quality
 */
function rankOptions(options) {
    return options.sort((a, b) => {
        const templateA = normalizeOperator(a.template);
        const templateB = normalizeOperator(b.template);
        
        // Calculate scores for each option
        const scoreA = calculateOptionScore(templateA, a.templateKey);
        const scoreB = calculateOptionScore(templateB, b.templateKey);
        
        // Higher scores come first
        return scoreB - scoreA;
    });
}

/**
 * Calculate a relevance score for an option
 */
function calculateOptionScore(template, templateKey) {
    let score = 0;
    
    // Base score from weight (higher weight = higher priority)
    score += template.weight * 10;
    
    // Frequency bonus: less used operators get a boost
    const usageCount = operatorUsageCount[templateKey] || 0;
    score += Math.max(0, 5 - usageCount);
    
    // Phase-based scoring (context-aware)
    const historyLength = context.history.length;
    if (historyLength <= 2 && template.phase === 'exploration') {
        score += 3; // Prefer exploration early
    } else if (historyLength > 2 && historyLength <= 5 && template.phase === 'refinement') {
        score += 3; // Prefer refinement in middle
    } else if (historyLength > 5 && template.phase === 'validation') {
        score += 3; // Prefer validation later
    }
    
    // Difficulty-based scoring (progressive difficulty)
    if (historyLength <= 2 && template.difficulty === 'low') {
        score += 2; // Prefer easier options early
    } else if (historyLength > 2 && historyLength <= 5 && template.difficulty === 'medium') {
        score += 2;
    } else if (historyLength > 5 && template.difficulty === 'high') {
        score += 2; // Prefer challenging options later
    }
    
    return score;
}

/**
 * Generate a single option using templates and randomization
 */
function generateSingleOption(templates) {
    const template = templates[0]; // Expects single template now
    const normalized = normalizeOperator(template);
    
    // Replace placeholders with contextual or random values
    let option = normalized.text;
    
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
    const multipliers = ['10x', '100x', '2x', '5x', '0.5x'];
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
 * Detect domain categories based on keywords in the domain string
 * Returns array of matching category names
 */
function detectDomainCategories(domain) {
    if (!operatorMappings) {
        return ['default'];
    }
    
    const domainLower = domain.toLowerCase();
    const matchedCategories = [];
    
    // Check each category for keyword matches (case-insensitive, partial match)
    for (const [categoryName, categoryData] of Object.entries(operatorMappings.categories)) {
        // Skip default category in initial matching
        if (categoryName === 'default') {
            continue;
        }
        
        // Check if any keyword matches (partial, case-insensitive)
        const hasMatch = categoryData.keywords.some(keyword => 
            domainLower.includes(keyword.toLowerCase())
        );
        
        if (hasMatch) {
            matchedCategories.push(categoryName);
        }
    }
    
    // If no categories matched, use default
    if (matchedCategories.length === 0) {
        return ['default'];
    }
    
    return matchedCategories;
}

/**
 * Get relevant templates based on domain and history
 */
function getTemplatesForDomain() {
    if (!operatorMappings) {
        return [];
    }
    
    // Detect matching categories
    const matchedCategories = detectDomainCategories(context.domain);
    
    // Merge operators from all matched categories
    let domainTemplates = [];
    matchedCategories.forEach(categoryName => {
        if (operatorMappings.categories[categoryName]) {
            domainTemplates.push(...operatorMappings.categories[categoryName].operators);
        }
    });
    
    // Add some default templates for variety (unless we're already using default)
    if (!matchedCategories.includes('default') && operatorMappings.categories.default) {
        const defaultTemplates = operatorMappings.categories.default.operators;
        const defaultCount = Math.floor(defaultTemplates.length * GENERIC_TEMPLATE_RATIO);
        
        // Use Fisher-Yates shuffle to select random templates efficiently
        const shuffled = [...defaultTemplates];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        domainTemplates.push(...shuffled.slice(0, defaultCount));
    }
    
    // Add context-aware templates based on history (with metadata)
    if (context.history.length > 2) {
        domainTemplates.push(
            { text: 'Pivot to opposite direction', weight: 1.5, difficulty: 'high', phase: 'validation' },
            { text: 'Return to initial concept', weight: 1.3, difficulty: 'medium', phase: 'validation' },
            { text: 'Merge last 2 ideas', weight: 1.4, difficulty: 'medium', phase: 'refinement' },
            { text: 'Challenge the core assumption', weight: 1.6, difficulty: 'high', phase: 'validation' }
        );
    }
    
    return domainTemplates;
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
    // Track operator usage for frequency-based biasing
    // We need to find which template generated this option
    // For simplicity, we'll track the option text itself
    operatorUsageCount[option] = (operatorUsageCount[option] || 0) + 1;
    
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
    
    // Clear operator usage tracking
    for (const key in operatorUsageCount) {
        delete operatorUsageCount[key];
    }
    
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
