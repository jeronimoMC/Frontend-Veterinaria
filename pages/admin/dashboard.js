/**
 * ============================================
 * ADMIN DASHBOARD - LÓGICA
 * ============================================
 * Maneja todas las funciones del dashboard principal
 */

// Inicializar cuando se carga la sección dinámicamente
// Esta función se ejecuta cuando el script se carga
(function() {
    // Intentar inicializar después de un pequeño delay para asegurar que el HTML está en el DOM
    setTimeout(() => {
        if (document.getElementById('statClients')) {
            initDashboard();
        }
    }, 150);
})();

/**
 * Inicializa el dashboard
 */
function initDashboard() {
    loadDashboardStats();
    loadTodayAppointments();
    loadLowStockProducts();
    loadRecentInvoices();
}

/**
 * Carga las estadísticas del dashboard
 */
function loadDashboardStats() {
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const mockProducts = JSON.parse(localStorage.getItem('vetuni:mockProducts') || '[]');
    const mockInvoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
    
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = mockAppointments.filter(apt => apt.date === today);
    
    const mockVeterinarians = mockUsers.filter(u => {
        const role = String(u.role || '').toUpperCase();
        return role.includes('VETERINARIO') || role.includes('VET');
    });
    
    const todayInvoices = mockInvoices.filter(inv => {
        const invDate = new Date(inv.createdAt).toISOString().split('T')[0];
        return invDate === today;
    });
    const todaySales = todayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingInvoices = mockInvoices.filter(inv => inv.status === 'pending').length;
    
    const clients = mockUsers.filter(u => {
        const role = String(u.role || '').toUpperCase();
        return role.includes('CLIENTE') || role.includes('OWNER') || (!role.includes('VETERINARIO') && !role.includes('ADMIN'));
    });
    
    // Actualizar estadísticas
    const statClients = document.getElementById('statClients');
    const statAppointments = document.getElementById('statAppointments');
    const statProducts = document.getElementById('statProducts');
    const statSales = document.getElementById('statSales');
    const statVeterinarians = document.getElementById('statVeterinarians');
    const statPendingInvoices = document.getElementById('statPendingInvoices');
    
    if (statClients) statClients.textContent = clients.length;
    if (statAppointments) statAppointments.textContent = todayAppointments.length;
    if (statProducts) statProducts.textContent = mockProducts.length;
    if (statSales) statSales.textContent = `$${todaySales.toFixed(2)}`;
    if (statVeterinarians) statVeterinarians.textContent = mockVeterinarians.length;
    if (statPendingInvoices) statPendingInvoices.textContent = pendingInvoices;
}

/**
 * Carga las citas del día
 */
