/**
 * ============================================
 * CARRITO DE COMPRAS - VETERINARY CLINIC
 * ============================================
 * 
 * @fileoverview Maneja toda la funcionalidad del carrito de compras
 * @author VetUni Development Team
 * @version 1.0.0
 * 
 * Funcionalidades principales:
 * - Gestión de productos en el carrito (agregar, eliminar, actualizar)
 * - Cálculo automático de totales (subtotal, envío, descuentos)
 * - Persistencia en localStorage
 * - Sincronización del badge de contador en toda la aplicación
 * - Validación de stock disponible
 * 
 * @requires localStorage API del navegador
 */

// ========== CONSTANTES Y CONFIGURACIÓN ==========

/** @constant {string} CART_STORAGE_KEY - Clave para almacenar el carrito en localStorage */
const CART_STORAGE_KEY = 'vetuni_cart';

/** @constant {number} FREE_SHIPPING_THRESHOLD - Monto mínimo para envío gratis */
const FREE_SHIPPING_THRESHOLD = 50;

/** @constant {number} DEFAULT_SHIPPING_COST - Costo de envío por defecto */
const DEFAULT_SHIPPING_COST = 5.00;

// ========== UTILIDADES DEL CARRITO ==========

/**
 * Obtiene el carrito completo desde el backend o localStorage (fallback)
 * 
 * @returns {Promise<Array<Object>>} Array de productos en el carrito, o array vacío si no existe
 * @example
 * const cart = await getCart();
 * console.log(cart.length); // Número de productos
 */
async function getCart() {
    try {
        // Intentar obtener del backend primero
        if (typeof apiService !== 'undefined') {
            const currentUser = apiService.getCurrentUser();
            const usuarioId = currentUser?.id || null;
            const sessionId = usuarioId ? null : (localStorage.getItem('vetuni:sessionId') || null);
            
            if (usuarioId || sessionId) {
                try {
                    const carrito = await apiService.getCarrito(usuarioId, sessionId);
                    if (carrito && carrito.items) {
                        // Mapear al formato esperado
                        const cartItems = carrito.items.map(item => ({
                            id: item.productoId || item.id,
                            nombre: item.producto?.nombre || item.nombre,
                            precio: item.producto?.precio || item.precio,
                            stockActual: item.producto?.stockActual || item.stockActual,
                            categoria: item.producto?.categoria || item.categoria,
                            tipoMascota: item.producto?.tipoMascota || item.tipoMascota,
                            pesoEnKg: item.producto?.pesoEnKg || item.pesoEnKg,
                            quantity: item.cantidad || item.quantity || 1
                        }));
                        
                        // Guardar en localStorage como cache
                        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
                        return cartItems;
                    }
                } catch (error) {
                    console.warn('Error obteniendo carrito del backend, usando cache local:', error);
                }
            }
        }
        
        // Fallback a localStorage
        const cart = localStorage.getItem(CART_STORAGE_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        return [];
    }
}

/**
 * Guarda el carrito en localStorage y actualiza el badge
 * 
 * @param {Array<Object>} cart - Array de productos del carrito
 * @returns {void}
 * @throws {Error} Si hay error al guardar en localStorage
 */
function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        updateCartBadge();
    } catch (error) {
        console.error('Error al guardar el carrito:', error);
        throw new Error('No se pudo guardar el carrito');
    }
}

/**
 * Actualiza el badge del carrito en todos los elementos de la navegación
 * Calcula el total de items y actualiza visualmente los badges
 * 
 * @returns {Promise<void>}
 */
