/**
 * Script para manejar los códigos de estado HTTP de los endpoints
 */
class StatusCodeManager {
    constructor() {
        // Lista de códigos HTTP comunes para mostrar en el selector
        this.httpCodes = [
            { code: 200, text: "OK", description: "Solicitud exitosa" },
            { code: 201, text: "Created", description: "Recurso creado correctamente" },
            { code: 204, text: "No Content", description: "Solicitud exitosa, sin contenido para devolver" },
            { code: 400, text: "Bad Request", description: "Solicitud incorrecta" },
            { code: 401, text: "Unauthorized", description: "Autenticación requerida" },
            { code: 403, text: "Forbidden", description: "Acceso prohibido" },
            { code: 404, text: "Not Found", description: "Recurso no encontrado" },
            { code: 405, text: "Method Not Allowed", description: "Método no permitido" },
            { code: 500, text: "Internal Server Error", description: "Error interno del servidor" },
            { code: 503, text: "Service Unavailable", description: "Servicio no disponible" }
        ];
    }

    /**
     * Crea un selector de códigos HTTP
     * @param {number} currentCode - Código HTTP actual
     * @param {Function} onChange - Función a ejecutar cuando cambia el selector
     * @returns {HTMLElement} - Elemento select con los códigos HTTP
     */
    createStatusCodeSelector(currentCode = 200, onChange = null) {
        const container = document.createElement('div');
        container.className = 'd-flex align-items-center gap-2';
        
        const select = document.createElement('select');
        select.className = 'form-select form-select-sm status-code-selector';
        select.style.width = 'auto';
        select.title = 'Código de estado HTTP';
        
        // Agregar opciones al selector
        this.httpCodes.forEach(code => {
            const option = document.createElement('option');
            option.value = code.code;
            option.textContent = `${code.code} - ${code.text}`;
            option.title = code.description;
            if (code.code === currentCode) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // Crear campo de texto para mensaje JSON personalizado
        const jsonInput = document.createElement('input');
        jsonInput.type = 'text';
        jsonInput.className = 'form-control form-control-sm';
        jsonInput.placeholder = 'Mensaje JSON personalizado (opcional)';
        jsonInput.title = 'Ingrese un mensaje JSON personalizado para este código de error';
        jsonInput.id = 'jsonInputCodeResponse';
        jsonInput.style.display = parseInt(select.value) >= 400 ? 'block' : 'none';
        
        // Agregar evento de cambio si se proporciona una función
        if (onChange && typeof onChange === 'function') {
            select.addEventListener('change', (e) => {
                const code = parseInt(e.target.value);
                jsonInput.style.display = code >= 400 ? 'block' : 'none';
                onChange(code, jsonInput.value);
            });
            
            jsonInput.addEventListener('change', () => {
                onChange(parseInt(select.value), jsonInput.value);
            });
        }
        
        container.appendChild(select);
        container.appendChild(jsonInput);
        
        return container;
    }

    /**
     * Actualiza el código de estado HTTP de un endpoint
     * @param {string} projectName - Nombre del proyecto
     * @param {string} route - Ruta del endpoint
     * @param {number} statusCode - Nuevo código de estado HTTP
     * @returns {Promise} - Promesa que se resuelve cuando se actualiza el código
     */
    updateEndpointStatusCode(projectName, route, statusCode, errorMessage = null) {
        return fetch('api-handler.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectName: projectName,
                route: route,
                statusCode: statusCode,
                errorMessage: errorMessage
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || 'Error al actualizar el código de estado');
            }
            return data;
        });
    }

    /**
     * Obtiene el texto descriptivo de un código HTTP
     * @param {number} code - Código HTTP
     * @returns {string} - Texto descriptivo del código
     */
    getStatusCodeText(code) {
        const httpCode = this.httpCodes.find(item => item.code === parseInt(code));
        return httpCode ? httpCode.text : 'Unknown';
    }
}

// Inicializar el gestor de códigos de estado cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Crear una instancia global del gestor de códigos de estado
    window.statusCodeManager = new StatusCodeManager();
});