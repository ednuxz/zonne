/**
 * Script para manejar el análisis y filtrado de datos JSON
 */
class FilterManager {
    constructor() {
        this.filterableFields = [];
        this.jsonData = null;
    }

    /**
     * Analiza el contenido JSON para identificar campos filtrables
     * @param {string} jsonContent - Contenido JSON en formato string
     * @returns {Array} - Lista de campos filtrables encontrados
     */
    analyzeJson(jsonContent) {
        try {
            // Parsear el JSON
            this.jsonData = JSON.parse(jsonContent);
            this.filterableFields = [];
            
            // Si es un array, analizar todos los elementos para encontrar propiedades comunes
            if (Array.isArray(this.jsonData)) {
                if (this.jsonData.length > 0) {
                    // Analizar todos los elementos para asegurar que se detecten todos los campos
                    // Esto es especialmente útil cuando algunos campos pueden estar presentes en unos elementos pero no en otros
                    for (let i = 0; i < Math.min(this.jsonData.length, 5); i++) {
                        if (typeof this.jsonData[i] === 'object' && this.jsonData[i] !== null) {
                            this._extractFields(this.jsonData[i], '');
                        }
                    }
                    
                    // Eliminar duplicados en filterableFields basados en path
                    this.filterableFields = this.filterableFields.filter((field, index, self) =>
                        index === self.findIndex((f) => f.path === field.path)
                    );
                    
                    // Mostrar sugerencia de filtros disponibles si es un array de objetos
                    this._suggestFilters();
                }
            } else {
                // Si es un objeto, analizarlo directamente
                this._extractFields(this.jsonData, '');
            }
            
            // Asegurarse de que se muestren los controles de filtro
            if (this.filterableFields.length > 0) {
                this._showFilterControls();
            }
            
            return this.filterableFields;
        } catch (e) {
            console.error('Error al analizar JSON:', e);
            return [];
        }
    }
    
