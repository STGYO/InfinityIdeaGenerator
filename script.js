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
const FREQUENCY_BIAS_FACTOR = 0.1; // Factor for reducing weight of frequently used operators
const LOCALSTORAGE_KEY = 'infinityIdeaGenerator_state'; // Key for localStorage persistence

// Cached operator mappings loaded from JSON
let operatorMappings = null;

// Tree node structure for branching history
class HistoryNode {
    constructor(choice, parent = null) {
        // Use crypto.randomUUID() if available, fallback to timestamp + random
        this.id = (typeof crypto !== 'undefined' && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        this.choice = choice;
        this.parent = parent;
        this.children = [];
    }
}

// Phase configuration
const PHASES = {
    EXPLORATION: { name: 'Exploration', stepRange: [0, 3], color: '#667eea' },
    REFINEMENT: { name: 'Refinement', stepRange: [4, 7], color: '#764ba2' },
    VALIDATION: { name: 'Validation', stepRange: [8, Infinity], color: '#4caf50' }
};

// Context object to store domain and history tree
const context = {
    domain: '',
    rootNode: null,      // Root of the history tree
    currentNode: null,   // Current position in the tree
    currentPhase: 'EXPLORATION',  // Current phase: EXPLORATION, REFINEMENT, or VALIDATION
    manualPhaseOverride: null    // Manual phase override (null if auto-advancing)
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
const currentPhaseDisplay = document.getElementById('current-phase');
const phaseDescriptionDisplay = document.getElementById('phase-description');
const phaseOverrideButtons = document.querySelectorAll('.phase-override-btn');
const historyPath = document.getElementById('history-path');
const generationPrompt = document.getElementById('generation-prompt');
const optionsContainer = document.getElementById('options-container');
const customInput = document.getElementById('custom-input');
const customSubmitBtn = document.getElementById('custom-submit-btn');
const customError = document.getElementById('custom-error');
const resetBtn = document.getElementById('reset-btn');
const exportMarkdownBtn = document.getElementById('export-markdown-btn');
const exportJsonBtn = document.getElementById('export-json-btn');

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
    exportMarkdownBtn.addEventListener('click', exportAsMarkdown);
    exportJsonBtn.addEventListener('click', exportAsJSON);
    
    // Phase override button listeners
    phaseOverrideButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const phaseKey = btn.dataset.phase;
            handlePhaseOverride(phaseKey);
        });
    });
    
    // Event delegation for history path clicks
    historyPath.addEventListener('click', handleHistoryClick);
    
    // Try to restore previous session from localStorage
    loadStateFromLocalStorage();
}

/**
 * Save current state to localStorage
 */
function saveStateToLocalStorage() {
    try {
        const state = {
            domain: context.domain,
            rootNode: serializeNode(context.rootNode),
            currentNodeId: context.currentNode ? context.currentNode.id : null,
            operatorUsageCount: { ...operatorUsageCount },
            currentPhase: context.currentPhase,
            manualPhaseOverride: context.manualPhaseOverride
        };
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save session state to localStorage:', error);
    }
}

/**
 * Load state from localStorage and restore session
 */
function loadStateFromLocalStorage() {
    try {
        const savedState = localStorage.getItem(LOCALSTORAGE_KEY);
        if (!savedState) return;
        
        const state = JSON.parse(savedState);
        
        // Restore domain and tree
        if (state.domain && state.rootNode) {
            context.domain = state.domain;
            context.rootNode = deserializeNode(state.rootNode);
            
            // Find and set current node
            if (state.currentNodeId) {
                context.currentNode = findNodeById(context.rootNode, state.currentNodeId);
            }
            
            // Restore operator usage count
            if (state.operatorUsageCount) {
                Object.assign(operatorUsageCount, state.operatorUsageCount);
            }
            
            // Restore phase state
            if (state.currentPhase) {
                context.currentPhase = state.currentPhase;
            }
            if (state.manualPhaseOverride !== undefined) {
                context.manualPhaseOverride = state.manualPhaseOverride;
            }
            
            // Switch to generation screen and display state
            domainInputScreen.classList.remove('active');
            generationScreen.classList.add('active');
            currentDomainDisplay.textContent = context.domain;
            generateNextStep();
        }
    } catch (error) {
        console.error('Failed to restore session from localStorage:', error);
        // If there's an error, clear the corrupted data
        localStorage.removeItem(LOCALSTORAGE_KEY);
    }
}

