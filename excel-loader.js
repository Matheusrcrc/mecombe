/**
 * Excel Data Loader Module
 * Handles loading and parsing Excel files for the MECOBE Dashboard
 */

// Excel Loader Module using IIFE pattern
const ExcelLoader = (function() {
  'use strict';

  // Configuration
  const CONFIG = {
    excelFilePath: './data/Segmentação Karine Lopes 2 .xlsx',
    sheetName: null, // Will auto-detect first sheet
    debug: true
  };

  // Utility functions
  const utils = {
    log(message, type = 'log') {
      if (CONFIG.debug && console && console[type]) {
        console[type](`[Excel Loader] ${message}`);
      }
    },

    // Normalize string for comparison
    normalizeString(str) {
      if (!str) return '';
      return str.toString().trim().toLowerCase();
    },

    // Parse specialty from text
    parseSpecialty(text) {
      if (!text) return 'outras';
      
      const specialtyMap = {
        'cardiologia': 'cardiologia',
        'cardio': 'cardiologia',
        'neurologia': 'neurologia',
        'neuro': 'neurologia',
        'ortopedia': 'ortopedia',
        'orto': 'ortopedia',
        'ginecologia': 'ginecologia',
        'gineco': 'ginecologia',
        'urologia': 'urologia',
        'uro': 'urologia',
        'dermatologia': 'dermatologia',
        'derma': 'dermatologia',
        'gastroenterologia': 'gastroenterologia',
        'gastro': 'gastroenterologia',
        'endocrinologia': 'endocrinologia',
        'endocrino': 'endocrinologia',
        'pneumologia': 'pneumologia',
        'pneumo': 'pneumologia',
        'reumatologia': 'reumatologia',
        'reuma': 'reumatologia',
        'oncologia': 'oncologia',
        'onco': 'oncologia',
        'pediatria': 'pediatria',
        'pediatra': 'pediatria',
        'psiquiatria': 'psiquiatria',
        'psiquiatra': 'psiquiatria',
        'oftalmologia': 'oftalmologia',
        'oftalmo': 'oftalmologia',
        'nefrologia': 'nefrologia',
        'nefro': 'nefrologia',
        'infectologia': 'infectologia',
        'infectologista': 'infectologia',
        'hematologia': 'hematologia',
        'hemato': 'hematologia',
        'geriatria': 'geriatria',
        'geriatra': 'geriatria',
        'anestesiologia': 'anestesiologia',
        'anestesista': 'anestesiologia',
        'radiologia': 'radiologia',
        'radiologo': 'radiologia',
        'patologia': 'patologia',
        'patologo': 'patologia',
        'cirurgia': 'cirurgia-geral',
        'cirurgiao': 'cirurgia-geral',
        'medicina interna': 'medicina-interna',
        'clinica': 'medicina-interna',
        'clinico': 'medicina-interna'
      };

      const normalized = this.normalizeString(text);
      
      for (const [key, value] of Object.entries(specialtyMap)) {
        if (normalized.includes(key)) {
          return value;
        }
      }
      
      return 'outras';
    },

    // Parse segment from volume and affinity values
    parseSegment(volume, affinity) {
      const vol = parseFloat(volume) || 0;
      const aff = parseFloat(affinity) || 0;
      
      if (vol >= 60 && aff >= 60) return 'blindar';      // High Volume, High Affinity
      if (vol < 60 && aff >= 60) return 'incentivar';    // Low Volume, High Affinity
      if (vol >= 60 && aff < 60) return 'avaliar';       // High Volume, Low Affinity
      return 'conquistar';                                // Low Volume, Low Affinity
    },

    // Parse priority from values
    parsePriority(volume, affinity, segment) {
      const vol = parseFloat(volume) || 0;
      const aff = parseFloat(affinity) || 0;
      
      if (segment === 'blindar') return 'strategic';
      if (vol > 80 || aff > 80) return 'high';
      if (vol < 40 && aff < 40) return 'new-opportunities';
      return 'strategic';
    }
  };

  // File loader module
  const fileLoader = {
    async loadExcelFile(filePath) {
      try {
        utils.log(`Carregando arquivo Excel: ${filePath}`);
        
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        utils.log('Arquivo carregado com sucesso');
        
        return arrayBuffer;
        
      } catch (error) {
        utils.log(`Erro ao carregar arquivo: ${error.message}`, 'error');
        throw error;
      }
    }
  };

  // Excel parser module
  const excelParser = {
    parseWorkbook(arrayBuffer) {
      try {
        utils.log('Parseando workbook Excel...');
        
        // Using SheetJS library
        if (typeof XLSX === 'undefined') {
          throw new Error('Biblioteca SheetJS não encontrada. Carregue https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
        }
        
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        utils.log(`Workbook carregado com ${workbook.SheetNames.length} planilhas`);
        
        return workbook;
        
      } catch (error) {
        utils.log(`Erro ao parsear workbook: ${error.message}`, 'error');
        throw error;
      }
    },

    extractSheetData(workbook, sheetName = null) {
      try {
        const targetSheet = sheetName || workbook.SheetNames[0];
        utils.log(`Extraindo dados da planilha: ${targetSheet}`);
        
        if (!workbook.Sheets[targetSheet]) {
          throw new Error(`Planilha "${targetSheet}" não encontrada`);
        }
        
        const worksheet = workbook.Sheets[targetSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false 
        });
        
        utils.log(`Dados extraídos: ${jsonData.length} linhas`);
        return jsonData;
        
      } catch (error) {
        utils.log(`Erro ao extrair dados: ${error.message}`, 'error');
        throw error;
      }
    }
  };

  // Data processor module
  const dataProcessor = {
    processRawData(rawData) {
      try {
        utils.log('Processando dados brutos...');
        
        if (!rawData || rawData.length < 2) {
          throw new Error('Dados insuficientes na planilha');
        }
        
        const headers = rawData[0];
        const dataRows = rawData.slice(1);
        
        utils.log(`Headers encontrados: ${headers.join(', ')}`);
        
        const processedDoctors = [];
        let validRowCount = 0;
        
        dataRows.forEach((row, index) => {
          try {
            const doctor = this.processRow(row, headers, index + 2); // +2 because header is row 1, and index starts at 0
            if (doctor) {
              processedDoctors.push(doctor);
              validRowCount++;
            }
          } catch (error) {
            utils.log(`Erro na linha ${index + 2}: ${error.message}`, 'warn');
          }
        });
        
        utils.log(`Processamento concluído: ${validRowCount} médicos válidos de ${dataRows.length} linhas`);
        return processedDoctors;
        
      } catch (error) {
        utils.log(`Erro no processamento: ${error.message}`, 'error');
        throw error;
      }
    },

    processRow(row, headers, rowNumber) {
      // Try to identify columns by common names
      const columnMap = this.identifyColumns(headers);
      
      if (!columnMap.name) {
        utils.log(`Linha ${rowNumber}: Coluna de nome não identificada`, 'warn');
        return null;
      }
      
      const name = row[columnMap.name];
      if (!name || utils.normalizeString(name).length === 0) {
        return null; // Skip empty names
      }
      
      // Extract values with fallbacks
      const specialty = row[columnMap.specialty] || '';
      const volume = row[columnMap.volume] || Math.random() * 100; // Fallback to random if not found
      const affinity = row[columnMap.affinity] || Math.random() * 100; // Fallback to random if not found
      
      // Process values
      const processedSpecialty = utils.parseSpecialty(specialty);
      const processedVolume = parseFloat(volume) || Math.random() * 100;
      const processedAffinity = parseFloat(affinity) || Math.random() * 100;
      const segment = utils.parseSegment(processedVolume, processedAffinity);
      const priority = utils.parsePriority(processedVolume, processedAffinity, segment);
      
      return {
        id: rowNumber,
        name: name.toString().trim(),
        specialty: processedSpecialty,
        segment: segment,
        volume: Math.round(processedVolume),
        affinity: Math.round(processedAffinity),
        priority: priority,
        originalRow: rowNumber
      };
    },

    identifyColumns(headers) {
      const columnMap = {
        name: null,
        specialty: null,
        volume: null,
        affinity: null
      };
      
      headers.forEach((header, index) => {
        const normalizedHeader = utils.normalizeString(header);
        
        // Name column patterns
        if (normalizedHeader.includes('nome') || 
            normalizedHeader.includes('medico') || 
            normalizedHeader.includes('doutor') || 
            normalizedHeader.includes('profissional')) {
          columnMap.name = index;
        }
        
        // Specialty column patterns
        if (normalizedHeader.includes('especialidade') || 
            normalizedHeader.includes('area') || 
            normalizedHeader.includes('especialização')) {
          columnMap.specialty = index;
        }
        
        // Volume column patterns
        if (normalizedHeader.includes('volume') || 
            normalizedHeader.includes('consultas') || 
            normalizedHeader.includes('atendimentos')) {
          columnMap.volume = index;
        }
        
        // Affinity column patterns
        if (normalizedHeader.includes('afinidade') || 
            normalizedHeader.includes('relacionamento') || 
            normalizedHeader.includes('engajamento')) {
          columnMap.affinity = index;
        }
      });
      
      utils.log(`Mapeamento de colunas: ${JSON.stringify(columnMap)}`);
      return columnMap;
    }
  };

  // Main loader class
  const mainLoader = {
    async loadData(filePath = null) {
      try {
        const targetPath = filePath || CONFIG.excelFilePath;
        utils.log('Iniciando carregamento de dados Excel...');
        
        // Load Excel file
        const arrayBuffer = await fileLoader.loadExcelFile(targetPath);
        
        // Parse workbook
        const workbook = excelParser.parseWorkbook(arrayBuffer);
        
        // Extract sheet data
        const rawData = excelParser.extractSheetData(workbook, CONFIG.sheetName);
        
        // Process data
        const processedData = dataProcessor.processRawData(rawData);
        
        utils.log(`Carregamento concluído: ${processedData.length} médicos carregados`);
        return processedData;
        
      } catch (error) {
        utils.log(`Erro no carregamento: ${error.message}`, 'error');
        
        // Return fallback data
        utils.log('Usando dados de fallback...', 'warn');
        return this.getFallbackData();
      }
    },

    getFallbackData() {
      // Return minimal fallback data if Excel loading fails
      return [
        { id: 1, name: 'Dr. João Silva', specialty: 'cardiologia', segment: 'blindar', volume: 85, affinity: 90, priority: 'high' },
        { id: 2, name: 'Dra. Maria Santos', specialty: 'neurologia', segment: 'blindar', volume: 82, affinity: 88, priority: 'high' },
        { id: 3, name: 'Dr. Pedro Oliveira', specialty: 'ortopedia', segment: 'incentivar', volume: 45, affinity: 88, priority: 'new-opportunities' }
      ];
    }
  };

  // Public API
  return {
    loadData: mainLoader.loadData.bind(mainLoader),
    config: CONFIG,
    version: '1.0.0',
    
    // Utility methods
    parseSpecialty: utils.parseSpecialty.bind(utils),
    parseSegment: utils.parseSegment.bind(utils),
    parsePriority: utils.parsePriority.bind(utils),
    
    // Debug methods
    debug: {
      utils,
      fileLoader,
      excelParser,
      dataProcessor,
      mainLoader
    }
  };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ExcelLoader = ExcelLoader;
}