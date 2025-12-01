/**
 * ============================================
 * ADMIN VETERINARIANS - MÓDULO COMPLETO DE VETERINARIOS
 * ============================================
 * 
 * @fileoverview Módulo completo de gestión de veterinarios para el administrador
 * @author VetUni Development Team
 * @version 2.0.0
 * 
 * Funcionalidades principales:
 * - Ver todos los veterinarios
 * - Crear, editar y eliminar veterinarios
 * - Activar/desactivar veterinarios
 * - Ver detalles completos
 * - Ver agenda individual
 * - Filtros avanzados
 * - Estadísticas
 * 
 * @requires localStorage - Almacenamiento de veterinarios
 * @requires mockAuthService - Servicio de autenticación
 */

// ========== VARIABLES GLOBALES ==========

/** @type {string|null} ID del veterinario en edición */
let currentEditingVeterinarianId = null;

/** @type {Array} Lista completa de veterinarios */
let allVeterinarians = [];

/** @type {Array} Lista filtrada de veterinarios */
let filteredVeterinarians = [];

// ========== INICIALIZACIÓN ==========

/**
 * Inicializa el módulo cuando se carga la sección
 * @returns {void}
 */
(function() {
    setTimeout(() => {
        if (document.getElementById('veterinariansListView')) {
            initVeterinarians();
        }
    }, 150);
})();

/**
 * Inicializa el módulo de veterinarios
 * @param {string} sectionId - ID de la sección
 * @returns {void}
 */
function initVeterinarians(sectionId = 'list') {
    console.log('🔵 initVeterinarians llamado');
    loadAllVeterinarians();
    loadVeterinarianStatistics();
    loadVeterinariansList();
}

/**
 * Función global para cambiar de vista desde admin.js
 * @param {string} sectionId - ID de la sección
 * @returns {void}
 */
function showVeterinariansSection(sectionId) {
    initVeterinarians(sectionId);
}

// ========== CARGA DE DATOS ==========

/**
 * Carga todos los veterinarios del almacenamiento
 * @returns {void}
 */
function loadAllVeterinarians() {
    try {
        const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        allVeterinarians = mockUsers.filter(u => {
            const role = String(u.role || '').toUpperCase();
            return role.includes('VETERINARIO') || role.includes('VET');
        });
        
        filteredVeterinarians = [...allVeterinarians];
    } catch (error) {
        console.error('Error al cargar veterinarios:', error);
        allVeterinarians = [];
        filteredVeterinarians = [];
        showToast('Error al cargar los veterinarios', 'error');
    }
}

/**
 * Carga las estadísticas de veterinarios
 * @returns {void}
 */
function loadVeterinarianStatistics() {
    const total = allVeterinarians.length;
    const active = allVeterinarians.filter(v => v.active !== false).length;
    
    // Contar veterinarios en turno (simplificado: considerar activos)
    const onDuty = active;
    
    // Contar citas de hoy para todos los veterinarios
    try {
        const appointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(apt => {
            const aptDate = apt.date ? apt.date.split('T')[0] : '';
            return aptDate === today && apt.status !== 'cancelled';
        }).length;
        
        const statToday = document.getElementById('statTodayAppointments');
        if (statToday) statToday.textContent = todayAppointments;
    } catch (error) {
        console.error('Error al cargar citas de hoy:', error);
    }
    
    const statTotal = document.getElementById('statTotalVeterinarians');
    const statActive = document.getElementById('statActiveVeterinarians');
    const statOnDuty = document.getElementById('statOnDutyVeterinarians');
    
    if (statTotal) statTotal.textContent = total;
    if (statActive) statActive.textContent = active;
    if (statOnDuty) statOnDuty.textContent = onDuty;
}

/**
 * Carga la lista de veterinarios en la tabla
 * @returns {void}
 */
