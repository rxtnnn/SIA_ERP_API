// Test if the file is loaded
console.log("Inventory.js loaded successfully");

$(document).ready(function () {
    console.log("Document ready event fired");
    
    // Fix for section visibility on initial load - hide all non-dashboard sections
    $('#products-section, #stock-section').hide();
    $('#dashboard-section').show();

    // Initialize all Bootstrap modals
    var addProductModal = new bootstrap.Modal(document.getElementById('addProductModal'));
    var stockInModal = new bootstrap.Modal(document.getElementById('stockInModal'));
    var stockOutModal = new bootstrap.Modal(document.getElementById('stockOutModal'));
    var addCategoryModal = new bootstrap.Modal(document.getElementById('addCategoryModal'));

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
        // Ensure categories are loaded when viewing products
        loadCategories();
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
    loadCategories();  // Make sure categories are loaded on page load

    // Add event handlers for modal open to ensure categories are loaded
    $('#addProductModal').on('show.bs.modal', function() {
        console.log("Product modal opening - loading categories");
        loadCategories();
    });

    // Make sure the Add Product button triggers a category reload
    $('[data-bs-target="#addProductModal"]').click(function() {
        console.log("Add Product button clicked - loading categories");
        loadCategories(); 
    });

    // Refresh button functionality
    $('#refresh-btn').click(function () {
        loadDashboardData();
    });

    // Add product functionality
    $('#save-product-btn').click(function () {
        saveProduct();
    });

    // Add category functionality
    $('#add-category-btn').click(function() {
        console.log("Add category button clicked");
        // Load categories before showing the modal
        loadCategories();
        $('#addCategoryModal').modal('show');
    });
    
    $('#save-category-btn').click(function() {
        console.log("Save category button clicked");
        saveCategory();
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
    
    // Check if elements exist for debugging
    console.log("jQuery loaded correctly");
    console.log("product-category exists:", $('#product-category').length > 0);
    console.log("parent-category exists:", $('#parent-category').length > 0);
});

// Functions to interact with the API
function loadDashboardData() {
    // Show loading spinner
    $('#products-count, #stock-count, #low-stock-count, #orders-count').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#activities-table').html('<tr><td colspan="5" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading activities...</td></tr>');

    // API call to get dashboard data
    $.ajax({
        url: 'api/dashboard.php',
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            console.log("Dashboard API response:", response);
            if (response.success) {
                const data = response.data;

                // Update dashboard counts
                $('#products-count').text(data.totalProducts != null ? data.totalProducts : 0);
                $('#stock-count').text(data.totalStock != null ? data.totalStock : 0);
                $('#low-stock-count').text(data.lowStockItems != null ? data.lowStockItems : 0);
                $('#orders-count').text(data.pendingOrders != null ? data.pendingOrders : 0);

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
                console.error("API error:", response.message);
                $('#products-count, #stock-count, #low-stock-count, #orders-count').text('0');
                $('#activities-table').html('<tr><td colspan="5" class="text-center">Failed to load activities</td></tr>');
            }
        },
        error: function (xhr, status, error) {
            console.error("AJAX error:", status, error);
            $('#products-count, #stock-count, #low-stock-count, #orders-count').text('0');
            $('#activities-table').html('<tr><td colspan="5" class="text-center">Failed to load activities</td></tr>');
        }
    });
}

function loadProducts(page = 1) {
    // Show loading spinner
    $('#products-table').html('<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading products...</td></tr>');
    
    // API call to get products
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
                        } else if (product.stock <= product.min_stock) {
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
                    updatePagination(data.pagination.page, data.pagination.pages);
                } else {
                    $('#products-table').html('<tr><td colspan="7" class="text-center">No products found</td></tr>');
                    // Clear pagination if no products
                    $('#products-pagination').html('');
                }
            } else {
                $('#products-table').html('<tr><td colspan="7" class="text-center">Failed to load products</td></tr>');
                $('#products-pagination').html('');
            }
        },
        error: function() {
            $('#products-table').html('<tr><td colspan="7" class="text-center">Failed to load products</td></tr>');
            $('#products-pagination').html('');
        }
    });
}

