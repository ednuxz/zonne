document.addEventListener('DOMContentLoaded', function() {
    const projectNameInput = document.querySelector('input[placeholder="Nombre del Proyecto"]');
    const routeInput = document.querySelector('.input-group input.form-control:not([placeholder])');
    const apiUrlDisplay = document.querySelector('.form-text[style="font-size: 17px;"]');

    function getBaseUrl() {
        const currentUrl = window.location;
        // Usar currentUrl.host que ya incluye el puerto si no es el estándar
        // Esto evita duplicar el puerto en la URL
        return `${currentUrl.protocol}//${currentUrl.host}`;
    }

    function formatProjectName(name) {
        return name
            .toLowerCase()
            .replace(/[0-9]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function validateRoute(route) {
        if (!route) return '';
        // Permitir letras y guiones medios, manteniendo los guiones entre letras
        let validRoute = route
            .toLowerCase()
            // Permitir solo letras minúsculas y guiones
            .replace(/[^a-z\-]/g, '')
            // Reemplazar múltiples guiones consecutivos por uno solo
            .replace(/-{2,}/g, '-');
            
        // No eliminar guiones al inicio o final para permitir rutas con guiones
        return validRoute;
    }

    function updateApiUrl() {
        const baseUrl = getBaseUrl();
        const projectName = formatProjectName(projectNameInput.value);
        const route = validateRoute(routeInput.value);
        
        // Construir la URL sin barras adicionales cuando los campos están vacíos
        let apiUrl = baseUrl;
        if (projectName) {
            apiUrl += '/' + projectName;
            if (route) {
                apiUrl += '/' + route;
            }
        }
        
        apiUrlDisplay.textContent = apiUrl;
    }

    projectNameInput.addEventListener('input', updateApiUrl);
    routeInput.addEventListener('input', function(e) {
        // No validar el valor durante la entrada para permitir guiones
        updateApiUrl();
    });

    // Inicializar la URL
    updateApiUrl();
});