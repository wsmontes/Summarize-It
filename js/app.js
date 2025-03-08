/**
 * App Controller - Main application logic
 */
const App = (() => {
  async function handleSummarize() {
    const inputText = UIController.getInputText();
    
    if (!inputText.trim()) {
      UIController.updateStatus("Please enter some text to summarize");
      return;
    }
    
    if (!UIController.isValidModelSelected()) {
      UIController.updateStatus("Please select a summarization model first");
      return;
    }
    
    UIController.toggleButton(true);
    UIController.updateStatus("Summarizing...");
    
    const modelId = UIController.getSelectedModel();
    const sentenceCount = UIController.getSummaryLength();
    const start = performance.now();
    
    try {
      // Generate all three types of summaries
      const summaryData = await SummaryGenerator.generateAllSummaries(
        inputText, 
        modelId, 
        sentenceCount
      );
      
      const processingTime = Math.round(performance.now() - start);
      
      // Display all summaries
      UIController.displaySummaries(summaryData);
      UIController.updateStatus(`Summarized in ${processingTime}ms using ${ModelRegistry.getModel(modelId).name}`);
    } catch (error) {
      console.error("Summarization error:", error);
      UIController.updateStatus(`Error: ${error.message}`);
    } finally {
      UIController.toggleButton(false);
    }
  }
  
  function handleModelChange() {
    const modelId = UIController.getSelectedModel();
    UIController.updateModelInfo(modelId);
    UIController.updateSummarizeButtonState();
    
    if (modelId !== 'placeholder' && ModelRegistry.getModel(modelId).usesML) {
      // Pre-load the model when user selects it (except placeholder)
      MLSummarizer.isModelAvailable(modelId).catch(console.error);
    }
  }
  
  function init() {
    console.log("Initializing application...");
    
    try {
      // Initialize UI
      UIController.initUI();
      
      // Set up event listeners
      document.getElementById('summarizeBtn').addEventListener('click', handleSummarize);
      document.getElementById('modelSelect').addEventListener('change', handleModelChange);
      
      UIController.updateStatus("Select a model to begin");
      console.log("Application initialized successfully");
    } catch (error) {
      console.error("Error initializing application:", error);
    }
  }
  
  return {
    init
  };
})();

// Make sure the DOM is fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  // DOM is already loaded
  App.init();
}

// No export statement - globally available
