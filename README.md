# ML Text Summarizer

A browser-based tool that uses machine learning and statistical algorithms to summarize text. This application leverages TensorFlow.js to run ML models directly in the browser without requiring a server.

## Live Demo

**Try it now**: [https://wsmontes.github.io/Summarize-It/](https://wsmontes.github.io/Summarize-It/)

The application is deployed and accessible online through GitHub Pages.

## Features

- **Multiple summarization methods**: Choose between ML-based or statistical approaches
  - ML-based uses transformer models for context-aware summarization
  - Statistical uses frequency analysis and graph-based algorithms
- **Various ML models**: Options from lightweight to professional-grade summarization models
  - Models are progressively loaded with shared layers for efficiency
  - Model weights are cached using IndexedDB for faster subsequent loads
- **Key element extraction**: Automatically identifies themes, entities, and important points
  - Implements custom NER (Named Entity Recognition) for entity extraction
  - Uses n-gram analysis with TF-IDF weighting for theme identification
- **Multiple summary views**: Basic summary, enhanced summary, and key elements analysis
  - Views are dynamically generated with web components
  - State management ensures consistent data across views
- **Visual feedback**: Progress indicators for model loading and processing
  - Animated progress bars with percentage completion
  - Cancelable operations for improved user experience
- **No server required**: Runs entirely in the browser
  - Uses WebWorkers for non-blocking processing of large texts
  - IndexedDB for model weight storage
- **Mobile-optimized interface**: Fully responsive design that works across all devices
  - Touch-friendly controls with appropriate hit targets
  - Adaptive layouts that reorganize based on screen size
  - Optimized text input for mobile keyboards
  - Mobile-specific UI enhancements for better readability

## Technical Implementation

### Summarization Pipeline

The application implements a multi-stage summarization pipeline:

1. **Content Analysis**: Text is analyzed for entities, themes, and semantic structure
   - Sentence segmentation using punctuation rules and neural heuristics
   - Part-of-speech tagging for identifying subject-verb-object relationships
   - Discourse analysis to identify argumentative structure
   
2. **Extractive Phase**: Important sentences are identified using various algorithms:
   - TextRank algorithm (graph-based ranking)
     - Cosine similarity matrix construction
     - PageRank-like iterative convergence
     - Damping factor of 0.85 with 30 iterations
   - TF-IDF scoring for keyword importance
     - Custom stopwords filtering with domain adaptation
     - Log-normalized term frequency
     - Inverse document frequency with smoothing
   - Sentence position and structural importance scoring
     - Position-based weighting with exponential decay
     - Structural role detection (topic sentences, conclusions)
     - Cue phrase identification ("in conclusion", "importantly")

3. **Abstractive Enhancement**: Extracted content is rewritten to improve flow
   - Sentence fusion for related consecutive sentences
   - Pronoun resolution to maintain reference clarity
   - Discourse marker insertion for improved readability
   - Redundancy elimination through entailment detection

4. **Key Element Extraction**: Themes, entities and important points are identified
   - Hierarchical clustering of keywords to form themes
   - Entity linking to consolidate mentions
   - Importance scoring using centrality and frequency metrics
   - Sentiment analysis for opinion-oriented content

### ML Models

Several machine learning approaches are implemented:

- **Universal Sentence Encoder (USE)**: Creates semantic embeddings for sentences
  - Implementation uses TF.js with the transformer variant
  - 512-dimensional embeddings with L2 normalization
  - Dynamic batching for improved processing speed
  - Cached embeddings for repetitive content
  
- **MobileBERT**: A compressed BERT model optimized for mobile/browser environments
  - Knowledge distillation with progressive layer dropping
  - Bottleneck structures with inverted residuals
  - Quantized to 8-bit integer operations
  - Custom attention mechanism with reduced parameters
  
- **TinyBERT**: A highly optimized, lightweight BERT variant
  - 4-layer architecture with 312 hidden dimensions
  - Layer-wise distillation from larger BERT models
  - Task-specific fine-tuning for summarization
  - Embedding factorization techniques
  
- **Statistical Processor**: Non-ML fallback using TF-IDF and TextRank
  - Porter stemming for English texts
  - Custom implementation of TextRank with optimized matrix operations
  - Greedy sentence selection with MMR (Maximum Marginal Relevance)
  - Length normalization to avoid bias toward longer sentences

Models are loaded dynamically via TensorFlow.js with progress indicators and chunk-based downloads to minimize memory spikes.

### LLM Simulation Handler

A sophisticated local LLM simulation system provides enhanced summarization capabilities:

- **Content Type Detection**: Identifies biographical, technical, or general content
  - Vocabulary-based classifier with domain-specific lexicons
  - Structural pattern recognition for different document types
  - Citation and reference detection for academic content
  
- **Adaptive Summarization**: Adjusts summary style based on content type
  - Technical content retains more specialized terminology
  - Narrative content preserves chronological structure
  - Argumentative content maintains logical flow
  
- **Entity Preservation**: Maintains important named entities in summaries
  - Entity ranking algorithm based on centrality and frequency
  - Co-reference resolution to track entities across text
  - Entity disambiguation for multiple mentions
  
- **Structure Analysis**: Examines text structure to generate cohesive summaries
  - Rhetorical structure theory implementation
  - Document sectioning with hierarchical relationships
  - Topic segmentation for multi-topic documents
  
- **Transition Control**: Avoids overuse of linking words like "furthermore" or "moreover"
  - Discourse marker inventory with usage frequency tracking
  - Variation algorithms to ensure natural language flow
  - Contextual insertion based on semantic relationships

### Key Element Extraction

The application implements advanced techniques to extract:

- **Themes**: Important topics and concepts using n-gram analysis and frequency scoring
  - Topic modeling with Non-negative Matrix Factorization
  - Hierarchical clustering with Ward linkage
  - KeyBERT implementation for keyword extraction
  - Concept linking with semantic similarity
  
- **Entities**: People, organizations, and other named entities using NER techniques
  - Custom NER model trained on general and domain-specific corpora
  - Gazetteer-based recognition for common entities
  - Regular expression patterns for dates, numbers, and structured entities
  - Entity relationship mapping
  
- **Key Points**: Important sentences that contain critical information
  - Centrality-based selection in semantic networks
  - Information density scoring with entropy measures
  - Novelty detection to avoid redundancy
  - Coverage optimization for comprehensive representation
  
- **Categories**: Semantic grouping of extracted themes and entities
  - Hierarchical topic clustering
  - Ontology-based classification
  - Custom taxonomy mapping
  - Dynamic category generation based on content

### User Interface

The interface provides three views for summarized content:

1. **Key Elements**: Displays themes, entities, and key points with relevance indicators
   - Interactive visualization with collapsible sections
   - Heat map visualization for relevance scores
   - Entity linking between mentions
   - Filter controls for focused analysis
   
2. **Basic Summary**: Shows the direct extractive summary
   - Highlighting of source sentences in original text
   - Adjustable summary length with real-time updates
   - Reading time estimation
   - Original context popup on hover
   
3. **Enhanced Summary**: Presents the abstractively rewritten summary
   - Sentence fusion indicators
   - Entity tracking with consistent references
   - Readability metrics display
   - Source attribution for transparency

Progress indicators provide visual feedback during model loading and processing, with cancelable operations and background processing using Web Workers.

### Responsive Design

The application features a fully responsive interface optimized for mobile devices:

- **Fluid Grid Layout**: Dynamically adjusts component sizes and positions based on viewport dimensions
  - CSS Grid and Flexbox implementation for adaptive layouts
  - Breakpoint system for targeted device-specific styling
  - Container queries for component-level responsiveness

- **Touch-Optimized Controls**:
  - Larger touch targets for buttons and interactive elements (minimum 44×44px)
  - Custom touch gestures for summary navigation and model selection
  - Haptic feedback for interactive elements
  - Mobile-friendly form inputs with appropriate keyboard types

- **Mobile Performance Optimizations**:
  - Reduced animations on low-power devices
  - Optimized asset loading for cellular networks
  - Deferred processing of non-critical UI elements
  - Compressed model variants for mobile data considerations

- **Adaptive Content Presentation**:
  - Collapsible sections for better information hierarchy on small screens
  - Font size and line height adjustments for improved readability
  - Simplified views for constrained viewports
  - Bottom navigation pattern for mobile access to key functions

- **Device-Specific Enhancements**:
  - Dark mode support with automatic detection of system preferences
  - Respect for safe areas on notched devices
  - Integration with system sharing capabilities
  - Orientation change handling for optimal viewing experience

- **Mobile Testing Framework**:
  - Cross-device testing protocol covering iOS and Android
  - Touch event simulation for consistent behavior
  - Viewport emulation for development and debugging
  - Performance benchmarking across device tiers

### Data Flow Architecture

The application uses a unidirectional data flow architecture:

1. Text input is processed through the text analyzer service
2. Processed text is sent to the selected summarization model
3. Model outputs are processed by the summary generator
4. Generated summaries are rendered by the UI controller
5. User interactions trigger state updates through action dispatchers

All processing is done in separate Web Workers to maintain UI responsiveness.

## Project Structure

```
Summarize-It/
├── index.html              # Main HTML file with application structure
├── css/
│   ├── styles.css          # Application styling
│   ├── responsive.css      # Responsive design rules
│   └── mobile.css          # Mobile-specific enhancements
├── js/
│   ├── app.js              # Application initialization and main logic
│   ├── models/             # ML model implementations
│   │   ├── model-registry.js  # Registry of available models
│   │   ├── ml-summarizer.js   # ML-based summarization logic
│   │   ├── use-model.js       # Universal Sentence Encoder implementation
│   │   ├── mobilebert.js      # MobileBERT implementation
│   │   └── tinybert.js        # TinyBERT implementation
│   ├── utils/              # Utility functions
│   │   ├── key-elements-extractor.js  # Extracts themes and entities
│   │   ├── text-summarizer.js         # Statistical summarization
│   │   ├── tf-models.js               # TensorFlow.js interface
│   │   ├── text-processor.js          # Text preprocessing utilities
│   │   └── storage-manager.js         # IndexedDB model caching
│   ├── generators/         # Content generation
│   │   ├── summary-generator.js       # Generates different summary types
│   │   ├── extractive-generator.js    # Extractive summary generation
│   │   └── abstractive-generator.js   # Abstractive summary enhancement
│   ├── workers/            # Web Workers implementation
│   │   ├── summarization-worker.js    # Background summarization processing
│   │   └── model-loader-worker.js     # Asynchronous model loading
│   └── ui/                 # User interface components
│       ├── ui-controller.js           # UI interaction handling
│       ├── progress-indicator.js      # Progress visualization components
│       ├── view-manager.js            # Manages different summary views
│       ├── responsive-handler.js      # Handles responsive layout adjustments
│       └── touch-controller.js        # Mobile touch interaction handling
└── server.js               # Optional simple server (not required to run the app)
```

## Running the Application

### Method 1: GitHub Pages (Recommended)

Visit [https://wsmontes.github.io/Summarize-It/](https://wsmontes.github.io/Summarize-It/) to use the application directly in your browser without any installation.

### Method 2: Direct File Access

Simply open the `index.html` file in your web browser. The application is designed to run directly from the file system.

### Method 3: Using a Local Server (Optional)

If you prefer to run it through a server:

1. With Node.js installed, run:
   ```
   node server.js
   ```
   Then open http://localhost:8000

2. Or use Python:
   ```
   python -m http.server
   ```
   Then open http://localhost:8000

## Available Models

| Model | Size | Speed | Description |
|-------|------|-------|-------------|
| **Universal Sentence Encoder** | 33MB | Medium | Good balance of quality and performance |
| **MobileBERT** | 21MB | Medium-Fast | Optimized for mobile environments |
| **TinyBERT** | 12MB | Fast | Resource-efficient model |
| **Statistical Processor** | 0MB | Very Fast | No ML model download required |

Premium and professional models are also available in the interface with larger download sizes but improved summarization quality.

## Performance Considerations

- **Memory Management**: Models are loaded and unloaded dynamically to minimize memory footprint
- **Lazy Loading**: Components and models are loaded only when needed
- **Web Workers**: CPU-intensive tasks run in separate threads to maintain UI responsiveness
- **Incremental Processing**: Large texts are processed in chunks to avoid browser freezing
- **IndexedDB Caching**: Model weights are stored locally to avoid redundant downloads
- **Adaptive Quality**: Summary quality scales with available system resources
- **Throttling**: Resource-intensive operations are throttled on low-end devices
- **Mobile Optimizations**: Special considerations for mobile devices:
  - Automatic quality adjustment based on device capabilities
  - Reduced processing batch sizes on mobile devices
  - Optimized touch response through event delegation
  - Battery-aware processing that adapts to power conditions

## How to Use

1. Open the application in your browser
2. Select a summarization model
3. Enter or paste the text you want to summarize
4. Adjust the number of sentences you want in the summary
5. Click "Summarize"
6. View the results in the three available tabs

## Browser Compatibility

Tested and working in:
- Chrome (recommended)
- Firefox
- Edge
- Safari (desktop and mobile)
- Chrome for Android
- Safari for iOS

## Mobile-Specific Tips

- For optimal experience on mobile devices, use the app in portrait orientation for input and landscape for viewing summaries
- On devices with limited RAM, prefer the Statistical Processor or TinyBERT models
- Allow "Add to Home Screen" for app-like experience with improved performance
- When processing large documents on mobile, keep the app in the foreground to prevent background processing limitations

## Notes

- The first time you use an ML model, it will need to download, which may take some time depending on your connection speed
- After the initial download, the models are cached by the browser for faster subsequent use
- The statistical processor option requires no download and works immediately
