<?php
// Configuración de encabezados para permitir CORS y JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Manejar solicitudes OPTIONS (preflight requests)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar que sea una solicitud DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Verificar que se hayan proporcionado los parámetros necesarios
if (!isset($_GET['project']) || empty($_GET['project']) || !isset($_GET['route']) || empty($_GET['route'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Se requieren los parámetros "project" y "route"']);
    exit;
}

// Obtener los parámetros
$projectName = trim($_GET['project']);
$route = trim($_GET['route']);

// Directorio donde se almacenan los endpoints
$apiDir = __DIR__;
$projectDir = $apiDir . '/' . $projectName;
$endpointFile = $projectDir . '/' . $route . '.json';

// Verificar si el archivo existe
if (!file_exists($endpointFile)) {
    http_response_code(404); // Not Found
    echo json_encode(['error' => 'El endpoint no existe']);
    exit;
}

// Intentar eliminar el archivo
if (unlink($endpointFile)) {
    // Verificar si el directorio del proyecto está vacío (excepto por archivos ocultos)
    $files = array_filter(scandir($projectDir), function($item) {
        return !in_array($item, ['.', '..']) && !str_starts_with($item, '.');
    });
    
    // Si no hay más archivos, eliminar el directorio del proyecto
    if (empty($files)) {
        rmdir($projectDir);
    }
    
    // Devolver respuesta exitosa
    echo json_encode(['success' => true, 'message' => 'Endpoint eliminado correctamente']);
} else {
    // Error al eliminar el archivo
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'No se pudo eliminar el endpoint']);
}