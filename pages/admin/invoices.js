/**
 * ============================================
 * ADMIN INVOICES - MÓDULO COMPLETO DE FACTURACIÓN
 * ============================================
 * 
 * @fileoverview Módulo completo de gestión de facturas para el administrador
 * @author VetUni Development Team
 * @version 2.0.0
 * 
 * Funcionalidades principales:
 * - Crear y editar facturas
 * - Visualizar lista de facturas con filtros avanzados
 * - Ver detalle completo de facturas
 * - Anular facturas con motivo
 * - Marcar facturas como pagadas
 * - Exportar facturas a CSV
 * - Exportar facturas a PDF
 * - Paginación y ordenamiento
 * - Estadísticas de facturación
 * - Notificaciones automáticas
 * 
 * @requires localStorage - Almacenamiento de facturas
 * @requires mockAuthService - Servicio de autenticación
 * 
 * Buenas prácticas aplicadas:
 * - Código modular y documentado
 * - Validación de datos
 * - Manejo de errores
 * - Separación de responsabilidades
 * - Funciones reutilizables
 * - Comentarios descriptivos
 */

// ========== VARIABLES GLOBALES ==========

/** @type {number} Contador para ítems de factura */
let invoiceItemCounterAdmin = 0;

/** @type {string|null} ID de la factura en edición */
let currentEditingInvoiceId = null;

/** @type {string|null} ID de la factura a anular */
let invoiceToCancelId = null;

/** @type {number} Página actual de facturas */
let currentInvoicePage = 1;

/** @type {number} Facturas por página */
const INVOICES_PER_PAGE = 10;

/** @type {string} Campo de ordenamiento actual */
let currentSortField = 'date';

/** @type {string} Dirección de ordenamiento ('asc' | 'desc') */
let currentSortDirection = 'desc';

/** @type {Array} Lista completa de facturas (sin filtrar) */
let allInvoices = [];

// ========== SERVICIOS DISPONIBLES ==========

/**
 * Lista de servicios disponibles con precios base
 * @type {Array<{id: string, name: string, basePrice: number}>}
 */
const AVAILABLE_SERVICES_ADMIN = [
    { id: 'consulta-general', name: 'Consulta general', basePrice: 30.00 },
    { id: 'desparasitacion', name: 'Desparasitación', basePrice: 25.00 },
    { id: 'bano-medicado', name: 'Baño medicado', basePrice: 35.00 },
    { id: 'urgencias', name: 'Urgencias', basePrice: 50.00 },
    { id: 'vacunacion', name: 'Vacunación', basePrice: 20.00 },
    { id: 'cirugia', name: 'Cirugía', basePrice: 150.00 },
    { id: 'radiografia', name: 'Radiografía', basePrice: 45.00 },
    { id: 'laboratorio', name: 'Laboratorio', basePrice: 40.00 },
    { id: 'ecografia', name: 'Ecografía', basePrice: 60.00 },
    { id: 'control-post-operatorio', name: 'Control post-operatorio', basePrice: 25.00 }
];

// ========== INICIALIZACIÓN ==========

/**
 * Inicializa el módulo cuando se carga la sección
 * @returns {void}
 */
(function() {
    setTimeout(() => {
        if (document.getElementById('invoicesTableBody')) {
            initInvoices();
        }
    }, 150);
})();

/**
 * Inicializa el módulo de facturas
 * Carga datos, configura filtros y muestra la primera página
 * @returns {void}
 */
function initInvoices() {
    loadAllInvoices();
    loadClientsForInvoice();
    loadVeterinariansForFilter();
    loadInvoicesAdmin();
    loadInvoiceStatistics();
}

// ========== CARGA DE DATOS ==========

/**
 * Carga todas las facturas del almacenamiento
 * @returns {void}
 */
function loadAllInvoices() {
    try {
        allInvoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
    } catch (error) {
        console.error('Error al cargar facturas:', error);
        allInvoices = [];
        showToast('Error al cargar las facturas', 'error');
    }
}

/**
 * Carga las facturas en la tabla con paginación
 * @param {boolean} applyFilters - Si se deben aplicar filtros
 * @returns {void}
 */
