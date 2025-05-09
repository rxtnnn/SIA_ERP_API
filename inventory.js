$(document).ready(function () {
    // Fix for section visibility on initial load - hide all non-dashboard sections
    $('#products-section, #stock-section').hide();
    $('#dashboard-section').show();

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
        console.log("Products link clicked");
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

    // Make sure modal functionality is properly initialized
    var addProductModal = new bootstrap.Modal(document.getElementById('addProductModal'));
    var stockInModal = new bootstrap.Modal(document.getElementById('stockInModal'));
    var stockOutModal = new bootstrap.Modal(document.getElementById('stockOutModal'));

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

    // For demonstration, populate with sample data
    setTimeout(function() {
        $('#products-count').text('45');
        $('#stock-count').text('1,250');
        $('#low-stock-count').text('5');
        $('#orders-count').text('12');

        let activitiesHtml = `
            <tr>
                <td>2025-05-10 09:15</td>
                <td>Laptop Dell XPS 15</td>
                <td>Stock In</td>
                <td>10</td>
                <td>Admin</td>
            </tr>
            <tr>
                <td>2025-05-10 08:30</td>
                <td>iPhone 15 Pro</td>
                <td>Stock Out</td>
                <td>2</td>
                <td>Admin</td>
            </tr>
            <tr>
                <td>2025-05-09 17:45</td>
                <td>Samsung Galaxy S24</td>
                <td>Stock In</td>
                <td>15</td>
                <td>Admin</td>
            </tr>
        `;
        $('#activities-table').html(activitiesHtml);
    }, 500);

    // Actual API call (commented out until API is ready)
    /*
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
    */
}

function loadProducts(page = 1) {
    // Show loading spinner
    $('#products-table').html('<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading products...</td></tr>');
    
    // For demonstration, populate with sample data
    setTimeout(function() {
        let productsHtml = `
            <tr>
                <td>1</td>
                <td>Laptop Dell XPS 15</td>
                <td>Computers</td>
                <td>$1,299.99</td>
                <td>25</td>
                <td><span class="badge bg-success">In Stock</span></td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="viewProduct(1)">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary me-1" onclick="editProduct(1)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(1)">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <tr>
                <td>2</td>
                <td>iPhone 15 Pro</td>
                <td>Smartphones</td>
                <td>$999.99</td>
                <td>3</td>
                <td><span class="badge bg-warning">Low Stock</span></td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="viewProduct(2)">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary me-1" onclick="editProduct(2)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(2)">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <tr>
                <td>3</td>
                <td>Samsung Galaxy S24</td>
                <td>Smartphones</td>
                <td>$899.99</td>
                <td>15</td>
                <td><span class="badge bg-success">In Stock</span></td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="viewProduct(3)">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary me-1" onclick="editProduct(3)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(3)">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        $('#products-table').html(productsHtml);
        
        // Update pagination
        updatePagination(1, 3);
    }, 500);
    
    // Actual API call (commented out until API is ready)
    /*
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
    */
}

function loadStockData() {
    // Show loading spinner
    $('#current-stock-table').html('<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading stock data...</td></tr>');
    $('#stock-history-table').html('<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading history...</td></tr>');
    
    // Load products for the stock in/out modals
    loadProductsForStock();
    
    // For demonstration, populate with sample data
    setTimeout(function() {
        let stockHtml = `
            <tr>
                <td>1</td>
                <td>Laptop Dell XPS 15</td>
                <td>25</td>
                <td>5</td>
                <td><span class="badge bg-success">In Stock</span></td>
                <td>2025-05-10 09:15</td>
                <td>
                    <button class="btn btn-sm btn-success me-1" onclick="stockIn(1)">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="stockOut(1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="viewStockHistory(1)">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            </tr>
            <tr>
                <td>2</td>
                <td>iPhone 15 Pro</td>
                <td>3</td>
                <td>5</td>
                <td><span class="badge bg-warning">Low Stock</span></td>
                <td>2025-05-10 08:30</td>
                <td>
                    <button class="btn btn-sm btn-success me-1" onclick="stockIn(2)">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="stockOut(2)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="viewStockHistory(2)">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            </tr>
            <tr>
                <td>3</td>
                <td>Samsung Galaxy S24</td>
                <td>15</td>
                <td>5</td>
                <td><span class="badge bg-success">In Stock</span></td>
                <td>2025-05-09 17:45</td>
                <td>
                    <button class="btn btn-sm btn-success me-1" onclick="stockIn(3)">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="stockOut(3)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="viewStockHistory(3)">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            </tr>
        `;
        $('#current-stock-table').html(stockHtml);
        
        let historyHtml = `
            <tr>
                <td>2025-05-10 09:15</td>
                <td>Laptop Dell XPS 15</td>
                <td><span class="badge bg-success">Stock In</span></td>
                <td>10</td>
                <td>PO-12345</td>
                <td>Admin</td>
            </tr>
            <tr>
                <td>2025-05-10 08:30</td>
                <td>iPhone 15 Pro</td>
                <td><span class="badge bg-warning">Stock Out</span></td>
                <td>2</td>
                <td>SO-67890</td>
                <td>Admin</td>
            </tr>
            <tr>
                <td>2025-05-09 17:45</td>
                <td>Samsung Galaxy S24</td>
                <td><span class="badge bg-success">Stock In</span></td>
                <td>15</td>
                <td>PO-54321</td>
                <td>Admin</td>
            </tr>
        `;
        $('#stock-history-table').html(historyHtml);
    }, 500);
    
    // Actual API call (commented out until API is ready)
    /*
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
    */
}

function loadCategories() {
    // For demonstration, populate with sample data
    setTimeout(function() {
        let options = `
            <option value="">Select Category</option>
            <option value="1">Computers</option>
            <option value="2">Smartphones</option>
            <option value="3">Accessories</option>
            <option value="4">Networking</option>
            <option value="5">Storage</option>
        `;
        $('#product-category').html(options);
    }, 300);
    
    // Actual API call (commented out until API is ready)
    /*
    $.ajax({
        url: 'api/categories.php',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const categories = response.data.categories;
                let options = '<option value="">Select Category</option>';
                
                categories.forEach(category => {
                    options += `<option value="${category.id}">${category.name}</option>`;
                });
                
                $('#product-category').html(options);
            }
        }
    });
    */
}

function loadProductsForStock() {
    // For demonstration, populate with sample data
    setTimeout(function() {
        let options = `
            <option value="">Select Product</option>
            <option value="1">Laptop Dell XPS 15 (Current Stock: 25)</option>
            <option value="2">iPhone 15 Pro (Current Stock: 3)</option>
            <option value="3">Samsung Galaxy S24 (Current Stock: 15)</option>
        `;
        $('#stock-in-product, #stock-out-product').html(options);
    }, 300);
    
    // Actual API call (commented out until API is ready)
    /*
    $.ajax({
        url: 'api/products.php',
        type: 'GET',
        data: { limit: 100 }, // Get a larger list for the dropdown
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const products = response.data.products;
                let options = '<option value="">Select Product</option>';
                
                products.forEach(product => {
                    options += `<option value="${product.id}">${product.name} (Current Stock: ${product.stock})</option>`;
                });
                
                $('#stock-in-product, #stock-out-product').html(options);
            }
        }
    });
    */
}

function saveProduct() {
    const product = {
        name: $('#product-name').val(),
        category_id: $('#product-category').val(),
        price: $('#product-price').val(),
        cost: $('#product-cost').val(),
        initial_stock: $('#initial-stock').val(),
        min_stock: $('#min-stock').val(),
        description: $('#product-description').val()
    };
    
    // Validate form
    if (!product.name || !product.category_id || !product.price || !product.cost || product.initial_stock === '' || product.min_stock === '') {
        alert('Please fill in all required fields');
        return;
    }
    
    // For demonstration, simulate success
    alert('Product added successfully!');
    $('#addProductModal').modal('hide');
    $('#add-product-form')[0].reset();
    loadProducts();
    
    // Actual API call (commented out until API is ready)
    /*
    $.ajax({
        url: 'api/products.php',
        type: 'POST',
        data: product,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Product added successfully!');
                $('#addProductModal').modal('hide');
                $('#add-product-form')[0].reset();
                loadProducts();
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function() {
            alert('Error: Could not connect to the server');
        }
    });
    */
}

function processStockIn() {
    const stockIn = {
        product_id: $('#stock-in-product').val(),
        quantity: $('#stock-in-quantity').val(),
        reference: $('#stock-in-reference').val(),
        notes: $('#stock-in-notes').val()
    };
    
    // Validate form
    if (!stockIn.product_id || !stockIn.quantity || stockIn.quantity < 1) {
        alert('Please select a product and enter a valid quantity');
        return;
    }
    
    // For demonstration, simulate success
    alert('Stock updated successfully!');
    $('#stockInModal').modal('hide');
    $('#stock-in-form')[0].reset();
    
    // Reload data based on current active tab
    if ($('#stock-section').is(':visible')) {
        loadStockData();
    } else if ($('#dashboard-section').is(':visible')) {
        loadDashboardData();
    }
    
    // Actual API call (commented out until API is ready)
    /*
    $.ajax({
        url: 'api/stock.php',
        type: 'POST',
        data: {
            action: 'in',
            ...stockIn
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Stock updated successfully!');
                $('#stockInModal').modal('hide');
                $('#stock-in-form')[0].reset();
                
                // Reload data based on current active tab
                if ($('#stock-section').is(':visible')) {
                    loadStockData();
                } else if ($('#dashboard-section').is(':visible')) {
                    loadDashboardData();
                }
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function() {
            alert('Error: Could not connect to the server');
        }
    });
    */
}

function processStockOut() {
    const stockOut = {
        product_id: $('#stock-out-product').val(),
        quantity: $('#stock-out-quantity').val(),
        reason: $('#stock-out-reason').val(),
        reference: $('#stock-out-reference').val(),
        notes: $('#stock-out-notes').val()
    };
    
    // Validate form
    if (!stockOut.product_id || !stockOut.quantity || stockOut.quantity < 1) {
        alert('Please select a product and enter a valid quantity');
        return;
    }
    
    // For demonstration, simulate success
    alert('Stock updated successfully!');
    $('#stockOutModal').modal('hide');
    $('#stock-out-form')[0].reset();
    
    // Reload data based on current active tab
    if ($('#stock-section').is(':visible')) {
        loadStockData();
    } else if ($('#dashboard-section').is(':visible')) {
        loadDashboardData();
    }
    
    // Actual API call (commented out until API is ready)
    /*
    $.ajax({
        url: 'api/stock.php',
        type: 'POST',
        data: {
            action: 'out',
            ...stockOut
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Stock updated successfully!');
                $('#stockOutModal').modal('hide');
                $('#stock-out-form')[0].reset();
                
                // Reload data based on current active tab
                if ($('#stock-section').is(':visible')) {
                    loadStockData();
                } else if ($('#dashboard-section').is(':visible')) {
                    loadDashboardData();
                }
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function() {
            alert('Error: Could not connect to the server');
        }
    });
    */
}

function updatePagination(currentPage, totalPages) {
    let paginationHtml = '';
    
    // Previous button
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadProducts(${currentPage - 1}); return false;">Previous</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadProducts(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadProducts(${currentPage + 1}); return false;">Next</a>
        </li>
    `;
    
    $('#products-pagination').html(paginationHtml);
}

function filterProducts(searchTerm) {
    // Filter the products table based on search term
    $("#products-table tr").filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(searchTerm) > -1);
    });
}

