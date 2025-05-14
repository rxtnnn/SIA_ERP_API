// Update the loadStockData function in inventory.js
function loadStockData() {
    $('#current-stock-table').html('<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading stock data...</td></tr>');
    $('#stock-history-table').html('<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading history...</td></tr>');
    
    loadProductsForStock();
    
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
                        let statusClass = 'success';
                        let statusText = item.status;
                        
                        if (item.currentStock <= 0) {
                            statusClass = 'danger';
                        } else if (item.currentStock <= item.minStock) {
                            statusClass = 'warning';
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
                
                if (data.history && data.history.length > 0) {
                    let historyHtml = '';
                    
                    data.history.forEach(entry => {
                        let typeClass = entry.type === 'in' ? 'success' : 'warning';
                        
                        historyHtml += `
                            <tr>
                                <td>${entry.date}</td>
                                <td>${entry.product}</td>
                                <td><span class="badge bg-${typeClass}">${entry.typeLabel}</span></td>
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
        error: function(xhr, status, error) {
            console.error('Error:', error);
            alert('Error: Could not connect to the server');
            $('#current-stock-table').html('<tr><td colspan="7" class="text-center">Failed to load stock data</td></tr>');
            $('#stock-history-table').html('<tr><td colspan="6" class="text-center">Failed to load history</td></tr>');
        }
    });
}

// Update the stock in/out functions
function processStockIn() {
    const stockIn = {
        action: 'in',
        product_id: $('#stock-in-product').val(),
        quantity: $('#stock-in-quantity').val(),
        reference: $('#stock-in-reference').val(),
        notes: $('#stock-in-notes').val()
    };
    
    if (!stockIn.product_id || !stockIn.quantity || stockIn.quantity < 1) {
        alert('Please select a product and enter a valid quantity');
        return;
    }
    
    $.ajax({
        url: 'api/stock.php',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(stockIn),
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Stock updated successfully!');
                $('#stockInModal').modal('hide');
                $('#stock-in-form')[0].reset();
                
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
        action: 'out',
        product_id: $('#stock-out-product').val(),
        quantity: $('#stock-out-quantity').val(),
        reason: $('#stock-out-reason').val(),
        reference: $('#stock-out-reference').val(),
        notes: $('#stock-out-notes').val()
    };
    
    if (!stockOut.product_id || !stockOut.quantity || stockOut.quantity < 1) {
        alert('Please select a product and enter a valid quantity');
        return;
    }
    
    $.ajax({
        url: 'api/stock.php',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(stockOut),
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Stock updated successfully!');
                $('#stockOutModal').modal('hide');
                $('#stock-out-form')[0].reset();
                
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