function loadInvoicesAdmin(applyFilters = true) {
    const tbody = document.getElementById('invoicesTableBody');
    const countElement = document.getElementById('invoicesCount');
    const totalCountElement = document.getElementById('totalInvoicesCount');
    
    if (!tbody) return;
    
    // Aplicar filtros si es necesario
    let filteredInvoices = applyFilters ? applyInvoiceFiltersToData([...allInvoices]) : [...allInvoices];
    
    // Actualizar contador total
    if (totalCountElement) {
        totalCountElement.textContent = filteredInvoices.length;
    }
    
    // Ordenar facturas
    filteredInvoices = sortInvoicesArray(filteredInvoices);
    
    // Calcular paginación
    const totalPages = Math.ceil(filteredInvoices.length / INVOICES_PER_PAGE);
    const startIndex = (currentInvoicePage - 1) * INVOICES_PER_PAGE;
    const endIndex = startIndex + INVOICES_PER_PAGE;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
    
    // Actualizar contador de página actual
    if (countElement) {
        countElement.textContent = paginatedInvoices.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, filteredInvoices.length)}` : '0';
    }
    
    // Actualizar controles de paginación
    updatePaginationControls(totalPages, filteredInvoices.length);
    
    // Mostrar facturas
    if (paginatedInvoices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="invoice-table-empty">
                    <div class="invoice-empty-state">
                        <div class="invoice-empty-icon-large">
                            <i class="fa-solid fa-inbox"></i>
                        </div>
                        <div class="invoice-empty-title">No hay facturas registradas</div>
                        <div class="invoice-empty-description">Haz clic en "Nueva Factura" para crear una</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = paginatedInvoices.map(invoice => renderInvoiceRow(invoice)).join('');
}

/**
 * Renderiza una fila de factura en la tabla
 * @param {Object} invoice - Objeto de factura
 * @returns {string} HTML de la fila
 */
function renderInvoiceRow(invoice) {
    const date = new Date(invoice.createdAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const time = new Date(invoice.createdAt).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const statusConfig = getInvoiceStatusConfig(invoice.status);
    
    return `
        <tr class="invoice-table-row">
            <td class="invoice-table-cell invoice-cell-number">
                <div class="invoice-cell-content">
                    <i class="fa-solid fa-hashtag invoice-cell-icon"></i>
                    <span class="invoice-number-text">${escapeHtml(invoice.invoiceNumber)}</span>
                </div>
            </td>
            <td class="invoice-table-cell invoice-cell-date">
                <div class="invoice-cell-content">
                    <div class="invoice-date-main">${date}</div>
                    <small class="invoice-date-time">${time}</small>
                </div>
            </td>
            <td class="invoice-table-cell invoice-cell-client">
                <div class="invoice-cell-content">
                    <i class="fa-solid fa-user invoice-cell-icon-small"></i>
                    <span>${escapeHtml(invoice.clientName)}</span>
                </div>
            </td>
            <td class="invoice-table-cell invoice-cell-pet">
                <div class="invoice-cell-content">
                    <i class="fa-solid fa-paw invoice-cell-icon-small"></i>
                    <span>${escapeHtml(invoice.petName || 'N/A')}</span>
                </div>
            </td>
            <td class="invoice-table-cell invoice-cell-veterinarian">
                <div class="invoice-cell-content">
                    <i class="fa-solid fa-user-doctor invoice-cell-icon-small"></i>
                    <span>${escapeHtml(invoice.createdByName || invoice.veterinarianName || 'N/A')}</span>
                </div>
            </td>
            <td class="invoice-table-cell invoice-cell-total">
                <div class="invoice-cell-content">
                    <span class="invoice-total-amount">$${formatCurrency(invoice.total)}</span>
                </div>
            </td>
            <td class="invoice-table-cell invoice-cell-status">
                <div class="invoice-status-badge" style="background:${statusConfig.color};">
                    <i class="fa-solid ${statusConfig.icon || 'fa-circle'}"></i>
                    <span>${statusConfig.text}</span>
                </div>
            </td>
            <td class="invoice-table-cell invoice-cell-actions">
                <div class="invoice-actions-group">
                    <button class="invoice-action-btn invoice-action-view" onclick="viewInvoiceDetailAdmin('${invoice.id}')" title="Ver detalles">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    ${invoice.status === 'pending' ? `
                        <button class="invoice-action-btn invoice-action-paid" onclick="markInvoiceAsPaidAdmin('${invoice.id}')" title="Marcar como pagada">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button class="invoice-action-btn invoice-action-cancel" onclick="openCancelInvoiceModalAdmin('${invoice.id}')" title="Anular factura">
                            <i class="fa-solid fa-ban"></i>
                        </button>
                    ` : ''}
                    ${invoice.status === 'paid' ? `
                        <button class="invoice-action-btn invoice-action-download" onclick="downloadInvoicePDFSingle('${invoice.id}')" title="Descargar PDF">
                            <i class="fa-solid fa-download"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
}

/**
 * Obtiene la configuración de estado de una factura
 * @param {string} status - Estado de la factura
 * @returns {{color: string, text: string}} Configuración del estado
 */
function getInvoiceStatusConfig(status) {
    const statusMap = {
        'pending': { color: '#FF9800', text: 'Pendiente', icon: 'fa-clock' },
        'paid': { color: '#4CAF50', text: 'Pagada', icon: 'fa-check-circle' },
        'cancelled': { color: '#F44336', text: 'Anulada', icon: 'fa-ban' }
    };
    return statusMap[status] || { color: '#757575', text: 'Desconocido', icon: 'fa-circle' };
}

/**
 * Carga estadísticas de facturas
 * @returns {void}
 */
function loadInvoiceStatistics() {
    const totalInvoices = allInvoices.length;
    const pendingInvoices = allInvoices.filter(inv => inv.status === 'pending').length;
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid').length;
    const totalAmount = allInvoices
        .filter(inv => inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    const statTotal = document.getElementById('statTotalInvoices');
    const statPending = document.getElementById('statPendingInvoices');
    const statPaid = document.getElementById('statPaidInvoices');
    const statAmount = document.getElementById('statTotalAmount');
    
    if (statTotal) statTotal.textContent = totalInvoices;
    if (statPending) statPending.textContent = pendingInvoices;
    if (statPaid) statPaid.textContent = paidInvoices;
    if (statAmount) statAmount.textContent = `$${formatCurrency(totalAmount)}`;
}

// ========== FILTROS Y BÚSQUEDA ==========

/**
 * Aplica los filtros a las facturas
 * @param {Array} invoices - Array de facturas a filtrar
 * @returns {Array} Facturas filtradas
 */
function applyInvoiceFiltersToData(invoices) {
    const dateFrom = document.getElementById('filterInvoiceDateFrom')?.value;
    const dateTo = document.getElementById('filterInvoiceDateTo')?.value;
    const clientFilter = document.getElementById('filterInvoiceClient')?.value.toLowerCase().trim();
    const petFilter = document.getElementById('filterInvoicePet')?.value.toLowerCase().trim();
    const vetFilter = document.getElementById('filterInvoiceVeterinarian')?.value;
    const itemFilter = document.getElementById('filterInvoiceItem')?.value.toLowerCase().trim();
    const paymentMethodFilter = document.getElementById('filterInvoicePaymentMethod')?.value;
    const statusFilter = document.getElementById('filterInvoiceStatus')?.value;
    const numberFilter = document.getElementById('filterInvoiceNumber')?.value.toLowerCase().trim();
    
    return invoices.filter(invoice => {
        // Filtro por rango de fechas
        if (dateFrom || dateTo) {
            const invoiceDate = new Date(invoice.createdAt).toISOString().split('T')[0];
            if (dateFrom && invoiceDate < dateFrom) return false;
            if (dateTo && invoiceDate > dateTo) return false;
        }
        
        // Filtro por cliente
        if (clientFilter && !invoice.clientName.toLowerCase().includes(clientFilter)) {
            return false;
        }
        
        // Filtro por mascota
        if (petFilter && (!invoice.petName || !invoice.petName.toLowerCase().includes(petFilter))) {
            return false;
        }
        
        // Filtro por veterinario
        if (vetFilter && invoice.createdBy !== vetFilter) {
            return false;
        }
        
        // Filtro por producto/servicio (buscar en items)
        if (itemFilter) {
            const hasMatchingItem = invoice.items && invoice.items.some(item => 
                item.name.toLowerCase().includes(itemFilter)
            );
            if (!hasMatchingItem) return false;
        }
        
        // Filtro por método de pago
        if (paymentMethodFilter && invoice.paymentMethod !== paymentMethodFilter) {
            return false;
        }
        
        // Filtro por estado
        if (statusFilter && invoice.status !== statusFilter) {
            return false;
        }
        
        // Filtro por número de factura
        if (numberFilter && !invoice.invoiceNumber.toLowerCase().includes(numberFilter)) {
            return false;
        }
        
        return true;
    });
}

/**
 * Aplica los filtros y recarga la tabla
 * @returns {void}
 */
function applyInvoiceFilters() {
    currentInvoicePage = 1; // Resetear a primera página
    loadInvoicesAdmin(true);
    loadInvoiceStatistics();
}

/**
 * Limpia todos los filtros
 * @returns {void}
 */
function clearInvoiceFilters() {
    document.getElementById('filterInvoiceDateFrom').value = '';
    document.getElementById('filterInvoiceDateTo').value = '';
    document.getElementById('filterInvoiceClient').value = '';
    document.getElementById('filterInvoicePet').value = '';
    document.getElementById('filterInvoiceVeterinarian').value = '';
    document.getElementById('filterInvoiceItem').value = '';
    document.getElementById('filterInvoicePaymentMethod').value = '';
    document.getElementById('filterInvoiceStatus').value = '';
    document.getElementById('filterInvoiceNumber').value = '';
    currentInvoicePage = 1;
    loadInvoicesAdmin(true);
}

// ========== ORDENAMIENTO ==========

/**
 * Ordena las facturas según el campo especificado
 * @param {string} field - Campo por el cual ordenar ('number', 'date', 'total')
 * @returns {void}
 */
function sortInvoicesBy(field) {
    if (currentSortField === field) {
        // Cambiar dirección si es el mismo campo
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortDirection = 'desc';
    }
    loadInvoicesAdmin(true);
}

/**
 * Ordena un array de facturas según la configuración actual
 * @param {Array} invoices - Array de facturas
 * @returns {Array} Facturas ordenadas
 */
function sortInvoicesArray(invoices) {
    return [...invoices].sort((a, b) => {
        let valueA, valueB;
        
        switch (currentSortField) {
            case 'number':
                valueA = a.invoiceNumber || '';
                valueB = b.invoiceNumber || '';
                break;
            case 'date':
                valueA = new Date(a.createdAt).getTime();
                valueB = new Date(b.createdAt).getTime();
                break;
            case 'total':
                valueA = a.total || 0;
                valueB = b.total || 0;
                break;
            default:
                valueA = new Date(a.createdAt).getTime();
                valueB = new Date(b.createdAt).getTime();
        }
        
        if (typeof valueA === 'string') {
            return currentSortDirection === 'asc' 
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
        } else {
            return currentSortDirection === 'asc' 
                ? valueA - valueB
                : valueB - valueA;
        }
    });
}

// ========== PAGINACIÓN ==========

/**
 * Actualiza los controles de paginación
 * @param {number} totalPages - Total de páginas
 * @param {number} totalItems - Total de ítems
 * @returns {void}
 */
function updatePaginationControls(totalPages, totalItems) {
    const currentPageElement = document.getElementById('currentInvoicePage');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (currentPageElement) {
        currentPageElement.textContent = currentInvoicePage;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentInvoicePage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentInvoicePage >= totalPages || totalItems === 0;
    }
}

/**
 * Navega a la página anterior
 * @returns {void}
 */
function previousInvoicePage() {
    if (currentInvoicePage > 1) {
        currentInvoicePage--;
        loadInvoicesAdmin(true);
    }
}

/**
 * Navega a la página siguiente
 * @returns {void}
 */
function nextInvoicePage() {
    const totalPages = Math.ceil(applyInvoiceFiltersToData([...allInvoices]).length / INVOICES_PER_PAGE);
    if (currentInvoicePage < totalPages) {
        currentInvoicePage++;
        loadInvoicesAdmin(true);
    }
}

// ========== CREACIÓN Y EDICIÓN DE FACTURAS ==========

/**
 * Abre el modal para crear una nueva factura
 * @returns {void}
 */
function openCreateInvoiceModalAdmin() {
    const modal = document.getElementById('createInvoiceModalAdmin');
    if (!modal) {
        console.error('Modal createInvoiceModalAdmin no encontrado');
        showToast('Error: Modal no encontrado. Recarga la página.', 'error');
        return;
    }
    
    // Resetear formulario
    currentEditingInvoiceId = null;
    invoiceItemCounterAdmin = 0;
    
    const itemsList = document.getElementById('invoiceItemsListAdmin');
    const clientSelect = document.getElementById('invoiceClientIdAdmin');
    const petSelect = document.getElementById('invoicePetIdAdmin');
    const observationsField = document.getElementById('invoiceObservationsAdmin');
    const titleElement = document.getElementById('invoiceModalTitle');
    const saveButtonText = document.getElementById('invoiceSaveButtonText');
    
    if (itemsList) itemsList.innerHTML = '';
    if (clientSelect) clientSelect.value = '';
    if (petSelect) {
        petSelect.innerHTML = '<option value="">Primero selecciona un cliente</option>';
        petSelect.value = '';
    }
    if (observationsField) observationsField.value = '';
    if (titleElement) titleElement.textContent = 'Crear Factura';
    if (saveButtonText) saveButtonText.textContent = 'Generar Factura';
    
    // Cargar clientes
    loadClientsForInvoice();
    
    // Agregar primer ítem
    addInvoiceItemAdmin();
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Actualizar totales
    updateInvoiceTotalsAdmin();
}

/**
 * Crea el HTML del modal si no existe
 * @returns {void}
 */
function createInvoiceModalHTML() {
    // El modal ya está en el HTML, no es necesario crearlo dinámicamente
    openCreateInvoiceModalAdmin();
}

/**
 * Carga las mascotas de un cliente seleccionado en el modal de factura
 * @returns {void}
 */
function loadPetsForInvoiceAdmin() {
    const clientSelect = document.getElementById('invoiceClientIdAdmin');
    const petSelect = document.getElementById('invoicePetIdAdmin');
    
    if (!clientSelect || !petSelect) return;
    
    const clientId = clientSelect.value;
    petSelect.innerHTML = '<option value="">Selecciona una mascota</option>';
    
    if (!clientId) {
        petSelect.innerHTML = '<option value="">Primero selecciona un cliente</option>';
        return;
    }
    
    try {
        const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        
        // Buscar el cliente
        const client = mockUsers.find(u => (u.id || u.email) === clientId);
        if (!client || !client.pets || !Array.isArray(client.pets)) {
            petSelect.innerHTML = '<option value="">Este cliente no tiene mascotas registradas</option>';
            return;
        }
        
        // Filtrar mascotas activas del cliente
        const clientPets = mockPets.filter(pet => 
            client.pets.includes(pet.id) && pet.active !== false
        );
        
        if (clientPets.length === 0) {
            petSelect.innerHTML = '<option value="">Este cliente no tiene mascotas activas</option>';
            return;
        }
        
        // Agregar opciones de mascotas
        clientPets.forEach(pet => {
            const option = document.createElement('option');
            option.value = pet.id;
            option.textContent = `${pet.name} (${pet.species || 'N/A'})`;
            petSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        petSelect.innerHTML = '<option value="">Error al cargar mascotas</option>';
    }
}

/**
 * Carga los clientes en el selector del modal
 * @returns {void}
 */
function loadClientsForInvoice() {
    const select = document.getElementById('invoiceClientIdAdmin');
    if (!select) return;
    
    try {
        const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        const clients = mockUsers.filter(u => {
            const role = String(u.role || '').toUpperCase();
            return role.includes('CLIENTE') || role.includes('OWNER') || 
                   (!role.includes('VETERINARIO') && !role.includes('ADMIN') && !role.includes('ADMINISTRADOR'));
        });
        
        select.innerHTML = '<option value="">Selecciona el cliente</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id || client.email;
            const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email || 'Cliente';
            option.textContent = clientName;
            option.dataset.clientName = clientName;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        showToast('Error al cargar la lista de clientes', 'error');
    }
}

/**
 * Carga veterinarios para el filtro
 * @returns {void}
 */
function loadVeterinariansForFilter() {
    const select = document.getElementById('filterInvoiceVeterinarian');
    if (!select) return;
    
    try {
        const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        const vets = mockUsers.filter(u => {
            const role = String(u.role || '').toUpperCase();
            return role.includes('VETERINARIO') || role.includes('VET');
        });
        
        select.innerHTML = '<option value="">Todos los veterinarios</option>';
        vets.forEach(vet => {
            const option = document.createElement('option');
            option.value = vet.id || vet.email;
            option.textContent = `${vet.firstName || ''} ${vet.lastName || ''}`.trim() || vet.email;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar veterinarios:', error);
    }
}

/**
 * Agrega un nuevo ítem a la factura
 * @returns {void}
 */
function addInvoiceItemAdmin() {
    invoiceItemCounterAdmin++;
    const itemId = `item_${invoiceItemCounterAdmin}`;
    const itemsList = document.getElementById('invoiceItemsListAdmin');
    const emptyMessage = document.getElementById('invoiceItemsEmpty');
    
    if (!itemsList) return;
    
    // Ocultar mensaje de vacío
    if (emptyMessage) emptyMessage.style.display = 'none';
    
    const itemHTML = `
        <div class="invoice-item-modern" id="${itemId}">
            <div class="invoice-item-header">
                <div class="invoice-item-number">
                    <i class="fa-solid fa-list-ul"></i>
                    <span>Ítem #${invoiceItemCounterAdmin}</span>
                </div>
                <button type="button" class="invoice-item-remove" onclick="removeInvoiceItemAdmin('${itemId}')" title="Eliminar ítem">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            
            <div class="invoice-item-fields">
                <div class="invoice-item-field">
                    <label class="invoice-item-label">
                        <i class="fa-solid fa-tag"></i>
                        Tipo *
                    </label>
                    <select class="invoice-item-type" required onchange="handleInvoiceItemTypeChangeAdmin('${itemId}', this.value)">
                        <option value="">Selecciona...</option>
                        <option value="service">Servicio</option>
                        <option value="product">Producto</option>
                    </select>
                </div>
                <div class="invoice-item-field invoice-item-field-large">
                    <label class="invoice-item-label">
                        <i class="fa-solid fa-file-lines"></i>
                        Nombre *
                    </label>
                    <select class="invoice-item-name" required onchange="handleInvoiceItemNameChangeAdmin('${itemId}', this.value)">
                        <option value="">Selecciona...</option>
                    </select>
                </div>
                <div class="invoice-item-field invoice-item-field-small">
                    <label class="invoice-item-label">
                        <i class="fa-solid fa-hashtag"></i>
                        Cantidad *
                    </label>
                    <input type="number" class="invoice-item-quantity" min="1" value="1" required 
                           onchange="updateInvoiceItemTotalAdmin('${itemId}')">
                </div>
                <div class="invoice-item-field invoice-item-field-small">
                    <label class="invoice-item-label">
                        <i class="fa-solid fa-dollar-sign"></i>
                        Precio Unit. *
                    </label>
                    <input type="number" class="invoice-item-price" step="0.01" min="0" required 
                           onchange="updateInvoiceItemTotalAdmin('${itemId}')">
                </div>
                <div class="invoice-item-field invoice-item-field-total">
                    <label class="invoice-item-label">
                        <i class="fa-solid fa-calculator"></i>
                        Total
                    </label>
                    <input type="text" class="invoice-item-total" readonly value="$0.00">
                </div>
            </div>
        </div>
    `;
    
    itemsList.insertAdjacentHTML('beforeend', itemHTML);
    
    // Cargar nombres según el tipo seleccionado
    const itemElement = document.getElementById(itemId);
    if (itemElement) {
        const typeSelect = itemElement.querySelector('.invoice-item-type');
        if (typeSelect && typeSelect.value) {
            handleInvoiceItemTypeChangeAdmin(itemId, typeSelect.value);
        }
    }
}

/**
 * Maneja el cambio de tipo de ítem (servicio/producto)
 * @param {string} itemId - ID del ítem
 * @param {string} itemType - Tipo seleccionado ('service' o 'product')
 * @returns {void}
 */
function handleInvoiceItemTypeChangeAdmin(itemId, itemType) {
    const itemElement = document.getElementById(itemId);
    if (!itemElement) return;
    
    const nameSelect = itemElement.querySelector('.invoice-item-name');
    const priceInput = itemElement.querySelector('.invoice-item-price');
    
    if (!nameSelect || !priceInput) return;
    
    // Limpiar selección
    nameSelect.innerHTML = '<option value="">Selecciona...</option>';
    priceInput.value = '';
    updateInvoiceItemTotalAdmin(itemId);
    
    // Cargar opciones según el tipo
    if (itemType === 'service') {
        AVAILABLE_SERVICES_ADMIN.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name;
            option.dataset.price = service.basePrice;
            nameSelect.appendChild(option);
        });
    } else if (itemType === 'product') {
        try {
            const mockProducts = JSON.parse(localStorage.getItem('vetuni:mockProducts') || '[]');
            const availableProducts = mockProducts.filter(p => (p.stock || p.stockActual || 0) > 0);
            
            if (availableProducts.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No hay productos disponibles';
                option.disabled = true;
                nameSelect.appendChild(option);
            } else {
                availableProducts.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = product.nombre || product.name || 'Producto sin nombre';
                    option.dataset.price = product.precio || product.price || 0;
                    nameSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            showToast('Error al cargar productos', 'error');
        }
    }
}

/**
 * Maneja el cambio de nombre del ítem (selección de servicio/producto específico)
 * @param {string} itemId - ID del ítem
 * @param {string} itemValue - Valor seleccionado
 * @returns {void}
 */
function handleInvoiceItemNameChangeAdmin(itemId, itemValue) {
    const itemElement = document.getElementById(itemId);
    if (!itemElement) return;
    
    const nameSelect = itemElement.querySelector('.invoice-item-name');
    const priceInput = itemElement.querySelector('.invoice-item-price');
    
    if (!nameSelect || !priceInput) return;
    
    const selectedOption = nameSelect.options[nameSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.price) {
        priceInput.value = parseFloat(selectedOption.dataset.price).toFixed(2);
        updateInvoiceItemTotalAdmin(itemId);
    }
}

/**
 * Actualiza el total de un ítem específico
 * @param {string} itemId - ID del ítem
 * @returns {void}
 */
function updateInvoiceItemTotalAdmin(itemId) {
    const itemElement = document.getElementById(itemId);
    if (!itemElement) return;
    
    const quantityInput = itemElement.querySelector('.invoice-item-quantity');
    const priceInput = itemElement.querySelector('.invoice-item-price');
    const totalInput = itemElement.querySelector('.invoice-item-total');
    
    if (!quantityInput || !priceInput || !totalInput) return;
    
    const quantity = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const total = quantity * price;
    
    totalInput.value = `$${formatCurrency(total)}`;
    updateInvoiceTotalsAdmin();
}

/**
 * Actualiza los totales de la factura (subtotal, impuestos, total)
 * @returns {void}
 */
function updateInvoiceTotalsAdmin() {
    const items = document.querySelectorAll('#invoiceItemsListAdmin .invoice-item');
    let subtotal = 0;
    
    items.forEach(item => {
        const totalText = item.querySelector('.invoice-item-total')?.value || '$0.00';
        const totalValue = parseFloat(totalText.replace('$', '').replace(',', '')) || 0;
        subtotal += totalValue;
    });
    
    const tax = subtotal * 0.19; // 19% de impuestos
    const total = subtotal + tax;
    
    const subtotalElement = document.getElementById('invoiceSubtotalAdmin');
    const taxElement = document.getElementById('invoiceTaxAdmin');
    const totalElement = document.getElementById('invoiceTotalAdmin');
    
    if (subtotalElement) subtotalElement.textContent = `$${formatCurrency(subtotal)}`;
    if (taxElement) taxElement.textContent = `$${formatCurrency(tax)}`;
    if (totalElement) totalElement.textContent = `$${formatCurrency(total)}`;
}

/**
 * Elimina un ítem de la factura
 * @param {string} itemId - ID del ítem a eliminar
 * @returns {void}
 */
function removeInvoiceItemAdmin(itemId) {
    const itemElement = document.getElementById(itemId);
    if (!itemElement) return;
    
    itemElement.remove();
    updateInvoiceTotalsAdmin();
    
    // Mostrar mensaje si no hay ítems
    const itemsList = document.getElementById('invoiceItemsListAdmin');
    const emptyMessage = document.getElementById('invoiceItemsEmpty');
    if (itemsList && emptyMessage && itemsList.children.length === 0) {
        emptyMessage.style.display = 'flex';
    } else if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }
}

/**
 * Cierra el modal de creación/edición de factura
 * @returns {void}
 */
function closeCreateInvoiceModalAdmin() {
    const modal = document.getElementById('createInvoiceModalAdmin');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Guarda la factura (crear o actualizar)
 * @returns {void}
 */
function saveInvoiceAdmin() {
    // Validar cliente
    const clientId = document.getElementById('invoiceClientIdAdmin')?.value;
    if (!clientId) {
        showToast('Por favor, selecciona el cliente', 'error');
        return;
    }
    
    // Validar ítems
    const itemElements = document.querySelectorAll('#invoiceItemsListAdmin .invoice-item');
    if (itemElements.length === 0) {
        showToast('Debes agregar al menos un ítem a la factura', 'error');
        return;
    }
    
    const items = [];
    let hasError = false;
    
    // Validar y recopilar ítems
    itemElements.forEach(item => {
        const type = item.querySelector('.invoice-item-type')?.value;
        const nameSelect = item.querySelector('.invoice-item-name');
        const itemName = nameSelect?.options[nameSelect.selectedIndex]?.textContent || '';
        const quantity = parseFloat(item.querySelector('.invoice-item-quantity')?.value || 0);
        const price = parseFloat(item.querySelector('.invoice-item-price')?.value || 0);
        
        if (!type || !itemName || quantity <= 0 || price <= 0) {
            hasError = true;
            return;
        }
        
        items.push({
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            name: itemName,
            description: itemName,
            quantity: quantity,
            unitPrice: price,
            total: quantity * price
        });
    });
    
    if (hasError || items.length === 0) {
        showToast('Por favor, completa todos los campos de los ítems correctamente', 'error');
        return;
    }
    
    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;
    
    // Validar mascota
    const petId = document.getElementById('invoicePetIdAdmin')?.value;
    if (!petId) {
        showToast('Por favor, selecciona la mascota', 'error');
        return;
    }
    
    // Obtener información del cliente y mascota
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const client = mockUsers.find(u => (u.id || u.email) === clientId);
    const pet = mockPets.find(p => p.id === petId);
    const clientSelect = document.getElementById('invoiceClientIdAdmin');
    const petSelect = document.getElementById('invoicePetIdAdmin');
    const selectedClientOption = clientSelect?.options[clientSelect.selectedIndex];
    const selectedPetOption = petSelect?.options[petSelect.selectedIndex];
    const clientName = selectedClientOption?.dataset.clientName || 
                      `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || 
                      client?.email || 'Cliente';
    const petName = pet?.name || selectedPetOption?.textContent?.split(' (')[0] || '';
    
    // Obtener información del administrador
    const session = window.mockAuthService?.getCurrentUser?.();
    
    try {
        let invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
        const observations = document.getElementById('invoiceObservationsAdmin')?.value.trim() || undefined;
        const invoiceNumber = generateInvoiceNumberAdmin();
        
        if (currentEditingInvoiceId) {
            // Actualizar factura existente
            const index = invoices.findIndex(inv => inv.id === currentEditingInvoiceId);
            if (index !== -1) {
                invoices[index] = {
                    ...invoices[index],
                    clientId: clientId,
                    clientName: clientName,
                    petId: petId || invoices[index].petId,
                    petName: petName || invoices[index].petName,
                    items: items,
                    subtotal: subtotal,
                    tax: tax,
                    total: total,
                    observations: observations,
                    updatedAt: new Date().toISOString()
                };
                showToast('Factura actualizada exitosamente', 'success');
            }
        } else {
            // Crear nueva factura
            const invoice = {
                id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                invoiceNumber: invoiceNumber,
                clientId: clientId,
                clientName: clientName,
                petId: petId || undefined,
                petName: petName || undefined,
                createdBy: session?.email || session?.id || 'admin',
                createdByRole: 'admin',
                createdByName: `${session?.firstName || ''} ${session?.lastName || ''}`.trim() || 'Administrador',
                veterinarianName: `${session?.firstName || ''} ${session?.lastName || ''}`.trim() || 'Administrador',
                createdAt: new Date().toISOString(),
                items: items,
                subtotal: subtotal,
                tax: tax,
                total: total,
                status: 'pending',
                observations: observations,
                paymentDate: undefined,
                cancelledAt: undefined,
                cancellationReason: undefined
            };
            
            invoices.push(invoice);
            showToast('Factura creada exitosamente', 'success');
            
            // Crear notificación para el cliente
            createInvoiceNotificationForClient(invoice, client);
        }
        
        localStorage.setItem('vetuni:mockInvoices', JSON.stringify(invoices));
        
        // Recargar datos
        loadAllInvoices();
        loadInvoicesAdmin();
        loadInvoiceStatistics();
        closeCreateInvoiceModalAdmin();
        
    } catch (error) {
        console.error('Error al guardar factura:', error);
        showToast('Error al guardar la factura', 'error');
    }
}