    /**
     * Sugiere filtros basados en las propiedades encontradas en el array
     * @private
     */
    _suggestFilters() {
        if (Array.isArray(this.jsonData) && this.jsonData.length > 0 && typeof this.jsonData[0] === 'object') {
            // Crear un mensaje de sugerencia con las propiedades disponibles
            const propertyNames = this.filterableFields.map(field => field.label);
            
            if (propertyNames.length > 0) {
                const suggestionsContainer = document.createElement('div');
                suggestionsContainer.className = 'alert alert-info mt-2';
                
                // Crear una tabla para mostrar las propiedades y sus tipos
                let tableHtml = '<strong>Propiedades disponibles para filtrar:</strong><br>';
                tableHtml += '<table class="table table-sm mt-2">';
                tableHtml += '<thead><tr><th>Propiedad</th><th>Tipo</th><th>Ejemplo</th></tr></thead>';
                tableHtml += '<tbody>';
                
                this.filterableFields.forEach(field => {
                    // Obtener un valor de ejemplo del primer elemento
                    const fieldPath = field.path.split('.');
                    let exampleValue = this.jsonData[0];
                    for (const part of fieldPath) {
                        if (exampleValue && exampleValue[part] !== undefined) {
                            exampleValue = exampleValue[part];
                        } else {
                            exampleValue = 'N/A';
                            break;
                        }
                    }
                    
                    // Formatear el valor de ejemplo
                    let formattedExample = '';
                    if (typeof exampleValue === 'object') {
                        formattedExample = 'Objeto';
                    } else if (exampleValue === null) {
                        formattedExample = 'null';
                    } else {
                        formattedExample = String(exampleValue).substring(0, 30);
                        if (String(exampleValue).length > 30) {
                            formattedExample += '...';
                        }
                    }
                    
                    tableHtml += `<tr>
                        <td>${field.label}</td>
                        <td>${field.type}</td>
                        <td>${formattedExample}</td>
                    </tr>`;
                });
                
                tableHtml += '</tbody></table>';
                suggestionsContainer.innerHTML = tableHtml;
                
                // Mostrar la sugerencia en el contenedor de respuesta
                const contentRequestDiv = document.getElementById('contenido-request');
                if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
                    // Eliminar sugerencias anteriores
                    const existingSuggestion = contentRequestDiv.querySelector('.alert-info');
                    if (existingSuggestion) {
                        existingSuggestion.remove();
                    }
                    
                    contentRequestDiv.querySelector('.col-xl-10').appendChild(suggestionsContainer);
                    
                    // Generar y mostrar los controles de filtro directamente
                    this._showFilterControls();
                }
            }
        }
    }

    /**
     * Extrae campos filtrables recursivamente de un objeto
     * @param {Object} obj - Objeto a analizar
     * @param {string} prefix - Prefijo para campos anidados
     * @private
     */
    _extractFields(obj, prefix) {
        if (!obj || typeof obj !== 'object') return;
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const fieldPath = prefix ? `${prefix}.${key}` : key;
                
                if (value === null) continue;
                
                // Determinar el tipo de valor para saber qué tipo de filtro aplicar
                if (typeof value === 'string') {
                    this.filterableFields.push({
                        path: fieldPath,
                        type: 'string',
                        label: this._formatFieldName(key)
                    });
                } else if (typeof value === 'number' || key === 'ud' || key === 'id') {
                    // Asegurarse de que los campos 'ud' e 'id' siempre se detecten como numéricos
                    this.filterableFields.push({
                        path: fieldPath,
                        type: 'number',
                        label: this._formatFieldName(key)
                    });
                } else if (typeof value === 'boolean') {
                    this.filterableFields.push({
                        path: fieldPath,
                        type: 'boolean',
                        label: this._formatFieldName(key)
                    });
                } else if (Array.isArray(value)) {
                    // Para arrays, solo consideramos si tienen elementos primitivos
                    if (value.length > 0 && typeof value[0] !== 'object') {
                        this.filterableFields.push({
                            path: fieldPath,
                            type: 'array',
                            label: this._formatFieldName(key)
                        });
                    }
                } else if (typeof value === 'object') {
                    // Recursivamente analizar objetos anidados
                    this._extractFields(value, fieldPath);
                }
            }
        }
    }

    /**
     * Formatea el nombre del campo para mostrar en la UI
     * @param {string} fieldName - Nombre del campo
     * @returns {string} - Nombre formateado
     * @private
     */
    _formatFieldName(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1') // Insertar espacio antes de mayúsculas
            .replace(/^./, str => str.toUpperCase()) // Primera letra mayúscula
            .replace(/_/g, ' '); // Reemplazar guiones bajos por espacios
    }

    /**
     * Genera HTML para los controles de filtro basados en los campos encontrados
     * @returns {string} - HTML para los controles de filtro
     */
    generateFilterControls() {
        if (!this.filterableFields.length) return '';
        
        let html = '<div class="filter-controls mt-4 mb-3">';
        html += '<h5>Filtros disponibles</h5>';
        html += '<div class="row">';
        
        this.filterableFields.forEach(field => {
            html += `<div class="col-md-6 mb-2">`;
            html += `<label class="form-label">${field.label}</label>`;
            
            switch (field.type) {
                case 'string':
                    html += `<input type="text" class="form-control filter-input" data-field="${field.path}" data-type="${field.type}" placeholder="Filtrar por ${field.label.toLowerCase()}">`;
                    break;
                case 'number':
                    html += `<div class="input-group">`;
                    html += `<select class="form-select filter-operator" style="max-width: 80px;">`;
                    html += `<option value="eq">=</option>`;
                    html += `<option value="gt">&gt;</option>`;
                    html += `<option value="lt">&lt;</option>`;
                    html += `</select>`;
                    html += `<input type="number" class="form-control filter-input" data-field="${field.path}" data-type="${field.type}" placeholder="Valor">`;
                    html += `</div>`;
                    break;
                case 'boolean':
                    html += `<select class="form-select filter-input" data-field="${field.path}" data-type="${field.type}">`;
                    html += `<option value="">Todos</option>`;
                    html += `<option value="true">Verdadero</option>`;
                    html += `<option value="false">Falso</option>`;
                    html += `</select>`;
                    break;
                case 'array':
                    html += `<input type="text" class="form-control filter-input" data-field="${field.path}" data-type="${field.type}" placeholder="Buscar en ${field.label.toLowerCase()}">`;
                    break;
            }
            
            html += `</div>`;
        });
        
        html += '</div>';
        html += '<button id="apply-filters" class="btn btn-primary btn-sm me-2">Aplicar Filtros</button>';
        html += '<button id="reset-filters" class="btn btn-outline-secondary btn-sm">Restablecer</button>';
        html += '</div>';
        
        return html;
    }
    
    /**
     * Muestra los controles de filtro en el contenedor de respuesta
     * @private
     */
    _showFilterControls() {
        if (!this.filterableFields.length) return;
        
        // Generar controles de filtro
        const filterControlsHtml = this.generateFilterControls();
        
        // Mostrar los controles de filtro
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        filterContainer.innerHTML = filterControlsHtml;
        
        // Añadir al contenedor de respuesta
        const contentRequestDiv = document.getElementById('contenido-request');
        if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
            // Verificar si ya existe un contenedor de filtros
            const existingFilterContainer = contentRequestDiv.querySelector('.filter-container');
            if (existingFilterContainer) {
                existingFilterContainer.remove();
            }
            
            contentRequestDiv.querySelector('.col-xl-10').appendChild(filterContainer);
            
            // Configurar eventos para los filtros
            this._setupFilterEvents();
        }
    }

    /**
     * Aplica los filtros al contenido JSON
     * @param {Array} filters - Lista de filtros a aplicar
     * @returns {Array|Object} - Datos filtrados
     */
    applyFilters(filters) {
        if (!this.jsonData) return null;
        
        // Si no es un array, convertirlo para facilitar el filtrado
        const dataArray = Array.isArray(this.jsonData) ? this.jsonData : [this.jsonData];
        
        // Aplicar cada filtro
        const filteredData = dataArray.filter(item => {
            return filters.every(filter => {
                const { field, value, type, operator } = filter;
                if (!value) return true; // Ignorar filtros vacíos
                
                // Obtener el valor del campo (puede ser anidado)
                const fieldParts = field.split('.');
                let fieldValue = item;
                
                for (const part of fieldParts) {
                    if (fieldValue === undefined || fieldValue === null) return false;
                    fieldValue = fieldValue[part];
                }
                
                if (fieldValue === undefined || fieldValue === null) return false;
                
                // Aplicar filtro según el tipo
                switch (type) {
                    case 'string':
                        return fieldValue.toString().toLowerCase().includes(value.toLowerCase());
                    case 'number':
                        const numValue = parseFloat(value);
                        if (isNaN(numValue)) return true;
                        
                        switch (operator) {
                            case 'gt': return fieldValue > numValue;
                            case 'lt': return fieldValue < numValue;
                            default: return fieldValue === numValue;
                        }
                    case 'boolean':
                        return fieldValue.toString() === value;
                    case 'array':
                        if (Array.isArray(fieldValue)) {
                            return fieldValue.some(val => 
                                val.toString().toLowerCase().includes(value.toLowerCase())
                            );
                        }
                        return false;
                    default:
                        return true;
                }
            });
        });
        
        return Array.isArray(this.jsonData) ? filteredData : filteredData[0];
    }

    /**
     * Genera la URL con parámetros de filtro para la API
     * @param {Array} filters - Lista de filtros a aplicar
     * @returns {string} - URL con parámetros de filtro
     */
    generateFilterUrl(baseUrl, filters) {
        if (!filters.length) return baseUrl;
        
        const params = filters
            .filter(f => f.value) // Solo incluir filtros con valor
            .map(filter => {
                const encodedValue = encodeURIComponent(filter.value);
                const param = `filter[${filter.field}]=${encodedValue}`;
                if (filter.type === 'number' && filter.operator) {
                    return `${param}&operator[${filter.field}]=${filter.operator}`;
                }
                return param;
            });
        
        if (params.length === 0) return baseUrl;
        
        return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.join('&')}`;
    }
    
    /**
     * Configura los eventos para los controles de filtro
     * @private
     */
    _setupFilterEvents() {
        const applyFiltersBtn = document.getElementById('apply-filters');
        const resetFiltersBtn = document.getElementById('reset-filters');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this._applyFiltersUI();
            });
        }
        
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this._resetFiltersUI();
            });
        }
    }
    
    /**
     * Aplica los filtros y actualiza la UI
     * @private
     */
    _applyFiltersUI() {
        const filterInputs = document.querySelectorAll('.filter-input');
        const filters = [];
        
        filterInputs.forEach(input => {
            const field = input.getAttribute('data-field');
            const type = input.getAttribute('data-type');
            const value = input.value.trim();
            
            if (value) {
                const filter = {
                    field,
                    type,
                    value
                };
                
                // Para campos numéricos, obtener el operador
                if (type === 'number') {
                    const operatorSelect = input.parentElement.querySelector('.filter-operator');
                    if (operatorSelect) {
                        filter.operator = operatorSelect.value;
                    }
                }
                
                filters.push(filter);
            }
        });
        
        if (filters.length > 0) {
            // Obtener la URL base
            const apiPathDisplay = document.getElementById('pathApi');
            if (!apiPathDisplay) return;
            
            const baseUrl = apiPathDisplay.textContent;
            
            // Generar URL con filtros
            const filteredUrl = this.generateFilterUrl(baseUrl, filters);
            
            // Actualizar la URL mostrada
            const urlWithFilters = document.createElement('div');
            urlWithFilters.className = 'mt-2';
            urlWithFilters.innerHTML = `<small class="text-success">URL con filtros: <strong>${filteredUrl}</strong></small>`;
            
            // Mostrar la URL con filtros
            const existingFilterUrl = document.querySelector('.text-success');
            if (existingFilterUrl) {
                existingFilterUrl.parentElement.remove();
            }
            
            apiPathDisplay.parentElement.appendChild(urlWithFilters);
            
            // Aplicar filtros a los datos y mostrar resultado
            const filteredData = this.applyFilters(filters);
            if (filteredData) {
                // Mostrar datos filtrados
                const filteredResponseContainer = document.createElement('div');
                filteredResponseContainer.className = 'filtered-response mt-3';
                
                const filteredTitle = document.createElement('h6');
                filteredTitle.textContent = 'Resultado filtrado:';
                filteredResponseContainer.appendChild(filteredTitle);
                
                const filteredPre = document.createElement('pre');
                filteredPre.className = 'bg-light p-3 rounded';
                filteredPre.style.maxHeight = '300px';
                filteredPre.style.overflow = 'auto';
                filteredPre.textContent = JSON.stringify(filteredData, null, 2);
                filteredResponseContainer.appendChild(filteredPre);
                
                // Eliminar resultados filtrados anteriores
                const existingFilteredResponse = document.querySelector('.filtered-response');
                if (existingFilteredResponse) {
                    existingFilteredResponse.remove();
                }
                
                // Añadir al contenedor
                const contentRequestDiv = document.getElementById('contenido-request');
                if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
                    contentRequestDiv.querySelector('.col-xl-10').appendChild(filteredResponseContainer);
                }
            }
        }
    }
    
    /**
     * Restablece los filtros y actualiza la UI
     * @private
     */
    _resetFiltersUI() {
        const filterInputs = document.querySelectorAll('.filter-input');
        filterInputs.forEach(input => {
            input.value = '';
        });
        
        // Eliminar URL con filtros
        const filterUrl = document.querySelector('.text-success');
        if (filterUrl && filterUrl.parentElement) {
            filterUrl.parentElement.remove();
        }
        
        // Eliminar resultados filtrados
        const filteredResponse = document.querySelector('.filtered-response');
        if (filteredResponse) {
            filteredResponse.remove();
        }
        
        // Eliminar sugerencias anteriores
        const existingSuggestion = document.querySelector('.alert-info');
        if (existingSuggestion) {
            existingSuggestion.remove();
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Crear instancia del gestor de filtros
    window.filterManager = new FilterManager();
});