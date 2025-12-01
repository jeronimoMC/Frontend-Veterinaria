/**
 * ============================================
 * ADMIN PANEL - NAVEGACIÓN Y CORE
 * ============================================
 * Este archivo maneja solo la navegación y carga dinámica de secciones
 * Cada sección tendrá su propio archivo HTML y JS
 */

document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión
    const session = window.apiService?.getCurrentUser?.();
    if (!session) {
        window.location.replace('../auth/index.html');
        return;
    }

    const userRole = String(session.role || '').toUpperCase();
    const userEmail = String(session.email || '').toLowerCase();

    if (!userRole.includes('ADMIN') && !userEmail.includes('admin')) {
        window.location.replace('../client/index.html');
        return;
    }

    // Mostrar nombre del usuario
    const label = document.getElementById('adminUserLabel');
    if (label) {
        label.textContent = `${session.firstName || 'Admin'} • Administrador`;
    }

    // Cargar dashboard por defecto
    showAdminSection('dashboard');
    
    console.log('✅ Admin panel initialized');
});

/**
 * Muestra una sección del admin
 */
function showAdminSection(sectionId) {
    // Cerrar sidebar en móvil
    if (window.innerWidth <= 1024) {
        toggleSidebar();
    }
    
    // Actualizar título de la sección
    const sectionTitles = {
        'dashboard': { icon: 'fa-chart-line', title: 'Dashboard General' },
        'products': { icon: 'fa-box', title: 'Productos' },
        'products-list': { icon: 'fa-box', title: 'Productos' },
        'services': { icon: 'fa-stethoscope', title: 'Servicios' },
        'services-list': { icon: 'fa-stethoscope', title: 'Servicios' },
        'appointments': { icon: 'fa-calendar', title: 'Citas' },
        'appointments-list': { icon: 'fa-calendar-days', title: 'Citas' },
        'clients': { icon: 'fa-user', title: 'Clientes' },
        'clients-list': { icon: 'fa-user', title: 'Clientes' },
        'pets': { icon: 'fa-paw', title: 'Mascotas' },
        'pets-list': { icon: 'fa-paw', title: 'Mascotas' },
        'invoices': { icon: 'fa-receipt', title: 'Facturas' },
        'veterinarians': { icon: 'fa-user-doctor', title: 'Veterinarios' },
        'veterinarians-list': { icon: 'fa-user-doctor', title: 'Veterinarios' },
        'reports': { icon: 'fa-chart-bar', title: 'Reportes' },
        'reports-sales': { icon: 'fa-chart-bar', title: 'Reportes' },
        'settings': { icon: 'fa-gear', title: 'Configuración' },
        'settings-users': { icon: 'fa-gear', title: 'Configuración' }
    };
    
    // Si no encontramos la sección exacta, intentar con la base
    let sectionInfo = sectionTitles[sectionId];
    if (!sectionInfo) {
        const baseSection = sectionId.split('-')[0];
        sectionInfo = sectionTitles[baseSection] || { icon: 'fa-circle', title: 'Panel de Administración' };
    }
    const titleElement = document.getElementById('adminSectionTitle');
    if (titleElement) {
        titleElement.innerHTML = `<i class="fa-solid ${sectionInfo.icon}"></i> ${sectionInfo.title}`;
    }
    
    // Actualizar menú activo
    updateActiveMenu(sectionId);
    
    // Cargar contenido de la sección
    loadSectionContent(sectionId);
}

/**
 * Actualiza el menú activo en el sidebar
 */