/**
 * Genera un número de factura único
 * @returns {string} Número de factura generado
 */
function generateInvoiceNumberAdmin() {
    try {
        const invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        const lastInvoice = invoices[invoices.length - 1];
        if (lastInvoice && lastInvoice.invoiceNumber) {
            const parts = lastInvoice.invoiceNumber.split('-');
            if (parts.length === 3) {
                const lastNumber = parseInt(parts[2] || '0');
                return `FAC-${year}${month}-${String(lastNumber + 1).padStart(4, '0')}`;
            }
        }
        
        return `FAC-${year}${month}-0001`;
    } catch (error) {
        console.error('Error al generar número de factura:', error);
        return `FAC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-0001`;
    }
}

/**
 * Crea una notificación para el cliente cuando se genera una factura
 * @param {Object} invoice - Objeto de factura
 * @param {Object} client - Objeto de cliente
 * @returns {void}
 */
function createInvoiceNotificationForClient(invoice, client) {
    if (!client) return;
    
    try {
        let notifications = JSON.parse(localStorage.getItem('vetuni:clientNotifications') || '[]');
        notifications.push({
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'INVOICE_CREATED',
            title: 'Nueva Factura Disponible',
            description: `Se ha generado una nueva factura (${invoice.invoiceNumber}) por $${formatCurrency(invoice.total)}. Puedes revisarla en tu panel de facturas.`,
            date: new Date().toISOString(),
            status: 'PENDING',
            invoiceId: invoice.id,
            read: false
        });
        localStorage.setItem('vetuni:clientNotifications', JSON.stringify(notifications));
    } catch (error) {
        console.error('Error al crear notificación:', error);
    }
}