/**
 * Serialize a tree node for storage
 */
function serializeNode(node) {
    if (!node) return null;
    
    return {
        id: node.id,
        choice: node.choice,
        children: node.children.map(child => serializeNode(child))
    };
}

/**
 * Deserialize a node from storage and reconstruct the tree
 */
function deserializeNode(data, parent = null) {
    if (!data) return null;
    
    const node = new HistoryNode(data.choice, parent);
    node.id = data.id; // Preserve original ID
    
    // Recursively deserialize children
    if (data.children && data.children.length > 0) {
        node.children = data.children.map(childData => deserializeNode(childData, node));
    }
    
    return node;
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
    
    // Set the domain in context and initialize tree
    context.domain = domain;
    context.rootNode = null;
    context.currentNode = null;
    
    // Save initial state
    saveStateToLocalStorage();
    
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
    
    // Update current phase based on step count
    updateCurrentPhase();
    
    // Update history display
    updateHistoryDisplay();
    
    // Update phase display
    updatePhaseDisplay();
    
    // Update prompt
    updatePrompt();
    
    // Generate 4-6 random options
    const numOptions = Math.floor(Math.random() * (MAX_OPTIONS - MIN_OPTIONS + 1)) + MIN_OPTIONS;
    const options = generateOptions(numOptions);
    
    // Create option buttons
    options.forEach((optionData, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.innerHTML = `<span>${optionData.text}</span>`;
        button.addEventListener('click', () => selectOption(optionData.text, optionData.templateKey));
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
    
    // Return objects with text and templateKey for proper tracking
    return rankedOptions.map(opt => ({
        text: opt.text,
        templateKey: opt.templateKey
    }));
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
    
    // If all templates used, allow reuse but still apply weighting
    const templatesToUse = availableTemplates.length > 0 ? availableTemplates : normalizedTemplates;
    
    // Calculate weights with frequency bias
    const weightedTemplates = templatesToUse.map(template => {
        const usageCount = operatorUsageCount[template.text] || 0;
        // Frequency bias: reduce weight for frequently used operators
        // Formula: weight / (1 + usageCount * FREQUENCY_BIAS_FACTOR)
        const frequencyBias = 1 / (1 + usageCount * FREQUENCY_BIAS_FACTOR);
        const adjustedWeight = template.weight * frequencyBias;
        
        return {
            template: template,
            weight: adjustedWeight
        };
    });
    
    // Calculate total weight
    const totalWeight = weightedTemplates.reduce((sum, wt) => sum + wt.weight, 0);
    
    // Edge case: if all weights are 0, use uniform random selection
    if (totalWeight === 0) {
        const randomIndex = Math.floor(Math.random() * weightedTemplates.length);
        return weightedTemplates[randomIndex].template;
    }
    
    // Select using weighted random
    let random = Math.random() * totalWeight;
    for (const wt of weightedTemplates) {
        random -= wt.weight;
        if (random < 0) {  // Use < instead of <= to avoid floating-point precision issues
            return wt.template;
        }
    }
    
    // Fallback to last template (should rarely happen)
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
    
    // Phase-based scoring (strongly prefer operators matching current phase)
    const currentPhase = context.currentPhase.toLowerCase();
    const templatePhase = template.phase.toLowerCase();
    
    if (currentPhase === templatePhase) {
        score += 10; // Strong bonus for phase match
    } else if (currentPhase === 'refinement' && templatePhase === 'exploration') {
        score += 2; // Small bonus for adjacent phase
    } else if (currentPhase === 'validation' && templatePhase === 'refinement') {
        score += 2; // Small bonus for adjacent phase
    }
    
    // Difficulty-based scoring (progressive difficulty aligned with phases)
    if (currentPhase === 'exploration' && template.difficulty === 'low') {
        score += 2; // Prefer easier options early
    } else if (currentPhase === 'refinement' && template.difficulty === 'medium') {
        score += 2;
    } else if (currentPhase === 'validation' && template.difficulty === 'high') {
        score += 2; // Prefer challenging options later
    }
    
    return score;
}

/**
 * Generate a single option using templates and randomization
 * @param {Array} templates - Array containing exactly one template
 */
function generateSingleOption(templates) {
    // Precondition: templates array should contain exactly one template
    if (!templates || templates.length === 0) {
        console.error('generateSingleOption called with empty templates array');
        return 'Generate new option';
    }
    
    const template = templates[0];
    const normalized = normalizeOperator(template);
    
    // Replace placeholders with contextual or random values
    let option = normalized.text;
    
    // Replace {domain} with actual domain
    option = option.replace(/{domain}/g, context.domain);
    
    // Replace {last} with last choice if exists
    const currentPath = getCurrentPath();
    if (currentPath.length > 0) {
        const lastChoice = currentPath[currentPath.length - 1];
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
    const currentPath = getCurrentPath();
    if (currentPath.length > 2) {
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
    const currentPath = getCurrentPath();
    const step = currentPath.length + 1;
    let prompt = '';
    
    if (step === 1) {
        prompt = `Let's explore ideas in the "${context.domain}" space. Where should we start?`;
    } else if (step === 2) {
        prompt = `Great! You chose "${currentPath[currentPath.length - 1]}". What's the next refinement?`;
    } else {
        const recentChoices = currentPath.slice(-2).join('" → "');
        prompt = `Building on "${recentChoices}"... What direction next?`;
    }
    
    generationPrompt.textContent = prompt;
}

/**
 * Get current path from root to current node
 */
function getCurrentPath() {
    const path = [];
    let node = context.currentNode;
    
    while (node !== null) {
        path.unshift(node.choice);
        node = node.parent;
    }
    
    return path;
}

/**
 * Determine the appropriate phase based on step count
 * Returns the phase key (EXPLORATION, REFINEMENT, or VALIDATION)
 */
function determinePhaseFromSteps(stepCount) {
    // Check manual override first
    if (context.manualPhaseOverride) {
        return context.manualPhaseOverride;
    }
    
    // Auto-advance based on step count
    for (const [phaseKey, phaseData] of Object.entries(PHASES)) {
        const [minStep, maxStep] = phaseData.stepRange;
        if (stepCount >= minStep && stepCount <= maxStep) {
            return phaseKey;
        }
    }
    
    // Default to validation for very high step counts
    return 'VALIDATION';
}

/**
 * Update the current phase based on history length
 */
function updateCurrentPhase() {
    const currentPath = getCurrentPath();
    const stepCount = currentPath.length;
    context.currentPhase = determinePhaseFromSteps(stepCount);
}

/**
 * Update the history display
 */
function updateHistoryDisplay() {
    historyPath.innerHTML = '';
    
    const currentPath = getCurrentPath();
    
    if (currentPath.length === 0) {
        historyPath.innerHTML = '<span class="history-item" style="color: #999;">Start your journey...</span>';
        return;
    }
    
    // Show only last 10 items
    const recentHistory = currentPath.slice(-10);
    const startIndex = currentPath.length - recentHistory.length;
    
    // Build path from root to current, collecting nodes
    const pathNodes = [];
    let node = context.currentNode;
    while (node !== null) {
        pathNodes.unshift(node);
        node = node.parent;
    }
    const recentNodes = pathNodes.slice(-10);
    
    recentNodes.forEach((node, index) => {
        const item = document.createElement('span');
        item.className = 'history-item clickable';
        item.textContent = `${startIndex + index + 1}. ${node.choice}`;
        item.style.cursor = 'pointer';
        item.dataset.nodeId = node.id; // Store node ID for event delegation
        
        historyPath.appendChild(item);
    });
}

/**
 * Update the phase display in the UI
 */
function updatePhaseDisplay() {
    if (!currentPhaseDisplay || !phaseDescriptionDisplay) {
        return; // Elements not present in UI
    }
    
    const phaseData = PHASES[context.currentPhase];
    const currentPath = getCurrentPath();
    const stepCount = currentPath.length;
    
    // Update phase name with color
    currentPhaseDisplay.textContent = phaseData.name;
    currentPhaseDisplay.style.color = phaseData.color;
    
    // Update phase description
    const descriptions = {
        'EXPLORATION': `Expansive thinking - exploring broad possibilities (steps 1-3)`,
        'REFINEMENT': `Focused refinement - making ideas concrete (steps 4-7)`,
        'VALIDATION': `Executable validation - ensuring ideas are actionable (step 8+)`
    };
    phaseDescriptionDisplay.textContent = descriptions[context.currentPhase];
    
    // Update phase override buttons active state
    phaseOverrideButtons.forEach(btn => {
        const btnPhase = btn.dataset.phase;
        if (btnPhase === context.currentPhase) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        // Show if manual override is active
        if (context.manualPhaseOverride) {
            btn.classList.add('override-active');
        } else {
            btn.classList.remove('override-active');
        }
    });
}

/**
 * Handle phase override button clicks
 */
function handlePhaseOverride(phaseKey) {
    if (context.manualPhaseOverride === phaseKey) {
        // Clicking the same phase again removes override (back to auto)
        context.manualPhaseOverride = null;
    } else {
        // Set manual override
        context.manualPhaseOverride = phaseKey;
    }
    
    // Update phase and regenerate
    updateCurrentPhase();
    saveStateToLocalStorage();
    generateNextStep();
}

/**
 * Navigate to a specific node in the history tree
 */
function navigateToNode(node) {
    // Set this node as the current node
    context.currentNode = node;
    
    // Save state to localStorage
    saveStateToLocalStorage();
    
    // Regenerate options from this point
    generateNextStep();
}

/**
 * Handle click on history path (event delegation)
 */
function handleHistoryClick(event) {
    const clickedItem = event.target.closest('.history-item.clickable');
    if (!clickedItem) return;
    
    const nodeId = clickedItem.dataset.nodeId;
    if (!nodeId) return;
    
    // Find the node with this ID
    const node = findNodeById(context.rootNode, nodeId);
    if (node) {
        navigateToNode(node);
    }
}

/**
 * Find a node by ID in the tree
 */
function findNodeById(startNode, targetId) {
    if (!startNode) return null;
    
    // Check if this is the target node
    if (startNode.id === targetId) {
        return startNode;
    }
    
    // Search in children
    for (const child of startNode.children) {
        const found = findNodeById(child, targetId);
        if (found) return found;
    }
    
    return null;
}

/**
 * Handle option selection
 */
function selectOption(option, templateKey) {
    // Track operator usage for frequency-based biasing using template key
    if (templateKey) {
        operatorUsageCount[templateKey] = (operatorUsageCount[templateKey] || 0) + 1;
    }
    
    // Create new node and add to tree
    const newNode = new HistoryNode(option, context.currentNode);
    
    if (context.currentNode === null) {
        // First choice - this becomes the root
        context.rootNode = newNode;
    } else {
        // Add as child to current node
        context.currentNode.children.push(newNode);
    }
    
    // Move to the new node
    context.currentNode = newNode;
    
    // Save state to localStorage
    saveStateToLocalStorage();
    
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
    
    // Create new node and add to tree
    const newNode = new HistoryNode(customValue, context.currentNode);
    
    if (context.currentNode === null) {
        // First choice - this becomes the root
        context.rootNode = newNode;
    } else {
        // Add as child to current node
        context.currentNode.children.push(newNode);
    }
    
    // Move to the new node
    context.currentNode = newNode;
    
    // Save state to localStorage
    saveStateToLocalStorage();
    
    // Generate next set of options (infinite loop)
    generateNextStep();
}

/**
 * Reset the app to initial state
 */
function resetApp() {
    // Confirm before resetting to prevent accidental data loss
    const hasData = context.domain || context.rootNode;
    if (hasData) {
        const confirmed = confirm('Are you sure you want to reset? This will clear your current session and saved progress.');
        if (!confirmed) {
            return;
        }
    }
    
    // Clear context
    context.domain = '';
    context.rootNode = null;
    context.currentNode = null;
    context.currentPhase = 'EXPLORATION';
    context.manualPhaseOverride = null;
    
    // Clear operator usage tracking (efficient clearing)
    Object.keys(operatorUsageCount).forEach(key => delete operatorUsageCount[key]);
    
    // Clear localStorage
    localStorage.removeItem(LOCALSTORAGE_KEY);
    
    // Clear inputs
    domainInput.value = '';
    customInput.value = '';
    
    // Switch back to domain input screen
    generationScreen.classList.remove('active');
    domainInputScreen.classList.add('active');
    
    // Focus on domain input
    domainInput.focus();
}

/**
 * Validate that a session exists for export
 */
function validateSessionForExport() {
    if (!context.domain) {
        alert('No session to export. Please start generating ideas first.');
        return false;
    }
    return true;
}

/**
 * Export current idea path as Markdown
 */
function exportAsMarkdown() {
    if (!validateSessionForExport()) return;
    
    const currentPath = getCurrentPath();
    const timestamp = new Date().toISOString().split('T')[0];
    
    let markdown = `# Infinity Idea Generator - Idea Path\n\n`;
    markdown += `**Domain:** ${context.domain}\n`;
    markdown += `**Date:** ${timestamp}\n`;
    markdown += `**Steps:** ${currentPath.length}\n`;
    markdown += `**Current Phase:** ${PHASES[context.currentPhase].name}\n\n`;
    markdown += `## Idea Evolution Path\n\n`;
    
    if (currentPath.length === 0) {
        markdown += `_No choices made yet_\n`;
    } else {
        // Temporarily clear manual override to get natural phase progression
        const savedOverride = context.manualPhaseOverride;
        context.manualPhaseOverride = null;
        
        currentPath.forEach((choice, index) => {
            // Determine phase for this step (index + 1 = step number = stepCount at that point)
            const stepCount = index + 1;
            const stepPhase = determinePhaseFromSteps(stepCount);
            const phaseName = PHASES[stepPhase].name;
            markdown += `${stepCount}. [${phaseName}] ${choice}\n`;
        });
        
        // Restore manual override
        context.manualPhaseOverride = savedOverride;
    }
    
    markdown += `\n---\n_Generated by Infinity Idea Generator_\n`;
    
    downloadFile(`idea-path-${timestamp}.md`, markdown, 'text/markdown');
}

/**
 * Export current idea path as JSON
 */
function exportAsJSON() {
    if (!validateSessionForExport()) return;
    
    const currentPath = getCurrentPath();
    const timestamp = new Date().toISOString();
    
    const exportData = {
        domain: context.domain,
        exportDate: timestamp,
        currentPhase: context.currentPhase,
        manualPhaseOverride: context.manualPhaseOverride,
        currentPath: currentPath,
        fullTree: serializeNode(context.rootNode),
        stats: {
            totalSteps: currentPath.length,
            totalNodes: countNodes(context.rootNode),
            phaseDistribution: calculatePhaseDistribution(currentPath)
        }
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const dateStr = timestamp.split('T')[0];
    downloadFile(`idea-path-${dateStr}.json`, json, 'application/json');
}

/**
 * Calculate phase distribution across the path
 */
function calculatePhaseDistribution(path) {
    const distribution = {
        EXPLORATION: 0,
        REFINEMENT: 0,
        VALIDATION: 0
    };
    
    // Temporarily clear manual override to get natural phase progression
    const savedOverride = context.manualPhaseOverride;
    context.manualPhaseOverride = null;
    
    path.forEach((_, index) => {
        // Use step count (index + 1) to determine phase
        const stepCount = index + 1;
        const phase = determinePhaseFromSteps(stepCount);
        distribution[phase]++;
    });
    
    // Restore manual override
    context.manualPhaseOverride = savedOverride;
    
    return distribution;
}

/**
 * Count total nodes in tree
 */
function countNodes(node) {
    if (!node) return 0;
    let count = 1;
    node.children.forEach(child => {
        count += countNodes(child);
    });
    return count;
}

/**
 * Download a file with given content
 */
function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
