<?php
// Show all errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Load the OdooAPI class
require_once 'lib/OdooAPI.php';
$config = require_once 'config/config.php';

// Create API instance
$odoo = new OdooAPI(
    $config['odoo']['url'],
    $config['odoo']['db'],
    $config['odoo']['username'],
    $config['odoo']['apikey']
);

echo "<pre>";
echo "Testing Odoo Categories\n";
echo "=======================\n\n";

// Check connection
if (!$odoo->isConnected()) {
    echo "Connection failed: " . $odoo->getLastError() . "\n";
    exit;
}

echo "Successfully connected to Odoo!\n\n";

// Try to get all models
echo "Listing available models in Odoo:\n";
$models = $odoo->execute('ir.model', 'search_read', array(array(), array('id', 'name', 'model')));
if ($models !== false && !empty($models)) {
    // Find product category model
    $categoryModel = null;
    foreach ($models as $model) {
        echo "- " . $model['model'] . " (" . $model['name'] . ")\n";
        if (strpos($model['model'], 'categ') !== false || strpos($model['name'], 'categ') !== false) {
            $categoryModel = $model['model'];
            echo "  ** Possible category model found **\n";
        }
    }
    
    if ($categoryModel !== null) {
        echo "\nDetected category model: " . $categoryModel . "\n";
    }
} else {
    echo "Failed to list models: " . $odoo->getLastError() . "\n";
}

// Try different approaches to get categories
echo "\nTrying to get categories using product.category model:\n";
$categories = $odoo->searchRead('product.category', array(), array('id', 'name', 'complete_name', 'parent_id'));
if ($categories !== false && !empty($categories)) {
    echo "Found " . count($categories) . " categories:\n";
    foreach ($categories as $category) {
        echo "- ID: " . $category['id'] . ", Name: " . $category['name'] . "\n";
        if (isset($category['parent_id']) && is_array($category['parent_id'])) {
            echo "  Parent: " . $category['parent_id'][1] . " (ID: " . $category['parent_id'][0] . ")\n";
        }
    }
} else {
    echo "Failed to get categories using product.category: " . $odoo->getLastError() . "\n";
}

// Try getting products to find categories
echo "\nTrying to get categories from products:\n";
$products = $odoo->searchRead('product.product', array(), array('id', 'name', 'categ_id'));
if ($products !== false && !empty($products)) {
    echo "Found " . count($products) . " products:\n";
    $uniqueCategories = array();
    foreach ($products as $product) {
        echo "- ID: " . $product['id'] . ", Name: " . $product['name'] . "\n";
        if (isset($product['categ_id']) && is_array($product['categ_id'])) {
            echo "  Category: " . $product['categ_id'][1] . " (ID: " . $product['categ_id'][0] . ")\n";
            $uniqueCategories[$product['categ_id'][0]] = $product['categ_id'][1];
        }
    }
    
    if (!empty($uniqueCategories)) {
        echo "\nUnique categories from products:\n";
        foreach ($uniqueCategories as $id => $name) {
            echo "- ID: " . $id . ", Name: " . $name . "\n";
        }
    }
} else {
    echo "Failed to get products: " . $odoo->getLastError() . "\n";
}

// Try creating a category directly
echo "\nTrying to create a test category:\n";
try {
    $categoryData = array(
        'name' => 'Test Category ' . time()
    );
    
    $newCategoryId = $odoo->create('product.category', $categoryData);
    if ($newCategoryId !== false) {
        echo "Successfully created new category with ID: " . $newCategoryId . "\n";
    } else {
        echo "Failed to create category: " . $odoo->getLastError() . "\n";
    }
} catch (Exception $e) {
    echo "Exception creating category: " . $e->getMessage() . "\n";
}

echo "</pre>";