// ========== VISUALIZACIÓN DE DETALLES ==========

/**
 * Muestra el detalle completo de una factura
 * @param {string} invoiceId - ID de la factura
 * @returns {void}
 */
function viewInvoiceDetailAdmin(invoiceId) {
    const modal = document.getElementById('invoiceDetailModalAdmin');
    const content = document.getElementById('invoiceDetailContentAdmin');
    
    if (!modal || !content) return;
    
    try {
        const invoice = allInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            showToast('Factura no encontrada', 'error');
            return;
        }
        
        // Renderizar contenido del detalle
        content.innerHTML = renderInvoiceDetail(invoice);
        
        // Guardar ID para descarga PDF
        modal.dataset.invoiceId = invoiceId;
        
        // Mostrar modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error al cargar detalle de factura:', error);
        showToast('Error al cargar el detalle de la factura', 'error');
    }
}

/**
 * Renderiza el contenido del detalle de factura
 * @param {Object} invoice - Objeto de factura
 * @returns {string} HTML del detalle
 */
function renderInvoiceDetail(invoice) {
    const date = new Date(invoice.createdAt).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const statusConfig = getInvoiceStatusConfig(invoice.status);
    const paymentDate = invoice.paymentDate 
        ? new Date(invoice.paymentDate).toLocaleDateString('es-ES')
        : 'N/A';
    
    return `
        <!-- Información General -->
        <div style="margin-bottom:2rem;">
            <h3 style="margin-bottom:1rem; color:var(--gray-900); font-size:1.1rem; display:flex; align-items:center; gap:0.5rem;">
                <i class="fa-solid fa-info-circle" style="color:var(--primary-color);"></i> Información General
            </h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:1rem;">
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Número de Factura</div>
                    <div style="font-weight:700; color:var(--gray-900); font-size:1.1rem;">${escapeHtml(invoice.invoiceNumber)}</div>
                </div>
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Fecha de Emisión</div>
                    <div style="font-weight:600; color:var(--gray-900);">${date}</div>
                </div>
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Estado</div>
                    <span style="background:${statusConfig.color}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                        ${statusConfig.text}
                    </span>
                </div>
                ${invoice.paymentDate ? `
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--success-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Fecha de Pago</div>
                    <div style="font-weight:600; color:var(--gray-900);">${paymentDate}</div>
                </div>
                ` : ''}
            </div>
        </div>
        
        <!-- Información del Cliente -->
        <div style="margin-bottom:2rem;">
            <h3 style="margin-bottom:1rem; color:var(--gray-900); font-size:1.1rem; display:flex; align-items:center; gap:0.5rem;">
                <i class="fa-solid fa-user" style="color:var(--primary-color);"></i> Cliente
            </h3>
            <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg);">
                <div style="font-weight:600; color:var(--gray-900); font-size:1.05rem;">${escapeHtml(invoice.clientName)}</div>
            </div>
        </div>
        
        <!-- Ítems de la Factura -->
        <div style="margin-bottom:2rem;">
            <h3 style="margin-bottom:1rem; color:var(--gray-900); font-size:1.1rem; display:flex; align-items:center; gap:0.5rem;">
                <i class="fa-solid fa-list" style="color:var(--primary-color);"></i> Ítems de la Factura
            </h3>
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; background:var(--white); border-radius:var(--border-radius-lg); overflow:hidden;">
                    <thead>
                        <tr style="background:var(--gray-100);">
                            <th style="padding:0.75rem; text-align:left; font-weight:600; color:var(--gray-700); border-bottom:2px solid var(--gray-300);">Tipo</th>
                            <th style="padding:0.75rem; text-align:left; font-weight:600; color:var(--gray-700); border-bottom:2px solid var(--gray-300);">Descripción</th>
                            <th style="padding:0.75rem; text-align:center; font-weight:600; color:var(--gray-700); border-bottom:2px solid var(--gray-300);">Cantidad</th>
                            <th style="padding:0.75rem; text-align:right; font-weight:600; color:var(--gray-700); border-bottom:2px solid var(--gray-300);">Precio Unit.</th>
                            <th style="padding:0.75rem; text-align:right; font-weight:600; color:var(--gray-700); border-bottom:2px solid var(--gray-300);">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr style="border-bottom:1px solid var(--gray-200);">
                                <td style="padding:0.75rem; color:var(--gray-700);">
                                    <span style="background:${item.type === 'service' ? '#E3F2FD' : '#F3E5F5'}; color:${item.type === 'service' ? '#1976D2' : '#7B1FA2'}; padding:0.25rem 0.5rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                                        ${item.type === 'service' ? 'Servicio' : 'Producto'}
                                    </span>
                                </td>
                                <td style="padding:0.75rem; color:var(--gray-900); font-weight:500;">${escapeHtml(item.name)}</td>
                                <td style="padding:0.75rem; text-align:center; color:var(--gray-700);">${item.quantity}</td>
                                <td style="padding:0.75rem; text-align:right; color:var(--gray-700);">$${formatCurrency(item.unitPrice)}</td>
                                <td style="padding:0.75rem; text-align:right; font-weight:600; color:var(--gray-900);">$${formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Observaciones -->
        ${invoice.observations ? `
        <div style="margin-bottom:2rem;">
            <h3 style="margin-bottom:1rem; color:var(--gray-900); font-size:1.1rem; display:flex; align-items:center; gap:0.5rem;">
                <i class="fa-solid fa-comment" style="color:var(--primary-color);"></i> Observaciones
            </h3>
            <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); color:var(--gray-700);">
                ${escapeHtml(invoice.observations)}
            </div>
        </div>
        ` : ''}
        
        <!-- Motivo de Anulación -->
        ${invoice.cancellationReason ? `
        <div style="margin-bottom:2rem;">
            <h3 style="margin-bottom:1rem; color:var(--gray-900); font-size:1.1rem; display:flex; align-items:center; gap:0.5rem;">
                <i class="fa-solid fa-ban" style="color:var(--error-color);"></i> Motivo de Anulación
            </h3>
            <div style="padding:1rem; background:#FFEBEE; border-radius:var(--border-radius-lg); border-left:4px solid var(--error-color); color:var(--gray-700);">
                ${escapeHtml(invoice.cancellationReason)}
            </div>
        </div>
        ` : ''}
        
        <!-- Totales -->
        <div style="background:linear-gradient(135deg, var(--primary-color), var(--primary-light)); color:var(--white); padding:1.5rem; border-radius:var(--border-radius-lg);">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem; font-size:0.95rem;">
                <span>Subtotal:</span>
                <span style="font-weight:600;">$${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem; font-size:0.95rem;">
                <span>Impuestos (19%):</span>
                <span style="font-weight:600;">$${formatCurrency(invoice.tax)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:1.5rem; font-weight:bold; padding-top:0.75rem; border-top:2px solid rgba(255,255,255,0.3);">
                <span>Total:</span>
                <span>$${formatCurrency(invoice.total)}</span>
            </div>
        </div>
    `;
}

