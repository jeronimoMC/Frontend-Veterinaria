/**
 * ============================================
 * ADMIN SERVICES - MÓDULO COMPLETO DE SERVICIOS
 * ============================================
 * 
 * @fileoverview Módulo completo de gestión de servicios veterinarios para el administrador
 * @author VetUni Development Team
 * @version 2.0.0
 * 
 * Funcionalidades principales:
 * - Crear, editar y eliminar servicios
 * - Activar/desactivar servicios
 * - Visualizar lista de servicios con filtros
 * - Búsqueda por nombre
 * - Estadísticas de servicios
 * - Validación de datos
 * - Persistencia en localStorage
 * 
 * @requires localStorage - Almacenamiento de servicios
 * @requires mockAuthService - Servicio de autenticación
 * 
 * Buenas prácticas aplicadas:
 * - Código modular y documentado
 * - Validación de datos
 * - Manejo de errores
 * - Separación de responsabilidades
 * - Funciones reutilizables
 * - Comentarios descriptivos
 * - JSDoc en funciones principales
 */

// ========== VARIABLES GLOBALES ==========

/** @type {string|null} ID del servicio en edición */
let currentEditingServiceId = null;

/** @type {string} Vista actual ('list' o 'new') */
let currentView = 'list';

/** @type {string} Sección actual de servicios */
let currentServicesSection = 'list';

/** @type {Array} Lista completa de servicios */
let allServices = [];

// ========== INICIALIZACIÓN ==========

/**
 * Inicializa el módulo cuando se carga la sección
 * @returns {void}
 */
(function() {
    setTimeout(() => {
        if (document.getElementById('servicesListView')) {
            initServices();
        }
    }, 150);
})();

/**
 * Inicializa el módulo de servicios
 * Esta función se puede llamar desde admin.js con el sectionId
 * @param {string} sectionId - ID de la sección ('list', 'new', 'services-list', 'services-new')
 * @returns {void}
 */
function initServices(sectionId = 'list') {
    console.log('🔵 initServices llamado con sectionId:', sectionId);
    currentServicesSection = sectionId;
    
    // Inicializar servicios si no existen
    initializeServicesStorage();
    
    // Cargar servicios
    loadAllServices();
    
    // Siempre mostrar la vista de lista
    setTimeout(() => {
        showServicesListView();
        
        // Si se solicita abrir el modal directamente
        if (sectionId === 'new' || sectionId === 'services-new') {
            setTimeout(() => {
                openCreateServiceModal();
            }, 300);
        }
    }, 100);
}

/**
 * Función global para cambiar de vista desde admin.js
 * @param {string} sectionId - ID de la sección
 * @returns {void}
 */
function showServicesSection(sectionId) {
    initServices(sectionId);
}

/**
 * Inicializa el almacenamiento de servicios si no existe
 * @returns {void}
 */
function initializeServicesStorage() {
    try {
        const existing = localStorage.getItem('vetuni:mockServices');
        if (!existing) {
            // Crear servicios por defecto basados en los del veterinario
            const defaultServices = [
                {
                    id: 'consulta-general',
                    name: 'Consulta general',
                    description: 'Consulta médica general para diagnóstico y revisión',
                    basePrice: 30.00,
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'desparasitacion',
                    name: 'Desparasitación',
                    description: 'Servicio de desparasitación interna y externa',
                    basePrice: 25.00,
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'bano-medicado',
                    name: 'Baño medicado',
                    description: 'Baño terapéutico con productos especiales',
                    basePrice: 35.00,
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'urgencias',
                    name: 'Urgencias',
                    description: 'Atención de urgencias veterinarias',
                    basePrice: 50.00,
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'vacunacion',
                    name: 'Vacunación',
                    description: 'Aplicación de vacunas según esquema de vacunación',
                    basePrice: 20.00,
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'cirugia',
                    name: 'Cirugía',
                    description: 'Servicio de cirugía veterinaria',
                    basePrice: 150.00,
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'radiografia',
                    name: 'Radiografía',
                    description: 'Servicio de radiografías diagnósticas',
                    basePrice: 45.00,
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'laboratorio',
                    name: 'Laboratorio',
                    description: 'Análisis de laboratorio clínico',
                    basePrice: 40.00,
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'ecografia',
                    name: 'Ecografía',
                    description: 'Servicio de ecografías diagnósticas',
                    basePrice: 60.00,
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'control-post-operatorio',
                    name: 'Control post-operatorio',
                    description: 'Control y seguimiento post-operatorio',
                    basePrice: 25.00,
                    active: true,
                    createdAt: new Date().toISOString()
                }
            ];
            
            localStorage.setItem('vetuni:mockServices', JSON.stringify(defaultServices));
        }
    } catch (error) {
        console.error('Error al inicializar servicios:', error);
    }
}

