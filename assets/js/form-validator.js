document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del formulario
    const projectNameInput = document.querySelector('input[placeholder="Nombre del Proyecto"]');
    const routeInput = document.querySelector('.input-group input.form-control:not([placeholder])');
    const contentTextarea = document.querySelector('textarea.form-control');
    const submitButton = document.querySelector('button.btn.btn-dark');
    let codeMirrorEditor = null;
    
    // Función para validar si los campos requeridos tienen contenido
    function validateForm() {
        const hasProjectName = projectNameInput.value.trim() !== '';
        const hasRoute = routeInput.value.trim() !== '';
        
        // Verificar contenido del editor CodeMirror si está disponible, o del textarea si no
        let hasContent = false;
        if (codeMirrorEditor) {
            hasContent = codeMirrorEditor.getValue().trim() !== '';
        } else {
            hasContent = contentTextarea.value.trim() !== '';
        }
        
        // Habilitar o deshabilitar el botón según si el nombre del proyecto y la ruta tienen contenido
        if (hasProjectName && hasRoute) {
            submitButton.removeAttribute('disabled');
        } else {
            submitButton.setAttribute('disabled', 'disabled');
        }
    }
    
    // Agregar event listeners a los campos para validar en tiempo real
    projectNameInput.addEventListener('input', validateForm);
    routeInput.addEventListener('input', validateForm);
    contentTextarea.addEventListener('input', validateForm);
    
    // Esperar a que CodeMirror se inicialice (se hace en json-editor.js)
    const checkForCodeMirror = setInterval(function() {
        const cmElement = document.querySelector('.CodeMirror');
        if (cmElement && cmElement.CodeMirror) {
            codeMirrorEditor = cmElement.CodeMirror;
            
            // Agregar listener al editor CodeMirror
            codeMirrorEditor.on('change', validateForm);
            
            // Validar con el contenido actual del editor
            validateForm();
            
            // Limpiar el intervalo una vez que encontramos el editor
            clearInterval(checkForCodeMirror);
        }
    }, 500);
    
    // Ejecutar la validación inicial para establecer el estado correcto del botón
    validateForm();

});