/**
 * Cierra el modal de detalle de factura
 * @returns {void}
 */
function closeInvoiceDetailModalAdmin() {
    const modal = document.getElementById('invoiceDetailModalAdmin');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        modal.dataset.invoiceId = '';
    }
}

// ========== GESTIÓN DE ESTADOS ==========

/**
 * Marca una factura como pagada
 * @param {string} invoiceId - ID de la factura
 * @returns {void}
 */
function markInvoiceAsPaidAdmin(invoiceId) {
    if (!confirm('¿Confirmas que esta factura ha sido pagada?')) {
        return;
    }
    
    try {
        let invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
        const invoice = invoices.find(inv => inv.id === invoiceId);
        
        if (!invoice) {
            showToast('Factura no encontrada', 'error');
            return;
        }
        
        invoice.status = 'paid';
        invoice.paymentDate = new Date().toISOString();
        
        localStorage.setItem('vetuni:mockInvoices', JSON.stringify(invoices));
        
        // Recargar datos
        loadAllInvoices();
        loadInvoicesAdmin();
        loadInvoiceStatistics();
        
        showToast('Factura marcada como pagada', 'success');
        
    } catch (error) {
        console.error('Error al marcar factura como pagada:', error);
        showToast('Error al actualizar el estado de la factura', 'error');
    }
}

