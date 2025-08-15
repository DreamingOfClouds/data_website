# 🎯 Pitch AI

A JavaScript web application that allows you to play the classic card game Pitch against AI opponents powered by neural networks trained with reinforcement learning.

## 🚀 Features

- **Full Pitch Game Implementation**: Complete 4-player Pitch game with bidding and playing phases
- **AI Opponents**: Three AI players using trained neural networks
- **Interactive UI**: Clean, modern interface with card visualization
- **Real-time Gameplay**: Smooth turn-based gameplay with visual feedback
- **Auto-play Mode**: Watch AI vs AI games or play manually
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

The application consists of:

- **Frontend**: HTML5, CSS3, and vanilla JavaScript
- **AI Models**: TensorFlow.js models for bidding and playing decisions
- **Game Logic**: Complete Pitch game implementation
- **State Management**: Real-time game state tracking

## 🛠️ Setup Instructions

### 1. Clone or Download the Project

```bash
git clone <repository-url>
cd pitch
```

### 2. Run the Application

Simply open `index.html` in your web browser.

**Note**: For best performance and to avoid CORS issues, consider using a local server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have it installed)
npx http-server
```

Then open `http://localhost:8000` in your browser.

## 🎮 How to Play

### Game Rules
Pitch is a trick-taking card game where:
- 4 players play in teams of 2
- Each player is dealt 6 cards
- Players bid on how many points they can win
- Trump suit is determined by the first card played
- Points are awarded for winning tricks and special cards

### Controls
- **New Game**: Start a new game
- **Auto Play**: Let the AI play automatically
- **Reset**: Reset scores and return to waiting state
- **Bidding**: Click bid buttons during bidding phase
- **Playing**: Click cards in your hand to play them

### Game Flow
1. **Bidding Phase**: Players bid on points (Pass, 2, 3, or 4)
2. **Playing Phase**: Winner leads first trick, others follow suit
3. **Scoring**: Points awarded based on tricks won and bid success

## 🔧 Customization

### Adding to Existing Webpages

The Pitch AI demo can be easily integrated into existing HTML pages:

```html
<!-- Include TensorFlow.js -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js"></script>

<!-- Include the game -->
<script src="pitch-ai.js"></script>

<!-- Add the game container -->
<div id="pitch-game-container">
    <!-- Copy the game-container div from index.html -->
</div>

<!-- Initialize the game -->
<script>
    const pitchGame = new PitchAI();
</script>
```

### Styling Customization

Modify `styles.css` to match your website's theme:
- Color schemes
- Typography
- Layout dimensions
- Card designs

## 📁 Project Structure

```
pitch/
├── index.html              # Main HTML file
├── styles.css              # CSS styling
├── pitch-ai.js            # Main game logic
├── models/                 # TensorFlow.js models
│   ├── bidding_model/     # Bidding AI model
│   └── playing_model/     # Playing AI model
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🐛 Troubleshooting

### Models Not Loading
- Check browser console for errors
- Ensure models directory exists with proper structure
- Verify TensorFlow.js is loaded correctly

### Game Not Starting
- Check JavaScript console for errors
- Ensure all files are in the same directory
- Try using a local server instead of file:// protocol

### Performance Issues
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Ensure sufficient RAM for model loading
- Consider model quantization for better performance

## 🔮 Future Enhancements

- **Model Training**: Web-based model training interface
- **Multiplayer**: Online multiplayer support
- **Tournaments**: AI tournament mode
- **Analysis**: Game replay and analysis tools
- **Customization**: More game variants and rules

## 📚 Technical Details

### Neural Network Architecture
- **Bidding Model**: 56 inputs → 128 hidden → 4 outputs
- **Playing Model**: 184 inputs → 256 hidden → 52 outputs
- **Activation**: LeakyReLU for hidden layers, Softmax for outputs

### State Representation
- **Bidding State**: 52-card hand + 4-position encoding
- **Playing State**: Hand + trump + current trick + history + bidding info

### AI Decision Making
- Policy gradient with actor-critic architecture
- Legal move masking for valid actions
- Stochastic sampling for exploration

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Bug fixes and performance optimizations
- UI/UX enhancements
- Additional game features
- Model improvements
- Documentation updates

## 📄 License

This project is open source. Free to use, modify, and distribute as needed.

## 🙏 Acknowledgments

- Original Pitch game rules and mechanics
- TensorFlow.js team for browser-based ML
- Card game enthusiasts for inspiration

---

**Enjoy playing Pitch against AI! 🎯♠️♥️♦️♣️**
