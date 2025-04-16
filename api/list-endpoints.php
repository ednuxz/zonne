<?php
// Configuración de encabezados para permitir CORS y JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Verificar que sea una solicitud GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Verificar que se haya proporcionado el parámetro 'project'
if (!isset($_GET['project']) || empty($_GET['project'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Se requiere el parámetro "project"']);
    exit;
}

// Obtener el nombre del proyecto
$projectName = trim($_GET['project']);

// Directorio donde se almacenan los endpoints
$apiDir = __DIR__;
$projectDir = $apiDir . '/' . $projectName;

// Verificar si el directorio del proyecto existe
if (!file_exists($projectDir) || !is_dir($projectDir)) {
    // Devolver un array vacío si el proyecto no existe
    echo json_encode(['endpoints' => []]);
    exit;
}

// Obtener todos los archivos JSON en el directorio del proyecto
$endpoints = [];
$files = glob($projectDir . '/*.json');

// Registrar para depuración
error_log("Archivos encontrados en $projectDir: " . implode(", ", $files));

// Procesar cada archivo para extraer información del endpoint
foreach ($files as $file) {
    // Obtener el nombre del archivo sin extensión
    $filename = basename($file, '.json');
    
    // Verificar si el nombre del archivo tiene un sufijo de método HTTP (_GET, _POST, etc.)
    $routeName = $filename;
    $methodFromFilename = null;
    
    if (preg_match('/(.*?)_(GET|POST|PUT|DELETE)$/', $filename, $matches)) {
        $routeName = $matches[1]; // Nombre de la ruta sin el sufijo del método
        $methodFromFilename = $matches[2]; // Método HTTP extraído del nombre del archivo
    }
    
    // Leer el contenido del archivo
    $content = file_get_contents($file);
    $endpointData = json_decode($content, true);
    
    // Verificar que se pudo decodificar correctamente
    if ($endpointData && isset($endpointData['method'])) {
        // Si el método está en el nombre del archivo, asegurarse de que coincida con el del contenido
        // o usar el del nombre del archivo si es más específico
        $method = $methodFromFilename ?: $endpointData['method'];
        
        $endpoints[] = [
            'route' => $routeName,
            'method' => $method,
            'status_code' => isset($endpointData['status_code']) ? $endpointData['status_code'] : 200,
            'url' => getEndpointUrl($projectName, $routeName)
        ];
    }
    
    // Registrar para depuración
    error_log("Endpoint procesado: Ruta=$routeName, Método=$method, Archivo=" . basename($file));
}

// Función para obtener la URL del endpoint
function getEndpointUrl($projectName, $route) {
    $baseUrl = getBaseUrl();
    return "$baseUrl/$projectName/$route";
}

// Función para obtener la URL base
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    return "$protocol://$host";
}

// Devolver la lista de endpoints
echo json_encode(['endpoints' => $endpoints]);