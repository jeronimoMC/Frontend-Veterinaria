/**
 * VETERINARY CLINIC - INTERACTIVE JAVASCRIPT
 * Clínica Veterinaria Universitaria
 * 
 * Este archivo maneja toda la interactividad del sistema de autenticación
 * incluyendo validación de formularios, animaciones y experiencia de usuario.
 */

// ========== CONFIGURACIÓN Y CONSTANTES ==========
const CONFIG = {
    // Expresiones regulares para validación
    REGEX: {
        EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        PHONE: /^[+]?[\d\s\-()]{8,15}$/,
        PASSWORD: {
            MIN_LENGTH: 8,
            STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
        }
    },
    
    // Mensajes de error
    MESSAGES: {
        REQUIRED: 'Este campo es obligatorio',
        EMAIL_INVALID: 'Ingresa un correo electrónico válido',
        PHONE_INVALID: 'Ingresa un número de teléfono válido',
        PASSWORD_WEAK: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo',
        PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
        TERMS_REQUIRED: 'Debes aceptar los términos y condiciones'
    },
    
    // Configuración de animaciones
    ANIMATION: {
        DURATION: 300,
        EASING: 'ease-in-out'
    }
};

// ========== CLASE PRINCIPAL DE LA APLICACIÓN ==========
class VetAuthApp {
    constructor() {
        this.currentForm = 'login';
        this.isLoading = false;
        this.validationErrors = new Map();
        
        this.init();
    }
    
    /**
     * Inicializa la aplicación y configura todos los event listeners
     */
    init() {
        this.setupEventListeners();
        this.setupPasswordToggles();
        this.setupPasswordStrengthIndicator();
        this.initializeAnimations();
        
        console.log('🐾 VetUni Auth System initialized successfully!');
    }
    