/**
 * Carga todos los servicios del almacenamiento
 * @returns {void}
 */
function loadAllServices() {
    try {
        allServices = JSON.parse(localStorage.getItem('vetuni:mockServices') || '[]');
    } catch (error) {
        console.error('Error al cargar servicios:', error);
        allServices = [];
        showToast('Error al cargar los servicios', 'error');
    }
}

// ========== GESTIÓN DE VISTAS ==========

/**
 * Muestra la vista de lista de servicios
 * @returns {void}
 */
function showServicesListView() {
    console.log('🔵 showServicesListView llamado');
    currentView = 'list';
    const listView = document.getElementById('servicesListView');
    
    if (listView) {
        listView.style.display = 'block';
        console.log('✅ Vista de lista mostrada');
    } else {
        console.error('❌ servicesListView no encontrado en el DOM');
    }
    
    loadServicesList();
    loadServiceStatistics();
}

/**
 * Muestra la vista de nuevo/editar servicio
 * @param {string|null} serviceId - ID del servicio a editar (null para nuevo)
 * @returns {void}
 */
/**
 * Abre el modal para crear un nuevo servicio
 * @returns {void}
 */
function openCreateServiceModal() {
    console.log('🔵 openCreateServiceModal llamado');
    currentEditingServiceId = null;
    
    // Intentar encontrar el modal inmediatamente
    let modal = document.getElementById('createServiceModal');
    
    if (modal) {
        console.log('✅ Modal encontrado inmediatamente');
        showServiceModalContent(modal);
        return;
    }
    
    // Si no se encuentra, buscar en el contenedor de secciones
    console.log('⏳ Modal no encontrado en body, buscando en contenedor...');
    const sectionContainer = document.getElementById('adminSectionsContainer');
    if (sectionContainer) {
        const modalInContainer = sectionContainer.querySelector('#createServiceModal');
        if (modalInContainer) {
            console.log('✅ Modal encontrado en el contenedor, moviéndolo al body');
            // Mover el modal al body (no clonar, mover directamente)
            document.body.appendChild(modalInContainer);
            modal = document.getElementById('createServiceModal');
            if (modal) {
                showServiceModalContent(modal);
                return;
            }
        }
    }
    
    // Si aún no se encuentra, esperar y reintentar
    console.log('⏳ Iniciando reintentos para encontrar el modal...');
    let retries = 0;
    const maxRetries = 25; // Aumentar a 25 intentos (5 segundos)
    
    const checkModal = setInterval(() => {
        modal = document.getElementById('createServiceModal');
        retries++;
        
        if (modal) {
            clearInterval(checkModal);
            console.log(`✅ Modal encontrado después de ${retries} intentos`);
            showServiceModalContent(modal);
        } else if (retries >= maxRetries) {
            clearInterval(checkModal);
            console.error(`❌ Modal createServiceModal no encontrado después de ${maxRetries} intentos`);
            console.log('📋 Verificando modales disponibles:', Array.from(document.querySelectorAll('[id*="Modal"]')).map(m => m.id));
            showToast('Error: No se pudo cargar el formulario. Por favor, recarga la página o navega nuevamente a la sección de Servicios.', 'error');
        }
    }, 200);
}

/**
 * Muestra el contenido del modal de servicio
 * @param {HTMLElement} modal - Elemento del modal
 * @param {string|null} serviceId - ID del servicio a editar (null para nuevo)
 * @returns {void}
 */
function showServiceModalContent(modal, serviceId = null) {
    if (!modal) return;
    
    console.log('📋 Mostrando modal:', modal.id);
    
    const title = document.getElementById('serviceModalTitle');
    const form = document.getElementById('serviceForm');
    
    if (title) title.textContent = serviceId ? 'Editar Servicio' : 'Nuevo Servicio';
    if (form && !serviceId) form.reset();
    
    if (serviceId) {
        loadServiceForEdit(serviceId);
    } else {
        resetServiceForm();
    }
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal mostrado correctamente');
}

/**
 * Cierra el modal de crear/editar servicio
 * @returns {void}
 */
