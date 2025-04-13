/**
 * Script para manejar la creación de endpoints y filtrado de datos
 */
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const projectNameInput = document.querySelector('input[placeholder="Nombre del Proyecto"]');
    const methodSelect = document.querySelector('.form-select');
    const routeInput = document.querySelector('.input-group input.form-control:not([placeholder])');
    const publishButton = document.querySelector('button.btn.btn-dark');
    const apiPathDisplay = document.getElementById('pathApi');
    const contentRequestDiv = document.getElementById('contenido-request');
    
    // Verificar si tenemos acceso al editor CodeMirror
    let codeMirrorEditor = null;
    
    // Función para obtener el editor CodeMirror
    function getCodeMirrorEditor() {
        const cmElement = document.querySelector('.CodeMirror');
        if (cmElement && cmElement.CodeMirror) {
            return cmElement.CodeMirror;
        }
        return null;
    }
    
    // Función para obtener el contenido JSON
    function getJsonContent() {
        const editor = getCodeMirrorEditor();
        if (editor) {
            return editor.getValue();
        }
        // Si no hay editor, usar el textarea
        const textarea = document.querySelector('textarea.form-control');
        return textarea ? textarea.value : '{}';
    }
    
    // Función para validar JSON
    function isValidJson(json) {
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Función para mostrar mensajes de error o éxito
    function showMessage(message, isError = false) {
        const alertDiv = document.createElement('div');
        alertDiv.className = isError ? 'alert alert-danger' : 'alert alert-success';
        alertDiv.textContent = message;
        
        // Verificar si el contenedor existe antes de intentar acceder a él
        if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
            // Insertar al inicio del contenedor
            contentRequestDiv.querySelector('.col-xl-10').innerHTML = '';
            contentRequestDiv.querySelector('.col-xl-10').appendChild(alertDiv);
            
            // Eliminar después de 5 segundos
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        } else {
            // Si no existe el contenedor, mostrar en consola
            console.error('Error: No se pudo mostrar el mensaje - Contenedor no encontrado');
            console.log(message);
        }
    }
    
    // Función para mostrar la respuesta JSON formateada
    function displayJsonResponse(jsonData) {
        const responseContainer = document.createElement('div');
        responseContainer.className = 'json-response';
        
        // Crear un elemento pre para mostrar el JSON formateado
        const preElement = document.createElement('pre');
        preElement.className = 'bg-light p-3 rounded';
        preElement.style.maxHeight = '400px';
        preElement.style.overflow = 'auto';
        
        try {
            // Si jsonData ya es un objeto, convertirlo a string formateado
            const jsonString = typeof jsonData === 'string' 
                ? JSON.stringify(JSON.parse(jsonData), null, 2)
                : JSON.stringify(jsonData, null, 2);
                
            preElement.textContent = jsonString;
        } catch (e) {
            preElement.textContent = 'Error al formatear JSON: ' + e.message;
        }
        
        responseContainer.appendChild(preElement);
        
        // Verificar si el contenedor existe antes de intentar acceder a él
        if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
            contentRequestDiv.querySelector('.col-xl-10').appendChild(responseContainer);
        } else {
            console.error('Error: No se pudo mostrar la respuesta JSON - Contenedor no encontrado');
        }
    }
    

    // Las funciones setupFilterEvents, applyFilters y resetFilters han sido movidas
    // a la clase FilterManager para una mejor encapsulación y mantenimiento
    
    // Función para publicar el endpoint
    function publishEndpoint() {
        // Obtener valores del formulario
        const projectName = projectNameInput.value.trim();
        const method = methodSelect.value;
        const route = routeInput.value.trim();
        const content = getJsonContent();
        
        // Validar campos
        if (!projectName) {
            showMessage('Por favor, ingrese un nombre de proyecto', true);
            return;
        }
        
        if (!route) {
            showMessage('Por favor, ingrese una ruta para el endpoint', true);
            return;
        }
        
        if (!isValidJson(content)) {
            showMessage('El contenido JSON no es válido', true);
            return;
        }
        
        // Preparar datos para enviar
        const requestData = {
            projectName: projectName,
            route: route,
            method: method,
            content: content
        };
        
        // Enviar solicitud al servidor
        fetch('api-handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage(data.message);
                // Actualizar la URL mostrada
                if (data.url) {
                    apiPathDisplay.textContent = data.url;
                }
                // Mostrar respuesta
                displayJsonResponse({
                    endpoint: data.url,
                    method: method,
                    content: JSON.parse(content)
                });
                
                // Analizar el JSON para mostrar opciones de filtrado
                const jsonContent = JSON.parse(content);
                if (Array.isArray(jsonContent) && jsonContent.length > 0 && typeof jsonContent[0] === 'object') {
                    // Extraer las claves del primer objeto del array
                    const keys = Object.keys(jsonContent[0]);
                    
                    if (keys.length > 0) {
                        // Crear contenedor para ejemplos de filtros
                        const filterExamplesContainer = document.createElement('div');
                        filterExamplesContainer.className = 'filter-examples mt-3';
                        
                        // Crear título para los ejemplos
                        const titleElement = document.createElement('h5');
                        titleElement.textContent = 'Ejemplos de filtros:';
                        filterExamplesContainer.appendChild(titleElement);
                        
                        // Seleccionar hasta 2 claves para los ejemplos
                        const exampleKeys = keys.slice(0, 2);
                        
                        // Crear ejemplos de filtros
                        exampleKeys.forEach(key => {
                            const exampleElement = document.createElement('div');
                            exampleElement.className = 'filter-example mb-2';
                            
                            const exampleUrl = `${data.url}?${key}=valor`;
                            exampleElement.innerHTML = `
                                <code>${exampleUrl}</code>
                                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="navigator.clipboard.writeText('${exampleUrl}')">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                                        <path d="M363.5-292q-24.44 0-40.97-16.53Q306-325.06 306-349.5v-416q0-24.44 16.53-40.97Q339.06-823 363.5-823h296q24.44 0 40.97 16.53Q717-789.94 717-765.5v416q0 24.44-16.53 40.97Q683.94-292 659.5-292h-296Zm-103 103q-24.44 0-40.97-16.53Q203-222.06 203-246.5V-688h25.5v441.5q0 12 10 22t22 10H582v25.5H260.5Z"/>
                                    </svg>
                                </button>
                            `;
                            
                            filterExamplesContainer.appendChild(exampleElement);
                        });
                        
                        // Añadir ejemplos al contenedor de respuesta
                        if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
                            contentRequestDiv.querySelector('.col-xl-10').appendChild(filterExamplesContainer);
                        }
                    }
                }
            
            } else {
                showMessage(data.message, true);
            }
        })
        .catch(error => {
            showMessage('Error al crear el endpoint: ' + error.message, true);
        });
    }
    
    // Asignar evento al botón de publicar
    if (publishButton) {
        publishButton.addEventListener('click', publishEndpoint);
    }
});