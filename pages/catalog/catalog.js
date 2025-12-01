/**
 * ============================================
 * CATÁLOGO DE PRODUCTOS - VETERINARY CLINIC
 * ============================================
 * 
 * @fileoverview Catálogo completo de productos veterinarios
 * @author VetUni Development Team
 * @version 1.0.0
 * 
 * Funcionalidades principales:
 * - Visualización de productos por categorías
 * - Búsqueda y filtrado de productos
 * - Vista detallada de cada producto
 * - Agregar productos al carrito de compras
 * - Gestión del badge del carrito
 * - Validación de stock disponible
 * 
 * NOTA: Usa datos mock estáticos (similar a mascotas y citas)
 * En producción, estos datos vendrían de una API backend
 * 
 * @requires localStorage - API del navegador
 * @requires cart.js - Funciones del carrito de compras
 */

// ========== DATOS MOCK DE CATEGORÍAS ==========
const MOCK_CATEGORIES = [
    { id: 1, nombre: 'Alimentos', descripcion: 'Alimentos balanceados para perros y gatos' },
    { id: 2, nombre: 'Medicinas', descripcion: 'Medicamentos y suplementos veterinarios' },
    { id: 3, nombre: 'Accesorios', descripcion: 'Juguetes, collares, correas y más' },
    { id: 4, nombre: 'Higiene', descripcion: 'Productos de limpieza y cuidado' },
    { id: 5, nombre: 'Premios', descripcion: 'Snacks y golosinas saludables' }
];

// ========== DATOS MOCK DE PRODUCTOS ==========
const MOCK_PRODUCTS = [
    {
        id: 1,
        nombre: 'Alimento Premium para Perros',
        precio: 45.99,
        stockActual: 25,
        disponibleParaVenta: true,
        tipoProducto: 'ALIMENTO',
        categoria: { id: 1, nombre: 'Alimentos', descripcion: 'Alimentos balanceados para perros y gatos' },
        tipoMascota: 'Perro',
        pesoEnKg: 15.0
    },
    {
        id: 2,
        nombre: 'Alimento Premium para Gatos',
        precio: 38.50,
        stockActual: 18,
        disponibleParaVenta: true,
        tipoProducto: 'ALIMENTO',
        categoria: { id: 1, nombre: 'Alimentos', descripcion: 'Alimentos balanceados para perros y gatos' },
        tipoMascota: 'Gato',
        pesoEnKg: 10.0
    },
    {
        id: 3,
        nombre: 'Desparasitante Oral',
        precio: 12.99,
        stockActual: 42,
        disponibleParaVenta: true,
        tipoProducto: 'MEDICINA',
        categoria: { id: 2, nombre: 'Medicinas', descripcion: 'Medicamentos y suplementos veterinarios' },
        composicion: 'Praziquantel, Pirantel',
        dosisRecomendada: '1 tableta cada 3 meses'
    },
    {
        id: 4,
        nombre: 'Vacuna Antirrábica',
        precio: 25.00,
        stockActual: 8,
        disponibleParaVenta: true,
        tipoProducto: 'MEDICINA',
        categoria: { id: 2, nombre: 'Medicinas', descripcion: 'Medicamentos y suplementos veterinarios' },
        composicion: 'Virus inactivado',
        dosisRecomendada: '1 dosis anual'
    },
    {
        id: 5,
        nombre: 'Collar Ajustable con Placa',
        precio: 15.99,
        stockActual: 30,
        disponibleParaVenta: true,
        tipoProducto: 'ACCESORIO',
        categoria: { id: 3, nombre: 'Accesorios', descripcion: 'Juguetes, collares, correas y más' },
        material: 'Nylon resistente',
        tamanio: 'Ajustable (30-50 cm)'
    },
    {
        id: 6,
        nombre: 'Juguete Hueso de Goma',
        precio: 8.50,
        stockActual: 15,
        disponibleParaVenta: true,
        tipoProducto: 'ACCESORIO',
        categoria: { id: 3, nombre: 'Accesorios', descripcion: 'Juguetes, collares, correas y más' },
        material: 'Goma no tóxica',
        tamanio: 'Mediano'
    },
    {
        id: 7,
        nombre: 'Shampoo Hipoalergénico',
        precio: 18.75,
        stockActual: 22,
        disponibleParaVenta: true,
        tipoProducto: 'ACCESORIO',
        categoria: { id: 4, nombre: 'Higiene', descripcion: 'Productos de limpieza y cuidado' },
        material: 'Fórmula suave',
        tamanio: '500ml'
    },
    {
        id: 8,
        nombre: 'Snacks de Pollo Deshidratado',
        precio: 9.99,
        stockActual: 35,
        disponibleParaVenta: true,
        tipoProducto: 'ALIMENTO',
        categoria: { id: 5, nombre: 'Premios', descripcion: 'Snacks y golosinas saludables' },
        tipoMascota: 'Perro',
        pesoEnKg: 0.5
    },
    {
        id: 9,
        nombre: 'Antibiótico de Amplio Espectro',
        precio: 32.50,
        stockActual: 5,
        disponibleParaVenta: true,
        tipoProducto: 'MEDICINA',
        categoria: { id: 2, nombre: 'Medicinas', descripcion: 'Medicamentos y suplementos veterinarios' },
        composicion: 'Amoxicilina + Ácido Clavulánico',
        dosisRecomendada: 'Según peso y prescripción veterinaria'
    },
    {
        id: 10,
        nombre: 'Cama Ortopédica para Perros',
        precio: 65.00,
        stockActual: 12,
        disponibleParaVenta: true,
        tipoProducto: 'ACCESORIO',
        categoria: { id: 3, nombre: 'Accesorios', descripcion: 'Juguetes, collares, correas y más' },
        material: 'Espuma viscoelástica',
        tamanio: 'Grande (90x70 cm)'
    },
    {
        id: 11,
        nombre: 'Alimento para Cachorros',
        precio: 42.99,
        stockActual: 0,
        disponibleParaVenta: false,
        tipoProducto: 'ALIMENTO',
        categoria: { id: 1, nombre: 'Alimentos', descripcion: 'Alimentos balanceados para perros y gatos' },
        tipoMascota: 'Perro',
        pesoEnKg: 12.0
    },
    {
        id: 12,
        nombre: 'Cepillo de Dientes para Mascotas',
        precio: 6.99,
        stockActual: 28,
        disponibleParaVenta: true,
        tipoProducto: 'ACCESORIO',
        categoria: { id: 4, nombre: 'Higiene', descripcion: 'Productos de limpieza y cuidado' },
        material: 'Cerdas suaves',
        tamanio: 'Único'
    }
];

