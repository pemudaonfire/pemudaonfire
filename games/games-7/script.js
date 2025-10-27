// --- 1. DATA MANAGEMENT ---

let orders = [];
let currentFilter = 'all';
let orderId = 1;

// Load from localStorage
function loadOrders() {
    const saved = localStorage.getItem('orders');
    if (saved) {
        orders = JSON.parse(saved);
        orderId = Math.max(...orders.map(o => parseInt(o.id.split('-')[1])), 0) + 1;
    }
}

// Save to localStorage
function saveOrders() {
    localStorage.setItem('orders', JSON.stringify(orders));
}

// --- 2. ORDER STATUS TRANSITIONS ---

const statusFlow = {
    'pending': 'processing',
    'processing': 'shipped',
    'shipped': 'completed'
};

const statusLabels = {
    'pending': 'Pending',
    'processing': 'Diproses',
    'shipped': 'Dikirim',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
};

// --- 3. DOM ELEMENTS ---

const orderForm = document.getElementById('orderForm');
const ordersList = document.getElementById('ordersList');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.btn-filter');
const exportBtn = document.getElementById('exportBtn');
const modal = document.getElementById('orderModal');
const modalClose = document.querySelector('.close');

// Stats elements
const totalOrdersEl = document.getElementById('totalOrders');
const pendingOrdersEl = document.getElementById('pendingOrders');
const processingOrdersEl = document.getElementById('processingOrders');
const completedOrdersEl = document.getElementById('completedOrders');
const totalRevenueEl = document.getElementById('totalRevenue');

// --- 4. CREATE ORDER ---

orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const order = {
        id: `ORD-${String(orderId).padStart(4, '0')}`,
        customerName: document.getElementById('customerName').value,
        customerEmail: document.getElementById('customerEmail').value,
        customerPhone: document.getElementById('customerPhone').value,
        productName: document.getElementById('productName').value,
        quantity: parseInt(document.getElementById('quantity').value),
        price: parseInt(document.getElementById('price').value),
        shippingAddress: document.getElementById('shippingAddress').value,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    order.totalAmount = order.quantity * order.price;
    
    orders.unshift(order);
    orderId++;
    
    saveOrders();
    orderForm.reset();
    renderOrders();
    updateStats();
    
    // Show success message
    showNotification('✅ Pesanan berhasil ditambahkan!', 'success');
});

// --- 5. RENDER ORDERS ---