async function updateCartBadge() {
    try {
        const cart = await getCart();
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        // Actualizar badge en todas las páginas
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(badge => {
            if (totalItems > 0) {
                badge.textContent = totalItems > 99 ? '99+' : totalItems;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error al actualizar badge del carrito:', error);
    }
}

/**
 * Agrega un producto al carrito o actualiza su cantidad si ya existe
 * 
 * @param {Object} product - Objeto del producto a agregar
 * @param {number} product.id - ID único del producto
 * @param {string} product.nombre - Nombre del producto
 * @param {number} product.precio - Precio unitario
 * @param {number} product.stockActual - Stock disponible
 * @param {number} [quantity=1] - Cantidad a agregar (por defecto 1)
 * @returns {Array<Object>} Carrito actualizado
 * @throws {Error} Si el producto no tiene stock disponible
 * 
 * @example
 * const product = { id: 1, nombre: 'Alimento', precio: 45.99, stockActual: 10 };
 * addToCart(product, 2); // Agrega 2 unidades
 */
function addToCart(product, quantity = 1) {
    if (!product || !product.id) {
        throw new Error('Producto inválido');
    }
    
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        // Si ya existe, actualizar cantidad
        const newQuantity = existingItem.quantity + quantity;
        
        // Validar stock disponible
        if (newQuantity > product.stockActual) {
            existingItem.quantity = product.stockActual;
            alert(`Solo hay ${product.stockActual} unidades disponibles`);
        } else {
            existingItem.quantity = newQuantity;
        }
    } else {
        // Validar stock antes de agregar
        if (product.stockActual <= 0) {
            throw new Error('El producto no tiene stock disponible');
        }
        
        // Agregar nuevo producto al carrito
        cart.push({
            id: product.id,
            nombre: product.nombre,
            precio: product.precio,
            stockActual: product.stockActual,
            categoria: product.categoria,
            tipoMascota: product.tipoMascota,
            pesoEnKg: product.pesoEnKg,
            quantity: Math.min(quantity, product.stockActual)
        });
    }
    
    saveCart(cart);
    return cart;
}

/**
 * Elimina un producto completamente del carrito
 * 
 * @param {number|string} productId - ID del producto a eliminar
 * @returns {Array<Object>} Carrito actualizado sin el producto
 * 
 * @example
 * removeFromCart(123); // Elimina el producto con ID 123
 */
function removeFromCart(productId) {
    const cart = getCart();
    const filteredCart = cart.filter(item => item.id !== productId);
    saveCart(filteredCart);
    return filteredCart;
}

/**
 * Actualiza la cantidad de un producto específico en el carrito
 * Valida que la cantidad no exceda el stock disponible
 * 
 * @param {number|string} productId - ID del producto
 * @param {number} newQuantity - Nueva cantidad deseada
 * @returns {Array<Object>} Carrito actualizado
 * 
 * @example
 * updateQuantity(123, 5); // Actualiza a 5 unidades
 */
function updateQuantity(productId, newQuantity) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (!item) {
        console.warn(`Producto con ID ${productId} no encontrado en el carrito`);
        return cart;
    }
    
    // Si la cantidad es 0 o negativa, eliminar el producto
    if (newQuantity <= 0) {
        return removeFromCart(productId);
    }
    
    // Validar que no exceda el stock
    if (newQuantity > item.stockActual) {
        newQuantity = item.stockActual;
        alert(`Solo hay ${item.stockActual} unidades disponibles`);
    }
    
    item.quantity = newQuantity;
    saveCart(cart);
    
    return cart;
}

// ========== RENDERIZADO DEL CARRITO ==========

/**
 * Renderiza todos los items del carrito en el DOM
 * Muestra el estado vacío si no hay productos
 * 
 * @returns {Promise<void>}
 */
async function renderCartItems() {
    const cart = await getCart();
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartDiv = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // Validar elementos del DOM
    if (!cartItemsContainer || !emptyCartDiv || !cartContent || !checkoutBtn) {
        console.error('Elementos del DOM del carrito no encontrados');
        return;
    }
    
    // Si el carrito está vacío, mostrar mensaje
    if (cart.length === 0) {
        cartContent.style.display = 'none';
        emptyCartDiv.style.display = 'block';
        checkoutBtn.disabled = true;
        return;
    }
    
    // Mostrar contenido del carrito
    cartContent.style.display = 'block';
    emptyCartDiv.style.display = 'none';
    checkoutBtn.disabled = false;
    
    // Renderizar cada item del carrito
    cartItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = parseFloat(item.precio) * parseInt(item.quantity);
        const categoriaNombre = item.categoria?.nombre || 'Producto';
        const tipoMascota = item.tipoMascota || 'General';
        const pesoInfo = item.pesoEnKg ? ` • ${item.pesoEnKg}kg` : '';
        
        return `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="item-image">
                    <i class="fa-solid fa-box"></i>
                </div>
                <div class="item-details">
                    <div class="item-name">${escapeHtml(item.nombre)}</div>
                    <div class="item-meta">
                        ${escapeHtml(categoriaNombre)} • ${escapeHtml(tipoMascota)}${pesoInfo}
                    </div>
                    <div class="item-price">$${item.precio.toFixed(2)}</div>
                </div>
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="decreaseQuantity(${item.id})" 
                                aria-label="Disminuir cantidad">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <input 
                            type="number" 
                            class="quantity-input" 
                            value="${item.quantity}" 
                            min="1" 
                            max="${item.stockActual}"
                            onchange="updateQuantityInput(${item.id}, this.value)"
                            aria-label="Cantidad"
                        >
                        <button class="quantity-btn" onclick="increaseQuantity(${item.id})"
                                aria-label="Aumentar cantidad">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                    <button class="remove-btn" onclick="removeItem(${item.id})"
                            aria-label="Eliminar producto">
                        <i class="fa-solid fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Actualizar resumen de totales
    updateCartSummary();
}

/**
 * Calcula y actualiza el resumen financiero del pedido
 * Incluye subtotal, envío, descuentos y total
 * 
 * @returns {Promise<void>}
 */
async function updateCartSummary() {
    const cart = await getCart();
    
    // Calcular subtotal (suma de precio * cantidad de cada item)
    const subtotal = cart.reduce((sum, item) => {
        const price = parseFloat(item.precio) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return sum + (price * quantity);
    }, 0);
    
    // Calcular envío (gratis si supera el umbral)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
    
    // Descuentos (por implementar en el futuro)
    const discount = 0;
    
    // Calcular total final
    const total = subtotal + shipping - discount;
    
    // Actualizar elementos del DOM
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const discountEl = document.getElementById('discount');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = shipping > 0 ? `$${shipping.toFixed(2)}` : 'Gratis';
    if (discountEl) discountEl.textContent = discount > 0 ? `-$${discount.toFixed(2)}` : '$0.00';
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

// ========== FUNCIONES DE CONTROL (Event Handlers) ==========

/**
 * Aumenta la cantidad de un producto en 1 unidad
 * 
 * @param {number|string} productId - ID del producto
 * @returns {void}
 */
function increaseQuantity(productId) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        updateQuantity(productId, item.quantity + 1);
        renderCartItems();
    } else {
        console.warn(`Producto con ID ${productId} no encontrado`);
    }
}

/**
 * Disminuye la cantidad de un producto en 1 unidad
 * No permite cantidades menores a 1
 * 
 * @param {number|string} productId - ID del producto
 * @returns {void}
 */
function decreaseQuantity(productId) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item && item.quantity > 1) {
        updateQuantity(productId, item.quantity - 1);
        renderCartItems();
    }
}

/**
 * Actualiza la cantidad desde el input numérico
 * 
 * @param {number|string} productId - ID del producto
 * @param {string|number} value - Nuevo valor del input
 * @returns {void}
 */
function updateQuantityInput(productId, value) {
    const quantity = parseInt(value) || 1;
    updateQuantity(productId, quantity);
    renderCartItems();
}

/**
 * Elimina un producto del carrito con confirmación
 * 
 * @param {number|string} productId - ID del producto a eliminar
 * @returns {void}
 */
function removeItem(productId) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (!item) {
        console.warn(`Producto con ID ${productId} no encontrado`);
        return;
    }
    
    if (confirm(`¿Estás seguro de que deseas eliminar "${item.nombre}" del carrito?`)) {
        removeFromCart(productId);
        renderCartItems();
    }
}

// ========== INICIALIZACIÓN ==========

/**
 * Inicializa el carrito cuando el DOM está listo
 * Renderiza los items y configura los event listeners
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Renderizar items del carrito
        await renderCartItems();
        
        // Actualizar badge en la navegación
        updateCartBadge();
        
        // Configurar botón de checkout
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', async () => {
                const cart = await getCart();
                if (cart.length > 0) {
                    window.location.href = './checkout.html';
                } else {
                    alert('Tu carrito está vacío');
                }
            });
        }
        
        console.log('✅ Carrito de compras inicializado correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar el carrito:', error);
    }
});

// ========== EXPORTACIÓN DE FUNCIONES GLOBALES ==========

/**
 * Exporta funciones para uso global en otras páginas
 * Permite que otras páginas puedan agregar productos al carrito
 * Nota: getCart ahora es async, pero mantenemos compatibilidad con versión síncrona
 */
window.addToCart = addToCart;
window.getCart = getCart;
window.updateCartBadge = updateCartBadge;

// Función síncrona de compatibilidad (usa cache local)
window.getCartSync = function() {
    try {
        const cart = localStorage.getItem(CART_STORAGE_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        return [];
    }
};

