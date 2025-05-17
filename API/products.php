<?php
require_once 'api_utils.php';

// Prevent PHP errors from being output directly
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Log the request method and data
$method = $_SERVER['REQUEST_METHOD'];
error_log("Products API called with method: $method");

// Initialize Odoo API
$odoo = getOdooApi();
if (!$odoo->isConnected()) {
    error_log("Odoo connection failed: " . $odoo->getLastError());
    sendError('Failed to connect to Odoo: ' . $odoo->getLastError(), 500);
    exit;
}

try {
    switch ($method) {
        case 'GET':
            // Get products
            handleGetProducts($odoo);
            break;
            
        case 'POST':
            // Create a product
            handleCreateProduct($odoo);
            break;
            
        case 'PUT':
            // Update a product
            handleUpdateProduct($odoo);
            break;
            
        case 'DELETE':
            // Delete a product
            handleDeleteProduct($odoo);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("Exception in products.php: " . $e->getMessage());
    sendError('An error occurred: ' . $e->getMessage(), 500);
}

/**
 * Handle GET request to retrieve products
 * 
 * @param OdooAPI $odoo Odoo API instance
 */
function handleGetProducts($odoo) {
    error_log("Attempting to get products");
    
    // Handle pagination
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
    $offset = ($page - 1) * $limit;
    
    try {
        // Get product IDs first
        $productIds = $odoo->search('product.product', [], $offset, $limit);
        
        if ($productIds === false) {
            error_log("Error retrieving product IDs: " . $odoo->getLastError());
            // Return empty list on error
            sendResponse(true, [
                'products' => [],
                'pagination' => [
                    'total' => 0,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => 0
                ]
            ]);
            return;
        }
        
        error_log("Retrieved " . count($productIds) . " product IDs");
        
        // If no product IDs found, return empty list
        if (empty($productIds)) {
            sendResponse(true, [
                'products' => [],
                'pagination' => [
                    'total' => 0,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => 0
                ]
            ]);
            return;
        }
        
        // Get product details
        $products = $odoo->read(
            'product.product',
            $productIds,
            ['id', 'name', 'categ_id', 'list_price', 'standard_price']
        );
        
        if ($products === false) {
            error_log("Error retrieving product details: " . $odoo->getLastError());
            // Return empty list on error
            sendResponse(true, [
                'products' => [],
                'pagination' => [
                    'total' => 0,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => 0
                ]
            ]);
            return;
        }
        
        error_log("Retrieved " . count($products) . " product details");
        
        // Count total products for pagination
        $totalCount = $odoo->searchCount('product.product', []);
        
        if ($totalCount === false) {
            $totalCount = count($products);
        }
        
        $totalPages = ceil($totalCount / $limit);
        
        error_log("Total products: $totalCount, Total pages: $totalPages");
        
        // Map products to the format expected by the frontend
        $mappedProducts = [];
        foreach ($products as $index => $product) {
            error_log("Processing product: " . json_encode($product));
            
            // For demo purposes, generate stock values
            $stock = ($index + 1) * 5; // Different stock value for each product
            $minStock = 5; // Default min stock
            
            $categoryName = 'N/A';
            $categoryId = 0;
            
            if (isset($product['categ_id']) && is_array($product['categ_id']) && count($product['categ_id']) >= 2) {
                $categoryId = $product['categ_id'][0];
                $categoryName = $product['categ_id'][1];
            }
            
            $mappedProducts[] = [
                'id' => $product['id'],
                'name' => $product['name'],
                'category' => $categoryName,
                'category_id' => $categoryId,
                'price' => isset($product['list_price']) ? $product['list_price'] : 0,
                'cost' => isset($product['standard_price']) ? $product['standard_price'] : 0,
                'stock' => $stock,
                'min_stock' => $minStock
            ];
        }
        
        // Send response
        sendResponse(true, [
            'products' => $mappedProducts,
            'pagination' => [
                'total' => $totalCount,
                'page' => $page,
                'limit' => $limit,
                'pages' => $totalPages
            ]
        ]);
    } catch (Exception $e) {
        error_log("Exception in handleGetProducts: " . $e->getMessage());
        sendError('Error retrieving products: ' . $e->getMessage(), 500);
    }
}

/**
 * Handle POST request to create a product
 * 
 * @param OdooAPI $odoo Odoo API instance
 */
function handleCreateProduct($odoo) {
    try {
        // Get posted data
        $input = file_get_contents('php://input');
        error_log("Raw input data: $input");
        
        $data = json_decode($input, true);
        
        // If JSON decoding failed, try getting from POST
        if ($data === null) {
            error_log("JSON decode failed, trying POST data");
            $data = $_POST;
            error_log("POST data: " . print_r($data, true));
        }
        
        error_log("Processed data: " . print_r($data, true));
        
        // Validate required fields
        $requiredFields = ['name', 'category_id', 'price', 'cost'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
                error_log("Missing required field: $field");
                sendError("Field '$field' is required");
                return;
            }
        }
        
        // Prepare product data
        $productData = [
            'name' => $data['name'],
            'categ_id' => intval($data['category_id']),
            'list_price' => floatval($data['price']),
            'standard_price' => floatval($data['cost'])
        ];
        
        error_log("Product data prepared: " . print_r($productData, true));
        
        // Add optional fields
        if (isset($data['description']) && !empty($data['description'])) {
            $productData['description'] = $data['description'];
        }
        
        error_log("Creating product in Odoo with data: " . print_r($productData, true));
        
        // Create product
        $productId = $odoo->create('product.product', $productData);
        
        if ($productId === false) {
            error_log("Failed to create product: " . $odoo->getLastError());
            sendError('Failed to create product: ' . $odoo->getLastError());
            return;
        }
        
        error_log("Product created successfully with ID: $productId");
        
        // Handle initial stock if provided
        if (isset($data['initial_stock']) && floatval($data['initial_stock']) > 0) {
            error_log("Setting initial stock: " . $data['initial_stock']);
            
            // Create a simple stock adjustment for demo purposes
            try {
                // Use stock.quant to set initial stock
                $stockData = [
                    'product_id' => $productId,
                    'inventory_quantity' => floatval($data['initial_stock']),
                    'location_id' => 1 // Default stock location
                ];
                
                error_log("Creating stock adjustment with data: " . print_r($stockData, true));
                
                $stockId = $odoo->create('stock.quant', $stockData);
                
                if ($stockId === false) {
                    error_log("Failed to create stock quant: " . $odoo->getLastError());
                    // Product was created but setting initial stock failed
                    sendResponse(true, [
                        'product_id' => $productId,
                        'warning' => 'Product created, but setting initial stock failed: ' . $odoo->getLastError()
                    ], 'Product created successfully, but initial stock could not be set');
                    return;
                }
                
                error_log("Stock quant created successfully with ID: $stockId");
            } catch (Exception $e) {
                error_log("Exception setting initial stock: " . $e->getMessage());
                // Continue even if stock setting fails
                sendResponse(true, [
                    'product_id' => $productId,
                    'warning' => 'Product created, but setting initial stock failed: ' . $e->getMessage()
                ], 'Product created successfully, but initial stock could not be set');
                return;
            }
        }
        
        sendResponse(true, ['product_id' => $productId], 'Product created successfully');
    } catch (Exception $e) {
        error_log("Exception in product creation: " . $e->getMessage());
        sendError('Error creating product: ' . $e->getMessage());
    }
}

