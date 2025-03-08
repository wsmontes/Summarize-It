# ML Text Summarizer

A browser-based tool that uses machine learning and statistical algorithms to summarize text. This application leverages TensorFlow.js to run ML models directly in the browser without needing a server.

## Project Structure

```
Summarize-It/
├── index.html           # Main HTML file
├── css/                 # Stylesheets
│   └── styles.css       # Main stylesheet
├── js/                  # JavaScript files
│   ├── app.js           # Main application controller
│   ├── models/          # ML model handlers
│   │   ├── model-registry.js  # Registry of all available models
│   │   └── ml-summarizer.js   # ML-based text summarization
│   ├── utils/           # Utility functions
│   │   ├── key-elements-extractor.js  # Extract key elements from text
│   │   ├── tf-models.js              # TensorFlow.js helper utilities
│   │   └── text-summarizer.js         # Statistical text summarization
│   ├── generators/      # Content generators
│   │   └── summary-generator.js       # Generates different types of summaries
│   └── ui/              # UI components
│       └── ui-controller.js           # Handles UI interactions
└── README.md            # Project documentation
```

## Features

- Multiple summarization methods (ML-based and statistical)
- Selection of different ML models with varying sizes and capabilities
- Extraction of key themes, entities, and important points from text
- Multiple summary views (basic, enhanced, key elements)
- Visual feedback on model loading and processing

## Technologies Used

- HTML5, CSS3, and JavaScript
- TensorFlow.js for running ML models in the browser

## Running the Project

Simply open `index.html` in a modern browser. The application can be run directly from the file system without the need for a server.

For best experience, use Chrome, Firefox, or Edge.

## Available Models

- **Universal Sentence Encoder** - Medium-sized model with good quality summaries
- **MobileBERT** - Compact model for mobile devices
- **TinyBERT** - Fastest model with small download size
- **Statistical Processor** - No ML model download required, uses basic algorithms

## Development

To modify the code:

1. Make changes to the relevant JavaScript files
2. Refresh the page to see your changes

## Notes

The ML models are loaded from TensorFlow.js Hub and might take some time to download on the first use. After the initial download, the models are cached by the browser.
