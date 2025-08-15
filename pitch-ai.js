class PitchAI {
    constructor() {
        this.suits = ['C', 'D', 'H', 'S'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        this.cardMap = {};
        this.invCardMap = {};
        this.bidActions = [0, 2, 3, 4]; // 0 = Pass
        this.gameValues = {'T': 10, 'J': 1, 'Q': 2, 'K': 3, 'A': 4};
        
        // Initialize card mappings
        for (let i = 0; i < this.ranks.length; i++) {
            for (let j = 0; j < this.suits.length; j++) {
                const card = this.ranks[i] + this.suits[j];
                const index = i * this.suits.length + j;
                this.cardMap[card] = index;
                this.invCardMap[index] = card;
            }
        }
        
        this.gameState = {
            phase: 'waiting', // waiting, bidding, playing
            currentPlayer: 0,
            dealer: 0,
            hands: [[], [], [], []],
            currentTrick: [null, null, null, null],
            playOrder: [], // Track the order of play in the current trick
            historyOfPlayedCards: [],
            trumpSuit: null,
            bidWinner: null,
            bidAmount: 0,
            biddingTeam: null,
            lowTrumpHolderTeam: null,
            scores: [0, 0, 0, 0],
            trickWins: [0, 0, 0, 0], // Track trick wins separately
            specialPoints: [0, 0, 0, 0], // Track special points separately
            prevTrick: [],
            prevWinner: null,
            bids: [null, null, null, null], // Track all bids
            roundResults: { jack: null, low: null, high: null, game: null }, // Track round results
            cardsWonInTricks: [[], [], [], []], // Track cards won by each player in tricks
            isTransitioning: false // Flag to prevent card selection during trick transitions
        };
        
        this.models = {
            bidding: null,
            playing: null
        };
        
        this.isAutoPlay = false;
        this.init();
    }
    
    async init() {
        // Wait a bit for TensorFlow.js to be fully loaded
        await this.delay(1000);
        await this.loadModels();
        this.setupEventListeners();
        this.updateUI();
    }
    
    async loadModels() {
        try {
            // Wait for TensorFlow.js to be fully loaded
            if (typeof tf === 'undefined') {
                throw new Error('TensorFlow.js not loaded yet');
            }
            
            console.log('TensorFlow.js version:', tf.version);
            console.log('Starting model loading...');
            
            // Try to load pre-trained models, but don't fail if they don't work
            console.log('Attempting to load pre-trained models...');
            
            try {
                // Load bidding model
                this.updateModelStatus('bidding', 'loading');
                console.log('Loading bidding model from: ./models/bidding_model/model.json');
                this.models.bidding = await tf.loadLayersModel('./models/bidding_model/model.json');
                this.updateModelStatus('bidding', 'ready');
                console.log('Bidding model loaded successfully');
            } catch (biddingError) {
                console.warn('Bidding model failed to load:', biddingError.message);
                this.models.bidding = null;
                this.updateModelStatus('bidding', 'error');
            }
            
            try {
                // Load playing model
                this.updateModelStatus('playing', 'loading');
                console.log('Loading playing model from: ./models/playing_model/model.json');
                this.models.playing = await tf.loadLayersModel('./models/playing_model/model.json');
                this.updateModelStatus('playing', 'ready');
                console.log('Playing model loaded successfully');
            } catch (playingError) {
                console.warn('Playing model failed to load:', playingError.message);
                this.models.playing = null;
                this.updateModelStatus('playing', 'error');
            }
            
            // If either model failed to load, we'll use random behavior
            if (!this.models.bidding || !this.models.playing) {
                console.log('Some models failed to load, will use random AI behavior');
                
                // Update status for failed models
                if (!this.models.bidding) {
                    this.updateModelStatus('bidding', 'not available');
                }
                if (!this.models.playing) {
                    this.updateModelStatus('playing', 'not available');
                }
            } else {
                console.log('All pre-trained models loaded successfully');
            }
            
        } catch (error) {
            console.error('Unexpected error during model loading:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                tfAvailable: typeof tf !== 'undefined',
                tfVersion: typeof tf !== 'undefined' ? tf.version : 'N/A'
            });
            
            // Set models to null so we can use fallback behavior
            this.models.bidding = null;
            this.models.playing = null;
            
            // Update status to show models are not available
            this.updateModelStatus('bidding', 'error');
            this.updateModelStatus('playing', 'error');
            
            // Add helpful error message to the UI
            this.showModelError();
            
            console.log('Models failed to load, will use random AI behavior');
        }
    }
    
    // No fallback models - we'll use random behavior if models don't load
    
    updateModelStatus(modelType, status) {
        const element = document.getElementById(`${modelType}-status`);
        if (element) {
            element.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            element.className = `status ${status}`;
        }
    }
    
    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('auto-play-btn').addEventListener('click', () => this.toggleAutoPlay());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        
        // Setup bidding buttons
        document.querySelectorAll('.bid-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bidValue = parseInt(e.target.dataset.bid);
                // Find the index in bidActions array that matches the bid value
                const bidIndex = this.bidActions.indexOf(bidValue);
                this.makeBid(bidIndex);
            });
        });
    }
    
    newGame() {
        this.gameState = {
            phase: 'bidding',
            currentPlayer: 0,
            dealer: Math.floor(Math.random() * 4),
            hands: [[], [], [], []],
            currentTrick: [null, null, null, null],
            playOrder: [], // Track the order of play in the current trick
            historyOfPlayedCards: [],
            trumpSuit: null,
            bidWinner: null,
            bidAmount: 0,
            biddingTeam: null,
            lowTrumpHolderTeam: null,
            scores: [0, 0, 0, 0],
            trickWins: [0, 0, 0, 0],
            specialPoints: [0, 0, 0, 0],
            prevTrick: [],
            prevWinner: null,
            bids: [null, null, null, null],
            roundResults: { jack: null, low: null, high: null, game: null },
            cardsWonInTricks: [[], [], [], []],
            isTransitioning: false
        };
        
        this.dealCards();
        this.startBiddingPhase();
        this.updateUI();
    }
    
    dealCards() {
        const deck = Object.keys(this.cardMap);
        // Shuffle deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        // Deal 6 cards to each player
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 4; j++) {
                this.gameState.hands[j].push(deck.pop());
            }
        }
        
        // Sort player's hand by suit and rank
        this.sortPlayerHand();
        
        // Trump suit will be determined when the first card is played
        this.gameState.trumpSuit = null;
    }
    
    calculateSpecialPointsAtDeal() {
        // This method is now deprecated - special points are calculated when trump suit is determined
        // during the first trick, not at deal time
        console.log('calculateSpecialPointsAtDeal called but trump suit may not be set yet');
    }
    
    calculateSpecialPointsWhenTrumpDetermined() {
        // Calculate special points after trump suit is determined during the first trick
        // Reset special points to ensure clean calculation
        this.gameState.specialPoints = [0, 0, 0, 0];
        this.gameState.roundResults = { jack: null, low: null, high: null, game: null };
        
        console.log('Calculating special points with trump suit:', this.gameState.trumpSuit);
        
        // 1. Jack of Trump - only awarded if someone has it
        const jackTrump = 'J' + this.gameState.trumpSuit;
        let jackFound = false;
        for (let i = 0; i < 4; i++) {
            if (this.gameState.hands[i].includes(jackTrump)) {
                this.gameState.roundResults.jack = i;
                jackFound = true;
                // Jack point goes to the team that has the jack (only 1 point total)
                if (i % 2 === 0) {
                    // Team 0 (players 0 and 2) - only add to player 0
                    this.gameState.specialPoints[0] += 1;
                } else {
                    // Team 1 (players 1 and 3) - only add to player 1
                    this.gameState.specialPoints[1] += 1;
                }
                break;
            }
        }
        
        if (!jackFound) {
            this.gameState.roundResults.jack = null;
        }
        
        // 2. Low Trump - awarded every round to the team with lowest rank trump in starting hand
        let lowestTrump = null;
        let lowestTrumpPlayer = null;
        for (let i = 0; i < 4; i++) {
            for (const card of this.gameState.hands[i]) {
                if (card[1] === this.gameState.trumpSuit) {
                    if (lowestTrump === null || this.ranks.indexOf(card[0]) < this.ranks.indexOf(lowestTrump[0])) {
                        lowestTrump = card;
                        lowestTrumpPlayer = i;
                    }
                }
            }
        }
        
        if (lowestTrump) {
            this.gameState.roundResults.low = lowestTrumpPlayer;
            // Low point goes to the team that has the lowest trump (only 1 point total)
            if (lowestTrumpPlayer % 2 === 0) {
                // Team 0 (players 0 and 2) - only add to player 0
                this.gameState.specialPoints[0] += 1;
            } else {
                // Team 1 (players 1 and 3) - only add to player 1
                this.gameState.specialPoints[1] += 1;
            }
        }
        
        // 3. High Trump - awarded every round to the team with highest rank trump in starting hand
        let highestTrump = null;
        let highestTrumpPlayer = null;
        for (let i = 0; i < 4; i++) {
            for (const card of this.gameState.hands[i]) {
                if (card[1] === this.gameState.trumpSuit) {
                    if (highestTrump === null || this.ranks.indexOf(card[0]) > this.ranks.indexOf(highestTrump[0])) {
                        highestTrump = card;
                        highestTrumpPlayer = i;
                    }
                }
            }
        }
        
        if (highestTrump) {
            this.gameState.roundResults.high = highestTrumpPlayer;
            // High point goes to the team that has the highest trump (only 1 point total)
            if (highestTrumpPlayer % 2 === 0) {
                // Team 0 (players 0 and 2) - only add to player 0
                this.gameState.specialPoints[0] += 1;
            } else {
                // Team 1 (players 1 and 3) - only add to player 1
                this.gameState.specialPoints[1] += 1;
            }
        }
        
        // Debug logging for special points calculation
        console.log('Special points calculated with trump suit:', {
            trumpSuit: this.gameState.trumpSuit,
            jack: this.gameState.roundResults.jack,
            low: this.gameState.roundResults.low,
            high: this.gameState.roundResults.high,
            specialPoints: this.gameState.specialPoints,
            totalSpecialPoints: this.gameState.specialPoints[0] + this.gameState.specialPoints[1]
        });
        
        // Verify total special points never exceeds 4
        const totalSpecialPoints = this.gameState.specialPoints[0] + this.gameState.specialPoints[1];
        if (totalSpecialPoints > 4) {
            console.error('ERROR: Total special points exceeds 4!', this.gameState.specialPoints);
        }
    }
    
    sortPlayerHand() {
        // Sort by suit first (C, D, H, S), then by rank (2 to A)
        this.gameState.hands[0].sort((a, b) => {
            const suitOrder = { 'C': 0, 'D': 1, 'H': 2, 'S': 3 };
            const rankOrder = { '2': 12, '3': 11, '4': 10, '5': 9, '6': 8, '7': 7, '8': 6, '9': 5, 'T': 4, 'J': 3, 'Q': 2, 'K': 1, 'A': 0 };
            
            const suitA = suitOrder[a[1]];
            const suitB = suitOrder[b[1]];
            
            if (suitA !== suitB) {
                return suitA - suitB;
            }
            
            const rankA = rankOrder[a[0]];
            const rankB = rankOrder[b[0]];
            return rankA - rankB;
        });
    }
    
    startBiddingPhase() {
        this.gameState.phase = 'bidding';
        this.gameState.currentPlayer = (this.gameState.dealer + 1) % 4;
        this.updateUI();
        
        if (this.gameState.currentPlayer !== 0) {
            this.makeAIBid();
        }
    }
    
    async makeAIBid() {
        if (this.gameState.currentPlayer === 0 || this.gameState.phase !== 'bidding') return;
        
        await this.delay(1000); // Add delay for better UX
        
        const state = this.getBiddingState(this.gameState.currentPlayer);
        const legalBids = this.getLegalBids();
        
        const bidAction = await this.getAIBidAction(state, legalBids);
        this.processBid(bidAction);
    }
    
    async getAIBidAction(state, legalBids) {
        if (!this.models.bidding) {
            // Use random behavior if model not loaded
            const legalBidIndices = legalBids.map((legal, i) => legal ? i : -1).filter(i => i !== -1);
            return legalBidIndices[Math.floor(Math.random() * legalBidIndices.length)];
        }
        
        const input = tf.tensor2d([state], [1, state.length]);
        const prediction = this.models.bidding.predict(input);
        const actionProbs = await prediction.array();
        
        // Clean up tensor
        input.dispose();
        prediction.dispose();
        
        // Apply legal moves mask
        const maskedProbs = actionProbs[0].map((prob, i) => legalBids[i] ? prob : 0);
        const sum = maskedProbs.reduce((a, b) => a + b, 0);
        const normalizedProbs = maskedProbs.map(prob => prob / sum);
        
        // Sample action based on probabilities
        const random = Math.random();
        let cumulative = 0;
        for (let i = 0; i < normalizedProbs.length; i++) {
            cumulative += normalizedProbs[i];
            if (random <= cumulative) {
                return i;
            }
        }
        return 0; // Fallback to pass
    }
    
    getBiddingState(playerId) {
        const handVector = new Array(52).fill(0);
        for (const card of this.gameState.hands[playerId]) {
            handVector[this.cardMap[card]] = 1;
        }
        
        const positionVector = new Array(4).fill(0);
        positionVector[playerId] = 1;
        
        return [...handVector, ...positionVector];
    }
    
    getLegalBids() {
        const legalBids = new Array(this.bidActions.length).fill(false);
        legalBids[0] = true; // Pass is always legal
        
        for (let i = 1; i < this.bidActions.length; i++) {
            if (this.bidActions[i] > this.gameState.bidAmount) {
                legalBids[i] = true;
            }
        }
        
        return legalBids;
    }
    
    makeBid(bidIndex) {
        if (this.gameState.phase !== 'bidding' || this.gameState.currentPlayer !== 0) return;
        
        this.processBid(bidIndex);
    }
    
    processBid(bidIndex) {
        const bid = this.bidActions[bidIndex];
        const playerId = this.gameState.currentPlayer;
        
        // Record the bid
        this.gameState.bids[playerId] = bid;
        
        if (bid > this.gameState.bidAmount) {
            this.gameState.bidWinner = playerId;
            this.gameState.bidAmount = bid;
        }
        
        this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 4;
        
        // Show the bid for a moment before continuing
        this.updateUI();
        
        if (this.gameState.currentPlayer === (this.gameState.dealer + 1) % 4) {
            // End bidding phase after a delay to show final bids
            setTimeout(() => this.endBiddingPhase(), 2000);
        } else {
            if (this.gameState.currentPlayer !== 0) {
                this.makeAIBid();
            }
        }
    }
    
    endBiddingPhase() {
        if (this.gameState.bidWinner === null) {
            this.gameState.bidWinner = this.gameState.dealer;
            this.gameState.bidAmount = 2;
        }
        
        this.gameState.biddingTeam = this.gameState.bidWinner % 2 === 0 ? 'team0' : 'team1';
        this.gameState.phase = 'playing';
        this.gameState.currentPlayer = this.gameState.bidWinner;
        this.gameState.currentTrick = [null, null, null, null];
        this.gameState.playOrder = []; // Reset play order for new trick
        
        console.log('Bidding phase ended:', {
            bidWinner: this.gameState.bidWinner,
            biddingTeam: this.gameState.biddingTeam,
            currentPlayer: this.gameState.currentPlayer
        });
        
        this.updateUI();
        
        if (this.gameState.currentPlayer !== 0) {
            this.makeAIPlay();
        }
    }
    
    async makeAIPlay() {
        if (this.gameState.currentPlayer === 0 || this.gameState.phase !== 'playing') return;
        
        await this.delay(1000);
        
        const state = this.getPlayingState(this.gameState.currentPlayer);
        const legalMoves = this.getLegalMoves(this.gameState.currentPlayer);
        
        const cardIndex = await this.getAIPlayAction(state, legalMoves);
        this.playCard(cardIndex);
    }
    
    async getAIPlayAction(state, legalMoves) {
        if (!this.models.playing) {
            // Use random behavior if model not loaded
            const legalIndices = legalMoves.map((legal, i) => legal ? i : -1).filter(i => i !== -1);
            return legalIndices[Math.floor(Math.random() * legalIndices.length)];
        }
        
        const input = tf.tensor2d([state], [1, state.length]);
        const prediction = this.models.playing.predict(input);
        const actionProbs = await prediction.array();
        
        // Clean up tensor
        input.dispose();
        prediction.dispose();
        
        // Apply legal moves mask
        const maskedProbs = actionProbs[0].map((prob, i) => legalMoves[i] ? prob : 0);
        const sum = maskedProbs.reduce((a, b) => a + b, 0);
        const normalizedProbs = maskedProbs.map(prob => prob / sum);
        
        // Sample action based on probabilities
        const random = Math.random();
        let cumulative = 0;
        for (let i = 0; i < normalizedProbs.length; i++) {
            cumulative += normalizedProbs[i];
            if (random <= cumulative) {
                return i;
            }
        }
        return 0;
    }
    
    getPlayingState(playerId) {
        const handVector = new Array(52).fill(0);
        for (const card of this.gameState.hands[playerId]) {
            handVector[this.cardMap[card]] = 1;
        }
        
        const trumpVector = new Array(4).fill(0);
        if (this.gameState.trumpSuit) {
            trumpVector[this.suits.indexOf(this.gameState.trumpSuit)] = 1;
        }
        
        const trickVector = new Array(52).fill(0);
        for (const card of this.gameState.currentTrick) {
            if (card) {
                trickVector[this.cardMap[card]] = 1;
            }
        }
        
        const playedVector = new Array(52).fill(0);
        for (const card of this.gameState.historyOfPlayedCards) {
            playedVector[this.cardMap[card]] = 1;
        }
        
        const bidWinnerVector = new Array(4).fill(0);
        const bidAmountVector = new Array(4).fill(0);
        if (this.gameState.bidWinner !== null) {
            bidWinnerVector[this.gameState.bidWinner] = 1;
            if (this.gameState.bidAmount >= 2) {
                bidAmountVector[this.gameState.bidAmount - 2] = 1;
            }
        }
        
        const prevTrickVector = new Array(52).fill(0);
        for (const card of this.gameState.prevTrick) {
            if (card) {
                prevTrickVector[this.cardMap[card]] = 1;
            }
        }
        
        const prevWinnerVector = new Array(4).fill(0);
        if (this.gameState.prevWinner !== null) {
            prevWinnerVector[this.gameState.prevWinner] = 1;
        }
        
        return [
            ...handVector, ...trumpVector, ...trickVector, ...playedVector,
            ...bidWinnerVector, ...bidAmountVector, ...prevTrickVector, ...prevWinnerVector
        ];
    }
    
    getLegalMoves(playerId) {
        const hand = this.gameState.hands[playerId];
        const legalMask = new Array(52).fill(false);
        
        if (this.gameState.currentTrick.filter(card => card !== null).length === 0) {
            // Leading the trick - can play any card
            for (const card of hand) {
                legalMask[this.cardMap[card]] = true;
            }
        } else {
            // Following suit - must follow suit if you can, but can trump anytime
            // Find the first card played to establish lead suit
            let leadSuit = null;
            for (let i = 0; i < 4; i++) {
                if (this.gameState.currentTrick[i]) {
                    leadSuit = this.gameState.currentTrick[i][1];
                    break;
                }
            }
            const canFollowSuit = hand.some(card => card[1] === leadSuit);
            
            for (const card of hand) {
                if (card[1] === this.gameState.trumpSuit) {
                    // Trump can always be played
                    legalMask[this.cardMap[card]] = true;
                } else if (canFollowSuit && card[1] === leadSuit) {
                    // If you can follow suit, you must follow suit
                    legalMask[this.cardMap[card]] = true;
                } else if (!canFollowSuit) {
                    // If you can't follow suit, you can play anything
                    legalMask[this.cardMap[card]] = true;
                }
                // Note: If you can follow suit but don't want to, you can only play trump
            }
        }
        
        return legalMask;
    }
    
    playCard(cardIndex) {
        const card = this.invCardMap[cardIndex];
        const playerId = this.gameState.currentPlayer;
        
        if (!this.gameState.hands[playerId].includes(card)) return;
        
        this.gameState.currentTrick[playerId] = card;
        this.gameState.hands[playerId] = this.gameState.hands[playerId].filter(c => c !== card);
        this.gameState.historyOfPlayedCards.push(card);
        this.gameState.playOrder.push(playerId); // Add player to play order
        
        // Set trump suit on first card of first trick (when bid winner leads)
        if (this.gameState.historyOfPlayedCards.length === 1 && this.gameState.currentPlayer === this.gameState.bidWinner) {
            this.gameState.trumpSuit = card[1];
            console.log('Trump suit set to:', this.gameState.trumpSuit, 'by player', this.gameState.currentPlayer);
            
            // Calculate special points now that trump suit is determined
            this.calculateSpecialPointsWhenTrumpDetermined();
        }
        
        this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 4;
        
        if (this.gameState.currentTrick.filter(c => c !== null).length === 4) {
            // Update UI to show the fourth card before ending the trick
            this.updateUI();
            // Small delay to show the fourth card, then end the trick
            setTimeout(() => this.endTrick(), 500);
        } else {
            this.updateUI();
            if (this.gameState.currentPlayer !== 0) {
                this.makeAIPlay();
            }
        }
    }
    
    endTrick() {
        const winner = this.determineTrickWinner();
        this.gameState.prevWinner = winner;
        this.gameState.prevTrick = [...this.gameState.currentTrick];
        
        // Track who won the trick (for game point calculation)
        this.gameState.trickWins[winner] += 1;
        
        // Track the cards won in this trick by the winner
        console.log('Trick ended, winner:', winner, 'cards in trick:', this.gameState.currentTrick);
        for (const card of this.gameState.currentTrick) {
            if (card) {
                this.gameState.cardsWonInTricks[winner].push(card);
                console.log('Added card', card, 'to player', winner, 'cards won');
            }
        }
        
        // Check if round is over (all players should have no cards left)
        if (this.gameState.hands.every(hand => hand.length === 0)) {
            this.endRound();
        } else {
            // Set transition flag to prevent card selection
            this.gameState.isTransitioning = true;
            this.updateUI();
            
            // Add delay so players can observe the cards played
            setTimeout(() => {
                this.gameState.currentPlayer = winner;
                this.gameState.currentTrick = [null, null, null, null];
                this.gameState.playOrder = []; // Reset play order for new trick
                this.gameState.isTransitioning = false; // Clear transition flag
                this.updateUI();
                
                if (this.gameState.currentPlayer !== 0) {
                    this.makeAIPlay();
                }
            }, 1500);
        }
    }
    
    determineTrickWinner() {
        let winningCard = null;
        let winner = -1;
        let leadSuit = null;
        
        // Find the first card to establish lead suit (first player in play order)
        if (this.gameState.playOrder.length > 0) {
            const firstPlayer = this.gameState.playOrder[0];
            const firstCard = this.gameState.currentTrick[firstPlayer];
            if (firstCard) {
                leadSuit = firstCard[1];
            }
        }
        
        console.log('Lead suit established:', leadSuit);
        console.log('Play order:', this.gameState.playOrder);
        
        // Compare each card in the order they were played
        for (let i = 0; i < this.gameState.playOrder.length; i++) {
            const playerId = this.gameState.playOrder[i];
            const card = this.gameState.currentTrick[playerId];
            if (!card) continue;
            
            if (winner === -1) {
                // First card played
                winningCard = card;
                winner = playerId;
                console.log(`First card played: ${card} by player ${playerId} becomes initial winner`);
            } else {
                const currentWinningCard = this.gameState.currentTrick[winner];
                console.log(`Comparing ${card} (player ${playerId}) vs ${currentWinningCard} (player ${winner}), leadSuit: ${leadSuit}, trumpSuit: ${this.gameState.trumpSuit}`);
                
                // Trump always beats non-trump
                if (card[1] === this.gameState.trumpSuit && currentWinningCard[1] !== this.gameState.trumpSuit) {
                    winningCard = card;
                    winner = playerId;
                    console.log(`${card} (trump) beats ${currentWinningCard} (non-trump)`);
                } else if (card[1] !== this.gameState.trumpSuit && currentWinningCard[1] === this.gameState.trumpSuit) {
                    // Current winner is trump, non-trump can't beat it
                    console.log(`${card} (non-trump) cannot beat ${currentWinningCard} (trump)`);
                    continue;
                } else if (card[1] === this.gameState.trumpSuit && currentWinningCard[1] === this.gameState.trumpSuit) {
                    // Both are trump - highest rank wins
                    if (this.ranks.indexOf(card[0]) > this.ranks.indexOf(currentWinningCard[0])) {
                        winningCard = card;
                        winner = playerId;
                        console.log(`${card} (higher trump) beats ${currentWinningCard} (lower trump)`);
                    } else {
                        console.log(`${card} (lower trump) cannot beat ${currentWinningCard} (higher trump)`);
                    }
                } else if (card[1] === leadSuit && currentWinningCard[1] === leadSuit) {
                    // Both follow suit - highest rank wins
                    if (this.ranks.indexOf(card[0]) > this.ranks.indexOf(currentWinningCard[0])) {
                        winningCard = card;
                        winner = playerId;
                        console.log(`${card} (higher lead suit) beats ${currentWinningCard} (lower lead suit)`);
                    } else {
                        console.log(`${card} (lower lead suit) cannot beat ${currentWinningCard} (higher lead suit)`);
                    }
                } else if (card[1] === leadSuit && currentWinningCard[1] !== leadSuit) {
                    // Card follows suit, current winner doesn't - card wins
                    winningCard = card;
                    winner = playerId;
                    console.log(`${card} (follows lead suit) beats ${currentWinningCard} (doesn't follow lead suit)`);
                } else if (card[1] !== leadSuit && currentWinningCard[1] === leadSuit) {
                    // Current winner follows suit, card doesn't - current winner stays
                    console.log(`${card} (doesn't follow lead suit) cannot beat ${currentWinningCard} (follows lead suit)`);
                    continue;
                } else if (card[1] !== leadSuit && currentWinningCard[1] !== leadSuit) {
                    // Neither card follows suit - higher rank wins
                    if (this.ranks.indexOf(card[0]) > this.ranks.indexOf(currentWinningCard[0])) {
                        winningCard = card;
                        winner = playerId;
                        console.log(`${card} (higher rank, neither follows suit) beats ${currentWinningCard} (lower rank, neither follows suit)`);
                    } else {
                        console.log(`${card} (lower rank, neither follows suit) cannot beat ${currentWinningCard} (higher rank, neither follows suit)`);
                    }
                }
            }
        }
        
        console.log('Trick winner determined:', {
            winner: winner,
            winningCard: winningCard,
            leadSuit: leadSuit,
            trumpSuit: this.gameState.trumpSuit,
            allCards: this.gameState.currentTrick,
            playOrder: this.gameState.playOrder
        });
        
        return winner;
    }
    
    endRound() {
        console.log('endRound called - starting round end processing');
        
        // Ensure trump suit is set - if not, set it based on the first card played
        if (!this.gameState.trumpSuit && this.gameState.historyOfPlayedCards.length > 0) {
            this.gameState.trumpSuit = this.gameState.historyOfPlayedCards[0][1];
            console.log('Trump suit was not set, setting to first card played:', this.gameState.trumpSuit);
        }
        
        console.log('Round end state:', {
            hands: this.gameState.hands,
            cardsWonInTricks: this.gameState.cardsWonInTricks,
            trickWins: this.gameState.trickWins,
            trumpSuit: this.gameState.trumpSuit,
            historyOfPlayedCards: this.gameState.historyOfPlayedCards
        });
        
        // Special points (Jack, Low, High) are already calculated when trump suit was determined
        // Only need to calculate Game point based on cards won in tricks
        this.calculateSpecialPoints();
        
        // Calculate total points for bidding team
        let biddingTeamTricks = 0;
        let nonBiddingTeamTricks = 0;
        
        if (this.gameState.biddingTeam === 'team0') {
            biddingTeamTricks = this.gameState.trickWins[0] + this.gameState.trickWins[2];
            nonBiddingTeamTricks = this.gameState.trickWins[1] + this.gameState.trickWins[3];
        } else {
            biddingTeamTricks = this.gameState.trickWins[1] + this.gameState.trickWins[3];
            nonBiddingTeamTricks = this.gameState.trickWins[0] + this.gameState.trickWins[2];
        }
        
        // Calculate special points for bidding team
        let biddingTeamSpecialPoints = 0;
        if (this.gameState.biddingTeam === 'team0') {
            // Team 0 special points are stored in player 0
            biddingTeamSpecialPoints = this.gameState.specialPoints[0];
        } else {
            // Team 1 special points are stored in player 1
            biddingTeamSpecialPoints = this.gameState.specialPoints[1];
        }
        
        const totalPoints = biddingTeamTricks + biddingTeamSpecialPoints;
        
        console.log('Round end calculation:', {
            biddingTeam: this.gameState.biddingTeam,
            bidAmount: this.gameState.bidAmount,
            biddingTeamTricks: biddingTeamTricks,
            biddingTeamSpecialPoints: biddingTeamSpecialPoints,
            totalPoints: totalPoints,
            trickWins: this.gameState.trickWins,
            specialPoints: this.gameState.specialPoints
        });
        
        if (totalPoints >= this.gameState.bidAmount) {
            // Bid made - award points equal to what they actually made
            if (this.gameState.biddingTeam === 'team0') {
                this.gameState.scores[0] += totalPoints;
            } else {
                this.gameState.scores[1] += totalPoints;
            }
        } else {
            // Bid failed - subtract bid amount (only once per team)
            if (this.gameState.biddingTeam === 'team0') {
                this.gameState.scores[0] -= this.gameState.bidAmount;
            } else {
                this.gameState.scores[1] -= this.gameState.bidAmount;
            }
        }
        
        // Show round results for observation before ending
        this.showRoundResults();
        
        // The round will continue when the player clicks the dismiss button
        // The continue logic is now handled in the dismiss button click handler
    }
    
    calculateSpecialPoints() {
        // Note: Jack, Low, and High Trump points are now calculated when trump suit is determined
        // This method only handles the Game point calculation
        
        // Game - awarded every round unless there's a tie
        // Calculate "game" points based on card values: 10=10, J=1, Q=2, K=3, A=4
        let team0GamePoints = 0;
        let team1GamePoints = 0;
        
        // Count game points from cards won in tricks
        for (let i = 0; i < 4; i++) {
            const cardsWon = this.gameState.cardsWonInTricks[i];
            for (const card of cardsWon) {
                const rank = card[0];
                let gameValue = 0;
                
                if (rank === 'T') {
                    gameValue = 10;
                } else if (rank === 'J') {
                    gameValue = 1;
                } else if (rank === 'Q') {
                    gameValue = 2;
                } else if (rank === 'K') {
                    gameValue = 3;
                } else if (rank === 'A') {
                    gameValue = 4;
                }
                // 2-9 have no game value
                
                if (i % 2 === 0) {
                    team0GamePoints += gameValue;
                } else {
                    team1GamePoints += gameValue;
                }
            }
        }
        
        // Award game point to team with most game points, unless tied
        if (team0GamePoints > team1GamePoints) {
            this.gameState.roundResults.game = 'team0';
            // Team 0 (players 0 and 2) - only add to player 0
            this.gameState.specialPoints[0] += 1;
        } else if (team1GamePoints > team0GamePoints) {
            this.gameState.roundResults.game = 'team1';
            // Team 1 (players 1 and 3) - only add to player 1
            this.gameState.specialPoints[1] += 1;
        } else {
            // Tie - no one gets the game point
            this.gameState.roundResults.game = 'tie';
        }
        
        // Debug logging
        console.log('Game point calculation:', {
            team0GamePoints,
            team1GamePoints,
            cardsWonInTricks: this.gameState.cardsWonInTricks,
            trumpSuit: this.gameState.trumpSuit
        });
    }
    
    showRoundResults() {
        console.log('Showing round results:', {
            roundResults: this.gameState.roundResults,
            trickWins: this.gameState.trickWins,
            specialPoints: this.gameState.specialPoints,
            bidWinner: this.gameState.bidWinner,
            biddingTeam: this.gameState.biddingTeam
        });
        
        // Create a temporary overlay to show round results
        const overlay = document.createElement('div');
        overlay.className = 'round-results-overlay';
        overlay.innerHTML = `
            <div class="round-results">
                <h3>Round Results</h3>
                <div class="results-grid">
                    <div class="result-item">
                        <span class="label">Jack of Trump:</span>
                        <span class="value">${this.gameState.roundResults.jack !== null ? 
                            (this.gameState.roundResults.jack === 0 ? 'You' : `AI ${this.gameState.roundResults.jack}`) : 'None'}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Low Trump:</span>
                        <span class="value">${this.gameState.roundResults.low !== null ? 
                            (this.gameState.roundResults.low === 0 ? 'You' : `AI ${this.gameState.roundResults.low}`) : 'None'}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">High Trump:</span>
                        <span class="value">${this.gameState.roundResults.high !== null ? 
                            (this.gameState.roundResults.high === 0 ? 'You' : `AI ${this.gameState.roundResults.high}`) : 'None'}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Game:</span>
                        <span class="value">${this.gameState.roundResults.game === 'team0' ? 'Your Team' : this.gameState.roundResults.game === 'team1' ? 'AI Team' : 'Tie (No Point Awarded)'} (Your Team: ${this.calculateTeamGamePoints(0)}, AI Team: ${this.calculateTeamGamePoints(1)})</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Tricks Won:</span>
                        <span class="value">Your Team: ${this.gameState.trickWins.filter((_, i) => i % 2 === 0).reduce((sum, points) => sum + points, 0)} | AI Team: ${this.gameState.trickWins.filter((_, i) => i % 2 === 1).reduce((sum, points) => sum + points, 0)}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Game Points:</span>
                        <span class="value">Your Team: ${this.calculateTeamGamePoints(0)} | AI Team: ${this.calculateTeamGamePoints(1)}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Special Points:</span>
                        <span class="value">Your Team: ${this.gameState.specialPoints[0]} | AI Team: ${this.gameState.specialPoints[1]}</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add a dismiss button to the overlay
        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'btn dismiss-btn';
        dismissBtn.textContent = 'Continue';
        dismissBtn.style.marginTop = '20px';
        dismissBtn.style.padding = '10px 20px';
        dismissBtn.style.backgroundColor = '#007bff';
        dismissBtn.style.color = 'white';
        dismissBtn.style.border = 'none';
        dismissBtn.style.borderRadius = '5px';
        dismissBtn.style.cursor = 'pointer';
        
        dismissBtn.addEventListener('click', () => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            
            // Continue the game logic after dismissing the round results
            // Check if a team has won (reached 11 points)
            const team0Score = this.gameState.scores[0];
            const team1Score = this.gameState.scores[1];
            
            if (team0Score >= 11 || team1Score >= 11) {
                // Game is over - show final results
                this.gameState.phase = 'game-over';
                this.showGameResults();
            } else {
                // Deal a new hand
                this.dealNewHand();
            }
        });
        
        overlay.querySelector('.round-results').appendChild(dismissBtn);
    }
    
    updateUI() {
        // Update scores
        document.querySelector('.team.team0 .score').textContent = this.gameState.scores[0];
        document.querySelector('.team.team1 .score').textContent = this.gameState.scores[1];
        
        // Update game status
        const phaseElement = document.getElementById('current-phase');
        const playerElement = document.getElementById('current-player');
        const trumpElement = document.getElementById('trump-suit');
        
        if (this.gameState.phase === 'waiting') {
            phaseElement.textContent = 'Game Complete';
            playerElement.textContent = '';
            trumpElement.textContent = '';
        } else if (this.gameState.phase === 'bidding') {
            phaseElement.textContent = 'Bidding Phase';
            playerElement.textContent = `Current Player: ${this.gameState.currentPlayer === 0 ? 'You' : `AI ${this.gameState.currentPlayer}`}`;
            trumpElement.textContent = '';
            
            // Show current bids
            this.updateBiddingDisplay();
        } else {
            if (this.gameState.isTransitioning) {
                phaseElement.textContent = 'Trick Complete - Next Trick Starting...';
                playerElement.textContent = 'Please wait...';
                trumpElement.textContent = this.gameState.trumpSuit ? `Trump: ${this.gameState.trumpSuit}` : '';
            } else {
                phaseElement.textContent = 'Playing Phase';
                playerElement.textContent = `Current Player: ${this.gameState.currentPlayer === 0 ? 'You' : `AI ${this.gameState.currentPlayer}`}`;
                trumpElement.textContent = this.gameState.trumpSuit ? `Trump: ${this.gameState.trumpSuit}` : '';
            }
        }
        
        // Update opponent card counts
        for (let i = 1; i < 4; i++) {
            const opponentElement = document.getElementById(`opponent-${i-1}`);
            const countElement = opponentElement.querySelector('.cards-count');
            countElement.textContent = `${this.gameState.hands[i].length} cards`;
        }
        
        // Update player hand
        this.updatePlayerHand();
        
        // Update trick area
        this.updateTrickArea();
        
        // Update bidding area
        this.updateBiddingArea();
    }
    
    updateBiddingDisplay() {
        // Show current bids in the game status area
        const trumpElement = document.getElementById('trump-suit');
        let bidText = 'Bids: ';
        for (let i = 0; i < 4; i++) {
            if (this.gameState.bids[i] !== null) {
                const playerName = i === 0 ? 'You' : `AI ${i}`;
                const bidValue = this.gameState.bids[i] === 0 ? 'Pass' : this.gameState.bids[i];
                bidText += `${playerName}: ${bidValue} | `;
            }
        }
        trumpElement.textContent = bidText.slice(0, -3); // Remove trailing " | "
    }
    
    updatePlayerHand() {
        const playerCardsElement = document.getElementById('player-cards');
        playerCardsElement.innerHTML = '';
        
        if (this.gameState.phase === 'waiting') return;
        
        for (const card of this.gameState.hands[0]) {
            const cardElement = this.createCardElement(card, true);
            cardElement.addEventListener('click', () => this.selectCard(card));
            
            // Disable cards during transitions
            if (this.gameState.isTransitioning) {
                cardElement.classList.add('disabled');
                cardElement.title = 'Please wait for next trick to start';
            }
            
            playerCardsElement.appendChild(cardElement);
        }
    }
    
    updateTrickArea() {
        const trickCardsElement = document.getElementById('trick-cards');
        trickCardsElement.innerHTML = '';
        
        // Show transition message if transitioning between tricks
        if (this.gameState.isTransitioning) {
            const transitionMessage = document.createElement('div');
            transitionMessage.className = 'transition-message';
            transitionMessage.textContent = 'Trick complete! Next trick starting in a moment...';
            trickCardsElement.appendChild(transitionMessage);
            return;
        }
        
        // Use determineTrickWinner to find the current winning player
        const winningPlayer = this.determineTrickWinner();
        
        for (let i = 0; i < 4; i++) {
            // Create a container for each slot with team label
            const slotContainer = document.createElement('div');
            slotContainer.className = 'trick-slot-container';
            
            // Create team label
            const teamLabel = document.createElement('div');
            teamLabel.className = 'team-label';
            
            // Set player-specific labels with team colors
            if (i === 0) {
                teamLabel.textContent = 'Player';
                teamLabel.style.color = '#28a745'; // Team 0 (Green)
            } else if (i === 1) {
                teamLabel.textContent = 'AI 1';
                teamLabel.style.color = '#dc3545'; // Team 1 (Red)
            } else if (i === 2) {
                teamLabel.textContent = 'AI 2';
                teamLabel.style.color = '#28a745'; // Team 0 (Green)
            } else if (i === 3) {
                teamLabel.textContent = 'AI 3';
                teamLabel.style.color = '#dc3545'; // Team 1 (Red)
            }
            
            slotContainer.appendChild(teamLabel);
            
            const card = this.gameState.currentTrick[i];
            if (card) {
                const cardElement = this.createCardElement(card, false);
                // Add highlight class if this is the winning card
                if (i === winningPlayer) {
                    cardElement.classList.add('winning-card');
                }
                slotContainer.appendChild(cardElement);
            } else {
                const emptySlot = document.createElement('div');
                emptySlot.className = 'card empty-slot';
                emptySlot.style.border = '2px dashed #ccc';
                emptySlot.style.background = '#f8f9fa';
                slotContainer.appendChild(emptySlot);
            }
            
            trickCardsElement.appendChild(slotContainer);
        }
    }
    
    updateBiddingArea() {
        const biddingArea = document.getElementById('bidding-area');
        if (this.gameState.phase === 'bidding' && this.gameState.currentPlayer === 0) {
            biddingArea.style.display = 'block';
            
            // Update legal bids
            const legalBids = this.getLegalBids();
            document.querySelectorAll('.bid-btn').forEach((btn, i) => {
                btn.disabled = !legalBids[i];
                btn.style.opacity = legalBids[i] ? '1' : '0.5';
            });
        } else {
            biddingArea.style.display = 'none';
        }
    }
    
    createCardElement(card, isPlayerCard) {
        const cardElement = document.createElement('div');
        cardElement.className = `card suit-${card[1]}`;
        
        const rankElement = document.createElement('div');
        rankElement.className = 'card-rank';
        rankElement.textContent = card[0];
        
        const suitElement = document.createElement('div');
        suitElement.className = 'card-suit';
        suitElement.textContent = this.getSuitSymbol(card[1]);
        
        cardElement.appendChild(rankElement);
        cardElement.appendChild(suitElement);
        
        if (!isPlayerCard) {
            cardElement.classList.add('opponent');
        }
        
        return cardElement;
    }
    
    getSuitSymbol(suit) {
        const symbols = {
            'C': '♣',
            'D': '♦',
            'H': '♥',
            'S': '♠'
        };
        return symbols[suit] || suit;
    }
    
    selectCard(card) {
        if (this.gameState.phase !== 'playing' || this.gameState.currentPlayer !== 0 || this.gameState.isTransitioning) return;
        
        const cardIndex = this.cardMap[card];
        const legalMoves = this.getLegalMoves(0);
        
        if (legalMoves[cardIndex]) {
            this.playCard(cardIndex);
        }
    }
    
    toggleAutoPlay() {
        this.isAutoPlay = !this.isAutoPlay;
        const btn = document.getElementById('auto-play-btn');
        btn.textContent = this.isAutoPlay ? 'Stop Auto Play' : 'Auto Play';
        btn.style.background = this.isAutoPlay ? '#dc3545' : '#6c757d';
        
        if (this.isAutoPlay) {
            this.autoPlay();
        }
    }
    
    async autoPlay() {
        while (this.isAutoPlay && this.gameState.phase !== 'waiting') {
            if (this.gameState.currentPlayer === 0) {
                if (this.gameState.phase === 'bidding') {
                    // Auto-bid
                    const legalBids = this.getLegalBids();
                    const legalBidIndices = legalBids.map((legal, i) => legal ? i : -1).filter(i => i !== -1);
                    const randomBidIndex = legalBidIndices[Math.floor(Math.random() * legalBidIndices.length)];
                    this.processBid(randomBidIndex);
                } else if (this.gameState.phase === 'playing') {
                    // Auto-play
                    const legalMoves = this.getLegalMoves(0);
                    const legalIndices = legalMoves.map((legal, i) => legal ? i : -1).filter(i => i !== -1);
                    const randomIndex = legalIndices[Math.floor(Math.random() * legalIndices.length)];
                    this.playCard(randomIndex);
                }
            }
            await this.delay(500);
        }
    }
    
    resetGame() {
        this.gameState = {
            phase: 'waiting',
            currentPlayer: 0,
            dealer: 0,
            hands: [[], [], [], []],
            currentTrick: [null, null, null, null],
            playOrder: [], // Track the order of play in the current trick
            historyOfPlayedCards: [],
            trumpSuit: null,
            bidWinner: null,
            bidAmount: 0,
            biddingTeam: null,
            lowTrumpHolderTeam: null,
            scores: [0, 0, 0, 0],
            trickWins: [0, 0, 0, 0],
            specialPoints: [0, 0, 0, 0],
            prevTrick: [],
            prevWinner: null,
            bids: [null, null, null, null],
            roundResults: { jack: null, low: null, high: null, game: null },
            cardsWonInTricks: [[], [], [], []],
            isTransitioning: false
        };
        
        this.isAutoPlay = false;
        const btn = document.getElementById('auto-play-btn');
        btn.textContent = 'Auto Play';
        btn.style.background = '#6c757d';
        
        this.updateUI();
    }
    
    dealNewHand() {
        // Reset round-specific state but keep scores
        this.gameState.phase = 'bidding';
        this.gameState.currentPlayer = 0;
        this.gameState.dealer = (this.gameState.dealer + 1) % 4;
        this.gameState.hands = [[], [], [], []];
        this.gameState.currentTrick = [null, null, null, null];
        this.gameState.historyOfPlayedCards = [];
        this.gameState.trumpSuit = null;
        this.gameState.bidWinner = null;
        this.gameState.bidAmount = 0;
        this.gameState.biddingTeam = null;
        this.gameState.lowTrumpHolderTeam = null;
        this.gameState.trickWins = [0, 0, 0, 0];
        this.gameState.specialPoints = [0, 0, 0, 0];
        this.gameState.prevTrick = [];
        this.gameState.isTransitioning = false;
        this.gameState.prevWinner = null;
        this.gameState.bids = [null, null, null, null];
        this.gameState.roundResults = { jack: null, low: null, high: null, game: null };
        this.gameState.cardsWonInTricks = [[], [], [], []];
        this.gameState.playOrder = []; // Reset play order for new trick
        
        // Deal new cards and start bidding
        this.dealCards();
        this.startBiddingPhase();
        this.updateUI();
    }
    
    calculateTeamGamePoints(teamId) {
        let totalGamePoints = 0;
        const startPlayer = teamId * 2;
        
        for (let i = startPlayer; i < startPlayer + 2; i++) {
            const cardsWon = this.gameState.cardsWonInTricks[i];
            for (const card of cardsWon) {
                const rank = card[0];
                let gameValue = 0;
                
                if (rank === 'T') {
                    gameValue = 10;
                } else if (rank === 'J') {
                    gameValue = 1;
                } else if (rank === 'Q') {
                    gameValue = 2;
                } else if (rank === 'K') {
                    gameValue = 3;
                } else if (rank === 'A') {
                    gameValue = 4;
                }
                // 2-9 have no game value
                
                totalGamePoints += gameValue;
            }
        }
        
        return totalGamePoints;
    }
    
    showModelError() {
        // Create a helpful error message below the model status
        const modelInfo = document.querySelector('.model-info');
        if (modelInfo && !document.getElementById('model-error-message')) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'model-error-message';
            errorDiv.innerHTML = `
                <strong>⚠️ AI Models Not Available</strong><br>
                The AI will use random behavior. This is normal when running locally.<br>
                <small>For full AI functionality, run with a local server: <code>python serve_local.py</code></small>
            `;
            modelInfo.appendChild(errorDiv);
        }
    }

    showGameResults() {
        const team0Score = this.gameState.scores[0];
        const team1Score = this.gameState.scores[1];
        const winner = team0Score >= 11 ? 'Team 1 (You & AI 2)' : 'Team 2 (AI 1 & AI 3)';
        
        // Create game over overlay
        const overlay = document.createElement('div');
        overlay.className = 'round-results-overlay';
        overlay.innerHTML = `
            <div class="round-results">
                <h3>Game Over!</h3>
                <div class="results-grid">
                    <div class="result-item">
                        <span class="label">Team 1 (You & AI 2):</span>
                        <span class="value">${team0Score} points</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Team 2 (AI 1 & AI 3):</span>
                        <span class="value">${team1Score} points</span>
                    </div>
                    <div class="result-item winner">
                        <span class="label">Winner:</span>
                        <span class="value">${winner}</span>
                    </div>
                </div>
                <button id="new-game-btn-final" class="btn">New Game</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add event listener for new game button
        document.getElementById('new-game-btn-final').addEventListener('click', () => {
            document.body.removeChild(overlay);
            this.resetGame();
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.pitchAI = new PitchAI();
});
