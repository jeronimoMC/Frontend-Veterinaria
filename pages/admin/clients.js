/**
 * ============================================
 * ADMIN CLIENTS & PETS - MÓDULO COMPLETO DE CLIENTES Y MASCOTAS
 * ============================================
 * 
 * @fileoverview Módulo completo de gestión de clientes y mascotas para el administrador
 * @author VetUni Development Team
 * @version 2.0.0
 * 
 * Funcionalidades principales:
 * - Ver todos los clientes y sus mascotas
 * - Crear, editar y eliminar clientes
 * - Crear, editar y eliminar mascotas
 * - Ver historial médico de mascotas
 * - Activar/desactivar registros (borrado lógico)
 * - Filtros avanzados
 * - Estadísticas
 * - Vista de detalles completa
 * 
 * @requires localStorage - Almacenamiento de clientes y mascotas
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

/** @type {string} Vista actual ('clients' o 'pets') */
let currentClientsView = 'clients';

/** @type {string|null} ID del cliente en edición */
let currentEditingClientId = null;

/** @type {string|null} ID de la mascota en edición */
let currentEditingPetId = null;

/** @type {Array} Lista completa de clientes (sin filtrar) */
let allClients = [];

/** @type {Array} Lista completa de mascotas (sin filtrar) */
let allPets = [];

/** @type {Array} Lista filtrada de clientes */
let filteredClients = [];

/** @type {Array} Lista filtrada de mascotas */
let filteredPets = [];

// ========== INICIALIZACIÓN ==========

/**
 * Inicializa el módulo cuando se carga la sección
 * @returns {void}
 */
(function() {
    setTimeout(() => {
        if (document.getElementById('clientsViewContainer')) {
            initClients();
        }
    }, 150);
})();

/**
 * Inicializa el módulo de clientes y mascotas
 * @param {string} sectionId - ID de la sección ('clients-list', 'pets-list', 'clients-new')
 * @returns {void}
 */
function initClients(sectionId = 'clients-list') {
    loadAllClients();
    loadAllPets();
    loadClientStatistics();
    
    if (sectionId === 'pets-list') {
        switchClientsView('pets');
    } else {
        switchClientsView('clients');
    }
}

/**
 * Función global para cambiar de vista desde admin.js
 * @param {string} sectionId - ID de la sección
 * @returns {void}
 */
function showClientsSection(sectionId) {
    initClients(sectionId);
}

// ========== CARGA DE DATOS ==========

/**
 * Carga todos los clientes del almacenamiento
 * @returns {void}
 */
function loadAllClients() {
    try {
        const allUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        allClients = allUsers.filter(u => u.role === 'CLIENT' || !u.role);
        filteredClients = [...allClients];
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        allClients = [];
        filteredClients = [];
        showToast('Error al cargar los clientes', 'error');
    }
}

/**
 * Carga todas las mascotas del almacenamiento
 * @returns {void}
 */
function loadAllPets() {
    try {
        allPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        filteredPets = [...allPets];
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        allPets = [];
        filteredPets = [];
        showToast('Error al cargar las mascotas', 'error');
    }
}

// ========== GESTIÓN DE VISTAS ==========

/**
 * Cambia entre vista de clientes y mascotas
 * @param {string} view - Vista a mostrar ('clients' o 'pets')
 * @returns {void}
 */
function switchClientsView(view) {
    currentClientsView = view;
    
    const clientsView = document.getElementById('clientsViewContainer');
    const petsView = document.getElementById('petsViewContainer');
    const clientsBtn = document.getElementById('viewClientsBtn');
    const petsBtn = document.getElementById('viewPetsBtn');
    
    if (view === 'clients') {
        if (clientsView) clientsView.style.display = 'block';
        if (petsView) petsView.style.display = 'none';
        if (clientsBtn) clientsBtn.classList.add('active');
        if (clientsBtn) clientsBtn.classList.remove('btn-secondary');
        if (petsBtn) petsBtn.classList.remove('active');
        if (petsBtn) petsBtn.classList.add('btn-secondary');
        loadClientsList();
        loadOwnersForPetFilter();
    } else {
        if (clientsView) clientsView.style.display = 'none';
        if (petsView) petsView.style.display = 'block';
        if (petsBtn) petsBtn.classList.add('active');
        if (petsBtn) petsBtn.classList.remove('btn-secondary');
        if (clientsBtn) clientsBtn.classList.remove('active');
        if (clientsBtn) clientsBtn.classList.add('btn-secondary');
        loadPetsList();
        loadOwnersForPetFilter();
    }
    
    loadClientStatistics();
}

// ========== ESTADÍSTICAS ==========

/**
 * Carga las estadísticas de clientes y mascotas
 * @returns {void}
 */
function loadClientStatistics() {
    const statsContainer = document.getElementById('clientsStatsContainer');
    if (!statsContainer) return;
    
    const totalClients = allClients.length;
    const activeClients = allClients.filter(c => c.active !== false).length;
    const totalPets = allPets.length;
    const activePets = allPets.filter(p => p.active !== false).length;
    
    statsContainer.innerHTML = `
        <div style="text-align:center; padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Total Clientes</div>
            <div style="font-size:1.75rem; font-weight:700; color:var(--primary-color);">${totalClients}</div>
        </div>
        <div style="text-align:center; padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid #4CAF50;">
            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Clientes Activos</div>
            <div style="font-size:1.75rem; font-weight:700; color:#4CAF50;">${activeClients}</div>
        </div>
        <div style="text-align:center; padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid #2196F3;">
            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Total Mascotas</div>
            <div style="font-size:1.75rem; font-weight:700; color:#2196F3;">${totalPets}</div>
        </div>
        <div style="text-align:center; padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid #FF9800;">
            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Mascotas Activas</div>
            <div style="font-size:1.75rem; font-weight:700; color:#FF9800;">${activePets}</div>
        </div>
    `;
}

// ========== GESTIÓN DE CLIENTES ==========

/**
 * Carga la lista de clientes en la tabla
 * @returns {void}
 */
