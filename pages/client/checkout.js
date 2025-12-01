/**
 * ============================================
 * CHECKOUT - VETERINARY CLINIC
 * ============================================
 * 
 * @fileoverview Maneja el proceso de checkout y pago
 * @author VetUni Development Team
 * @version 1.0.0
 * 
 * Funcionalidades principales:
 * - Carga y visualización de items del carrito
 * - Selección de método de pago (tarjeta o local)
 * - Validación completa de formularios
 * - Procesamiento de pedidos
 * - Integración con sistema de notificaciones
 * 
 * @requires cart.js - Funciones del carrito de compras
 * @requires localStorage - API del navegador
 */

// ========== CONSTANTES ==========

/** @constant {string} ORDERS_STORAGE_KEY - Clave para almacenar pedidos en localStorage */
const ORDERS_STORAGE_KEY = 'vetuni_orders';

/** @constant {number} FREE_SHIPPING_THRESHOLD - Monto mínimo para envío gratis */
const FREE_SHIPPING_THRESHOLD = 50;

/** @constant {number} DEFAULT_SHIPPING_COST - Costo de envío por defecto */
const DEFAULT_SHIPPING_COST = 5.00;

/** @constant {number} PROCESSING_DELAY_MS - Delay simulado para procesamiento (ms) */
const PROCESSING_DELAY_MS = 1500;

// ========== INICIALIZACIÓN ==========

/**
 * Inicializa el checkout cuando el DOM está listo
 * Carga las funciones del carrito si no están disponibles
 */
document.addEventListener('DOMContentLoaded', () => {
    // Cargar funciones del carrito dinámicamente si no están disponibles
    if (typeof window.getCart !== 'function') {
        const script = document.createElement('script');
        script.src = './cart.js';
        script.onerror = () => {
            console.error('Error al cargar cart.js');
            alert('Error al cargar el carrito. Por favor recarga la página.');
        };
        document.head.appendChild(script);
        script.onload = () => initializeCheckout();
    } else {
        initializeCheckout();
    }
});

/**
 * Inicializa todas las funcionalidades del checkout
 * Valida que el carrito tenga productos antes de continuar
 * 
 * @returns {void}
 * @throws {Error} Si el carrito está vacío
 */
async function initializeCheckout() {
    try {
        const cart = await window.getCart();
        
        // Validar que el carrito tenga productos
        if (!cart || cart.length === 0) {
            if (window.showNotification) {
                window.showNotification('Tu carrito está vacío', 'error');
            } else {
                alert('Tu carrito está vacío');
            }
            setTimeout(() => {
                window.location.href = './cart.html';
            }, 1000);
            return;
        }
        
        // Inicializar componentes
        renderOrderSummary();
        setupPaymentMethods();
        setupFormValidation();
        
        console.log('✅ Checkout inicializado correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar checkout:', error);
        alert('Error al inicializar el checkout. Por favor recarga la página.');
    }
}

// ========== RENDERIZADO ==========

/**
 * Renderiza el resumen completo del pedido en el sidebar
 * Muestra todos los items, subtotal, envío y total
 * 
 * @returns {Promise<void>}
 */