let allProducts = [];
let allCategories = [];
let filteredProducts = [];
let selectedCategory = 'all';
let searchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
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
        
        const catalogContainer = document.querySelector('.catalog-container');
        if (catalogContainer) {
            catalogContainer.style.width = '100%';
            catalogContainer.style.maxWidth = '100%';
            catalogContainer.style.overflowX = 'hidden';
        }
    };
    
    preventHorizontalScroll();
    window.addEventListener('resize', preventHorizontalScroll);
    window.addEventListener('load', preventHorizontalScroll);
    
    setTimeout(() => {
        preventHorizontalScroll();
        window.dispatchEvent(new Event('resize'));
    }, 100);
    loadCategories();
    loadProducts();
    setupEventListeners();
    updateCartBadgeInCatalog();
    
    // Si hay un hash en la URL, abrir el detalle del producto
    const hash = window.location.hash;
    if (hash && hash.startsWith('#product-')) {
        const productId = hash.replace('#product-', '');
        setTimeout(() => showProductDetail(Number(productId)), 500);
    }
});

/**
 * Carga las categorías desde el backend
 */
async function loadCategories() {
    try {
        const categorias = await apiService.getAllCategorias();
        allCategories = categorias.map(cat => ({
            id: cat.id,
            nombre: cat.nombre,
            descripcion: cat.descripcion || ''
        }));
        renderCategories();
    } catch (error) {
        console.error('Error cargando categorías:', error);
        // Fallback a categorías mock si hay error
        allCategories = MOCK_CATEGORIES;
        renderCategories();
    }
}

/**
 * Carga los productos desde el backend
 */
