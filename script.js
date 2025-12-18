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
 * Detect domain category based on keywords in the domain string
 */
function detectDomainCategory(domain) {
    const domainLower = domain.toLowerCase();
    
    // Creative writing keywords
    const creativeWriting = ['novel', 'story', 'book', 'fiction', 'narrative', 'plot', 'character', 
                             'script', 'screenplay', 'writing', 'author', 'poetry', 'literature', 
                             'fantasy', 'sci-fi', 'mystery', 'romance', 'thriller'];
    
    // Business keywords
    const business = ['business', 'startup', 'company', 'enterprise', 'market', 'revenue', 
                      'profit', 'sales', 'customer', 'b2b', 'b2c', 'saas', 'service'];
    
    // Technology/software keywords
    const technology = ['app', 'software', 'platform', 'web', 'mobile', 'tech', 'api', 
                        'cloud', 'database', 'algorithm', 'code', 'programming', 'system'];
    
    // Design keywords
    const design = ['design', 'ui', 'ux', 'interface', 'visual', 'graphic', 'layout', 
                    'brand', 'logo', 'style', 'aesthetic', 'art'];
    
    // Product keywords
    const product = ['product', 'feature', 'gadget', 'device', 'tool', 'hardware', 
                     'invention', 'prototype'];
    
    // Food & Restaurant keywords
    const food = ['restaurant', 'food', 'cuisine', 'menu', 'recipe', 'cooking', 'chef', 
                  'dining', 'cafe', 'bakery'];
    
    // Game keywords
    const game = ['game', 'gaming', 'gameplay', 'level', 'player', 'rpg', 'puzzle', 
                  'strategy', 'adventure', 'multiplayer'];
    
    // Check each category
    if (creativeWriting.some(keyword => domainLower.includes(keyword))) {
        return 'creative-writing';
    }
    if (business.some(keyword => domainLower.includes(keyword))) {
        return 'business';
    }
    if (technology.some(keyword => domainLower.includes(keyword))) {
        return 'technology';
    }
    if (design.some(keyword => domainLower.includes(keyword))) {
        return 'design';
    }
    if (product.some(keyword => domainLower.includes(keyword))) {
        return 'product';
    }
    if (food.some(keyword => domainLower.includes(keyword))) {
        return 'food';
    }
    if (game.some(keyword => domainLower.includes(keyword))) {
        return 'game';
    }
    
    return 'generic';
}

/**
 * Get domain-specific templates for creative writing
 */
function getCreativeWritingTemplates() {
    return [
        // Genre shifts
        'Shift genre to mystery/thriller',
        'Add horror elements',
        'Convert to romance subplot',
        'Make it a comedy',
        'Add science fiction elements',
        'Transform into fantasy setting',
        
        // Narrative operators
        'Change narrator perspective (1st to 3rd person)',
        'Add unreliable narrator',
        'Use non-linear timeline',
        'Tell story in reverse',
        'Add multiple POV characters',
        'Switch to epistolary format',
        
        // Character operators
        'Make protagonist an anti-hero',
        'Flip protagonist and antagonist roles',
        'Add ensemble cast',
        'Age protagonist up/down by {number} years',
        'Change protagonist\'s background completely',
        'Introduce morally gray character',
        
        // Plot operators
        'Add unexpected plot twist',
        'Remove subplot about {last}',
        'Introduce time travel element',
        'Add mystery/conspiracy layer',
        'Change the ending completely',
        'Make stakes {multiplier} higher',
        
        // Setting operators
        'Move setting to different time period',
        'Change location to exotic/unusual place',
        'Shift from urban to rural (or vice versa)',
        'Add alternate reality/parallel world',
        'Set in post-apocalyptic future',
        'Create entirely fictional world'
    ];
}

/**
 * Get domain-specific templates for business
 */
