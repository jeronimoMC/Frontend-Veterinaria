/**
 * PERFIL DEL CLIENTE - JAVASCRIPT
 * Página de edición de perfil del cliente
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========== VERIFICACIÓN DE SESIÓN ==========
    const session = window.apiService?.getCurrentUser?.();
    if (!session) {
        window.location.replace('../auth/index.html');
        return;
    }

    // ========== DATOS ==========
    let userProfile = JSON.parse(localStorage.getItem('vetuni:userProfile') || '{}');
    
    // Si no hay perfil guardado, usar datos de sesión
    if (!userProfile.email) {
        userProfile = {
            firstName: session.firstName || '',
            lastName: session.lastName || '',
            email: session.email || '',
            phone: '',
            address: '',
            birthdate: ''
        };
    }

    // ========== CARGAR DATOS ==========
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const birthdateInput = document.getElementById('birthdate');

    if (firstNameInput) firstNameInput.value = userProfile.firstName || '';
    if (lastNameInput) lastNameInput.value = userProfile.lastName || '';
    if (emailInput) emailInput.value = userProfile.email || session.email || '';
    if (phoneInput) phoneInput.value = userProfile.phone || '';
    if (addressInput) addressInput.value = userProfile.address || '';
    if (birthdateInput) birthdateInput.value = userProfile.birthdate || '';

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
        const emailOk = fieldError('email', emailInput.value.trim() ? '' : 'Correo requerido');
        
        // Validar teléfono si está lleno
        let phoneOk = true;
        if (phoneInput.value.trim()) {
            const phoneRegex = /^[+]?[\d\s\-\(\)]{8,15}$/;
            phoneOk = fieldError('phone', phoneRegex.test(phoneInput.value) ? '' : 'Teléfono inválido');
        }
        
        return firstNameOk && lastNameOk && emailOk && phoneOk;
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
            if (!validateForm()) return;

            const updatedProfile = {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                email: emailInput.value.trim(),
                phone: phoneInput.value.trim(),
                address: addressInput.value.trim(),
                birthdate: birthdateInput.value,
                updatedAt: new Date().toISOString()
            };

            // Guardar en localStorage
            localStorage.setItem('vetuni:userProfile', JSON.stringify(updatedProfile));

            // Actualizar también en la sesión mock
            if (window.apiService && window.apiService.updateUser) {
                const currentUser = window.apiService.getCurrentUser();
                if (currentUser && currentUser.id) {
                    await window.apiService.updateUser(currentUser.id, {
                    ...session,
                    firstName: updatedProfile.firstName,
                    lastName: updatedProfile.lastName
                });
            }

            showToast('Perfil actualizado correctamente', 'success');
            
            // Redirigir después de un momento
            setTimeout(() => {
                window.location.href = './index.html';
            }, 1500);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = './index.html';
        });
    }

    // ========== CAMBIAR CONTRASEÑA ==========
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            showToast('Funcionalidad de cambio de contraseña próximamente disponible', 'info');
        });
    }

    // ========== PREVENIR DESBORDAMIENTO HORIZONTAL ==========
    const preventHorizontalScroll = () => {
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.width = '100%';
        document.documentElement.style.width = '100%';
        document.body.style.maxWidth = '100%';
        document.documentElement.style.maxWidth = '100%';
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.style.width = '100%';
            appContainer.style.maxWidth = '100%';
            appContainer.style.overflowX = 'hidden';
        }
        
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer) {
            profileContainer.style.width = '100%';
            profileContainer.style.maxWidth = '100%';
            profileContainer.style.overflowX = 'hidden';
        }
    };
    
    preventHorizontalScroll();
    window.addEventListener('resize', preventHorizontalScroll);
    window.addEventListener('load', preventHorizontalScroll);
    
    setTimeout(() => {
        preventHorizontalScroll();
        window.dispatchEvent(new Event('resize'));
    }, 100);

    console.log('✅ Profile page initialized');
});

