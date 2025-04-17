<?php
// Verificar si la solicitud es para un endpoint de API
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($uri, '/'));

// Si tenemos al menos 2 segmentos, podría ser una solicitud de API
if (count($segments) >= 2) {
    // Verificar si existe el directorio del proyecto y el archivo del endpoint
    $projectName = $segments[0];
    $route = $segments[1];
    $apiDir = __DIR__ . '/api';
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Verificar primero si existe un archivo específico para el método (ruta_MÉTODO.json)
    $methodSpecificFile = $apiDir . '/' . $projectName . '/' . $route . '_' . $method . '.json';
    $genericFile = $apiDir . '/' . $projectName . '/' . $route . '.json';
    
    // Registrar para depuración
    error_log("Buscando archivos: Específico=$methodSpecificFile, Genérico=$genericFile");
    
    if (file_exists($methodSpecificFile) || file_exists($genericFile)) {
        // Es una solicitud de API, incluir el router
        include 'router.php';
        exit;
    } else if ($method !== 'GET') {
        // Si es un método distinto a GET y no existe el endpoint, devolver un error JSON
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint no encontrado', 'project' => $projectName, 'route' => $route]);
        exit;
    }
}

// Si no es una solicitud de API y no estamos ya en la raíz, redirigir a la página principal
if ($uri !== '/' && $uri !== '') {
    header('Location: /');
    exit;
}
?>
<!DOCTYPE html>
<!-- Resto del código HTML -->
<html data-bs-theme="light" lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Crea tu Api en Segundos</title>
    <link rel="canonical" href="https://zonne.com/">
    <meta property="og:url" content="https://zonne.com/">
    <meta name="description" content="Todo para tu prototipo, en segundos crea Apis funcionales">
    <script type="application/ld+json">
        {
            "@context": "http://schema.org",
            "@type": "WebSite",
            "name": "ZONNE",
            "url": "https://zonne.com"
        }
    </script>
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/Navbar-With-Button-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/edit/matchbrackets.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/edit/closebrackets.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/fold/foldgutter.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/fold/foldcode.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/fold/brace-fold.min.js"></script>
    <script src="assets/js/json-editor.js"></script>
</head>