function getBusinessTemplates() {
    return [
        // Market operators
        'Target different market segment: {target}',
        'Expand to international markets',
        'Focus on niche market only',
        'Shift from B2C to B2B model',
        'Shift from B2B to B2C model',
        'Enter adjacent market',
        
        // Pricing operators
        'Switch to freemium model',
        'Convert to subscription pricing',
        'Try usage-based pricing',
        'Offer tiered pricing with {number} tiers',
        'Make it premium/luxury pricing',
        'Race to bottom: lowest price in market',
        
        // Distribution operators
        'Change from direct to channel sales',
        'Add marketplace distribution',
        'Build network of resellers',
        'Go direct-to-consumer only',
        'Partner with major platforms',
        'Use viral/referral distribution',
        
        // Business model operators
        'Convert to marketplace model',
        'Become platform for others',
        'Add services on top of product',
        'Remove services, focus on product',
        'Introduce revenue sharing',
        'Add advertising revenue stream',
        
        // Scale operators
        'Scale team by {multiplier}',
        'Reduce overhead by {multiplier}',
        'Multiply customer base by {multiplier}',
        'Expand to {number} new regions'
    ];
}

/**
 * Get domain-specific templates for technology
 */
function getTechnologyTemplates() {
    return [
        // Feature operators
        'Add AI/ML capabilities',
        'Remove {number} least-used features',
        'Focus on one core feature only',
        'Add real-time collaboration',
        'Introduce automation for {last}',
        'Add mobile-first experience',
        
        // Architecture operators
        'Migrate to microservices',
        'Move to serverless architecture',
        'Add edge computing layer',
        'Implement event-driven design',
        'Switch to monolithic simplicity',
        'Add blockchain/distributed ledger',
        
        // Scalability operators
        'Optimize for {multiplier} more users',
        'Add caching layer',
        'Implement horizontal scaling',
        'Reduce latency by {multiplier}',
        'Support offline-first mode',
        'Add CDN for global performance',
        
        // Integration operators
        'Build public API',
        'Add webhook support',
        'Integrate with major platforms',
        'Support {number} third-party integrations',
        'Create plugin ecosystem',
        'Add OAuth/SSO support',
        
        // User experience operators
        'Add dark mode',
        'Implement progressive web app',
        'Create native mobile apps',
        'Add voice interface',
        'Build CLI version',
        'Add keyboard shortcuts for power users'
    ];
}

/**
 * Get domain-specific templates for design
 */
function getDesignTemplates() {
    return [
        // Aesthetic operators
        'Switch to minimalist design',
        'Add maximalist/bold style',
        'Use brutalist aesthetic',
        'Apply retro/vintage style',
        'Go for futuristic look',
        'Adopt material design principles',
        
        // Layout operators
        'Change to single-column layout',
        'Use grid-based design',
        'Implement card-based interface',
        'Add full-screen immersive mode',
        'Increase white space by {multiplier}',
        'Make it asymmetrical',
        
        // Usability operators
        'Reduce to {number}-step flow',
        'Add progressive disclosure',
        'Implement gesture-based navigation',
        'Simplify information hierarchy',
        'Add micro-interactions',
        'Increase touch target sizes',
        
        // Visual operators
        'Change color palette completely',
        'Add custom illustrations',
        'Use photography instead of graphics',
        'Increase contrast by {multiplier}',
        'Add animations and transitions',
        'Use bold typography as focal point',
        
        // Accessibility operators
        'Optimize for screen readers',
        'Add high-contrast mode',
        'Support keyboard-only navigation',
        'Increase text size options',
        'Add color-blind friendly palette',
        'Implement voice control'
    ];
}

/**
 * Get domain-specific templates for products
 */
function getProductTemplates() {
    return [
        // Feature operators
        'Strip down to essential features only',
        'Add {number} premium features',
        'Combine with complementary product',
        'Make it modular/customizable',
        'Add smart/connected capabilities',
        'Focus on single use case',
        
        // User segment operators
        'Reposition for {target}',
        'Create pro version for experts',
        'Make beginner-friendly version',
        'Target opposite demographic',
        'Focus on accessibility needs',
        'Design for extreme conditions',
        
        // Form factor operators
        'Make it portable/compact',
        'Scale size by {multiplier}',
        'Create handheld version',
        'Design for wearable form',
        'Make it modular/stackable',
        'Change material completely',
        
        // Pricing operators
        'Move to rental/subscription model',
        'Offer budget version',
        'Create luxury/premium tier',
        'Add freemium with upgrades',
        'Bundle with other products',
        'Reduce price by {multiplier}'
    ];
}

/**
 * Get domain-specific templates for food/restaurants
 */