// These functions would be implemented for the editing, viewing, and deleting functionality
function viewProduct(id) {
    // Fetch product details and display in a modal
    alert('View product ' + id + ' - This would show a modal with product details');
}

function editProduct(id) {
    // Fetch product details and populate the edit form
    alert('Edit product ' + id + ' - This would populate a form with product details');
}

function deleteProduct(id) {
    // Confirm and delete product
    if (confirm('Are you sure you want to delete this product?')) {
        alert('Product deleted successfully!');
        loadProducts(); // Reload products list
        
        // Actual API call (commented out until API is ready)
        /*
        $.ajax({
            url: 'api/products.php',
            type: 'DELETE',
            data: { id: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('Product deleted successfully!');
                    loadProducts();
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function() {
                alert('Error: Could not connect to the server');
            }
        });
        */
    }
}

function stockIn(productId) {
    // Set the product in the stock in modal and show it
    $('#stock-in-product').val(productId);
    $('#stockInModal').modal('show');
}

function stockOut(productId) {
    // Set the product in the stock out modal and show it
    $('#stock-out-product').val(productId);
    $('#stockOutModal').modal('show');
}

function viewStockHistory(productId) {
    // Show the stock history tab filtered by the selected product
    $('#stock-link').click();
    $('#history-tab').click();
    // This would filter the history table for the specific product
    alert('Viewing stock history for product ' + productId);
}