async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    productsGrid.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--primary-color);"></i></div>';
    
    try {
        const productos = await apiService.getAllProductos();
        
        // Mapear productos del backend al formato esperado
        allProducts = productos.map(prod => ({
            id: prod.id,
            nombre: prod.nombre,
            precio: prod.precio || 0,
            stockActual: prod.stockActual || 0,
            disponibleParaVenta: prod.disponibleParaVenta !== false,
            tipoProducto: prod.tipoProducto || 'ACCESORIO',
            categoria: prod.categoria || { id: 1, nombre: 'General', descripcion: '' },
            tipoMascota: prod.tipoMascota || null,
            pesoEnKg: prod.pesoEnKg || null,
            composicion: prod.composicion || null,
            dosisRecomendada: prod.dosisRecomendada || null,
            material: prod.material || null,
            tamanio: prod.tamanio || null
        }));
        
        filteredProducts = [...allProducts];
        
        if (allProducts.length === 0) {
            noProducts.style.display = 'block';
            productsGrid.innerHTML = '';
            return;
        }
        
        noProducts.style.display = 'none';
        renderProducts();
    } catch (error) {
        console.error('Error cargando productos:', error);
        // Fallback a productos mock si hay error
        allProducts = MOCK_PRODUCTS;
        filteredProducts = [...allProducts];
        
        if (allProducts.length === 0) {
            noProducts.style.display = 'block';
            productsGrid.innerHTML = '';
            return;
        }
        
        noProducts.style.display = 'none';
        renderProducts();
    }
}

/**
 * Renderiza las categorías en el filtro
 */
function renderCategories() {
    const categoriesFilter = document.getElementById('categoriesFilter');
    
    // Mantener el botón "Todos"
    const allButton = categoriesFilter.querySelector('[data-category="all"]');
    categoriesFilter.innerHTML = '';
    categoriesFilter.appendChild(allButton);
    
    // Agregar categorías
    if (Array.isArray(allCategories) && allCategories.length > 0) {
        allCategories.forEach(categoria => {
            const chip = document.createElement('div');
            chip.className = 'category-chip';
            chip.dataset.category = categoria.nombre.toLowerCase().replace(/\s+/g, '');
            
            // Iconos específicos por categoría
            let icon = 'fa-tag';
            if (categoria.nombre.toLowerCase().includes('alimento')) {
                icon = 'fa-bowl-food';
            } else if (categoria.nombre.toLowerCase().includes('medicina')) {
                icon = 'fa-syringe';
            } else if (categoria.nombre.toLowerCase().includes('accesorio')) {
                icon = 'fa-bone';
            } else if (categoria.nombre.toLowerCase().includes('higiene')) {
                icon = 'fa-pump-soap';
            } else if (categoria.nombre.toLowerCase().includes('premio')) {
                icon = 'fa-trophy';
            }
            
            chip.innerHTML = `<i class="fa-solid ${icon}"></i> ${categoria.nombre || 'Sin nombre'}`;
            chip.addEventListener('click', () => filterByCategory(categoria.id));
            categoriesFilter.appendChild(chip);
        });
    }
}

/**
 * Renderiza los productos en el grid
 */
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '';
        noProducts.style.display = 'block';
        return;
    }
    
    noProducts.style.display = 'none';
    productsGrid.innerHTML = '';
    
    filteredProducts.forEach(producto => {
        const card = createProductCard(producto);
        productsGrid.appendChild(card);
    });
}

/**
 * Crea una tarjeta de producto
 */
