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
    
    // Crear archivo para el endpoint con nombre específico para el método HTTP
    $endpointFile = $projectDir . '/' . $route . '_' . $method . '.json';
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

// Función para actualizar el código de estado HTTP de un endpoint
function updateEndpointStatusCode($projectName, $route, $statusCode, $errorMessage = null) {
    global $apiDir;
    
    // Sanitizar nombres de proyecto y ruta
    $projectName = preg_replace('/[^a-z0-9\-]/', '', strtolower(str_replace(' ', '-', $projectName)));
    $route = preg_replace('/[^a-z0-9\-]/', '', strtolower($route));
    
    // Validar que tengamos datos válidos
    if (empty($projectName) || empty($route) || empty($statusCode)) {
        return ['success' => false, 'message' => 'Faltan datos requeridos'];
    }
    
    // Verificar que el código de estado sea un número válido
    if (!is_numeric($statusCode) || $statusCode < 100 || $statusCode > 599) {
        return ['success' => false, 'message' => 'Código de estado HTTP inválido'];
    }
    
    // Verificar que exista el directorio del proyecto
    $projectDir = $apiDir . '/' . $projectName;
    if (!file_exists($projectDir) || !is_dir($projectDir)) {
        return ['success' => false, 'message' => 'El proyecto no existe'];
    }
    
    // Verificar que exista el archivo del endpoint (buscar archivos para todos los métodos)
    $methodSpecificFiles = glob($projectDir . '/' . $route . '_*.json');
    if (empty($methodSpecificFiles)) {
        // Intentar con el archivo genérico si no existe ningún archivo específico
        $endpointFile = $projectDir . '/' . $route . '.json';
        if (!file_exists($endpointFile)) {
            return ['success' => false, 'message' => 'El endpoint no existe'];
        }
    } else {
        // Usar el primer archivo encontrado
        $endpointFile = $methodSpecificFiles[0];
    }
    
    // Leer el archivo actual
    $endpointData = json_decode(file_get_contents($endpointFile), true);
    if (!$endpointData) {
        return ['success' => false, 'message' => 'Error al leer el endpoint'];
    }
    
    // Actualizar el código de estado
    $endpointData['status_code'] = (int)$statusCode;
    
    // Si se proporciona un mensaje de error personalizado y es un código de error (>=400)
    if (!empty($errorMessage) && $statusCode >= 400) {
        try {
            // Intentar decodificar el mensaje para verificar que sea JSON válido
            $jsonMessage = json_decode($errorMessage, true);
            if ($jsonMessage !== null) {
                $endpointData['error_message'] = $jsonMessage;
            } else {
                // Si no es JSON válido, intentar crear un objeto JSON simple
                $endpointData['error_message'] = ['message' => $errorMessage];
            }
        } catch (Exception $e) {
            // En caso de error, usar un mensaje simple
            $endpointData['error_message'] = ['message' => $errorMessage];
        }
    } else if ($statusCode < 400) {
        // Si es un código de éxito, eliminar cualquier mensaje de error anterior
        unset($endpointData['error_message']);
    }
    
    // Guardar el archivo actualizado
    if (file_put_contents($endpointFile, json_encode($endpointData, JSON_PRETTY_PRINT))) {
        return [
            'success' => true, 
            'message' => 'Código de estado actualizado correctamente',
            'status_code' => $statusCode,
            'error_message' => $endpointData['error_message'] ?? null
        ];
    } else {
        return ['success' => false, 'message' => 'Error al actualizar el endpoint'];
    }
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
        
    case 'PUT':
        // Actualizar el código de estado de un endpoint
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
            exit;
        }
        
        $result = updateEndpointStatusCode(
            $data['projectName'] ?? '', 
            $data['route'] ?? '', 
            $data['statusCode'] ?? 200,
            $data['errorMessage'] ?? null
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
            
            // Primero intentar con archivo específico del método
            $methodSpecificFile = $apiDir . '/' . $projectName . '/' . $route . '_GET.json';
            $genericFile = $apiDir . '/' . $projectName . '/' . $route . '.json';
            
            // Verificar primero el archivo específico del método
            if (file_exists($methodSpecificFile)) {
                $endpointFile = $methodSpecificFile;
            } else {
                $endpointFile = $genericFile;
            }
            
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