function loadStockData() {
    // Show loading spinner
    $('#current-stock-table').html('<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading stock data...</td></tr>');
    $('#stock-history-table').html('<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading history...</td></tr>');
    
    // Load products for the stock in/out modals
    loadProductsForStock();
    
    // Get current stock data
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
                        
                        if (item.quantity <= 0) {
                            statusClass = 'danger';
                            statusText = 'Out of Stock';
                        } else if (item.quantity <= 5) { // Using a default min stock of 5
                            statusClass = 'warning';
                            statusText = 'Low Stock';
                        }
                        
                        stockHtml += `
                            <tr>
                                <td>${item.product_id}</td>
                                <td>${item.product_name}</td>
                                <td>${item.quantity}</td>
                                <td>5</td>
                                <td><span class="badge bg-${statusClass}">${statusText}</span></td>
                                <td>${new Date().toISOString().split('T')[0]}</td>
                                <td>
                                    <button class="btn btn-sm btn-success me-1" onclick="stockIn(${item.product_id})">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                    <button class="btn btn-sm btn-warning me-1" onclick="stockOut(${item.product_id})">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <button class="btn btn-sm btn-info" onclick="viewStockHistory(${item.product_id})">
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
                                <td>${entry.reference || 'N/A'}</td>
                                <td>${entry.user || 'System'}</td>
                            </tr>
                        `;
                    });
                    
                    $('#stock-history-table').html(historyHtml);
                } else {
                    $('#stock-history-table').html('<tr><td colspan="6" class="text-center">No history found</td></tr>');
                }
            } else {
                $('#current-stock-table').html('<tr><td colspan="7" class="text-center">Failed to load stock data</td></tr>');
                $('#stock-history-table').html('<tr><td colspan="6" class="text-center">Failed to load history</td></tr>');
            }
        },
        error: function() {
            $('#current-stock-table').html('<tr><td colspan="7" class="text-center">Failed to load stock data</td></tr>');
            $('#stock-history-table').html('<tr><td colspan="6" class="text-center">Failed to load history</td></tr>');
        }
    });
}

