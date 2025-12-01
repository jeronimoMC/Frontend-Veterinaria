/**
 * PERFIL DEL VETERINARIO - JAVASCRIPT
 * Página de edición de perfil del veterinario
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========== VERIFICACIÓN DE SESIÓN ==========
    const session = window.apiService?.getCurrentUser?.();
    if (!session) {
        window.location.replace('../auth/index.html');
        return;
    }

    const userRole = String(session.role || '').toUpperCase();
    const userEmail = String(session.email || '').toLowerCase();

    // Verificar si es veterinario
    if (!userRole.includes('VETERINARIO') && !userRole.includes('VET') && !userEmail.includes('vet') && !userEmail.includes('veterinario')) {
        window.location.replace('./index.html');
        return;
    }

    // ========== DATOS ==========
    let veterinarianProfile = JSON.parse(localStorage.getItem('vetuni:veterinarianProfile') || '{}');
    
    // Si no hay perfil guardado, usar datos de sesión
    if (!veterinarianProfile.email) {
        veterinarianProfile = {
            firstName: session.firstName || '',
            lastName: session.lastName || '',
            email: session.email || '',
            phone: '',
            identification: '',
            position: '',
            specialty: '',
            experienceYears: 0
        };
    }

    // ========== CARGAR DATOS ==========
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const identificationInput = document.getElementById('identification');
    const phoneInput = document.getElementById('phone');
    const positionInput = document.getElementById('position');
    const specialtyInput = document.getElementById('specialty');
    const experienceYearsInput = document.getElementById('experienceYears');

    if (firstNameInput) firstNameInput.value = veterinarianProfile.firstName || '';
    if (lastNameInput) lastNameInput.value = veterinarianProfile.lastName || '';
    if (identificationInput) identificationInput.value = veterinarianProfile.identification || '';
    if (phoneInput) phoneInput.value = veterinarianProfile.phone || '';
    if (positionInput) positionInput.value = veterinarianProfile.position || '';
    if (specialtyInput) specialtyInput.value = veterinarianProfile.specialty || '';
    if (experienceYearsInput) experienceYearsInput.value = veterinarianProfile.experienceYears || 0;

    // ========== VALIDACIÓN ==========
    const fieldError = (id, msg) => {
        const el = document.getElementById(id);
        const err = document.getElementById(id + 'Error');
        if (err) {
            err.textContent = msg || '';
            err.classList.toggle('show', Boolean(msg));
        }
        if (el) {
            el.style.borderColor = msg ? '#f44336' : '';
        }
        return !msg;
    };

    const validateForm = () => {
        const firstNameOk = fieldError('firstName', firstNameInput.value.trim() ? '' : 'Nombre requerido');
        const lastNameOk = fieldError('lastName', lastNameInput.value.trim() ? '' : 'Apellido requerido');
        const identificationOk = fieldError('identification', identificationInput.value.trim() ? '' : 'Identificación requerida');
        const positionOk = fieldError('position', positionInput.value ? '' : 'Cargo requerido');
        
        // Validar teléfono si está lleno
        let phoneOk = true;
        if (phoneInput.value.trim()) {
            const phoneRegex = /^[+]?[\d\s\-\(\)]{8,15}$/;
            phoneOk = fieldError('phone', phoneRegex.test(phoneInput.value) ? '' : 'Teléfono inválido');
        }
        
        return firstNameOk && lastNameOk && identificationOk && positionOk && phoneOk;
    };

    // ========== GUARDAR PERFIL ==========
    const profileForm = document.getElementById('profileForm');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.textContent = message;
        const colors = {
            success: '#2E8B57',
            error: '#F44336',
            info: '#2196F3'
        };
        toast.style.cssText = `
            position: fixed;
            bottom: 16px;
            right: 16px;
            background: ${colors[type] || colors.success};
            color: #fff;
            padding: 12px 18px;
            border-radius: 10px;
            box-shadow: 0 8px 20px rgba(0,0,0,.15);
            z-index: 9999;
            font-weight: 500;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    };

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!validateForm()) {
                showToast('Por favor, completa todos los campos requeridos', 'error');
                return;
            }

            saveProfile();
        });
    }

    function saveProfile() {
        // Obtener el correo de la sesión actual (no se muestra pero se guarda para referencia)
        const session = window.apiService?.getCurrentUser?.();
        
        const updatedProfile = {
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            email: session?.email || veterinarianProfile.email || '',
            phone: phoneInput.value.trim(),
            identification: identificationInput.value.trim(),
            position: positionInput.value,
            specialty: specialtyInput.value.trim(),
            experienceYears: Number(experienceYearsInput.value) || 0,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('vetuni:veterinarianProfile', JSON.stringify(updatedProfile));
        showToast('Perfil actualizado correctamente', 'success');
        
        // Redirigir después de un momento
        setTimeout(() => {
            window.location.href = './index.html';
        }, 1500);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = './index.html';
        });
    }

    // Cambiar contraseña
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            showToast('Funcionalidad de cambio de contraseña próximamente', 'info');
            // TODO: Implementar modal de cambio de contraseña
        });
    }
});

