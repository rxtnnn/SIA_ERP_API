<?php
// Set headers to prevent caching
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
?>
<!DOCTYPE html>
<html>
<head>
    <title>API Debug</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
        .endpoint { margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
        h2 { color: #2c3e50; }
        button { padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2980b9; }
    </style>
</head>
<body>
    <h1>API Endpoint Debug</h1>
    
    <div class="endpoint">
        <h2>Dashboard API</h2>
        <button onclick="testEndpoint('api/dashboard.php')">Test Dashboard API</button>
        <pre id="dashboard-result">Click button to test...</pre>
    </div>
    
    <div class="endpoint">
        <h2>Products API</h2>
        <button onclick="testEndpoint('api/products.php')">Test Products API</button>
        <pre id="products-result">Click button to test...</pre>
    </div>
    
    <div class="endpoint">
        <h2>Categories API</h2>
        <button onclick="testEndpoint('api/categories.php')">Test Categories API</button>
        <pre id="categories-result">Click button to test...</pre>
    </div>
    
    <div class="endpoint">
        <h2>Stock API</h2>
        <button onclick="testEndpoint('api/stock.php')">Test Stock API</button>
        <pre id="stock-result">Click button to test...</pre>
    </div>
    
    <script>
        function testEndpoint(url) {
            const resultId = url.split('/')[1].split('.')[0] + '-result';
            document.getElementById(resultId).textContent = 'Loading...';
            
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    document.getElementById(resultId).textContent = JSON.stringify(data, null, 2);
                })
                .catch(error => {
                    document.getElementById(resultId).textContent = 'Error: ' + error.message;
                });
        }
    </script>
</body>
</html>Q