function updateActiveMenu(sectionId) {
    // Remover activo de todos los links
    document.querySelectorAll('.admin-menu-link, .admin-menu-submenu-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mapa de secciones a menús
    const menuMap = {
        'dashboard': 'dashboard',
        'products': 'products',
        'services': 'services',
        'appointments': 'appointments',
        'clients': 'clients',
        'pets': 'pets',
        'invoices': 'invoices',
        'veterinarians': 'veterinarians',
        'reports': 'reports',
        'settings': 'settings'
    };
    
    // Mapear sectionId a menuId (soporta sufijos como -list)
    let menuItem = menuMap[sectionId];
    if (!menuItem) {
        // Intentar con la base (sin sufijo)
        const baseSection = sectionId.split('-')[0];
        menuItem = menuMap[baseSection];
    }
    
    // Si aún no encontramos, intentar mapeos comunes
    if (!menuItem) {
        if (sectionId.startsWith('products-')) menuItem = 'products';
        else if (sectionId.startsWith('services-')) menuItem = 'services';
        else if (sectionId.startsWith('appointments-')) menuItem = 'appointments';
        else if (sectionId.startsWith('clients-')) menuItem = 'clients';
        else if (sectionId.startsWith('pets-')) menuItem = 'pets';
        else if (sectionId.startsWith('veterinarians-')) menuItem = 'veterinarians';
        else if (sectionId.startsWith('reports-')) menuItem = 'reports';
        else if (sectionId.startsWith('settings-')) menuItem = 'settings';
    }
    
    if (menuItem) {
        const menuItemElement = document.querySelector(`[data-menu="${menuItem}"]`);
        if (menuItemElement) {
            menuItemElement.classList.add('active');
            
            // Activar el link dentro del menú
            const link = menuItemElement.querySelector('.admin-menu-link');
            if (link) {
                link.classList.add('active');
            }
        }
    }
}

/**
 * Toggle del submenu
 */
function toggleSubmenu(menuId) {
    const menuItem = document.querySelector(`[data-menu="${menuId}"]`);
    if (menuItem) {
        menuItem.classList.toggle('active');
    }
    return false;
}

/**
 * Toggle del sidebar en móvil
 */
function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('mobileMenuOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }
}

/**
 * Carga el contenido de una sección específica
 */
function loadSectionContent(sectionId) {
    const container = document.getElementById('adminSectionsContainer');
    const actionsContainer = document.getElementById('adminSectionActions');
    
    if (!container) return;
    
    // Limpiar acciones
    if (actionsContainer) {
        actionsContainer.innerHTML = '';
    }
    
    // Mostrar loading
    container.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--primary-color);"></i></div>';
    
    // Cargar contenido según la sección
    setTimeout(() => {
        // Intentar cargar desde archivo externo
        loadSectionFromFile(sectionId, container, actionsContainer);
    }, 100);
}

/**
 * Carga una sección desde archivo HTML externo
 */
