# ML Text Summarizer

A browser-based tool that uses machine learning and statistical algorithms to summarize text. This application leverages TensorFlow.js to run ML models directly in the browser without requiring a server.

## Features

- **Multiple summarization methods**: Choose between ML-based or statistical approaches
- **Various ML models**: Options from lightweight to professional-grade summarization models
- **Key element extraction**: Automatically identifies themes, entities, and important points
- **Multiple summary views**: Basic summary, enhanced summary, and key elements analysis
- **Visual feedback**: Progress indicators for model loading and processing
- **No server required**: Runs entirely in the browser

## Project Structure

```
Summarize-It/
├── index.html              # Main HTML file with application structure
├── css/
│   └── styles.css          # Application styling
├── js/
│   ├── app.js              # Application initialization and main logic
│   ├── models/             # ML model implementations
│   │   ├── model-registry.js  # Registry of available models
│   │   └── ml-summarizer.js   # ML-based summarization logic
│   ├── utils/              # Utility functions
│   │   ├── key-elements-extractor.js  # Extracts themes and entities
│   │   ├── text-summarizer.js         # Statistical summarization
│   │   └── tf-models.js               # TensorFlow.js interface
│   ├── generators/         # Content generation
│   │   └── summary-generator.js       # Generates different summary types
│   └── ui/                 # User interface components
│       └── ui-controller.js           # UI interaction handling
└── server.js               # Optional simple server (not required to run the app)
```

## Running the Application

### Method 1: Direct File Access (Recommended)

Simply open the `index.html` file in your web browser. The application is designed to run directly from the file system.

### Method 2: Using a Local Server (Optional)

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

## Notes

- The first time you use an ML model, it will need to download, which may take some time depending on your connection speed
- After the initial download, the models are cached by the browser for faster subsequent use
- The statistical processor option requires no download and works immediately