    /**
     * Configura todos los event listeners de la aplicación
     */
    setupEventListeners() {
        // Toggle entre formularios de login y registro
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const formType = e.target.dataset.form;
                this.switchForm(formType);
            });
        });
        
        // Validación en tiempo real para todos los inputs
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
        
        // Envío de formularios
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });
        
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e);
        });
        
        // Efectos hover para botones sociales
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSocialLogin(btn);
            });
        });
        
        // Enlaces especiales
        document.querySelectorAll('.forgot-password').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        });
    }
    
    /**
     * Configura los toggles de visibilidad de contraseña
     */
    setupPasswordToggles() {
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const targetId = toggle.dataset.target;
                const passwordInput = document.getElementById(targetId);
                const icon = toggle.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
                
                // Animación del botón
                toggle.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    toggle.style.transform = 'scale(1)';
                }, 100);
            });
        });
    }
    
    /**
     * Configura el indicador de fortaleza de contraseña
     */
    setupPasswordStrengthIndicator() {
        const passwordInput = document.getElementById('registerPassword');
        if (!passwordInput) return;
        
        passwordInput.addEventListener('input', () => {
            this.updatePasswordStrength(passwordInput.value);
        });
    }
    
    /**
     * Actualiza el indicador visual de fortaleza de contraseña
     */
    updatePasswordStrength(password) {
        const strengthFill = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthFill || !strengthText) return;
        
        const strength = this.calculatePasswordStrength(password);
        const colors = {
            0: '#f44336', // Muy débil - rojo
            1: '#ff9800', // Débil - naranja
            2: '#ffc107', // Regular - amarillo
            3: '#4caf50', // Fuerte - verde
            4: '#2e8b57'  // Muy fuerte - verde oscuro
        };
        
        const labels = {
            0: 'Muy débil',
            1: 'Débil',
            2: 'Regular',
            3: 'Fuerte',
            4: 'Muy fuerte'
        };
        
        strengthFill.style.width = `${(strength / 4) * 100}%`;
        strengthFill.style.background = colors[strength];
        strengthText.textContent = password ? labels[strength] : 'Fortaleza de contraseña';
        strengthText.style.color = password ? colors[strength] : '#9e9e9e';
    }
    
    /**
     * Calcula la fortaleza de una contraseña (0-4)
     */
    calculatePasswordStrength(password) {
        if (!password) return 0;
        
        let score = 0;
        
        // Longitud mínima
        if (password.length >= 8) score++;
        
        // Contiene minúsculas
        if (/[a-z]/.test(password)) score++;
        
        // Contiene mayúsculas
        if (/[A-Z]/.test(password)) score++;
        
        // Contiene números
        if (/\d/.test(password)) score++;
        
        // Contiene símbolos
        if (/[@$!%*?&]/.test(password)) score++;
        
        return Math.min(score, 4);
    }
    
    /**
     * Cambia entre formularios de login y registro
     */
    switchForm(formType) {
        if (this.currentForm === formType || this.isLoading) return;
        
        const currentContainer = document.getElementById(`${this.currentForm}-form`);
        const newContainer = document.getElementById(`${formType}-form`);
        const currentBtn = document.querySelector(`[data-form="${this.currentForm}"]`);
        const newBtn = document.querySelector(`[data-form="${formType}"]`);
        
        // Oculta el formulario actual y muestra el nuevo sin
        // dejar espacio extra en el flujo del documento
        currentContainer.classList.remove('active');
        newContainer.classList.add('active');
        
        // Actualiza botones
        currentBtn.classList.remove('active');
        newBtn.classList.add('active');
        
        this.currentForm = formType;
        
        // Limpia errores al cambiar de formulario
        this.clearAllErrors();
    }
    
    /**
     * Valida un campo individual
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';
        
        // Validación de campos requeridos
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = CONFIG.MESSAGES.REQUIRED;
        }
        // Validación específica por tipo
        else if (value) {
            switch (fieldName) {
                case 'email':
                    if (!CONFIG.REGEX.EMAIL.test(value)) {
                        isValid = false;
                        errorMessage = CONFIG.MESSAGES.EMAIL_INVALID;
                    }
                    break;
                    
                case 'phone':
                    if (!CONFIG.REGEX.PHONE.test(value)) {
                        isValid = false;
                        errorMessage = CONFIG.MESSAGES.PHONE_INVALID;
                    }
                    break;
                    
                case 'password':
                    if (field.id === 'registerPassword') {
                        const strength = this.calculatePasswordStrength(value);
                        if (strength < 2) {
                            isValid = false;
                            errorMessage = CONFIG.MESSAGES.PASSWORD_WEAK;
                        }
                    }
                    break;
                    
                case 'confirmPassword':
                    const originalPassword = document.getElementById('registerPassword').value;
                    if (value !== originalPassword) {
                        isValid = false;
                        errorMessage = CONFIG.MESSAGES.PASSWORD_MISMATCH;
                    }
                    break;
            }
        }
        
        // Validación especial para checkbox de términos
        if (field.type === 'checkbox' && field.id === 'acceptTerms' && !field.checked) {
            isValid = false;
            errorMessage = CONFIG.MESSAGES.TERMS_REQUIRED;
        }
        
        this.showFieldError(field, isValid, errorMessage);
        return isValid;
    }
    
    /**
     * Muestra u oculta error en un campo
     */
    showFieldError(field, isValid, errorMessage) {
        const errorElement = document.getElementById(`${field.name}Error`) || 
                           document.getElementById(`${field.id}Error`);
        const container = field.closest('.input-container');
        
        if (!isValid && errorMessage) {
            this.validationErrors.set(field.name || field.id, errorMessage);
            
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.classList.add('show');
            }
            
            if (container) {
                container.classList.add('error');
                field.style.borderColor = '#f44336';
            }
        } else {
            this.validationErrors.delete(field.name || field.id);
            
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.remove('show');
            }
            
            if (container) {
                container.classList.remove('error');
                field.style.borderColor = '';
            }
        }
    }
    
    /**
     * Limpia el error de un campo específico
     */
    clearFieldError(field) {
        const errorElement = document.getElementById(`${field.name}Error`) || 
                           document.getElementById(`${field.id}Error`);
        const container = field.closest('.input-container');
        
        if (errorElement && errorElement.classList.contains('show')) {
            errorElement.classList.remove('show');
            setTimeout(() => {
                errorElement.textContent = '';
            }, CONFIG.ANIMATION.DURATION);
        }
        
        if (container) {
            container.classList.remove('error');
            field.style.borderColor = '';
        }
        
        this.validationErrors.delete(field.name || field.id);
    }
    
    /**
     * Limpia todos los errores
     */
    clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
        
        document.querySelectorAll('.input-container').forEach(container => {
            container.classList.remove('error');
        });
        
        document.querySelectorAll('input').forEach(input => {
            input.style.borderColor = '';
        });
        
        this.validationErrors.clear();
    }
    
    /**
     * Valida todo el formulario
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('input, select');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    /**
     * Maneja el envío del formulario de login
     */
    async handleLogin(event) {
        const form = event.target;
        
        if (!this.validateForm(form) || this.isLoading) {
            return;
        }
        
        this.setLoadingState(true, form);
        
        try {
            const formData = new FormData(form);
            const correo = formData.get('email');
            const contraseña = formData.get('password');
            
            console.log('🔐 Attempting login:', { correo, contraseña: '***' });
            
            const response = await apiService.login(correo, contraseña);
            const user = response.user || apiService.getCurrentUser();
            
            console.log('✅ Login successful, user:', user);
            
            this.showSuccess('¡Bienvenido de vuelta! Iniciando sesión...');
            
            // Redirección basada en el rol del usuario
            setTimeout(() => {
                const currentUser = user || apiService.getCurrentUser();
                const userRole = (currentUser?.role || currentUser?.tipoUsuario || '').toUpperCase();
                const userEmail = (currentUser?.email || currentUser?.correo || '').toLowerCase();
                
                console.log('Rol del usuario:', userRole);
                console.log('Correo del usuario:', userEmail);
                
                // Mapear roles a páginas
                // Si el correo contiene "admin" o el rol es ADMIN → admin
                if (userRole.includes('ADMIN') || userEmail.includes('admin')) {
                    window.location.href = '../admin/index.html';
                } else if (userRole.includes('VETERINARIO') || userRole.includes('VET') || userEmail.includes('vet') || userEmail.includes('veterinario')) {
                    // Si es veterinario → panel de veterinario
                    window.location.href = '../veterinarian/index.html';
                } else {
                    // Cualquier otro caso → cliente
                    window.location.href = '../client/index.html';
                }
            }, 1200);
            
        } catch (error) {
            console.error('❌ Login error:', error);
            this.showError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setTimeout(() => {
                this.setLoadingState(false, form);
            }, 1000);
        }
    }
    
    /**
     * Maneja el envío del formulario de registro
     */
    async handleRegister(event) {
        const form = event.target;
        
        if (!this.validateForm(form) || this.isLoading) {
            return;
        }
        
        this.setLoadingState(true, form);
        
        try {
            const formData = new FormData(form);
            
            // Asignar automáticamente el rol de cliente/dueno
            // Todos los usuarios que se registren serán clientes
            const userRole = 'dueno'; // o 'cliente', según prefieras
            
            const registroData = {
                nombre: formData.get('firstName'),
                apellido: formData.get('lastName'),
                correo: formData.get('email'),
                contrasenia: formData.get('password'),
                telefono: formData.get('phone'),
                direccion: '',
                tipoUsuario: 'DUEÑO'
            };
            
            console.log('📝 Attempting registration:', { ...registroData, contrasenia: '***' });
            
            const registeredUser = await apiService.register(registroData);
            
            console.log('✅ Registration successful, user:', registeredUser);
            
            this.showSuccess('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
            
            // Cambiar automáticamente al formulario de login después del registro
            setTimeout(() => {
                this.switchForm('login');
                form.reset();
                this.updatePasswordStrength('');
            }, 2000);
            
        } catch (error) {
            console.error('❌ Registration error:', error);
            this.showError(error.message || 'Error al crear la cuenta. Intenta nuevamente.');
        } finally {
            setTimeout(() => {
                this.setLoadingState(false, form);
            }, 1000);
        }
    }
    
    /**
     * Maneja el login con redes sociales
     */
    handleSocialLogin(button) {
        const provider = button.classList.contains('google-btn') ? 'Google' : 'Microsoft';
        
        // Animación del botón
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);
        
        console.log(`🔗 Social login with ${provider}`);
        this.showInfo(`Redirigiendo a ${provider}...`);
        
        // Aquí se implementaría la integración real con OAuth
        setTimeout(() => {
            console.log(`✨ ${provider} authentication would be handled here`);
        }, 1000);
    }
    
    /**
     * Maneja la recuperación de contraseña
     */
    handleForgotPassword() {
        console.log('🔑 Password recovery requested');
        this.showInfo('Se abrirá el formulario de recuperación de contraseña');
        
        // Aquí se abriría un modal o se redirigiría a la página de recuperación
    }
    
    /**
     * Establece el estado de carga en un formulario
     */
    setLoadingState(isLoading, form) {
        this.isLoading = isLoading;
        const submitBtn = form.querySelector('.submit-btn');
        
        if (isLoading) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
    
    /**
     * Simula una llamada a la API (DEPRECATED - ahora usamos apiService)
     * Se mantiene por compatibilidad pero ya no se usa
     */
    simulateAPICall() {
        return new Promise((resolve) => {
            setTimeout(resolve, 1500 + Math.random() * 1000);
        });
    }
    
    /**
     * Muestra mensaje de éxito
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    /**
     * Muestra mensaje de error
     */
    showError(message) {
        this.showToast(message, 'error');
    }
    
    /**
     * Muestra mensaje informativo
     */
    showInfo(message) {
        this.showToast(message, 'info');
    }
    
    /**
     * Sistema de notificaciones toast
     */
    showToast(message, type = 'info') {
        // Crear elemento toast si no existe
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(toastContainer);
        }
        
        // Crear toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            info: '#2196F3',
            warning: '#FF9800'
        };
        
        toast.style.cssText = `
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            pointer-events: auto;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        toastContainer.appendChild(toast);
        
        // Animación de entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove después de 4 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 4000);
    }
    
    /**
     * Inicializa animaciones adicionales
     */
    initializeAnimations() {
        // Observador para animaciones on-scroll (si fuera necesario)
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, observerOptions);
        
        // Observar elementos con animaciones
        document.querySelectorAll('.floating-icon').forEach(icon => {
            observer.observe(icon);
        });
        
        // Efectos de partículas en hover del logo
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('mouseenter', () => {
                this.createParticleEffect(logo);
            });
        }
    }
    
    /**
     * Crea efecto de partículas
     */
    createParticleEffect(element) {
        const rect = element.getBoundingClientRect();
        const colors = ['#2E8B57', '#FF8C42', '#4A90E2'];
        
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
            `;
            
            document.body.appendChild(particle);
            
            // Animación de partícula
            const angle = (Math.PI * 2 * i) / 6;
            const distance = 30 + Math.random() * 20;
            const duration = 600 + Math.random() * 400;
            
            particle.animate([
                {
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                easing: 'ease-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia de la aplicación
    const app = new VetAuthApp();
    
    // Hacer disponible globalmente para debugging
    globalThis.VetAuthApp = app;
    
    // Easter egg para desarrolladores
    console.log(`
    🐾 ╔══════════════════════════════════════╗
    🐕 ║     VetUni - Sistema de Autenticación ║
    🐱 ║     Clínica Veterinaria Universitaria ║
    🦴 ║                                      ║
    ❤️ ║     Cuidando a nuestras mascotas     ║
    🏥 ║     con tecnología moderna           ║
    🐾 ╚══════════════════════════════════════╝
    
    👨‍💻 Desarrollado con ❤️ para el cuidado animal
    📱 Diseño responsive y accesible
    ✨ Animaciones suaves y modernas
    🔐 Validación robusta de formularios
    `);
});

// ========== FUNCIONES UTILITARIAS GLOBALES ==========

/**
 * Utilitarios para el manejo de localStorage
 */
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(`vetuni_${key}`, JSON.stringify(value));
        } catch (e) {
            console.warn('LocalStorage not available:', e);
        }
    },
    
    get(key) {
        try {
            const item = localStorage.getItem(`vetuni_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('Error reading from localStorage:', e);
            return null;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(`vetuni_${key}`);
        } catch (e) {
            console.warn('Error removing from localStorage:', e);
        }
    }
};

/**
 * Utilitarios para validación
 */
const Validators = {
    email: (email) => CONFIG.REGEX.EMAIL.test(email),
    phone: (phone) => CONFIG.REGEX.PHONE.test(phone),
    password: (password) => password.length >= CONFIG.REGEX.PASSWORD.MIN_LENGTH,
    strongPassword: (password) => CONFIG.REGEX.PASSWORD.STRONG.test(password)
};

// Hacer disponibles globalmente
globalThis.Storage = Storage;
globalThis.Validators = Validators;
