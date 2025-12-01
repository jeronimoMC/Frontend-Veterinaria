/**
 * ============================================
 * ADMIN APPOINTMENTS - MÓDULO COMPLETO DE CITAS Y CALENDARIO
 * ============================================
 * 
 * @fileoverview Módulo completo de gestión de citas para el administrador
 * @author VetUni Development Team
 * @version 2.0.0
 * 
 * Funcionalidades principales:
 * - Ver TODAS las citas de TODOS los veterinarios
 * - Filtrar por veterinario, servicio, cliente, mascota, fecha, estado
 * - Crear, editar y cancelar citas
 * - Vista diaria / semanal / mensual
 * - Reprogramación rápida
 * - Estadísticas de citas
 * - Gestión completa del calendario
 * 
 * @requires localStorage - Almacenamiento de citas
 * @requires mockAuthService - Servicio de autenticación
 * 
 * Buenas prácticas aplicadas:
 * - Código modular y documentado
 * - Validación de datos
 * - Manejo de errores
 * - Separación de responsabilidades
 * - Funciones reutilizables
 * - Comentarios descriptivos
 * - JSDoc en funciones principales
 */

// ========== VARIABLES GLOBALES ==========

/** @type {string} Vista actual del calendario ('list', 'daily', 'weekly', 'monthly') */
let currentAppointmentView = 'weekly';

/** @type {Date} Fecha actual para navegación de calendarios */
let currentCalendarDate = new Date();

/** @type {string|null} ID de la cita en edición */
let currentEditingAppointmentId = null;

/** @type {Array} Lista completa de citas (sin filtrar) */
let allAppointments = [];

/** @type {Array} Lista filtrada de citas */
let filteredAppointments = [];

// ========== INICIALIZACIÓN ==========

/**
 * Inicializa el módulo cuando se carga la sección
 * @returns {void}
 */
(function() {
    setTimeout(() => {
        if (document.getElementById('appointmentsMainView')) {
            initAppointments();
        }
    }, 150);
})();

/**
 * Inicializa el módulo de citas
 * Carga datos, configura filtros y muestra la vista inicial
 * @returns {void}
 */
function initAppointments() {
    loadAllAppointments();
    loadFiltersData();
    loadAppointmentStatistics();
    changeAppointmentView();
    setupDateInputs();
}

/**
 * Configura los inputs de fecha con valores mínimos
 * @returns {void}
 */
function setupDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('appointmentDateAdmin');
    if (dateInput) {
        dateInput.setAttribute('min', today);
    }
    const rescheduleDateInput = document.getElementById('rescheduleDateAdmin');
    if (rescheduleDateInput) {
        rescheduleDateInput.setAttribute('min', today);
    }
}

// ========== CARGA DE DATOS ==========

/**
 * Carga todas las citas del almacenamiento
 * @returns {void}
 */
function loadAllAppointments() {
    try {
        allAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        filteredAppointments = [...allAppointments];
    } catch (error) {
        console.error('Error al cargar citas:', error);
        allAppointments = [];
        filteredAppointments = [];
        showToast('Error al cargar las citas', 'error');
    }
}

/**
 * Carga los datos necesarios para los filtros
 * @returns {void}
 */
function loadFiltersData() {
    loadVeterinariansForFilter();
    loadServicesForFilter();
}

/**
 * Carga los veterinarios en el filtro
 * @returns {void}
 */
function loadVeterinariansForFilter() {
    try {
        const veterinarians = JSON.parse(localStorage.getItem('vetuni:mockVeterinarians') || '[]');
        const filterSelect = document.getElementById('filterVeterinarian');
        const createSelect = document.getElementById('appointmentVeterinarianAdmin');
        
        const optionsHTML = veterinarians
            .filter(v => v.active !== false)
            .map(v => {
                const name = `${v.firstName || ''} ${v.lastName || ''}`.trim() || v.email;
                return `<option value="${v.id}">${escapeHtml(name)}</option>`;
            })
            .join('');
        
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Todos los veterinarios</option>' + optionsHTML;
        }
        if (createSelect) {
            createSelect.innerHTML = '<option value="">Asignar veterinario (opcional)</option>' + optionsHTML;
        }
    } catch (error) {
        console.error('Error al cargar veterinarios:', error);
    }
}

/**
 * Carga los servicios en el filtro
 * @returns {void}
 */
function loadServicesForFilter() {
    try {
        const services = JSON.parse(localStorage.getItem('vetuni:mockServices') || '[]');
        const filterSelect = document.getElementById('filterService');
        const createSelect = document.getElementById('appointmentServiceAdmin');
        
        const optionsHTML = services
            .filter(s => s.active !== false)
            .map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
            .join('');
        
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Todos los servicios</option>' + optionsHTML;
        }
        if (createSelect) {
            createSelect.innerHTML = '<option value="">Seleccione un servicio</option>' + optionsHTML;
        }
    } catch (error) {
        console.error('Error al cargar servicios:', error);
    }
}

/**
 * Carga los clientes en el select de crear cita
 * @returns {void}
 */
function loadClientsForAppointmentAdmin() {
    try {
        const users = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        const select = document.getElementById('appointmentClientAdmin');
        
        if (!select) return;
        
        const clients = users.filter(u => u.role === 'CLIENT' || !u.role);
        const optionsHTML = clients.map(u => {
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
            return `<option value="${u.id}">${escapeHtml(name)}</option>`;
        }).join('');
        
        select.innerHTML = '<option value="">Seleccione un cliente</option>' + optionsHTML;
    } catch (error) {
        console.error('Error al cargar clientes:', error);
    }
}

