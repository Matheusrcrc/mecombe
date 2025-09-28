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

  // Medical data structure for filtering
  const medicalData = {
    doctors: [], // Will be populated from Excel
    isLoaded: false,
    
    async loadFromExcel() {
      try {
        utils.log('Carregando dados da planilha Excel...');
        
        if (typeof ExcelLoader === 'undefined') {
          throw new Error('ExcelLoader não encontrado');
        }
        
        const loadedDoctors = await ExcelLoader.loadData();
        
        if (loadedDoctors && loadedDoctors.length > 0) {
          this.doctors = loadedDoctors;
          this.isLoaded = true;
          utils.log(`${loadedDoctors.length} médicos carregados da planilha`);
          
          // Trigger data refresh in UI
          if (typeof filtersModule !== 'undefined' && filtersModule.applyFilters) {
            setTimeout(() => {
              filtersModule.applyFilters();
            }, 100);
          }
        } else {
          throw new Error('Nenhum dado encontrado na planilha');
        }
        
        return this.doctors;
        
      } catch (error) {
        utils.log(`Erro ao carregar planilha: ${error.message}`, 'error');
        
        // Load fallback data
        this.doctors = this.getFallbackData();
        this.isLoaded = true;
        utils.log('Usando dados de fallback');
        
        return this.doctors;
      }
    },
    
    getFallbackData() {
      return [
        // Q1 - Blindar
        { id: 1, name: 'Dr. João Silva', specialty: 'cardiologia', segment: 'blindar', volume: 85, affinity: 90, priority: 'high' },
        { id: 2, name: 'Dra. Maria Santos', specialty: 'neurologia', segment: 'blindar', volume: 82, affinity: 88, priority: 'high' },
        { id: 3, name: 'Dr. Pedro Oliveira', specialty: 'ortopedia', segment: 'blindar', volume: 79, affinity: 85, priority: 'high' },
        { id: 4, name: 'Dra. Ana Costa', specialty: 'ginecologia', segment: 'blindar', volume: 87, affinity: 92, priority: 'strategic' },
        { id: 5, name: 'Dr. Carlos Ferreira', specialty: 'urologia', segment: 'blindar', volume: 83, affinity: 89, priority: 'high' },
        
        // Q2 - Incentivar
        { id: 11, name: 'Dr. André Ribeiro', specialty: 'oncologia', segment: 'incentivar', volume: 45, affinity: 88, priority: 'new-opportunities' },
        { id: 12, name: 'Dra. Beatriz Gomes', specialty: 'pediatria', segment: 'incentivar', volume: 42, affinity: 85, priority: 'new-opportunities' },
        { id: 13, name: 'Dr. Gabriel Torres', specialty: 'psiquiatria', segment: 'incentivar', volume: 48, affinity: 90, priority: 'high' },
        
        // Q3 - Avaliar  
        { id: 21, name: 'Dr. Roberto Silva', specialty: 'cirurgia-geral', segment: 'avaliar', volume: 85, affinity: 45, priority: 'strategic' },
        { id: 22, name: 'Dra. Sandra Lopes', specialty: 'medicina-interna', segment: 'avaliar', volume: 82, affinity: 42, priority: 'strategic' },
        
        // Q4 - Conquistar
        { id: 26, name: 'Dr. Felipe Santos', specialty: 'outras', segment: 'conquistar', volume: 30, affinity: 35, priority: 'new-opportunities' },
        { id: 27, name: 'Dra. Gabriela Lima', specialty: 'outras', segment: 'conquistar', volume: 32, affinity: 38, priority: 'new-opportunities' }
      ];
    },

    getBySegment(segment) {
      return this.doctors.filter(doctor => doctor.segment === segment);
    },

    getBySpecialty(specialty) {
      return this.doctors.filter(doctor => doctor.specialty === specialty);
    },

    search(query) {
      const searchTerm = query.toLowerCase();
      return this.doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm)
      );
    },

    filterByPriority(priority) {
      return this.doctors.filter(doctor => doctor.priority === priority);
    },

    filterByVolumeRange(min, max) {
      return this.doctors.filter(doctor => 
        doctor.volume >= min && doctor.volume <= max
      );
    },

    filterByAffinityRange(min, max) {
      return this.doctors.filter(doctor => 
        doctor.affinity >= min && doctor.affinity <= max
      );
    }
  };

  // Filters module
  const filtersModule = {
    currentFilters: {
      search: '',
      segments: [],
      specialty: '',
      volume: { min: 0, max: 100 },
      affinity: { min: 0, max: 100 },
      quickFilters: []
    },

    isInitialized: false,

    init() {
      if (this.isInitialized) return;
      
      utils.log('Inicializando sistema de filtros...');
      
      this.bindEvents();
      this.setupRangeSliders();
      this.updateFilterCount();
      
      this.isInitialized = true;
      utils.log('Sistema de filtros inicializado com sucesso');
    },

    bindEvents() {
      // Filters toggle
      const toggleBtn = utils.query('#filters-toggle');
      const filtersPanel = utils.query('#filters-panel');
      
      if (toggleBtn && filtersPanel) {
        toggleBtn.addEventListener('click', () => {
          this.toggleFiltersPanel();
        });
      }

      // Search input
      const searchInput = utils.query('#search-input');
      const searchClear = utils.query('#search-clear');
      
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce((e) => {
          this.updateSearchFilter(e.target.value);
        }, 300));
      }
      
      if (searchClear) {
        searchClear.addEventListener('click', () => {
          this.clearSearch();
        });
      }

      // Segment checkboxes
      const segmentFilters = utils.queryAll('.segment-filter');
      segmentFilters.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          this.updateSegmentFilter(e.target.value, e.target.checked);
        });
      });

      // Specialty select
      const specialtySelect = utils.query('#specialty-select');
      if (specialtySelect) {
        specialtySelect.addEventListener('change', (e) => {
          this.updateSpecialtyFilter(e.target.value);
        });
      }

      // Quick filter buttons
      const quickFilterBtns = utils.queryAll('.quick-filter-btn');
      quickFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.toggleQuickFilter(btn.dataset.filter, btn);
        });
      });

      // Clear filters button
      const clearBtn = utils.query('#clear-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearAllFilters();
        });
      }

      // Reload data button
      const reloadBtn = utils.query('#reload-data');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', async () => {
          await this.reloadData();
        });
      }

      // Range sliders
      const volumeRange = utils.query('#volume-range');
      const affinityRange = utils.query('#affinity-range');
      
      if (volumeRange) {
        volumeRange.addEventListener('input', (e) => {
          this.updateVolumeRange(parseInt(e.target.value));
        });
      }
      
      if (affinityRange) {
        affinityRange.addEventListener('input', (e) => {
          this.updateAffinityRange(parseInt(e.target.value));
        });
      }
    },

    toggleFiltersPanel() {
      const toggleBtn = utils.query('#filters-toggle');
      const filtersPanel = utils.query('#filters-panel');
      
      if (!toggleBtn || !filtersPanel) return;
      
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      const newState = !isExpanded;
      
      toggleBtn.setAttribute('aria-expanded', newState);
      filtersPanel.setAttribute('aria-hidden', !newState);
      
      utils.log(`Filtros ${newState ? 'expandidos' : 'recolhidos'}`);
    },

    updateSearchFilter(query) {
      this.currentFilters.search = query.trim();
      
      const searchClear = utils.query('#search-clear');
      if (searchClear) {
        searchClear.style.opacity = query ? '1' : '0';
      }
      
      this.applyFilters();
      utils.log(`Busca atualizada: "${query}"`);
    },

    clearSearch() {
      const searchInput = utils.query('#search-input');
      if (searchInput) {
        searchInput.value = '';
        this.updateSearchFilter('');
      }
    },

    updateSegmentFilter(segment, isChecked) {
      if (isChecked) {
        if (!this.currentFilters.segments.includes(segment)) {
          this.currentFilters.segments.push(segment);
        }
      } else {
        this.currentFilters.segments = this.currentFilters.segments.filter(s => s !== segment);
      }
      
      this.applyFilters();
      utils.log(`Filtro de segmento ${isChecked ? 'adicionado' : 'removido'}: ${segment}`);
    },

    updateSpecialtyFilter(specialty) {
      this.currentFilters.specialty = specialty;
      this.applyFilters();
      utils.log(`Filtro de especialidade: ${specialty || 'todas'}`);
    },

    updateVolumeRange(value) {
      // For simplicity, using single slider as minimum threshold
      this.currentFilters.volume.min = value;
      
      const valueDisplay = utils.query('#volume-value');
      if (valueDisplay) {
        valueDisplay.textContent = `${value}%`;
      }
      
      this.applyFilters();
    },

    updateAffinityRange(value) {
      // For simplicity, using single slider as minimum threshold
      this.currentFilters.affinity.min = value;
      
      const valueDisplay = utils.query('#affinity-value');
      if (valueDisplay) {
        valueDisplay.textContent = `${value}%`;
      }
      
      this.applyFilters();
    },

    toggleQuickFilter(filterType, buttonElement) {
      const isActive = buttonElement.classList.contains('active');
      
      if (isActive) {
        buttonElement.classList.remove('active');
        this.currentFilters.quickFilters = this.currentFilters.quickFilters.filter(f => f !== filterType);
      } else {
        buttonElement.classList.add('active');
        if (!this.currentFilters.quickFilters.includes(filterType)) {
          this.currentFilters.quickFilters.push(filterType);
        }
      }
      
      this.applyFilters();
      utils.log(`Filtro rápido ${isActive ? 'removido' : 'adicionado'}: ${filterType}`);
    },

    applyFilters() {
      let filteredDoctors = [...medicalData.doctors];
      
      // Apply search filter
      if (this.currentFilters.search) {
        filteredDoctors = filteredDoctors.filter(doctor =>
          doctor.name.toLowerCase().includes(this.currentFilters.search.toLowerCase())
        );
      }
      
      // Apply segment filters
      if (this.currentFilters.segments.length > 0) {
        filteredDoctors = filteredDoctors.filter(doctor =>
          this.currentFilters.segments.includes(doctor.segment)
        );
      }
      
      // Apply specialty filter
      if (this.currentFilters.specialty) {
        filteredDoctors = filteredDoctors.filter(doctor =>
          doctor.specialty === this.currentFilters.specialty
        );
      }
      
      // Apply volume filter
      filteredDoctors = filteredDoctors.filter(doctor =>
        doctor.volume >= this.currentFilters.volume.min
      );
      
      // Apply affinity filter
      filteredDoctors = filteredDoctors.filter(doctor =>
        doctor.affinity >= this.currentFilters.affinity.min
      );
      
      // Apply quick filters
      if (this.currentFilters.quickFilters.length > 0) {
        filteredDoctors = filteredDoctors.filter(doctor =>
          this.currentFilters.quickFilters.some(filter => doctor.priority === filter.replace('-', '_'))
        );
      }
      
      this.updateUI(filteredDoctors);
      this.updateFilterCount();
      this.updateResultsSummary(filteredDoctors);
    },

    updateUI(filteredDoctors) {
      // Group doctors by segment
      const segments = {
        blindar: filteredDoctors.filter(d => d.segment === 'blindar'),
        incentivar: filteredDoctors.filter(d => d.segment === 'incentivar'),
        avaliar: filteredDoctors.filter(d => d.segment === 'avaliar'),
        conquistar: filteredDoctors.filter(d => d.segment === 'conquistar')
      };
      
      // Update each quadrant
      Object.keys(segments).forEach(segment => {
        this.updateQuadrant(segment, segments[segment]);
      });
      
      // Update KPIs
      this.updateKPIs(filteredDoctors);
    },

    updateQuadrant(segmentKey, doctors) {
      const segmentMap = {
        blindar: 'q1',
        incentivar: 'q2', 
        avaliar: 'q3',
        conquistar: 'q4'
      };
      
      const quadrantId = segmentMap[segmentKey];
      const cardBody = utils.query(`[aria-labelledby="${quadrantId}-title"] .card-body`);
      const cardFooter = utils.query(`[aria-labelledby="${quadrantId}-title"] .card-footer`);
      
      if (!cardBody || !cardFooter) return;
      
      if (doctors.length === 0) {
        cardBody.innerHTML = '<div class="empty-state">Nenhum médico encontrado com os filtros aplicados</div>';
        cardFooter.textContent = '0 médicos neste segmento';
      } else {
        const doctorsList = doctors.map(doctor => {
          const specialtyText = this.getSpecialtyDisplayName(doctor.specialty);
          return `<li data-doctor-id="${doctor.id}">${doctor.name} - ${specialtyText}</li>`;
        }).join('');
        
        cardBody.innerHTML = `<ul class="medical-list" aria-label="Lista de médicos do quadrante ${segmentKey}">${doctorsList}</ul>`;
        cardFooter.textContent = `${doctors.length} médicos neste segmento`;
      }
    },

    updateKPIs(filteredDoctors) {
      const totalMedicos = utils.query('.kpi-card:nth-child(1) .kpi-value');
      const segmentados = utils.query('.kpi-card:nth-child(2) .kpi-value');
      const oportunidades = utils.query('.kpi-card:nth-child(4) .kpi-value');
      
      if (totalMedicos) {
        totalMedicos.textContent = filteredDoctors.length.toLocaleString();
      }
      
      if (segmentados) {
        const percentage = filteredDoctors.length > 0 ? 
          ((filteredDoctors.length / medicalData.doctors.length) * 100).toFixed(1) : 0;
        segmentados.textContent = filteredDoctors.length.toLocaleString();
        
        const segmentadosDesc = utils.query('.kpi-card:nth-child(2) .kpi-sub');
        if (segmentadosDesc) {
          segmentadosDesc.textContent = `${percentage}% da base total`;
        }
      }
      
      if (oportunidades) {
        const highPriority = filteredDoctors.filter(d => 
          d.priority === 'high' || d.priority === 'new-opportunities'
        ).length;
        oportunidades.textContent = highPriority.toLocaleString();
      }
    },

    updateFilterCount() {
      let activeCount = 0;
      
      // Count active filters
      if (this.currentFilters.search) activeCount++;
      activeCount += this.currentFilters.segments.length;
      if (this.currentFilters.specialty) activeCount++;
      if (this.currentFilters.volume.min > 0) activeCount++;
      if (this.currentFilters.affinity.min > 0) activeCount++;
      activeCount += this.currentFilters.quickFilters.length;
      
      const countElement = utils.query('#active-filters-count .count');
      if (countElement) {
        countElement.textContent = activeCount;
      }
    },

    updateResultsSummary(filteredDoctors) {
      const summaryText = utils.query('.summary-text');
      const filteredCount = utils.query('#filtered-count');
      
      if (summaryText && filteredCount) {
        const total = medicalData.doctors.length;
        const filtered = filteredDoctors.length;
        
        if (filtered === total) {
          summaryText.textContent = 'Mostrando todos os médicos';
        } else {
          summaryText.textContent = `Mostrando médicos filtrados`;
        }
        
        filteredCount.textContent = filtered.toLocaleString();
      }
    },

    clearAllFilters() {
      // Reset all filters
      this.currentFilters = {
        search: '',
        segments: [],
        specialty: '',
        volume: { min: 0, max: 100 },
        affinity: { min: 0, max: 100 },
        quickFilters: []
      };
      
      // Reset UI elements
      const searchInput = utils.query('#search-input');
      if (searchInput) searchInput.value = '';
      
      const segmentFilters = utils.queryAll('.segment-filter');
      segmentFilters.forEach(checkbox => checkbox.checked = false);
      
      const specialtySelect = utils.query('#specialty-select');
      if (specialtySelect) specialtySelect.value = '';
      
      const volumeRange = utils.query('#volume-range');
      const affinityRange = utils.query('#affinity-range');
      if (volumeRange) {
        volumeRange.value = 50;
        this.updateVolumeRange(50);
      }
      if (affinityRange) {
        affinityRange.value = 50;
        this.updateAffinityRange(50);
      }
      
      const quickFilterBtns = utils.queryAll('.quick-filter-btn');
      quickFilterBtns.forEach(btn => btn.classList.remove('active'));
      
      // Apply filters (will show all doctors)
      this.applyFilters();
      
      utils.log('Todos os filtros foram limpos');
    },

    setupRangeSliders() {
      const volumeRange = utils.query('#volume-range');
      const affinityRange = utils.query('#affinity-range');
      
      if (volumeRange) {
        this.updateVolumeRange(parseInt(volumeRange.value));
      }
      
      if (affinityRange) {
        this.updateAffinityRange(parseInt(affinityRange.value));
      }
    },

    getSpecialtyDisplayName(specialty) {
      const specialtyMap = {
        'cardiologia': 'Cardiologia',
        'neurologia': 'Neurologia',
        'ortopedia': 'Ortopedia',
        'ginecologia': 'Ginecologia',
        'urologia': 'Urologia',
        'dermatologia': 'Dermatologia',
        'gastroenterologia': 'Gastroenterologia',
        'endocrinologia': 'Endocrinologia',
        'pneumologia': 'Pneumologia',
        'reumatologia': 'Reumatologia',
        'oncologia': 'Oncologia',
        'pediatria': 'Pediatria',
        'psiquiatria': 'Psiquiatria',
        'oftalmologia': 'Oftalmologia',
        'nefrologia': 'Nefrologia',
        'infectologia': 'Infectologia',
        'hematologia': 'Hematologia',
        'geriatria': 'Geriatria',
        'anestesiologia': 'Anestesiologia',
        'radiologia': 'Radiologia',
        'patologia': 'Patologia',
        'cirurgia-geral': 'Cirurgia Geral',
        'medicina-interna': 'Medicina Interna',
        'outras': 'Outras Especialidades'
      };
      
      return specialtyMap[specialty] || specialty;
    },

    async reloadData() {
      try {
        utils.log('Recarregando dados da planilha...');
        this.updateDataStatus('loading', 'Recarregando dados...');
        
        // Reload data from Excel
        await medicalData.loadFromExcel();
        
        // Clear and reapply filters
        this.clearAllFilters();
        this.applyFilters();
        
        this.updateDataStatus('success', `${medicalData.doctors.length} médicos carregados`);
        utils.log('Dados recarregados com sucesso');
        
      } catch (error) {
        utils.log(`Erro ao recarregar dados: ${error.message}`, 'error');
        this.updateDataStatus('error', 'Erro ao recarregar dados');
      }
    },

    updateDataStatus(status, message) {
      const statusDot = utils.query('#status-dot');
      const statusText = utils.query('#status-text');
      const statusDetails = utils.query('#status-details');
      
      if (statusDot) {
        statusDot.className = `status-dot ${status}`;
      }
      
      if (statusText) {
        statusText.textContent = message;
      }
      
      if (statusDetails) {
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        switch (status) {
          case 'loading':
            statusDetails.textContent = 'Carregando planilha Excel...';
            break;
          case 'success':
            statusDetails.textContent = `Dados atualizados às ${timestamp} - Fonte: Planilha Excel`;
            break;
          case 'error':
            statusDetails.textContent = `Erro às ${timestamp} - Usando dados de fallback`;
            break;
          default:
            statusDetails.textContent = 'Fonte: Planilha Excel';
        }
      }
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

    async setup() {
      try {
        // Show loading indicator
        this.showLoadingIndicator(true);
        
        // Load data from Excel first
        filtersModule.updateDataStatus('loading', 'Carregando dados...');
        await medicalData.loadFromExcel();
        
        // Initialize filters system
        filtersModule.init();
        
        // Update status based on data load result
        if (medicalData.isLoaded) {
          filtersModule.updateDataStatus('success', `${medicalData.doctors.length} médicos carregados`);
        } else {
          filtersModule.updateDataStatus('error', 'Usando dados de fallback');
        }
        
        // Create print button
        const button = uiModule.createPrintButton();
        
        // Hide loading indicator
        this.showLoadingIndicator(false);
        
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
        this.showLoadingIndicator(false);
        this.showErrorMessage('Erro ao carregar dados. Usando dados de exemplo.');
      }
    },

    showLoadingIndicator(show) {
      const loadingScreen = utils.query('#loading-screen');
      if (loadingScreen) {
        if (show) {
          loadingScreen.classList.remove('hidden');
          loadingScreen.setAttribute('aria-hidden', 'false');
        } else {
          loadingScreen.classList.add('hidden');
          loadingScreen.setAttribute('aria-hidden', 'true');
        }
      }
    },

    showErrorMessage(message) {
      // Create error notification
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #dc3545;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10001;
        font-family: inherit;
        max-width: 400px;
        text-align: center;
      `;
      errorDiv.textContent = message;
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 5000);
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
    
    // Filters API
    filters: {
      search: filtersModule.updateSearchFilter.bind(filtersModule),
      clearAll: filtersModule.clearAllFilters.bind(filtersModule),
      toggleSegment: filtersModule.updateSegmentFilter.bind(filtersModule),
      setSpecialty: filtersModule.updateSpecialtyFilter.bind(filtersModule),
      setVolumeMin: filtersModule.updateVolumeRange.bind(filtersModule),
      setAffinityMin: filtersModule.updateAffinityRange.bind(filtersModule),
      getCurrentFilters: () => filtersModule.currentFilters,
      apply: filtersModule.applyFilters.bind(filtersModule)
    },
    
    // Data API
    data: {
      getAllDoctors: () => medicalData.doctors,
      getBySegment: medicalData.getBySegment.bind(medicalData),
      getBySpecialty: medicalData.getBySpecialty.bind(medicalData),
      search: medicalData.search.bind(medicalData),
      filterByPriority: medicalData.filterByPriority.bind(medicalData)
    },
    
    config: CONFIG,
    version: '2.1.0',
    
    // Debug methods
    debug: {
      utils,
      dataCollector,
      printModule,
      uiModule,
      filtersModule,
      medicalData
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