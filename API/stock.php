<?php
// api/stock.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../OdooConnector.php';
require_once '../config.php';

try {
    $odoo = new OdooConnector(ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $response = ['success' => false, 'message' => '', 'data' => null];
    
    switch ($method) {
        case 'GET':
            if (isset($_GET['product_id'])) {
                $response = getProductStock($_GET['product_id'], $odoo);
            } else {
                $response = getAllStockData($odoo);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if ($input['action'] === 'in') {
                $response = processStockIn($input, $odoo);
            } elseif ($input['action'] === 'out') {
                $response = processStockOut($input, $odoo);
            }
            break;
            
        default:
            $response['message'] = 'Invalid request method';
    }
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'data' => null
    ];
}

echo json_encode($response);

// Function definitions
function getAllStockData($odoo) {
    try {
        // Get current stock from stock.quant
        $stockData = $odoo->execute('stock.quant', 'search_read', [
            [],
            ['fields' => ['product_id', 'quantity', 'location_id']]
        ]);
        
        // Get product details
        $products = $odoo->execute('product.product', 'search_read', [
            [],
            ['fields' => ['id', 'name', 'qty_available', 'virtual_available']]
        ]);
        
        // Get stock history (last 20 entries)
        $moves = $odoo->execute('stock.move', 'search_read', [
            [['state', '=', 'done']],
            [
                'fields' => ['product_id', 'product_qty', 'date', 'reference', 'location_id', 'location_dest_id', 'origin'],
                'limit' => 20,
                'order' => 'date desc'
            ]
        ]);
        
        // Process and format data
        $processedStock = [];
        foreach ($products as $product) {
            $stockStatus = 'In Stock';
            if ($product['qty_available'] <= 0) {
                $stockStatus = 'Out of Stock';
            } elseif ($product['qty_available'] <= 5) { // Assuming min stock is 5
                $stockStatus = 'Low Stock';
            }
            
            $processedStock[] = [
                'productId' => $product['id'],
                'productName' => $product['name'],
                'currentStock' => $product['qty_available'],
                'minStock' => 5, // You should get this from product settings
                'status' => $stockStatus,
                'lastUpdated' => date('Y-m-d H:i:s')
            ];
        }
        
        // Process history
        $processedHistory = [];
        foreach ($moves as $move) {
            $type = 'in';
            $typeLabel = 'Stock In';
            
            // Check if it's stock out based on location
            $location = $odoo->execute('stock.location', 'search_read', [
                [['id', '=', $move['location_id'][0]]],
                ['fields' => ['usage']]
            ]);
            
            if ($location[0]['usage'] === 'internal') {
                $type = 'out';
                $typeLabel = 'Stock Out';
            }
            
            $processedHistory[] = [
                'date' => $move['date'],
                'product' => $move['product_id'][1],
                'type' => $type,
                'typeLabel' => $typeLabel,
                'quantity' => $move['product_qty'],
                'reference' => $move['reference'] ?: $move['origin'],
                'user' => 'Admin' // Get from move's user_id
            ];
        }
        
        return [
            'success' => true,
            'message' => 'Stock data loaded successfully',
            'data' => [
                'stock' => $processedStock,
                'history' => $processedHistory
            ]
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Failed to load stock data: ' . $e->getMessage(),
            'data' => null
        ];
    }
}

function processStockIn($data, $odoo) {
    try {
        // Get internal stock location
        $internalLocation = $odoo->execute('stock.location', 'search', [
            [['usage', '=', 'internal'], ['name', '=', 'Stock']]
        ]);
        
        // Get supplier location
        $supplierLocation = $odoo->execute('stock.location', 'search', [
            [['usage', '=', 'supplier']]
        ]);
        
        if (!$internalLocation || !$supplierLocation) {
            throw new Exception('Stock locations not found');
        }
        
        // Create stock move
        $moveData = [
            'product_id' => (int)$data['product_id'],
            'product_uom_qty' => (float)$data['quantity'],
            'location_id' => $supplierLocation[0],
            'location_dest_id' => $internalLocation[0],
            'name' => 'Stock In - ' . date('Y-m-d H:i:s'),
            'reference' => $data['reference'] ?: 'STOCK-IN-' . time(),
            'origin' => $data['notes']
        ];
        
        $moveId = $odoo->execute('stock.move', 'create', [$moveData]);
        
        // Confirm and process the move
        $odoo->execute('stock.move', 'action_confirm', [$moveId]);
        $odoo->execute('stock.move', 'action_done', [$moveId]);
        
        return [
            'success' => true,
            'message' => 'Stock added successfully',
            'data' => ['move_id' => $moveId]
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Failed to process stock in: ' . $e->getMessage(),
            'data' => null
        ];
    }
}

function processStockOut($data, $odoo) {
    try {
        // Get internal stock location
        $internalLocation = $odoo->execute('stock.location', 'search', [
            [['usage', '=', 'internal'], ['name', '=', 'Stock']]
        ]);
        
        // Get customer location
        $customerLocation = $odoo->execute('stock.location', 'search', [
            [['usage', '=', 'customer']]
        ]);
        
        if (!$internalLocation || !$customerLocation) {
            throw new Exception('Stock locations not found');
        }
        
        // Check available stock first
        $product = $odoo->execute('product.product', 'read', [
            [(int)$data['product_id']],
            ['qty_available']
        ]);
        
        if ($product[0]['qty_available'] < $data['quantity']) {
            throw new Exception('Insufficient stock available');
        }
        
        // Create stock move
        $moveData = [
            'product_id' => (int)$data['product_id'],
            'product_uom_qty' => (float)$data['quantity'],
            'location_id' => $internalLocation[0],
            'location_dest_id' => $customerLocation[0],
            'name' => 'Stock Out - ' . $data['reason'] . ' - ' . date('Y-m-d H:i:s'),
            'reference' => $data['reference'] ?: 'STOCK-OUT-' . time(),
            'origin' => $data['notes']
        ];
        
        $moveId = $odoo->execute('stock.move', 'create', [$moveData]);
        
        // Confirm and process the move
        $odoo->execute('stock.move', 'action_confirm', [$moveId]);
        $odoo->execute('stock.move', 'action_done', [$moveId]);
        
        return [
            'success' => true,
            'message' => 'Stock removed successfully',
            'data' => ['move_id' => $moveId]
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Failed to process stock out: ' . $e->getMessage(),
            'data' => null
        ];
    }
}