/**
 * Carga las mascotas de un cliente seleccionado
 * @returns {void}
 */
function loadPetsForAppointmentAdmin() {
    const clientId = document.getElementById('appointmentClientAdmin')?.value;
    const select = document.getElementById('appointmentPetAdmin');
    
    if (!select || !clientId) {
        if (select) {
            select.innerHTML = '<option value="">Primero seleccione un cliente</option>';
        }
        return;
    }
    
    try {
        const pets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        const users = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        const client = users.find(u => u.id === clientId);
        
        if (!client || !client.pets || client.pets.length === 0) {
            select.innerHTML = '<option value="">Este cliente no tiene mascotas registradas</option>';
            return;
        }
        
        const clientPets = pets.filter(p => client.pets.includes(p.id));
        const optionsHTML = clientPets.map(p => 
            `<option value="${p.id}">${escapeHtml(p.name)} - ${escapeHtml(p.species || 'N/A')}</option>`
        ).join('');
        
        select.innerHTML = '<option value="">Seleccione una mascota</option>' + optionsHTML;
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        select.innerHTML = '<option value="">Error al cargar mascotas</option>';
    }
}

// ========== VISTAS DEL CALENDARIO ==========

/**
 * Cambia la vista del calendario
 * @returns {void}
 */
function changeAppointmentView() {
    const viewMode = document.getElementById('appointmentViewMode')?.value || 'weekly';
    currentAppointmentView = viewMode;
    
    // Si no hay un selector, establecer weekly por defecto
    if (!document.getElementById('appointmentViewMode')) {
        currentAppointmentView = 'weekly';
    }
    
    // Ocultar todas las vistas
    document.getElementById('appointmentsListView').style.display = 'none';
    document.getElementById('appointmentsWeeklyView').style.display = 'none';
    document.getElementById('appointmentsDailyView').style.display = 'none';
    document.getElementById('appointmentsMonthlyView').style.display = 'none';
    
    // Mostrar la vista seleccionada
    switch(viewMode) {
        case 'list':
            document.getElementById('appointmentsListView').style.display = 'block';
            loadAppointmentsList();
            break;
        case 'daily':
            document.getElementById('appointmentsDailyView').style.display = 'block';
            loadDailyView();
            break;
        case 'weekly':
            document.getElementById('appointmentsWeeklyView').style.display = 'block';
            loadWeeklyView();
            break;
        case 'monthly':
            document.getElementById('appointmentsMonthlyView').style.display = 'block';
            loadMonthlyView();
            break;
    }
}

/**
 * Carga la vista de lista de citas
 * @returns {void}
 */
function loadAppointmentsList() {
    const tbody = document.getElementById('appointmentsTableBody');
    if (!tbody) return;
    
    if (filteredAppointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:3rem; color:var(--gray-500);">
                    <i class="fa-solid fa-calendar-xmark" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                    <div style="font-size:1.1rem; font-weight:600; margin-bottom:0.5rem;">No hay citas registradas</div>
                    <div style="font-size:0.9rem;">Haz clic en "Nueva Cita" para crear una</div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar por fecha y hora (más recientes primero)
    const sorted = [...filteredAppointments].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB - dateA;
    });
    
    tbody.innerHTML = sorted.map(apt => renderAppointmentRow(apt)).join('');
}

/**
 * Renderiza una fila de cita en la tabla
 * @param {Object} appointment - Objeto de cita
 * @returns {string} HTML de la fila
 */
function renderAppointmentRow(appointment) {
    const pets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const users = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const veterinarians = JSON.parse(localStorage.getItem('vetuni:mockVeterinarians') || '[]');
    const services = JSON.parse(localStorage.getItem('vetuni:mockServices') || '[]');
    
    const pet = pets.find(p => p.id === appointment.petId);
    const petName = pet ? pet.name : appointment.petName || 'N/A';
    
    const client = users.find(u => u.id === appointment.userId || u.pets?.includes(appointment.petId));
    const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : 'Cliente';
    
    const vet = appointment.veterinarianId 
        ? veterinarians.find(v => v.id === appointment.veterinarianId)
        : null;
    const vetName = vet ? `${vet.firstName || ''} ${vet.lastName || ''}`.trim() : 'Sin asignar';
    
    const service = services.find(s => s.id === appointment.service || s.name === appointment.service);
    const serviceName = service ? service.name : appointment.service || 'N/A';
    
    const statusInfo = getStatusInfo(appointment.status);
    const formattedDate = formatDate(appointment.date);
    const formattedTime = appointment.time ? appointment.time.substring(0, 5) : 'N/A';
    
    return `
        <tr style="border-bottom:1px solid var(--gray-200); transition:background 0.2s ease;" 
            onmouseover="this.style.background='var(--gray-50)'" 
            onmouseout="this.style.background='var(--white)'">
            <td style="padding:0.75rem; color:var(--gray-700); font-weight:500;">${formattedDate}</td>
            <td style="padding:0.75rem; color:var(--gray-700);">${formattedTime}</td>
            <td style="padding:0.75rem; color:var(--gray-900); font-weight:500;">${escapeHtml(clientName)}</td>
            <td style="padding:0.75rem; color:var(--gray-700);">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <i class="fa-solid fa-paw" style="color:var(--primary-color);"></i>
                    ${escapeHtml(petName)}
                </div>
            </td>
            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(serviceName)}</td>
            <td style="padding:0.75rem; color:var(--gray-700);">${escapeHtml(vetName)}</td>
            <td style="padding:0.75rem; text-align:center;">
                <span style="background:${statusInfo.color}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">
                    <i class="fa-solid ${statusInfo.icon}"></i> ${statusInfo.text}
                </span>
            </td>
            <td style="padding:0.75rem; text-align:center;">
                <div style="display:flex; gap:0.5rem; justify-content:center;">
                    <button class="action-btn action-btn-view" onclick="viewAppointmentDetailAdmin('${appointment.id}')" title="Ver detalles">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn action-btn-edit" onclick="editAppointmentAdmin('${appointment.id}')" title="Editar">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    ${appointment.status !== 'CANCELADA' && appointment.status !== 'COMPLETADA' ? `
                        <button class="action-btn" style="background:linear-gradient(135deg, #2196F3, #42A5F5);" onclick="openRescheduleAppointmentAdmin('${appointment.id}')" title="Reprogramar">
                            <i class="fa-solid fa-calendar-week"></i>
                        </button>
                        <button class="action-btn action-btn-delete" onclick="openCancelAppointmentAdmin('${appointment.id}')" title="Cancelar">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
}

