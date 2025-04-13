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
        titleElement.textContent = `Endpoints del proyecto "${projectName}"`;
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
                deleteButton.addEventListener('click', () => deleteEndpoint(projectName, endpoint.route));
                
                // Agregar botones a la celda de acciones
                actionsCell.appendChild(loadButton);
                actionsCell.appendChild(viewButton);
                actionsCell.appendChild(deleteButton);
                
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
    }
    
    // Función para ver el contenido de un endpoint
    function viewEndpointContent(projectName, route, loadToEditor = false) {
        // Realizar petición AJAX para obtener el contenido del endpoint
        // El projectName ya viene normalizado de la función searchEndpoints
        fetch(`/api/${projectName}/${route}.json`)
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
    function deleteEndpoint(projectName, route) {
        // Mostrar confirmación antes de eliminar
        if (!confirm(`¿Está seguro que desea eliminar el endpoint ${route} del proyecto ${projectName}?`)) {
            return;
        }
        
        // Mostrar mensaje de carga
        showMessage('Eliminando endpoint...');
        
        // Realizar petición DELETE para eliminar el endpoint
        // El projectName ya viene normalizado de la función searchEndpoints
        fetch(`/api/delete-endpoint.php?project=${encodeURIComponent(projectName)}&route=${encodeURIComponent(route)}`, {
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