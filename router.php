<?php
// Configuración de encabezados para permitir CORS y JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// No establecemos el Content-Type aquí para permitir diferentes formatos de respuesta

// Medir tiempo de inicio para métricas
$startTime = microtime(true);

// Manejar solicitudes OPTIONS (preflight requests)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Directorio donde se almacenan los endpoints
$apiDir = __DIR__ . '/api';

// Directorio para caché (asegúrate de crear este directorio y darle permisos de escritura)
$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

// Configuración de caché
$cacheEnabled = true;
$cacheTTL = 1; // segundos

// Obtener el cuerpo de la solicitud para métodos POST, PUT, DELETE
$requestBody = null;
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
    $requestBody = file_get_contents('php://input');
    error_log("Cuerpo de la solicitud: " . $requestBody);
    
    // Para solicitudes POST con Content-Type application/json, usar el cuerpo JSON en lugar de $_POST
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $_POST = json_decode($requestBody, true) ?: [];
    }
}

// Obtener la URI solicitada
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($uri, '/'));

// Verificar si tenemos al menos 2 segmentos (proyecto/ruta)
if (count($segments) >= 2) {
    $projectName = $segments[0];
    $route = $segments[1];

    // Depuración - Registrar la solicitud
    error_log("Solicitud recibida: Proyecto=$projectName, Ruta=$route, Método={$_SERVER['REQUEST_METHOD']}");

    // Construir nombres de archivo basados en método y ruta
    $methodSpecificFile = $apiDir . '/' . $projectName . '/' . $route . '_' . $_SERVER['REQUEST_METHOD'] . '.json';
    $genericFile = $apiDir . '/' . $projectName . '/' . $route . '.json';
    
    // Depuración - Registrar los archivos que se están buscando
    error_log("Buscando archivos: Específico=$methodSpecificFile, Genérico=$genericFile");
    
    // Primero intentar con archivo específico del método
    if (file_exists($methodSpecificFile)) {
        $endpointFile = $methodSpecificFile;
    } else {
        $endpointFile = $genericFile;
    }

    // Depuración - Verificar si el archivo existe
    error_log("Buscando archivo: $endpointFile, Existe: " . (file_exists($endpointFile) ? 'Sí' : 'No'));

    if (file_exists($endpointFile)) {
        $endpointData = json_decode(file_get_contents($endpointFile), true);

        // Verificar si el método coincide con la solicitud actual
        $requestMethod = $_SERVER['REQUEST_METHOD'];

        // Depuración - Verificar método
        error_log("Método solicitado: $requestMethod, Método del endpoint: {$endpointData['method']}");

        if ($endpointData['method'] === $requestMethod || $requestMethod === 'OPTIONS') {
            // Establecer el código de estado HTTP personalizado si está definido
            if (isset($endpointData['status_code'])) {
                $statusCode = $endpointData['status_code'];
                http_response_code($statusCode);
                
                // Si es un código de error (>=400) y hay un mensaje de error personalizado, devolverlo
                if ($statusCode >= 400 && isset($endpointData['error_message'])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => $endpointData['error_message']]);
    exit;
}
            }
            // === CACHÉ PARA MÉTODOS POST ===
            if ($cacheEnabled && $requestMethod === 'POST') {
                $cacheKey = md5($uri . serialize($_POST));
                $cacheFile = $cacheDir . '/' . $cacheKey;

                // Verificar si existe caché válida
                if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTTL)) {
                    $contentType = isset($_POST['format']) ? getContentTypeForFormat($_POST['format']) : 'application/json';
                    header("Content-Type: $contentType");
                    header('X-API-Cache: HIT');
                    readfile($cacheFile);
                    exit;
                }

                // Si llegamos aquí, no hay caché o está expirada
                header('X-API-Cache: MISS');
                // Iniciar buffer para capturar la salida
                ob_start();
            }

            // Obtener el contenido del endpoint
            $content = $endpointData['content'];
            
            // Para solicitudes POST, asegurarse de devolver el contenido directamente sin procesamiento adicional
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Registrar el contenido para depuración
                error_log("Contenido del endpoint POST: " . json_encode($content));
            }
            // Para otros métodos, verificar si hay una estructura anidada con content.content
            else if (isset($content['content'])) {
                // Si content.content es un array, usarlo directamente
                if (is_array($content['content'])) {
                    $content = $content['content'];
                    error_log("Estructura anidada detectada: content.content es array");
                }
                // Si content.content tiene otra estructura anidada (content.content.content)
                else if (isset($content['content']['content']) && is_array($content['content']['content'])) {
                    $content = $content['content']['content'];
                    error_log("Estructura doblemente anidada detectada: content.content.content");
                }
            }

            // Verificar si se solicita información sobre la estructura
            if (isset($_POST['_schema']) && $_POST['_schema'] === 'true') {
                // Analizar la estructura del contenido para proporcionar información de filtrado
                $schema = analyzeJsonStructure($content);
                echo json_encode([
                    'schema' => $schema,
                    'total_items' => is_array($content) ? count($content) : 1
                ]);
                exit;
            }

            // === MEJORA 1: FILTROS AVANZADOS ===
            // Verificar si hay parámetros de filtro
            if (isset($_POST['filter']) && is_array($_POST['filter'])) {
                $filters = $_POST['filter'];
                $operators = isset($_POST['operator']) ? $_POST['operator'] : [];

                // Aplicar filtros al contenido
                $content = applyFilters($content, $filters, $operators);
            }
            // Verificar si hay parámetros de consulta simples (ej: ?id=2 o ?nombre="Plátano" o ?user.username=breat_sk8)
            else if (!empty($_POST) && $_SERVER['REQUEST_METHOD'] !== 'POST') {
                // Convertir parámetros simples al formato de filtro
                $simpleFilters = [];
                $simpleOperators = [];

                // Procesar parámetros POST directamente
                foreach ($_POST as $key => $value) {
                    $simpleFilters[$key] = $value;
                }

                // Aplicar filtros al contenido
                $content = applyFilters($content, $simpleFilters, $simpleOperators);
            }

            // === MEJORA 2: BÚSQUEDA DE TEXTO ===
            if (isset($_POST['search']) && isset($_POST['search_fields']) && is_array($content)) {
                $searchTerm = $_POST['search'];
                $searchFields = explode(',', $_POST['search_fields']);

                $searchResults = [];
                foreach ($content as $item) {
                    foreach ($searchFields as $field) {
                        if (isset($item[$field]) && stripos((string)$item[$field], $searchTerm) !== false) {
                            $searchResults[] = $item;
                            break; // Evitar duplicados si coincide en múltiples campos
                        }
                    }
                }
                $content = $searchResults;
            }

            // === MEJORA 3: ORDENAMIENTO ===
            if (isset($_POST['sort']) && is_array($content) && !empty($content)) {
                $sortField = $_POST['sort'];
                $sortDirection = isset($_POST['direction']) && strtolower($_POST['direction']) === 'desc' ? SORT_DESC : SORT_ASC;

                // Extraer la columna a ordenar
                $column = array_column($content, $sortField);
                if (!empty($column)) {
                    // Ordenar el array
                    array_multisort($column, $sortDirection, $content);
                }
            }

            // === MEJORA 4: PAGINACIÓN ===
            $originalTotalItems = is_array($content) ? count($content) : 1;

            if (isset($_POST['page']) && isset($_POST['limit']) && is_array($content)) {
                $page = (int)$_POST['page'];
                $limit = (int)$_POST['limit'];
                $offset = ($page - 1) * $limit;

                // Paginar los resultados
                $paginatedContent = array_slice($content, $offset, $limit);

                // Añadir metadatos de paginación
                $content = [
                    'data' => $paginatedContent,
                    'meta' => [
                        'total' => $originalTotalItems,
                        'page' => $page,
                        'limit' => $limit,
                        'pages' => ceil($originalTotalItems / $limit)
                    ]
                ];
            }

            // === MEJORA 5: SELECCIÓN DE CAMPOS ===
            if (isset($_POST['fields']) && is_array($content)) {
                $fields = explode(',', $_POST['fields']);

                // Si tenemos estructura con 'data', aplicar a ese nivel
                if (isset($content['data']) && is_array($content['data'])) {
                    $filteredData = [];
                    foreach ($content['data'] as $item) {
                        $newItem = [];
                        foreach ($fields as $field) {
                            if (isset($item[$field])) {
                                $newItem[$field] = $item[$field];
                            }
                        }
                        $filteredData[] = $newItem;
                    }
                    $content['data'] = $filteredData;
                }
                // Si es un array simple
                elseif (!isset($content['data'])) {
                    $filteredContent = [];
                    foreach ($content as $item) {
                        if (is_array($item)) {
                            $newItem = [];
                            foreach ($fields as $field) {
                                if (isset($item[$field])) {
                                    $newItem[$field] = $item[$field];
                                }
                            }
                            $filteredContent[] = $newItem;
                        }
                    }
                    $content = $filteredContent;
                }
            }

            // === MEJORA 6: FORMATO DE SALIDA ===
            $format = isset($_POST['format']) ? strtolower($_POST['format']) : 'json';

            // Establecer encabezados según el formato
            $contentType = getContentTypeForFormat($format);
            header("Content-Type: $contentType");

            // Añadir encabezados con métricas
            $endTime = microtime(true);
            $executionTime = ($endTime - $startTime) * 1000; // en ms
            header('X-API-Response-Time: ' . round($executionTime, 2) . 'ms');
            header('X-API-Result-Count: ' . $originalTotalItems);

            // Generar la respuesta según el formato
            switch ($format) {
                case 'xml':
                    $output = arrayToXml($content);
                    echo $output;
                    break;

                case 'csv':
                    outputCsv($content);
                    break;

                case 'json':
                default:
                    echo json_encode($content, JSON_PRETTY_PRINT);
                    break;
            }

            // === CACHÉ: GUARDAR RESULTADO ===
            if ($cacheEnabled && $requestMethod === 'POST') {
                $output = ob_get_contents();
                ob_end_flush();
                file_put_contents($cacheFile, $output);
            }

        } else {
            // Método no coincide
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido', 'method' => $requestMethod, 'expected' => $endpointData['method']]);
        }
    } else {
        // Endpoint no encontrado
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint no encontrado', 'project' => $projectName, 'route' => $route]);
    }
} else {
    // Solicitud incorrecta
    http_response_code(400);
    echo json_encode(['error' => 'Solicitud incorrecta', 'uri' => $uri]);
}

