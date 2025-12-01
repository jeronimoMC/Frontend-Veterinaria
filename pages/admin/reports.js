/**
 * ============================================
 * ADMIN REPORTS - MÓDULO COMPLETO DE REPORTES
 * ============================================
 * 
 * @fileoverview Módulo completo de reportes para el administrador
 * @author VetUni Development Team
 * @version 2.0.0
 * 
 * Funcionalidades principales:
 * - Reporte de ventas (diario, semanal, mensual, anual)
 * - Reporte de servicios más utilizados
 * - Reporte de productos más vendidos
 * - Reporte de veterinarios (facturación y citas)
 * - Reporte de clientes frecuentes
 * - Reporte de pacientes atendidos
 * - Exportación de reportes
 * 
 * @requires localStorage - Almacenamiento de datos
 */

// ========== VARIABLES GLOBALES ==========

/** @type {string} Tab de reporte actual */
let currentReportTab = 'sales';

/** @type {Date} Fecha de inicio por defecto (hace 30 días) */
let defaultDateFrom = new Date();
defaultDateFrom.setDate(defaultDateFrom.getDate() - 30);

/** @type {Date} Fecha de fin por defecto (hoy) */
let defaultDateTo = new Date();

// ========== INICIALIZACIÓN ==========

/**
 * Inicializa el módulo cuando se carga la sección
 */
(function() {
    setTimeout(() => {
        if (document.getElementById('sectionContent')) {
            initReports();
        }
    }, 150);
})();

/**
 * Inicializa el módulo de reportes
 * @param {string} sectionId - ID de la sección
 * @returns {void}
 */
function initReports(sectionId = 'sales') {
    console.log('🔵 initReports llamado');
    
    // Establecer fechas por defecto
    setDefaultDates();
    
    // Cargar reporte inicial
    switchReportTab('sales');
}

/**
 * Función global para cambiar de vista desde admin.js
 * @param {string} sectionId - ID de la sección
 * @returns {void}
 */
function showReportsSection(sectionId) {
    initReports(sectionId);
}

/**
 * Establece las fechas por defecto en los inputs
 * @returns {void}
 */
function setDefaultDates() {
    const dateFromInput = document.getElementById('reportSalesDateFrom');
    const dateToInput = document.getElementById('reportSalesDateTo');
    
    if (dateFromInput) {
        dateFromInput.value = defaultDateFrom.toISOString().split('T')[0];
    }
    if (dateToInput) {
        dateToInput.value = defaultDateTo.toISOString().split('T')[0];
    }
    
    // Aplicar a todos los inputs de fecha
    document.querySelectorAll('[id^="report"][id$="DateFrom"]').forEach(input => {
        if (input.value === '') {
            input.value = defaultDateFrom.toISOString().split('T')[0];
        }
    });
    
    document.querySelectorAll('[id^="report"][id$="DateTo"]').forEach(input => {
        if (input.value === '') {
            input.value = defaultDateTo.toISOString().split('T')[0];
        }
    });
}

// ========== NAVEGACIÓN ENTRE TABS ==========

/**
 * Cambia el tab de reporte activo
 * @param {string} tabName - Nombre del tab ('sales', 'services', 'products', 'veterinarians', 'clients', 'patients')
 * @returns {void}
 */
function switchReportTab(tabName) {
    currentReportTab = tabName;
    
    // Actualizar botones de tabs
    document.querySelectorAll('.report-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Ocultar todas las vistas
    document.querySelectorAll('.report-view').forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
    });
    
    // Mostrar la vista activa
    const activeView = document.getElementById(`report${capitalizeFirst(tabName)}View`);
    if (activeView) {
        activeView.classList.add('active');
        activeView.style.display = 'block';
    }
    
    // Cargar el reporte correspondiente
    switch(tabName) {
        case 'sales':
            loadSalesReport();
            break;
        case 'services':
            loadServicesReport();
            break;
        case 'products':
            loadProductsReport();
            break;
        case 'veterinarians':
            loadVeterinariansReport();
            break;
        case 'clients':
            loadClientsReport();
            break;
        case 'patients':
            loadPatientsReport();
            break;
    }
}

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========== REPORTE DE VENTAS ==========

