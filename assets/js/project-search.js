/**
 * Script para manejar la búsqueda de endpoints por proyecto
 */
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const projectNameInput = document.querySelector('input[placeholder="Nombre del Proyecto"]');
    const searchButton = document.getElementById('searchProjectEndpoints');
    const contentRequestDiv = document.getElementById('contenido-request');
    
    // Función para mostrar mensajes
    function showMessage(message, isError = false) {
        const alertDiv = document.createElement('div');
        alertDiv.className = isError ? 'alert alert-danger' : 'alert alert-info';
        alertDiv.textContent = message;
        
        if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
            // Limpiar contenido anterior
            contentRequestDiv.querySelector('.col-xl-10').innerHTML = '';
            contentRequestDiv.querySelector('.col-xl-10').appendChild(alertDiv);
            
            // Eliminar después de 5 segundos si es un error
            if (isError) {
                setTimeout(() => {
                    alertDiv.remove();
                }, 5000);
            }
        }
    }
    
    // Función para mostrar los endpoints encontrados
    function displayEndpoints(projectName, endpoints) {
        // Limpiar contenido anterior
        if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
            contentRequestDiv.querySelector('.col-xl-10').innerHTML = '';
        }
        
        // Crear título
        const titleElement = document.createElement('h4');
        titleElement.textContent = `Endpoints del proyecto "${projectName.replace(/-/g, ' ')}"`;
        titleElement.className = 'mb-3';
        
        // Crear tabla para mostrar los endpoints
        const table = document.createElement('table');
        table.className = 'table table-striped table-hover';
        
        // Crear encabezado de tabla
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Método</th>
                <th>Ruta</th>
                <th>Acciones</th>
            </tr>
        `;
        
        // Crear cuerpo de tabla
        const tbody = document.createElement('tbody');
        
        // Si no hay endpoints, mostrar mensaje
        if (endpoints.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="3" class="text-center">No se encontraron endpoints para este proyecto</td>
            `;
            tbody.appendChild(row);
        } else {
            // Agregar cada endpoint a la tabla
            endpoints.forEach(endpoint => {
                const row = document.createElement('tr');
                
                // Crear celdas para método y ruta
                const methodCell = document.createElement('td');
                methodCell.textContent = endpoint.method;
                methodCell.className = getMethodClass(endpoint.method);
                
                const routeCell = document.createElement('td');
                routeCell.textContent = endpoint.route;
                
                // Crear celda para acciones
                const actionsCell = document.createElement('td');
                
                // Botón para cargar endpoint
                const loadButton = document.createElement('button');
                loadButton.className = 'btn btn-sm btn-primary me-2';
                loadButton.textContent = 'Cargar';
                loadButton.addEventListener('click', () => loadEndpoint(projectName, endpoint.route, endpoint.method));
                
                // Botón para ver contenido
                const viewButton = document.createElement('button');
                viewButton.className = 'btn btn-sm btn-info me-2';
                viewButton.textContent = 'Ver';
                viewButton.addEventListener('click', () => viewEndpointContent(projectName, endpoint.route));
                
                // Botón para eliminar endpoint
                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn btn-sm btn-danger';
                deleteButton.textContent = 'Borrar';
                deleteButton.addEventListener('click', () => deleteEndpoint(projectName, endpoint.route, endpoint.method));
                
                // Selector de código de estado HTTP
                const statusCodeContainer = document.createElement('div');
                statusCodeContainer.className = 'mt-2 d-flex align-items-center';
                
                const statusLabel = document.createElement('small');
                statusLabel.className = 'me-2';
                statusLabel.textContent = 'Estado HTTP:';
                statusCodeContainer.appendChild(statusLabel);
                
                // Obtener el código de estado actual (por defecto 200)
                const currentStatusCode = endpoint.status_code || 200;
                
                // Crear selector de código de estado usando el StatusCodeManager
                const statusCodeSelector = window.statusCodeManager.createStatusCodeSelector(
                    currentStatusCode,
                    (newCode) => updateEndpointStatusCode(projectName, endpoint.route, newCode)
                );
                statusCodeContainer.appendChild(statusCodeSelector);
                
                // Añadir el contenedor del selector a la celda de acciones
                const actionsWrapper = document.createElement('div');
                actionsWrapper.appendChild(loadButton);
                actionsWrapper.appendChild(viewButton);
                actionsWrapper.appendChild(deleteButton);
                
                actionsCell.appendChild(actionsWrapper);
                actionsCell.appendChild(statusCodeContainer);
                
                // Agregar celdas a la fila
                row.appendChild(methodCell);
                row.appendChild(routeCell);
                row.appendChild(actionsCell);
                
                // Agregar fila a la tabla
                tbody.appendChild(row);
            });
        }
        
        // Ensamblar la tabla
        table.appendChild(thead);
        table.appendChild(tbody);
        
        // Agregar elementos al contenedor
        if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
            contentRequestDiv.querySelector('.col-xl-10').appendChild(titleElement);
            contentRequestDiv.querySelector('.col-xl-10').appendChild(table);
        }
    }
    
    // Función para obtener clase CSS según el método HTTP
    function getMethodClass(method) {
        switch (method.toUpperCase()) {
            case 'GET':
                return 'text-success';
            case 'POST':
                return 'text-primary';
            case 'PUT':
                return 'text-warning';
            case 'DELETE':
                return 'text-danger';
            default:
                return '';
        }
    }
    
    // Función para cargar un endpoint en el formulario
    function loadEndpoint(projectName, route, method) {
        // Establecer el nombre del proyecto (usando la versión original, no la normalizada)
        projectNameInput.value = projectName;
        
        // Establecer la ruta
        const routeInput = document.querySelector('.input-group input.form-control:not([placeholder])');
        if (routeInput) {
            routeInput.value = route;
        }
        
        // Establecer el método
        const methodSelect = document.querySelector('.form-select');
        if (methodSelect) {
            // Buscar la opción que coincida con el método
            for (let i = 0; i < methodSelect.options.length; i++) {
                if (methodSelect.options[i].value === method) {
                    methodSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Actualizar la URL mostrada en el elemento pathApi
        const apiPathDisplay = document.getElementById('pathApi');
        if (apiPathDisplay) {
            // Construir la URL completa con el nombre del proyecto y la ruta
            const baseUrl = window.location.origin;
            apiPathDisplay.textContent = `${baseUrl}/${projectName}/${route}`;
        }
        
        // Cargar el contenido del endpoint
        viewEndpointContent(projectName, route, true);
        
        // Habilitar el botón de publicación y cambiar su texto a "Actualizar Punta"
        const publishButton = document.querySelector('button.btn.btn-dark');
        if (publishButton) {
            publishButton.removeAttribute('disabled');
            publishButton.textContent = 'Actualizar Punta';
        }
        
        // Mostrar mensaje
        showMessage(`Endpoint ${method} /${projectName}/${route} cargado correctamente`);
        

        fetch(`/api/${projectName}/${route}_${method}.json`)
            .then(response => {
                if (!response.ok) {
                    return fetch(`/api/${projectName}/${route}.json`);
                }
                return response;
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`No se encontró el endpoint ${projectName}/${route}`);
                }
                return response.json();
            })
            .then(data => {
                if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
                    contentRequestDiv.querySelector('.col-xl-10').innerHTML = '';

                    const titleElement = document.createElement('h4');
                    titleElement.textContent = `Endpoint ${method} /${projectName}/${route}`;
                    titleElement.className = 'mb-3';

                    const preElement = document.createElement('pre');
                    preElement.className = 'bg-light p-3 rounded';
                    preElement.style.maxHeight = '400px';
                    preElement.style.overflow = 'auto';
                    preElement.textContent = JSON.stringify(data.content, null, 2);

                    contentRequestDiv.querySelector('.col-xl-10').appendChild(titleElement);
                    contentRequestDiv.querySelector('.col-xl-10').appendChild(preElement);

                    const jsonContent = data.content;
                    if (Array.isArray(jsonContent) && jsonContent.length > 0 && typeof jsonContent[0] === 'object') {
                        const keys = Object.keys(jsonContent[0]);
                        
                        if (keys.length > 0) {
                            const filterExamplesContainer = document.createElement('div');
                            filterExamplesContainer.className = 'filter-examples mt-3';
                            
        
                            const filterTitleElement = document.createElement('h5');
                            filterTitleElement.textContent = 'Ejemplos de filtros:';
                            filterExamplesContainer.appendChild(filterTitleElement);
                            
                         
                            const exampleKeys = keys.slice(0, 2);
                            
                            // Crear ejemplos de filtros
                            exampleKeys.forEach(key => {
                                const exampleElement = document.createElement('div');
                                exampleElement.className = 'filter-example mb-2';
                                
                                const baseUrl = window.location.origin;
                                const exampleUrl = `${baseUrl}/${projectName}/${route}?${key}=valor`;
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
                            contentRequestDiv.querySelector('.col-xl-10').appendChild(filterExamplesContainer);
                        }
                    }
                    
                    // Agregar botón para volver a la lista
                    const backButton = document.createElement('button');
                    backButton.className = 'btn btn-secondary mt-3';
                    backButton.textContent = 'Volver a la lista';
                    backButton.addEventListener('click', () => searchEndpoints());
                    contentRequestDiv.querySelector('.col-xl-10').appendChild(backButton);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage(`Error al obtener el contenido del endpoint: ${error.message}`, true);
            });
    }
    
    // Función para ver el contenido de un endpoint
    function viewEndpointContent(projectName, route, loadToEditor = false) {
        // Realizar petición AJAX para obtener el contenido del endpoint
        // El projectName ya viene normalizado de la función searchEndpoints
        
        // Primero intentar con el formato específico del método (GET, POST, etc.)
        // Obtener el método seleccionado actualmente
        const methodSelect = document.querySelector('.form-select');
        const selectedMethod = methodSelect ? methodSelect.value : 'GET';
        
        // Intentar primero con el archivo específico del método
        fetch(`/api/${projectName}/${route}_${selectedMethod}.json`)
            .then(response => {
                if (!response.ok) {
                    // Si no se encuentra, intentar con el formato genérico
                    return fetch(`/api/${projectName}/${route}.json`);
                }
                return response;
            })
            .then(response => {
                if (!response.ok) {
                    // Proporcionar un mensaje de error más descriptivo basado en el código de estado
                    const errorMsg = response.status === 404 
                        ? `No se encontró el endpoint ${projectName}/${route}` 
                        : `Error al obtener el contenido del endpoint (${response.status})`;
                    throw new Error(errorMsg);
                }
                return response.json();
            })
            .then(data => {
                // Si se debe cargar al editor
                if (loadToEditor) {
                    // Intentar obtener el editor CodeMirror de manera más segura
                    try {
                        // Obtener el editor CodeMirror
                        const cmElement = document.querySelector('.CodeMirror');
                        if (cmElement && cmElement.CodeMirror) {
                            // Formatear el JSON y establecerlo en el editor
                            cmElement.CodeMirror.setValue(JSON.stringify(data.content, null, 2));
                        } else {
                            // Si no hay editor, usar el textarea
                            const textarea = document.querySelector('textarea.form-control');
                            if (textarea) {
                                textarea.value = JSON.stringify(data.content, null, 2);
                            }
                        }
                    } catch (error) {
                        console.error('Error al acceder al editor CodeMirror:', error);
                        // Usar el textarea como fallback
                        const textarea = document.querySelector('textarea.form-control');
                        if (textarea) {
                            textarea.value = JSON.stringify(data.content, null, 2);
                        }
                    }
                    
                    // Actualizar la URL mostrada en el elemento pathApi
                    const apiPathDisplay = document.getElementById('pathApi');
                    if (apiPathDisplay) {
                        // Construir la URL completa con el nombre del proyecto y la ruta
                        const baseUrl = window.location.origin;
                        apiPathDisplay.textContent = `${baseUrl}/${projectName}/${route}`;
                    }
                } else {
                    // Mostrar el contenido en el área de información
                    if (contentRequestDiv && contentRequestDiv.querySelector('.col-xl-10')) {
                        // Limpiar contenido anterior
                        contentRequestDiv.querySelector('.col-xl-10').innerHTML = '';
                        
                        // Crear título
                        const titleElement = document.createElement('h4');
                        titleElement.textContent = `Contenido de ${data.method} /${projectName}/${route}`;
                        titleElement.className = 'mb-3';
                        
                        // Crear elemento para mostrar el JSON
                        const preElement = document.createElement('pre');
                        preElement.className = 'bg-light p-3 rounded';
                        preElement.style.maxHeight = '400px';
                        preElement.style.overflow = 'auto';
                        preElement.textContent = JSON.stringify(data.content, null, 2);
                        
                        // Agregar elementos al contenedor
                        contentRequestDiv.querySelector('.col-xl-10').appendChild(titleElement);
                        contentRequestDiv.querySelector('.col-xl-10').appendChild(preElement);
                        
                        // Analizar el JSON para mostrar opciones de filtrado
                        const jsonContent = data.content;
                        if (Array.isArray(jsonContent) && jsonContent.length > 0 && typeof jsonContent[0] === 'object') {
                            // Extraer las claves del primer objeto del array
                            const keys = Object.keys(jsonContent[0]);
                            
                            if (keys.length > 0) {
                                // Crear contenedor para ejemplos de filtros
                                const filterExamplesContainer = document.createElement('div');
                                filterExamplesContainer.className = 'filter-examples mt-3';
                                
                                // Crear título para los ejemplos
                                const filterTitleElement = document.createElement('h5');
                                filterTitleElement.textContent = 'Ejemplos de filtros:';
                                filterExamplesContainer.appendChild(filterTitleElement);
                                
                                // Seleccionar hasta 2 claves para los ejemplos
                                const exampleKeys = keys.slice(0, 2);
                                
                                // Crear ejemplos de filtros
                                exampleKeys.forEach(key => {
                                    const exampleElement = document.createElement('div');
                                    exampleElement.className = 'filter-example mb-2';
                                    
                                    const baseUrl = window.location.origin;
                                    const exampleUrl = `${baseUrl}/${projectName}/${route}?${key}=valor`;
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
                                contentRequestDiv.querySelector('.col-xl-10').appendChild(filterExamplesContainer);
                            }
                        }
                        
                        // Agregar botón para volver a la lista
                        const backButton = document.createElement('button');
                        backButton.className = 'btn btn-secondary mt-3';
                        backButton.textContent = 'Volver a la lista';
                        backButton.addEventListener('click', () => searchEndpoints());
                        contentRequestDiv.querySelector('.col-xl-10').appendChild(backButton);
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Mostrar un mensaje de error más descriptivo
                showMessage(`Error al obtener el contenido del endpoint: ${error.message}`, true);
            });
    }
    
    // Función para eliminar un endpoint
    function deleteEndpoint(projectName, route, method) {
        // Mostrar confirmación antes de eliminar
        if (!confirm(`¿Está seguro que desea eliminar el endpoint ${route} del proyecto ${projectName}?`)) {
            return;
        }
        
        // Mostrar mensaje de carga
        showMessage('Eliminando endpoint...');
        
        // Realizar petición DELETE para eliminar el endpoint
        // El projectName ya viene normalizado de la función searchEndpoints
        fetch(`/api/delete-endpoint.php?project=${encodeURIComponent(projectName)}&route=${encodeURIComponent(route)}&method=${encodeURIComponent(method)}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'No se pudo eliminar el endpoint');
                });
            }
            return response.json();
        })
        .then(data => {
            // Mostrar mensaje de éxito
            showMessage(data.message || 'Endpoint eliminado correctamente');
            
            // Actualizar la lista de endpoints
            searchEndpoints();
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage(`Error al eliminar el endpoint: ${error.message}`, true);
        });
    }
    
    // Función para actualizar el código de estado HTTP de un endpoint
    function updateEndpointStatusCode(projectName, route, statusCode, errorMessage = null) {
        // Comprobar si es un código de error (4xx o 5xx)
        const isErrorCode = statusCode >= 400;
        
        // Si es un código de error, solicitar mensaje personalizado si no se proporcionó
        if (isErrorCode && errorMessage === null) {
            // Obtener el mensaje del input de texto en el selector de código
            const jsonInput = document.getElementById('jsonInputCodeResponse');
            if (jsonInput && jsonInput.value.trim() !== '') {
                errorMessage = jsonInput.value.trim();
            }
        }
        
        // Mostrar indicador de carga
        showMessage(`Actualizando código de estado a ${statusCode}...`);
        
        // Llamar al método del StatusCodeManager para actualizar el código
        window.statusCodeManager.updateEndpointStatusCode(projectName, route, statusCode, errorMessage)
            .then(data => {
                // Mensaje de éxito con SweetAlert2
                let mensaje = `El código de estado del endpoint ${route} ha sido actualizado a ${statusCode} (${window.statusCodeManager.getStatusCodeText(statusCode)})`;
                
                // Si hay un mensaje de error personalizado, mostrarlo
                if (data.error_message) {
                    mensaje += `<br><br><strong>Mensaje personalizado:</strong> <pre style="text-align: left; margin-top: 10px;">${JSON.stringify(data.error_message, null, 2)}</pre>`;
                }
                
                swal.fire({
                    title: 'Código de estado actualizado',
                    html: mensaje,
                    icon: 'success',
                })
                
                // Volver a cargar la lista de endpoints
                $('#searchProjectEndpoints').click();
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage(`Error al actualizar el código de estado: ${error.message}`, true);
            });
    }
    
    // Función para normalizar el nombre del proyecto (reemplazar espacios por guiones)
    function normalizeProjectName(name) {
        // Reemplazar espacios por guiones y eliminar caracteres especiales
        return name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    }
    
    // Función para buscar endpoints
    function searchEndpoints() {
        let projectName = projectNameInput.value.trim();
        
        if (!projectName) {
            showMessage('Por favor, ingrese un nombre de proyecto', true);
            return;
        }
        
        // Normalizar el nombre del proyecto (convertir espacios a guiones)
        const normalizedProjectName = normalizeProjectName(projectName);
        
        // Mostrar mensaje de carga
        showMessage('Buscando endpoints...');
        
        // Realizar petición AJAX para obtener los endpoints
        fetch(`/api/list-endpoints.php?project=${encodeURIComponent(normalizedProjectName)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No se pudo obtener la lista de endpoints');
                }
                return response.json();
            })
            .then(data => {
                // Mostrar los endpoints encontrados con el nombre normalizado
                displayEndpoints(normalizedProjectName, data.endpoints);
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Error al buscar endpoints. Asegúrese de que el proyecto existe.', true);
            });
    }
    
    // Agregar event listener al botón de búsqueda
    if (searchButton) {
        searchButton.addEventListener('click', searchEndpoints);
    }
    
    // También permitir búsqueda al presionar Enter en el campo de nombre de proyecto
    if (projectNameInput) {
        projectNameInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' && searchButton) {
                event.preventDefault();
                searchButton.click();
            }
        });
    }
});

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
        container.className = 'd-flex align-items-center gap-2 flex-wrap';
        
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
        const jsonInputWrapper = document.createElement('div');
        jsonInputWrapper.className = 'mt-1 w-100';
        jsonInputWrapper.style.display = parseInt(select.value) >= 400 ? 'block' : 'none';
        
        const jsonInput = document.createElement('input');
        jsonInput.type = 'text';
        jsonInput.className = 'form-control form-control-sm';
        jsonInput.placeholder = 'Mensaje JSON para código de error (ej: {"error":"Acceso denegado"})';
        jsonInput.title = 'Ingrese un mensaje JSON personalizado para este código de error';
        jsonInput.id = 'jsonInputCodeResponse';
        
        // Botón para aplicar el cambio
        const applyButton = document.createElement('button');
        applyButton.className = 'btn btn-sm btn-primary mt-1';
        applyButton.textContent = 'Aplicar';
        applyButton.style.display = 'none';
        
        jsonInputWrapper.appendChild(jsonInput);
        jsonInputWrapper.appendChild(applyButton);
        
        // Agregar evento de cambio si se proporciona una función
        if (onChange && typeof onChange === 'function') {
            select.addEventListener('change', (e) => {
                const code = parseInt(e.target.value);
                jsonInputWrapper.style.display = code >= 400 ? 'block' : 'none';
                applyButton.style.display = 'none';
                
                // Si no es un código de error, aplicar cambio inmediatamente
                if (code < 400) {
                    onChange(code, null);
                }
            });
            
            jsonInput.addEventListener('input', () => {
                // Mostrar el botón de aplicar cuando se escribe algo
                applyButton.style.display = 'inline-block';
            });
            
            applyButton.addEventListener('click', () => {
                const code = parseInt(select.value);
                onChange(code, jsonInput.value);
            });
        }
        
        container.appendChild(select);
        container.appendChild(jsonInputWrapper);
        
        return container;
    }

    /**
     * Actualiza el código de estado HTTP de un endpoint
     * @param {string} projectName - Nombre del proyecto
     * @param {string} route - Ruta del endpoint
     * @param {number} statusCode - Nuevo código de estado HTTP
     * @param {string} errorMessage - Mensaje de error personalizado (opcional)
     * @returns {Promise} - Promesa que se resuelve cuando se actualiza el código
     */
    updateEndpointStatusCode(projectName, route, statusCode, errorMessage = null) {
        // Validar y formatear el mensaje de error si existe
        let formattedErrorMessage = null;
        if (errorMessage) {
            try {
                // Intentar parsear como JSON
                formattedErrorMessage = JSON.parse(errorMessage);
            } catch (e) {
                // Si no es JSON válido, crear un objeto simple
                formattedErrorMessage = { "message": errorMessage };
            }
        }
        
        return fetch('api-handler.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectName: projectName,
                route: route,
                statusCode: statusCode,
                errorMessage: formattedErrorMessage ? JSON.stringify(formattedErrorMessage) : null
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