async function loadSectionFromFile(sectionId, container, actionsContainer) {
    const sectionFiles = {
        'dashboard': './dashboard.html',
        'products': './products.html',
        'products-list': './products.html',
        'services': './services.html',
        'services-list': './services.html',
        'appointments': './appointments.html',
        'appointments-list': './appointments.html',
        'clients': './clients.html',
        'clients-list': './clients.html',
        'pets': './clients.html', // Usa el mismo archivo pero con vista de mascotas
        'pets-list': './clients.html',
        'invoices': './invoices.html',
        'veterinarians': './veterinarians.html',
        'veterinarians-list': './veterinarians.html',
        'reports': './reports.html',
        'reports-sales': './reports.html',
        'settings': './settings.html',
        'settings-users': './settings.html'
    };
    
    const filePath = sectionFiles[sectionId];
    
    if (filePath) {
        try {
            const response = await fetch(filePath);
            if (response.ok) {
                const html = await response.text();
                // Crear un div temporal para parsear el HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // Buscar el contenedor principal en el HTML cargado
                const sectionContent = tempDiv.querySelector('#sectionContent');
                const sectionActions = tempDiv.querySelector('#sectionActions');
                
                if (sectionContent) {
                    container.innerHTML = sectionContent.innerHTML;
        } else {
                    container.innerHTML = html;
                }
                
                if (sectionActions && actionsContainer) {
                    actionsContainer.innerHTML = sectionActions.innerHTML;
                }
                
                // IMPORTANTE: Cargar solo los modales de la sección actual
                // Primero, eliminar modales que pertenecen a otras secciones (limpieza)
                const sectionModalMap = {
                    'products': ['productModal', 'createProductModal', 'editProductModal'],
                    'products-list': ['createProductModal', 'editProductModal'],
                    'services': ['serviceModal', 'createServiceModal', 'editServiceModal', 'serviceDetailModal'],
                    'services-list': ['createServiceModal', 'editServiceModal', 'serviceDetailModal'],
                    'appointments': ['createAppointmentModalAdmin', 'appointmentDetailModalAdmin', 'rescheduleAppointmentModalAdmin', 'cancelAppointmentModalAdmin'],
                    'appointments-list': ['createAppointmentModalAdmin', 'appointmentDetailModalAdmin', 'rescheduleAppointmentModalAdmin', 'cancelAppointmentModalAdmin'],
                    'appointments-new': ['createAppointmentModalAdmin'],
                    'clients': ['createClientModal', 'clientDetailModal', 'createPetModal', 'petDetailModal'],
                    'clients-list': ['createClientModal', 'clientDetailModal', 'createPetModal', 'petDetailModal'],
                    'pets-list': ['createClientModal', 'clientDetailModal', 'createPetModal', 'petDetailModal'],
                    'clients-new': ['createClientModal'],
                    'pets': ['createPetModal', 'petDetailModal'],
                    'invoices': ['createInvoiceModalAdmin', 'invoiceDetailModalAdmin', 'cancelInvoiceModalAdmin'],
                    'veterinarians': ['createVeterinarianModal', 'veterinarianDetailModal', 'veterinarianScheduleModal'],
                    'veterinarians-list': ['createVeterinarianModal', 'veterinarianDetailModal', 'veterinarianScheduleModal'],
                    'reports': [],
                    'reports-sales': [],
                    'settings': ['settingsModal', 'createUserModal'],
                    'settings-users': ['settingsModal', 'createUserModal'],
                    'dashboard': []
                };
                
                // Determinar los modales permitidos para esta sección
                let currentSectionModals = sectionModalMap[sectionId] || [];
                
                // Si no encontramos modales directos, intentar con la sección base
                if (currentSectionModals.length === 0) {
                    const baseSection = sectionId.split('-')[0];
                    currentSectionModals = sectionModalMap[baseSection] || [];
                    console.log(`⚠️ No se encontraron modales para '${sectionId}', usando base '${baseSection}':`, currentSectionModals);
                }
                
                // Si aún no hay modales, intentar con la variante '-list'
                if (currentSectionModals.length === 0) {
                    const listSection = `${sectionId.split('-')[0]}-list`;
                    currentSectionModals = sectionModalMap[listSection] || [];
                    console.log(`⚠️ Intentando con '${listSection}':`, currentSectionModals);
                }
                
                // Limpiar modales de otras secciones antes de cargar los nuevos
                // PERO NO eliminar modales compartidos entre secciones relacionadas
                const sharedModals = ['createProductModal', 'createServiceModal', 'createClientModal', 'createPetModal'];
                Object.values(sectionModalMap).flat().forEach(modalId => {
                    // No eliminar si es un modal compartido o si pertenece a la sección actual
                    if (!currentSectionModals.includes(modalId) && !sharedModals.includes(modalId)) {
                        const oldModal = document.getElementById(modalId);
                        if (oldModal) {
                            oldModal.remove();
                        }
                    }
                });
                
                // Buscar modales en el HTML cargado
                const allDivs = tempDiv.querySelectorAll('div');
                const modals = Array.from(allDivs).filter(div => {
                    const id = div.id || '';
                    const classes = div.className || '';
                    // Es un modal si tiene ID con "Modal" o clase "patient-modal"
                    return id.includes('Modal') || id.includes('modal') || classes.includes('patient-modal');
                });
                
                // Solo cargar modales que pertenecen específicamente a esta sección
                console.log(`📦 Sección: ${sectionId}, Modales permitidos:`, currentSectionModals);
                console.log(`📦 Modales encontrados en HTML:`, Array.from(modals).map(m => m.id).filter(Boolean));
                
                modals.forEach(modal => {
                    const modalId = modal.id;
                    if (modalId && currentSectionModals.includes(modalId)) {
                        // Verificar si el modal ya existe
                        let existingModal = document.getElementById(modalId);
                        if (!existingModal) {
                            // Si no existe, agregarlo al body
                            const clonedModal = modal.cloneNode(true);
                            document.body.appendChild(clonedModal);
                            console.log(`✅ Modal ${modalId} cargado para sección ${sectionId}`);
                        } else {
                            // Si ya existe, actualizarlo
                            existingModal.replaceWith(modal.cloneNode(true));
                            console.log(`🔄 Modal ${modalId} actualizado para sección ${sectionId}`);
                        }
                    } else if (modalId && !currentSectionModals.includes(modalId)) {
                        // Este modal no pertenece a esta sección, asegurarse de que no esté en el body
                        const existingModal = document.getElementById(modalId);
                        if (existingModal) {
                            existingModal.remove();
                            console.log(`🗑️ Modal ${modalId} eliminado (no corresponde a ${sectionId})`);
                        }
                    } else if (modalId) {
                        console.log(`⚠️ Modal ${modalId} no está en la lista de permitidos para ${sectionId}`);
                    }
                });
                
                // Verificar si los modales esperados están en el DOM después de cargar
                console.log(`✅ Verificación final - Modales en DOM:`, currentSectionModals.map(id => ({
                    id: id,
                    existe: !!document.getElementById(id)
                })));
                
                // Cargar el JS correspondiente
                loadSectionScript(sectionId, sectionFiles[sectionId]);
                
        } else {
                // Si no existe el archivo, mostrar contenido por defecto
                container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--gray-600);">
                    <i class="fa-solid fa-wrench" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                    <p>Sección en desarrollo</p>
                    <p style="font-size:0.9rem; margin-top:0.5rem;">Esta sección se está desarrollando actualmente</p>
                </div>`;
            }
        } catch (error) {
            console.error('Error cargando sección:', error);
            container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--gray-600);">
                <i class="fa-solid fa-exclamation-triangle" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                <p>Error al cargar la sección</p>
            </div>`;
        }
    } else {
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--gray-600);">
            <i class="fa-solid fa-circle-question" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
            <p>Sección no encontrada</p>
        </div>`;
    }
}

/**
 * Carga el script JS de una sección
 */
function loadSectionScript(sectionId, htmlPath) {
    const jsPath = htmlPath.replace('.html', '.js');
    
    // Remover scripts anteriores de esta sección
    const existingScript = document.querySelector(`script[data-section="${sectionId}"]`);
    if (existingScript) {
        existingScript.remove();
    }
    
    // Crear y cargar el nuevo script
    const script = document.createElement('script');
    script.src = jsPath;
    script.dataset.section = sectionId;
    script.async = true;
    script.onload = () => {
        // Ejecutar función de inicialización si existe según la sección
        setTimeout(() => {
            // DASHBOARD
            if (sectionId === 'dashboard' && typeof initDashboard === 'function') {
                initDashboard();
            }
            // PRODUCTOS
            else if (sectionId === 'products' || sectionId === 'products-list') {
                if (typeof initProducts === 'function') {
                    console.log('🔵 Inicializando productos con initProducts');
                    initProducts('products-list');
                } else {
                    console.warn('⚠️ initProducts no está disponible');
                    // Esperar un poco y reintentar
                    setTimeout(() => {
                        if (typeof initProducts === 'function') {
                            initProducts('products-list');
                        } else {
                            console.error('❌ initProducts aún no está disponible después del timeout');
                        }
                    }, 500);
                }
                
                // Asegurar que el modal esté disponible después de cargar
                setTimeout(() => {
                    const createProductModal = document.getElementById('createProductModal');
                    if (!createProductModal) {
                        console.warn('⚠️ Modal createProductModal no está en el DOM después de initProducts');
                    } else {
                        console.log('✅ Modal createProductModal está disponible');
                    }
                }, 600);
            }
            // SERVICIOS
            else if (sectionId === 'services' || sectionId === 'services-list') {
                if (typeof initServices === 'function') {
                    console.log('🔵 Inicializando servicios con initServices');
                    initServices('services-list');
                } else {
                    console.warn('⚠️ initServices no está disponible');
                    // Esperar un poco y reintentar
                    setTimeout(() => {
                        if (typeof initServices === 'function') {
                            initServices('services-list');
                        } else {
                            console.error('❌ initServices aún no está disponible después del timeout');
                        }
                    }, 500);
                }
                
                // Asegurar que el modal esté disponible después de cargar
                setTimeout(() => {
                    const createServiceModal = document.getElementById('createServiceModal');
                    if (!createServiceModal) {
                        console.warn('⚠️ Modal createServiceModal no está en el DOM después de initServices');
                    } else {
                        console.log('✅ Modal createServiceModal está disponible');
                    }
                }, 600);
            }
            // FACTURAS
            else if (sectionId === 'invoices') {
                if (typeof initInvoices === 'function') {
                    initInvoices();
                }
                // Si se marcó que debe abrir el modal de nueva factura (desde dashboard)
                if (window.openInvoiceModal) {
                    const tryOpenModal = () => {
                        const modal = document.getElementById('createInvoiceModalAdmin');
                        if (modal && typeof openCreateInvoiceModalAdmin === 'function') {
                            openCreateInvoiceModalAdmin();
                            window.openInvoiceModal = false;
                        } else if (!modal) {
                            // Si el modal no existe, esperar un poco más (máximo 5 intentos)
                            if (!window._invoiceModalRetryCount) window._invoiceModalRetryCount = 0;
                            if (window._invoiceModalRetryCount < 5) {
                                window._invoiceModalRetryCount++;
                                setTimeout(tryOpenModal, 300);
                            } else {
                                console.error('No se pudo cargar el modal createInvoiceModalAdmin después de varios intentos');
                                showToast('Error: No se pudo cargar el formulario. Intenta recargar la página.', 'error');
                                window._invoiceModalRetryCount = 0;
                                window.openInvoiceModal = false;
                            }
                        }
                    };
                    window._invoiceModalRetryCount = 0;
                    setTimeout(tryOpenModal, 600);
                }
            }
            // CITAS - Mostrar calendario semanal por defecto
            else if (sectionId === 'appointments' && typeof initAppointments === 'function') {
                initAppointments();
                // Cambiar a vista de calendario semanal automáticamente
                setTimeout(() => {
                    if (typeof changeAppointmentView === 'function') {
                        changeAppointmentView('weekly');
                    }
                }, 200);
            }
            // CLIENTES
            else if ((sectionId === 'clients' || sectionId === 'clients-list') && typeof initClients === 'function') {
                initClients('clients-list');
                // Asegurar que los modales estén cargados después de un breve delay
                setTimeout(() => {
                    const createClientModal = document.getElementById('createClientModal');
                    if (!createClientModal) {
                        console.warn('⚠️ Modal createClientModal no está en el DOM después de initClients');
                        console.log('🔍 Todos los modales en el body:', Array.from(document.querySelectorAll('.patient-modal')).map(m => m.id));
                    } else {
                        console.log('✅ Modal createClientModal está disponible');
                    }
                }, 600);
            }
            // MASCOTAS
            else if ((sectionId === 'pets' || sectionId === 'pets-list') && typeof initClients === 'function') {
                initClients('pets-list');
                // Asegurar que los modales estén cargados
                setTimeout(() => {
                    const createPetModal = document.getElementById('createPetModal');
                    if (!createPetModal) {
                        console.warn('⚠️ Modal createPetModal no está en el DOM después de initClients');
                    } else {
                        console.log('✅ Modal createPetModal está disponible');
                    }
                }, 600);
            }
            // VETERINARIOS
            else if (sectionId === 'veterinarians' || sectionId === 'veterinarians-list') {
                if (typeof initVeterinarians === 'function') {
                    console.log('🔵 Inicializando veterinarios con initVeterinarians');
                    initVeterinarians('veterinarians-list');
                } else {
                    console.warn('⚠️ initVeterinarians no está disponible');
                    setTimeout(() => {
                        if (typeof initVeterinarians === 'function') {
                            initVeterinarians('veterinarians-list');
                        } else {
                            console.error('❌ initVeterinarians aún no está disponible después del timeout');
                        }
                    }, 500);
                }
                
                // Asegurar que los modales estén disponibles
                setTimeout(() => {
                    const createVetModal = document.getElementById('createVeterinarianModal');
                    if (!createVetModal) {
                        console.warn('⚠️ Modal createVeterinarianModal no está en el DOM');
                    } else {
                        console.log('✅ Modal createVeterinarianModal está disponible');
                    }
                }, 600);
            }
            // REPORTES
            else if (sectionId === 'reports' || sectionId === 'reports-sales') {
                if (typeof initReports === 'function') {
                    console.log('🔵 Inicializando reportes con initReports');
                    initReports('sales');
                } else {
                    console.warn('⚠️ initReports no está disponible');
                    setTimeout(() => {
                        if (typeof initReports === 'function') {
                            initReports('sales');
                        } else {
                            console.error('❌ initReports aún no está disponible después del timeout');
                        }
                    }, 500);
                }
            }
            // CONFIGURACIÓN
            else if (sectionId === 'settings' || sectionId === 'settings-users') {
                if (typeof initSettings === 'function') {
                    initSettings();
                } else {
                    console.warn('⚠️ initSettings no está disponible, reintentando...');
                    setTimeout(() => {
                        if (typeof initSettings === 'function') {
                            initSettings();
                        } else {
                            console.error('❌ initSettings no está disponible después del reintento');
                        }
                    }, 500);
                }
            }
        }, 200);
    };
    script.onerror = () => {
        console.log(`Script ${jsPath} no encontrado, usando funciones globales si existen`);
    };
    document.body.appendChild(script);
}

// Funciones helper globales para toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Función helper global para escapeHtml (disponible para todos los módulos)
window.escapeHtml = function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
};

// Asegurar que showAdminSection esté disponible globalmente
window.showAdminSection = showAdminSection;

// Asegurar que showToast esté disponible globalmente
window.showToast = showToast;