// === FUNCIONES AUXILIARES ===

// Función para analizar la estructura JSON
function analyzeJsonStructure($data) {
    $schema = [];

    if (is_array($data)) {
        // Si es un array de elementos, analizar el primer elemento
        if (!empty($data) && isset($data[0]) && is_array($data[0])) {
            $schema = analyzeObject($data[0]);
        }
        // Si es un objeto único
        else if (!empty($data) && !isset($data[0])) {
            $schema = analyzeObject($data);
        }
    }

    return $schema;
}

function analyzeObject($obj) {
    $schema = [];

    foreach ($obj as $key => $value) {
        $type = getValueType($value);
        $schema[$key] = ['type' => $type];

        // Si es un objeto anidado, analizarlo recursivamente
        if ($type === 'object' && is_array($value)) {
            $schema[$key]['properties'] = analyzeObject($value);
        }
        // Si es un array, analizar el tipo de sus elementos
        else if ($type === 'array' && !empty($value)) {
            $schema[$key]['items'] = ['type' => getValueType($value[0])];
            // Si los elementos son objetos, analizarlos
            if ($schema[$key]['items']['type'] === 'object' && is_array($value[0])) {
                $schema[$key]['items']['properties'] = analyzeObject($value[0]);
            }
        }
    }

    return $schema;
}