// ========== ANULACIÓN DE FACTURAS ==========

/**
 * Abre el modal para anular una factura
 * @param {string} invoiceId - ID de la factura a anular
 * @returns {void}
 */
function openCancelInvoiceModalAdmin(invoiceId) {
    const modal = document.getElementById('cancelInvoiceModalAdmin');
    const numberElement = document.getElementById('cancelInvoiceNumberAdmin');
    
    if (!modal || !numberElement) return;
    
    try {
        const invoice = allInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            showToast('Factura no encontrada', 'error');
            return;
        }
        
        invoiceToCancelId = invoiceId;
        numberElement.textContent = invoice.invoiceNumber;
        document.getElementById('cancelInvoiceReasonAdmin').value = '';
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error al abrir modal de anulación:', error);
        showToast('Error al abrir el formulario de anulación', 'error');
    }
}

/**
 * Cierra el modal de anulación
 * @returns {void}
 */
function closeCancelInvoiceModalAdmin() {
    const modal = document.getElementById('cancelInvoiceModalAdmin');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        invoiceToCancelId = null;
        document.getElementById('cancelInvoiceReasonAdmin').value = '';
    }
}

/**
 * Confirma la anulación de la factura
 * @returns {void}
 */
function confirmCancelInvoiceAdmin() {
    const reason = document.getElementById('cancelInvoiceReasonAdmin')?.value.trim();
    
    if (!reason) {
        showToast('Por favor, ingresa el motivo de la anulación', 'error');
        return;
    }
    
    if (!invoiceToCancelId) {
        showToast('Error: No se identificó la factura a anular', 'error');
        return;
    }
    
    try {
        let invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
        const invoice = invoices.find(inv => inv.id === invoiceToCancelId);
        
        if (!invoice) {
            showToast('Factura no encontrada', 'error');
            closeCancelInvoiceModalAdmin();
            return;
        }
        
        invoice.status = 'cancelled';
        invoice.cancelledAt = new Date().toISOString();
        invoice.cancellationReason = reason;
        
        localStorage.setItem('vetuni:mockInvoices', JSON.stringify(invoices));
        
        // Recargar datos
        loadAllInvoices();
        loadInvoicesAdmin();
        loadInvoiceStatistics();
        
        showToast('Factura anulada exitosamente', 'success');
        closeCancelInvoiceModalAdmin();
        
    } catch (error) {
        console.error('Error al anular factura:', error);
        showToast('Error al anular la factura', 'error');
    }
}