function loadCategories() {
    console.log("Loading categories from Odoo");
    
    // Show loading indicator
    if ($('#product-category').length > 0) {
        $('#product-category').html('<option value="">Loading categories...</option>');
    }
    
    if ($('#parent-category').length > 0) {
        $('#parent-category').html('<option value="">Loading categories...</option>');
    }
    
    // Get categories from API with no-cache settings
    $.ajax({
        url: 'api/categories.php',
        type: 'GET',
        dataType: 'json',
        cache: false,
        headers: { 'Cache-Control': 'no-cache' },
        success: function(response) {
            console.log("Categories API response:", response);
            
            if (response.success && response.data && response.data.categories) {
                const categories = response.data.categories;
                console.log("Found " + categories.length + " categories");
                
                // Create HTML options string
                let productOptions = '<option value="">Select Category</option>';
                let parentOptions = '<option value="">None (Top Level)</option>';
                
                // Add each category as an option
                for (let i = 0; i < categories.length; i++) {
                    const cat = categories[i];
                    productOptions += '<option value="' + cat.id + '">' + cat.name + '</option>';
                    parentOptions += '<option value="' + cat.id + '">' + cat.name + '</option>';
                    console.log("Added category: " + cat.id + " - " + cat.name);
                }
                
                // Update the dropdowns if they exist
                if ($('#product-category').length > 0) {
                    document.getElementById('product-category').innerHTML = productOptions;
                    console.log("Updated product-category dropdown");
                } else {
                    console.error("product-category element not found");
                }
                
                if ($('#parent-category').length > 0) {
                    document.getElementById('parent-category').innerHTML = parentOptions;
                    console.log("Updated parent-category dropdown");
                } else {
                    console.error("parent-category element not found");
                }
            } else {
                console.log("No categories found or error in API response");
                
                if ($('#product-category').length > 0) {
                    $('#product-category').html('<option value="">No categories available</option>');
                }
                
                if ($('#parent-category').length > 0) {
                    $('#parent-category').html('<option value="">None (Top Level)</option>');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error("Error loading categories:", error);
            console.error("Status:", status);
            console.error("Response text:", xhr.responseText);
            
            if ($('#product-category').length > 0) {
                $('#product-category').html('<option value="">Error loading categories</option>');
            }
            
            if ($('#parent-category').length > 0) {
                $('#parent-category').html('<option value="">None (Top Level)</option>');
            }
        }
    });
}

function loadProductsForStock() {
    // Load products for stock in/out dropdowns with actual stock quantities
    $.ajax({
        url: 'api/stock.php',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success && response.data && response.data.stock) {
                const stockData = response.data.stock;
                let options = '<option value="">Select Product</option>';
                
                // Create a map of product ID to stock quantity for quick lookup
                const stockByProductId = {};
                stockData.forEach(item => {
                    stockByProductId[item.product_id] = item.quantity;
                });
                
                // Now get product details
                $.ajax({
                    url: 'api/products.php',
                    type: 'GET',
                    data: { limit: 100 },
                    dataType: 'json',
                    success: function(prodResponse) {
                        if (prodResponse.success && prodResponse.data && prodResponse.data.products) {
                            const products = prodResponse.data.products;
                            
                            if (products && products.length > 0) {
                                products.forEach(product => {
                                    // Get actual stock quantity from our map, or use the product's stock property
                                    const actualStock = stockByProductId[product.id] !== undefined ? 
                                                      stockByProductId[product.id] : product.stock;
                                    
                                    options += `<option value="${product.id}">${product.name}</option>`;
                                });
                            }
                            
                            $('#stock-in-product, #stock-out-product').html(options);
                        } else {
                            $('#stock-in-product, #stock-out-product').html('<option value="">No products available</option>');
                        }
                    },
                    error: function() {
                        $('#stock-in-product, #stock-out-product').html('<option value="">Error loading products</option>');
                    }
                });
            } else {
                // If stock data failed, fall back to just loading products
                $.ajax({
                    url: 'api/products.php',
                    type: 'GET',
                    data: { limit: 100 },
                    dataType: 'json',
                    success: function(response) {
                        if (response.success && response.data && response.data.products) {
                            const products = response.data.products;
                            let options = '<option value="">Select Product</option>';
                            
                            if (products && products.length > 0) {
                                products.forEach(product => {
                                    options += `<option value="${product.id}">${product.name}</option>`;
                                });
                            }
                            
                            $('#stock-in-product, #stock-out-product').html(options);
                        } else {
                            $('#stock-in-product, #stock-out-product').html('<option value="">No products available</option>');
                        }
                    },
                    error: function() {
                        $('#stock-in-product, #stock-out-product').html('<option value="">Error loading products</option>');
                    }
                });
            }
        },
        error: function() {
            // Fall back to just loading products
            $.ajax({
                url: 'api/products.php',
                type: 'GET',
                data: { limit: 100 },
                dataType: 'json',
                success: function(response) {
                    if (response.success && response.data && response.data.products) {
                        const products = response.data.products;
                        let options = '<option value="">Select Product</option>';
                        
                        if (products && products.length > 0) {
                            products.forEach(product => {
                                options += `<option value="${product.id}">${product.name}</option>`;
                            });
                        }
                        
                        $('#stock-in-product, #stock-out-product').html(options);
                    } else {
                        $('#stock-in-product, #stock-out-product').html('<option value="">No products available</option>');
                    }
                },
                error: function() {
                    $('#stock-in-product, #stock-out-product').html('<option value="">Error loading products</option>');
                }
            });
        }
    });
}

