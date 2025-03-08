/**
 * UI Controller - Handles all user interface interactions
 */
const UIController = (() => {
  // Store element references when they're available - not at module load time
  let elements = null;
  
  // Initialize elements when DOM is ready
  function initElements() {
    elements = {
      inputText: document.getElementById('inputText'),
      outputSummary: document.getElementById('outputSummary'),
      summarizeBtn: document.getElementById('summarizeBtn'),
      sentenceCount: document.getElementById('sentenceCount'),
      status: document.getElementById('status'),
      modelSelect: document.getElementById('modelSelect'),
      modelStatus: document.getElementById('modelStatus'),
      modelInfoPanel: document.getElementById('modelInfoPanel')
    };
  }
  
  function updateModelInfo(modelId) {
    const model = ModelRegistry.getModel(modelId);
    
    // Create tier badge based on model tier
    const tierClass = model.tier ? `tier-${model.tier}` : '';
    const tierName = model.tier ? model.tier.charAt(0).toUpperCase() + model.tier.slice(1) : '';
    const tierBadge = model.tier ? `<div class="model-tier ${tierClass}">${tierName}</div>` : '';
    
    // Create warning message if the model has one
    const warningMessage = model.warning ? 
      `<div class="model-warning">⚠️ ${model.warning}</div>` : '';
    
    const infoHTML = `
      <h3>${model.name}</h3>
      ${tierBadge}
      <div class="model-specs">
        <div class="spec-item">
          <span class="spec-label">Download Size</span>
          <span class="spec-value">
            ${model.size} 
            <span class="badge badge-size-${model.sizeClass}">${model.sizeClass.toUpperCase()}</span>
          </span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Processing Speed</span>
          <span class="spec-value">
            ${model.speed}
            <span class="badge badge-speed-${model.speedClass}">${model.speedClass.toUpperCase()}</span>
          </span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Summary Quality</span>
          <span class="spec-value">${model.quality}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Memory Usage</span>
          <span class="spec-value">${model.memory}</span>
        </div>
      </div>
      <div class="model-description">
        ${model.description}
      </div>
      ${warningMessage}
    `;
    
    elements.modelInfoPanel.innerHTML = infoHTML;
    elements.modelStatus.style.display = model.usesML ? 'block' : 'none';
  }
  
  function initModelSelector() {
    if (!elements) return; // Safety check
    
    // Empty existing options
    elements.modelSelect.innerHTML = '';
    
    // Add placeholder option first
    const placeholderOption = document.createElement('option');
    placeholderOption.value = 'placeholder';
    placeholderOption.textContent = '-- Select a summarization model --';
    placeholderOption.selected = true;
    elements.modelSelect.appendChild(placeholderOption);
    
    // Group models by tier
    const tierGroups = {
      professional: [],
      premium: [],
      standard: []
    };
    
    ModelRegistry.getAllModels().forEach(model => {
      // Skip the placeholder in the grouped models
      if (model.id === 'placeholder') return;
      
      const tier = model.tier || 'standard';
      tierGroups[tier].push(model);
    });
    
    // Create option groups and add options
    for (const [tier, models] of Object.entries(tierGroups)) {
      if (models.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = tier.charAt(0).toUpperCase() + tier.slice(1) + ' Models';
        
        models.forEach(model => {
          const option = document.createElement('option');
          option.value = model.id;
          option.textContent = `${model.name} (${model.size})`;
          optgroup.appendChild(option);
        });
        
        elements.modelSelect.appendChild(optgroup);
      }
    }
    
    // Initialize with the placeholder model info
    updateModelInfo('placeholder');
  }
  
  function isValidModelSelected() {
    const currentModel = elements.modelSelect.value;
    return currentModel !== 'placeholder';
  }
  
  function updateSummarizeButtonState() {
    elements.summarizeBtn.disabled = !isValidModelSelected();
  }
  
  function displaySummaries(summaryData) {
    // Display basic summary
    elements.outputSummary.value = summaryData.basicSummary;
    
    // Display enhanced summary
    document.getElementById('enhancedSummaryText').textContent = summaryData.enhancedSummary;
    
    // Display key elements with new formatting
    const keyThemesContainer = document.getElementById('key-themes');
    const keyEntitiesContainer = document.getElementById('key-entities');
    const keyPointsContainer = document.getElementById('key-points');
    
    // Clear previous content
    keyThemesContainer.innerHTML = '';
    keyEntitiesContainer.innerHTML = '';
    keyPointsContainer.innerHTML = '';
    
    // Add categorized themes if available
    if (summaryData.keyElements.categories) {
      Object.entries(summaryData.keyElements.categories).forEach(([category, items]) => {
        if (items.length === 0) return;
        
        const categoryGroup = document.createElement('div');
        categoryGroup.className = 'theme-group';
        
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'theme-group-title';
        categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        
        categoryGroup.appendChild(categoryTitle);
        
        items.forEach(item => {
          const themeElement = document.createElement('div');
          themeElement.className = 'key-element';
          
          if (typeof item === 'string') {
            themeElement.textContent = item;
          } else {
            themeElement.innerHTML = `
              ${item.text}
              <span class="relevance" title="Relevance score: ${item.relevance}/5">${item.relevance}</span>
            `;
          }
          
          categoryGroup.appendChild(themeElement);
        });
        
        keyThemesContainer.appendChild(categoryGroup);
      });
    } 
    // Fallback to simple list if categories aren't available
    else {
      summaryData.keyElements.themes.forEach(theme => {
        const themeElement = document.createElement('div');
        themeElement.className = 'key-element';
        
        if (typeof theme === 'string') {
          themeElement.textContent = theme;
        } else {
          themeElement.innerHTML = `
            ${theme.text}
            <span class="relevance" title="Relevance score: ${theme.relevance}/5">${theme.relevance}</span>
          `;
        }
        
        keyThemesContainer.appendChild(themeElement);
      });
    }
    
    // Add entities with relevance indicators
    if (summaryData.keyElements.entities) {
      const entitiesList = Array.isArray(summaryData.keyElements.entities) ? 
        summaryData.keyElements.entities : 
        Object.entries(summaryData.keyElements.entities).map(([text, relevance]) => ({ text, relevance }));
        
      entitiesList.slice(0, 10).forEach(entity => {
        const entityElement = document.createElement('div');
        entityElement.className = 'key-element';
        
        if (typeof entity === 'string') {
          entityElement.textContent = entity;
        } else {
          entityElement.innerHTML = `
            ${entity.text}
            <span class="relevance" title="Relevance score: ${entity.relevance}/5">${entity.relevance}</span>
          `;
        }
        
        keyEntitiesContainer.appendChild(entityElement);
      });
    }
    
    // Add terms if available
    if (summaryData.keyElements.terms) {
      summaryData.keyElements.terms.forEach(term => {
        const termElement = document.createElement('div');
        termElement.className = 'key-element';
        
        if (typeof term === 'string') {
          termElement.textContent = term;
        } else {
          termElement.innerHTML = `
            ${term.text}
            <span class="relevance" title="Relevance score: ${term.relevance}/5">${term.relevance}</span>
          `;
        }
        
        keyEntitiesContainer.appendChild(termElement);
      });
    }
    
    // Add key points
    const pointsList = document.createElement('ul');
    summaryData.keyElements.keyPoints.forEach(point => {
      const pointElement = document.createElement('li');
      pointElement.textContent = point;
      pointsList.appendChild(pointElement);
    });
    keyPointsContainer.appendChild(pointsList);
  }
  
  // Setup tab functionality
  function setupTabs() {
    const tabs = document.querySelectorAll('.summary-tab');
    const contents = document.querySelectorAll('.summary-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        this.classList.add('active');
        const tabId = this.getAttribute('data-tab');
        document.getElementById(`${tabId}-content`).classList.add('active');
      });
    });
  }
  
  return {
    updateStatus(message) {
      if (!elements) return;
      elements.status.textContent = message;
    },
    
    toggleButton(disabled = false) {
      if (!elements) return;
      elements.summarizeBtn.disabled = disabled;
    },
    
    getSummaryLength() {
      if (!elements) return 3;
      const value = parseInt(elements.sentenceCount.value);
      return isNaN(value) || value < 1 ? 3 : Math.min(value, 10);
    },
    
    getInputText() {
      if (!elements) return '';
      return elements.inputText.value;
    },
    
    displaySummary(summary) {
      if (!elements) return;
      elements.outputSummary.value = summary;
    },
    
    getSelectedModel() {
      if (!elements) return 'placeholder';
      return elements.modelSelect.value;
    },
    
    updateModelInfo,
    
    initModelSelector,
    
    isValidModelSelected,
    updateSummarizeButtonState,
    
    displaySummaries,
    setupTabs,
    
    initUI() {
      // Initialize elements first - this is the key change
      initElements();
      
      if (!elements) {
        console.error('UI elements not available yet. Make sure the DOM is fully loaded.');
        return;
      }
      
      this.initModelSelector();
      this.updateSummarizeButtonState();
      this.setupTabs();
    }
  };
})();

// No export statement - globally available