function closeCreateServiceModal() {
    const modal = document.getElementById('createServiceModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Función obsoleta - mantener por compatibilidad pero ahora usa modal
 * @param {string|null} serviceId - ID del servicio a editar
 * @returns {void}
 */
function showServicesNewView(serviceId = null) {
    // Redirigir a la función del modal
    if (serviceId) {
        openCreateServiceModal();
        // Esperar un poco para que el modal se abra antes de cargar los datos
        setTimeout(() => {
            const modal = document.getElementById('createServiceModal');
            if (modal) {
                showServiceModalContent(modal, serviceId);
            }
        }, 300);
    } else {
        openCreateServiceModal();
    }
}

// ========== CARGA Y RENDERIZADO ==========

/**
 * Carga la lista de servicios en la tabla
 * @returns {void}
 */
function loadServicesList() {
    const tbody = document.getElementById('servicesTableBody');
    if (!tbody) return;
    
    if (allServices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:3rem; color:var(--gray-500);">
                    <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                    <div style="font-size:1.1rem; font-weight:600; margin-bottom:0.5rem;">No hay servicios registrados</div>
                    <div style="font-size:0.9rem;">Haz clic en "Nuevo Servicio" para crear uno</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allServices.map(service => renderServiceRow(service)).join('');
}

/**
 * Renderiza una fila de servicio en la tabla
 * @param {Object} service - Objeto de servicio
 * @returns {string} HTML de la fila
 */
function renderServiceRow(service) {
    const statusColor = service.active !== false ? '#4CAF50' : '#757575';
    const statusText = service.active !== false ? 'Activo' : 'Inactivo';
    const statusIcon = service.active !== false ? 'fa-check-circle' : 'fa-times-circle';
    
    return `
        <tr style="border-bottom:1px solid var(--gray-200); transition:background 0.2s ease;" 
            onmouseover="this.style.background='var(--gray-50)'" 
            onmouseout="this.style.background='var(--white)'">
            <td style="padding:0.75rem; color:var(--gray-600); font-weight:500;">${escapeHtml(service.id)}</td>
            <td style="padding:0.75rem; font-weight:600; color:var(--gray-900);">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <i class="fa-solid fa-stethoscope" style="color:var(--primary-color);"></i>
                    ${escapeHtml(service.name)}
                </div>
            </td>
            <td style="padding:0.75rem; color:var(--gray-700); max-width:300px;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(service.description || 'Sin descripción')}">
                    ${escapeHtml(service.description || 'Sin descripción')}
                </div>
            </td>
            <td style="padding:0.75rem; text-align:right; font-weight:600; color:var(--primary-color);">
                $${formatCurrency(service.basePrice)}
            </td>
            <td style="padding:0.75rem; text-align:center;">
                <span style="background:${statusColor}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">
                    <i class="fa-solid ${statusIcon}"></i> ${statusText}
                </span>
            </td>
            <td style="padding:0.75rem; text-align:center;">
                <div style="display:flex; gap:0.5rem; justify-content:center;">
                    <button class="action-btn action-btn-view" onclick="viewServiceDetail('${service.id}')" title="Ver detalles">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn action-btn-edit" onclick="editService('${service.id}')" title="Editar">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    ${service.active !== false ? `
                        <button class="action-btn" style="background:linear-gradient(135deg, #757575, #9E9E9E);" onclick="toggleServiceStatus('${service.id}')" title="Desactivar">
                            <i class="fa-solid fa-toggle-on"></i>
                        </button>
                    ` : `
                        <button class="action-btn" style="background:linear-gradient(135deg, #4CAF50, #66BB6A);" onclick="toggleServiceStatus('${service.id}')" title="Activar">
                            <i class="fa-solid fa-toggle-off"></i>
                        </button>
                    `}
                    <button class="action-btn action-btn-delete" onclick="deleteService('${service.id}')" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Carga las estadísticas de servicios
 * @returns {void}
 */
function loadServiceStatistics() {
    const totalServices = allServices.length;
    const activeServices = allServices.filter(s => s.active !== false).length;
    const inactiveServices = allServices.filter(s => s.active === false).length;
    
    const statTotal = document.getElementById('statTotalServices');
    const statActive = document.getElementById('statActiveServices');
    const statInactive = document.getElementById('statInactiveServices');
    
    if (statTotal) statTotal.textContent = totalServices;
    if (statActive) statActive.textContent = activeServices;
    if (statInactive) statInactive.textContent = inactiveServices;
}

// ========== FILTROS Y BÚSQUEDA ==========

/**
 * Filtra los servicios según los criterios de búsqueda
 * @returns {void}
 */
function filterServices() {
    const searchTerm = document.getElementById('serviceSearch')?.value.toLowerCase().trim() || '';
    const statusFilter = document.getElementById('serviceStatusFilter')?.value || '';
    const rows = document.querySelectorAll('#servicesTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const isActive = row.querySelector('.fa-check-circle') !== null;
        
        let matchesSearch = true;
        let matchesStatus = true;
        
        // Filtro de búsqueda
        if (searchTerm && !text.includes(searchTerm)) {
            matchesSearch = false;
        }
        
        // Filtro de estado
        if (statusFilter === 'active' && !isActive) {
            matchesStatus = false;
        } else if (statusFilter === 'inactive' && isActive) {
            matchesStatus = false;
        }
        
        row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
    });
}

// ========== FORMULARIO ==========

/**
 * Resetea el formulario de servicio
 * @returns {void}
 */
function resetServiceForm() {
    currentEditingServiceId = null;
    const title = document.getElementById('serviceModalTitle');
    if (title) title.textContent = 'Nuevo Servicio';
    
    const form = document.getElementById('serviceForm');
    if (form) form.reset();
    
    const activeField = document.getElementById('serviceActive');
    if (activeField) activeField.checked = true;
}

/**
 * Carga un servicio para editar
 * @param {string} serviceId - ID del servicio
 * @returns {void}
 */
function loadServiceForEdit(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    
    if (!service) {
        showToast('Servicio no encontrado', 'error');
        showServicesListView();
        return;
    }
    
    currentEditingServiceId = serviceId;
    
    // Actualizar título del formulario
    const title = document.getElementById('serviceModalTitle');
    if (title) title.textContent = 'Editar Servicio';
    
    // Llenar formulario
    document.getElementById('serviceName').value = service.name || '';
    document.getElementById('servicePrice').value = service.basePrice || 0;
    document.getElementById('serviceDescription').value = service.description || '';
    document.getElementById('serviceActive').checked = service.active !== false;
}

/**
 * Guarda un servicio (crear o editar)
 * @returns {void}
 */
function saveService() {
    const name = document.getElementById('serviceName').value.trim();
    const price = parseFloat(document.getElementById('servicePrice').value);
    const description = document.getElementById('serviceDescription').value.trim();
    const active = document.getElementById('serviceActive').checked;
    
    // Validaciones
    if (!name) {
        showToast('Por favor, ingresa el nombre del servicio', 'error');
        return;
    }
    
    if (!price || price < 0) {
        showToast('Por favor, ingresa un precio válido', 'error');
        return;
    }
    
    try {
        loadAllServices(); // Recargar para tener datos actualizados
        
        if (currentEditingServiceId) {
            // Editar servicio existente
            const index = allServices.findIndex(s => s.id === currentEditingServiceId);
            if (index !== -1) {
                allServices[index] = {
                    ...allServices[index],
                    name: name,
                    basePrice: price,
                    description: description || undefined,
                    active: active,
                    updatedAt: new Date().toISOString()
                };
                showToast('Servicio actualizado exitosamente', 'success');
            } else {
                showToast('Servicio no encontrado para editar', 'error');
                return;
            }
        } else {
            // Crear nuevo servicio
            const serviceId = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            
            // Verificar si ya existe un servicio con ese ID
            if (allServices.find(s => s.id === serviceId)) {
                const timestamp = Date.now();
                const newServiceId = `${serviceId}-${timestamp}`;
                allServices.push({
                    id: newServiceId,
                    name: name,
                    basePrice: price,
                    description: description || undefined,
                    active: active,
                    createdAt: new Date().toISOString()
                });
            } else {
                allServices.push({
                    id: serviceId,
                    name: name,
                    basePrice: price,
                    description: description || undefined,
                    active: active,
                    createdAt: new Date().toISOString()
                });
            }
            
            showToast('Servicio creado exitosamente', 'success');
        }
        
        // Guardar en localStorage
        localStorage.setItem('vetuni:mockServices', JSON.stringify(allServices));
        
        // Cerrar modal y recargar lista
        closeCreateServiceModal();
        loadServicesList();
        loadServiceStatistics();
        
    } catch (error) {
        console.error('Error al guardar servicio:', error);
        showToast('Error al guardar el servicio', 'error');
    }
}

/**
 * Edita un servicio
 * @param {string} serviceId - ID del servicio
 * @returns {void}
 */
function editService(serviceId) {
    openCreateServiceModal();
    // Esperar un poco para que el modal se abra antes de cargar los datos
    setTimeout(() => {
        const modal = document.getElementById('createServiceModal');
        if (modal) {
            showServiceModalContent(modal, serviceId);
        }
    }, 300);
}

/**
 * Elimina un servicio
 * @param {string} serviceId - ID del servicio a eliminar
 * @returns {void}
 */
function deleteService(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    
    if (!service) {
        showToast('Servicio no encontrado', 'error');
        return;
    }
    
    if (!confirm(`¿Estás seguro de que deseas eliminar el servicio "${service.name}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        allServices = allServices.filter(s => s.id !== serviceId);
        localStorage.setItem('vetuni:mockServices', JSON.stringify(allServices));
        
        showToast('Servicio eliminado exitosamente', 'success');
        loadServicesList();
        loadServiceStatistics();
        
    } catch (error) {
        console.error('Error al eliminar servicio:', error);
        showToast('Error al eliminar el servicio', 'error');
    }
}

/**
 * Cambia el estado activo/inactivo de un servicio
 * @param {string} serviceId - ID del servicio
 * @returns {void}
 */
function toggleServiceStatus(serviceId) {
    try {
        const service = allServices.find(s => s.id === serviceId);
        
        if (!service) {
            showToast('Servicio no encontrado', 'error');
            return;
        }
        
        service.active = !service.active;
        service.updatedAt = new Date().toISOString();
        
        localStorage.setItem('vetuni:mockServices', JSON.stringify(allServices));
        
        loadServicesList();
        loadServiceStatistics();
        
        const statusText = service.active ? 'activado' : 'desactivado';
        showToast(`Servicio ${statusText} exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error al cambiar estado del servicio:', error);
        showToast('Error al cambiar el estado del servicio', 'error');
    }
}

/**
 * Muestra el detalle de un servicio (modal o alert)
 * @param {string} serviceId - ID del servicio
 * @returns {void}
 */
function viewServiceDetail(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    
    if (!service) {
        showToast('Servicio no encontrado', 'error');
        return;
    }
    
    const statusText = service.active !== false ? 'Activo' : 'Inactivo';
    const statusColor = service.active !== false ? '#4CAF50' : '#757575';
    const createdDate = service.createdAt 
        ? new Date(service.createdAt).toLocaleDateString('es-ES')
        : 'No disponible';
    
    const detailHTML = `
        <div style="padding:1.5rem;">
            <h3 style="color:var(--gray-900); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">
                <i class="fa-solid fa-stethoscope" style="color:var(--primary-color);"></i>
                ${escapeHtml(service.name)}
            </h3>
            
            <div style="display:grid; gap:1rem; margin-bottom:1rem;">
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">ID del Servicio</div>
                    <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(service.id)}</div>
                </div>
                
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Precio Base</div>
                    <div style="font-weight:600; color:var(--primary-color); font-size:1.2rem;">$${formatCurrency(service.basePrice)}</div>
                </div>
                
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid ${statusColor};">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Estado</div>
                    <span style="background:${statusColor}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                        ${statusText}
                    </span>
                </div>
                
                ${service.description ? `
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.5rem; font-weight:600;">Descripción</div>
                    <div style="color:var(--gray-700); line-height:1.6;">${escapeHtml(service.description)}</div>
                </div>
                ` : ''}
                
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Fecha de Creación</div>
                    <div style="color:var(--gray-700);">${createdDate}</div>
                </div>
            </div>
        </div>
    `;
    
    // Crear modal simple
    const modal = document.createElement('div');
    modal.className = 'patient-modal show';
    modal.innerHTML = `
        <div class="patient-modal-content" style="max-width:600px;">
            <div class="patient-modal-header">
                <h2 class="patient-modal-title">
                    <i class="fa-solid fa-eye"></i> Detalle del Servicio
                </h2>
                <button class="patient-modal-close" onclick="this.closest('.patient-modal').remove(); document.body.style.overflow='';">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="patient-modal-body">
                ${detailHTML}
            </div>
            <div class="patient-modal-footer" style="padding:1rem 1.5rem; border-top:1px solid var(--gray-200); display:flex; gap:0.75rem; justify-content:flex-end;">
                <button class="submit-btn" onclick="editService('${serviceId}'); this.closest('.patient-modal').remove(); document.body.style.overflow='';">
                    <i class="fa-solid fa-pencil"></i> Editar Servicio
                </button>
                <button class="submit-btn btn-secondary" onclick="this.closest('.patient-modal').remove(); document.body.style.overflow='';">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    };
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
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
window.showServicesListView = showServicesListView;
window.showServicesNewView = showServicesNewView;
window.openCreateServiceModal = openCreateServiceModal;
window.closeCreateServiceModal = closeCreateServiceModal;
window.filterServices = filterServices;
window.saveService = saveService;
window.editService = editService;
window.deleteService = deleteService;
window.toggleServiceStatus = toggleServiceStatus;
window.viewServiceDetail = viewServiceDetail;
window.initServices = initServices;
window.showServicesSection = showServicesSection;

