/**
 * This utility file provides access to TensorFlow.js models
 * that are loaded from script tags in the HTML.
 */

// Create fallback objects if needed
class DummyModel {
  async load() { 
    console.warn("Using dummy model - TensorFlow objects not available");
    return this; 
  }
  
  async embed() { 
    return { array: () => [[0.1, 0.2, 0.3]] }; 
  }
}

// Make objects available globally
const TFModels = {
  tf: window.tf || { 
    tidy: (fn) => fn(), 
    tensor1d: () => ({}), 
    sum: () => ({}), 
    mul: () => ({}), 
    norm: () => ({}), 
    env: () => ({ set: () => {} }) 
  },
  
  use: window.use || { load: () => new DummyModel() },
  qna: window.qna || { load: () => new DummyModel() },
  bert: window.bert || { load: () => new DummyModel() },

  // Helper function to ensure models are available
  async ensureModelAvailable(modelType) {
    try {
      switch(modelType) {
        case 'use':
          return await this.use.load();
        case 'bert':
          try {
            return await this.bert.load();
          } catch (e) {
            console.warn('BERT failed to load, falling back to USE');
            return await this.use.load();
          }
        case 'qna':
          return await this.qna.load();
        default:
          return await this.use.load();
      }
    } catch (error) {
      console.error(`Error loading model ${modelType}:`, error);
      return new DummyModel();
    }
  }
};
