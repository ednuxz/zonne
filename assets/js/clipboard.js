/**
 * Función para copiar al portapapeles el contenido del elemento con id 'pathApi'
 */
function copyToClipboard() {
    // Obtener el texto del elemento pathApi usando jQuery
    const textToCopy = $('#pathApi').text();
    
    // Crear un elemento temporal para realizar la copia
    const tempElement = document.createElement('textarea');
    tempElement.value = textToCopy;
    document.body.appendChild(tempElement);
    
    // Seleccionar y copiar el texto
    tempElement.select();
    document.execCommand('copy');
    
    // Eliminar el elemento temporal
    document.body.removeChild(tempElement);
    
    // Opcional: Mostrar una notificación de éxito
    Swal.fire({
      title: 'URL copiada al portapapeles',
      text: textToCopy,
      icon: 'success'
    });
}