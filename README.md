# ♾️ Infinity Idea Generator

A minimal client-side infinite idea generator built with vanilla HTML, CSS, and JavaScript. No backend, no frameworks—just pure browser-based creativity.

## 🌟 Overview

The Infinity Idea Generator is an interactive web application that helps you explore endless possibilities in any domain. Start with a topic (like "mobile apps," "restaurant concepts," or "sci-fi stories"), and the app generates a continuous stream of creative options to build upon.

## 🚀 Features

- **Domain-Based Exploration**: Enter any domain or topic to start generating ideas
- **Phase-Based Ideation**: Structured progression through Exploration, Refinement, and Validation phases
  - **Exploration (Steps 1-3)**: Expansive thinking with broad, divergent possibilities
  - **Refinement (Steps 4-7)**: Focused ideas that are concrete and actionable
  - **Validation (Step 8+)**: Executable concepts that ensure viability
- **Intelligent Operator Selection**: Operators automatically adapt to your current phase for contextually relevant suggestions
- **Manual Phase Override**: Optional control to manually switch phases when you need different types of ideas
- **Infinite Loop**: Each choice generates 4-6 new options, creating an endless exploration path
- **Custom Input**: Not satisfied with the options? Enter your own custom ideas at any step
- **Context Tracking**: The app maintains your domain and choice history to generate contextually relevant suggestions
- **Auto-Save & Resume**: Your session automatically saves to localStorage and resumes on page reload
- **Export Options**: Export your idea path as clean Markdown or structured JSON (includes phase information)
- **Manual Reset**: Clear your session with a confirmation dialog to prevent accidental data loss
- **Clean UI**: Modern, responsive design that works on desktop and mobile
- **Offline-Ready**: Works completely offline with no backend or external dependencies
- **No Dependencies**: Pure vanilla JavaScript—no frameworks or external libraries required

## 📁 Project Structure

```
InfinityIdeaGenerator/
├── index.html              # Main HTML structure
├── style.css               # Styling and animations
├── script.js               # Core application logic
├── operator-mappings.json  # Domain-specific operators with phase metadata
├── README.md               # Documentation
└── LICENSE                 # LGPL 2.1 License
```

## 🎯 How It Works

1. **Enter a Domain**: Start by entering a topic or domain you want to explore (e.g., "mobile apps," "business ideas," "game concepts")

2. **Phase-Based Progression**: The app guides you through three distinct phases:
   - **Exploration Phase (Steps 1-3)**: Generate broad, expansive ideas to explore possibilities
   - **Refinement Phase (Steps 4-7)**: Focus on concrete, actionable concepts
   - **Validation Phase (Step 8+)**: Ensure ideas are executable and viable
   
   The phase automatically advances based on your step count, but you can manually override it at any time using the phase control buttons.

3. **Choose or Create**: The app generates 4-6 creative options based on your domain, history, and current phase. You can either:
   - Click on one of the generated option buttons
   - Enter your own custom idea in the text input

4. **Intelligent Suggestions**: Operators are weighted and prioritized based on:
   - Current phase (strong preference for matching operators)
   - Operator difficulty (progressive complexity)
   - Usage frequency (variety through frequency bias)
   - Domain relevance (context-aware templates)

5. **Track Your Path**: Your choice history is displayed at the top, showing how your ideas have evolved. Click on any step to navigate back to that point in your exploration.

6. **Auto-Save**: Your session (including phase state) is automatically saved to your browser's localStorage. Refresh the page anytime—your progress will be preserved.

7. **Export Your Ideas**: Click "Export as Markdown" or "Export as JSON" to download your idea path with phase annotations for use in other tools or documentation.

8. **Reset Session**: Click "Reset Session" to clear your current session and start fresh (with confirmation to prevent accidental data loss).

## 🛠️ Technical Details

### Phase System

The phase-based ideation system provides structure and guidance throughout your ideation journey:

```javascript
// Phase Configuration
EXPLORATION: { stepRange: [0, 3], color: '#667eea' }   // Steps 1-3
REFINEMENT:  { stepRange: [4, 7], color: '#764ba2' }   // Steps 4-7
VALIDATION:  { stepRange: [8, ∞], color: '#4caf50' }   // Step 8+
```

**Phase Characteristics:**
- **Exploration**: High-level, divergent thinking - generates broad possibilities
- **Refinement**: Mid-level, convergent thinking - creates concrete, actionable ideas
- **Validation**: Low-level, critical thinking - ensures ideas are executable

**Operator Scoring:**
- Base weight from operator metadata (1.0-2.0)
- +10 bonus for matching current phase
- +2 bonus for adjacent phases (smooth transitions)
- Progressive difficulty (easy → medium → high)
- Frequency bias (less-used operators get priority)

### Context Object

The app maintains a context object throughout the session:

```javascript
{
    domain: 'mobile apps',              // The initial domain
    currentPhase: 'EXPLORATION',        // Current phase
    manualPhaseOverride: null,          // Manual override (null = auto)
    rootNode: { ... },                  // Tree root
    currentNode: { ... }                // Current position in tree
}
```

### Idea Generation Algorithm

- Uses template-based generation with placeholders (`{domain}`, `{last}`, `{adjective}`, `{feature}`, `{number}`)
- Selects 4-6 operators weighted by phase, difficulty, and frequency
- Replaces placeholders with context-aware or random values
- Ranks options by relevance score before displaying

### No Backend Required

All functionality runs entirely in the browser:
- No API calls
- No server-side processing
- localStorage-based persistence (optional, client-side only)
- No external dependencies

## 🚀 Getting Started

### Option 1: Local File

1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. Start exploring!

### Option 2: Local Web Server

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

## 🌐 Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript features
- CSS Grid
- CSS Flexbox
- CSS Animations

Tested on:
- Chrome/Edge (v90+)
- Firefox (v88+)
- Safari (v14+)

## 💡 Use Cases

- **Brainstorming**: Explore creative directions for projects
- **Product Development**: Iterate on feature ideas
- **Creative Writing**: Generate story concepts and plot points
- **Business Planning**: Explore business model variations
- **Design Thinking**: Navigate design possibilities
- **Learning**: Explore topics by breaking them down iteratively

## 🎨 Customization

The app is designed to be easily customizable:

- **Styling**: Edit `style.css` to change colors, fonts, and layout
- **Templates**: Modify the `getTemplatesForDomain()` function in `script.js` to add domain-specific templates
- **Option Count**: Change the range in `generateNextStep()` to adjust the number of options (currently 4-6)
- **Random Values**: Update the arrays in `generateSingleOption()` to customize adjectives, features, etc.

## 📝 License

This project is licensed under the GNU Lesser General Public License v2.1 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Consider:
- Adding more sophisticated generation templates
- Implementing additional domain-specific logic
- Enhancing the UI/UX
- Improving mobile responsiveness
- Adding visual tree view
- Implementing share via URL functionality

## 🔮 Future Enhancements

Potential features for future versions:
- ~~Save/export your idea path~~ ✅ Implemented
- ~~Domain-specific templates~~ ✅ Implemented
- ~~Phase-based operators~~ ✅ Implemented
- Share paths via URL
- Undo/redo functionality
- Visual tree view of exploration
- Multiple language support
- Dark mode

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Built with ❤️ using vanilla HTML, CSS, and JavaScript