function loadTodayAppointments() {
    const appointmentsList = document.getElementById('todayAppointmentsList');
    if (!appointmentsList) return;
    
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    const todayAppointments = mockAppointments
        .filter(apt => apt.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));
    
    if (todayAppointments.length === 0) {
        appointmentsList.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--gray-500); background:var(--gray-50); border-radius:var(--border-radius-lg); border:1px dashed var(--gray-300);"><i class="fa-solid fa-calendar-xmark" style="font-size:2rem; margin-bottom:0.5rem; opacity:0.5;"></i><div style="font-size:0.9rem;">No hay citas programadas para hoy</div></div>';
        return;
    }
    
    appointmentsList.innerHTML = todayAppointments.map(apt => {
        const pet = mockPets.find(p => p.id === apt.petId);
        const petName = pet ? pet.name : 'Mascota';
        const petIcon = pet && pet.species === 'Perro' ? 'fa-dog' : 'fa-cat';
        const time = apt.time.substring(0, 5);
        const statusColor = apt.status === 'CONFIRMADA' ? '#4CAF50' : apt.status === 'COMPLETADA' ? '#2196F3' : '#FF9800';
        
        // Buscar cliente
        const client = mockUsers.find(u => {
            if (u.pets && Array.isArray(u.pets)) {
                return u.pets.includes(apt.petId);
            }
            return false;
        });
        const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email : 'Cliente';
        
        return `
            <div class="appointment-item" style="background:var(--white); padding:1rem; border-radius:var(--border-radius-lg); margin-bottom:0.75rem; border:1px solid var(--gray-200); box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem;">
                    <div style="display:flex; align-items:center; gap:0.75rem; flex:1;">
                        <div style="width:40px; height:40px; background:linear-gradient(135deg, var(--primary-color), var(--primary-light)); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem;">
                            <i class="fa-solid ${petIcon}"></i>
                        </div>
                        <div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(petName)}</div>
                            <div style="font-size:0.85rem; color:var(--gray-600);">
                                <i class="fa-solid ${petIcon}" style="margin-right:0.25rem;"></i>${escapeHtml(petName)} • <i class="fa-solid fa-building" style="margin-left:0.25rem; margin-right:0.25rem;"></i>${apt.module || 'N/A'}
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:600; color:var(--gray-900); font-size:1.1rem;">${time}</div>
                        <span style="background:${statusColor}; color:white; padding:0.25rem 0.5rem; border-radius:999px; font-size:0.7rem; font-weight:600;">${apt.status || 'PENDIENTE'}</span>
                    </div>
                </div>
                <div style="margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid var(--gray-200); font-size:0.85rem; color:var(--gray-600);">
                    <i class="fa-solid fa-user" style="margin-right:0.25rem;"></i>${escapeHtml(clientName)} • <i class="fa-solid fa-stethoscope" style="margin-left:0.25rem; margin-right:0.25rem;"></i>${apt.service || 'Consulta'}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Carga productos con stock bajo
 */
function loadLowStockProducts() {
    const container = document.getElementById('lowStockProducts');
    if (!container) return;
    
    const mockProducts = JSON.parse(localStorage.getItem('vetuni:mockProducts') || '[]');
    const lowStock = mockProducts.filter(p => (p.stock || 0) <= 10).slice(0, 5);
    
    if (lowStock.length === 0) {
        container.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--gray-500); background:var(--gray-50); border-radius:var(--border-radius-lg); border:1px dashed var(--gray-300);"><i class="fa-solid fa-check-circle" style="font-size:2rem; margin-bottom:0.5rem; opacity:0.5; color:var(--success-color);"></i><div style="font-size:0.9rem;">No hay productos con stock bajo</div></div>';
        return;
    }
    
    container.innerHTML = lowStock.map(product => `
        <div style="background:var(--white); padding:0.75rem; border-radius:var(--border-radius-md); border:1px solid var(--gray-200); margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div>
                <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(product.nombre || product.name)}</div>
                <div style="font-size:0.85rem; color:var(--gray-600);">Stock: ${product.stock || product.stockActual || 0}</div>
            </div>
            <span style="background:#F44336; color:white; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">Bajo</span>
        </div>
    `).join('');
}

/**
 * Carga las últimas facturas
 */
function loadRecentInvoices() {
    const container = document.getElementById('recentInvoices');
    if (!container) return;
    
    const mockInvoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
    const recent = mockInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--gray-500); background:var(--gray-50); border-radius:var(--border-radius-lg); border:1px dashed var(--gray-300);"><i class="fa-solid fa-receipt" style="font-size:2rem; margin-bottom:0.5rem; opacity:0.5;"></i><div style="font-size:0.9rem;">No hay facturas recientes</div></div>';
        return;
    }
    
    container.innerHTML = recent.map(invoice => {
        const date = new Date(invoice.createdAt).toLocaleDateString('es-ES');
        const statusColor = invoice.status === 'paid' ? '#4CAF50' : invoice.status === 'cancelled' ? '#F44336' : '#FF9800';
        const statusText = invoice.status === 'paid' ? 'Pagada' : invoice.status === 'cancelled' ? 'Anulada' : 'Pendiente';
        
        return `
            <div style="background:var(--white); padding:0.75rem; border-radius:var(--border-radius-md); border:1px solid var(--gray-200); margin-bottom:0.5rem; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:all 0.2s ease;" onmouseover="this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)'" onclick="showAdminSection('invoices')">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;">
                    <div>
                        <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(invoice.invoiceNumber)}</div>
                        <div style="font-size:0.85rem; color:var(--gray-600);">${escapeHtml(invoice.clientName)} • ${date}</div>
                    </div>
                    <span style="background:${statusColor}; color:white; padding:0.25rem 0.5rem; border-radius:999px; font-size:0.7rem; font-weight:600;">${statusText}</span>
                </div>
                <div style="font-weight:bold; color:var(--primary-color); font-size:1.1rem;">$${invoice.total.toFixed(2)}</div>
            </div>
        `;
    }).join('');
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exponer funciones globalmente
window.initDashboard = initDashboard;
window.loadDashboardStats = loadDashboardStats;
window.loadTodayAppointments = loadTodayAppointments;
window.loadLowStockProducts = loadLowStockProducts;
window.loadRecentInvoices = loadRecentInvoices;