function getValueType($value) {
    if (is_null($value)) return 'null';
    if (is_bool($value)) return 'boolean';
    if (is_int($value)) return 'integer';
    if (is_float($value)) return 'number';
    if (is_string($value)) return 'string';
    if (is_array($value)) {
        // Verificar si es un array indexado o asociativo
        if (array_keys($value) === range(0, count($value) - 1)) {
            return 'array';
        } else {
            return 'object';
        }
    }
    return 'unknown';
}

// Función para obtener un valor anidado usando notación de punto
function getNestedValue($item, $field) {
    // Registrar para depuración
    error_log("Buscando campo: $field en item: " . json_encode($item));

    // Si el campo no contiene puntos, es un acceso directo
    if (strpos($field, '.') === false) {
        return isset($item[$field]) ? $item[$field] : null;
    }

    // Si contiene puntos, navegar por la estructura anidada
    $parts = explode('.', $field);
    $current = $item;

    foreach ($parts as $part) {
        if (!isset($current[$part])) {
            error_log("Parte no encontrada: $part en la ruta: $field");
            return null; // Si alguna parte de la ruta no existe, retornar null
        }
        $current = $current[$part];
    }

    error_log("Valor encontrado para $field: " . json_encode($current));
    return $current;
}

// Función para aplicar filtros
function applyFilters($content, $filters, $operators = []) {
    // Si no es un array, no podemos filtrar
    if (!is_array($content)) {
        return $content;
    }

    // Registrar para depuración
    error_log("Aplicando filtros: " . json_encode($filters));
    error_log("Estructura de contenido: " . json_encode(array_keys($content)));

    // Si es un array asociativo (objeto) en lugar de una lista, convertirlo a lista
    if (!isset($content[0]) && count($content) > 0) {
        $content = [$content];
    }

    $filteredContent = [];

    foreach ($content as $item) {
        $matchesAllFilters = true;

        foreach ($filters as $field => $value) {
            // Obtener el operador, por defecto 'eq' (igual)
            $operator = isset($operators[$field]) ? $operators[$field] : 'eq';

            // Obtener el valor del campo, soportando notación de punto para acceso anidado
            $fieldValue = getNestedValue($item, $field);

            // Si el campo no existe en el item, no hay coincidencia
            if ($fieldValue === null) {
                $matchesAllFilters = false;
                break;
            }

            // Aplicar el operador correspondiente
            $matches = applyOperator($fieldValue, $value, $operator);

            if (!$matches) {
                $matchesAllFilters = false;
                break;
            }
        }

        if ($matchesAllFilters) {
            $filteredContent[] = $item;
        }
    }

    return $filteredContent;
}