/**
 * Handle PUT request to update a product
 * 
 * @param OdooAPI $odoo Odoo API instance
 */
function handleUpdateProduct($odoo) {
    try {
        // Get posted data
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        // If JSON decoding failed, try getting from PUT
        if ($data === null) {
            parse_str($input, $data);
        }
        
        // Check if product ID is provided
        if (!isset($data['id']) || empty($data['id'])) {
            sendError("Product ID is required");
            return;
        }
        
        $productId = intval($data['id']);
        
        // Prepare product data
        $productData = [];
        
        // Add fields that can be updated
        if (isset($data['name']) && !empty($data['name'])) {
            $productData['name'] = $data['name'];
        }
        
        if (isset($data['category_id']) && !empty($data['category_id'])) {
            $productData['categ_id'] = intval($data['category_id']);
        }
        
        if (isset($data['price'])) {
            $productData['list_price'] = floatval($data['price']);
        }
        
        if (isset($data['cost'])) {
            $productData['standard_price'] = floatval($data['cost']);
        }
        
        if (isset($data['description'])) {
            $productData['description'] = $data['description'];
        }
        
        // Check if there are fields to update
        if (empty($productData)) {
            sendError("No fields to update");
            return;
        }
        
        // Update product
        $result = $odoo->write('product.product', [$productId], $productData);
        
        if ($result === false) {
            sendError('Failed to update product: ' . $odoo->getLastError());
            return;
        }
        
        sendResponse(true, null, 'Product updated successfully');
    } catch (Exception $e) {
        sendError('Error updating product: ' . $e->getMessage());
    }
}

/**
 * Handle DELETE request to delete a product
 * 
 * @param OdooAPI $odoo Odoo API instance
 */
function handleDeleteProduct($odoo) {
    try {
        // Check if product ID is provided
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            sendError("Product ID is required");
            return;
        }
        
        $productId = intval($_GET['id']);
        
        // Delete product
        $result = $odoo->unlink('product.product', [$productId]);
        
        if ($result === false) {
            sendError('Failed to delete product: ' . $odoo->getLastError());
            return;
        }
        
        sendResponse(true, null, 'Product deleted successfully');
    } catch (Exception $e) {
        sendError('Error deleting product: ' . $e->getMessage());
    }
}