function createProductCard(producto) {
    const card = document.createElement('div');
    card.className = 'product-card-enhanced';
    
    // Determinar icono y badge según tipo
    let icon = 'fa-box';
    let badgeClass = 'badge-alimento';
    let badgeText = 'Alimento';
    
    if (producto.tipoProducto === 'ALIMENTO') {
        icon = 'fa-bowl-food';
        badgeClass = 'badge-alimento';
        badgeText = 'Alimento';
    } else if (producto.tipoProducto === 'MEDICINA') {
        icon = 'fa-syringe';
        badgeClass = 'badge-medicina';
        badgeText = 'Medicina';
    } else if (producto.tipoProducto === 'ACCESORIO') {
        icon = 'fa-bone';
        badgeClass = 'badge-accesorio';
        badgeText = 'Accesorio';
    }
    
    // Determinar estado de stock
    let stockClass = 'stock-out';
    let stockText = 'Sin stock';
    
    if (producto.stockActual > 10) {
        stockClass = 'stock-available';
        stockText = `Stock: ${producto.stockActual}`;
    } else if (producto.stockActual > 0) {
        stockClass = 'stock-low';
        stockText = `Stock bajo: ${producto.stockActual}`;
    }
    
    card.innerHTML = `
        <div class="product-badge ${badgeClass}">${badgeText}</div>
        <div class="product-image">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="product-content">
            <div class="product-title">${producto.nombre || 'Sin nombre'}</div>
            <div class="product-category">
                <i class="fa-solid fa-tag"></i> ${producto.categoria ? producto.categoria.nombre : 'Sin categoría'}
            </div>
            <div class="product-price">${producto.precio ? producto.precio.toFixed(2) : '0.00'}</div>
            <div class="product-stock ${stockClass}">
                <i class="fa-solid ${producto.stockActual > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${stockText}
            </div>
            <div class="product-actions">
                <button class="btn-view" onclick="showProductDetail(${producto.id})">
                    <i class="fa-solid fa-eye"></i> Ver Detalles
                </button>
                ${producto.disponibleParaVenta && producto.stockActual > 0 ? `
                <button class="btn-view" onclick="addProductToCart(${producto.id})" style="background: linear-gradient(135deg, var(--secondary-color), var(--secondary-light));">
                    <i class="fa-solid fa-cart-plus"></i> Agregar
                </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Filtra productos por categoría
 */
function filterByCategory(categoryId) {
    selectedCategory = categoryId;
    
    // Actualizar chips activos
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.category === String(categoryId) || (categoryId === 'all' && chip.dataset.category === 'all')) {
            chip.classList.add('active');
        }
    });
    
    applyFilters();
}

/**
 * Aplica todos los filtros (categoría y búsqueda)
 */
function applyFilters() {
    filteredProducts = allProducts.filter(producto => {
        // Filtro por categoría
        const categoryMatch = selectedCategory === 'all' || 
            (producto.categoria && producto.categoria.id === Number(selectedCategory));
        
        // Filtro por búsqueda
        const searchMatch = !searchTerm || 
            producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (producto.categoria && producto.categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return categoryMatch && searchMatch;
    });
    
    renderProducts();
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            applyFilters();
        });
    }
    
    // Botón "Todos"
    const allChip = document.querySelector('[data-category="all"]');
    if (allChip) {
        allChip.addEventListener('click', () => {
            selectedCategory = 'all';
            document.querySelectorAll('.category-chip').forEach(chip => {
                chip.classList.remove('active');
            });
            allChip.classList.add('active');
            applyFilters();
        });
    }
    
    // Cerrar modal
    const closeModal = document.getElementById('closeProductModal');
    const productModal = document.getElementById('productModal');
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            productModal.classList.remove('open');
            productModal.style.display = 'none';
        });
    }
    
    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                productModal.classList.remove('open');
                productModal.style.display = 'none';
            }
        });
    }
}

/**
 * Muestra el detalle de un producto
 */
/**
 * Muestra el detalle completo de un producto en un modal
 * 
 * @param {number|string} productId - ID del producto a mostrar
 * @returns {void}
 * 
 * @example
 * showProductDetail(123); // Muestra el modal con detalles del producto 123
 */
