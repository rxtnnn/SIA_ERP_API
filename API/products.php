<?php
// api/products.php (relevant parts for stock management)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../OdooConnector.php';
require_once '../config.php';

try {
    $odoo = new OdooConnector(ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD);
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // Get products for dropdown in stock management
        $products = $odoo->execute('product.product', 'search_read', [
            [['type', '=', 'product']],
            [
                'fields' => ['id', 'name', 'qty_available', 'list_price', 'categ_id'],
                'limit' => isset($_GET['limit']) ? (int)$_GET['limit'] : 20
            ]
        ]);
        
        $processedProducts = [];
        foreach ($products as $product) {
            $processedProducts[] = [
                'id' => $product['id'],
                'name' => $product['name'],
                'stock' => $product['qty_available'],
                'price' => $product['list_price'],
                'category' => $product['categ_id'][1] ?? 'Uncategorized'
            ];
        }
        
        $response = [
            'success' => true,
            'data' => [
                'products' => $processedProducts
            ]
        ];
    }
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'data' => null
    ];
}

echo json_encode($response);