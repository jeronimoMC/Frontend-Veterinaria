/**
 * ============================================
 * SETTINGS MODULE - CONFIGURACIÓN DEL SISTEMA
 * ============================================
 * Gestión completa de configuración incluyendo creación y administración de usuarios
 */

let currentSettingsTab = 'users';
let currentUserType = 'veterinarians';
let allUsers = {
    veterinarians: [],
    admins: [],
    clients: []
};

/**
 * Inicializa el módulo de configuración
 */
function initSettings() {
    console.log('✅ Settings module initialized');
    
    // Cargar usuarios
    loadAllUsers();
    
    // Mostrar la vista de usuarios por defecto
    switchSettingsTab('users');
    switchUserType('veterinarians');
    
    // Cargar datos iniciales
    loadSettingsUsers('veterinarian');
}

/**
 * Cambia entre tabs de configuración
 */
function switchSettingsTab(tabId) {
    currentSettingsTab = tabId;
    
    // Actualizar botones de tabs
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Ocultar todas las vistas
    document.querySelectorAll('.settings-view').forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active');
    });
    
    // Mostrar la vista activa
    const activeView = document.getElementById(`settings${tabId.charAt(0).toUpperCase() + tabId.slice(1)}View`);
    if (activeView) {
        activeView.style.display = 'block';
        activeView.classList.add('active');
    }
}

/**
 * Cambia entre tipos de usuario
 */