function getFoodTemplates() {
    return [
        // Cuisine operators
        'Fusion with different cuisine',
        'Focus on regional specialty',
        'Go fusion: {number} cuisine mix',
        'Traditional/authentic approach',
        'Modern twist on classics',
        'Focus on single ingredient/dish',
        
        // Menu operators
        'Reduce menu to {number} signature items',
        'Add seasonal rotating menu',
        'Create tasting menu experience',
        'Focus on dietary restriction (vegan/keto/etc)',
        'Add chef\'s special innovations',
        'Make everything customizable',
        
        // Service model operators
        'Switch to fast-casual format',
        'Add fine dining experience',
        'Try pop-up/temporary concept',
        'Go food truck/mobile',
        'Add delivery/takeout focus',
        'Create subscription meal service',
        
        // Atmosphere operators
        'Complete ambiance redesign',
        'Add entertainment/experience',
        'Create intimate small space',
        'Design for large groups/events',
        'Add outdoor/patio focus',
        'Theme around specific concept',
        
        // Sourcing operators
        'Source everything locally',
        'Focus on organic/sustainable',
        'Feature exotic/imported ingredients',
        'Farm-to-table concept',
        'Partner with specific suppliers',
        'Grow/produce own ingredients'
    ];
}

/**
 * Get domain-specific templates for games
 */
function getGameTemplates() {
    return [
        // Gameplay operators
        'Add multiplayer/co-op mode',
        'Make it single-player focused',
        'Increase difficulty by {multiplier}',
        'Add procedural generation',
        'Introduce permadeath/roguelike',
        'Add skill-based progression',
        
        // Genre shifts
        'Blend with RPG elements',
        'Add strategy layer',
        'Incorporate puzzle mechanics',
        'Mix with survival elements',
        'Add simulation aspects',
        'Create battle royale mode',
        
        // Player experience operators
        'Make sessions {number} minutes each',
        'Add endless/infinite mode',
        'Create story-driven campaign',
        'Focus on competitive play',
        'Design for casual players',
        'Optimize for speedrunning',
        
        // Mechanics operators
        'Add crafting system',
        'Introduce resource management',
        'Add character customization',
        'Include base/city building',
        'Add card/deck building',
        'Introduce time manipulation mechanic',
        
        // Setting/Theme operators
        'Change setting to sci-fi',
        'Use fantasy world',
        'Set in realistic/modern world',
        'Create dystopian theme',
        'Use historical setting',
        'Design surreal/abstract world'
    ];
}

/**
 * Get generic templates as fallback
 */
function getGenericTemplates() {
    return [
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
}

/**
 * Get relevant templates based on domain and history
 */
function getTemplatesForDomain() {
    // Detect domain category
    const category = detectDomainCategory(context.domain);
    
    // Get domain-specific templates based on category
    let domainTemplates = [];
    switch(category) {
        case 'creative-writing':
            domainTemplates = getCreativeWritingTemplates();
            break;
        case 'business':
            domainTemplates = getBusinessTemplates();
            break;
        case 'technology':
            domainTemplates = getTechnologyTemplates();
            break;
        case 'design':
            domainTemplates = getDesignTemplates();
            break;
        case 'product':
            domainTemplates = getProductTemplates();
            break;
        case 'food':
            domainTemplates = getFoodTemplates();
            break;
        case 'game':
            domainTemplates = getGameTemplates();
            break;
        default:
            domainTemplates = getGenericTemplates();
    }
    
    // Add some generic templates to domain-specific ones for variety (20% generic)
    const genericTemplates = getGenericTemplates();
    const genericCount = Math.floor(genericTemplates.length * 0.2);
    const selectedGeneric = [];
    for (let i = 0; i < genericCount; i++) {
        const randomIndex = Math.floor(Math.random() * genericTemplates.length);
        if (!selectedGeneric.includes(genericTemplates[randomIndex])) {
            selectedGeneric.push(genericTemplates[randomIndex]);
        }
    }
    
    const allTemplates = [...domainTemplates, ...selectedGeneric];
    
    // Add context-aware templates based on history
    if (context.history.length > 2) {
        allTemplates.push(
            'Pivot to opposite direction',
            'Return to initial concept',
            'Merge last 2 ideas',
            'Challenge the core assumption'
        );
    }
    
    return allTemplates;
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