// ========== EXPORTACIÓN ==========

/**
 * Exporta las facturas filtradas a CSV
 * @returns {void}
 */
function exportInvoicesToCSV() {
    try {
        const filteredInvoices = applyInvoiceFiltersToData([...allInvoices]);
        
        if (filteredInvoices.length === 0) {
            showToast('No hay facturas para exportar', 'warning');
            return;
        }
        
        // Preparar datos CSV
        const headers = ['Número', 'Fecha', 'Cliente', 'Creado Por', 'Subtotal', 'Impuestos', 'Total', 'Estado'];
        const rows = filteredInvoices.map(inv => [
            inv.invoiceNumber || '',
            new Date(inv.createdAt).toLocaleDateString('es-ES'),
            inv.clientName || '',
            inv.createdByName || '',
            inv.subtotal || 0,
            inv.tax || 0,
            inv.total || 0,
            inv.status === 'paid' ? 'Pagada' : inv.status === 'cancelled' ? 'Anulada' : 'Pendiente'
        ]);
        
        // Crear contenido CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Crear blob y descargar
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `facturas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast(`Se exportaron ${filteredInvoices.length} facturas correctamente`, 'success');
        
    } catch (error) {
        console.error('Error al exportar CSV:', error);
        showToast('Error al exportar las facturas', 'error');
    }
}

/**
 * Descarga una factura específica en formato PDF (simulado)
 * @param {string} invoiceId - ID de la factura
 * @returns {void}
 */
function downloadInvoicePDFSingle(invoiceId) {
    const modal = document.getElementById('invoiceDetailModalAdmin');
    if (modal && modal.dataset.invoiceId) {
        downloadInvoicePDFAdmin();
    } else {
        viewInvoiceDetailAdmin(invoiceId);
        setTimeout(() => downloadInvoicePDFAdmin(), 300);
    }
}

/**
 * Descarga el PDF de la factura actual en el modal de detalle
 * @returns {void}
 */
function downloadInvoicePDFAdmin() {
    const modal = document.getElementById('invoiceDetailModalAdmin');
    const invoiceId = modal?.dataset.invoiceId;
    
    if (!invoiceId) {
        showToast('No hay factura seleccionada', 'warning');
        return;
    }
    
    try {
        const invoice = allInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            showToast('Factura no encontrada', 'error');
            return;
        }
        
        // Generar contenido HTML para PDF (simulado)
        const pdfContent = generateInvoicePDFContent(invoice);
        
        // Crear ventana nueva para imprimir
        const printWindow = window.open('', '_blank');
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        
        // Esperar a que cargue y luego imprimir
        printWindow.onload = () => {
            printWindow.print();
            showToast('Preparando descarga de PDF...', 'info');
        };
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showToast('Error al generar el PDF', 'error');
    }
}

/**
 * Genera el contenido HTML para el PDF de la factura
 * @param {Object} invoice - Objeto de factura
 * @returns {string} HTML formateado para PDF
 */
function generateInvoicePDFContent(invoice) {
    const date = new Date(invoice.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Factura ${invoice.invoiceNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                .header { border-bottom: 3px solid #2E8B57; padding-bottom: 20px; margin-bottom: 30px; }
                .invoice-number { font-size: 24px; font-weight: bold; color: #2E8B57; }
                .invoice-date { color: #666; margin-top: 10px; }
                .section { margin-bottom: 30px; }
                .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2E8B57; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #2E8B57; color: white; padding: 10px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                .total-row { font-weight: bold; background: #f5f5f5; }
                .total-amount { font-size: 20px; color: #2E8B57; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="invoice-number">FACTURA ${invoice.invoiceNumber}</div>
                <div class="invoice-date">Fecha: ${date}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Cliente</div>
                <div>${escapeHtml(invoice.clientName)}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Ítems</div>
                <table>
                    <thead>
                        <tr>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${escapeHtml(item.name)}</td>
                                <td>${item.quantity}</td>
                                <td>$${formatCurrency(item.unitPrice)}</td>
                                <td>$${formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="3" style="text-align:right;">Subtotal:</td>
                            <td>$${formatCurrency(invoice.subtotal)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="text-align:right;">Impuestos (19%):</td>
                            <td>$${formatCurrency(invoice.tax)}</td>
                        </tr>
                        <tr class="total-row total-amount">
                            <td colspan="3" style="text-align:right;">TOTAL:</td>
                            <td>$${formatCurrency(invoice.total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            ${invoice.observations ? `
            <div class="section">
                <div class="section-title">Observaciones</div>
                <div>${escapeHtml(invoice.observations)}</div>
            </div>
            ` : ''}
            
            <div class="footer">
                <p>Gracias por su preferencia</p>
                <p>Clínica Veterinaria Universitaria</p>
            </div>
        </body>
        </html>
    `;
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

// Exponer funciones globalmente para que estén disponibles desde los onclick del HTML
window.initInvoices = initInvoices;
window.loadInvoicesAdmin = loadInvoicesAdmin;
window.applyInvoiceFilters = applyInvoiceFilters;
window.clearInvoiceFilters = clearInvoiceFilters;
window.openCreateInvoiceModalAdmin = openCreateInvoiceModalAdmin;
window.closeCreateInvoiceModalAdmin = closeCreateInvoiceModalAdmin;
window.addInvoiceItemAdmin = addInvoiceItemAdmin;
window.removeInvoiceItemAdmin = removeInvoiceItemAdmin;
window.handleInvoiceItemTypeChangeAdmin = handleInvoiceItemTypeChangeAdmin;
window.handleInvoiceItemNameChangeAdmin = handleInvoiceItemNameChangeAdmin;
window.updateInvoiceItemTotalAdmin = updateInvoiceItemTotalAdmin;
window.updateInvoiceTotalsAdmin = updateInvoiceTotalsAdmin;
window.saveInvoiceAdmin = saveInvoiceAdmin;
window.viewInvoiceDetailAdmin = viewInvoiceDetailAdmin;
window.markInvoiceAsPaidAdmin = markInvoiceAsPaidAdmin;
window.openCancelInvoiceModalAdmin = openCancelInvoiceModalAdmin;
window.cancelInvoiceAdmin = cancelInvoiceAdmin;
window.downloadInvoicePDFAdmin = downloadInvoicePDFAdmin;
window.downloadInvoicePDFSingle = downloadInvoicePDFSingle;
window.downloadInvoicePdf = downloadInvoicePDFAdmin; // Alias para compatibilidad
window.exportInvoicesToCSV = exportInvoicesToCSV;
window.printInvoice = function(invoiceId) {
    if (invoiceId) {
        viewInvoiceDetailAdmin(invoiceId);
        setTimeout(() => downloadInvoicePDFAdmin(), 300);
    } else {
        downloadInvoicePDFAdmin();
    }
};
window.previousInvoicePage = previousInvoicePage;
window.nextInvoicePage = nextInvoicePage;
window.sortInvoicesBy = sortInvoicesBy;
window.updatePaginationControls = updatePaginationControls;
window.loadClientsForInvoice = loadClientsForInvoice;
window.loadPetsForInvoiceAdmin = loadPetsForInvoiceAdmin;