function switchUserType(userType) {
    currentUserType = userType;
    
    // Actualizar botones de tipo de usuario
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.borderColor = 'var(--gray-300)';
    });
    const activeBtn = document.querySelector(`[data-user-type="${userType}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.borderColor = 'var(--primary-color)';
    }
    
    // Ocultar todas las vistas
    document.querySelectorAll('.user-type-view').forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active');
    });
    
    // Mostrar la vista activa
    const activeView = document.getElementById(`users${userType.charAt(0).toUpperCase() + userType.slice(1)}View`);
    if (activeView) {
        activeView.style.display = 'block';
        activeView.classList.add('active');
    }
    
    // Cargar datos del tipo de usuario seleccionado
    let userTypeParam = 'veterinarian';
    if (userType === 'admins') userTypeParam = 'admin';
    else if (userType === 'clients') userTypeParam = 'client';
    
    loadSettingsUsers(userTypeParam);
}

/**
 * Carga todos los usuarios del sistema
 */
function loadAllUsers() {
    // Cargar veterinarios
    const vetsStr = localStorage.getItem('veterinarians') || '[]';
    allUsers.veterinarians = JSON.parse(vetsStr);
    
    // Cargar administradores (desde usuarios con rol admin)
    const usersStr = localStorage.getItem('users') || '[]';
    const allUsersList = JSON.parse(usersStr);
    allUsers.admins = allUsersList.filter(u => 
        u.role && (u.role.toLowerCase().includes('admin') || u.email.includes('admin'))
    );
    
    // Cargar clientes
    const clientsStr = localStorage.getItem('clients') || '[]';
    allUsers.clients = JSON.parse(clientsStr);
}

/**
 * Carga usuarios en la tabla según el tipo
 */
function loadSettingsUsers(userType) {
    loadAllUsers(); // Recargar datos
    
    let users = [];
    let tableBodyId = '';
    
    if (userType === 'veterinarian') {
        users = allUsers.veterinarians;
        tableBodyId = 'settingsVeterinariansTableBody';
    } else if (userType === 'admin') {
        users = allUsers.admins;
        tableBodyId = 'settingsAdminsTableBody';
    } else if (userType === 'client') {
        users = allUsers.clients;
        tableBodyId = 'settingsClientsTableBody';
    }
    
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding:2rem; text-align:center; color:var(--gray-500);">
                    <i class="fa-solid fa-inbox" style="font-size:2rem; margin-bottom:0.5rem; opacity:0.3; display:block;"></i>
                    No hay usuarios registrados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map((user, index) => {
        if (userType === 'veterinarian') {
            return `
                <tr style="border-bottom:1px solid var(--gray-200);">
                    <td style="padding:1rem;">
                        <div style="font-weight:500; color:var(--gray-900);">${escapeHtml(user.firstName || '')} ${escapeHtml(user.lastName || '')}</div>
                    </td>
                    <td style="padding:1rem; color:var(--gray-700);">${escapeHtml(user.email || '')}</td>
                    <td style="padding:1rem; color:var(--gray-700);">${escapeHtml(user.specialty || 'General')}</td>
                    <td style="padding:1rem; color:var(--gray-700);">${escapeHtml(user.license || 'N/A')}</td>
                    <td style="padding:1rem; text-align:center;">
                        <span class="status-badge ${user.active !== false ? 'active' : 'inactive'}">
                            ${user.active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td style="padding:1rem; text-align:center;">
                        <div style="display:flex; gap:0.5rem; justify-content:center;">
                            <button onclick="editSettingsUser('${user.id}', 'veterinarian')" title="Editar" style="padding:0.5rem; background:var(--primary-color); color:white; border:none; border-radius:var(--border-radius-md); cursor:pointer;">
                                <i class="fa-solid fa-edit"></i>
                            </button>
                            <button onclick="toggleSettingsUserStatus('${user.id}', 'veterinarian')" title="${user.active !== false ? 'Desactivar' : 'Activar'}" style="padding:0.5rem; background:${user.active !== false ? '#FF9800' : '#4CAF50'}; color:white; border:none; border-radius:var(--border-radius-md); cursor:pointer;">
                                <i class="fa-solid fa-${user.active !== false ? 'ban' : 'check'}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } else if (userType === 'admin') {
            return `
                <tr style="border-bottom:1px solid var(--gray-200);">
                    <td style="padding:1rem;">
                        <div style="font-weight:500; color:var(--gray-900);">${escapeHtml(user.firstName || '')} ${escapeHtml(user.lastName || '')}</div>
                    </td>
                    <td style="padding:1rem; color:var(--gray-700);">${escapeHtml(user.email || '')}</td>
                    <td style="padding:1rem; color:var(--gray-700);">${escapeHtml(user.accessLevel || 'Super')}</td>
                    <td style="padding:1rem; color:var(--gray-700);">${formatDate(user.createdAt || new Date())}</td>
                    <td style="padding:1rem; text-align:center;">
                        <span class="status-badge ${user.active !== false ? 'active' : 'inactive'}">
                            ${user.active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td style="padding:1rem; text-align:center;">
                        <div style="display:flex; gap:0.5rem; justify-content:center;">
                            <button onclick="editSettingsUser('${user.id}', 'admin')" title="Editar" style="padding:0.5rem; background:var(--primary-color); color:white; border:none; border-radius:var(--border-radius-md); cursor:pointer;">
                                <i class="fa-solid fa-edit"></i>
                            </button>
                            <button onclick="toggleSettingsUserStatus('${user.id}', 'admin')" title="${user.active !== false ? 'Desactivar' : 'Activar'}" style="padding:0.5rem; background:${user.active !== false ? '#FF9800' : '#4CAF50'}; color:white; border:none; border-radius:var(--border-radius-md); cursor:pointer;">
                                <i class="fa-solid fa-${user.active !== false ? 'ban' : 'check'}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } else if (userType === 'client') {
            // Contar mascotas del cliente
            const petsStr = localStorage.getItem('pets') || '[]';
            const allPets = JSON.parse(petsStr);
            const clientPets = allPets.filter(p => p.ownerId === user.id);
            
            return `
                <tr style="border-bottom:1px solid var(--gray-200);">
                    <td style="padding:1rem;">
                        <div style="font-weight:500; color:var(--gray-900);">${escapeHtml(user.firstName || '')} ${escapeHtml(user.lastName || '')}</div>
                    </td>
                    <td style="padding:1rem; color:var(--gray-700);">${escapeHtml(user.email || '')}</td>
                    <td style="padding:1rem; color:var(--gray-700);">${escapeHtml(user.phone || 'N/A')}</td>
                    <td style="padding:1rem; color:var(--gray-700);">${clientPets.length}</td>
                    <td style="padding:1rem; text-align:center;">
                        <span class="status-badge ${user.active !== false ? 'active' : 'inactive'}">
                            ${user.active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td style="padding:1rem; text-align:center;">
                        <div style="display:flex; gap:0.5rem; justify-content:center;">
                            <button onclick="editSettingsUser('${user.id}', 'client')" title="Editar" style="padding:0.5rem; background:var(--primary-color); color:white; border:none; border-radius:var(--border-radius-md); cursor:pointer;">
                                <i class="fa-solid fa-edit"></i>
                            </button>
                            <button onclick="toggleSettingsUserStatus('${user.id}', 'client')" title="${user.active !== false ? 'Desactivar' : 'Activar'}" style="padding:0.5rem; background:${user.active !== false ? '#FF9800' : '#4CAF50'}; color:white; border:none; border-radius:var(--border-radius-md); cursor:pointer;">
                                <i class="fa-solid fa-${user.active !== false ? 'ban' : 'check'}"></i>
                            </button>
                            <button onclick="resetUserPassword('${user.id}', '${userType}')" title="Restablecer contraseña" style="padding:0.5rem; background:#2196F3; color:white; border:none; border-radius:var(--border-radius-md); cursor:pointer;">
                                <i class="fa-solid fa-key"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }).join('');
}