/**
 * Obtiene información del estado de una cita
 * @param {string} status - Estado de la cita
 * @returns {Object} Objeto con color, icono y texto del estado
 */
function getStatusInfo(status) {
    const statusMap = {
        'PENDIENTE': { color: '#FF9800', icon: 'fa-clock', text: 'Pendiente' },
        'CONFIRMADA': { color: '#2196F3', icon: 'fa-check-circle', text: 'Confirmada' },
        'COMPLETADA': { color: '#4CAF50', icon: 'fa-check-double', text: 'Completada' },
        'CANCELADA': { color: '#F44336', icon: 'fa-times-circle', text: 'Cancelada' }
    };
    return statusMap[status] || { color: '#757575', icon: 'fa-question', text: status };
}

// ========== VISTA SEMANAL ==========

/**
 * Carga la vista semanal del calendario
 * @returns {void}
 */
function loadWeeklyView() {
    const container = document.getElementById('weeklyCalendarContainer');
    const title = document.getElementById('weeklyViewTitle');
    
    if (!container) return;
    
    // Calcular inicio de semana (lunes)
    const startOfWeek = new Date(currentCalendarDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para lunes
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Actualizar título
    if (title) {
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        title.textContent = `Semana del ${formatDate(startOfWeek.toISOString().split('T')[0])} al ${formatDate(endOfWeek.toISOString().split('T')[0])}`;
    }
    
    // Generar días de la semana
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        days.push(day);
    }
    
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    container.innerHTML = days.map((day, index) => {
        const dayStr = day.toISOString().split('T')[0];
        const isToday = dayStr === new Date().toISOString().split('T')[0];
        const dayAppointments = filteredAppointments
            .filter(apt => apt.date === dayStr)
            .sort((a, b) => a.time.localeCompare(b.time));
        
        return `
            <div class="week-day-column" style="${isToday ? 'border-color:var(--primary-color); background:var(--gray-50);' : ''}">
                <div class="week-day-header" style="${isToday ? 'color:var(--primary-color); font-weight:700;' : ''}">
                    <div style="font-size:0.85rem; color:var(--gray-600);">${dayNames[index]}</div>
                    <div style="font-size:1.1rem;">${day.getDate()}</div>
                </div>
                <div class="week-day-appointments">
                    ${dayAppointments.length === 0 ? `
                        <div style="text-align:center; color:var(--gray-400); padding:1rem; font-size:0.85rem;">
                            Sin citas
                        </div>
                    ` : dayAppointments.map(apt => renderWeeklyAppointment(apt)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renderiza una cita en la vista semanal
 * @param {Object} appointment - Objeto de cita
 * @returns {string} HTML de la cita
 */
function renderWeeklyAppointment(appointment) {
    const pets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const pet = pets.find(p => p.id === appointment.petId);
    const petName = pet ? pet.name : appointment.petName || 'Mascota';
    
    const statusInfo = getStatusInfo(appointment.status);
    const time = appointment.time ? appointment.time.substring(0, 5) : '';
    
    return `
        <div class="week-appointment-item" 
             style="border-left-color:${statusInfo.color};"
             onclick="viewAppointmentDetailAdmin('${appointment.id}')"
             title="${escapeHtml(petName)} - ${escapeHtml(appointment.service || '')}">
            <div style="font-size:0.75rem; font-weight:600; color:var(--gray-900); margin-bottom:0.25rem;">
                <i class="fa-solid fa-clock" style="color:var(--gray-600);"></i> ${time}
            </div>
            <div style="font-size:0.85rem; font-weight:600; color:var(--gray-900); margin-bottom:0.25rem;">
                ${escapeHtml(petName)}
            </div>
            <div style="font-size:0.75rem; color:var(--gray-600);">
                ${escapeHtml(appointment.service || 'Servicio')}
            </div>
        </div>
    `;
}

/**
 * Navega a la semana anterior
 * @returns {void}
 */
function previousWeek() {
    currentCalendarDate.setDate(currentCalendarDate.getDate() - 7);
    loadWeeklyView();
}

/**
 * Navega a la semana siguiente
 * @returns {void}
 */
function nextWeek() {
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 7);
    loadWeeklyView();
}

/**
 * Va al día de hoy en la vista semanal
 * @returns {void}
 */
function goToTodayWeek() {
    currentCalendarDate = new Date();
    loadWeeklyView();
}

// ========== VISTA DIARIA ==========

/**
 * Carga la vista diaria del calendario
 * @returns {void}
 */
function loadDailyView() {
    const container = document.getElementById('dailyCalendarContainer');
    const title = document.getElementById('dailyViewTitle');
    
    if (!container) return;
    
    const dayStr = currentCalendarDate.toISOString().split('T')[0];
    const isToday = dayStr === new Date().toISOString().split('T')[0];
    
    if (title) {
        title.textContent = isToday ? 'Hoy' : formatDate(dayStr);
    }
    
    // Obtener citas del día y ordenar por hora
    const dayAppointments = filteredAppointments
        .filter(apt => apt.date === dayStr)
        .sort((a, b) => a.time.localeCompare(b.time));
    
    // Generar slots horarios (8:00 AM - 7:00 PM)
    const timeSlots = [];
    for (let hour = 8; hour < 20; hour++) {
        timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    container.innerHTML = timeSlots.map(time => {
        const slotAppointments = dayAppointments.filter(apt => apt.time && apt.time.startsWith(time.substring(0, 2)));
        
        return `
            <div class="daily-time-slot">
                <div class="daily-time-label">${time}</div>
                <div class="daily-appointments-list">
                    ${slotAppointments.length === 0 ? `
                        <div style="color:var(--gray-400); font-size:0.85rem; padding:0.5rem;">
                            Sin citas
                        </div>
                    ` : slotAppointments.map(apt => renderDailyAppointment(apt)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renderiza una cita en la vista diaria
 * @param {Object} appointment - Objeto de cita
 * @returns {string} HTML de la cita
 */
function renderDailyAppointment(appointment) {
    const pets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const users = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const pet = pets.find(p => p.id === appointment.petId);
    const petName = pet ? pet.name : appointment.petName || 'Mascota';
    const client = users.find(u => u.id === appointment.userId || u.pets?.includes(appointment.petId));
    const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : 'Cliente';
    const statusInfo = getStatusInfo(appointment.status);
    const time = appointment.time ? appointment.time.substring(0, 5) : '';
    
    return `
        <div class="week-appointment-item" 
             style="border-left-color:${statusInfo.color}; cursor:pointer;"
             onclick="viewAppointmentDetailAdmin('${appointment.id}')">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;">
                <div>
                    <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(petName)}</div>
                    <div style="font-size:0.85rem; color:var(--gray-600);">${escapeHtml(clientName)}</div>
                </div>
                <span style="background:${statusInfo.color}; color:white; padding:0.25rem 0.5rem; border-radius:999px; font-size:0.7rem; font-weight:600;">
                    ${statusInfo.text}
                </span>
            </div>
            <div style="font-size:0.85rem; color:var(--gray-700);">
                <i class="fa-solid fa-stethoscope" style="color:var(--primary-color);"></i>
                ${escapeHtml(appointment.service || 'Servicio')}
            </div>
        </div>
    `;
}

/**
 * Navega al día anterior
 * @returns {void}
 */
function previousDay() {
    currentCalendarDate.setDate(currentCalendarDate.getDate() - 1);
    loadDailyView();
}

/**
 * Navega al día siguiente
 * @returns {void}
 */
function nextDay() {
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    loadDailyView();
}

/**
 * Va al día de hoy en la vista diaria
 * @returns {void}
 */
function goToTodayDay() {
    currentCalendarDate = new Date();
    loadDailyView();
}

// ========== VISTA MENSUAL ==========

/**
 * Carga la vista mensual del calendario
 * @returns {void}
 */
function loadMonthlyView() {
    const container = document.getElementById('monthlyCalendarContainer');
    const title = document.getElementById('monthlyViewTitle');
    
    if (!container) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    if (title) {
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        title.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Días del mes
    const daysInMonth = lastDay.getDate();
    
    // Día de la semana del primer día (0 = domingo, ajustar para lunes = 0)
    let startingDay = firstDay.getDay();
    startingDay = startingDay === 0 ? 6 : startingDay - 1;
    
    // Generar calendario
    const calendarHTML = [];
    
    // Encabezados de días
    const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    calendarHTML.push(`
        <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:0.5rem; margin-bottom:0.5rem;">
            ${dayHeaders.map(day => `
                <div style="text-align:center; font-weight:600; color:var(--gray-700); padding:0.5rem;">
                    ${day}
                </div>
            `).join('')}
        </div>
    `);
    
    // Espacios en blanco antes del primer día
    calendarHTML.push(`
        <div class="month-calendar-grid">
    `);
    
    for (let i = 0; i < startingDay; i++) {
        calendarHTML.push('<div class="month-day-cell" style="background:var(--gray-50);"></div>');
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dayStr === new Date().toISOString().split('T')[0];
        const dayAppointments = filteredAppointments.filter(apt => apt.date === dayStr);
        
        calendarHTML.push(`
            <div class="month-day-cell" style="${isToday ? 'border-color:var(--primary-color); border-width:2px; background:var(--gray-50);' : ''}" onclick="viewAppointmentsByDate('${dayStr}')">
                <div class="month-day-number" style="${isToday ? 'color:var(--primary-color);' : ''}">${day}</div>
                <div style="display:flex; flex-direction:column; gap:0.25rem;">
                    ${dayAppointments.slice(0, 3).map(apt => {
                        const statusInfo = getStatusInfo(apt.status);
                        return `
                            <div style="font-size:0.7rem; padding:0.25rem; background:${statusInfo.color}20; border-left:2px solid ${statusInfo.color}; border-radius:4px; cursor:pointer;" 
                                 onclick="event.stopPropagation(); viewAppointmentDetailAdmin('${apt.id}')"
                                 title="${escapeHtml(apt.service || 'Cita')}">
                                <div style="font-weight:600; color:var(--gray-900);">${apt.time ? apt.time.substring(0, 5) : ''}</div>
                            </div>
                        `;
                    }).join('')}
                    ${dayAppointments.length > 3 ? `
                        <div style="font-size:0.7rem; color:var(--gray-600); text-align:center; padding:0.25rem;">
                            +${dayAppointments.length - 3} más
                        </div>
                    ` : ''}
                </div>
            </div>
        `);
    }
    
    calendarHTML.push('</div>');
    
    container.innerHTML = calendarHTML.join('');
}

/**
 * Filtra citas por fecha cuando se hace clic en un día del calendario mensual
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @returns {void}
 */
function viewAppointmentsByDate(dateStr) {
    document.getElementById('filterDate').value = dateStr;
    filterAppointments();
    changeAppointmentView();
    document.getElementById('appointmentViewMode').value = 'daily';
    currentCalendarDate = new Date(dateStr);
    changeAppointmentView();
}

/**
 * Navega al mes anterior
 * @returns {void}
 */
function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    loadMonthlyView();
}

/**
 * Navega al mes siguiente
 * @returns {void}
 */
function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    loadMonthlyView();
}

/**
 * Va al mes actual en la vista mensual
 * @returns {void}
 */
function goToTodayMonth() {
    currentCalendarDate = new Date();
    loadMonthlyView();
}

// ========== FILTROS ==========

/**
 * Filtra las citas según los criterios seleccionados
 * @returns {void}
 */
function filterAppointments() {
    loadAllAppointments(); // Recargar citas completas
    
    const searchTerm = document.getElementById('appointmentSearch')?.value.toLowerCase().trim() || '';
    const vetFilter = document.getElementById('filterVeterinarian')?.value || '';
    const serviceFilter = document.getElementById('filterService')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const dateFilter = document.getElementById('filterDate')?.value || '';
    
    filteredAppointments = allAppointments.filter(apt => {
        // Filtro de búsqueda (cliente o mascota)
        if (searchTerm) {
            const pets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
            const users = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
            const pet = pets.find(p => p.id === apt.petId);
            const petName = pet ? pet.name.toLowerCase() : (apt.petName || '').toLowerCase();
            const client = users.find(u => u.id === apt.userId || u.pets?.includes(apt.petId));
            const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim().toLowerCase() : '';
            
            if (!petName.includes(searchTerm) && !clientName.includes(searchTerm)) {
                return false;
            }
        }
        
        // Filtro de veterinario
        if (vetFilter && apt.veterinarianId !== vetFilter) {
            return false;
        }
        
        // Filtro de servicio
        if (serviceFilter && apt.service !== serviceFilter) {
            return false;
        }
        
        // Filtro de estado
        if (statusFilter && apt.status !== statusFilter) {
            return false;
        }
        
        // Filtro de fecha
        if (dateFilter && apt.date !== dateFilter) {
            return false;
        }
        
        return true;
    });
    
    // Actualizar vista según el modo actual
    if (currentAppointmentView === 'list') {
        loadAppointmentsList();
    } else if (currentAppointmentView === 'weekly') {
        loadWeeklyView();
    } else if (currentAppointmentView === 'daily') {
        loadDailyView();
    } else if (currentAppointmentView === 'monthly') {
        loadMonthlyView();
    }
    
    loadAppointmentStatistics();
}

/**
 * Limpia todos los filtros
 * @returns {void}
 */
function clearAppointmentFilters() {
    document.getElementById('appointmentSearch').value = '';
    document.getElementById('filterVeterinarian').value = '';
    document.getElementById('filterService').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterDate').value = '';
    
    filterAppointments();
}

// ========== ESTADÍSTICAS ==========

/**
 * Carga las estadísticas de citas
 * @returns {void}
 */
function loadAppointmentStatistics() {
    const today = new Date().toISOString().split('T')[0];
    
    const total = filteredAppointments.length;
    const todayCount = filteredAppointments.filter(apt => apt.date === today).length;
    const pending = filteredAppointments.filter(apt => apt.status === 'PENDIENTE').length;
    const confirmed = filteredAppointments.filter(apt => apt.status === 'CONFIRMADA').length;
    const completed = filteredAppointments.filter(apt => apt.status === 'COMPLETADA').length;
    
    const statTotal = document.getElementById('statTotalAppointments');
    const statToday = document.getElementById('statTodayAppointments');
    const statPending = document.getElementById('statPendingAppointments');
    const statConfirmed = document.getElementById('statConfirmedAppointments');
    const statCompleted = document.getElementById('statCompletedAppointments');
    
    if (statTotal) statTotal.textContent = total;
    if (statToday) statToday.textContent = todayCount;
    if (statPending) statPending.textContent = pending;
    if (statConfirmed) statConfirmed.textContent = confirmed;
    if (statCompleted) statCompleted.textContent = completed;
}

// ========== CREAR/EDITAR CITAS ==========

/**
 * Abre el modal para crear una nueva cita
 * @returns {void}
 */
function openCreateAppointmentAdmin() {
    currentEditingAppointmentId = null;
    const modal = document.getElementById('createAppointmentModalAdmin');
    
    if (!modal) {
        console.error('Modal createAppointmentModalAdmin no encontrado');
        showToast('Error: Modal no encontrado. Recarga la página.', 'error');
        return;
    }
    
    const title = document.getElementById('createAppointmentModalTitle');
    const form = document.getElementById('createAppointmentFormAdmin');
    
    if (title) title.textContent = 'Nueva Cita';
    if (form) form.reset();
    
    const statusField = document.getElementById('appointmentStatusAdmin');
    if (statusField) statusField.value = 'PENDIENTE';
    
    // Cargar datos
    loadClientsForAppointmentAdmin();
    loadServicesForFilter();
    loadVeterinariansForFilter();
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de crear cita
 * @returns {void}
 */
function closeCreateAppointmentModalAdmin() {
    const modal = document.getElementById('createAppointmentModalAdmin');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Guarda una nueva cita o actualiza una existente
 * @returns {void}
 */
function saveAppointmentAdmin() {
    const clientId = document.getElementById('appointmentClientAdmin').value;
    const petId = document.getElementById('appointmentPetAdmin').value;
    const date = document.getElementById('appointmentDateAdmin').value;
    const time = document.getElementById('appointmentTimeAdmin').value;
    const service = document.getElementById('appointmentServiceAdmin').value;
    const veterinarianId = document.getElementById('appointmentVeterinarianAdmin').value || null;
    const status = document.getElementById('appointmentStatusAdmin').value;
    const notes = document.getElementById('appointmentNotesAdmin').value.trim();
    
    // Validaciones
    if (!clientId || !petId || !date || !time || !service) {
        showToast('Por favor, completa todos los campos requeridos', 'error');
        return;
    }
    
    try {
        const pets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        const services = JSON.parse(localStorage.getItem('vetuni:mockServices') || '[]');
        const pet = pets.find(p => p.id === petId);
        const serviceObj = services.find(s => s.id === service);
        
        const petName = pet ? pet.name : 'Mascota';
        const serviceName = serviceObj ? serviceObj.name : service;
        
        loadAllAppointments(); // Recargar citas
        
        if (currentEditingAppointmentId) {
            // Editar cita existente
            const index = allAppointments.findIndex(apt => apt.id === currentEditingAppointmentId);
            if (index !== -1) {
                allAppointments[index] = {
                    ...allAppointments[index],
                    userId: clientId,
                    petId: petId,
                    petName: petName,
                    date: date,
                    time: time,
                    service: service,
                    veterinarianId: veterinarianId,
                    status: status,
                    notes: notes || undefined,
                    updatedAt: new Date().toISOString()
                };
                showToast('Cita actualizada exitosamente', 'success');
            } else {
                showToast('Cita no encontrada para editar', 'error');
                return;
            }
        } else {
            // Crear nueva cita
            const appointmentId = `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const appointment = {
                id: appointmentId,
                userId: clientId,
                petId: petId,
                petName: petName,
                date: date,
                time: time,
                service: service,
                notes: notes || undefined,
                status: status,
                module: getModuleByService(serviceName),
                veterinarianId: veterinarianId,
                createdAt: new Date().toISOString(),
                createdBy: 'ADMIN'
            };
            
            allAppointments.push(appointment);
            showToast('Cita creada exitosamente', 'success');
        }
        
        // Guardar en localStorage
        localStorage.setItem('vetuni:mockAppointments', JSON.stringify(allAppointments));
        
        // Recargar vistas
        closeCreateAppointmentModalAdmin();
        filterAppointments();
        
    } catch (error) {
        console.error('Error al guardar cita:', error);
        showToast('Error al guardar la cita', 'error');
    }
}

/**
 * Obtiene el módulo según el servicio (helper function)
 * @param {string} service - Nombre del servicio
 * @returns {string} Módulo correspondiente
 */
function getModuleByService(service) {
    const serviceLower = (service || '').toLowerCase();
    if (serviceLower.includes('vacuna')) return 'VACUNAS';
    if (serviceLower.includes('desparasit')) return 'DESPARASITACION';
    if (serviceLower.includes('consulta')) return 'CONSULTA';
    if (serviceLower.includes('cirugia') || serviceLower.includes('cirugía')) return 'CIRUGIA';
    return 'GENERAL';
}

/**
 * Edita una cita existente
 * @param {string} appointmentId - ID de la cita
 * @returns {void}
 */
function editAppointmentAdmin(appointmentId) {
    const appointment = allAppointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    currentEditingAppointmentId = appointmentId;
    
    const modal = document.getElementById('createAppointmentModalAdmin');
    const title = document.getElementById('createAppointmentModalTitle');
    
    if (title) title.textContent = 'Editar Cita';
    
    // Cargar datos
    loadClientsForAppointmentAdmin();
    loadServicesForFilter();
    loadVeterinariansForFilter();
    
    // Llenar formulario
    setTimeout(() => {
        document.getElementById('appointmentClientAdmin').value = appointment.userId || '';
        loadPetsForAppointmentAdmin();
        
        setTimeout(() => {
            document.getElementById('appointmentPetAdmin').value = appointment.petId || '';
            document.getElementById('appointmentDateAdmin').value = appointment.date || '';
            document.getElementById('appointmentTimeAdmin').value = appointment.time || '';
            document.getElementById('appointmentServiceAdmin').value = appointment.service || '';
            document.getElementById('appointmentVeterinarianAdmin').value = appointment.veterinarianId || '';
            document.getElementById('appointmentStatusAdmin').value = appointment.status || 'PENDIENTE';
            document.getElementById('appointmentNotesAdmin').value = appointment.notes || '';
        }, 100);
    }, 100);
    
    // Mostrar modal
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Muestra el detalle de una cita
 * @param {string} appointmentId - ID de la cita
 * @returns {void}
 */
function viewAppointmentDetailAdmin(appointmentId) {
    const appointment = allAppointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    const pets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const users = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const veterinarians = JSON.parse(localStorage.getItem('vetuni:mockVeterinarians') || '[]');
    const services = JSON.parse(localStorage.getItem('vetuni:mockServices') || '[]');
    
    const pet = pets.find(p => p.id === appointment.petId);
    const client = users.find(u => u.id === appointment.userId || u.pets?.includes(appointment.petId));
    const vet = appointment.veterinarianId ? veterinarians.find(v => v.id === appointment.veterinarianId) : null;
    const service = services.find(s => s.id === appointment.service || s.name === appointment.service);
    
    const statusInfo = getStatusInfo(appointment.status);
    
    const detailHTML = `
        <div style="padding:1.5rem;">
            <div style="display:grid; gap:1rem;">
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid var(--primary-color);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Fecha y Hora</div>
                    <div style="font-weight:600; color:var(--gray-900); font-size:1.1rem;">
                        ${formatDate(appointment.date)} - ${appointment.time ? appointment.time.substring(0, 5) : 'N/A'}
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem;">
                    <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg);">
                        <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Cliente</div>
                        <div style="font-weight:600; color:var(--gray-900);">
                            ${escapeHtml(client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : 'N/A')}
                        </div>
                    </div>
                    
                    <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg);">
                        <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Mascota</div>
                        <div style="font-weight:600; color:var(--gray-900);">
                            ${escapeHtml(pet ? pet.name : appointment.petName || 'N/A')}
                        </div>
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem;">
                    <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg);">
                        <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Servicio</div>
                        <div style="font-weight:600; color:var(--gray-900);">
                            ${escapeHtml(service ? service.name : appointment.service || 'N/A')}
                        </div>
                    </div>
                    
                    <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg);">
                        <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Veterinario</div>
                        <div style="font-weight:600; color:var(--gray-900);">
                            ${escapeHtml(vet ? `${vet.firstName || ''} ${vet.lastName || ''}`.trim() : 'Sin asignar')}
                        </div>
                    </div>
                </div>
                
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg); border-left:4px solid ${statusInfo.color};">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Estado</div>
                    <span style="background:${statusInfo.color}; color:white; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">
                        <i class="fa-solid ${statusInfo.icon}"></i> ${statusInfo.text}
                    </span>
                </div>
                
                ${appointment.notes ? `
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.5rem; font-weight:600;">Notas</div>
                    <div style="color:var(--gray-700); line-height:1.6;">${escapeHtml(appointment.notes)}</div>
                </div>
                ` : ''}
                
                ${appointment.cancelReason ? `
                <div style="padding:1rem; background:#FFEBEE; border-radius:var(--border-radius-lg); border-left:4px solid #F44336;">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.5rem; font-weight:600;">Motivo de Cancelación</div>
                    <div style="color:var(--gray-700); line-height:1.6;">${escapeHtml(appointment.cancelReason)}</div>
                </div>
                ` : ''}
                
                <div style="padding:1rem; background:var(--gray-50); border-radius:var(--border-radius-lg);">
                    <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">ID de la Cita</div>
                    <div style="color:var(--gray-700); font-family:monospace;">${escapeHtml(appointment.id)}</div>
                </div>
            </div>
        </div>
    `;
    
    const content = document.getElementById('appointmentDetailContentAdmin');
    if (content) content.innerHTML = detailHTML;
    
    const footer = document.querySelector('#appointmentDetailModalAdmin .patient-modal-footer');
    if (footer) {
        footer.innerHTML = `
            ${appointment.status !== 'CANCELADA' && appointment.status !== 'COMPLETADA' ? `
                <button class="submit-btn action-btn-edit" onclick="editAppointmentAdmin('${appointment.id}'); closeAppointmentDetailModalAdmin();">
                    <i class="fa-solid fa-pencil"></i> Editar
                </button>
                <button class="submit-btn" style="background:linear-gradient(135deg, #2196F3, #42A5F5);" onclick="openRescheduleAppointmentAdmin('${appointment.id}'); closeAppointmentDetailModalAdmin();">
                    <i class="fa-solid fa-calendar-week"></i> Reprogramar
                </button>
                <button class="submit-btn action-btn-delete" onclick="openCancelAppointmentAdmin('${appointment.id}'); closeAppointmentDetailModalAdmin();">
                    <i class="fa-solid fa-times"></i> Cancelar
                </button>
            ` : ''}
            <button class="submit-btn btn-secondary" onclick="closeAppointmentDetailModalAdmin()">
                Cerrar
            </button>
        `;
    }
    
    const modal = document.getElementById('appointmentDetailModalAdmin');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de detalle de cita
 * @returns {void}
 */
function closeAppointmentDetailModalAdmin() {
    const modal = document.getElementById('appointmentDetailModalAdmin');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ========== REPROGRAMAR CITAS ==========

/**
 * Abre el modal para reprogramar una cita
 * @param {string} appointmentId - ID de la cita
 * @returns {void}
 */
function openRescheduleAppointmentAdmin(appointmentId) {
    const appointment = allAppointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    document.getElementById('rescheduleAppointmentIdAdmin').value = appointmentId;
    document.getElementById('rescheduleDateAdmin').value = appointment.date || '';
    document.getElementById('rescheduleTimeAdmin').value = appointment.time || '';
    document.getElementById('rescheduleReasonAdmin').value = '';
    
    const modal = document.getElementById('rescheduleAppointmentModalAdmin');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de reprogramar cita
 * @returns {void}
 */
function closeRescheduleAppointmentModalAdmin() {
    const modal = document.getElementById('rescheduleAppointmentModalAdmin');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Guarda la reprogramación de una cita
 * @returns {void}
 */
function saveRescheduledAppointmentAdmin() {
    const appointmentId = document.getElementById('rescheduleAppointmentIdAdmin').value;
    const newDate = document.getElementById('rescheduleDateAdmin').value;
    const newTime = document.getElementById('rescheduleTimeAdmin').value;
    const reason = document.getElementById('rescheduleReasonAdmin').value.trim();
    
    if (!newDate || !newTime) {
        showToast('Por favor, completa fecha y hora', 'error');
        return;
    }
    
    try {
        loadAllAppointments();
        const appointment = allAppointments.find(apt => apt.id === appointmentId);
        
        if (!appointment) {
            showToast('Cita no encontrada', 'error');
            return;
        }
        
        // Guardar fecha y hora anteriores
        appointment.postponedDate = appointment.date;
        appointment.postponedTime = appointment.time;
        appointment.postponedReason = reason || undefined;
        
        // Actualizar fecha y hora
        appointment.date = newDate;
        appointment.time = newTime;
        appointment.updatedAt = new Date().toISOString();
        
        // Si estaba confirmada, mantener confirmada; si estaba pendiente, mantener pendiente
        // El estado no cambia al reprogramar
        
        localStorage.setItem('vetuni:mockAppointments', JSON.stringify(allAppointments));
        
        showToast('Cita reprogramada exitosamente', 'success');
        closeRescheduleAppointmentModalAdmin();
        filterAppointments();
        
    } catch (error) {
        console.error('Error al reprogramar cita:', error);
        showToast('Error al reprogramar la cita', 'error');
    }
}

// ========== CANCELAR CITAS ==========

/**
 * Abre el modal para cancelar una cita
 * @param {string} appointmentId - ID de la cita
 * @returns {void}
 */
function openCancelAppointmentAdmin(appointmentId) {
    document.getElementById('cancelAppointmentIdAdmin').value = appointmentId;
    document.getElementById('cancelReasonAdmin').value = '';
    
    const modal = document.getElementById('cancelAppointmentModalAdmin');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de cancelar cita
 * @returns {void}
 */
function closeCancelAppointmentModalAdmin() {
    const modal = document.getElementById('cancelAppointmentModalAdmin');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Confirma la cancelación de una cita
 * @returns {void}
 */
function confirmCancelAppointmentAdmin() {
    const appointmentId = document.getElementById('cancelAppointmentIdAdmin').value;
    const reason = document.getElementById('cancelReasonAdmin').value.trim();
    
    if (!reason) {
        showToast('Por favor, ingresa un motivo de cancelación', 'error');
        return;
    }
    
    try {
        loadAllAppointments();
        const appointment = allAppointments.find(apt => apt.id === appointmentId);
        
        if (!appointment) {
            showToast('Cita no encontrada', 'error');
            return;
        }
        
        appointment.status = 'CANCELADA';
        appointment.cancelReason = reason;
        appointment.updatedAt = new Date().toISOString();
        appointment.cancelledAt = new Date().toISOString();
        appointment.cancelledBy = 'ADMIN';
        
        localStorage.setItem('vetuni:mockAppointments', JSON.stringify(allAppointments));
        
        showToast('Cita cancelada exitosamente', 'success');
        closeCancelAppointmentModalAdmin();
        filterAppointments();
        
    } catch (error) {
        console.error('Error al cancelar cita:', error);
        showToast('Error al cancelar la cita', 'error');
    }
}

// ========== UTILIDADES ==========

/**
 * Formatea una fecha en formato legible
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr + 'T00:00:00');
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
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

// Exponer funciones globalmente para que estén disponibles desde los onclick del HTML
window.initAppointments = initAppointments;
window.changeAppointmentView = changeAppointmentView;
window.filterAppointments = filterAppointments;
window.clearAppointmentFilters = clearAppointmentFilters;
window.openCreateAppointmentAdmin = openCreateAppointmentAdmin;
window.closeCreateAppointmentModalAdmin = closeCreateAppointmentModalAdmin;
window.saveAppointmentAdmin = saveAppointmentAdmin;
window.loadPetsForAppointmentAdmin = loadPetsForAppointmentAdmin;
window.editAppointmentAdmin = editAppointmentAdmin;
window.viewAppointmentDetailAdmin = viewAppointmentDetailAdmin;
window.closeAppointmentDetailModalAdmin = closeAppointmentDetailModalAdmin;
window.openRescheduleAppointmentAdmin = openRescheduleAppointmentAdmin;
window.closeRescheduleAppointmentModalAdmin = closeRescheduleAppointmentModalAdmin;
window.saveRescheduledAppointmentAdmin = saveRescheduledAppointmentAdmin;
window.openCancelAppointmentAdmin = openCancelAppointmentAdmin;
window.closeCancelAppointmentModalAdmin = closeCancelAppointmentModalAdmin;
window.confirmCancelAppointmentAdmin = confirmCancelAppointmentAdmin;
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;
window.goToTodayWeek = goToTodayWeek;
window.previousDay = previousDay;
window.nextDay = nextDay;
window.goToTodayDay = goToTodayDay;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.goToTodayMonth = goToTodayMonth;
window.viewAppointmentsByDate = viewAppointmentsByDate;