function showProductDetail(productId) {
    const productModal = document.getElementById('productModal');
    const modalBody = document.getElementById('productModalBody');
    const modalTitle = document.getElementById('modalProductTitle');
    
    if (!productModal || !modalBody || !modalTitle) {
        console.error('Elementos del modal no encontrados');
        return;
    }
    
    // Buscar producto en los datos mock
    const producto = allProducts.find(p => p.id === productId);
    
    if (!producto) {
        alert('Producto no encontrado');
        return;
    }
    
    // Determinar icono y badge
    let icon = 'fa-box';
    let badgeClass = 'badge-alimento';
    let badgeText = 'Alimento';
    
    if (producto.tipoProducto === 'ALIMENTO') {
        icon = 'fa-bowl-food';
        badgeClass = 'badge-alimento';
        badgeText = 'Alimento';
    } else if (producto.tipoProducto === 'MEDICINA') {
        icon = 'fa-syringe';
        badgeClass = 'badge-medicina';
        badgeText = 'Medicina';
    } else if (producto.tipoProducto === 'ACCESORIO') {
        icon = 'fa-bone';
        badgeClass = 'badge-accesorio';
        badgeText = 'Accesorio';
    }
    
    // Información específica según tipo
    let specificInfo = '';
    
    if (producto.tipoProducto === 'ALIMENTO') {
        specificInfo = `
            <div class="summary-card" style="padding:1rem; margin-top:1rem;">
                <div style="font-weight:600; color:var(--primary-dark); margin-bottom:.5rem;">
                    <i class="fa-solid fa-info-circle"></i> Información del Alimento
                </div>
                <p><strong>Tipo de Mascota:</strong> ${producto.tipoMascota || 'N/A'}</p>
                <p><strong>Peso:</strong> ${producto.pesoEnKg ? producto.pesoEnKg + ' kg' : 'N/A'}</p>
            </div>
        `;
    } else if (producto.tipoProducto === 'MEDICINA') {
        specificInfo = `
            <div class="summary-card" style="padding:1rem; margin-top:1rem;">
                <div style="font-weight:600; color:var(--primary-dark); margin-bottom:.5rem;">
                    <i class="fa-solid fa-info-circle"></i> Información de la Medicina
                </div>
                <p><strong>Composición:</strong> ${producto.composicion || 'N/A'}</p>
                <p><strong>Dosis Recomendada:</strong> ${producto.dosisRecomendada || 'N/A'}</p>
            </div>
        `;
    } else if (producto.tipoProducto === 'ACCESORIO') {
        specificInfo = `
            <div class="summary-card" style="padding:1rem; margin-top:1rem;">
                <div style="font-weight:600; color:var(--primary-dark); margin-bottom:.5rem;">
                    <i class="fa-solid fa-info-circle"></i> Información del Accesorio
                </div>
                <p><strong>Material:</strong> ${producto.material || 'N/A'}</p>
                <p><strong>Tamaño:</strong> ${producto.tamanio || 'N/A'}</p>
            </div>
        `;
    }
    
    // Estado de stock
    let stockClass = 'stock-out';
    let stockText = 'Sin stock';
    let stockIcon = 'fa-times-circle';
    
    if (producto.stockActual > 10) {
        stockClass = 'stock-available';
        stockText = `Disponible (${producto.stockActual} unidades)`;
        stockIcon = 'fa-check-circle';
    } else if (producto.stockActual > 0) {
        stockClass = 'stock-low';
        stockText = `Stock bajo (${producto.stockActual} unidades)`;
        stockIcon = 'fa-exclamation-circle';
    }
    
    modalTitle.textContent = producto.nombre || 'Producto';
    modalBody.innerHTML = `
        <div style="text-align:center; margin-bottom:2rem;">
            <div style="width:200px; height:200px; background:linear-gradient(135deg, var(--gray-50), var(--gray-100)); border-radius:16px; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:5rem; color:var(--primary-color);">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="product-badge ${badgeClass}" style="margin-top:1rem; display:inline-block;">${badgeText}</div>
        </div>
        
        <div class="form-grid">
            <div class="summary-card" style="padding:1rem;">
                <div style="font-weight:600; color:var(--primary-dark); margin-bottom:.5rem;">
                    <i class="fa-solid fa-tag"></i> Categoría
                </div>
                <p>${producto.categoria ? producto.categoria.nombre : 'Sin categoría'}</p>
                ${producto.categoria && producto.categoria.descripcion ? `<p style="color:var(--gray-600); font-size:0.9rem; margin-top:0.5rem;">${producto.categoria.descripcion}</p>` : ''}
            </div>
            
            <div class="summary-card" style="padding:1rem;">
                <div style="font-weight:600; color:var(--primary-dark); margin-bottom:.5rem;">
                    <i class="fa-solid fa-dollar-sign"></i> Precio
                </div>
                <div style="font-size:2rem; font-weight:700; color:var(--primary-color);">
                    $${producto.precio ? producto.precio.toFixed(2) : '0.00'}
                </div>
            </div>
        </div>
        
        <div class="summary-card" style="padding:1rem; margin-top:1rem;">
            <div style="font-weight:600; color:var(--primary-dark); margin-bottom:.5rem;">
                <i class="fa-solid fa-boxes"></i> Disponibilidad
            </div>
            <div class="product-stock ${stockClass}" style="display:inline-block;">
                <i class="fa-solid ${stockIcon}"></i> ${stockText}
            </div>
            <p style="margin-top:0.5rem; color:var(--gray-600);">
                ${producto.disponibleParaVenta ? 'Disponible para venta' : 'No disponible para venta'}
            </p>
        </div>
        
        ${specificInfo}
        
        ${producto.disponibleParaVenta && producto.stockActual > 0 ? `
        <div style="margin-top:2rem; display:flex; gap:1rem;">
            <button class="submit-btn" onclick="addProductToCart(${producto.id}); document.getElementById('productModal').style.display='none';" style="flex:1;">
                <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
            </button>
        </div>
        ` : ''}
    `;
    
    productModal.classList.add('open');
    productModal.style.display = 'flex';
}