/**
 * Filtra usuarios en la tabla
 */
function filterSettingsUsers(userType) {
    let searchId = '';
    let statusId = '';
    
    if (userType === 'veterinarian') {
        searchId = 'settingsVetSearch';
        statusId = 'settingsVetStatus';
    } else if (userType === 'admin') {
        searchId = 'settingsAdminSearch';
        statusId = 'settingsAdminStatus';
    } else if (userType === 'client') {
        searchId = 'settingsClientSearch';
        statusId = 'settingsClientStatus';
    }
    
    const searchTerm = document.getElementById(searchId)?.value.toLowerCase() || '';
    const statusFilter = document.getElementById(statusId)?.value || '';
    
    let users = [];
    if (userType === 'veterinarian') users = allUsers.veterinarians;
    else if (userType === 'admin') users = allUsers.admins;
    else if (userType === 'client') users = allUsers.clients;
    
    // Aplicar filtros
    let filteredUsers = users.filter(user => {
        const matchesSearch = !searchTerm || 
            (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
            (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || 
            (statusFilter === 'active' && user.active !== false) ||
            (statusFilter === 'inactive' && user.active === false);
        
        return matchesSearch && matchesStatus;
    });
    
    // Actualizar tabla con usuarios filtrados
    let tableBodyId = '';
    if (userType === 'veterinarian') tableBodyId = 'settingsVeterinariansTableBody';
    else if (userType === 'admin') tableBodyId = 'settingsAdminsTableBody';
    else if (userType === 'client') tableBodyId = 'settingsClientsTableBody';
    
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    // Recrear tabla con datos filtrados
    allUsers = {
        veterinarians: userType === 'veterinarian' ? filteredUsers : allUsers.veterinarians,
        admins: userType === 'admin' ? filteredUsers : allUsers.admins,
        clients: userType === 'client' ? filteredUsers : allUsers.clients
    };
    
    loadSettingsUsers(userType);
}

/**
 * Abre el modal para crear/editar usuario
 */
function openCreateUserModal(userType, userId = null) {
    const modal = document.getElementById('createUserModal');
    if (!modal) {
        console.error('Modal createUserModal no encontrado');
        return;
    }
    
    // Mover modal al body si no está ahí
    if (modal.parentElement.id !== 'adminModalsContainer' && document.getElementById('adminModalsContainer')) {
        document.getElementById('adminModalsContainer').appendChild(modal);
    }
    
    // Establecer tipo de usuario
    document.getElementById('createUserType').value = userType;
    document.getElementById('createUserId').value = userId || '';
    
    // Ocultar todos los campos específicos
    document.getElementById('vetFields').style.display = 'none';
    document.getElementById('adminFields').style.display = 'none';
    document.getElementById('clientFields').style.display = 'none';
    
    // Mostrar campos según el tipo
    const titleEl = document.getElementById('createUserModalTitle');
    if (userType === 'veterinarian') {
        titleEl.innerHTML = '<i class="fa-solid fa-user-doctor" style="color:var(--primary-color);"></i> ' + (userId ? 'Editar' : 'Nuevo') + ' Veterinario';
        document.getElementById('vetFields').style.display = 'block';
        document.getElementById('createVetSpecialty').required = true;
        document.getElementById('createAdminLevel').required = false;
    } else if (userType === 'admin') {
        titleEl.innerHTML = '<i class="fa-solid fa-user-shield" style="color:#9C27B0;"></i> ' + (userId ? 'Editar' : 'Nuevo') + ' Administrador';
        document.getElementById('adminFields').style.display = 'block';
        document.getElementById('createVetSpecialty').required = false;
        document.getElementById('createAdminLevel').required = true;
    } else if (userType === 'client') {
        titleEl.innerHTML = '<i class="fa-solid fa-user" style="color:#4CAF50;"></i> ' + (userId ? 'Editar' : 'Nuevo') + ' Cliente';
        document.getElementById('clientFields').style.display = 'block';
        document.getElementById('createVetSpecialty').required = false;
        document.getElementById('createAdminLevel').required = false;
    }
    
    // Si es edición, cargar datos
    if (userId) {
        loadUserForEdit(userId, userType);
    } else {
        resetUserForm();
    }
    
    modal.style.display = 'flex';
}

/**
 * Cierra el modal de crear/editar usuario
 */
function closeCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    if (modal) {
        modal.style.display = 'none';
    }
    resetUserForm();
}

/**
 * Carga datos de usuario para edición
 */
function loadUserForEdit(userId, userType) {
    let users = [];
    let storageKey = '';
    
    if (userType === 'veterinarian') {
        storageKey = 'veterinarians';
        const vetsStr = localStorage.getItem(storageKey) || '[]';
        users = JSON.parse(vetsStr);
    } else if (userType === 'admin') {
        storageKey = 'users';
        const usersStr = localStorage.getItem(storageKey) || '[]';
        const allUsersList = JSON.parse(usersStr);
        users = allUsersList.filter(u => 
            u.role && (u.role.toLowerCase().includes('admin') || u.email.includes('admin'))
        );
    } else if (userType === 'client') {
        storageKey = 'clients';
        const clientsStr = localStorage.getItem(storageKey) || '[]';
        users = JSON.parse(clientsStr);
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Llenar formulario
    document.getElementById('createUserName').value = user.firstName || '';
    document.getElementById('createUserLastName').value = user.lastName || '';
    document.getElementById('createUserEmail').value = user.email || '';
    document.getElementById('createUserPhone').value = user.phone || '';
    document.getElementById('createUserIdentification').value = user.identification || user.dni || '';
    document.getElementById('createUserActive').checked = user.active !== false;
    
    if (userType === 'veterinarian') {
        document.getElementById('createVetSpecialty').value = user.specialty || '';
        document.getElementById('createVetExperience').value = user.experience || 0;
        document.getElementById('createVetLicense').value = user.license || '';
    } else if (userType === 'admin') {
        document.getElementById('createAdminLevel').value = user.accessLevel || 'super';
    } else if (userType === 'client') {
        document.getElementById('createClientAddress').value = user.address || '';
    }
    
    // Contraseña no se muestra en edición
    document.getElementById('createUserPassword').value = '';
    document.getElementById('createUserPasswordConfirm').value = '';
}

/**
 * Resetea el formulario de usuario
 */
function resetUserForm() {
    document.getElementById('createUserForm').reset();
    document.getElementById('createUserId').value = '';
    document.getElementById('createUserType').value = '';
    document.getElementById('createUserActive').checked = true;
}

/**
 * Guarda un usuario (crear o actualizar)
 */
function saveUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userType = document.getElementById('createUserType').value;
    const userId = document.getElementById('createUserId').value;
    const isEdit = !!userId;
    
    // Validar contraseñas si se proporcionan
    const password = document.getElementById('createUserPassword').value;
    const passwordConfirm = document.getElementById('createUserPasswordConfirm').value;
    if (password && password !== passwordConfirm) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        identification: formData.get('identification'),
        active: document.getElementById('createUserActive').checked,
        password: password || generateRandomPassword()
    };
    
    if (userType === 'veterinarian') {
        userData.specialty = formData.get('specialty');
        userData.experience = parseInt(formData.get('experience')) || 0;
        userData.license = formData.get('license');
        userData.role = 'VETERINARIAN';
    } else if (userType === 'admin') {
        userData.accessLevel = formData.get('accessLevel');
        userData.role = 'ADMIN';
    } else if (userType === 'client') {
        userData.address = formData.get('address');
        userData.role = 'CLIENT';
    }
    
    // Guardar en localStorage
    let storageKey = '';
    if (userType === 'veterinarian') {
        storageKey = 'veterinarians';
    } else if (userType === 'admin') {
        storageKey = 'users';
    } else if (userType === 'client') {
        storageKey = 'clients';
    }
    
    const existingDataStr = localStorage.getItem(storageKey) || '[]';
    let existingData = JSON.parse(existingDataStr);
    
    if (isEdit) {
        // Actualizar usuario existente
        const index = existingData.findIndex(u => u.id === userId);
        if (index !== -1) {
            userData.id = userId;
            userData.createdAt = existingData[index].createdAt;
            existingData[index] = userData;
            showToast('Usuario actualizado correctamente', 'success');
        }
    } else {
        // Crear nuevo usuario
        userData.id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        userData.createdAt = new Date().toISOString();
        existingData.push(userData);
        showToast('Usuario creado correctamente', 'success');
    }
    
    localStorage.setItem(storageKey, JSON.stringify(existingData));
    
    // Si es admin, también guardar en users
    if (userType === 'admin') {
        const allUsersStr = localStorage.getItem('users') || '[]';
        const allUsers = JSON.parse(allUsersStr);
        if (isEdit) {
            const index = allUsers.findIndex(u => u.id === userId);
            if (index !== -1) {
                allUsers[index] = userData;
            }
        } else {
            allUsers.push(userData);
        }
        localStorage.setItem('users', JSON.stringify(allUsers));
    }
    
    closeCreateUserModal();
    loadSettingsUsers(userType);
}

