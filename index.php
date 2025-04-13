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
    $endpointFile = $apiDir . '/' . $projectName . '/' . $route . '.json';
    
    if (file_exists($endpointFile)) {
        // Es una solicitud de API, incluir el router
        include 'router.php';
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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/default.min.css">
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
            <div class="container"><a class="navbar-brand d-flex align-items-center" href="#"><span class="bs-icon-sm bs-icon-rounded bs-icon-primary d-flex justify-content-center align-items-center me-2 bs-icon" style="background: var(--bs-black);"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="bi bi-code">
                            <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"></path>
                        </svg></span><span>ZONNE</span></a></div>
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
    <script src="assets/js/jquery.min.js"></script>
    <script src="assets/bootstrap/js/bootstrap.min.js"></script>
    <script src="assets/js/api-url-manager.js"></script>
    <script src="assets/js/form-validator.js"></script>
    <script src="assets/js/clipboard.js"></script>
    <script src="assets/js/filter-manager.js"></script>
    <script src="assets/js/endpoint-manager.js"></script>
    <script src="assets/js/project-search.js"></script>
</body>

</html>