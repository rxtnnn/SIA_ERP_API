<?php
// Set headers for JSON response
header('Content-Type: application/json');

// Include the OdooAPI class
require_once '../lib/OdooAPI.php';

// Load configuration
$config = require_once '../config/config.php';

/**
 * Initialize an instance of the Odoo API
 * 
 * @return OdooAPI API instance
 */
function getOdooApi() {
    global $config;
    
    return new OdooAPI(
        $config['odoo']['url'],
        $config['odoo']['db'],
        $config['odoo']['username'],
        $config['odoo']['apikey']
    );
}

/**
 * Send a JSON response
 * 
 * @param bool $success Success status
 * @param mixed $data Response data
 * @param string $message Message
 * @param int $statusCode HTTP status code
 */
function sendResponse($success, $data = null, $message = '', $statusCode = 200) {
    http_response_code($statusCode);
    
    $response = array(
        'success' => $success,
        'message' => $message
    );
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit;
}

/**
 * Send an error response
 * 
 * @param string $message Error message
 * @param int $statusCode HTTP status code
 */
function sendError($message, $statusCode = 400) {
    sendResponse(false, null, $message, $statusCode);
}

/**
 * Get POST data
 * 
 * @return array POST data
 */
function getPostData() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($data === null) {
        $data = $_POST;
    }
    
    return $data;
}