// Función para aplicar operadores de comparación
function applyOperator($fieldValue, $filterValue, $operator) {
    // Convertir valores al mismo tipo si es posible
    if (is_numeric($fieldValue) && is_numeric($filterValue)) {
        $fieldValue = floatval($fieldValue);
        $filterValue = floatval($filterValue);
    }

    // Eliminar comillas si están presentes en el filterValue
    if (is_string($filterValue)) {
        $filterValue = trim($filterValue, '"\'');
    }

    switch ($operator) {
        case 'eq': // igual
            return $fieldValue == $filterValue;
        case 'neq': // no igual
            return $fieldValue != $filterValue;
        case 'gt': // mayor que
            return $fieldValue > $filterValue;
        case 'gte': // mayor o igual que
            return $fieldValue >= $filterValue;
        case 'lt': // menor que
            return $fieldValue < $filterValue;
        case 'lte': // menor o igual que
            return $fieldValue <= $filterValue;
        case 'contains': // contiene (para strings o arrays)
            if (is_array($fieldValue)) {
                return in_array($filterValue, $fieldValue);
            } elseif (is_string($fieldValue) && is_string($filterValue)) {
                return stripos($fieldValue, $filterValue) !== false;
            }
            return false;
        case 'startswith': // comienza con (para strings)
            if (is_string($fieldValue) && is_string($filterValue)) {
                return stripos($fieldValue, $filterValue) === 0;
            }
            return false;
        case 'endswith': // termina con (para strings)
            if (is_string($fieldValue) && is_string($filterValue)) {
                return substr($fieldValue, -strlen($filterValue)) === $filterValue;
            }
            return false;
        case 'in': // está en una lista de valores
            $values = explode(',', $filterValue);
            return in_array($fieldValue, $values);
        default:
            return $fieldValue == $filterValue; // por defecto, igualdad
    }
}

// Función para obtener el tipo de contenido según el formato
function getContentTypeForFormat($format) {
    switch ($format) {
        case 'xml':
            return 'application/xml';
        case 'csv':
            return 'text/csv';
        case 'json':
        default:
            return 'application/json';
    }
}

// Función para convertir array a XML
function arrayToXml($array, $rootElement = 'response', $xml = null) {
    if ($xml === null) {
        $xml = new SimpleXMLElement("<?xml version='1.0' encoding='UTF-8'?><$rootElement></$rootElement>");
    }

    // Si tenemos una estructura de paginación
    if (isset($array['data']) && isset($array['meta'])) {
        $meta = $xml->addChild('meta');
        foreach ($array['meta'] as $key => $value) {
            $meta->addChild($key, $value);
        }

        $data = $xml->addChild('data');
        arrayToXmlRecursive($array['data'], $data);
    } else {
        arrayToXmlRecursive($array, $xml);
    }

    return $xml->asXML();
}

// Función recursiva para convertir array a XML
function arrayToXmlRecursive($array, &$xml) {
    foreach ($array as $key => $value) {
        // Si el key es numérico, usar 'item' como nombre del elemento
        if (is_numeric($key)) {
            $key = 'item';
        }

        // Si el valor es un array
        if (is_array($value)) {
            $subnode = $xml->addChild($key);
            arrayToXmlRecursive($value, $subnode);
        } else {
            // Manejar caracteres especiales en XML
            $xml->addChild($key, htmlspecialchars($value));
        }
    }
}

// Función para generar salida CSV
function outputCsv($content) {
    $output = fopen('php://output', 'w');

    // Si tenemos una estructura de paginación
    if (isset($content['data']) && is_array($content['data'])) {
        $data = $content['data'];
    } else {
        $data = $content;
    }

    // Si hay datos y son arrays
    if (!empty($data) && is_array($data)) {
        // Obtener encabezados del primer elemento
        if (isset($data[0]) && is_array($data[0])) {
            $headers = array_keys($data[0]);
            fputcsv($output, $headers);

            // Escribir los datos
            foreach ($data as $row) {
                fputcsv($output, $row);
            }
        }
        // Si es un objeto único
        elseif (is_array($data) && !isset($data[0])) {
            $headers = array_keys($data);
            fputcsv($output, $headers);
            fputcsv($output, $data);
        }
    }

    fclose($output);
}
?>