/**
 * Establece un período rápido para el reporte de ventas
 * @returns {void}
 */
function setQuickSalesPeriod() {
    const quickPeriod = document.getElementById('reportSalesQuickPeriod')?.value;
    const dateFromInput = document.getElementById('reportSalesDateFrom');
    const dateToInput = document.getElementById('reportSalesDateTo');
    
    if (!quickPeriod || !dateFromInput || !dateToInput) return;
    
    const today = new Date();
    let from = new Date();
    let to = new Date();
    
    switch(quickPeriod) {
        case 'today':
            from = new Date(today);
            to = new Date(today);
            break;
        case 'week':
            from = new Date(today);
            from.setDate(from.getDate() - 7);
            to = new Date(today);
            break;
        case 'month':
            from = new Date(today.getFullYear(), today.getMonth(), 1);
            to = new Date(today);
            break;
        case 'year':
            from = new Date(today.getFullYear(), 0, 1);
            to = new Date(today);
            break;
    }
    
    dateFromInput.value = from.toISOString().split('T')[0];
    dateToInput.value = to.toISOString().split('T')[0];
    
    loadSalesReport();
}

/**
 * Carga el reporte de ventas
 * @returns {void}
 */
function loadSalesReport() {
    const dateFrom = document.getElementById('reportSalesDateFrom')?.value || defaultDateFrom.toISOString().split('T')[0];
    const dateTo = document.getElementById('reportSalesDateTo')?.value || defaultDateTo.toISOString().split('T')[0];
    
    try {
        const invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
        const dateFromObj = new Date(dateFrom);
        const dateToObj = new Date(dateTo);
        dateToObj.setHours(23, 59, 59, 999);
        
        // Filtrar facturas por período
        const filteredInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.createdAt || inv.date || inv.fecha);
            return invDate >= dateFromObj && invDate <= dateToObj && inv.status !== 'cancelled';
        });
        
        // Calcular estadísticas
        const total = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const subtotal = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.subtotal) || 0), 0);
        const tax = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.tax) || 0), 0);
        const count = filteredInvoices.length;
        const paid = filteredInvoices.filter(inv => inv.status === 'paid').length;
        const pending = filteredInvoices.filter(inv => inv.status === 'pending').length;
        
        // Mostrar estadísticas
        const statsContainer = document.getElementById('salesStatsContainer');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div style="padding:1.5rem; background:linear-gradient(135deg, var(--primary-color), #5CB85C); border-radius:var(--border-radius-lg); color:white; box-shadow:0 4px 6px rgba(0,0,0,0.1); border:2px solid rgba(255,255,255,0.2);">
                    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                        <div style="width:48px; height:48px; background:rgba(255,255,255,0.2); border-radius:12px; display:flex; align-items:center; justify-content:center;">
                            <i class="fa-solid fa-dollar-sign" style="font-size:1.5rem;"></i>
                        </div>
                        <div style="flex:1;">
                            <div style="font-size:0.85rem; opacity:0.95; margin-bottom:0.25rem; font-weight:500;">Total Facturado</div>
                            <div style="font-size:2.25rem; font-weight:700; line-height:1;">$${formatCurrency(total)}</div>
                        </div>
                    </div>
                </div>
                <div style="padding:1.5rem; background:var(--white); border:2px solid var(--gray-200); border-radius:var(--border-radius-lg); box-shadow:0 2px 4px rgba(0,0,0,0.05); transition:all 0.3s ease;" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='var(--gray-200)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <div style="width:48px; height:48px; background:var(--gray-100); border-radius:12px; display:flex; align-items:center; justify-content:center;">
                            <i class="fa-solid fa-receipt" style="font-size:1.25rem; color:var(--primary-color);"></i>
                        </div>
                        <div style="flex:1;">
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem; font-weight:500;">Número de Facturas</div>
                            <div style="font-size:1.75rem; font-weight:700; color:var(--gray-900); line-height:1;">${count}</div>
                        </div>
                    </div>
                </div>
                <div style="padding:1.5rem; background:var(--white); border:2px solid var(--gray-200); border-radius:var(--border-radius-lg); box-shadow:0 2px 4px rgba(0,0,0,0.05); transition:all 0.3s ease;" onmouseover="this.style.borderColor='#4CAF50'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='var(--gray-200)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <div style="width:48px; height:48px; background:#E8F5E9; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                            <i class="fa-solid fa-check-circle" style="font-size:1.25rem; color:#4CAF50;"></i>
                        </div>
                        <div style="flex:1;">
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem; font-weight:500;">Pagadas</div>
                            <div style="font-size:1.75rem; font-weight:700; color:#4CAF50; line-height:1;">${paid}</div>
                        </div>
                    </div>
                </div>
                <div style="padding:1.5rem; background:var(--white); border:2px solid var(--gray-200); border-radius:var(--border-radius-lg); box-shadow:0 2px 4px rgba(0,0,0,0.05); transition:all 0.3s ease;" onmouseover="this.style.borderColor='#FF9800'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='var(--gray-200)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <div style="width:48px; height:48px; background:#FFF3E0; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                            <i class="fa-solid fa-clock" style="font-size:1.25rem; color:#FF9800;"></i>
                        </div>
                        <div style="flex:1;">
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem; font-weight:500;">Pendientes</div>
                            <div style="font-size:1.75rem; font-weight:700; color:#FF9800; line-height:1;">${pending}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Mostrar tabla
        const tbody = document.getElementById('salesReportTableBody');
        if (tbody) {
            if (filteredInvoices.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align:center; padding:3rem; color:var(--gray-500);">
                            <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                            <div>No hay facturas en el período seleccionado</div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = filteredInvoices.map(inv => {
                    const invDate = new Date(inv.createdAt || inv.date || inv.fecha);
                    const formattedDate = invDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
                    const statusColors = {
                        'paid': '#4CAF50',
                        'pending': '#FF9800',
                        'cancelled': '#F44336'
                    };
                    const statusTexts = {
                        'paid': 'Pagada',
                        'pending': 'Pendiente',
                        'cancelled': 'Cancelada'
                    };
                    const status = inv.status || 'pending';
                    
                    return `
                        <tr style="border-bottom:1px solid var(--gray-200);">
                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(formattedDate)}</td>
                            <td style="padding:0.75rem; color:var(--gray-700); font-weight:600;">#${escapeHtml(inv.invoiceNumber || inv.id || 'N/A')}</td>
                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(inv.clientName || 'N/A')}</td>
                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(inv.veterinarianName || inv.createdByName || 'N/A')}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-700);">$${formatCurrency(inv.subtotal || 0)}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-700);">$${formatCurrency(inv.tax || 0)}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-900); font-weight:600;">$${formatCurrency(inv.total || 0)}</td>
                            <td style="padding:0.75rem; text-align:center;">
                                <span style="background:${statusColors[status] || '#757575'}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                                    ${statusTexts[status] || 'Pendiente'}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
        
        // Actualizar totales
        const subtotalTotal = document.getElementById('salesReportSubtotalTotal');
        const taxTotal = document.getElementById('salesReportTaxTotal');
        const totalTotal = document.getElementById('salesReportTotalTotal');
        
        if (subtotalTotal) subtotalTotal.textContent = `$${formatCurrency(subtotal)}`;
        if (taxTotal) taxTotal.textContent = `$${formatCurrency(tax)}`;
        if (totalTotal) totalTotal.textContent = `$${formatCurrency(total)}`;
        
    } catch (error) {
        console.error('Error al cargar reporte de ventas:', error);
        showToast('Error al cargar el reporte de ventas', 'error');
    }
}

// ========== REPORTE DE SERVICIOS ==========

/**
 * Carga el reporte de servicios más utilizados
 * @returns {void}
 */
function loadServicesReport() {
    const dateFrom = document.getElementById('reportServicesDateFrom')?.value || defaultDateFrom.toISOString().split('T')[0];
    const dateTo = document.getElementById('reportServicesDateTo')?.value || defaultDateTo.toISOString().split('T')[0];
    const topLimit = parseInt(document.getElementById('reportServicesTop')?.value || '10');
    
    try {
        const invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
        const appointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        const dateFromObj = new Date(dateFrom);
        const dateToObj = new Date(dateTo);
        dateToObj.setHours(23, 59, 59, 999);
        
        // Contar servicios de facturas y citas
        const serviceCount = {};
        
        invoices.forEach(inv => {
            const invDate = new Date(inv.createdAt || inv.date || inv.fecha);
            if (invDate >= dateFromObj && invDate <= dateToObj && inv.status !== 'cancelled') {
                if (inv.items && Array.isArray(inv.items)) {
                    inv.items.forEach(item => {
                        if (item.type === 'service') {
                            const serviceName = item.name || item.description || 'Servicio';
                            if (!serviceCount[serviceName]) {
                                serviceCount[serviceName] = { count: 0, revenue: 0 };
                            }
                            serviceCount[serviceName].count += item.quantity || 1;
                            serviceCount[serviceName].revenue += parseFloat(item.total || item.unitPrice || 0);
                        }
                    });
                }
            }
        });
        
        appointments.forEach(apt => {
            const aptDate = new Date(apt.date || apt.fecha);
            if (aptDate >= dateFromObj && aptDate <= dateToObj && apt.status !== 'cancelled') {
                const serviceName = apt.service || apt.servicio || 'Consulta General';
                if (!serviceCount[serviceName]) {
                    serviceCount[serviceName] = { count: 0, revenue: 0 };
                }
                serviceCount[serviceName].count += 1;
            }
        });
        
        // Convertir a array y ordenar
        let servicesArray = Object.keys(serviceCount).map(name => ({
            name: name,
            count: serviceCount[name].count,
            revenue: serviceCount[name].revenue
        })).sort((a, b) => b.count - a.count);
        
        // Aplicar límite
        if (topLimit !== 9999) {
            servicesArray = servicesArray.slice(0, topLimit);
        }
        
        // Calcular totales para porcentajes
        const totalCount = servicesArray.reduce((sum, s) => sum + s.count, 0);
        const totalRevenue = servicesArray.reduce((sum, s) => sum + s.revenue, 0);
        
        // Mostrar tabla
        const tbody = document.getElementById('servicesReportTableBody');
        if (tbody) {
            if (servicesArray.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding:3rem; color:var(--gray-500);">
                            <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                            <div>No hay servicios utilizados en el período seleccionado</div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = servicesArray.map((service, index) => {
                    const percentage = totalCount > 0 ? (service.count / totalCount * 100).toFixed(1) : 0;
                    const barWidth = totalCount > 0 ? (service.count / servicesArray[0].count * 100) : 0;
                    
                    return `
                        <tr style="border-bottom:1px solid var(--gray-200);">
                            <td style="padding:0.75rem; text-align:center; font-weight:600; color:var(--gray-700);">${index + 1}</td>
                            <td style="padding:0.75rem; color:var(--gray-900); font-weight:600;">${escapeHtml(service.name)}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-700);">${service.count}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-700); font-weight:600;">$${formatCurrency(service.revenue)}</td>
                            <td style="padding:0.75rem; text-align:center; color:var(--gray-700);">${percentage}%</td>
                            <td style="padding:0.75rem;">
                                <div class="chart-bar">
                                    <div class="chart-bar-fill" style="width:${barWidth}%;">
                                        ${barWidth > 15 ? `${percentage}%` : ''}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
        
    } catch (error) {
        console.error('Error al cargar reporte de servicios:', error);
        showToast('Error al cargar el reporte de servicios', 'error');
    }
}

// ========== REPORTE DE PRODUCTOS ==========

/**
 * Carga el reporte de productos más vendidos
 * @returns {void}
 */
function loadProductsReport() {
    const dateFrom = document.getElementById('reportProductsDateFrom')?.value || defaultDateFrom.toISOString().split('T')[0];
    const dateTo = document.getElementById('reportProductsDateTo')?.value || defaultDateTo.toISOString().split('T')[0];
    const topLimit = parseInt(document.getElementById('reportProductsTop')?.value || '10');
    
    try {
        const invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
        const dateFromObj = new Date(dateFrom);
        const dateToObj = new Date(dateTo);
        dateToObj.setHours(23, 59, 59, 999);
        
        // Contar productos vendidos
        const productCount = {};
        
        invoices.forEach(inv => {
            const invDate = new Date(inv.createdAt || inv.date || inv.fecha);
            if (invDate >= dateFromObj && invDate <= dateToObj && inv.status !== 'cancelled') {
                if (inv.items && Array.isArray(inv.items)) {
                    inv.items.forEach(item => {
                        if (item.type === 'product') {
                            const productName = item.name || item.description || 'Producto';
                            if (!productCount[productName]) {
                                productCount[productName] = { quantity: 0, revenue: 0, category: 'N/A' };
                            }
                            productCount[productName].quantity += item.quantity || 1;
                            productCount[productName].revenue += parseFloat(item.total || item.unitPrice || 0);
                        }
                    });
                }
            }
        });
        
        // Obtener categorías de productos
        try {
            const products = JSON.parse(localStorage.getItem('vetuni:mockProducts') || '[]');
            products.forEach(prod => {
                const prodName = prod.name || prod.nombre;
                if (productCount[prodName]) {
                    productCount[prodName].category = prod.category || prod.categoria?.nombre || 'N/A';
                }
            });
        } catch (error) {
            console.error('Error al obtener categorías:', error);
        }
        
        // Convertir a array y ordenar
        let productsArray = Object.keys(productCount).map(name => ({
            name: name,
            category: productCount[name].category,
            quantity: productCount[name].quantity,
            revenue: productCount[name].revenue
        })).sort((a, b) => b.quantity - a.quantity);
        
        // Aplicar límite
        if (topLimit !== 9999) {
            productsArray = productsArray.slice(0, topLimit);
        }
        
        // Calcular totales para porcentajes
        const totalQuantity = productsArray.reduce((sum, p) => sum + p.quantity, 0);
        const totalRevenue = productsArray.reduce((sum, p) => sum + p.revenue, 0);
        
        // Mostrar tabla
        const tbody = document.getElementById('productsReportTableBody');
        if (tbody) {
            if (productsArray.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align:center; padding:3rem; color:var(--gray-500);">
                            <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                            <div>No hay productos vendidos en el período seleccionado</div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = productsArray.map((product, index) => {
                    const percentage = totalQuantity > 0 ? (product.quantity / totalQuantity * 100).toFixed(1) : 0;
                    const barWidth = totalQuantity > 0 ? (product.quantity / productsArray[0].quantity * 100) : 0;
                    
                    return `
                        <tr style="border-bottom:1px solid var(--gray-200);">
                            <td style="padding:0.75rem; text-align:center; font-weight:600; color:var(--gray-700);">${index + 1}</td>
                            <td style="padding:0.75rem; color:var(--gray-900); font-weight:600;">${escapeHtml(product.name)}</td>
                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(product.category)}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-700);">${product.quantity}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-700); font-weight:600;">$${formatCurrency(product.revenue)}</td>
                            <td style="padding:0.75rem; text-align:center; color:var(--gray-700);">${percentage}%</td>
                            <td style="padding:0.75rem;">
                                <div class="chart-bar">
                                    <div class="chart-bar-fill" style="width:${barWidth}%;">
                                        ${barWidth > 15 ? `${percentage}%` : ''}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
        
    } catch (error) {
        console.error('Error al cargar reporte de productos:', error);
        showToast('Error al cargar el reporte de productos', 'error');
    }
}

// ========== REPORTE DE VETERINARIOS ==========

/**
 * Carga el reporte de veterinarios
 * @returns {void}
 */
function loadVeterinariansReport() {
    const dateFrom = document.getElementById('reportVetsDateFrom')?.value || defaultDateFrom.toISOString().split('T')[0];
    const dateTo = document.getElementById('reportVetsDateTo')?.value || defaultDateTo.toISOString().split('T')[0];
    const sortBy = document.getElementById('reportVetsSortBy')?.value || 'billing';
    
    try {
        const invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
        const appointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        const users = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        const dateFromObj = new Date(dateFrom);
        const dateToObj = new Date(dateTo);
        dateToObj.setHours(23, 59, 59, 999);
        
        // Obtener veterinarios
        const veterinarians = users.filter(u => {
            const role = String(u.role || '').toUpperCase();
            return role.includes('VETERINARIO') || role.includes('VET');
        });
        
        // Calcular estadísticas por veterinario
        const vetStats = {};
        
        veterinarians.forEach(vet => {
            const vetId = vet.id || vet.email;
            vetStats[vetId] = {
                name: `${vet.firstName || ''} ${vet.lastName || ''}`.trim() || vet.email || 'Veterinario',
                specialty: vet.specialty || vet.especialidad || 'General',
                appointments: 0,
                billing: 0
            };
        });
        
        // Contar citas
        appointments.forEach(apt => {
            const aptDate = new Date(apt.date || apt.fecha);
            if (aptDate >= dateFromObj && aptDate <= dateToObj && apt.status !== 'cancelled') {
                const vetId = apt.veterinarianId || apt.vetId;
                if (vetStats[vetId]) {
                    vetStats[vetId].appointments++;
                }
            }
        });
        
        // Contar facturación
        invoices.forEach(inv => {
            const invDate = new Date(inv.createdAt || inv.date || inv.fecha);
            if (invDate >= dateFromObj && invDate <= dateToObj && inv.status !== 'cancelled') {
                const vetId = inv.createdBy || inv.veterinarianId || inv.vetId;
                if (vetStats[vetId]) {
                    vetStats[vetId].billing += parseFloat(inv.total || 0);
                } else {
                    // Buscar por nombre
                    const vetName = inv.veterinarianName || inv.createdByName;
                    Object.keys(vetStats).forEach(vId => {
                        if (vetStats[vId].name === vetName) {
                            vetStats[vId].billing += parseFloat(inv.total || 0);
                        }
                    });
                }
            }
        });
        
        // Convertir a array y ordenar
        let vetsArray = Object.keys(vetStats).map(vetId => vetStats[vetId]);
        
        if (sortBy === 'billing') {
            vetsArray.sort((a, b) => b.billing - a.billing);
        } else if (sortBy === 'appointments') {
            vetsArray.sort((a, b) => b.appointments - a.appointments);
        } else {
            vetsArray.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        // Calcular totales para porcentajes
        const totalBilling = vetsArray.reduce((sum, v) => sum + v.billing, 0);
        
        // Mostrar tabla
        const tbody = document.getElementById('veterinariansReportTableBody');
        if (tbody) {
            if (vetsArray.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding:3rem; color:var(--gray-500);">
                            <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                            <div>No hay veterinarios registrados</div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = vetsArray.map((vet, index) => {
                    const percentage = totalBilling > 0 ? (vet.billing / totalBilling * 100).toFixed(1) : 0;
                    
                    return `
                        <tr style="border-bottom:1px solid var(--gray-200);">
                            <td style="padding:0.75rem; text-align:center; font-weight:600; color:var(--gray-700);">${index + 1}</td>
                            <td style="padding:0.75rem; color:var(--gray-900); font-weight:600;">${escapeHtml(vet.name)}</td>
                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(vet.specialty)}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-700);">${vet.appointments}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-900); font-weight:600;">$${formatCurrency(vet.billing)}</td>
                            <td style="padding:0.75rem; text-align:center; color:var(--gray-700);">${percentage}%</td>
                        </tr>
                    `;
                }).join('');
            }
        }
        
    } catch (error) {
        console.error('Error al cargar reporte de veterinarios:', error);
        showToast('Error al cargar el reporte de veterinarios', 'error');
    }
}

// ========== REPORTE DE CLIENTES ==========

/**
 * Carga el reporte de clientes frecuentes
 * @returns {void}
 */
function loadClientsReport() {
    const dateFrom = document.getElementById('reportClientsDateFrom')?.value || defaultDateFrom.toISOString().split('T')[0];
    const dateTo = document.getElementById('reportClientsDateTo')?.value || defaultDateTo.toISOString().split('T')[0];
    const topLimit = parseInt(document.getElementById('reportClientsTop')?.value || '10');
    
    try {
        const invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
        const appointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        const pets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        const dateFromObj = new Date(dateFrom);
        const dateToObj = new Date(dateTo);
        dateToObj.setHours(23, 59, 59, 999);
        
        // Calcular estadísticas por cliente
        const clientStats = {};
        
        // Contar visitas de citas
        appointments.forEach(apt => {
            const aptDate = new Date(apt.date || apt.fecha);
            if (aptDate >= dateFromObj && aptDate <= dateToObj && apt.status !== 'cancelled') {
                const clientId = apt.clientId || apt.clientEmail;
                if (!clientStats[clientId]) {
                    clientStats[clientId] = {
                        name: apt.clientName || 'Cliente',
                        email: apt.clientEmail || '',
                        visits: 0,
                        billing: 0,
                        pets: new Set()
                    };
                }
                clientStats[clientId].visits++;
                if (apt.petId) {
                    clientStats[clientId].pets.add(apt.petId);
                }
            }
        });
        
        // Contar facturación
        invoices.forEach(inv => {
            const invDate = new Date(inv.createdAt || inv.date || inv.fecha);
            if (invDate >= dateFromObj && invDate <= dateToObj && inv.status !== 'cancelled') {
                const clientId = inv.clientId || inv.clientEmail;
                if (!clientStats[clientId]) {
                    clientStats[clientId] = {
                        name: inv.clientName || 'Cliente',
                        email: '',
                        visits: 0,
                        billing: 0,
                        pets: new Set()
                    };
                }
                clientStats[clientId].billing += parseFloat(inv.total || 0);
            }
        });
        
        // Contar mascotas
        pets.forEach(pet => {
            const ownerId = pet.ownerId;
            if (clientStats[ownerId]) {
                clientStats[ownerId].pets.add(pet.id);
            }
        });
        
        // Convertir a array y ordenar por visitas
        let clientsArray = Object.keys(clientStats).map(clientId => ({
            name: clientStats[clientId].name,
            email: clientStats[clientId].email || 'N/A',
            visits: clientStats[clientId].visits,
            billing: clientStats[clientId].billing,
            petsCount: clientStats[clientId].pets.size
        })).sort((a, b) => b.visits - a.visits);
        
        // Aplicar límite
        if (topLimit !== 9999) {
            clientsArray = clientsArray.slice(0, topLimit);
        }
        
        // Calcular retención (simplificado: clientes con más de 1 visita)
        const totalVisits = clientsArray.reduce((sum, c) => sum + c.visits, 0);
        
        // Mostrar tabla
        const tbody = document.getElementById('clientsReportTableBody');
        if (tbody) {
            if (clientsArray.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align:center; padding:3rem; color:var(--gray-500);">
                            <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                            <div>No hay clientes en el período seleccionado</div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = clientsArray.map((client, index) => {
                    const retention = client.visits > 1 ? 'Alta' : client.visits === 1 ? 'Media' : 'Baja';
                    const retentionColor = client.visits > 1 ? '#4CAF50' : client.visits === 1 ? '#FF9800' : '#757575';
                    
                    return `
                        <tr style="border-bottom:1px solid var(--gray-200);">
                            <td style="padding:0.75rem; text-align:center; font-weight:600; color:var(--gray-700);">${index + 1}</td>
                            <td style="padding:0.75rem; color:var(--gray-900); font-weight:600;">${escapeHtml(client.name)}</td>
                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(client.email)}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-700);">${client.visits}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-900); font-weight:600;">$${formatCurrency(client.billing)}</td>
                            <td style="padding:0.75rem; text-align:center; color:var(--gray-700);">${client.petsCount}</td>
                            <td style="padding:0.75rem; text-align:center;">
                                <span style="background:${retentionColor}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                                    ${retention}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
        
    } catch (error) {
        console.error('Error al cargar reporte de clientes:', error);
        showToast('Error al cargar el reporte de clientes', 'error');
    }
}

// ========== REPORTE DE PACIENTES ==========

/**
 * Carga el reporte de pacientes atendidos
 * @returns {void}
 */
function loadPatientsReport() {
    const dateFrom = document.getElementById('reportPatientsDateFrom')?.value || defaultDateFrom.toISOString().split('T')[0];
    const dateTo = document.getElementById('reportPatientsDateTo')?.value || defaultDateTo.toISOString().split('T')[0];
    const species = document.getElementById('reportPatientsSpecies')?.value || '';
    
    try {
        const appointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        const pets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        const users = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        const dateFromObj = new Date(dateFrom);
        const dateToObj = new Date(dateTo);
        dateToObj.setHours(23, 59, 59, 999);
        
        // Contar visitas por paciente
        const patientStats = {};
        
        pets.forEach(pet => {
            patientStats[pet.id] = {
                name: pet.name || 'Paciente',
                species: pet.species || pet.especie || 'N/A',
                breed: pet.breed || pet.raza || 'N/A',
                ownerId: pet.ownerId,
                ownerName: 'Propietario',
                visits: 0,
                lastVisit: null
            };
        });
        
        // Contar visitas
        appointments.forEach(apt => {
            const aptDate = new Date(apt.date || apt.fecha);
            if (aptDate >= dateFromObj && aptDate <= dateToObj && apt.status !== 'cancelled') {
                const petId = apt.petId || apt.mascotaId;
                if (patientStats[petId]) {
                    patientStats[petId].visits++;
                    if (!patientStats[petId].lastVisit || aptDate > new Date(patientStats[petId].lastVisit)) {
                        patientStats[petId].lastVisit = aptDate;
                    }
                }
            }
        });
        
        // Obtener nombres de propietarios
        users.forEach(user => {
            Object.keys(patientStats).forEach(petId => {
                if (patientStats[petId].ownerId === (user.id || user.email)) {
                    patientStats[petId].ownerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Propietario';
                }
            });
        });
        
        // Filtrar y convertir a array
        let patientsArray = Object.keys(patientStats)
            .filter(petId => {
                const patient = patientStats[petId];
                return patient.visits > 0 && (!species || patient.species === species);
            })
            .map(petId => patientStats[petId])
            .sort((a, b) => b.visits - a.visits);
        
        // Mostrar tabla
        const tbody = document.getElementById('patientsReportTableBody');
        if (tbody) {
            if (patientsArray.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding:3rem; color:var(--gray-500);">
                            <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                            <div>No hay pacientes atendidos en el período seleccionado</div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = patientsArray.map(patient => {
                    const lastVisitStr = patient.lastVisit 
                        ? new Date(patient.lastVisit).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
                        : 'N/A';
                    
                    return `
                        <tr style="border-bottom:1px solid var(--gray-200);">
                            <td style="padding:0.75rem; color:var(--gray-900); font-weight:600;">${escapeHtml(patient.name)}</td>
                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(patient.species)}</td>
                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(patient.breed)}</td>
                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(patient.ownerName)}</td>
                            <td style="padding:0.75rem; text-align:right; color:var(--gray-700); font-weight:600;">${patient.visits}</td>
                            <td style="padding:0.75rem; color:var(--gray-700);">${lastVisitStr}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
        
    } catch (error) {
        console.error('Error al cargar reporte de pacientes:', error);
        showToast('Error al cargar el reporte de pacientes', 'error');
    }
}

// ========== EXPORTACIÓN ==========

/**
 * Exporta todos los reportes
 * @returns {void}
 */
function exportAllReports() {
    showToast('Función de exportación en desarrollo', 'info');
    // TODO: Implementar exportación a CSV/PDF
}

// ========== UTILIDADES ==========

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada
 */
function formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Exponer funciones globalmente
window.initReports = initReports;
window.showReportsSection = showReportsSection;
window.switchReportTab = switchReportTab;
window.setQuickSalesPeriod = setQuickSalesPeriod;
window.loadSalesReport = loadSalesReport;
window.loadServicesReport = loadServicesReport;
window.loadProductsReport = loadProductsReport;
window.loadVeterinariansReport = loadVeterinariansReport;
window.loadClientsReport = loadClientsReport;
window.loadPatientsReport = loadPatientsReport;
window.exportAllReports = exportAllReports;

