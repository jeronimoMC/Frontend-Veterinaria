/**
 * ============================================
 * API SERVICE - VETERINARY CLINIC
 * ============================================
 * 
 * Servicio centralizado para todas las llamadas al backend
 * Maneja autenticación, tokens JWT y comunicación con microservicios
 * 
 * @author VetUni Development Team
 * @version 1.0.0
 */

class ApiService {
    constructor() {
        // URL base del API Gateway
        this.baseURL = 'http://localhost:8070/api';
        this.token = this.getToken();
    }

    /**
     * Obtiene el token JWT del localStorage
     * @returns {string|null} Token JWT o null si no existe
     */
    getToken() {
        try {
            const session = JSON.parse(localStorage.getItem('vetuni:session') || '{}');
            return session.token || null;
        } catch (error) {
            console.error('Error obteniendo token:', error);
            return null;
        }
    }

    /**
     * Guarda el token JWT en el localStorage
     * @param {string} token - Token JWT
     * @param {Object} user - Información del usuario
     */
    setToken(token, user = null) {
        try {
            const session = {
                token: token,
                ...(user && { user: user })
            };
            localStorage.setItem('vetuni:session', JSON.stringify(session));
            this.token = token;
        } catch (error) {
            console.error('Error guardando token:', error);
        }
    }

    /**
     * Limpia el token y la sesión
     */
    clearToken() {
        localStorage.removeItem('vetuni:session');
        this.token = null;
    }

