/**
 * ============================================
 * ADMIN PRODUCTS - GESTIÓN DE PRODUCTOS
 * ============================================
 * Maneja todas las funciones de gestión de productos
 */

let currentEditingProductId = null;
let currentView = 'list'; // 'list' o 'new'

// Variable global para trackear la sección actual
let currentProductsSection = 'list';

// Inicializar cuando se carga la sección
(function() {
    setTimeout(() => {
        if (document.getElementById('productsListView')) {
            initProducts();
        }
    }, 150);
})();

/**
 * Inicializa el módulo de productos
 * Esta función se puede llamar desde admin.js con el sectionId
 */
function initProducts(sectionId = 'list') {
    console.log('🔵 initProducts llamado con sectionId:', sectionId);
    currentProductsSection = sectionId;
    
    // Siempre mostrar la vista de lista
    setTimeout(() => {
        showProductsListView();
        
        // Si se solicita abrir el modal directamente
        if (sectionId === 'new' || sectionId === 'products-new') {
            setTimeout(() => {
                openCreateProductModal();
            }, 300);
        }
    }, 100);
}

/**
 * Función global para cambiar de vista desde admin.js
 */
function showProductsSection(sectionId) {
    initProducts(sectionId);
}

/**
 * Muestra la vista de lista de productos
 */
function showProductsListView() {
    console.log('🔵 showProductsListView llamado');
    currentView = 'list';
    const listView = document.getElementById('productsListView');
    
    if (listView) {
        listView.style.display = 'block';
        console.log('✅ Vista de lista mostrada');
    } else {
        console.error('❌ productsListView no encontrado en el DOM');
    }
    
    loadProductsList();
}

/**
 * Muestra la vista de nuevo/editar producto
 */
/**
 * Abre el modal para crear un nuevo producto
 * @returns {void}
 */
function openCreateProductModal() {
    console.log('🔵 openCreateProductModal llamado');
    currentEditingProductId = null;
    
    // Intentar encontrar el modal inmediatamente
    let modal = document.getElementById('createProductModal');
    
    if (modal) {
        console.log('✅ Modal encontrado inmediatamente');
        showProductModalContent(modal);
        return;
    }
    
    // Si no se encuentra, buscar en el contenedor de secciones
    console.log('⏳ Modal no encontrado en body, buscando en contenedor...');
    const sectionContainer = document.getElementById('adminSectionsContainer');
    if (sectionContainer) {
        const modalInContainer = sectionContainer.querySelector('#createProductModal');
        if (modalInContainer) {
            console.log('✅ Modal encontrado en el contenedor, moviéndolo al body');
            // Mover el modal al body (no clonar, mover directamente)
            document.body.appendChild(modalInContainer);
            modal = document.getElementById('createProductModal');
            if (modal) {
                showProductModalContent(modal);
                return;
            }
        }
    }
    
    // Si aún no se encuentra, esperar y reintentar
    console.log('⏳ Iniciando reintentos para encontrar el modal...');
    let retries = 0;
    const maxRetries = 25; // Aumentar a 25 intentos (5 segundos)
    
    const checkModal = setInterval(() => {
        modal = document.getElementById('createProductModal');
        retries++;
        
        if (modal) {
            clearInterval(checkModal);
            console.log(`✅ Modal encontrado después de ${retries} intentos`);
            showProductModalContent(modal);
        } else if (retries >= maxRetries) {
            clearInterval(checkModal);
            console.error(`❌ Modal createProductModal no encontrado después de ${maxRetries} intentos`);
            console.log('📋 Verificando modales disponibles:', Array.from(document.querySelectorAll('[id*="Modal"]')).map(m => m.id));
            showToast('Error: No se pudo cargar el formulario. Por favor, recarga la página o navega nuevamente a la sección de Productos.', 'error');
        }
    }, 200);
}