function loadVeterinariansList() {
    const tbody = document.getElementById('veterinariansTableBody');
    if (!tbody) return;
    
    if (filteredVeterinarians.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:3rem; color:var(--gray-500);">
                    <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                    <div style="font-size:1.1rem; font-weight:600; margin-bottom:0.5rem;">No hay veterinarios registrados</div>
                    <div style="font-size:0.9rem;">Haz clic en "Nuevo Veterinario" para crear uno</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredVeterinarians.map(vet => renderVeterinarianRow(vet)).join('');
}

/**
 * Renderiza una fila de veterinario en la tabla
 * @param {Object} vet - Objeto de veterinario
 * @returns {string} HTML de la fila
 */
function renderVeterinarianRow(vet) {
    const statusColor = vet.active !== false ? '#4CAF50' : '#757575';
    const statusText = vet.active !== false ? 'Activo' : 'Inactivo';
    const statusIcon = vet.active !== false ? 'fa-check-circle' : 'fa-times-circle';
    
    const fullName = `${vet.firstName || ''} ${vet.lastName || ''}`.trim() || vet.email || 'Veterinario';
    const specialty = vet.specialty || vet.especialidad || 'N/A';
    const position = vet.position || vet.cargo || 'Veterinario';
    
    // Contar citas de hoy para este veterinario
    let todayAppointments = 0;
    try {
        const appointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        const today = new Date().toISOString().split('T')[0];
        todayAppointments = appointments.filter(apt => {
            const aptDate = apt.date ? apt.date.split('T')[0] : '';
            const vetId = apt.veterinarianId || apt.vetId;
            return aptDate === today && 
                   (vetId === vet.id || vetId === vet.email) && 
                   apt.status !== 'cancelled';
        }).length;
    } catch (error) {
        console.error('Error al contar citas:', error);
    }
    
    return `
        <tr style="border-bottom:1px solid var(--gray-200); transition:background 0.2s ease;" 
            onmouseover="this.style.background='var(--gray-50)'" 
            onmouseout="this.style.background='var(--white)'">
            <td style="padding:0.75rem; color:var(--gray-600); font-weight:500;">${escapeHtml(vet.id || vet.email || 'N/A')}</td>
            <td style="padding:0.75rem; font-weight:600; color:var(--gray-900);">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <i class="fa-solid fa-user-doctor" style="color:var(--primary-color);"></i>
                    ${escapeHtml(fullName)}
                </div>
            </td>
            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(specialty)}</td>
            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(position)}</td>
            <td style="padding:0.75rem; color:var(--gray-600);">${escapeHtml(vet.email || 'N/A')}</td>
            <td style="padding:0.75rem; text-align:center;">
                <span style="background:${todayAppointments > 0 ? 'var(--secondary-color)' : 'var(--gray-200)'}; color:${todayAppointments > 0 ? 'white' : 'var(--gray-700)'}; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.85rem; font-weight:600;">
                    ${todayAppointments}
                </span>
            </td>
            <td style="padding:0.75rem; text-align:center;">
                <span style="background:${statusColor}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">
                    <i class="fa-solid ${statusIcon}"></i> ${statusText}
                </span>
            </td>
            <td style="padding:0.75rem; text-align:center;">
                <div style="display:flex; gap:0.5rem; justify-content:center;">
                    <button class="action-btn action-btn-view" onclick="viewVeterinarianDetail('${vet.id || vet.email}')" title="Ver detalles">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn action-btn-edit" onclick="editVeterinarian('${vet.id || vet.email}')" title="Editar">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button class="action-btn" style="background:linear-gradient(135deg, var(--accent-blue), #6BB6FF);" onclick="viewVeterinarianSchedule('${vet.id || vet.email}')" title="Ver agenda">
                        <i class="fa-solid fa-calendar-days"></i>
                    </button>
                    ${vet.active !== false ? `
                        <button class="action-btn" style="background:linear-gradient(135deg, #757575, #9E9E9E);" onclick="toggleVeterinarianStatus('${vet.id || vet.email}')" title="Desactivar">
                            <i class="fa-solid fa-toggle-on"></i>
                        </button>
                    ` : `
                        <button class="action-btn" style="background:linear-gradient(135deg, #4CAF50, #66BB6A);" onclick="toggleVeterinarianStatus('${vet.id || vet.email}')" title="Activar">
                            <i class="fa-solid fa-toggle-off"></i>
                        </button>
                    `}
                </div>
            </td>
        </tr>
    `;
}

// ========== FILTROS Y BÚSQUEDA ==========

/**
 * Filtra los veterinarios según los criterios de búsqueda
 * @returns {void}
 */
function filterVeterinarians() {
    const searchTerm = document.getElementById('veterinarianSearch')?.value.toLowerCase().trim() || '';
    const statusFilter = document.getElementById('filterVeterinarianStatus')?.value || '';
    
    filteredVeterinarians = allVeterinarians.filter(vet => {
        const fullName = `${vet.firstName || ''} ${vet.lastName || ''}`.trim().toLowerCase();
        const email = (vet.email || '').toLowerCase();
        const specialty = (vet.specialty || vet.especialidad || '').toLowerCase();
        const position = (vet.position || vet.cargo || '').toLowerCase();
        
        const matchesSearch = !searchTerm || 
                            fullName.includes(searchTerm) || 
                            email.includes(searchTerm) || 
                            specialty.includes(searchTerm) ||
                            position.includes(searchTerm);
        
        const matchesStatus = !statusFilter ||
                            (statusFilter === 'active' && vet.active !== false) ||
                            (statusFilter === 'inactive' && vet.active === false);
        
        return matchesSearch && matchesStatus;
    });
    
    loadVeterinariansList();
}

/**
 * Limpia todos los filtros de veterinarios
 * @returns {void}
 */
function clearVeterinarianFilters() {
    document.getElementById('veterinarianSearch').value = '';
    document.getElementById('filterVeterinarianStatus').value = '';
    filteredVeterinarians = [...allVeterinarians];
    loadVeterinariansList();
}

// ========== MODAL DE CREACIÓN/EDICIÓN ==========

/**
 * Abre el modal para crear un nuevo veterinario
 * @returns {void}
 */
function openCreateVeterinarianModal() {
    console.log('🔵 openCreateVeterinarianModal llamado');
    currentEditingVeterinarianId = null;
    
    // Intentar encontrar el modal
    let modal = document.getElementById('createVeterinarianModal');
    
    if (modal) {
        console.log('✅ Modal encontrado inmediatamente');
        showVeterinarianModalContent(modal);
        return;
    }
    
    // Si no se encuentra, buscar en el contenedor
    console.log('⏳ Modal no encontrado, buscando en contenedor...');
    const sectionContainer = document.getElementById('adminSectionsContainer');
    if (sectionContainer) {
        const modalInContainer = sectionContainer.querySelector('#createVeterinarianModal');
        if (modalInContainer) {
            console.log('✅ Modal encontrado en contenedor, moviéndolo al body');
            document.body.appendChild(modalInContainer);
            modal = document.getElementById('createVeterinarianModal');
            if (modal) {
                showVeterinarianModalContent(modal);
                return;
            }
        }
    }
    
    // Reintentos
    console.log('⏳ Iniciando reintentos...');
    let retries = 0;
    const maxRetries = 25;
    
    const checkModal = setInterval(() => {
        modal = document.getElementById('createVeterinarianModal');
        retries++;
        
        if (modal) {
            clearInterval(checkModal);
            console.log(`✅ Modal encontrado después de ${retries} intentos`);
            showVeterinarianModalContent(modal);
        } else if (retries >= maxRetries) {
            clearInterval(checkModal);
            console.error(`❌ Modal no encontrado después de ${maxRetries} intentos`);
            showToast('Error: No se pudo cargar el formulario. Por favor, recarga la página.', 'error');
        }
    }, 200);
}

/**
 * Muestra el contenido del modal de veterinario
 * @param {HTMLElement} modal - Elemento del modal
 * @param {string|null} veterinarianId - ID del veterinario a editar
 * @returns {void}
 */
function showVeterinarianModalContent(modal, veterinarianId = null) {
    if (!modal) return;
    
    const title = document.getElementById('veterinarianModalTitle');
    const form = document.getElementById('veterinarianForm');
    
    if (title) title.textContent = veterinarianId ? 'Editar Veterinario' : 'Nuevo Veterinario';
    if (form && !veterinarianId) form.reset();
    
    if (veterinarianId) {
        loadVeterinarianForEdit(veterinarianId);
    } else {
        resetVeterinarianForm();
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de crear/editar veterinario
 * @returns {void}
 */
function closeCreateVeterinarianModal() {
    const modal = document.getElementById('createVeterinarianModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Resetea el formulario de veterinario
 * @returns {void}
 */
function resetVeterinarianForm() {
    currentEditingVeterinarianId = null;
    const title = document.getElementById('veterinarianModalTitle');
    if (title) title.textContent = 'Nuevo Veterinario';
    
    const form = document.getElementById('veterinarianForm');
    if (form) form.reset();
    
    const activeField = document.getElementById('vetActive');
    if (activeField) activeField.checked = true;
    
    const passwordRequired = document.getElementById('vetPasswordRequired');
    if (passwordRequired) passwordRequired.textContent = '*';
}

/**
 * Carga un veterinario para editar
 * @param {string} veterinarianId - ID del veterinario
 * @returns {void}
 */
function loadVeterinarianForEdit(veterinarianId) {
    const vet = allVeterinarians.find(v => (v.id || v.email) === veterinarianId);
    
    if (!vet) {
        showToast('Veterinario no encontrado', 'error');
        return;
    }
    
    currentEditingVeterinarianId = veterinarianId;
    
    const title = document.getElementById('veterinarianModalTitle');
    if (title) title.textContent = 'Editar Veterinario';
    
    // Llenar formulario
    document.getElementById('vetFirstName').value = vet.firstName || '';
    document.getElementById('vetLastName').value = vet.lastName || '';
    document.getElementById('vetIdentification').value = vet.identification || vet.dni || '';
    document.getElementById('vetPhone').value = vet.phone || '';
    document.getElementById('vetEmail').value = vet.email || '';
    document.getElementById('vetPosition').value = vet.position || vet.cargo || '';
    document.getElementById('vetSpecialty').value = vet.specialty || vet.especialidad || '';
    document.getElementById('vetExperienceYears').value = vet.experienceYears || vet.anosExperiencia || '';
    document.getElementById('vetActive').checked = vet.active !== false;
    
    // Contraseña no se muestra al editar
    const passwordRequired = document.getElementById('vetPasswordRequired');
    if (passwordRequired) passwordRequired.textContent = '';
}

/**
 * Guarda un veterinario (crear o editar)
 * @returns {void}
 */
function saveVeterinarian() {
    const firstName = document.getElementById('vetFirstName').value.trim();
    const lastName = document.getElementById('vetLastName').value.trim();
    const identification = document.getElementById('vetIdentification').value.trim();
    const phone = document.getElementById('vetPhone').value.trim();
    const email = document.getElementById('vetEmail').value.trim();
    const position = document.getElementById('vetPosition').value;
    const specialty = document.getElementById('vetSpecialty').value.trim();
    const experienceYears = parseInt(document.getElementById('vetExperienceYears').value) || 0;
    const password = document.getElementById('vetPassword').value;
    const passwordConfirm = document.getElementById('vetPasswordConfirm').value;
    const active = document.getElementById('vetActive').checked;
    
    // Validaciones
    if (!firstName || !lastName) {
        showToast('Por favor, ingresa el nombre completo', 'error');
        return;
    }
    
    if (!identification) {
        showToast('Por favor, ingresa la identificación', 'error');
        return;
    }
    
    if (!email || !isValidEmail(email)) {
        showToast('Por favor, ingresa un email válido', 'error');
        return;
    }
    
    if (!phone) {
        showToast('Por favor, ingresa un teléfono', 'error');
        return;
    }
    
    if (!position) {
        showToast('Por favor, selecciona el cargo', 'error');
        return;
    }
    
    // Validar contraseña si se está creando nuevo o si se proporciona una nueva
    if (!currentEditingVeterinarianId) {
        if (password) {
            if (password.length < 8) {
                showToast('La contraseña debe tener al menos 8 caracteres', 'error');
                return;
            }
            if (password !== passwordConfirm) {
                showToast('Las contraseñas no coinciden', 'error');
                return;
            }
        }
    } else if (password) {
        if (password.length < 8) {
            showToast('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        if (password !== passwordConfirm) {
            showToast('Las contraseñas no coinciden', 'error');
            return;
        }
    }
    
    try {
        let mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        
        // Verificar duplicados (email o identificación)
        const duplicateEmail = mockUsers.find(u => 
            u.email === email && (u.id || u.email) !== currentEditingVeterinarianId
        );
        if (duplicateEmail) {
            showToast('Ya existe un usuario con ese email', 'error');
            return;
        }
        
        const duplicateId = mockUsers.find(u => 
            (u.identification || u.dni) === identification && (u.id || u.email) !== currentEditingVeterinarianId
        );
        if (duplicateId) {
            showToast('Ya existe un usuario con esa identificación', 'error');
            return;
        }
        
        if (currentEditingVeterinarianId) {
            // Editar veterinario existente
            const index = mockUsers.findIndex(u => (u.id || u.email) === currentEditingVeterinarianId);
            if (index !== -1) {
                mockUsers[index] = {
                    ...mockUsers[index],
                    firstName: firstName,
                    lastName: lastName,
                    identification: identification,
                    dni: identification,
                    phone: phone,
                    email: email,
                    position: position,
                    cargo: position,
                    specialty: specialty || undefined,
                    especialidad: specialty || undefined,
                    experienceYears: experienceYears || undefined,
                    anosExperiencia: experienceYears || undefined,
                    active: active,
                    role: 'VETERINARIO',
                    updatedAt: new Date().toISOString()
                };
                
                // Actualizar contraseña si se proporcionó
                if (password) {
                    mockUsers[index].password = btoa(password); // Simulación de hash
                }
                
                showToast('Veterinario actualizado exitosamente', 'success');
            }
        } else {
            // Crear nuevo veterinario
            const finalPassword = password || generateRandomPassword();
            
            const newVet = {
                id: `vet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email: email,
                password: btoa(finalPassword), // Simulación de hash
                firstName: firstName,
                lastName: lastName,
                identification: identification,
                dni: identification,
                phone: phone,
                position: position,
                cargo: position,
                specialty: specialty || undefined,
                especialidad: specialty || undefined,
                experienceYears: experienceYears || undefined,
                anosExperiencia: experienceYears || undefined,
                role: 'VETERINARIO',
                active: active,
                createdAt: new Date().toISOString()
            };
            
            mockUsers.push(newVet);
            showToast('Veterinario creado exitosamente', 'success');
            
            // Si no se proporcionó contraseña, mostrar mensaje
            if (!password) {
                setTimeout(() => {
                    showToast(`Contraseña temporal generada: ${finalPassword}`, 'info');
                }, 1000);
            }
        }
        
        localStorage.setItem('vetuni:mockUsers', JSON.stringify(mockUsers));
        
        // Recargar datos
        loadAllVeterinarians();
        loadVeterinarianStatistics();
        loadVeterinariansList();
        closeCreateVeterinarianModal();
        
    } catch (error) {
        console.error('Error al guardar veterinario:', error);
        showToast('Error al guardar el veterinario', 'error');
    }
}

/**
 * Edita un veterinario
 * @param {string} veterinarianId - ID del veterinario
 * @returns {void}
 */
function editVeterinarian(veterinarianId) {
    openCreateVeterinarianModal();
    setTimeout(() => {
        const modal = document.getElementById('createVeterinarianModal');
        if (modal) {
            showVeterinarianModalContent(modal, veterinarianId);
        }
    }, 300);
}

/**
 * Elimina un veterinario (borrado lógico)
 * @param {string} veterinarianId - ID del veterinario
 * @returns {void}
 */
function deleteVeterinarian(veterinarianId) {
    const vet = allVeterinarians.find(v => (v.id || v.email) === veterinarianId);
    
    if (!vet) {
        showToast('Veterinario no encontrado', 'error');
        return;
    }
    
    const fullName = `${vet.firstName || ''} ${vet.lastName || ''}`.trim() || vet.email;
    
    if (!confirm(`¿Estás seguro de que deseas eliminar al veterinario "${fullName}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        let mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        mockUsers = mockUsers.filter(u => (u.id || u.email) !== veterinarianId);
        localStorage.setItem('vetuni:mockUsers', JSON.stringify(mockUsers));
        
        showToast('Veterinario eliminado exitosamente', 'success');
        loadAllVeterinarians();
        loadVeterinarianStatistics();
        loadVeterinariansList();
        
    } catch (error) {
        console.error('Error al eliminar veterinario:', error);
        showToast('Error al eliminar el veterinario', 'error');
    }
}

/**
 * Cambia el estado activo/inactivo de un veterinario
 * @param {string} veterinarianId - ID del veterinario
 * @returns {void}
 */
function toggleVeterinarianStatus(veterinarianId) {
    try {
        let mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        const vet = mockUsers.find(u => (u.id || u.email) === veterinarianId);
        
        if (!vet) {
            showToast('Veterinario no encontrado', 'error');
            return;
        }
        
        vet.active = !vet.active;
        vet.updatedAt = new Date().toISOString();
        
        localStorage.setItem('vetuni:mockUsers', JSON.stringify(mockUsers));
        
        loadAllVeterinarians();
        loadVeterinarianStatistics();
        loadVeterinariansList();
        
        const statusText = vet.active ? 'activado' : 'desactivado';
        showToast(`Veterinario ${statusText} exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error al cambiar estado del veterinario:', error);
        showToast('Error al cambiar el estado del veterinario', 'error');
    }
}

// ========== VISTA DE DETALLES ==========

/**
 * Muestra el detalle de un veterinario
 * @param {string} veterinarianId - ID del veterinario
 * @returns {void}
 */
function viewVeterinarianDetail(veterinarianId) {
    const vet = allVeterinarians.find(v => (v.id || v.email) === veterinarianId);
    
    if (!vet) {
        showToast('Veterinario no encontrado', 'error');
        return;
    }
    
    const modal = document.getElementById('veterinarianDetailModal');
    const content = document.getElementById('veterinarianDetailContent');
    
    if (!modal || !content) {
        showToast('Error: No se pudo cargar la vista de detalles', 'error');
        return;
    }
    
    const fullName = `${vet.firstName || ''} ${vet.lastName || ''}`.trim() || vet.email;
    const statusColor = vet.active !== false ? '#4CAF50' : '#757575';
    const statusText = vet.active !== false ? 'Activo' : 'Inactivo';
    
    // Obtener estadísticas del veterinario
    let totalAppointments = 0;
    let todayAppointments = 0;
    let pendingAppointments = 0;
    
    try {
        const appointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        const vetId = vet.id || vet.email;
        const vetAppointments = appointments.filter(apt => 
            (apt.veterinarianId || apt.vetId) === vetId
        );
        
        totalAppointments = vetAppointments.length;
        const today = new Date().toISOString().split('T')[0];
        todayAppointments = vetAppointments.filter(apt => {
            const aptDate = apt.date ? apt.date.split('T')[0] : '';
            return aptDate === today && apt.status !== 'cancelled';
        }).length;
        
        pendingAppointments = vetAppointments.filter(apt => 
            apt.status === 'pending' || apt.status === 'confirmed'
        ).length;
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
    
    content.innerHTML = `
        <div style="padding:1.5rem;">
            <!-- Información Personal -->
            <h3 style="margin:0 0 1rem 0; color:var(--gray-900); font-size:1.25rem; font-weight:600; display:flex; align-items:center; gap:0.5rem;">
                <i class="fa-solid fa-user" style="color:var(--primary-color);"></i> Información Personal
            </h3>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:1rem; margin-bottom:2rem;">
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Nombre Completo</div>
                    <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(fullName)}</div>
                </div>
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Identificación</div>
                    <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(vet.identification || vet.dni || 'N/A')}</div>
                </div>
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Email</div>
                    <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(vet.email || 'N/A')}</div>
                </div>
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Teléfono</div>
                    <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(vet.phone || 'N/A')}</div>
                </div>
            </div>
            
            <!-- Información Profesional -->
            <h3 style="margin:0 0 1rem 0; color:var(--gray-900); font-size:1.25rem; font-weight:600; display:flex; align-items:center; gap:0.5rem;">
                <i class="fa-solid fa-stethoscope" style="color:var(--primary-color);"></i> Información Profesional
            </h3>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:1rem; margin-bottom:2rem;">
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Cargo</div>
                    <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(vet.position || vet.cargo || 'N/A')}</div>
                </div>
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Especialidad</div>
                    <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(vet.specialty || vet.especialidad || 'N/A')}</div>
                </div>
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Años de Experiencia</div>
                    <div style="font-weight:600; color:var(--gray-900);">${escapeHtml((vet.experienceYears || vet.anosExperiencia || 0) + ' años')}</div>
                </div>
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid ${statusColor};">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Estado</div>
                    <span style="background:${statusColor}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                        ${statusText}
                    </span>
                </div>
            </div>
            
            <!-- Estadísticas -->
            <h3 style="margin:0 0 1rem 0; color:var(--gray-900); font-size:1.25rem; font-weight:600; display:flex; align-items:center; gap:0.5rem;">
                <i class="fa-solid fa-chart-bar" style="color:var(--primary-color);"></i> Estadísticas
            </h3>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; margin-bottom:2rem;">
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); text-align:center;">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.5rem;">Total de Citas</div>
                    <div style="font-size:2rem; font-weight:700; color:var(--primary-color);">${totalAppointments}</div>
                </div>
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); text-align:center;">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.5rem;">Citas de Hoy</div>
                    <div style="font-size:2rem; font-weight:700; color:var(--secondary-color);">${todayAppointments}</div>
                </div>
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); text-align:center;">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.5rem;">Citas Pendientes</div>
                    <div style="font-size:2rem; font-weight:700; color:#FF9800;">${pendingAppointments}</div>
                </div>
            </div>
            
            <!-- Acciones -->
            <div style="display:flex; gap:1rem; justify-content:flex-end; margin-top:2rem; padding-top:1.5rem; border-top:2px solid var(--gray-200);">
                <button class="submit-btn" style="background:var(--accent-blue);" onclick="viewVeterinarianSchedule('${veterinarianId}'); closeVeterinarianDetailModal();">
                    <i class="fa-solid fa-calendar-days"></i> Ver Agenda
                </button>
                <button class="submit-btn" onclick="editVeterinarian('${veterinarianId}'); closeVeterinarianDetailModal();">
                    <i class="fa-solid fa-pencil"></i> Editar Veterinario
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de detalle de veterinario
 * @returns {void}
 */
function closeVeterinarianDetailModal() {
    const modal = document.getElementById('veterinarianDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ========== AGENDA DEL VETERINARIO ==========

/**
 * Muestra la agenda de un veterinario
 * @param {string} veterinarianId - ID del veterinario
 * @returns {void}
 */
function viewVeterinarianSchedule(veterinarianId) {
    const vet = allVeterinarians.find(v => (v.id || v.email) === veterinarianId);
    
    if (!vet) {
        showToast('Veterinario no encontrado', 'error');
        return;
    }
    
    const modal = document.getElementById('veterinarianScheduleModal');
    const content = document.getElementById('veterinarianScheduleContent');
    
    if (!modal || !content) {
        showToast('Error: No se pudo cargar la agenda', 'error');
        return;
    }
    
    const fullName = `${vet.firstName || ''} ${vet.lastName || ''}`.trim() || vet.email;
    
    // Cargar citas del veterinario
    try {
        const appointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        const vetId = vet.id || vet.email;
        const vetAppointments = appointments
            .filter(apt => (apt.veterinarianId || apt.vetId) === vetId)
            .sort((a, b) => {
                const dateA = new Date(a.date || a.fecha || 0);
                const dateB = new Date(b.date || b.fecha || 0);
                return dateA - dateB;
            });
        
        if (vetAppointments.length === 0) {
            content.innerHTML = `
                <div style="padding:3rem; text-align:center; color:var(--gray-500);">
                    <i class="fa-solid fa-calendar-xmark" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                    <div style="font-size:1.1rem; font-weight:600; margin-bottom:0.5rem;">No hay citas registradas</div>
                    <div style="font-size:0.9rem;">Este veterinario no tiene citas programadas</div>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div style="padding:1.5rem;">
                    <h3 style="margin:0 0 1.5rem 0; color:var(--gray-900); font-size:1.25rem; font-weight:600;">
                        Agenda de ${escapeHtml(fullName)}
                    </h3>
                    <div style="overflow-x:auto;">
                        <table class="data-table" style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="background:var(--gray-100); border-bottom:2px solid var(--gray-300);">
                                    <th style="padding:0.75rem; text-align:left; font-weight:600; color:var(--gray-700);">Fecha</th>
                                    <th style="padding:0.75rem; text-align:left; font-weight:600; color:var(--gray-700);">Hora</th>
                                    <th style="padding:0.75rem; text-align:left; font-weight:600; color:var(--gray-700);">Cliente</th>
                                    <th style="padding:0.75rem; text-align:left; font-weight:600; color:var(--gray-700);">Mascota</th>
                                    <th style="padding:0.75rem; text-align:left; font-weight:600; color:var(--gray-700);">Servicio</th>
                                    <th style="padding:0.75rem; text-align:center; font-weight:600; color:var(--gray-700);">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${vetAppointments.map(apt => {
                                    const aptDate = apt.date || apt.fecha;
                                    const dateObj = aptDate ? new Date(aptDate) : new Date();
                                    const formattedDate = dateObj.toLocaleDateString('es-ES', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    });
                                    const formattedTime = apt.time || apt.hora || 'N/A';
                                    const clientName = apt.clientName || apt.cliente || 'N/A';
                                    const petName = apt.petName || apt.mascota || 'N/A';
                                    const service = apt.service || apt.servicio || 'Consulta';
                                    
                                    const statusColors = {
                                        'confirmed': '#4CAF50',
                                        'pending': '#FF9800',
                                        'completed': '#2196F3',
                                        'cancelled': '#F44336'
                                    };
                                    const statusTexts = {
                                        'confirmed': 'Confirmada',
                                        'pending': 'Pendiente',
                                        'completed': 'Completada',
                                        'cancelled': 'Cancelada'
                                    };
                                    const status = apt.status || 'pending';
                                    const statusColor = statusColors[status] || '#757575';
                                    const statusText = statusTexts[status] || 'Pendiente';
                                    
                                    return `
                                        <tr style="border-bottom:1px solid var(--gray-200);">
                                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(formattedDate)}</td>
                                            <td style="padding:0.75rem; color:var(--gray-700); font-weight:600;">${escapeHtml(formattedTime)}</td>
                                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(clientName)}</td>
                                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(petName)}</td>
                                            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(service)}</td>
                                            <td style="padding:0.75rem; text-align:center;">
                                                <span style="background:${statusColor}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                                                    ${statusText}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar agenda:', error);
        content.innerHTML = `
            <div style="padding:3rem; text-align:center; color:var(--error-color);">
                <i class="fa-solid fa-exclamation-triangle" style="font-size:3rem; margin-bottom:1rem;"></i>
                <div style="font-size:1.1rem; font-weight:600;">Error al cargar la agenda</div>
            </div>
        `;
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de agenda
 * @returns {void}
 */
function closeVeterinarianScheduleModal() {
    const modal = document.getElementById('veterinarianScheduleModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ========== UTILIDADES ==========

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Genera una contraseña aleatoria
 * @returns {string} Contraseña generada
 */
function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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
window.initVeterinarians = initVeterinarians;
window.showVeterinariansSection = showVeterinariansSection;
window.openCreateVeterinarianModal = openCreateVeterinarianModal;
window.closeCreateVeterinarianModal = closeCreateVeterinarianModal;
window.saveVeterinarian = saveVeterinarian;
window.editVeterinarian = editVeterinarian;
window.deleteVeterinarian = deleteVeterinarian;
window.toggleVeterinarianStatus = toggleVeterinarianStatus;
window.viewVeterinarianDetail = viewVeterinarianDetail;
window.closeVeterinarianDetailModal = closeVeterinarianDetailModal;
window.viewVeterinarianSchedule = viewVeterinarianSchedule;
window.closeVeterinarianScheduleModal = closeVeterinarianScheduleModal;
window.filterVeterinarians = filterVeterinarians;
window.clearVeterinarianFilters = clearVeterinarianFilters;