/**
 * Agrega un producto al carrito
 */
/**
 * Agrega un producto al carrito de compras
 * Valida disponibilidad y stock antes de agregar
 * 
 * @param {number|string} productId - ID del producto a agregar
 * @returns {void}
 * 
 * @example
 * addProductToCart(123); // Agrega el producto con ID 123 al carrito
 */
async function addProductToCart(productId) {
    const producto = allProducts.find(p => p.id === productId);
    
    if (!producto) {
        alert('Producto no encontrado');
        return;
    }
    
    if (!producto.disponibleParaVenta) {
        alert('Este producto no está disponible para venta');
        return;
    }
    
    if (producto.stockActual <= 0) {
        alert('Este producto no tiene stock disponible');
        return;
    }
    
    try {
        // Obtener usuario actual o generar sessionId para guest
        const currentUser = apiService.getCurrentUser();
        const usuarioId = currentUser?.id || null;
        const sessionId = usuarioId ? null : (localStorage.getItem('vetuni:sessionId') || `guest-${Date.now()}`);
        
        if (!usuarioId && !sessionId) {
            localStorage.setItem('vetuni:sessionId', sessionId);
        }
        
        // Agregar al carrito usando el API
        const itemData = {
            productoId: producto.id,
            cantidad: 1
        };
        
        await apiService.addItemToCarrito(itemData, usuarioId, sessionId);
        
        // Actualizar badge
        updateCartBadgeInCatalog();
        alert(`${producto.nombre} agregado al carrito`);
    } catch (error) {
        console.error('Error agregando producto al carrito:', error);
        
        // Fallback a localStorage si hay error
        const cart = JSON.parse(localStorage.getItem('vetuni_cart') || '[]');
        const existingItem = cart.find(item => item.id === producto.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
            if (existingItem.quantity > existingItem.stockActual) {
                existingItem.quantity = existingItem.stockActual;
                alert(`Solo hay ${existingItem.stockActual} unidades disponibles`);
            }
        } else {
            cart.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                stockActual: producto.stockActual,
                categoria: producto.categoria,
                tipoMascota: producto.tipoMascota,
                pesoEnKg: producto.pesoEnKg,
                quantity: Math.min(1, producto.stockActual)
            });
        }
        
        localStorage.setItem('vetuni_cart', JSON.stringify(cart));
        updateCartBadgeInCatalog();
        alert(`${producto.nombre} agregado al carrito (modo offline)`);
    }
}

/**
 * Actualiza el badge del carrito en el catálogo
 */
/**
 * Actualiza el badge del carrito en la navegación del catálogo
 * Calcula el total de items y actualiza visualmente todos los badges
 * 
 * @returns {void}
 */
function updateCartBadgeInCatalog() {
    try {
        const cart = JSON.parse(localStorage.getItem('vetuni_cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
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
        console.error('Error actualizando badge del carrito:', error);
    }
}

// Hacer las funciones globales para que funcionen desde los onclick
window.showProductDetail = showProductDetail;
window.addProductToCart = addProductToCart;