/**
 * Muestra el contenido del modal de producto
 * @param {HTMLElement} modal - Elemento del modal
 * @param {string|null} productId - ID del producto a editar (null para nuevo)
 * @returns {void}
 */
function showProductModalContent(modal, productId = null) {
    if (!modal) return;
    
    console.log('📋 Mostrando modal:', modal.id);
    
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    
    if (title) title.textContent = productId ? 'Editar Producto' : 'Nuevo Producto';
    if (form && !productId) form.reset();
    
    if (productId) {
        loadProductForEdit(productId);
    } else {
        resetProductForm();
    }
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal mostrado correctamente');
}

/**
 * Cierra el modal de crear/editar producto
 * @returns {void}
 */
function closeCreateProductModal() {
    const modal = document.getElementById('createProductModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Función obsoleta - mantener por compatibilidad pero ahora usa modal
 * @param {string|null} productId - ID del producto a editar
 * @returns {void}
 */
function showProductsNewView(productId = null) {
    // Redirigir a la función del modal
    if (productId) {
        openCreateProductModal();
        // Esperar un poco para que el modal se abra antes de cargar los datos
        setTimeout(() => {
            const modal = document.getElementById('createProductModal');
            if (modal) {
                showProductModalContent(modal, productId);
            }
        }, 300);
    } else {
        openCreateProductModal();
    }
}

/**
 * Carga la lista de productos
 */
function loadProductsList() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    let products = JSON.parse(localStorage.getItem('vetuni:mockProducts') || '[]');
    
    // Si no hay productos, inicializar con algunos por defecto
    if (products.length === 0) {
        products = getDefaultProducts();
        localStorage.setItem('vetuni:mockProducts', JSON.stringify(products));
    }
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--gray-600);">No hay productos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => {
        const stockColor = (product.stock || 0) <= 10 ? '#F44336' : (product.stock || 0) <= 20 ? '#FF9800' : '#4CAF50';
        const statusText = (product.disponibleParaVenta !== false) ? 'Disponible' : 'Oculto';
        const statusColor = (product.disponibleParaVenta !== false) ? '#4CAF50' : '#757575';
        
        return `
            <tr style="border-bottom:1px solid var(--gray-200);">
                <td style="padding:0.75rem; color:var(--gray-600);">${product.id}</td>
                <td style="padding:0.75rem; font-weight:600; color:var(--gray-900);">${escapeHtml(product.nombre || product.name)}</td>
                <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(product.categoria?.nombre || product.category || 'N/A')}</td>
                <td style="padding:0.75rem; font-weight:600; color:var(--primary-color);">$${(product.precio || product.price || 0).toFixed(2)}</td>
                <td style="padding:0.75rem; text-align:center;">
                    <span style="background:${stockColor}; color:white; padding:0.25rem 0.5rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                        ${product.stock || product.stockActual || 0}
                    </span>
                </td>
                <td style="padding:0.75rem; text-align:center;">
                    <span style="background:${statusColor}; color:white; padding:0.25rem 0.5rem; border-radius:999px; font-size:0.75rem; font-weight:600;">
                        ${statusText}
                    </span>
                </td>
                <td style="padding:0.75rem; text-align:center;">
                    <div style="display:flex; gap:0.5rem; justify-content:center;">
                        <button class="action-btn action-btn-edit" onclick="editProduct('${product.id}')" title="Editar">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="action-btn action-btn-delete" onclick="deleteProduct('${product.id}')" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filtra productos por búsqueda
 */
function filterProducts() {
    const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('#productsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

/**
 * Carga un producto para editar
 */
function loadProductForEdit(productId) {
    const products = JSON.parse(localStorage.getItem('vetuni:mockProducts') || '[]');
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showToast('Producto no encontrado', 'error');
        showProductsListView();
        return;
    }
    
    currentEditingProductId = productId;
    
    // Actualizar título del formulario
    const title = document.getElementById('productModalTitle');
    if (title) title.textContent = 'Editar Producto';
    
    // Llenar formulario
    document.getElementById('productName').value = product.nombre || product.name || '';
    document.getElementById('productCategory').value = product.categoria?.nombre || product.category || '';
    document.getElementById('productPrice').value = product.precio || product.price || '';
    document.getElementById('productStock').value = product.stock || product.stockActual || 0;
    document.getElementById('productDescription').value = product.descripcion || product.description || '';
}

/**
 * Resetea el formulario de producto
 */
function resetProductForm() {
    currentEditingProductId = null;
    const title = document.getElementById('productModalTitle');
    if (title) title.textContent = 'Nuevo Producto';
    
    const form = document.getElementById('productForm');
    if (form) form.reset();
}

/**
 * Guarda un producto (crear o editar)
 */
function saveProduct() {
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const description = document.getElementById('productDescription').value.trim();
    
    if (!name || !category || !price || stock < 0) {
        showToast('Por favor, completa todos los campos requeridos', 'error');
        return;
    }
    
    let products = JSON.parse(localStorage.getItem('vetuni:mockProducts') || '[]');
    
    if (currentEditingProductId) {
        // Editar producto existente
        const index = products.findIndex(p => p.id === currentEditingProductId);
        if (index !== -1) {
            products[index] = {
                ...products[index],
                nombre: name,
                name: name,
                categoria: { nombre: category },
                category: category,
                precio: price,
                price: price,
                stock: stock,
                stockActual: stock,
                descripcion: description || undefined,
                description: description || undefined,
                disponibleParaVenta: true
            };
            showToast('Producto actualizado exitosamente', 'success');
        }
    } else {
        // Crear nuevo producto
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newProduct = {
            id: newId,
            nombre: name,
            name: name,
            categoria: { id: newId, nombre: category },
            category: category,
            precio: price,
            price: price,
            stock: stock,
            stockActual: stock,
            descripcion: description || undefined,
            description: description || undefined,
            disponibleParaVenta: true
        };
        products.push(newProduct);
        showToast('Producto creado exitosamente', 'success');
    }
    
    localStorage.setItem('vetuni:mockProducts', JSON.stringify(products));
    // Cerrar modal y recargar lista
    closeCreateProductModal();
    loadProductsList();
}

/**
 * Edita un producto
 */
function editProduct(productId) {
    openCreateProductModal();
    // Esperar un poco para que el modal se abra antes de cargar los datos
    setTimeout(() => {
        const modal = document.getElementById('createProductModal');
        if (modal) {
            showProductModalContent(modal, productId);
        }
    }, 300);
}

/**
 * Elimina un producto
 */
function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        return;
    }
    
    let products = JSON.parse(localStorage.getItem('vetuni:mockProducts') || '[]');
    products = products.filter(p => p.id !== productId);
    localStorage.setItem('vetuni:mockProducts', JSON.stringify(products));
    
    showToast('Producto eliminado exitosamente', 'success');
    loadProductsList();
}

/**
 * Obtiene productos por defecto si no existen
 */
function getDefaultProducts() {
    return [
        {
            id: 1,
            nombre: 'Alimento Premium para Perros',
            precio: 45.99,
            stock: 25,
            categoria: { nombre: 'Alimentos' },
            tipoProducto: 'ALIMENTO',
            tipoMascota: 'Perro',
            disponibleParaVenta: true
        },
        {
            id: 2,
            nombre: 'Desparasitante Oral',
            precio: 12.99,
            stock: 42,
            categoria: { nombre: 'Medicinas' },
            tipoProducto: 'MEDICINA',
            disponibleParaVenta: true
        }
    ];
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exponer funciones globalmente para que estén disponibles desde los onclick del HTML
window.showProductsListView = showProductsListView;
window.showProductsNewView = showProductsNewView;
window.openCreateProductModal = openCreateProductModal;
window.closeCreateProductModal = closeCreateProductModal;
window.filterProducts = filterProducts;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.initProducts = initProducts;
window.showProductsSection = showProductsSection;

