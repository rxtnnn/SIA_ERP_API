$(document).ready(function () {
    // Navigation functionality
    $('#dashboard-link').click(function (e) {
        e.preventDefault();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
        $('#dashboard-section').show();
        $('#products-section, #stock-section').hide();
        loadDashboardData();
    });

    $('#products-link').click(function (e) {
        e.preventDefault();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
        $('#products-section').show();
        $('#dashboard-section, #stock-section').hide();
        loadProducts();
    });

    $('#stock-link').click(function (e) {
        e.preventDefault();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
        $('#stock-section').show();
        $('#dashboard-section, #products-section').hide();
        loadStockData();
    });

    // Load initial data
    loadDashboardData();
    loadCategories();

    // Refresh button functionality
    $('#refresh-btn').click(function () {
        loadDashboardData();
    });

    // Add product functionality
    $('#save-product-btn').click(function () {
        saveProduct();
    });

    // Stock management functionality
    $('#save-stock-in-btn').click(function () {
        processStockIn();
    });

    $('#save-stock-out-btn').click(function () {
        processStockOut();
    });

    // Product search functionality
    $('#product-search').on('keyup', function () {
        const searchTerm = $(this).val().toLowerCase();
        filterProducts(searchTerm);
    });
});

// Functions to interact with the API
function loadDashboardData() {
    // Show loading spinner
    $('#products-count, #stock-count, #low-stock-count, #orders-count').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#activities-table').html('<tr><td colspan="5" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading activities...</td></tr>');

    // Fetch dashboard data from the API
    $.ajax({
        url: 'api/dashboard.php',
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                const data = response.data;

                // Update dashboard counts
                $('#products-count').text(data.totalProducts);
                $('#stock-count').text(data.totalStock);
                $('#low-stock-count').text(data.lowStockItems);
                $('#orders-count').text(data.pendingOrders);

                // Update activities table
                if (data.recentActivities && data.recentActivities.length > 0) {
                    let activitiesHtml = '';

                    data.recentActivities.forEach(activity => {
                        activitiesHtml += `
                                    <tr>
                                        <td>${activity.date}</td>
                                        <td>${activity.product}</td>
                                        <td>${activity.action}</td>
                                        <td>${activity.quantity}</td>
                                        <td>${activity.user}</td>
                                    </tr>
                                `;
                    });

                    $('#activities-table').html(activitiesHtml);
                } else {
                    $('#activities-table').html('<tr><td colspan="5" class="text-center">No recent activities</td></tr>');
                }
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function () {
            alert('Error: Could not connect to the server');
            $('#products-count, #stock-count, #low-stock-count, #orders-count').text('N/A');
            $('#activities-table').html('<tr><td colspan="5" class="text-center">Failed to load activities</td></tr>');
        }
    });
}

// Fixed loadProducts function
function loadProducts(page = 1) {
    // Show loading spinner
    $('#products-table').html('<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading products...</td></tr>');
    
    // Fetch products from the API
    $.ajax({
        url: 'api/products.php',
        type: 'GET',
        data: { page: page },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const data = response.data;
                
                if (data.products && data.products.length > 0) {
                    let productsHtml = '';
                    
                    data.products.forEach(product => {
                        // Determine stock status
                        let statusClass = 'success';
                        let statusText = 'In Stock';
                        
                        if (product.stock <= 0) {
                            statusClass = 'danger';
                            statusText = 'Out of Stock';
                        } else if (product.stock <= product.minStock) {
                            statusClass = 'warning';
                            statusText = 'Low Stock';
                        }
                        
                        productsHtml += `
                            <tr>
                                <td>${product.id}</td>
                                <td>${product.name}</td>
                                <td>${product.category}</td>
                                <td>$${parseFloat(product.price).toFixed(2)}</td>
                                <td>${product.stock}</td>
                                <td><span class="badge bg-${statusClass}">${statusText}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-info me-1" onclick="viewProduct(${product.id})">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-primary me-1" onclick="editProduct(${product.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                    
                    $('#products-table').html(productsHtml);
                    
                    // Update pagination
                    updatePagination(data.currentPage, data.totalPages);
                } else {
                    $('#products-table').html('<tr><td colspan="7" class="text-center">No products found</td></tr>');
                }
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function() {
            alert('Error: Could not connect to the server');
            $('#products-table').html('<tr><td colspan="7" class="text-center">Failed to load products</td></tr>');
        }
    });
}

// Fixed loadStockData function
function loadStockData() {
    // Show loading spinner
    $('#current-stock-table').html('<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading stock data...</td></tr>');
    $('#stock-history-table').html('<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading history...</td></tr>');
    
    // Load products for the stock in/out modals
    loadProductsForStock();
    
    // Fetch current stock from the API
    $.ajax({
        url: 'api/stock.php',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const data = response.data;
                
                if (data.stock && data.stock.length > 0) {
                    let stockHtml = '';
                    
                    data.stock.forEach(item => {
                        // Determine stock status
                        let statusClass = 'success';
                        let statusText = 'In Stock';
                        
                        if (item.currentStock <= 0) {
                            statusClass = 'danger';
                            statusText = 'Out of Stock';
                        } else if (item.currentStock <= item.minStock) {
                            statusClass = 'warning';
                            statusText = 'Low Stock';
                        }
                        
                        stockHtml += `
                            <tr>
                                <td>${item.productId}</td>
                                <td>${item.productName}</td>
                                <td>${item.currentStock}</td>
                                <td>${item.minStock}</td>
                                <td><span class="badge bg-${statusClass}">${statusText}</span></td>
                                <td>${item.lastUpdated}</td>
                                <td>
                                    <button class="btn btn-sm btn-success me-1" onclick="stockIn(${item.productId})">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                    <button class="btn btn-sm btn-warning me-1" onclick="stockOut(${item.productId})">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <button class="btn btn-sm btn-info" onclick="viewStockHistory(${item.productId})">
                                        <i class="fas fa-history"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                    
                    $('#current-stock-table').html(stockHtml);
                } else {
                    $('#current-stock-table').html('<tr><td colspan="7" class="text-center">No stock data found</td></tr>');
                }
                
                // Handle stock history
                if (data.history && data.history.length > 0) {
                    let historyHtml = '';
                    
                    data.history.forEach(entry => {
                        // Determine type class
                        let typeClass = entry.type === 'in' ? 'success' : 'warning';
                        
                        historyHtml += `
                            <tr>
                                <td>${entry.date}</td>
                                <td>${entry.product}</td>
                                <td><span class="badge bg-${typeClass}">${entry.type === 'in' ? 'Stock In' : 'Stock Out'}</span></td>
                                <td>${entry.quantity}</td>
                                <td>${entry.reference}</td>
                                <td>${entry.user}</td>
                            </tr>
                        `;
                    });
                    
                    $('#stock-history-table').html(historyHtml);
                } else {
                    $('#stock-history-table').html('<tr><td colspan="6" class="text-center">No history found</td></tr>');
                }
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function() {
            alert('Error: Could not connect to the server');
            $('#current-stock-table').html('<tr><td colspan="7" class="text-center">Failed to load stock data</td></tr>');
            $('#stock-history-table').html('<tr><td colspan="6" class="text-center">Failed to load history</td></tr>');
        }
    });
}