/**
 * Edita un usuario
 */
function editSettingsUser(userId, userType) {
    openCreateUserModal(userType, userId);
}

/**
 * Cambia el estado activo/inactivo de un usuario
 */
function toggleSettingsUserStatus(userId, userType) {
    let storageKey = '';
    if (userType === 'veterinarian') storageKey = 'veterinarians';
    else if (userType === 'admin') storageKey = 'users';
    else if (userType === 'client') storageKey = 'clients';
    
    const existingDataStr = localStorage.getItem(storageKey) || '[]';
    let existingData = JSON.parse(existingDataStr);
    
    const user = existingData.find(u => u.id === userId);
    if (!user) return;
    
    user.active = user.active === false;
    localStorage.setItem(storageKey, JSON.stringify(existingData));
    
    showToast(`Usuario ${user.active ? 'activado' : 'desactivado'} correctamente`, 'success');
    loadSettingsUsers(userType);
}

/**
 * Restablece la contraseña de un usuario
 */
function resetUserPassword(userId, userType) {
    if (!confirm('¿Desea generar una nueva contraseña para este usuario?')) {
        return;
    }
    
    const newPassword = generateRandomPassword();
    
    let storageKey = '';
    if (userType === 'veterinarian') storageKey = 'veterinarians';
    else if (userType === 'admin') storageKey = 'users';
    else if (userType === 'client') storageKey = 'clients';
    
    const existingDataStr = localStorage.getItem(storageKey) || '[]';
    let existingData = JSON.parse(existingDataStr);
    
    const user = existingData.find(u => u.id === userId);
    if (user) {
        user.password = newPassword;
        localStorage.setItem(storageKey, JSON.stringify(existingData));
        showToast(`Nueva contraseña generada: ${newPassword}`, 'success');
    }
}

/**
 * Genera una contraseña aleatoria
 */
function generateRandomPassword(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Utilidades
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}

