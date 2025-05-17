<?php
// Set headers for proper JSON response
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Load required files
require_once '../lib/OdooAPI.php';
$config = require_once '../config/config.php';

// Create OdooAPI instance
$odoo = new OdooAPI(
    $config['odoo']['url'],
    $config['odoo']['db'],
    $config['odoo']['username'],
    $config['odoo']['apikey']
);

// Check connection
if (!$odoo->isConnected()) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to connect to Odoo: ' . $odoo->getLastError()
    ]);
    exit;
}

// Handle GET requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all category IDs first using search method
    $categoryIds = $odoo->search('product.category', []);
    
    // Initialize array for mapped categories
    $mappedCategories = [];
    
    if ($categoryIds !== false && !empty($categoryIds)) {
        // Now use read to get the details of each category by ID
        $categories = $odoo->read('product.category', $categoryIds, ['id', 'name', 'parent_id']);
        
        if ($categories !== false) {
            foreach ($categories as $category) {
                $mappedCategories[] = [
                    'id' => $category['id'],
                    'name' => $category['name'],
                    'parent_id' => isset($category['parent_id']) && is_array($category['parent_id']) ? $category['parent_id'][0] : 0,
                    'parent_name' => isset($category['parent_id']) && is_array($category['parent_id']) ? $category['parent_id'][1] : ''
                ];
            }
        }
    }
    
    // Return the categories
    echo json_encode([
        'success' => true,
        'data' => [
            'categories' => $mappedCategories
        ]
    ]);
    exit;
}

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Check if JSON decode failed
    if ($data === null) {
        $data = $_POST;
    }
    
    // Validate required fields
    if (!isset($data['name']) || empty($data['name'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Category name is required'
        ]);
        exit;
    }
    
    // Prepare category data
    $categoryData = [
        'name' => $data['name']
    ];
    
    // Add parent ID if provided
    if (isset($data['parent_id']) && !empty($data['parent_id']) && $data['parent_id'] != 0) {
        $categoryData['parent_id'] = intval($data['parent_id']);
    }
    
    // Create category in Odoo
    $categoryId = $odoo->create('product.category', $categoryData);
    
    if ($categoryId === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create category: ' . $odoo->getLastError()
        ]);
        exit;
    }
    
    // Fetch the newly created category details
    $newCategory = $odoo->read('product.category', [$categoryId], ['id', 'name', 'parent_id']);
    
    if ($newCategory === false || empty($newCategory)) {
        // Return basic info if we can't fetch details
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $categoryId,
                'name' => $data['name'],
                'parent_id' => isset($data['parent_id']) ? intval($data['parent_id']) : 0,
                'parent_name' => ''
            ],
            'message' => 'Category created successfully'
        ]);
    } else {
        // Return the detailed category info
        $category = $newCategory[0];
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $category['id'],
                'name' => $category['name'],
                'parent_id' => isset($category['parent_id']) && is_array($category['parent_id']) ? $category['parent_id'][0] : 0,
                'parent_name' => isset($category['parent_id']) && is_array($category['parent_id']) ? $category['parent_id'][1] : ''
            ],
            'message' => 'Category created successfully'
        ]);
    }
    exit;
}

// Handle unsupported methods
echo json_encode([
    'success' => false,
    'message' => 'Method not allowed'
]);