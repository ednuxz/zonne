<?php
// Configuración de encabezados para permitir CORS y JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Directorio donde se almacenarán los endpoints
$apiDir = __DIR__ . '/api';

// Crear el directorio si no existe
if (!file_exists($apiDir)) {
    mkdir($apiDir, 0777, true);
}

// Función para crear un nuevo endpoint
function createEndpoint($projectName, $route, $method, $content) {
    global $apiDir;
    
    // Sanitizar nombres de proyecto y ruta
    $projectName = preg_replace('/[^a-z0-9\-]/', '', strtolower(str_replace(' ', '-', $projectName)));
    $route = preg_replace('/[^a-z0-9\-]/', '', strtolower($route));
    
    // Validar que tengamos datos válidos
    if (empty($projectName) || empty($route) || empty($method)) {
        return ['success' => false, 'message' => 'Faltan datos requeridos'];
    }
    
    // Crear directorio del proyecto si no existe
    $projectDir = $apiDir . '/' . $projectName;
    if (!file_exists($projectDir)) {
        mkdir($projectDir, 0777, true);
    }
    
    // Crear archivo para el endpoint
    $endpointFile = $projectDir . '/' . $route . '.json';
    $endpointData = [
        'method' => $method,
        'content' => json_decode($content, true),
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    // Guardar el archivo
    if (file_put_contents($endpointFile, json_encode($endpointData, JSON_PRETTY_PRINT))) {
        return [
            'success' => true, 
            'message' => 'Endpoint creado correctamente',
            'url' => getEndpointUrl($projectName, $route)
        ];
    } else {
        return ['success' => false, 'message' => 'Error al crear el endpoint'];
    }
}

// Función para obtener la URL del endpoint
function getEndpointUrl($projectName, $route) {
    $baseUrl = getBaseUrl();
    return "$baseUrl/$projectName/$route";
}

// Función para obtener la URL base
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    
    // Usar HTTP_HOST sin añadir el puerto manualmente, ya que HTTP_HOST ya incluye el puerto si no es estándar
    $host = $_SERVER['HTTP_HOST'];
    
    // HTTP_HOST ya incluye el puerto si no es estándar (80 para HTTP, 443 para HTTPS)
    return "$protocol://$host";
}

// Procesar la solicitud según el método HTTP
$requestMethod = $_SERVER['REQUEST_METHOD'];

switch ($requestMethod) {
    case 'POST':
        // Crear un nuevo endpoint
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
            exit;
        }
        
        $result = createEndpoint(
            $data['projectName'] ?? '', 
            $data['route'] ?? '', 
            $data['method'] ?? 'GET', 
            $data['content'] ?? '{}'
        );
        
        echo json_encode($result);
        break;
        
    case 'GET':
        // Verificar si estamos consultando un endpoint específico
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $segments = explode('/', trim($uri, '/'));
        
        // Si tenemos al menos 2 segmentos (proyecto/ruta), intentar servir el endpoint
        if (count($segments) >= 2) {
            $projectName = $segments[0];
            $route = $segments[1];
            
            $endpointFile = $apiDir . '/' . $projectName . '/' . $route . '.json';
            
            if (file_exists($endpointFile)) {
                $endpointData = json_decode(file_get_contents($endpointFile), true);
                
                // Verificar si el método coincide
                if ($endpointData['method'] === 'GET') {
                    echo json_encode($endpointData['content']);
                    exit;
                } else {
                    http_response_code(405); // Method Not Allowed
                    echo json_encode(['error' => 'Método no permitido']);
                    exit;
                }
            }
        }
        
        // Si llegamos aquí, el endpoint no existe
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint no encontrado']);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no soportado']);
        break;
}