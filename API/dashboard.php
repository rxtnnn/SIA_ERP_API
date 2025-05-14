<?php
// api/dashboard.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../OdooConnector.php';
require_once '../config.php';

try {
    $odoo = new OdooConnector(ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD);
    
    // Get dashboard data
    $totalProducts = $odoo->execute('product.product', 'search_count', [
        [['type', '=', 'product']]
    ]);
    
    // Get total stock quantity
    $stockQuants = $odoo->execute('stock.quant', 'search_read', [
        [['location_id.usage', '=', 'internal']],
        ['fields' => ['quantity']]
    ]);
    
    $totalStock = array_sum(array_column($stockQuants, 'quantity'));
    
    // Get low stock items (assuming min stock is 5)
    $lowStockProducts = $odoo->execute('product.product', 'search_read', [
        [['qty_available', '<=', 5], ['qty_available', '>', 0]],
        ['fields' => ['id']]
    ]);
    
    $lowStockCount = count($lowStockProducts);
    
    // Get recent activities (stock moves)
    $recentMoves = $odoo->execute('stock.move', 'search_read', [
        [['state', '=', 'done']],
        [
            'fields' => ['date', 'product_id', 'product_qty', 'reference', 'location_id', 'location_dest_id'],
            'limit' => 10,
            'order' => 'date desc'
        ]
    ]);
    
    $activities = [];
    foreach ($recentMoves as $move) {
        $action = 'Stock Movement';
        
        // Determine if it's stock in or out
        $destLocation = $odoo->execute('stock.location', 'read', [
            [$move['location_dest_id'][0]],
            ['usage']
        ]);
        
        if ($destLocation[0]['usage'] === 'internal') {
            $action = 'Stock In';
        } elseif ($destLocation[0]['usage'] === 'customer') {
            $action = 'Stock Out';
        }
        
        $activities[] = [
            'date' => $move['date'],
            'product' => $move['product_id'][1],
            'action' => $action,
            'quantity' => $move['product_qty'],
            'user' => 'Admin'
        ];
    }
    
    $response = [
        'success' => true,
        'data' => [
            'totalProducts' => $totalProducts,
            'totalStock' => $totalStock,
            'lowStockItems' => $lowStockCount,
            'pendingOrders' => 0, // You would fetch this from sale.order or similar
            'recentActivities' => $activities
        ]
    ];
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'data' => null
    ];
}

echo json_encode($response);