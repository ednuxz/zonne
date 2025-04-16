/**
 * Script para manejar la creación de endpoints y filtrado de datos
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si tenemos acceso al gestor de códigos de estado
    if (!window.statusCodeManager) {
        console.warn('El gestor de códigos de estado no está disponible');
        // Crear una instancia temporal si no existe
        window.statusCodeManager = new StatusCodeManager();
    }
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
    

    // Función para normalizar el nombre del proyecto (reemplazar espacios por guiones)
    function normalizeProjectName(name) {
        // Reemplazar espacios por guiones y eliminar caracteres especiales
        return name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    }
    
    // Función para cargar y mostrar los endpoints existentes
    function loadEndpoints(projectName) {
        // Normalizar el nombre del proyecto (convertir espacios a guiones)
        const normalizedProjectName = normalizeProjectName(projectName);
        
        fetch(`api/list-endpoints.php?project=${encodeURIComponent(normalizedProjectName)}`)
            .then(response => response.json())
            .then(data => {
                if (data.endpoints && Array.isArray(data.endpoints)) {
                    displayEndpoints(data.endpoints, normalizedProjectName);
                } else {
                    showMessage(`No se encontraron endpoints para el proyecto "${projectName}" (${normalizedProjectName})`, true);
                }
            })
            .catch(error => {
                console.error('Error al cargar endpoints:', error);
                showMessage('Error al cargar los endpoints', true);
            });
    }
    
    // Las funciones setupFilterEvents, applyFilters y resetFilters han sido movidas
    // a la clase FilterManager para una mejor encapsulación y mantenimiento

    // Función para mostrar los endpoints en la interfaz
    function displayEndpoints(endpoints, projectName) {
        const resultsContainer = document.getElementById('resultados-busqueda');
        if (!resultsContainer) {
            console.error('Contenedor de resultados no encontrado');
            return;
        }
        
        // Limpiar resultados anteriores
        resultsContainer.innerHTML = '';
        
        // Si no hay endpoints, mostrar mensaje
        if (endpoints.length === 0) {
            resultsContainer.innerHTML = '<div class="alert alert-info">No se encontraron endpoints para este proyecto</div>';
            return;
        }
        
        // Crear tabla para mostrar los endpoints
        const table = document.createElement('table');
        table.className = 'table table-striped table-hover';
        
        // Crear encabezado de la tabla
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Ruta</th>
                <th>Método</th>
                <th>Código de Estado</th>
                <th>Acciones</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        // Agregar cada endpoint a la tabla
        endpoints.forEach(endpoint => {
            const tr = document.createElement('tr');
            
            // Celda para la ruta
            const routeCell = document.createElement('td');
            routeCell.textContent = endpoint.route;
            tr.appendChild(routeCell);
            
            // Celda para el método
            const methodCell = document.createElement('td');
            const methodBadge = document.createElement('span');
            methodBadge.className = 'badge ' + getMethodBadgeClass(endpoint.method);
            methodBadge.textContent = endpoint.method;
            methodCell.appendChild(methodBadge);
            tr.appendChild(methodCell);
            
            // Celda para el código de estado
            const statusCodeCell = document.createElement('td');
            const statusCode = endpoint.status_code || 200;
            
            // Crear selector de código de estado
            const statusCodeSelector = window.statusCodeManager.createStatusCodeSelector(statusCode, (newStatusCode, errorMessage) => {
                // Obtener el texto descriptivo del código de estado
                const statusText = window.statusCodeManager.getStatusCodeText(newStatusCode);
                
                window.statusCodeManager.updateEndpointStatusCode(projectName, endpoint.route, newStatusCode, errorMessage)
                .then(() => {
                    console.log('Código de estado actualizado:', statusCode);
                    // Mostrar mensaje diferente según si es un código de error o no
                    if (newStatusCode >= 400) {
                        const errorMsg = errorMessage ? `: "${errorMessage}"` : '';
                        showMessage(`Código de estado actualizado a ${newStatusCode} (${statusText})${errorMsg}`, false);
                    } else {
                        showMessage(`Código de estado actualizado a ${newStatusCode} (${statusText})`, false);
                    }
                    
                    // Limpiar mensajes y recargar endpoints después de un breve retraso
                
                     $("#searchProjectEndpoints").click();
                
                })
                .catch(error => showMessage(error.message, true));
            });
            
            statusCodeCell.appendChild(statusCodeSelector);
            tr.appendChild(statusCodeCell);
            
            // Celda para acciones
            const actionsCell = document.createElement('td');
            
            // Botón para copiar URL
            const copyButton = document.createElement('button');
            copyButton.className = 'btn btn-sm btn-outline-secondary me-1';
            copyButton.innerHTML = '<i class="bi bi-clipboard"></i>';
            copyButton.title = 'Copiar URL';
            copyButton.onclick = () => {
                const baseUrl = window.location.origin;
                const url = `${baseUrl}/${projectName}/${endpoint.route}`;
                navigator.clipboard.writeText(url)
                    .then(() => {
                        copyButton.className = 'btn btn-sm btn-success me-1';
                        setTimeout(() => {
                            copyButton.className = 'btn btn-sm btn-outline-secondary me-1';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Error al copiar URL:', err);
                    });
            };
            actionsCell.appendChild(copyButton);
            
            tr.appendChild(actionsCell);
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        resultsContainer.appendChild(table);
    }

    // Función para obtener la clase de badge según el método HTTP
    function getMethodBadgeClass(method) {
        switch (method.toUpperCase()) {
            case 'GET':
                return 'bg-success';
            case 'POST':
                return 'bg-primary';
            case 'PUT':
                return 'bg-warning';
            case 'DELETE':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    }

    // Función para actualizar el código de estado de un endpoint
    function updateEndpointStatusCode(projectName, route, statusCode, errorMessage) {
        // Obtener el texto descriptivo del código de estado
        const statusText = window.statusCodeManager.getStatusCodeText(statusCode);
        
        window.statusCodeManager.updateEndpointStatusCode(projectName, route, statusCode, errorMessage)
            .then(data => {
                // Mostrar mensaje diferente según si es un código de error o no
                if (statusCode >= 400) {
                    const errorMsg = errorMessage ? `: "${errorMessage}"` : '';
                    Swal.fire({
                        title: 'Código de estado actualizado',
                        text: `Código de estado actualizado a ${statusCode} (${statusText})`,
                        icon: statusCode >= 400 ? 'error' : 'success'
                      });
                } else {
                    Swal.fire({
                      title: 'Código de estado actualizado',
                      text: `Código de estado actualizado a ${statusCode} (${statusText})`,
                      icon: statusCode >= 400 ? 'error' : 'success'
                    });
                }
                
                // Limpiar mensajes y recargar endpoints después de un breve retraso
                setTimeout(() => {
                    // Limpiar completamente el contenedor de mensajes
                    const messageContainer = document.querySelector('#contenido-request .col-xl-10');
                    if (messageContainer) {
                        messageContainer.innerHTML = '';
                    }
                    
                    // Recargar la lista de endpoints
                    loadEndpoints(projectName);
                    
                    // Forzar la actualización de la interfaz para mostrar la lista de endpoints
                    const resultsContainer = document.getElementById('resultados-busqueda');
                    if (resultsContainer) {
                        // Hacer scroll a la sección de resultados para que sea visible
                        resultsContainer.scrollIntoView({ behavior: 'smooth' });
                    }
                    
                    // Forzar la búsqueda de endpoints para asegurar que se muestre la lista actualizada
                    if (projectNameInput && projectNameInput.value.trim() === projectName) {
                        // Usar la función de búsqueda directamente en lugar de simular un clic
                        const searchButton = document.getElementById('searchProjectEndpoints');
                        if (searchButton && typeof searchButton.onclick === 'function') {
                            searchButton.onclick();
                        }
                    }
                }, 1500); // Tiempo suficiente para que el usuario pueda leer el mensaje
            })
            .catch(error => {
                console.error('Error al actualizar código de estado:', error);
                showMessage(`Error al actualizar el código de estado: ${error.message}`, true);
            });}
    
    
    // Función para publicar el endpoint
    function publishEndpoint() {
        // Obtener valores del formulario
        const projectName = projectNameInput.value.trim();
        // Normalizar el nombre del proyecto (convertir espacios a guiones)
        const normalizedProjectName = normalizeProjectName(projectName);
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
            projectName: normalizedProjectName,
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