<body>
    <div class="container">
        <nav class="navbar navbar-expand-md bg-body py-3" style="margin-top: 19px;">
            <div class="container"><a class="navbar-brand d-flex align-items-center" href="/"><span class="bs-icon-sm bs-icon-rounded bs-icon-primary d-flex justify-content-center align-items-center me-2 bs-icon" style="background: var(--bs-black);"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="bi bi-code">
                            <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"></path>
                        </svg></span><span>ZONNE</span></a></div>
            <p><a href="#" style="margin-top: 5px" data-bs-toggle="modal" data-bs-target="#myModal">Documentacion</a></p>
        </nav>
    </div>
    <div class="container">
        <div class="row">
            <div class="col-lg-6 col-xl-4">
                <div class="input-group">
                    <input class="form-control" type="text" placeholder="Nombre del Proyecto" style="margin-top: 23px;height: 48px;" pattern="[A-Za-z\s]+" title="Solo se permiten letras y espacios">
                    <button class="btn btn-outline-primary" type="button" id="searchProjectEndpoints" style="margin-top: 23px;height: 48px;" title="Buscar endpoints existentes">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                        </svg>
                    </button>
                </div>
                <form style="margin-top: 27px;">
                    <div class="input-group" style="margin-bottom: 14px;"><span class="input-group-text">
                        <select class="form-select">
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                            </select></span>
                            <input class="form-control" type="text" pattern="[A-Za-z]+(-[A-Za-z]+)*" title="Solo se permiten letras y guiones medios entre letras">
                    </div>
                            <small>Contenido al hacer la peticion</small>
                            <br>
                            <small class="form-text">Puedes escribirlo en el editor o bien arrastrar un archivo json sobre el editor.</small>
                            <br>
                    <div class="input-group">
                        <textarea class="form-control" style="margin-top: 8px;height: 35rem;"></textarea>
                </div>
                </form>
                <div class="d-xl-flex justify-content-xl-end" style="margin-top: 18px;">
                    
                <button class="btn btn-dark" type="button" style="width: 100%;height: 43px;" id="publishEndpoint">Publicar Punta</button>
            
            </div>
            </div>
            <div class="col-lg-6 col-xl-8">
                <h3 style="padding-top: 35px;text-align: center;">Información del Api /&gt;</h3>
                <div style="text-align: center;padding-top: 14px;">
                    <div>
                        <small id="pathApi" class="form-text" style="font-size: 17px;">http://api.zoneapi.cloud/{nombreproyecto}/{ruta}</small>
                        <button class="btn btn-outline-secondary btn-sm" onclick="copyToClipboard()" title="Copiar al portapapeles"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                        </svg></button>
                    </div>
                </div>
        
                <div class="row d-xl-flex justify-content-xl-center" id="contenido-request" style="margin-top: 53px;height: 35rem;">
                    <div class="col-xl-10" style="margin-bottom: 14px;padding-bottom: 9px;height: auto;margin-top: 16px;">
                        
                    </div>
                </div>
            </div>
        </div>
    </div>


    <div class="modal fade" id="myModal" tabindex="-1" aria-labelledby="myModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="myModalLabel">Documentación del Método GET en ZONNE</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>ZONNE ofrece un método <strong>GET</strong> enriquecido con numerosas funciones que
                        facilitan la consulta, filtrado y presentación de datos.</p>
                    <p><strong>Base URL:</strong> <code>https://api.zoneapi.cloud/proyecto/endpoint</code></p>
                    <hr>
                    <h6>Características:</h6>
                    <ul>
                        <li>
                            <strong>Filtrado Básico:</strong> Filtra resultados pasando parámetros directamente
                            en la URL.
                            <ul>
                                <li><code>?id=5</code>: Obtener elemento con id=5.</li>
                                <li><code>?precio=100&nombre=Laptop</code>: Filtrar elementos con precio=100 y
                                    nombre=Laptop.
                                </li>
                            </ul>
                        </li>
                        <li>
                            <strong>Filtrado en Propiedades Anidadas:</strong> Accede a propiedades dentro de objetos usando notación de punto.
                            <ul>
                                <li><code>?user.name=John</code>: Filtrar elementos donde user.name sea igual a "John".</li>
                                <li><code>?spot.trick_name=360 Flip</code>: Filtrar elementos donde spot.trick_name sea igual a "360 Flip".</li>
                                <li><code>?filter[user.id]=1&operator[user.id]=eq</code>: Filtrar elementos donde user.id sea igual a 1.</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Filtrado Avanzado:</strong> Utiliza operadores para consultas más complejas.
                            <ul>
                                <li><code>?filter[precio]=100&operator[precio]=gt</code>: Productos con precio
                                    mayor a 100.
                                </li>
                                <li><code>?filter[nombre]=mac&operator[nombre]=contains</code>: Productos cuyo
                                    nombre contenga 'mac'.
                                </li>
                                <li><code>?filter[categoria]=1,2,3&operator[categoria]=in</code>: Productos en
                                    las categorías 1, 2 o 3.
                                </li>
                            </ul>
                            <small><strong>Operadores:</strong> eq, neq, gt, gte, lt, lte, contains, startswith,
                                endswith, in.</small>
                        </li>
                        <li>
                            <strong>Paginación:</strong> Divide grandes conjuntos de datos en páginas
                            manejables.
                            <ul>
                                <li><code>?page=1&limit=10</code>: Primera página con 10 elementos por página.
                                </li>
                                <li><code>?page=2&limit=25</code>: Segunda página con 25 elementos por página.
                                </li>
                            </ul>
                        </li>
                        <li>
                            <strong>Ordenamiento:</strong> Ordena los resultados por un campo específico.
                            <ul>
                                <li><code>?sort=precio</code>: Ordenar por precio (ascendente por defecto).</li>
                                <li><code>?sort=nombre&direction=desc</code>: Ordenar por nombre descendente.
                                </li>
                            </ul>
                        </li>
                        <li>
                            <strong>Selección de Campos:</strong> Solicita solo los campos específicos que
                            necesitas.
                            <ul>
                                <li><code>?fields=id,nombre,precio</code>: Devuelve solo los campos id, nombre y
                                    precio.
                                </li>
                            </ul>
                        </li>
                        <li>
                            <strong>Búsqueda de Texto:</strong> Busca términos en campos específicos.
                            <ul>
                                <li><code>?search=smartphone&search_fields=nombre,descripcion</code>: Busca
                                    'smartphone' en los campos nombre y descripción.
                                </li>
                            </ul>
                        </li>
                        <li>
                            <strong>Formatos de Respuesta:</strong> Obtén los datos en diferentes formatos.
                            <ul>
                                <li><code>?format=json</code>: Formato JSON (predeterminado).</li>
                                <li><code>?format=xml</code>: Formato XML.</li>
                                <li><code>?format=csv</code>: Formato CSV (descarga).</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Combinación de Características:</strong> Todas las características se pueden
                            combinar para consultas poderosas.
                            <ul>
                                <li><code>?filter[precio]=50&operator[precio]=gt&sort=precio&page=1&limit=10&fields=id,nombre,precio&format=json</code>:
                                    Productos con precio > 50, ordenados por precio, primera página con 10
                                    elementos, mostrando id, nombre y precio en formato JSON.
                                </li>
                            </ul>
                        </li>
                        <li>
                            <strong>Información del Esquema:</strong> Obtiene información sobre la estructura de
                            los datos.
                            <ul>
                                <li><code>?_schema=true</code>: Muestra la estructura del endpoint con tipos de
                                    datos.
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>


    <script src="assets/js/jquery.min.js"></script>
    <script src="assets/bootstrap/js/bootstrap.min.js"></script>
    <script src="assets/js/api-url-manager.js"></script>
    <script src="assets/js/form-validator.js"></script>
    <script src="assets/js/clipboard.js"></script>
    <script src="assets/js/filter-manager.js"></script>
    <script src="assets/js/status-code-manager.js"></script>
    <script src="assets/js/endpoint-manager.js"></script>
    <script src="assets/js/project-search.js"></script>
</body>

</html>