function renderOrders() {
    let filteredOrders = orders;
    
    // Apply status filter
    if (currentFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === currentFilter);
    }
    
    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order => 
            order.id.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.productName.toLowerCase().includes(searchTerm) ||
            order.customerEmail.toLowerCase().includes(searchTerm)
        );
    }
    
    // Render
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <p>Tidak ada pesanan ditemukan.</p>
                <p class="empty-hint">Coba ubah filter atau tambah pesanan baru.</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-card" data-id="${order.id}">
            <div class="order-header">
                <div class="order-id">${order.id}</div>
                <div class="order-status status-${order.status}">
                    ${statusLabels[order.status]}
                </div>
            </div>
            
            <div class="order-body">
                <div class="order-info">
                    <div class="info-label">Pelanggan</div>
                    <div class="info-value">${order.customerName}</div>
                </div>
                <div class="order-info">
                    <div class="info-label">Produk</div>
                    <div class="info-value">${order.productName}</div>
                </div>
                <div class="order-info">
                    <div class="info-label">Jumlah</div>
                    <div class="info-value">${order.quantity} unit</div>
                </div>
                <div class="order-info">
                    <div class="info-label">Total</div>
                    <div class="info-value">${formatCurrency(order.totalAmount)}</div>
                </div>
                <div class="order-info">
                    <div class="info-label">Tanggal</div>
                    <div class="info-value">${formatDate(order.createdAt)}</div>
                </div>
            </div>
            
            <div class="order-actions">
                <button class="btn-action btn-detail" onclick="showOrderDetail('${order.id}')">
                    📄 Detail
                </button>
                ${order.status !== 'completed' && order.status !== 'cancelled' ? `
                    <button class="btn-action btn-update" onclick="updateOrderStatus('${order.id}')">
                        ➡️ ${getNextStatusLabel(order.status)}
                    </button>
                ` : ''}
                ${order.status === 'pending' || order.status === 'processing' ? `
                    <button class="btn-action btn-cancel" onclick="cancelOrder('${order.id}')">
                        ❌ Batalkan
                    </button>
                ` : ''}
                <button class="btn-action btn-delete" onclick="deleteOrder('${order.id}')">
                    🗑️ Hapus
                </button>
            </div>
        </div>
    `).join('');
}

// --- 6. UPDATE ORDER STATUS ---

function updateOrderStatus(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const nextStatus = statusFlow[order.status];
    if (!nextStatus) return;
    
    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();
    
    saveOrders();
    renderOrders();
    updateStats();
    
    showNotification(`📦 Pesanan ${orderId} diperbarui ke: ${statusLabels[nextStatus]}`, 'success');
}

function cancelOrder(orderId) {
    if (!confirm('Yakin ingin membatalkan pesanan ini?')) return;
    
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    
    saveOrders();
    renderOrders();
    updateStats();
    
    showNotification(`❌ Pesanan ${orderId} dibatalkan`, 'warning');
}

function deleteOrder(orderId) {
    if (!confirm('Yakin ingin menghapus pesanan ini? Aksi tidak dapat dibatalkan.')) return;
    
    orders = orders.filter(o => o.id !== orderId);
    
    saveOrders();
    renderOrders();
    updateStats();
    
    showNotification(`🗑️ Pesanan ${orderId} dihapus`, 'warning');
}

// --- 7. SHOW ORDER DETAIL ---

function showOrderDetail(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const detailsHTML = `
        <div class="detail-item">
            <div class="detail-label">ID Pesanan</div>
            <div class="detail-value">${order.id}</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Status</div>
            <div class="detail-value">
                <span class="order-status status-${order.status}">
                    ${statusLabels[order.status]}
                </span>
            </div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Nama Pelanggan</div>
            <div class="detail-value">${order.customerName}</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Email</div>
            <div class="detail-value">${order.customerEmail}</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">No. Telepon</div>
            <div class="detail-value">${order.customerPhone}</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Nama Produk</div>
            <div class="detail-value">${order.productName}</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Jumlah</div>
            <div class="detail-value">${order.quantity} unit</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Harga Satuan</div>
            <div class="detail-value">${formatCurrency(order.price)}</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Total Pembayaran</div>
            <div class="detail-value" style="color: #28a745; font-size: 1.3em;">
                ${formatCurrency(order.totalAmount)}
            </div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Alamat Pengiriman</div>
            <div class="detail-value">${order.shippingAddress}</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Dibuat Pada</div>
            <div class="detail-value">${formatDateTime(order.createdAt)}</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Terakhir Diperbarui</div>
            <div class="detail-value">${formatDateTime(order.updatedAt)}</div>
        </div>
    `;
    
    document.getElementById('orderDetails').innerHTML = detailsHTML;
    modal.style.display = 'block';
}

// --- 8. FILTER & SEARCH ---

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.status;
        renderOrders();
    });
});

searchInput.addEventListener('input', () => {
    renderOrders();
});

// --- 9. STATISTICS ---

function updateStats() {
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const revenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalAmount, 0);
    
    totalOrdersEl.textContent = orders.length;
    pendingOrdersEl.textContent = pending;
    processingOrdersEl.textContent = processing;
    completedOrdersEl.textContent = completed;
    totalRevenueEl.textContent = formatCurrency(revenue);
}

// --- 10. EXPORT DATA ---

exportBtn.addEventListener('click', () => {
    if (orders.length === 0) {
        showNotification('⚠️ Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    // Create CSV
    const headers = ['ID', 'Pelanggan', 'Email', 'Telepon', 'Produk', 'Jumlah', 'Harga', 'Total', 'Alamat', 'Status', 'Dibuat', 'Diperbarui'];
    const rows = orders.map(o => [
        o.id,
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        o.productName,
        o.quantity,
        o.price,
        o.totalAmount,
        o.shippingAddress.replace(/\n/g, ' '),
        statusLabels[o.status],
        formatDateTime(o.createdAt),
        formatDateTime(o.updatedAt)
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('📥 Data berhasil diekspor!', 'success');
});

// --- 11. MODAL CONTROLS ---

modalClose.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// --- 12. UTILITY FUNCTIONS ---

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getNextStatusLabel(currentStatus) {
    const nextStatus = statusFlow[currentStatus];
    return nextStatus ? statusLabels[nextStatus] : '';
}

function showNotification(message, type = 'success') {
    // Simple notification (you can enhance this)
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#ffc107'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// --- 13. INITIALIZATION ---

loadOrders();
renderOrders();
updateStats();

// Generate sample data for demo (optional)
if (orders.length === 0) {
    const sampleOrders = [
        {
            id: 'ORD-0001',
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            customerPhone: '081234567890',
            productName: 'Laptop Gaming ASUS ROG',
            quantity: 1,
            price: 15000000,
            totalAmount: 15000000,
            shippingAddress: 'Jl. Sudirman No. 123, Jakarta Pusat',
            status: 'completed',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'ORD-0002',
            customerName: 'Jane Smith',
            customerEmail: 'jane@example.com',
            customerPhone: '082345678901',
            productName: 'iPhone 15 Pro Max',
            quantity: 2,
            price: 18000000,
            totalAmount: 36000000,
            shippingAddress: 'Jl. Gatot Subroto No. 456, Jakarta Selatan',
            status: 'shipped',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'ORD-0003',
            customerName: 'Ahmad Rizki',
            customerEmail: 'ahmad@example.com',
            customerPhone: '083456789012',
            productName: 'Samsung Galaxy S24 Ultra',
            quantity: 1,
            price: 16000000,
            totalAmount: 16000000,
            shippingAddress: 'Jl. Thamrin No. 789, Jakarta Pusat',
            status: 'processing',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    // Uncomment to add sample data
    // orders = sampleOrders;
    // orderId = 4;
    // saveOrders();
    // renderOrders();
    // updateStats();
}