    /**
     * Obtiene los headers para las peticiones
     * @param {Object} customHeaders - Headers adicionales
     * @returns {Object} Headers completos
     */
    getHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Realiza una petición HTTP genérica
     * @param {string} endpoint - Endpoint relativo (ej: '/auth/login')
     * @param {Object} options - Opciones de fetch
     * @returns {Promise<Object>} Respuesta de la API
     * @throws {Error} Si hay error en la petición
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.headers || {})
        };

        try {
            const response = await fetch(url, config);
            
            // Si la respuesta es 401, limpiar token y redirigir a login
            if (response.status === 401) {
                this.clearToken();
                window.location.href = '../auth/index.html';
                throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
            }

            // Si hay error, lanzar excepción
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            // Si la respuesta está vacía (204 No Content), retornar null
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`Error en petición a ${endpoint}:`, error);
            throw error;
        }
    }

    // ========== AUTENTICACIÓN ==========

    /**
     * Inicia sesión en el sistema
     * @param {string} email - Correo electrónico
     * @param {string} password - Contraseña
     * @returns {Promise<Object>} Respuesta con token y usuario
     */
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ correo: email, contrasenia: password })
        });

        // El backend retorna AuthResponseDTO con solo el token
        // Necesitamos obtener el usuario por separado
        if (response.token) {
            this.setToken(response.token);
            
            // Obtener información del usuario usando el email
            try {
                const user = await this.getUserByEmail(email);
                this.setToken(response.token, user);
                return { token: response.token, user: user };
            } catch (error) {
                console.warn('No se pudo obtener información del usuario:', error);
                return { token: response.token, user: { email: email } };
            }
        }

        return response;
    }

    /**
     * Registra un nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<Object>} Usuario registrado
     */
    async register(userData) {
        const registroData = {
            nombre: userData.firstName || userData.nombre,
            apellido: userData.lastName || userData.apellido,
            correo: userData.email || userData.correo,
            contrasenia: userData.password || userData.contrasenia,
            telefono: userData.phone || userData.telefono,
            direccion: userData.direccion || '',
            tipoUsuario: userData.tipoUsuario || 'DUEÑO',
            especialidad: userData.especialidad || null
        };

        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registroData)
        });

        return response;
    }

    /**
     * Obtiene un usuario por ID
     * @param {number} id - ID del usuario
     * @returns {Promise<Object>} Usuario
     */
    async getUserById(id) {
        return await this.request(`/auth/${id}`);
    }

    /**
     * Obtiene un usuario por email
     * @param {string} email - Email del usuario
     * @returns {Promise<Object>} Usuario
     */
    async getUserByEmail(email) {
        return await this.request(`/auth/email?correo=${encodeURIComponent(email)}`);
    }

    /**
     * Actualiza un usuario
     * @param {number} id - ID del usuario
     * @param {Object} userData - Datos a actualizar
     * @returns {Promise<Object>} Usuario actualizado
     */
    async updateUser(id, userData) {
        return await this.request(`/auth/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    /**
     * Desactiva un usuario
     * @param {number} id - ID del usuario
     * @returns {Promise<void>}
     */
    async deactivateUser(id) {
        return await this.request(`/auth/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Obtiene todos los usuarios activos
     * @returns {Promise<Array>} Lista de usuarios
     */
    async getActiveUsers() {
        return await this.request('/auth/active/users');
    }

    /**
     * Cierra sesión
     */
    logout() {
        this.clearToken();
    }

    /**
     * Obtiene el usuario actual de la sesión
     * @returns {Object|null} Usuario actual o null
     */
    getCurrentUser() {
        try {
            const session = JSON.parse(localStorage.getItem('vetuni:session') || '{}');
            return session.user || null;
        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
            return null;
        }
    }

    // ========== MASCOTAS ==========

    /**
     * Crea una nueva mascota
     * @param {Object} mascotaData - Datos de la mascota
     * @returns {Promise<Object>} Mascota creada
     */
    async createMascota(mascotaData) {
        const requestData = {
            nombre: mascotaData.name || mascotaData.nombre,
            especie: mascotaData.species || mascotaData.especie,
            raza: mascotaData.breed || mascotaData.raza || 'No especificada',
            fechaNacimiento: mascotaData.birthdate || mascotaData.fechaNacimiento,
            sexo: mascotaData.sex || mascotaData.sexo,
            color: mascotaData.color || 'No especificado',
            peso: mascotaData.weight || mascotaData.peso,
            duenioId: mascotaData.duenioId || mascotaData.ownerId
        };

        return await this.request('/mascotas', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    }

    /**
     * Obtiene una mascota por ID
     * @param {number} id - ID de la mascota
     * @returns {Promise<Object>} Mascota
     */
    async getMascotaById(id) {
        return await this.request(`/mascotas/${id}`);
    }

    /**
     * Obtiene todas las mascotas
     * @param {boolean} active - Solo activas
     * @returns {Promise<Array>} Lista de mascotas
     */
    async getAllMascotas(active = null) {
        const query = active !== null ? `?active=${active}` : '';
        return await this.request(`/mascotas${query}`);
    }

    /**
     * Obtiene mascotas por dueño
     * @param {number} ownerId - ID del dueño
     * @returns {Promise<Array>} Lista de mascotas
     */
    async getMascotasByOwner(ownerId) {
        return await this.request(`/mascotas/owner/${ownerId}`);
    }

    /**
     * Busca mascotas por nombre
     * @param {string} name - Nombre a buscar
     * @returns {Promise<Array>} Lista de mascotas
     */
    async searchMascotasByName(name) {
        return await this.request(`/mascotas/search?name=${encodeURIComponent(name)}`);
    }

    /**
     * Actualiza una mascota
     * @param {number} id - ID de la mascota
     * @param {Object} mascotaData - Datos a actualizar
     * @returns {Promise<Object>} Mascota actualizada
     */
    async updateMascota(id, mascotaData) {
        const requestData = {
            nombre: mascotaData.name || mascotaData.nombre,
            especie: mascotaData.species || mascotaData.especie,
            raza: mascotaData.breed || mascotaData.raza,
            fechaNacimiento: mascotaData.birthdate || mascotaData.fechaNacimiento,
            sexo: mascotaData.sex || mascotaData.sexo,
            color: mascotaData.color,
            peso: mascotaData.weight || mascotaData.peso,
            duenioId: mascotaData.duenioId || mascotaData.ownerId
        };

        return await this.request(`/mascotas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });
    }

    /**
     * Desactiva una mascota
     * @param {number} id - ID de la mascota
     * @returns {Promise<void>}
     */
    async deactivateMascota(id) {
        return await this.request(`/mascotas/${id}/deactivate`, {
            method: 'PATCH'
        });
    }

    /**
     * Elimina una mascota
     * @param {number} id - ID de la mascota
     * @returns {Promise<void>}
     */
    async deleteMascota(id) {
        return await this.request(`/mascotas/${id}`, {
            method: 'DELETE'
        });
    }

    // ========== CITAS ==========

    /**
     * Crea una nueva cita
     * @param {Object} citaData - Datos de la cita
     * @returns {Promise<Object>} Cita creada
     */
    async createCita(citaData) {
        const requestData = {
            petId: citaData.petId,
            veterinarianId: citaData.veterinarianId || null,
            servicioId: citaData.servicioId || citaData.serviceId || null,
            idsDisponibilidad: citaData.idsDisponibilidad || citaData.disponibilidadIds || [],
            motivoConsulta: citaData.motivoConsulta || citaData.notes || citaData.notes || 'Sin notas',
            estadoGeneralMascota: citaData.estadoGeneralMascota || 'Normal'
        };

        return await this.request('/citas', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    }

    /**
     * Obtiene una cita por ID
     * @param {number} id - ID de la cita
     * @returns {Promise<Object>} Cita
     */
    async getCitaById(id) {
        return await this.request(`/citas/${id}`);
    }

    /**
     * Obtiene citas del día
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @returns {Promise<Array>} Lista de citas
     */
    async getCitasDelDia(fecha) {
        return await this.request(`/citas/del-dia?fecha=${fecha}`);
    }

    /**
     * Actualiza una cita
     * @param {number} id - ID de la cita
     * @param {Object} citaData - Datos a actualizar
     * @returns {Promise<Object>} Cita actualizada
     */
    async updateCita(id, citaData) {
        return await this.request(`/citas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(citaData)
        });
    }

    /**
     * Elimina una cita
     * @param {number} id - ID de la cita
     * @returns {Promise<void>}
     */
    async deleteCita(id) {
        return await this.request(`/citas/${id}`, {
            method: 'DELETE'
        });
    }

    // ========== INVENTARIO - PRODUCTOS ==========

    /**
     * Obtiene todos los productos activos
     * @returns {Promise<Array>} Lista de productos
     */
    async getAllProductos() {
        return await this.request('/inventario/productos');
    }

    /**
     * Obtiene un producto por ID
     * @param {number} id - ID del producto
     * @returns {Promise<Object>} Producto
     */
    async getProductoById(id) {
        return await this.request(`/inventario/productos/${id}`);
    }

    /**
     * Crea un alimento
     * @param {Object} productoData - Datos del alimento
     * @returns {Promise<Object>} Producto creado
     */
    async createAlimento(productoData) {
        return await this.request('/inventario/productos/alimento', {
            method: 'POST',
            body: JSON.stringify(productoData)
        });
    }

    /**
     * Crea una medicina
     * @param {Object} productoData - Datos de la medicina
     * @returns {Promise<Object>} Producto creado
     */
    async createMedicina(productoData) {
        return await this.request('/inventario/productos/medicina', {
            method: 'POST',
            body: JSON.stringify(productoData)
        });
    }

    /**
     * Crea un accesorio
     * @param {Object} productoData - Datos del accesorio
     * @returns {Promise<Object>} Producto creado
     */
    async createAccesorio(productoData) {
        return await this.request('/inventario/productos/accesorio', {
            method: 'POST',
            body: JSON.stringify(productoData)
        });
    }

    /**
     * Actualiza un producto
     * @param {number} id - ID del producto
     * @param {Object} productoData - Datos a actualizar
     * @returns {Promise<Object>} Producto actualizado
     */
    async updateProducto(id, productoData) {
        return await this.request(`/inventario/productos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productoData)
        });
    }

    /**
     * Elimina un producto
     * @param {number} id - ID del producto
     * @returns {Promise<void>}
     */
    async deleteProducto(id) {
        return await this.request(`/inventario/productos/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Descuenta stock de productos
     * @param {Array} items - Array de {productoId, cantidad}
     * @returns {Promise<void>}
     */
    async descontarStock(items) {
        return await this.request('/inventario/productos/stock/descontar', {
            method: 'POST',
            body: JSON.stringify(items)
        });
    }

    // ========== INVENTARIO - CATEGORÍAS ==========

    /**
     * Obtiene todas las categorías
     * @returns {Promise<Array>} Lista de categorías
     */
    async getAllCategorias() {
        return await this.request('/inventario/categorias');
    }

    /**
     * Obtiene una categoría por ID
     * @param {number} id - ID de la categoría
     * @returns {Promise<Object>} Categoría
     */
    async getCategoriaById(id) {
        return await this.request(`/inventario/categorias/${id}`);
    }

    /**
     * Crea una categoría
     * @param {Object} categoriaData - Datos de la categoría
     * @returns {Promise<Object>} Categoría creada
     */
    async createCategoria(categoriaData) {
        return await this.request('/inventario/categorias', {
            method: 'POST',
            body: JSON.stringify(categoriaData)
        });
    }

    /**
     * Actualiza una categoría
     * @param {number} id - ID de la categoría
     * @param {Object} categoriaData - Datos a actualizar
     * @returns {Promise<Object>} Categoría actualizada
     */
    async updateCategoria(id, categoriaData) {
        return await this.request(`/inventario/categorias/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoriaData)
        });
    }

    /**
     * Elimina una categoría
     * @param {number} id - ID de la categoría
     * @returns {Promise<void>}
     */
    async deleteCategoria(id) {
        return await this.request(`/inventario/categorias/${id}`, {
            method: 'DELETE'
        });
    }

    // ========== CARRITO ==========

    /**
     * Obtiene o crea el carrito del usuario
     * @param {number|null} usuarioId - ID del usuario (null para guest)
     * @param {string|null} sessionId - ID de sesión para guest
     * @returns {Promise<Object>} Carrito
     */
    async getCarrito(usuarioId = null, sessionId = null) {
        const headers = {};
        if (usuarioId) {
            headers['X-Usuario-Id'] = usuarioId.toString();
        }
        if (sessionId) {
            headers['X-Session-Id'] = sessionId;
        }

        return await this.request('/carrito', {
            method: 'GET',
            headers: this.getHeaders(headers)
        });
    }

    /**
     * Agrega un item al carrito
     * @param {Object} itemData - Datos del item
     * @param {number|null} usuarioId - ID del usuario
     * @param {string|null} sessionId - ID de sesión
     * @returns {Promise<Object>} Carrito actualizado
     */
    async addItemToCarrito(itemData, usuarioId = null, sessionId = null) {
        const headers = {};
        if (usuarioId) {
            headers['X-Usuario-Id'] = usuarioId.toString();
        }
        if (sessionId) {
            headers['X-Session-Id'] = sessionId;
        }

        return await this.request('/carrito/items', {
            method: 'POST',
            body: JSON.stringify(itemData),
            headers: this.getHeaders(headers)
        });
    }

    /**
     * Elimina un item del carrito
     * @param {number} productoId - ID del producto
     * @param {number|null} usuarioId - ID del usuario
     * @param {string|null} sessionId - ID de sesión
     * @returns {Promise<Object>} Carrito actualizado
     */
    async removeItemFromCarrito(productoId, usuarioId = null, sessionId = null) {
        const headers = {};
        if (usuarioId) {
            headers['X-Usuario-Id'] = usuarioId.toString();
        }
        if (sessionId) {
            headers['X-Session-Id'] = sessionId;
        }

        return await this.request(`/carrito/items/${productoId}`, {
            method: 'DELETE',
            headers: this.getHeaders(headers)
        });
    }

    /**
     * Vacía el carrito
     * @param {number|null} usuarioId - ID del usuario
     * @param {string|null} sessionId - ID de sesión
     * @returns {Promise<void>}
     */
    async clearCarrito(usuarioId = null, sessionId = null) {
        const headers = {};
        if (usuarioId) {
            headers['X-Usuario-Id'] = usuarioId.toString();
        }
        if (sessionId) {
            headers['X-Session-Id'] = sessionId;
        }

        return await this.request('/carrito', {
            method: 'DELETE',
            headers: this.getHeaders(headers)
        });
    }

    // ========== PEDIDOS ==========

    /**
     * Inicia el proceso de checkout
     * @param {Object} checkoutData - Datos del checkout (opcional para guest)
     * @param {number|null} usuarioId - ID del usuario
     * @param {string|null} sessionId - ID de sesión
     * @returns {Promise<Object>} Respuesta del checkout
     */
    async iniciarCheckout(checkoutData = null, usuarioId = null, sessionId = null) {
        const headers = {};
        if (usuarioId) {
            headers['X-Usuario-Id'] = usuarioId.toString();
        }
        if (sessionId) {
            headers['X-Session-Id'] = sessionId;
        }

        return await this.request('/pedidos/checkout', {
            method: 'POST',
            body: checkoutData ? JSON.stringify(checkoutData) : null,
            headers: this.getHeaders(headers)
        });
    }

    // ========== FACTURAS ==========

    /**
     * Obtiene todas las facturas
     * @returns {Promise<Array>} Lista de facturas
     */
    async getAllFacturas() {
        return await this.request('/facturas');
    }

    /**
     * Obtiene una factura por ID
     * @param {number} id - ID de la factura
     * @returns {Promise<Object>} Factura
     */
    async getFacturaById(id) {
        return await this.request(`/facturas/${id}`);
    }

    /**
     * Obtiene facturas por usuario
     * @param {number} usuarioId - ID del usuario
     * @returns {Promise<Array>} Lista de facturas
     */
    async getFacturasByUsuario(usuarioId) {
        return await this.request(`/facturas/usuario/${usuarioId}`);
    }

    // ========== HISTORIAL CLÍNICO ==========

    /**
     * Obtiene historial clínico por mascota
     * @param {number} petId - ID de la mascota
     * @returns {Promise<Array>} Lista de historiales
     */
    async getHistorialByMascota(petId) {
        return await this.request(`/historial-clinico/mascota/${petId}`);
    }

    /**
     * Obtiene un historial clínico por ID
     * @param {number} historialId - ID del historial
     * @returns {Promise<Object>} Historial clínico
     */
    async getHistorialById(historialId) {
        return await this.request(`/historial-clinico/${historialId}`);
    }

    /**
     * Crea un historial clínico
     * @param {Object} historialData - Datos del historial
     * @returns {Promise<Object>} Historial creado
     */
    async createHistorial(historialData) {
        return await this.request('/historial-clinico', {
            method: 'POST',
            body: JSON.stringify(historialData)
        });
    }

    /**
     * Actualiza un historial clínico
     * @param {number} historialId - ID del historial
     * @param {Object} historialData - Datos a actualizar
     * @returns {Promise<Object>} Historial actualizado
     */
    async updateHistorial(historialId, historialData) {
        return await this.request(`/historial-clinico/${historialId}`, {
            method: 'PUT',
            body: JSON.stringify(historialData)
        });
    }

    /**
     * Elimina un historial clínico
     * @param {number} historialId - ID del historial
     * @returns {Promise<void>}
     */
    async deleteHistorial(historialId) {
        return await this.request(`/historial-clinico/${historialId}`, {
            method: 'DELETE'
        });
    }

    // ========== AGENDAMIENTO ==========

    /**
     * Obtiene disponibilidad de un veterinario
     * @param {number} veterinarioId - ID del veterinario
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @returns {Promise<Array>} Lista de disponibilidades
     */
    async getDisponibilidad(veterinarioId, fecha) {
        return await this.request(`/agendamiento/disponibilidad/vet/${veterinarioId}?fecha=${fecha}`);
    }

    /**
     * Reserva slots de disponibilidad
     * @param {Object} reservaData - Datos de la reserva
     * @returns {Promise<Array>} Slots reservados
     */
    async reservarSlots(reservaData) {
        return await this.request('/agendamiento/disponibilidad/reservar', {
            method: 'POST',
            body: JSON.stringify(reservaData)
        });
    }

    /**
     * Libera slots por cita
     * @param {number} citaId - ID de la cita
     * @returns {Promise<void>}
     */
    async liberarSlots(citaId) {
        return await this.request(`/agendamiento/disponibilidad/liberar/${citaId}`, {
            method: 'POST'
        });
    }

    /**
     * Obtiene veterinarios por servicio
     * @param {number} servicioId - ID del servicio
     * @returns {Promise<Array>} Lista de IDs de veterinarios
     */
    async getVeterinariosByServicio(servicioId) {
        return await this.request(`/agendamiento/disponibilidad/servicio/${servicioId}/veterinarios`);
    }

    /**
     * Obtiene servicios de agendamiento
     * @returns {Promise<Array>} Lista de servicios
     */
    async getServiciosAgendamiento() {
        return await this.request('/agendamiento/servicios-admin');
    }

    /**
     * Crea o actualiza una jornada laboral
     * @param {Object} jornadaData - Datos de la jornada
     * @returns {Promise<Object>} Jornada creada/actualizada
     */
    async crearActualizarJornada(jornadaData) {
        return await this.request('/agendamiento/disponibilidad/jornada', {
            method: 'POST',
            body: JSON.stringify(jornadaData)
        });
    }

    /**
     * Genera slots de disponibilidad
     * @param {number} veterinarioId - ID del veterinario
     * @param {string} fechaInicio - Fecha inicio YYYY-MM-DD
     * @param {string} fechaFin - Fecha fin YYYY-MM-DD
     * @param {number} duracionSlot - Duración en minutos
     * @returns {Promise<void>}
     */
    async generarSlots(veterinarioId, fechaInicio, fechaFin, duracionSlot = 30) {
        return await this.request(`/agendamiento/disponibilidad/generar-slots?veterinarioId=${veterinarioId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&duracionSlot=${duracionSlot}`, {
            method: 'POST'
        });
    }
}

// Crear instancia global del servicio
const apiService = new ApiService();

// Hacer disponible globalmente
window.apiService = apiService;

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}

