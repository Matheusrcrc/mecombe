/**
 * MECOBE Medical Dashboard - Main JavaScript Module
 * Handles print functionality and dashboard interactions
 */

// Strict mode for better error handling
'use strict';

// Dashboard module using IIFE pattern
const MecobeDashboard = (function() {
  
  // Configuration object
  const CONFIG = {
    buttonId: 'mecobe-print-btn',
    buttonText: 'Imprimir Dashboard',
    debug: true,
    printWindow: {
      width: 1200,
      height: 800,
      features: 'scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no'
    }
  };

  // Utility functions
  const utils = {
    /**
     * Safe logging function
     * @param {string} message - Message to log
     * @param {string} type - Log type (log, warn, error)
     */
    log(message, type = 'log') {
      if (CONFIG.debug && console && console[type]) {
        console[type](`[MECOBE Dashboard] ${message}`);
      }
    },

    /**
     * Safely query DOM elements
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element
     * @returns {Element|null}
     */
    query(selector, context = document) {
      try {
        return context.querySelector(selector);
      } catch (error) {
        this.log(`Query error for selector "${selector}": ${error.message}`, 'error');
        return null;
      }
    },

    /**
     * Safely query multiple DOM elements
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element
     * @returns {NodeList}
     */
    queryAll(selector, context = document) {
      try {
        return context.querySelectorAll(selector);
      } catch (error) {
        this.log(`QueryAll error for selector "${selector}": ${error.message}`, 'error');
        return [];
      }
    },

    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function}
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  };

  // Data collection module
  const dataCollector = {
    /**
     * Collect dashboard data for printing
     * @returns {Object} Dashboard data
     */
    collectData() {
      try {
        utils.log('Iniciando coleta de dados...');
        
        const data = {
          timestamp: new Date().toLocaleString('pt-BR'),
          title: this.getTitle(),
          subtitle: this.getSubtitle(),
          kpis: this.getKPIs(),
          segments: this.getSegments(),
          metadata: this.getMetadata()
        };

        utils.log(`Dados coletados: ${Object.keys(data).length} seções`);
        return data;
      } catch (error) {
        utils.log(`Erro na coleta de dados: ${error.message}`, 'error');
        return this.getDefaultData();
      }
    },

    getTitle() {
      const titleEl = utils.query('.brand-title, .h1');
      return titleEl ? titleEl.textContent.trim() : 'Dashboard MECOBE';
    },

    getSubtitle() {
      const subtitleEl = utils.query('.brand-subtitle, .subtitle');
      return subtitleEl ? subtitleEl.textContent.trim() : '';
    },

    getKPIs() {
      const kpis = [];
      const kpiCards = utils.queryAll('.kpi-card, .kpi');
      
      kpiCards.forEach((card, index) => {
        const label = utils.query('.kpi-label, .label', card);
        const value = utils.query('.kpi-value, .value', card);
        const sub = utils.query('.kpi-sub, .sub', card);
        
        kpis.push({
          id: index + 1,
          label: label ? label.textContent.trim() : '',
          value: value ? value.textContent.trim() : '',
          subtitle: sub ? sub.textContent.trim() : ''
        });
      });
      
      return kpis;
    },

    getSegments() {
      const segments = [];
      const cards = utils.queryAll('.dashboard-card, .card');
      
      cards.forEach((card, index) => {
        const title = utils.query('.quadrant-id, .quadid', card);
        const badge = utils.query('.segment-badge, .seg-badge', card);
        const metrics = utils.query('.card-metrics, .metrics', card);
        const medicalList = utils.queryAll('.medical-list li, .medlist li', card);
        const counter = utils.query('.card-footer, .footer-counter', card);
        
        const doctors = Array.from(medicalList).map(li => li.textContent.trim());
        
        segments.push({
          id: index + 1,
          title: title ? title.textContent.trim() : `Quadrante ${index + 1}`,
          badge: badge ? badge.textContent.trim() : '',
          badgeClass: badge ? badge.className : '',
          metrics: metrics ? metrics.textContent.trim() : '',
          doctors: doctors,
          count: counter ? counter.textContent.trim() : `${doctors.length} médicos`
        });
      });
      
      return segments;
    },

    getMetadata() {
      return {
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timestamp: Date.now()
      };
    },

    getDefaultData() {
      return {
        timestamp: new Date().toLocaleString('pt-BR'),
        title: 'Dashboard MECOBE',
        subtitle: 'Dados não disponíveis',
        kpis: [],
        segments: [],
        metadata: {
          error: 'Falha na coleta de dados'
        }
      };
    }
  };

  // Print module
  const printModule = {
    /**
     * Execute print functionality
     */
    async executePrint() {
      try {
        utils.log('Iniciando processo de impressão...');
        
        const data = dataCollector.collectData();
        const printContent = this.generatePrintHTML(data);
        
        await this.openPrintWindow(printContent);
        
        utils.log('Processo de impressão concluído com sucesso');
      } catch (error) {
        utils.log(`Erro durante impressão: ${error.message}`, 'error');
        this.showErrorMessage('Erro ao gerar impressão. Tente novamente.');
      }
    },

    /**
     * Generate HTML content for printing
     * @param {Object} data - Dashboard data
     * @returns {string} HTML content
     */
    generatePrintHTML(data) {
      return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - Impressão</title>
  <style>
    ${this.getPrintStyles()}
  </style>
</head>
<body>
  <div class="print-container">
    <header class="print-header">
      <h1>${data.title}</h1>
      ${data.subtitle ? `<p class="subtitle">${data.subtitle}</p>` : ''}
      <p class="timestamp">Gerado em: ${data.timestamp}</p>
    </header>
    
    ${this.generateKPIsHTML(data.kpis)}
    ${this.generateSegmentsHTML(data.segments)}
    
    <footer class="print-footer">
      <p>Dashboard MECOBE - Sistema de Matriz de Segmentação</p>
    </footer>
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;
    },

    generateKPIsHTML(kpis) {
      if (!kpis.length) return '';
      
      const kpiItems = kpis.map(kpi => `
        <div class="kpi-item">
          <div class="kpi-label">${kpi.label}</div>
          <div class="kpi-value">${kpi.value}</div>
          ${kpi.subtitle ? `<div class="kpi-subtitle">${kpi.subtitle}</div>` : ''}
        </div>
      `).join('');
      
      return `
        <section class="kpis-section">
          <h2>Indicadores Principais</h2>
          <div class="kpis-grid">
            ${kpiItems}
          </div>
        </section>
      `;
    },

    generateSegmentsHTML(segments) {
      if (!segments.length) return '';
      
      const segmentItems = segments.map(segment => `
        <div class="segment-item">
          <div class="segment-header">
            <h3>${segment.title}</h3>
            ${segment.badge ? `<span class="segment-badge">${segment.badge}</span>` : ''}
          </div>
          ${segment.metrics ? `<p class="segment-metrics">${segment.metrics}</p>` : ''}
          
          ${segment.doctors.length ? `
            <div class="doctors-list">
              <h4>Médicos (${segment.doctors.length}):</h4>
              <ul>
                ${segment.doctors.map(doctor => `<li>${doctor}</li>`).join('')}
              </ul>
            </div>
          ` : '<p class="no-doctors">Nenhum médico neste segmento</p>'}
        </div>
      `).join('');
      
      return `
        <section class="segments-section">
          <h2>Segmentos da Matriz</h2>
          <div class="segments-grid">
            ${segmentItems}
          </div>
        </section>
      `;
    },

    getPrintStyles() {
      return `
        * { box-sizing: border-box; }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #333;
          line-height: 1.6;
        }
        
        .print-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .print-header {
          text-align: center;
          border-bottom: 2px solid #eee;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .print-header h1 {
          margin: 0 0 10px 0;
          color: #2c3e50;
          font-size: 2em;
        }
        
        .subtitle {
          color: #7f8c8d;
          margin: 0 0 10px 0;
          font-size: 1.1em;
        }
        
        .timestamp {
          color: #95a5a6;
          margin: 0;
          font-size: 0.9em;
        }
        
        .kpis-section,
        .segments-section {
          margin-bottom: 40px;
        }
        
        .kpis-section h2,
        .segments-section h2 {
          color: #2c3e50;
          border-bottom: 1px solid #bdc3c7;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        .kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .kpi-item {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        
        .kpi-label {
          font-size: 0.8em;
          color: #7f8c8d;
          text-transform: uppercase;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .kpi-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        
        .kpi-subtitle {
          font-size: 0.9em;
          color: #95a5a6;
        }
        
        .segments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
        }
        
        .segment-item {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          break-inside: avoid;
        }
        
        .segment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .segment-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.2em;
        }
        
        .segment-badge {
          background: #3498db;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: bold;
        }
        
        .segment-metrics {
          color: #7f8c8d;
          font-style: italic;
          margin-bottom: 15px;
          font-size: 0.9em;
        }
        
        .doctors-list h4 {
          margin: 0 0 10px 0;
          color: #2c3e50;
          font-size: 1em;
        }
        
        .doctors-list ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .doctors-list li {
          margin-bottom: 3px;
          font-size: 0.9em;
        }
        
        .no-doctors {
          color: #95a5a6;
          font-style: italic;
          text-align: center;
          margin: 20px 0;
        }
        
        .print-footer {
          text-align: center;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 40px;
          color: #95a5a6;
          font-size: 0.9em;
        }
        
        @media print {
          body { margin: 0; padding: 10px; }
          .print-container { max-width: none; }
          .segment-item { break-inside: avoid; }
        }
      `;
    },

    /**
     * Open print window with content
     * @param {string} content - HTML content
     */
    async openPrintWindow(content) {
      return new Promise((resolve, reject) => {
        try {
          const printWindow = window.open('', '_blank', CONFIG.printWindow.features);
          
          if (!printWindow) {
            throw new Error('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.');
          }
          
          printWindow.document.write(content);
          printWindow.document.close();
          
          printWindow.onload = () => {
            utils.log('Janela de impressão carregada com sucesso');
            resolve(printWindow);
          };
          
          printWindow.onerror = (error) => {
            utils.log(`Erro na janela de impressão: ${error}`, 'error');
            reject(new Error('Erro ao carregar janela de impressão'));
          };
          
        } catch (error) {
          reject(error);
        }
      });
    },

    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
      // Try to use native alert, fallback to console
      if (window.alert) {
        alert(message);
      } else {
        utils.log(message, 'error');
      }
    }
  };

  // UI module for button management
  const uiModule = {
    /**
     * Create and add print button to the page
     */
    createPrintButton() {
      try {
        // Remove existing button if present
        this.removePrintButton();
        
        const button = this.buildButton();
        this.addButtonEvents(button);
        this.addButtonToDOM(button);
        
        utils.log('Botão de impressão criado e adicionado com sucesso');
        return button;
        
      } catch (error) {
        utils.log(`Erro ao criar botão: ${error.message}`, 'error');
        return null;
      }
    },

    buildButton() {
      const button = document.createElement('button');
      button.id = CONFIG.buttonId;
      button.className = 'print-button';
      button.setAttribute('type', 'button');
      button.setAttribute('aria-label', 'Imprimir dashboard');
      button.setAttribute('title', 'Clique para imprimir o dashboard');
      
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 9V2h12v7"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <path d="M6 14h12v8H6z"/>
        </svg>
        <span>${CONFIG.buttonText}</span>
      `;
      
      return button;
    },

    addButtonEvents(button) {
      // Debounced click handler to prevent multiple rapid clicks
      const debouncedPrint = utils.debounce(() => {
        printModule.executePrint();
      }, 300);
      
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        utils.log('Botão de impressão clicado');
        debouncedPrint();
      });
      
      // Keyboard support
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          debouncedPrint();
        }
      });
      
      // Visual feedback
      button.addEventListener('mousedown', () => {
        button.style.transform = 'scale(0.95)';
      });
      
      button.addEventListener('mouseup', () => {
        button.style.transform = '';
      });
    },

    addButtonToDOM(button) {
      document.body.appendChild(button);
      
      // Try to reposition near title for better UX
      const title = utils.query('.brand-title, .h1, h1');
      if (title && title.parentElement) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin-left: 8px; display: inline-block;';
        wrapper.appendChild(button);
        title.parentElement.appendChild(wrapper);
        button.style.position = 'static';
        button.style.margin = '0';
      }
    },

    removePrintButton() {
      const existingButton = document.getElementById(CONFIG.buttonId);
      if (existingButton) {
        existingButton.remove();
        utils.log('Botão de impressão anterior removido');
      }
    }
  };

  // Initialization module
  const initModule = {
    /**
     * Initialize the dashboard
     */
    init() {
      utils.log('Inicializando Dashboard MECOBE...');
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.setup();
        });
      } else {
        // Small delay to ensure page is fully rendered
        setTimeout(() => {
          this.setup();
        }, 100);
      }
    },

    setup() {
      try {
        // Create print button
        const button = uiModule.createPrintButton();
        
        if (button) {
          utils.log('Dashboard inicializado com sucesso');
          
          // Self-test after 2 seconds
          setTimeout(() => {
            this.performSelfTest();
          }, 2000);
        } else {
          throw new Error('Falha ao criar botão de impressão');
        }
        
      } catch (error) {
        utils.log(`Erro na inicialização: ${error.message}`, 'error');
      }
    },

    performSelfTest() {
      const button = document.getElementById(CONFIG.buttonId);
      const testResults = {
        buttonExists: !!button,
        dataCollectable: !!dataCollector.collectData(),
        printReady: typeof printModule.executePrint === 'function'
      };
      
      const allTestsPassed = Object.values(testResults).every(Boolean);
      
      if (allTestsPassed) {
        utils.log('✅ Todos os testes passaram - Sistema pronto');
      } else {
        utils.log('❌ Alguns testes falharam:', 'warn');
        utils.log(testResults, 'warn');
      }
    }
  };

  // Public API
  return {
    init: initModule.init.bind(initModule),
    print: printModule.executePrint.bind(printModule),
    collectData: dataCollector.collectData.bind(dataCollector),
    config: CONFIG,
    version: '2.0.0',
    
    // Debug methods
    debug: {
      utils,
      dataCollector,
      printModule,
      uiModule
    }
  };
})();

// Auto-initialize when script loads
MecobeDashboard.init();

// Global exposure for debugging
window.MecobeDashboard = MecobeDashboard;

// Legacy compatibility
window.mecobeprint = {
  imprimir: MecobeDashboard.print,
  coletar: MecobeDashboard.collectData,
  debug: () => {
    console.log('MECOBE Dashboard v' + MecobeDashboard.version);
    console.log('Para testar: MecobeDashboard.print()');
  }
};