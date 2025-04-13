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

foreach ($files as $file) {
    // Obtener el nombre del archivo sin la extensión
    $route = basename($file, '.json');
    
    // Leer el contenido del archivo
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    
    // Verificar que el archivo tenga el formato correcto
    if (isset($data['method'])) {
        $endpoints[] = [
            'route' => $route,
            'method' => $data['method']
        ];
    }
}

// Devolver la lista de endpoints
echo json_encode(['endpoints' => $endpoints]);