async function renderOrderSummary() {
    const cart = await window.getCart();
    
    // Validar que el carrito tenga productos
    if (!cart || cart.length === 0) {
        console.warn('Carrito vacío al renderizar resumen');
        window.location.href = './cart.html';
        return;
    }
    
    const orderItemsContainer = document.getElementById('orderItems');
    if (!orderItemsContainer) {
        console.error('Contenedor de items del pedido no encontrado');
        return;
    }
    
    // Renderizar cada item del carrito
    orderItemsContainer.innerHTML = cart.map(item => {
        const itemPrice = parseFloat(item.precio) || 0;
        const itemQuantity = parseInt(item.quantity) || 0;
        const itemTotal = itemPrice * itemQuantity;
        
        return `
            <div class="summary-item">
                <span class="summary-item-name">${escapeHtml(item.nombre)} x${itemQuantity}</span>
                <span class="summary-item-price">$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    // Calcular totales con validación de tipos
    const subtotal = cart.reduce((sum, item) => {
        const itemPrice = parseFloat(item.precio) || 0;
        const itemQuantity = parseInt(item.quantity) || 0;
        return sum + (itemPrice * itemQuantity);
    }, 0);
    
    // Calcular envío (gratis si supera el umbral)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
    
    // Calcular total final
    const total = subtotal + shipping;
    
    // Actualizar elementos del DOM
    const subtotalEl = document.getElementById('summarySubtotal');
    const shippingEl = document.getElementById('summaryShipping');
    const totalEl = document.getElementById('summaryTotal');
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = shipping > 0 ? `$${shipping.toFixed(2)}` : 'Gratis';
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * 
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 * @private
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== MÉTODOS DE PAGO ==========

/**
 * Configura la interacción con los métodos de pago
 * Maneja el cambio entre pago con tarjeta y pago en local
 * Formatea los inputs de tarjeta automáticamente
 * 
 * @returns {void}
 */
function setupPaymentMethods() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    const cardForm = document.getElementById('cardForm');
    const localForm = document.getElementById('localForm');
    
    if (!cardForm || !localForm) {
        console.error('Formularios de pago no encontrados');
        return;
    }
    
    // Configurar event listeners para cada opción de pago
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            handlePaymentMethodChange(option, paymentOptions, cardForm, localForm);
        });
    });
    
    // Configurar formateo automático de campos de tarjeta
    setupCardInputFormatting();
}

/**
 * Maneja el cambio de método de pago
 * 
 * @param {HTMLElement} selectedOption - Opción seleccionada
 * @param {NodeList} allOptions - Todas las opciones de pago
 * @param {HTMLElement} cardForm - Formulario de tarjeta
 * @param {HTMLElement} localForm - Formulario de pago en local
 * @returns {void}
 * @private
 */
function handlePaymentMethodChange(selectedOption, allOptions, cardForm, localForm) {
    // Remover selección anterior
    allOptions.forEach(opt => opt.classList.remove('selected'));
    
    // Agregar selección actual
    selectedOption.classList.add('selected');
    
    // Marcar radio button
    const radio = selectedOption.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
    
    // Mostrar/ocultar formularios según el método seleccionado
    const paymentMethod = selectedOption.dataset.payment;
    const cardFields = ['cardNumber', 'cardExpiry', 'cardCVC', 'cardName'];
    
    if (paymentMethod === 'card') {
        cardForm.classList.add('active');
        localForm.classList.remove('active');
        // Hacer campos de tarjeta requeridos
        cardFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.required = true;
        });
    } else {
        cardForm.classList.remove('active');
        localForm.classList.add('active');
        // Remover requeridos de tarjeta
        cardFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.required = false;
        });
    }
}

/**
 * Configura el formateo automático de los campos de tarjeta
 * Formatea número de tarjeta (espacios cada 4 dígitos)
 * Formatea fecha de expiración (MM/AA)
 * Valida CVC (solo números)
 * 
 * @returns {void}
 * @private
 */
function setupCardInputFormatting() {
    // Formatear número de tarjeta (agregar espacios cada 4 dígitos)
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '');
            value = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = value;
        });
    }
    
    // Formatear fecha de expiración (MM/AA)
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Solo permitir números en CVC
    const cardCVCInput = document.getElementById('cardCVC');
    if (cardCVCInput) {
        cardCVCInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

// ========== VALIDACIÓN ==========

/**
 * Configura los event listeners para la validación del formulario
 * 
 * @returns {void}
 */
function setupFormValidation() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    if (!placeOrderBtn) {
        console.error('Botón de confirmar pedido no encontrado');
        return;
    }
    
    placeOrderBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            await processOrder();
        }
    });
}

/**
 * Valida todos los campos del formulario de checkout
 * 
 * @returns {boolean} true si el formulario es válido, false en caso contrario
 */
function validateForm() {
    // Validar información de contacto
    if (!validateContactInfo()) {
        return false;
    }
    
    // Validar método de pago seleccionado
    const paymentMethod = getSelectedPaymentMethod();
    if (!paymentMethod) {
        showError('Por favor selecciona un método de pago');
        return false;
    }
    
    // Validar datos de tarjeta si es necesario
    if (paymentMethod === 'card' && !validateCardInfo()) {
        return false;
    }
    
    return true;
}

/**
 * Valida la información de contacto (email y teléfono)
 * 
 * @returns {boolean} true si es válida, false en caso contrario
 * @private
 */
function validateContactInfo() {
    const email = document.getElementById('checkoutEmail')?.value.trim();
    const phone = document.getElementById('checkoutPhone')?.value.trim();
    
    // Validar email con regex estándar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showError('Por favor ingresa un correo electrónico válido');
        return false;
    }
    
    // Validar teléfono (mínimo 8 caracteres)
    if (!phone || phone.length < 8) {
        showError('Por favor ingresa un número de teléfono válido');
        return false;
    }
    
    return true;
}

/**
 * Valida la información de la tarjeta de crédito
 * 
 * @returns {boolean} true si es válida, false en caso contrario
 * @private
 */
function validateCardInfo() {
    const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '') || '';
    const cardExpiry = document.getElementById('cardExpiry')?.value || '';
    const cardCVC = document.getElementById('cardCVC')?.value || '';
    const cardName = document.getElementById('cardName')?.value.trim() || '';
    
    // Validar número de tarjeta (mínimo 13 dígitos, máximo 19)
    if (cardNumber.length < 13 || cardNumber.length > 19) {
        showError('Por favor ingresa un número de tarjeta válido (13-19 dígitos)');
        return false;
    }
    
    // Validar formato de fecha de expiración (MM/AA)
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        showError('Por favor ingresa una fecha de expiración válida (MM/AA)');
        return false;
    }
    
    // Validar CVC (3 o 4 dígitos)
    if (cardCVC.length < 3 || cardCVC.length > 4) {
        showError('Por favor ingresa un CVC válido (3-4 dígitos)');
        return false;
    }
    
    // Validar nombre en la tarjeta (mínimo 3 caracteres)
    if (cardName.length < 3) {
        showError('Por favor ingresa el nombre completo en la tarjeta');
        return false;
    }
    
    return true;
}

/**
 * Obtiene el método de pago seleccionado
 * 
 * @returns {string|null} Método de pago seleccionado o null
 * @private
 */
function getSelectedPaymentMethod() {
    const selectedRadio = document.querySelector('input[name="paymentMethod"]:checked');
    return selectedRadio ? selectedRadio.value : null;
}

/**
 * Muestra un mensaje de error usando notificaciones o alert
 * 
 * @param {string} message - Mensaje de error
 * @returns {void}
 * @private
 */
function showError(message) {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, 'error');
    } else {
        alert(message);
    }
}

// ========== PROCESAMIENTO DEL PEDIDO ==========

/**
 * Procesa y confirma el pedido del usuario
 * Calcula totales, guarda el pedido y limpia el carrito
 * 
 * @returns {Promise<void>}
 * @throws {Error} Si hay error al procesar el pedido
 */
async function processOrder() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    if (!placeOrderBtn) {
        console.error('Botón de confirmar pedido no encontrado');
        return;
    }
    
    // Deshabilitar botón y mostrar estado de carga
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
    
    try {
        // Validar carrito
        const cart = await window.getCart();
        if (!cart || cart.length === 0) {
            showError('Tu carrito está vacío');
            setTimeout(() => {
                window.location.href = './cart.html';
            }, 1500);
            return;
        }
        
        // Obtener información del formulario
        const email = document.getElementById('checkoutEmail')?.value.trim();
        const phone = document.getElementById('checkoutPhone')?.value.trim();
        const paymentMethod = getSelectedPaymentMethod();
        
        if (!email || !phone || !paymentMethod) {
            throw new Error('Información incompleta');
        }
        
        // Calcular totales con validación de tipos
        const subtotal = calculateSubtotal(cart);
        const shipping = calculateShipping(subtotal);
        const total = subtotal + shipping;
        
        // Obtener usuario actual o usar guest
        const currentUser = apiService.getCurrentUser();
        const usuarioId = currentUser?.id || null;
        const sessionId = usuarioId ? null : (localStorage.getItem('vetuni:sessionId') || null);
        
        // Preparar datos para el checkout
        const checkoutData = paymentMethod === 'local' ? {
            email: email,
            telefono: phone,
            metodoPago: 'LOCAL'
        } : null;
        
        // Iniciar checkout en el backend
        try {
            const checkoutResponse = await apiService.iniciarCheckout(checkoutData, usuarioId, sessionId);
            
            // Limpiar carrito después de guardar el pedido
            if (usuarioId || sessionId) {
                await apiService.clearCarrito(usuarioId, sessionId);
            }
            localStorage.removeItem('vetuni_cart');
            
            // Actualizar badge del carrito
            if (typeof window.updateCartBadge === 'function') {
                await window.updateCartBadge();
            }
            
            // Mostrar notificación de éxito
            if (typeof window.showNotification === 'function') {
                window.showNotification('¡Pedido confirmado exitosamente!', 'success');
            }
            
            // Simular delay de procesamiento para mejor UX
            await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY_MS));
            
            // Redirigir a página de confirmación
            const orderId = checkoutResponse.pedidoId || checkoutResponse.id || Date.now();
            window.location.href = `./order-confirmation.html?orderId=${orderId}`;
        } catch (error) {
            console.error('Error en checkout:', error);
            throw new Error('Error al procesar el pedido: ' + (error.message || 'Error desconocido'));
        }
        
    } catch (error) {
        console.error('❌ Error procesando pedido:', error);
        showError('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.');
        
        // Restaurar botón
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '<i class="fa-solid fa-check"></i> Confirmar Pedido';
    }
}

/**
 * Calcula el subtotal del pedido
 * 
 * @param {Array<Object>} cart - Carrito de compras
 * @returns {number} Subtotal calculado
 * @private
 */
function calculateSubtotal(cart) {
    return cart.reduce((sum, item) => {
        const itemPrice = parseFloat(item.precio) || 0;
        const itemQuantity = parseInt(item.quantity) || 0;
        return sum + (itemPrice * itemQuantity);
    }, 0);
}

/**
 * Calcula el costo de envío
 * 
 * @param {number} subtotal - Subtotal del pedido
 * @returns {number} Costo de envío (0 si supera el umbral)
 * @private
 */
function calculateShipping(subtotal) {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
}

/**
 * Crea el objeto del pedido con toda la información
 * 
 * @param {Object} data - Datos del pedido
 * @param {Array} data.cart - Carrito de compras
 * @param {string} data.email - Email del cliente
 * @param {string} data.phone - Teléfono del cliente
 * @param {string} data.paymentMethod - Método de pago
 * @param {number} data.subtotal - Subtotal calculado
 * @param {number} data.shipping - Costo de envío
 * @param {number} data.total - Total del pedido
 * @returns {Object} Objeto del pedido completo
 * @private
 */
function createOrderObject(data) {
    return {
        id: Date.now(),
        fecha: new Date().toISOString(),
        items: data.cart,
        contacto: {
            email: data.email,
            phone: data.phone
        },
        metodoPago: data.paymentMethod,
        subtotal: parseFloat(data.subtotal.toFixed(2)),
        shipping: parseFloat(data.shipping.toFixed(2)),
        total: parseFloat(data.total.toFixed(2)),
        estado: data.paymentMethod === 'local' ? 'PENDIENTE_PAGO' : 'PENDIENTE_CONFIRMACION'
    };
}

/**
 * Guarda el pedido en localStorage
 * 
 * @param {Object} order - Objeto del pedido
 * @returns {void}
 * @throws {Error} Si hay error al guardar
 * @private
 */
function saveOrder(order) {
    try {
        const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
        orders.push(order);
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
        console.error('Error al guardar el pedido:', error);
        throw new Error('No se pudo guardar el pedido');
    }
}