function saveProduct() {
    const product = {
        name: $('#product-name').val(),
        category_id: $('#product-category').val(),
        price: $('#product-price').val(),
        cost: $('#product-cost').val(),
        initial_stock: $('#initial-stock').val(),
        description: $('#product-description').val(),
        track_inventory: $('#track-inventory').is(':checked')
    };
    // Validate form
    if (!product.name || !product.category_id || !product.price || !product.cost) {
        alert('Please fill in all required fields');
        return;
    }
    
    console.log("Saving product:", product);
    
    // Submit product data to API
    $.ajax({
        url: 'api/products.php',
        type: 'POST',
        data: JSON.stringify(product),
        contentType: 'application/json',
        dataType: 'json',
        success: function(response) {
            console.log("API response:", response);
            if (response.success) {
                alert('Product added successfully!');
                $('#addProductModal').modal('hide');
                $('#add-product-form')[0].reset();
                loadProducts();
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX error:", status, error);
            console.error("Response:", xhr.responseText);
            alert('Error: Could not connect to the server. See console for details.');
        }
    });
}

function saveCategory() {
    const category = {
        name: $('#category-name').val(),
        parent_id: $('#parent-category').val() || 0
    };
    
    // Validate form
    if (!category.name) {
        alert('Please enter a category name');
        return;
    }
    
    console.log("Saving category:", category);
    
    // Submit category data to API
    $.ajax({
        url: 'api/categories.php',
        type: 'POST',
        data: JSON.stringify(category),
        contentType: 'application/json',
        dataType: 'json',
        success: function(response) {
            console.log("API response:", response);
            if (response.success) {
                alert('Category added successfully!');
                
                // Hide modal and reset form
                $('#addCategoryModal').modal('hide');
                $('#add-category-form')[0].reset();
                
                // Reload categories immediately and then again after a delay
                loadCategories();
                
                // Reload again after a delay to ensure server has updated
                setTimeout(function() {
                    loadCategories();
                }, 1000);
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX error:", status, error);
            console.error("Response:", xhr.responseText);
            alert('Error: Could not connect to the server. See console for details.');
        }
    });
}

function processStockIn() {
    const stockIn = {
        product_id: $('#stock-in-product').val(),
        quantity: $('#stock-in-quantity').val(),
        reference: $('#stock-in-reference').val(),
        notes: $('#stock-in-notes').val(),
        action: 'in'
    };
    
    // Validate form
    if (!stockIn.product_id || !stockIn.quantity || stockIn.quantity < 1) {
        alert('Please select a product and enter a valid quantity');
        return;
    }
    
    // Submit stock data to API
    $.ajax({
        url: 'api/stock.php',
        type: 'POST',
        data: JSON.stringify(stockIn),
        contentType: 'application/json',
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
}

function processStockOut() {
    const stockOut = {
        product_id: $('#stock-out-product').val(),
        quantity: $('#stock-out-quantity').val(),
        reason: $('#stock-out-reason').val(),
        reference: $('#stock-out-reference').val(),
        notes: $('#stock-out-notes').val(),
        action: 'out'
    };
    
    // Validate form
    if (!stockOut.product_id || !stockOut.quantity || stockOut.quantity < 1) {
        alert('Please select a product and enter a valid quantity');
        return;
    }
    
    // Submit stock data to API
    $.ajax({
        url: 'api/stock.php',
        type: 'POST',
        data: JSON.stringify(stockOut),
        contentType: 'application/json',
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
}

function updatePagination(currentPage, totalPages) {
    let paginationHtml = '';
    
    if (!totalPages || totalPages <= 0) {
        // No pages, clear pagination
        $('#products-pagination').html('');
        return;
    }
    
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
    // Fetch product details from API
    $.ajax({
        url: 'api/products.php',
        type: 'GET',
        data: { id: id },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const product = response.data.product;
                alert(`
                    Product: ${product.name}
                    Category: ${product.category || 'N/A'}
                    Price: $${product.price}
                    Stock: ${product.stock}
                    Description: ${product.description || 'N/A'}
                `);
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function() {
            alert('Error: Could not connect to the server');
        }
    });
}

function editProduct(id) {
    // Fetch product details and populate form
    $.ajax({
        url: 'api/products.php',
        type: 'GET',
        data: { id: id },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const product = response.data.product;
                
                // This is simplified - in a real app, you'd populate a form and show a modal
                const updatedName = prompt('Enter new name:', product.name);
                if (updatedName) {
                    // Update product
                    $.ajax({
                        url: 'api/products.php',
                        type: 'PUT',
                        data: JSON.stringify({
                            id: id,
                            name: updatedName
                        }),
                        contentType: 'application/json',
                        dataType: 'json',
                        success: function(updateResponse) {
                            if (updateResponse.success) {
                                alert('Product updated successfully!');
                                loadProducts();
                            } else {
                                alert('Error: ' + updateResponse.message);
                            }
                        },
                        error: function() {
                            alert('Error: Could not connect to the server');
                        }
                    });
                }
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function() {
            alert('Error: Could not connect to the server');
        }
    });
}

function deleteProduct(id) {
    // Confirm and delete product
    if (confirm('Are you sure you want to delete this product?')) {
        $.ajax({
            url: 'api/products.php?id=' + id,
            type: 'DELETE',
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
    // Filter stock history for specific product
    $.ajax({
        url: 'api/stock.php',
        type: 'GET',
        data: { history: 1, product_id: productId },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                // Show stock history tab
                $('#stock-link').click();
                $('#history-tab').click();
                
                if (response.data.history && response.data.history.length > 0) {
                    let historyHtml = '';
                    
                    response.data.history.forEach(entry => {
                        // Determine type class
                        let typeClass = entry.type === 'in' ? 'success' : 'warning';
                        
                        historyHtml += `
                            <tr>
                                <td>${entry.date}</td>
                                <td>${entry.product}</td>
                                <td><span class="badge bg-${typeClass}">${entry.type === 'in' ? 'Stock In' : 'Stock Out'}</span></td>
                                <td>${entry.quantity}</td>
                                <td>${entry.reference || 'N/A'}</td>
                                <td>${entry.user || 'System'}</td>
                            </tr>
                        `;
                    });
                    
                    $('#stock-history-table').html(historyHtml);
                } else {
                    $('#stock-history-table').html(`<tr><td colspan="6" class="text-center">No history found for product ID ${productId}</td></tr>`);
                }
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function() {
            alert('Error: Could not connect to the server');
        }
    });
}

// Add a direct test function for debugging
function testCategoriesAPI() {
    console.log("Direct test of categories API");
    
    // Make a direct fetch to the API
    fetch('api/categories.php')
        .then(response => response.text())
        .then(text => {
            console.log("Raw API response:", text);
            
            try {
                const data = JSON.parse(text);
                console.log("Parsed API response:", data);
                
                if (data.success && data.data && data.data.categories) {
                    console.log("Categories found:", data.data.categories.length);
                    
                    // Try to update the dropdowns
                    if (document.getElementById('product-category')) {
                        let options = '<option value="">Select Category</option>';
                        data.data.categories.forEach(cat => {
                            options += `<option value="${cat.id}">${cat.name}</option>`;
                        });
                        document.getElementById('product-category').innerHTML = options;
                        console.log("Updated product-category dropdown");
                    }
                }
            } catch (e) {
                console.error("Error parsing API response:", e);
            }
        })
        .catch(error => {
            console.error("Error fetching categories:", error);
        });
}

// Run this test on page load
setTimeout(testCategoriesAPI, 2000);