function loadClientsList() {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;
    
    if (filteredClients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:3rem; color:var(--gray-500);">
                    <i class="fa-solid fa-users" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                    <div style="font-size:1.1rem; font-weight:600; margin-bottom:0.5rem;">No hay clientes registrados</div>
                    <div style="font-size:0.9rem;">Haz clic en "Nuevo Cliente" para crear uno</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredClients.map(client => renderClientRow(client)).join('');
}

/**
 * Renderiza una fila de cliente en la tabla
 * @param {Object} client - Objeto de cliente
 * @returns {string} HTML de la fila
 */
function renderClientRow(client) {
    const statusColor = client.active !== false ? '#4CAF50' : '#757575';
    const statusText = client.active !== false ? 'Activo' : 'Inactivo';
    const statusIcon = client.active !== false ? 'fa-check-circle' : 'fa-times-circle';
    
    // Contar mascotas del cliente
    const clientPets = allPets.filter(p => client.pets && client.pets.includes(p.id));
    const petsCount = clientPets.length;
    
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email || 'Sin nombre';
    
    return `
        <tr style="border-bottom:1px solid var(--gray-200); transition:background 0.2s ease;" 
            onmouseover="this.style.background='var(--gray-50)'" 
            onmouseout="this.style.background='var(--white)'">
            <td style="padding:0.75rem; color:var(--gray-600); font-weight:500; font-size:0.85rem;">${escapeHtml(client.id || 'N/A')}</td>
            <td style="padding:0.75rem; font-weight:600; color:var(--gray-900);">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <i class="fa-solid fa-user" style="color:var(--primary-color);"></i>
                    ${escapeHtml(fullName)}
                </div>
            </td>
            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(client.identification || 'N/A')}</td>
            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(client.email || 'N/A')}</td>
            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(client.phone || 'N/A')}</td>
            <td style="padding:0.75rem; text-align:center;">
                <span style="background:var(--gray-100); color:var(--gray-700); padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">
                    <i class="fa-solid fa-paw"></i> ${petsCount}
                </span>
            </td>
            <td style="padding:0.75rem; text-align:center;">
                <span style="background:${statusColor}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">
                    <i class="fa-solid ${statusIcon}"></i> ${statusText}
                </span>
            </td>
            <td style="padding:0.75rem; text-align:center;">
                <div style="display:flex; gap:0.5rem; justify-content:center;">
                    <button class="action-btn action-btn-view" onclick="viewClientDetail('${client.id}')" title="Ver detalles">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn action-btn-edit" onclick="editClient('${client.id}')" title="Editar">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    ${client.active !== false ? `
                        <button class="action-btn" style="background:linear-gradient(135deg, #757575, #9E9E9E);" onclick="toggleClientStatus('${client.id}')" title="Desactivar">
                            <i class="fa-solid fa-toggle-on"></i>
                        </button>
                    ` : `
                        <button class="action-btn" style="background:linear-gradient(135deg, #4CAF50, #66BB6A);" onclick="toggleClientStatus('${client.id}')" title="Activar">
                            <i class="fa-solid fa-toggle-off"></i>
                        </button>
                    `}
                    <button class="action-btn action-btn-delete" onclick="deleteClient('${client.id}')" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Filtra los clientes según los criterios de búsqueda
 * @returns {void}
 */
function filterClients() {
    loadAllClients(); // Recargar clientes completos
    
    const searchTerm = document.getElementById('clientSearch')?.value.toLowerCase().trim() || '';
    const statusFilter = document.getElementById('filterClientStatus')?.value || '';
    
    filteredClients = allClients.filter(client => {
        // Filtro de búsqueda (nombre o email)
        if (searchTerm) {
            const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim().toLowerCase();
            const email = (client.email || '').toLowerCase();
            if (!fullName.includes(searchTerm) && !email.includes(searchTerm)) {
                return false;
            }
        }
        
        // Filtro de estado
        if (statusFilter === 'active' && client.active === false) {
            return false;
        } else if (statusFilter === 'inactive' && client.active !== false) {
            return false;
        }
        
        return true;
    });
    
    loadClientsList();
    loadClientStatistics();
}

/**
 * Limpia los filtros de clientes
 * @returns {void}
 */
function clearClientFilters() {
    document.getElementById('clientSearch').value = '';
    document.getElementById('filterClientStatus').value = '';
    filterClients();
}

// ========== CREAR/EDITAR CLIENTES ==========

/**
 * Abre el modal para crear un nuevo cliente
 * @returns {void}
 */
function openCreateClientModal() {
    console.log('🔵 openCreateClientModal llamado');
    currentEditingClientId = null;
    
    // Intentar encontrar el modal inmediatamente
    let modal = document.getElementById('createClientModal');
    
    if (modal) {
        console.log('✅ Modal encontrado inmediatamente');
        showModalContent(modal);
        return;
    }
    
    // Si no se encuentra, intentar cargarlo manualmente desde el HTML de la sección
    console.log('⏳ Modal no encontrado, intentando cargarlo...');
    
    // Buscar el modal en el contenedor de secciones
    const sectionContainer = document.getElementById('adminSectionsContainer');
    if (sectionContainer) {
        const modalInContainer = sectionContainer.querySelector('#createClientModal');
        if (modalInContainer) {
            console.log('✅ Modal encontrado en el contenedor, moviéndolo al body');
            const clonedModal = modalInContainer.cloneNode(true);
            document.body.appendChild(clonedModal);
            modal = document.getElementById('createClientModal');
            if (modal) {
                showModalContent(modal);
                return;
            }
        }
    }
    
    // Si aún no se encuentra, esperar y reintentar
    console.log('⏳ Iniciando reintentos para encontrar el modal...');
    let retries = 0;
    const maxRetries = 20; // Aumentar a 20 intentos (4 segundos)
    
    const checkModal = setInterval(() => {
        modal = document.getElementById('createClientModal');
        retries++;
        
        if (modal) {
            clearInterval(checkModal);
            console.log(`✅ Modal encontrado después de ${retries} intentos`);
            showModalContent(modal);
        } else if (retries >= maxRetries) {
            clearInterval(checkModal);
            console.error(`❌ Modal createClientModal no encontrado después de ${maxRetries} intentos`);
            console.log('📋 Modales disponibles en el DOM:', Array.from(document.querySelectorAll('.patient-modal, [id*="Modal"]')).map(m => m.id));
            showToast('Error: No se pudo cargar el formulario. Por favor, recarga la página o navega nuevamente a la sección de Clientes.', 'error');
        }
    }, 200);
}

/**
 * Muestra el contenido del modal de cliente
 * @param {HTMLElement} modal - Elemento del modal
 * @returns {void}
 */
function showModalContent(modal) {
    if (!modal) {
        console.error('❌ showModalContent: modal es null o undefined');
        return;
    }
    
    console.log('📋 Mostrando modal:', modal.id);
    
    const title = document.getElementById('createClientModalTitle');
    const form = document.getElementById('createClientForm');
    
    if (title) title.textContent = 'Nuevo Cliente';
    if (form) form.reset();
    
    const activeField = document.getElementById('clientActive');
    if (activeField) activeField.checked = true;
    
    // Restaurar label de contraseña
    const passwordRequired = document.getElementById('clientPasswordRequired');
    if (passwordRequired) passwordRequired.textContent = '*';
    
    // Limpiar errores
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal mostrado correctamente');
}

/**
 * Cierra el modal de crear cliente
 * @returns {void}
 */
function closeCreateClientModal() {
    const modal = document.getElementById('createClientModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Valida un campo del formulario de cliente en tiempo real
 * @param {string} fieldName - Nombre del campo a validar
 * @returns {void}
 */
function validateClientField(fieldName) {
    const errorElement = document.getElementById(`client${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Error`);
    if (!errorElement) return;
    
    let isValid = true;
    let errorMessage = '';
    
    switch(fieldName) {
        case 'firstName':
            const firstName = document.getElementById('clientFirstName').value.trim();
            if (!firstName) {
                isValid = false;
                errorMessage = 'El nombre es requerido';
            } else if (firstName.length < 2) {
                isValid = false;
                errorMessage = 'El nombre debe tener al menos 2 caracteres';
            }
            break;
            
        case 'lastName':
            const lastName = document.getElementById('clientLastName').value.trim();
            if (!lastName) {
                isValid = false;
                errorMessage = 'El apellido es requerido';
            } else if (lastName.length < 2) {
                isValid = false;
                errorMessage = 'El apellido debe tener al menos 2 caracteres';
            }
            break;
            
        case 'identification':
            const identification = document.getElementById('clientIdentification').value.trim();
            if (!identification) {
                isValid = false;
                errorMessage = 'La identificación es requerida';
            } else if (!/^\d{7,15}$/.test(identification)) {
                isValid = false;
                errorMessage = 'La identificación debe tener entre 7 y 15 dígitos';
            }
            break;
            
        case 'email':
            const email = document.getElementById('clientEmail').value.trim();
            if (!email) {
                isValid = false;
                errorMessage = 'El email es requerido';
            } else if (!isValidEmail(email)) {
                isValid = false;
                errorMessage = 'Ingresa un email válido';
            } else {
                // Verificar si el email ya existe (solo para nuevos clientes)
                if (!currentEditingClientId) {
                    const allUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
                    const emailExists = allUsers.some(u => u.email === email);
                    if (emailExists) {
                        isValid = false;
                        errorMessage = 'Este email ya está registrado';
                    }
                }
            }
            break;
            
        case 'phone':
            const phone = document.getElementById('clientPhone').value.trim();
            if (!phone) {
                isValid = false;
                errorMessage = 'El teléfono es requerido';
            } else if (!/^[+]?[\d\s\-\(\)]{8,15}$/.test(phone)) {
                isValid = false;
                errorMessage = 'Ingresa un teléfono válido (8-15 caracteres)';
            }
            break;
            
        case 'password':
            const password = document.getElementById('clientPassword').value;
            if (password && password.length < 8) {
                isValid = false;
                errorMessage = 'La contraseña debe tener al menos 8 caracteres';
            }
            break;
            
        case 'passwordConfirm':
            const passwordConfirm = document.getElementById('clientPasswordConfirm').value;
            const passwordValue = document.getElementById('clientPassword').value;
            if (passwordValue && passwordConfirm !== passwordValue) {
                isValid = false;
                errorMessage = 'Las contraseñas no coinciden';
            }
            break;
    }
    
    errorElement.textContent = isValid ? '' : errorMessage;
    return isValid;
}

/**
 * Genera una contraseña temporal aleatoria
 * @returns {string} Contraseña generada
 */
function generateTemporaryPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Guarda un cliente (crear o editar)
 * @returns {void}
 */
function saveClient() {
    const firstName = document.getElementById('clientFirstName').value.trim();
    const lastName = document.getElementById('clientLastName').value.trim();
    const identification = document.getElementById('clientIdentification').value.trim();
    const email = document.getElementById('clientEmail').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const address = document.getElementById('clientAddress').value.trim() || undefined;
    const password = document.getElementById('clientPassword').value;
    const passwordConfirm = document.getElementById('clientPasswordConfirm').value;
    const active = document.getElementById('clientActive').checked;
    
    // Validaciones
    if (!validateClientField('firstName') || !validateClientField('lastName') || 
        !validateClientField('identification') || !validateClientField('email') || 
        !validateClientField('phone')) {
        showToast('Por favor, corrige los errores en el formulario', 'error');
        return;
    }
    
    // Validar contraseñas si se proporcionaron
    if (password || passwordConfirm) {
        if (!validateClientField('password') || !validateClientField('passwordConfirm')) {
            showToast('Por favor, corrige los errores en las contraseñas', 'error');
            return;
        }
        if (password !== passwordConfirm) {
            showToast('Las contraseñas no coinciden', 'error');
            return;
        }
    }
    
    // Verificar si la identificación ya existe
    const allUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const identificationExists = allUsers.some(u => 
        u.identification === identification && 
        (!currentEditingClientId || u.id !== currentEditingClientId)
    );
    
    if (identificationExists) {
        document.getElementById('clientIdentificationError').textContent = 'Esta identificación ya está registrada';
        showToast('Esta identificación ya está registrada', 'error');
        return;
    }
    
    try {
        if (currentEditingClientId) {
            // Editar cliente existente
            const index = allUsers.findIndex(u => u.id === currentEditingClientId);
            if (index !== -1) {
                // Verificar si el email ya existe en otro usuario
                const emailExists = allUsers.some(u => u.id !== currentEditingClientId && u.email === email);
                if (emailExists) {
                    document.getElementById('clientEmailError').textContent = 'Este email ya está registrado en otro usuario';
                    showToast('Este email ya está registrado en otro usuario', 'error');
                    return;
                }
                
                const updatedClient = {
                    ...allUsers[index],
                    firstName: firstName,
                    lastName: lastName,
                    identification: identification,
                    email: email,
                    phone: phone,
                    address: address,
                    active: active,
                    updatedAt: new Date().toISOString()
                };
                
                // Actualizar contraseña si se proporcionó
                if (password) {
                    updatedClient.password = password;
                    updatedClient.passwordChangedAt = new Date().toISOString();
                }
                
                allUsers[index] = updatedClient;
                showToast('Cliente actualizado exitosamente', 'success');
            } else {
                showToast('Cliente no encontrado para editar', 'error');
                return;
            }
        } else {
            // Crear nuevo cliente
            // Verificar si el email ya existe
            const emailExists = allUsers.some(u => u.email === email);
            if (emailExists) {
                document.getElementById('clientEmailError').textContent = 'Este email ya está registrado';
                showToast('Este email ya está registrado', 'error');
                return;
            }
            
            const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Generar contraseña si no se proporcionó
            const finalPassword = password || generateTemporaryPassword();
            
            const newClient = {
                id: clientId,
                firstName: firstName,
                lastName: lastName,
                identification: identification,
                email: email,
                phone: phone,
                address: address,
                password: finalPassword,
                role: 'CLIENT',
                active: active,
                pets: [],
                createdAt: new Date().toISOString(),
                createdBy: 'ADMIN'
            };
            
            allUsers.push(newClient);
            
            // Mostrar contraseña temporal si fue generada
            if (!password) {
                const message = `Cliente creado exitosamente.\n\nContraseña temporal generada: ${finalPassword}\n\nPor favor, proporciona esta contraseña al cliente para que pueda iniciar sesión.`;
                alert(message);
                showToast('Cliente creado exitosamente. Revisa la contraseña temporal.', 'success');
            } else {
                showToast('Cliente creado exitosamente', 'success');
            }
        }
        
        localStorage.setItem('vetuni:mockUsers', JSON.stringify(allUsers));
        closeCreateClientModal();
        loadAllClients();
        filterClients();
        
    } catch (error) {
        console.error('Error al guardar cliente:', error);
        showToast('Error al guardar el cliente', 'error');
    }
}

/**
 * Edita un cliente
 * @param {string} clientId - ID del cliente
 * @returns {void}
 */
function editClient(clientId) {
    const client = allClients.find(c => c.id === clientId);
    
    if (!client) {
        showToast('Cliente no encontrado', 'error');
        return;
    }
    
    currentEditingClientId = clientId;
    
    const modal = document.getElementById('createClientModal');
    const title = document.getElementById('createClientModalTitle');
    
    if (title) title.textContent = 'Editar Cliente';
    
    // Llenar formulario
    document.getElementById('clientFirstName').value = client.firstName || '';
    document.getElementById('clientLastName').value = client.lastName || '';
    document.getElementById('clientIdentification').value = client.identification || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientAddress').value = client.address || '';
    document.getElementById('clientPassword').value = '';
    document.getElementById('clientPasswordConfirm').value = '';
    document.getElementById('clientActive').checked = client.active !== false;
    
    // Cambiar label de contraseña para edición
    const passwordRequired = document.getElementById('clientPasswordRequired');
    if (passwordRequired) passwordRequired.textContent = '';
    
    // Limpiar errores
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    
    // Mostrar modal
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Muestra el detalle de un cliente
 * @param {string} clientId - ID del cliente
 * @returns {void}
 */
function viewClientDetail(clientId) {
    const client = allClients.find(c => c.id === clientId);
    
    if (!client) {
        showToast('Cliente no encontrado', 'error');
        return;
    }
    
    // Obtener mascotas del cliente
    const clientPets = allPets.filter(p => client.pets && client.pets.includes(p.id));
    
    // Obtener citas del cliente
    const appointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const clientAppointments = appointments.filter(apt => apt.userId === clientId);
    
    // Obtener facturas del cliente
    const invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
    const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
    
    const statusColor = client.active !== false ? '#4CAF50' : '#757575';
    const statusText = client.active !== false ? 'Activo' : 'Inactivo';
    
    const detailHTML = `
        <div style="padding:1.5rem;">
            <div style="display:grid; gap:1rem;">
                <!-- Información básica -->
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <h3 style="margin:0 0 1rem 0; color:var(--gray-900); display:flex; align-items:center; gap:0.5rem;">
                        <i class="fa-solid fa-user" style="color:var(--primary-color);"></i>
                        Información Personal
                    </h3>
                    <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem;">
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Nombre</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(client.firstName || '')}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Apellido</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(client.lastName || '')}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Identificación / DNI</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(client.identification || 'N/A')}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Email</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(client.email || 'N/A')}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Teléfono</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(client.phone || 'N/A')}</div>
                        </div>
                        ${client.address ? `
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Dirección</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(client.address)}</div>
                        </div>
                        ` : ''}
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Estado</div>
                            <span style="background:${statusColor}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                                ${statusText}
                            </span>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">ID</div>
                            <div style="font-weight:500; color:var(--gray-700); font-family:monospace; font-size:0.85rem;">${escapeHtml(client.id || 'N/A')}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Mascotas -->
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid #2196F3;">
                    <h3 style="margin:0 0 1rem 0; color:var(--gray-900); display:flex; align-items:center; gap:0.5rem;">
                        <i class="fa-solid fa-paw" style="color:#2196F3;"></i>
                        Mascotas (${clientPets.length})
                    </h3>
                    ${clientPets.length === 0 ? `
                        <div style="text-align:center; padding:2rem; color:var(--gray-500);">
                            <i class="fa-solid fa-paw" style="font-size:2rem; margin-bottom:0.5rem; opacity:0.3;"></i>
                            <div>Este cliente no tiene mascotas registradas</div>
                        </div>
                    ` : `
                        <div style="display:grid; gap:0.75rem;">
                            ${clientPets.map(pet => `
                                <div style="background:var(--white); padding:0.75rem; border-radius:var(--border-radius-md); border:1px solid var(--gray-200); cursor:pointer; transition:all 0.2s ease;" 
                                     onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateX(4px)'" 
                                     onmouseout="this.style.borderColor='var(--gray-200)'; this.style.transform='translateX(0)'"
                                     onclick="viewPetDetail('${pet.id}'); closeClientDetailModal();">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <div>
                                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(pet.name)}</div>
                                            <div style="font-size:0.85rem; color:var(--gray-600);">${escapeHtml(pet.species || '')} • ${escapeHtml(pet.breed || 'Sin raza')}</div>
                                        </div>
                                        <i class="fa-solid fa-chevron-right" style="color:var(--gray-400);"></i>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
                
                <!-- Resumen -->
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem;">
                    <div style="padding:1rem; background:var(--white); border-radius:var(--border-radius-lg); border:1px solid var(--gray-200); text-align:center;">
                        <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Mascotas</div>
                        <div style="font-size:1.5rem; font-weight:700; color:var(--primary-color);">${clientPets.length}</div>
                    </div>
                    <div style="padding:1rem; background:var(--white); border-radius:var(--border-radius-lg); border:1px solid var(--gray-200); text-align:center;">
                        <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Citas</div>
                        <div style="font-size:1.5rem; font-weight:700; color:#2196F3;">${clientAppointments.length}</div>
                    </div>
                    <div style="padding:1rem; background:var(--white); border-radius:var(--border-radius-lg); border:1px solid var(--gray-200); text-align:center;">
                        <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Facturas</div>
                        <div style="font-size:1.5rem; font-weight:700; color:#FF9800;">${clientInvoices.length}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const content = document.getElementById('clientDetailContent');
    if (content) content.innerHTML = detailHTML;
    
    const footer = document.querySelector('#clientDetailModal .patient-modal-footer');
    if (footer) {
        footer.innerHTML = `
            <button class="submit-btn action-btn-edit" onclick="editClient('${clientId}'); closeClientDetailModal();">
                <i class="fa-solid fa-pencil"></i> Editar Cliente
            </button>
            <button class="submit-btn btn-secondary" onclick="closeClientDetailModal()">
                Cerrar
            </button>
        `;
    }
    
    const modal = document.getElementById('clientDetailModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de detalle de cliente
 * @returns {void}
 */
function closeClientDetailModal() {
    const modal = document.getElementById('clientDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Cambia el estado activo/inactivo de un cliente
 * @param {string} clientId - ID del cliente
 * @returns {void}
 */
function toggleClientStatus(clientId) {
    try {
        const allUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        const client = allUsers.find(u => u.id === clientId);
        
        if (!client) {
            showToast('Cliente no encontrado', 'error');
            return;
        }
        
        client.active = !client.active;
        client.updatedAt = new Date().toISOString();
        
        localStorage.setItem('vetuni:mockUsers', JSON.stringify(allUsers));
        
        loadAllClients();
        filterClients();
        loadClientStatistics();
        
        const statusText = client.active ? 'activado' : 'desactivado';
        showToast(`Cliente ${statusText} exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error al cambiar estado del cliente:', error);
        showToast('Error al cambiar el estado del cliente', 'error');
    }
}

/**
 * Elimina un cliente
 * @param {string} clientId - ID del cliente a eliminar
 * @returns {void}
 */
function deleteClient(clientId) {
    const client = allClients.find(c => c.id === clientId);
    
    if (!client) {
        showToast('Cliente no encontrado', 'error');
        return;
    }
    
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email;
    const clientPets = allPets.filter(p => client.pets && client.pets.includes(p.id));
    
    if (clientPets.length > 0) {
        if (!confirm(`El cliente "${fullName}" tiene ${clientPets.length} mascota(s) registrada(s).\n\n¿Deseas eliminar el cliente y todas sus mascotas?`)) {
            return;
        }
    } else {
        if (!confirm(`¿Estás seguro de que deseas eliminar el cliente "${fullName}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }
    }
    
    try {
        const allUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        const allPetsData = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        
        // Eliminar cliente
        const filteredUsers = allUsers.filter(u => u.id !== clientId);
        localStorage.setItem('vetuni:mockUsers', JSON.stringify(filteredUsers));
        
        // Eliminar mascotas del cliente si se confirmó
        if (clientPets.length > 0) {
            const filteredPets = allPetsData.filter(p => !client.pets.includes(p.id));
            localStorage.setItem('vetuni:mockPets', JSON.stringify(filteredPets));
        }
        
        showToast('Cliente eliminado exitosamente', 'success');
        loadAllClients();
        loadAllPets();
        filterClients();
        loadClientStatistics();
        
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        showToast('Error al eliminar el cliente', 'error');
    }
}

// ========== GESTIÓN DE MASCOTAS ==========

/**
 * Carga la lista de mascotas en la tabla
 * @returns {void}
 */
function loadPetsList() {
    const tbody = document.getElementById('petsTableBody');
    if (!tbody) return;
    
    if (filteredPets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:3rem; color:var(--gray-500);">
                    <i class="fa-solid fa-paw" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                    <div style="font-size:1.1rem; font-weight:600; margin-bottom:0.5rem;">No hay mascotas registradas</div>
                    <div style="font-size:0.9rem;">Haz clic en "Nueva Mascota" para crear una</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredPets.map(pet => renderPetRow(pet)).join('');
}

/**
 * Renderiza una fila de mascota en la tabla
 * @param {Object} pet - Objeto de mascota
 * @returns {string} HTML de la fila
 */
function renderPetRow(pet) {
    const statusColor = pet.active !== false ? '#4CAF50' : '#757575';
    const statusText = pet.active !== false ? 'Activo' : 'Inactivo';
    const statusIcon = pet.active !== false ? 'fa-check-circle' : 'fa-times-circle';
    
    // Buscar dueño de la mascota
    const owner = allClients.find(c => c.pets && c.pets.includes(pet.id));
    const ownerName = owner ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() : 'Sin dueño';
    
    // Calcular edad
    const age = pet.birthdate ? Math.floor((new Date() - new Date(pet.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
    const ageText = age === 'N/A' ? 'N/A' : `${age} años`;
    
    return `
        <tr style="border-bottom:1px solid var(--gray-200); transition:background 0.2s ease;" 
            onmouseover="this.style.background='var(--gray-50)'" 
            onmouseout="this.style.background='var(--white)'">
            <td style="padding:0.75rem; color:var(--gray-600); font-weight:500; font-size:0.85rem;">${escapeHtml(pet.id || 'N/A')}</td>
            <td style="padding:0.75rem; font-weight:600; color:var(--gray-900);">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <i class="fa-solid ${pet.species === 'Perro' ? 'fa-dog' : pet.species === 'Gato' ? 'fa-cat' : 'fa-paw'}" style="color:var(--primary-color);"></i>
                    ${escapeHtml(pet.name)}
                </div>
            </td>
            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(pet.species || 'N/A')}</td>
            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(pet.breed || 'Sin raza')}</td>
            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(ownerName)}</td>
            <td style="padding:0.75rem; text-align:center; color:var(--gray-700);">${ageText}</td>
            <td style="padding:0.75rem; text-align:center;">
                <span style="background:${statusColor}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">
                    <i class="fa-solid ${statusIcon}"></i> ${statusText}
                </span>
            </td>
            <td style="padding:0.75rem; text-align:center;">
                <div style="display:flex; gap:0.5rem; justify-content:center;">
                    <button class="action-btn action-btn-view" onclick="viewPetDetail('${pet.id}')" title="Ver detalles">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn action-btn-edit" onclick="editPet('${pet.id}')" title="Editar">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    ${pet.active !== false ? `
                        <button class="action-btn" style="background:linear-gradient(135deg, #757575, #9E9E9E);" onclick="togglePetStatus('${pet.id}')" title="Desactivar">
                            <i class="fa-solid fa-toggle-on"></i>
                        </button>
                    ` : `
                        <button class="action-btn" style="background:linear-gradient(135deg, #4CAF50, #66BB6A);" onclick="togglePetStatus('${pet.id}')" title="Activar">
                            <i class="fa-solid fa-toggle-off"></i>
                        </button>
                    `}
                    <button class="action-btn action-btn-delete" onclick="deletePet('${pet.id}')" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Carga los dueños en el filtro de mascotas
 * @returns {void}
 */
function loadOwnersForPetFilter() {
    try {
        const select = document.getElementById('filterPetOwner');
        if (!select) return;
        
        const optionsHTML = allClients
            .filter(c => c.active !== false)
            .map(c => {
                const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email;
                return `<option value="${c.id}">${escapeHtml(name)}</option>`;
            })
            .join('');
        
        select.innerHTML = '<option value="">Todos los dueños</option>' + optionsHTML;
    } catch (error) {
        console.error('Error al cargar dueños:', error);
    }
}

/**
 * Filtra las mascotas según los criterios de búsqueda
 * @returns {void}
 */
function filterPets() {
    loadAllPets(); // Recargar mascotas completas
    
    const searchTerm = document.getElementById('petSearch')?.value.toLowerCase().trim() || '';
    const speciesFilter = document.getElementById('filterPetSpecies')?.value || '';
    const ownerFilter = document.getElementById('filterPetOwner')?.value || '';
    const statusFilter = document.getElementById('filterPetStatus')?.value || '';
    
    filteredPets = allPets.filter(pet => {
        // Filtro de búsqueda (nombre)
        if (searchTerm && !pet.name.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Filtro de especie
        if (speciesFilter && pet.species !== speciesFilter) {
            return false;
        }
        
        // Filtro de dueño
        if (ownerFilter) {
            const owner = allClients.find(c => c.id === ownerFilter);
            if (!owner || !owner.pets || !owner.pets.includes(pet.id)) {
                return false;
            }
        }
        
        // Filtro de estado
        if (statusFilter === 'active' && pet.active === false) {
            return false;
        } else if (statusFilter === 'inactive' && pet.active !== false) {
            return false;
        }
        
        return true;
    });
    
    loadPetsList();
    loadClientStatistics();
}

/**
 * Limpia los filtros de mascotas
 * @returns {void}
 */
function clearPetFilters() {
    document.getElementById('petSearch').value = '';
    document.getElementById('filterPetSpecies').value = '';
    document.getElementById('filterPetOwner').value = '';
    document.getElementById('filterPetStatus').value = '';
    filterPets();
}

// ========== CREAR/EDITAR MASCOTAS ==========

/**
 * Abre el modal para crear una nueva mascota
 * @returns {void}
 */
function openCreatePetModal() {
    currentEditingPetId = null;
    const modal = document.getElementById('createPetModal');
    const title = document.getElementById('createPetModalTitle');
    
    if (title) title.textContent = 'Nueva Mascota';
    
    document.getElementById('createPetForm').reset();
    document.getElementById('petActive').checked = true;
    
    // Cargar dueños
    loadOwnersForPetForm();
    
    // Configurar fecha máxima (hoy)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('petBirthdate').setAttribute('max', today);
    
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de crear mascota
 * @returns {void}
 */
function closeCreatePetModal() {
    const modal = document.getElementById('createPetModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Carga los dueños en el formulario de mascota
 * @returns {void}
 */
function loadOwnersForPetForm() {
    try {
        const select = document.getElementById('petOwner');
        if (!select) return;
        
        const activeClients = allClients.filter(c => c.active !== false);
        const optionsHTML = activeClients.map(c => {
            const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email;
            return `<option value="${c.id}">${escapeHtml(name)}</option>`;
        }).join('');
        
        select.innerHTML = '<option value="">Seleccione un dueño</option>' + optionsHTML;
    } catch (error) {
        console.error('Error al cargar dueños:', error);
    }
}

/**
 * Valida que se haya seleccionado un dueño
 * @returns {void}
 */
function validatePetOwner() {
    const ownerSelect = document.getElementById('petOwner');
    if (ownerSelect && ownerSelect.value) {
        ownerSelect.setCustomValidity('');
    }
}

/**
 * Valida un campo del formulario de mascota
 * @param {string} fieldName - Nombre del campo a validar
 * @returns {void}
 */
function validatePetField(fieldName) {
    const errorElement = document.getElementById(`pet${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Error`);
    if (!errorElement) return;
    
    let isValid = true;
    let errorMessage = '';
    
    switch(fieldName) {
        case 'color':
            // Validación básica para color (opcional)
            break;
    }
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : errorMessage;
    }
    return isValid;
}

/**
 * Guarda una mascota (crear o editar)
 * @returns {void}
 */
function savePet() {
    const name = document.getElementById('petName').value.trim();
    const ownerId = document.getElementById('petOwner').value;
    const species = document.getElementById('petSpecies').value;
    const breed = document.getElementById('petBreed').value.trim() || undefined;
    const sex = document.getElementById('petSex').value;
    const birthdate = document.getElementById('petBirthdate').value || undefined;
    const weight = document.getElementById('petWeight').value ? parseFloat(document.getElementById('petWeight').value) : undefined;
    const color = document.getElementById('petColor').value.trim() || undefined;
    const notes = document.getElementById('petNotes').value.trim() || undefined;
    const active = document.getElementById('petActive').checked;
    
    // Validaciones
    if (!name || !ownerId || !species || !sex) {
        showToast('Por favor, completa todos los campos requeridos', 'error');
        return;
    }
    
    try {
        loadAllPets();
        const allUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        
        if (currentEditingPetId) {
            // Editar mascota existente
            const index = allPets.findIndex(p => p.id === currentEditingPetId);
            if (index !== -1) {
                const oldPet = allPets[index];
                allPets[index] = {
                    ...oldPet,
                    name: name,
                    species: species,
                    breed: breed,
                    sex: sex,
                    birthdate: birthdate,
                    weight: weight,
                    color: color,
                    notes: notes,
                    active: active,
                    updatedAt: new Date().toISOString()
                };
                
                showToast('Mascota actualizada exitosamente', 'success');
            } else {
                showToast('Mascota no encontrada para editar', 'error');
                return;
            }
        } else {
            // Crear nueva mascota
            const petId = `pet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newPet = {
                id: petId,
                name: name,
                species: species,
                breed: breed,
                sex: sex,
                birthdate: birthdate,
                weight: weight,
                color: color,
                notes: notes,
                active: active,
                createdAt: new Date().toISOString()
            };
            
            allPets.push(newPet);
            
            // Agregar la mascota al dueño
            const ownerIndex = allUsers.findIndex(u => u.id === ownerId);
            if (ownerIndex !== -1) {
                if (!allUsers[ownerIndex].pets) {
                    allUsers[ownerIndex].pets = [];
                }
                if (!allUsers[ownerIndex].pets.includes(petId)) {
                    allUsers[ownerIndex].pets.push(petId);
                }
                localStorage.setItem('vetuni:mockUsers', JSON.stringify(allUsers));
            }
            
            showToast('Mascota creada exitosamente', 'success');
        }
        
        localStorage.setItem('vetuni:mockPets', JSON.stringify(allPets));
        closeCreatePetModal();
        loadAllPets();
        loadAllClients();
        filterPets();
        loadClientStatistics();
        
    } catch (error) {
        console.error('Error al guardar mascota:', error);
        showToast('Error al guardar la mascota', 'error');
    }
}

/**
 * Edita una mascota
 * @param {string} petId - ID de la mascota
 * @returns {void}
 */
function editPet(petId) {
    const pet = allPets.find(p => p.id === petId);
    
    if (!pet) {
        showToast('Mascota no encontrada', 'error');
        return;
    }
    
    currentEditingPetId = petId;
    
    const modal = document.getElementById('createPetModal');
    const title = document.getElementById('createPetModalTitle');
    
    if (title) title.textContent = 'Editar Mascota';
    
    // Cargar dueños
    loadOwnersForPetForm();
    
    // Llenar formulario
    document.getElementById('petName').value = pet.name || '';
    document.getElementById('petSpecies').value = pet.species || '';
    document.getElementById('petBreed').value = pet.breed || '';
    document.getElementById('petSex').value = pet.sex || '';
    document.getElementById('petBirthdate').value = pet.birthdate || '';
    document.getElementById('petWeight').value = pet.weight || '';
    document.getElementById('petColor').value = pet.color || '';
    document.getElementById('petNotes').value = pet.notes || '';
    document.getElementById('petActive').checked = pet.active !== false;
    
    // Buscar y seleccionar dueño
    const owner = allClients.find(c => c.pets && c.pets.includes(petId));
    if (owner) {
        document.getElementById('petOwner').value = owner.id;
    }
    
    // Configurar fecha máxima (hoy)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('petBirthdate').setAttribute('max', today);
    
    // Mostrar modal
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Muestra el detalle de una mascota
 * @param {string} petId - ID de la mascota
 * @returns {void}
 */
function viewPetDetail(petId) {
    const pet = allPets.find(p => p.id === petId);
    
    if (!pet) {
        showToast('Mascota no encontrada', 'error');
        return;
    }
    
    // Buscar dueño
    const owner = allClients.find(c => c.pets && c.pets.includes(pet.id));
    
    // Obtener historial médico
    const histories = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    const petHistories = histories.filter(h => h.petId === petId).sort((a, b) => {
        const dateA = new Date(a.fecha || a.createdAt || 0);
        const dateB = new Date(b.fecha || b.createdAt || 0);
        return dateB - dateA;
    });
    
    // Obtener citas
    const appointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const petAppointments = appointments.filter(apt => apt.petId === petId);
    
    const age = pet.birthdate ? Math.floor((new Date() - new Date(pet.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
    const statusColor = pet.active !== false ? '#4CAF50' : '#757575';
    const statusText = pet.active !== false ? 'Activo' : 'Inactivo';
    
    const detailHTML = `
        <div style="padding:1.5rem;">
            <div style="display:grid; gap:1rem;">
                <!-- Información básica -->
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <h3 style="margin:0 0 1rem 0; color:var(--gray-900); display:flex; align-items:center; gap:0.5rem;">
                        <i class="fa-solid fa-paw" style="color:var(--primary-color);"></i>
                        Información de la Mascota
                    </h3>
                    <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem;">
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Nombre</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(pet.name || 'N/A')}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Especie</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(pet.species || 'N/A')}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Raza</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(pet.breed || 'Sin raza')}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Sexo</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(pet.sex || 'N/A')}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Edad</div>
                            <div style="font-weight:600; color:var(--gray-900);">${age} ${age !== 'N/A' ? 'años' : ''}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Peso</div>
                            <div style="font-weight:600; color:var(--gray-900);">${pet.weight ? `${pet.weight} kg` : 'N/A'}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Color</div>
                            <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(pet.color || 'N/A')}</div>
                        </div>
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Estado</div>
                            <span style="background:${statusColor}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                                ${statusText}
                            </span>
                        </div>
                        ${pet.birthdate ? `
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Fecha de Nacimiento</div>
                            <div style="font-weight:600; color:var(--gray-900);">${formatDate(pet.birthdate)}</div>
                        </div>
                        ` : ''}
                        ${pet.notes ? `
                        <div style="grid-column: 1 / -1;">
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.5rem; font-weight:600;">Notas</div>
                            <div style="padding:0.75rem; background:var(--white); border-radius:var(--border-radius-md); border:1px solid var(--gray-200); color:var(--gray-700); line-height:1.6;">
                                ${escapeHtml(pet.notes)}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Dueño -->
                ${owner ? `
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid #2196F3;">
                    <h3 style="margin:0 0 1rem 0; color:var(--gray-900); display:flex; align-items:center; gap:0.5rem;">
                        <i class="fa-solid fa-user" style="color:#2196F3;"></i>
                        Dueño
                    </h3>
                    <div style="font-weight:600; color:var(--gray-900); margin-bottom:0.25rem;">${escapeHtml(`${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email)}</div>
                    <div style="font-size:0.85rem; color:var(--gray-600);">${escapeHtml(owner.email || '')}</div>
                </div>
                ` : ''}
                
                <!-- Historial médico -->
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid #FF9800;">
                    <h3 style="margin:0 0 1rem 0; color:var(--gray-900); display:flex; align-items:center; gap:0.5rem;">
                        <i class="fa-solid fa-file-medical" style="color:#FF9800;"></i>
                        Historial Médico (${petHistories.length})
                    </h3>
                    ${petHistories.length === 0 ? `
                        <div style="text-align:center; padding:2rem; color:var(--gray-500);">
                            <i class="fa-solid fa-file-medical" style="font-size:2rem; margin-bottom:0.5rem; opacity:0.3;"></i>
                            <div>No hay historial médico registrado para esta mascota</div>
                        </div>
                    ` : `
                        <div style="display:grid; gap:0.75rem; max-height:400px; overflow-y:auto;">
                            ${petHistories.slice(0, 10).map(hist => {
                                const date = hist.fecha || (hist.createdAt ? new Date(hist.createdAt).toLocaleDateString('es-ES') : 'N/A');
                                const type = hist.tipo || 'Consulta';
                                const enabled = hist.enabled !== false && hist.enabled !== 0;
                                
                                return `
                                    <div style="background:var(--white); padding:0.75rem; border-radius:var(--border-radius-md); border-left:3px solid ${enabled ? 'var(--primary-color)' : '#757575'};">
                                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;">
                                            <div>
                                                <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(hist.nombre || type)}</div>
                                                <div style="font-size:0.75rem; color:var(--gray-600);">${date}</div>
                                            </div>
                                            ${!enabled ? `
                                                <span style="background:#757575; color:white; padding:0.25rem 0.5rem; border-radius:999px; font-size:0.7rem; font-weight:600;">
                                                    Deshabilitado
                                                </span>
                                            ` : ''}
                                        </div>
                                        ${hist.diagnostico ? `
                                            <div style="font-size:0.85rem; color:var(--gray-700); margin-top:0.5rem;">
                                                <strong>Diagnóstico:</strong> ${escapeHtml(hist.diagnostico.substring(0, 150))}${hist.diagnostico.length > 150 ? '...' : ''}
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                            ${petHistories.length > 10 ? `
                                <div style="text-align:center; padding:0.5rem; color:var(--gray-600); font-size:0.85rem;">
                                    Mostrando los 10 más recientes de ${petHistories.length} registros
                                </div>
                            ` : ''}
                        </div>
                    `}
                </div>
                
                <!-- Resumen -->
                <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem;">
                    <div style="padding:1rem; background:var(--white); border-radius:var(--border-radius-lg); border:1px solid var(--gray-200); text-align:center;">
                        <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Citas</div>
                        <div style="font-size:1.5rem; font-weight:700; color:var(--primary-color);">${petAppointments.length}</div>
                    </div>
                    <div style="padding:1rem; background:var(--white); border-radius:var(--border-radius-lg); border:1px solid var(--gray-200); text-align:center;">
                        <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Registros Médicos</div>
                        <div style="font-size:1.5rem; font-weight:700; color:#FF9800;">${petHistories.length}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const content = document.getElementById('petDetailContent');
    if (content) content.innerHTML = detailHTML;
    
    const footer = document.querySelector('#petDetailModal .patient-modal-footer');
    if (footer) {
        footer.innerHTML = `
            <button class="submit-btn action-btn-edit" onclick="editPet('${petId}'); closePetDetailModal();">
                <i class="fa-solid fa-pencil"></i> Editar Mascota
            </button>
            <button class="submit-btn btn-secondary" onclick="closePetDetailModal()">
                Cerrar
            </button>
        `;
    }
    
    const modal = document.getElementById('petDetailModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de detalle de mascota
 * @returns {void}
 */
function closePetDetailModal() {
    const modal = document.getElementById('petDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Cambia el estado activo/inactivo de una mascota
 * @param {string} petId - ID de la mascota
 * @returns {void}
 */
function togglePetStatus(petId) {
    try {
        loadAllPets();
        const pet = allPets.find(p => p.id === petId);
        
        if (!pet) {
            showToast('Mascota no encontrada', 'error');
            return;
        }
        
        pet.active = !pet.active;
        pet.updatedAt = new Date().toISOString();
        
        localStorage.setItem('vetuni:mockPets', JSON.stringify(allPets));
        
        loadPetsList();
        loadClientStatistics();
        
        const statusText = pet.active ? 'activada' : 'desactivada';
        showToast(`Mascota ${statusText} exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error al cambiar estado de la mascota:', error);
        showToast('Error al cambiar el estado de la mascota', 'error');
    }
}

/**
 * Elimina una mascota
 * @param {string} petId - ID de la mascota a eliminar
 * @returns {void}
 */
function deletePet(petId) {
    const pet = allPets.find(p => p.id === petId);
    
    if (!pet) {
        showToast('Mascota no encontrada', 'error');
        return;
    }
    
    if (!confirm(`¿Estás seguro de que deseas eliminar la mascota "${pet.name}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const allUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        
        // Eliminar mascota
        const filteredPets = allPets.filter(p => p.id !== petId);
        localStorage.setItem('vetuni:mockPets', JSON.stringify(filteredPets));
        
        // Remover mascota del dueño
        allUsers.forEach(user => {
            if (user.pets && user.pets.includes(petId)) {
                user.pets = user.pets.filter(id => id !== petId);
            }
        });
        localStorage.setItem('vetuni:mockUsers', JSON.stringify(allUsers));
        
        showToast('Mascota eliminada exitosamente', 'success');
        loadAllPets();
        loadAllClients();
        filterPets();
        loadClientStatistics();
        
    } catch (error) {
        console.error('Error al eliminar mascota:', error);
        showToast('Error al eliminar la mascota', 'error');
    }
}

// ========== UTILIDADES ==========

/**
 * Valida si un email es válido
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Formatea una fecha en formato legible
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr + 'T00:00:00');
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
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
window.switchClientsView = switchClientsView;
window.filterClients = filterClients;
window.clearClientFilters = clearClientFilters;
window.openCreateClientModal = openCreateClientModal;
window.closeCreateClientModal = closeCreateClientModal;
window.saveClient = saveClient;
window.validateClientField = validateClientField;
window.editClient = editClient;
window.viewClientDetail = viewClientDetail;
window.closeClientDetailModal = closeClientDetailModal;
window.toggleClientStatus = toggleClientStatus;
window.deleteClient = deleteClient;
window.filterPets = filterPets;
window.clearPetFilters = clearPetFilters;
window.openCreatePetModal = openCreatePetModal;
window.closeCreatePetModal = closeCreatePetModal;
window.validatePetOwner = validatePetOwner;
window.validatePetField = validatePetField;
window.savePet = savePet;
window.editPet = editPet;
window.viewPetDetail = viewPetDetail;
window.closePetDetailModal = closePetDetailModal;
window.togglePetStatus = togglePetStatus;
window.deletePet = deletePet;
window.initClients = initClients;
window.showClientsSection = showClientsSection;

