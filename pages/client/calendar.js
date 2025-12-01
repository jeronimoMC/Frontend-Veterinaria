/**
 * ============================================
 * CALENDARIO DE CITAS - VETERINARY CLINIC
 * ============================================
 * 
 * @fileoverview Calendario interactivo para visualizar y gestionar citas
 * @author VetUni Development Team
 * @version 1.0.0
 * 
 * Funcionalidades principales:
 * - Visualización mensual de citas en formato calendario
 * - Vista de lista de citas con filtros
 * - Creación de citas desde el calendario (clic en día)
 * - Validación de fechas (solo días futuros o hoy)
 * - Visualización de prioridades en citas
 * - Detalles completos de cada cita
 * 
 * @requires localStorage - API del navegador
 * @requires mockAuthService - Servicio de autenticación mock
 */

// ========== INICIALIZACIÓN PRINCIPAL ==========

/**
 * Inicializa el calendario cuando el DOM está listo
 * Verifica sesión, carga datos y renderiza el calendario
 */
document.addEventListener('DOMContentLoaded', () => {
    // ========== VERIFICACIÓN DE SESIÓN ==========
    const session = window.apiService?.getCurrentUser?.();
    if (!session) {
        window.location.replace('../auth/index.html');
        return;
    }

    // ========== DATOS ==========
    let mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    let mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    
    let currentDate = new Date();
    let currentView = 'calendar';
    let currentFilter = 'all';

    // ========== INICIALIZACIÓN ==========
    // Forzar recálculo de estilos responsive
    const forceResize = () => {
        window.dispatchEvent(new Event('resize'));
    };
    
    // Prevenir desbordamiento horizontal
    const preventHorizontalScroll = () => {
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.width = '100%';
        document.documentElement.style.width = '100%';
        document.body.style.maxWidth = '100%';
        document.documentElement.style.maxWidth = '100%';
    };
    
    preventHorizontalScroll();
    updateAppointmentsStatus();
    
    // Configurar event listeners primero
    setupEventListeners();
    
    // Renderizar calendario después de configurar listeners
    renderCalendar();
    
    // Forzar recálculo después de renderizar
    setTimeout(() => {
        forceResize();
        preventHorizontalScroll();
        // Re-configurar listeners después del renderizado
        setupEventListeners();
    }, 100);
    
    // Prevenir desbordamiento en resize
    window.addEventListener('resize', () => {
        preventHorizontalScroll();
        const calendarGrid = document.getElementById('calendarGrid');
        if (calendarGrid) {
            calendarGrid.style.width = '100%';
            calendarGrid.style.maxWidth = '100%';
        }
    });

    // ========== ACTUALIZAR ESTADO DE CITAS ==========
    function updateAppointmentsStatus() {
        const now = new Date();
        let updated = false;

        mockAppointments.forEach(apt => {
            const aptDate = new Date(`${apt.date}T${apt.time}`);
            
            // Si la cita ya pasó y está pendiente, marcarla como completada
            if (apt.status === 'PENDIENTE' && aptDate < now) {
                apt.status = 'COMPLETADA';
                apt.completedAt = new Date().toISOString();
                updated = true;
            }
        });

        if (updated) {
            localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
        }
    }

    // ========== RENDERIZAR CALENDARIO ==========
    function renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonthEl = document.getElementById('currentMonth');
        
        if (!calendarGrid || !currentMonthEl) return;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Nombre del mes
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;

        // Primer día del mes y último día
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Días de la semana
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        calendarGrid.innerHTML = '';

        // Headers de días
        dayNames.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });

        // Días del mes anterior (si es necesario)
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.innerHTML = `
                <div class="day-number">${prevMonthLastDay - i}</div>
            `;
            calendarGrid.appendChild(day);
        }

        // Días del mes actual
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.style.width = '100%';
            dayEl.style.maxWidth = '100%';
            dayEl.style.overflowX = 'hidden';
            dayEl.style.minWidth = '0';
            
            if (dayDate.toDateString() === today.toDateString()) {
                dayEl.classList.add('today');
            }

            dayEl.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="day-appointments" style="width: 100%; max-width: 100%; overflow: hidden;"></div>
            `;

            // Agregar citas del día
            const dayAppointments = getAppointmentsForDay(year, month, day);
            const appointmentsContainer = dayEl.querySelector('.day-appointments');
            
            dayAppointments.forEach(apt => {
                const aptDot = document.createElement('div');
                aptDot.className = `appointment-dot appointment-${apt.status.toLowerCase()}`;
                
                const pet = mockPets.find(p => p.id === apt.petId);
                const petName = pet ? pet.name : 'Mascota';
                const time = apt.time.substring(0, 5);
                
                // Mostrar prioridad si existe
                const priorityBadge = apt.priority ? getPriorityBadge(apt.priority) : '';
                
                aptDot.textContent = `${time} - ${petName}`;
                aptDot.title = `${apt.service} - ${petName} - ${apt.time}${apt.priority ? ' - ' + apt.priority : ''}`;
                aptDot.dataset.apptId = apt.id;
                aptDot.style.cursor = 'pointer';
                aptDot.style.maxWidth = '100%';
                aptDot.style.overflow = 'hidden';
                aptDot.style.textOverflow = 'ellipsis';
                aptDot.style.whiteSpace = 'nowrap';
                
                aptDot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showAppointmentDetail(apt);
                });
                
                appointmentsContainer.appendChild(aptDot);
            });
            
            // Agregar funcionalidad de clic en el día para crear cita
            // Solo permitir días futuros o hoy
            const todayCheck = new Date();
            todayCheck.setHours(0, 0, 0, 0);
            const dayDateOnly = new Date(year, month, day);
            dayDateOnly.setHours(0, 0, 0, 0);
            
            if (dayDateOnly >= todayCheck) {
                dayEl.style.cursor = 'pointer';
                dayEl.style.position = 'relative';
                dayEl.dataset.clickable = 'true';
                dayEl.dataset.year = year;
                dayEl.dataset.month = month;
                dayEl.dataset.day = day;
            } else {
                dayEl.style.opacity = '0.5';
                dayEl.style.cursor = 'not-allowed';
            }

            calendarGrid.appendChild(dayEl);
        }

        // Días del mes siguiente (para completar la cuadrícula)
        const totalCells = calendarGrid.children.length;
        const remainingCells = 42 - totalCells; // 6 semanas * 7 días
        for (let day = 1; day <= remainingCells; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day other-month';
            dayEl.innerHTML = `
                <div class="day-number">${day}</div>
            `;
            calendarGrid.appendChild(dayEl);
        }
    }

    // ========== OBTENER CITAS DEL DÍA ==========
    function getAppointmentsForDay(year, month, day) {
        const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        let filtered = mockAppointments.filter(apt => apt.date === dayStr);
        
        // Aplicar filtro
        if (currentFilter === 'pending') {
            filtered = filtered.filter(apt => apt.status === 'PENDIENTE');
        } else if (currentFilter === 'completed') {
            filtered = filtered.filter(apt => apt.status === 'COMPLETADA' || apt.status === 'CONFIRMADA');
        } else if (currentFilter === 'cancelled') {
            filtered = filtered.filter(apt => apt.status === 'CANCELADA');
        }
        
        return filtered;
    }

    // ========== RENDERIZAR LISTA ==========
    function renderList() {
        const appointmentsList = document.getElementById('appointmentsList');
        if (!appointmentsList) return;

        let filtered = [...mockAppointments];

        // Aplicar filtro
        if (currentFilter === 'pending') {
            filtered = filtered.filter(apt => apt.status === 'PENDIENTE');
        } else if (currentFilter === 'completed') {
            filtered = filtered.filter(apt => apt.status === 'COMPLETADA' || apt.status === 'CONFIRMADA');
        } else if (currentFilter === 'cancelled') {
            filtered = filtered.filter(apt => apt.status === 'CANCELADA');
        }

        // Ordenar por fecha
        filtered.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        if (filtered.length === 0) {
            appointmentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <h3>No hay citas</h3>
                    <p>No se encontraron citas con el filtro seleccionado</p>
                </div>
            `;
            return;
        }

        appointmentsList.innerHTML = '';

        filtered.forEach(apt => {
            const pet = mockPets.find(p => p.id === apt.petId);
            const petName = pet ? pet.name : 'Mascota';
            const petIcon = pet && pet.species === 'Perro' ? 'fa-dog' : 'fa-cat';
            
            const date = new Date(`${apt.date}T${apt.time}`);
            const dateStr = date.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const timeStr = apt.time.substring(0, 5);

            let statusClass = 'status-pending';
            let statusText = 'Pendiente';
            let statusBg = '#FFF3E0';
            let statusColor = '#E65100';
            
            if (apt.status === 'COMPLETADA' || apt.status === 'CONFIRMADA') {
                statusClass = 'status-completed';
                statusText = 'Completada';
                statusBg = '#E8F5E9';
                statusColor = '#2E7D32';
            } else if (apt.status === 'CANCELADA') {
                statusClass = 'status-cancelled';
                statusText = 'Cancelada';
                statusBg = '#FFEBEE';
                statusColor = '#C62828';
            }

            const card = document.createElement('div');
            card.className = 'appointment-card';
            card.style.borderLeftColor = statusColor;
            card.style.cursor = 'pointer';
            
            card.addEventListener('click', () => showAppointmentDetail(apt));

            card.innerHTML = `
                <div class="appointment-card-header">
                    <div class="appointment-title">
                        <i class="fa-solid ${petIcon}" style="color:var(--primary-color);"></i>
                        ${apt.service} - ${petName}
                    </div>
                    <div class="appointment-date">${dateStr}</div>
                </div>
                <div class="appointment-details">
                    <p><strong>Hora:</strong> ${timeStr}</p>
                    <p><strong>Módulo:</strong> ${apt.module || 'N/A'}</p>
                    ${apt.priority ? `<p><strong>Prioridad:</strong> ${getPriorityBadge(apt.priority)}</p>` : ''}
                    <p><strong>Motivo/Notas:</strong> ${apt.notes || 'Sin notas adicionales'}</p>
                </div>
                <div class="appointment-status" style="background:${statusBg}; color:${statusColor};">
                    <i class="fa-solid ${statusClass === 'status-completed' ? 'fa-check-circle' : statusClass === 'status-cancelled' ? 'fa-times-circle' : 'fa-clock'}"></i>
                    ${statusText}
                </div>
            `;

            appointmentsList.appendChild(card);
        });
    }

    // ========== MOSTRAR DETALLE DE CITA ==========
    function showAppointmentDetail(apt) {
        const pet = mockPets.find(p => p.id === apt.petId);
        const petName = pet ? pet.name : 'Mascota';
        const petIcon = pet && pet.species === 'Perro' ? 'fa-dog' : 'fa-cat';
        
        const date = new Date(`${apt.date}T${apt.time}`);
        const dateStr = date.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const timeStr = apt.time.substring(0, 5);

        let statusText = 'Pendiente';
        if (apt.status === 'COMPLETADA' || apt.status === 'CONFIRMADA') {
            statusText = 'Completada';
        } else if (apt.status === 'CANCELADA') {
            statusText = 'Cancelada';
        }

        const detail = `
            <div style="text-align:center; margin-bottom:1.5rem;">
                <div style="font-size:3rem; color:var(--primary-color); margin-bottom:0.5rem;">
                    <i class="fa-solid ${petIcon}"></i>
                </div>
                <h2 style="font-size:1.5rem; font-weight:600; color:var(--gray-900); margin-bottom:0.25rem;">${apt.service}</h2>
                <p style="color:var(--gray-600);">${petName}</p>
            </div>
            
            <div style="display:grid; gap:1rem; margin-bottom:1.5rem;">
                <div style="background:var(--gray-50); padding:1rem; border-radius:12px;">
                    <div style="font-weight:600; color:var(--primary-dark); margin-bottom:0.5rem;">
                        <i class="fa-solid fa-calendar"></i> Fecha y Hora
                    </div>
                    <p style="margin:0; color:var(--gray-700);">${dateStr}</p>
                    <p style="margin:0.25rem 0 0 0; color:var(--gray-700);">${timeStr}</p>
                </div>
                
                <div style="background:var(--gray-50); padding:1rem; border-radius:12px;">
                    <div style="font-weight:600; color:var(--primary-dark); margin-bottom:0.5rem;">
                        <i class="fa-solid fa-building"></i> Módulo
                    </div>
                    <p style="margin:0; color:var(--gray-700);">${apt.module || 'N/A'}</p>
                </div>
                
                <div style="background:var(--gray-50); padding:1rem; border-radius:12px;">
                    <div style="font-weight:600; color:var(--primary-dark); margin-bottom:0.5rem;">
                        <i class="fa-solid fa-note-sticky"></i> Motivo/Notas
                    </div>
                    <p style="margin:0; color:var(--gray-700);">${apt.notes || 'Sin notas adicionales'}</p>
                </div>
                
                <div style="background:var(--gray-50); padding:1rem; border-radius:12px;">
                    <div style="font-weight:600; color:var(--primary-dark); margin-bottom:0.5rem;">
                        <i class="fa-solid fa-info-circle"></i> Estado
                    </div>
                    <p style="margin:0; color:var(--gray-700);">${statusText}</p>
                </div>
            </div>
        `;

        // Crear modal simple
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999;';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal';
        modalContent.style.cssText = 'max-width:600px; max-height:90vh; overflow-y:auto; background:var(--white); border-radius:18px; padding:2rem; position:relative;';
        
        modalContent.innerHTML = `
            <button style="position:absolute; top:1rem; right:1rem; background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--gray-600);">
                <i class="fa-solid fa-xmark"></i>
            </button>
            ${detail}
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('button')) {
                modal.remove();
            }
        });
    }

    // ========== FUNCIONES AUXILIARES ==========
    
    /**
     * Genera el badge HTML para mostrar la prioridad de una cita
     * 
     * @param {string} priority - Nivel de prioridad: 'BAJA', 'MEDIA', 'ALTA', 'CRITICA'
     * @returns {string} HTML del badge de prioridad con estilo
     * 
     * @example
     * getPriorityBadge('ALTA'); // Retorna badge naranja oscuro con "Alta"
     */
    function getPriorityBadge(priority) {
        const priorities = {
            'BAJA': { text: 'Baja', color: '#4CAF50', icon: 'fa-arrow-down' },
            'MEDIA': { text: 'Media', color: '#FF9800', icon: 'fa-minus' },
            'ALTA': { text: 'Alta', color: '#FF5722', icon: 'fa-arrow-up' },
            'CRITICA': { text: 'Crítica', color: '#F44336', icon: 'fa-exclamation-triangle' }
        };
        
        const p = priorities[priority] || priorities['MEDIA'];
        return `<span style="background:${p.color}; color:white; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.75rem; font-weight:600;">
            <i class="fa-solid ${p.icon}"></i> ${p.text}
        </span>`;
    }
    
    /**
     * Abre el modal de crear cita con la fecha pre-seleccionada
     * Redirige al dashboard con parámetro de fecha en la URL
     * 
     * @param {number} year - Año seleccionado
     * @param {number} month - Mes seleccionado (0-11)
     * @param {number} day - Día seleccionado
     * @returns {void}
     * 
     * @example
     * openCreateAppointmentModal(2024, 10, 15); // Redirige con fecha 2024-11-15
     */
    function openCreateAppointmentModal(year, month, day) {
        // Formatear fecha como YYYY-MM-DD
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Redirigir al dashboard con parámetro de fecha
        window.location.href = `./index.html?createAppointment=${dateStr}`;
    }

    // ========== EVENT LISTENERS ==========
    function setupEventListeners() {
        // Navegación de meses - usar delegación de eventos en el contenedor
        const monthNav = document.querySelector('.month-navigation');
        if (monthNav) {
            monthNav.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                if (target.id === 'prevMonth') {
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    renderCalendar();
                    setupEventListeners(); // Re-configurar después de renderizar
                } else if (target.id === 'nextMonth') {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    renderCalendar();
                    setupEventListeners(); // Re-configurar después de renderizar
                }
            });
        }

        // Toggle de vista - usar delegación de eventos
        const viewToggle = document.querySelector('.view-toggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn || !btn.dataset.view) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                currentView = btn.dataset.view;
                document.querySelectorAll('.view-toggle button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const calendarView = document.getElementById('calendarView');
                const listView = document.getElementById('listView');
                
                if (currentView === 'calendar') {
                    if (calendarView) calendarView.style.display = 'block';
                    if (listView) listView.style.display = 'none';
                    renderCalendar();
                    setupEventListeners(); // Re-configurar después de renderizar
                } else {
                    if (calendarView) calendarView.style.display = 'none';
                    if (listView) listView.style.display = 'block';
                    renderList();
                }
            });
        }

        // Filtros - usar delegación de eventos
        const filterTabs = document.querySelector('.filter-tabs');
        if (filterTabs) {
            filterTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.filter-tab');
                if (!tab || !tab.dataset.filter) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                currentFilter = tab.dataset.filter;
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                if (currentView === 'calendar') {
                    renderCalendar();
                    setupEventListeners(); // Re-configurar después de renderizar
                } else {
                    renderList();
                }
            });
        }
        
        // Delegación de eventos para clics en días del calendario
        const calendarGrid = document.getElementById('calendarGrid');
        if (calendarGrid) {
            calendarGrid.addEventListener('click', (e) => {
                const dayEl = e.target.closest('.calendar-day[data-clickable="true"]');
                if (!dayEl) return;
                
                // Si se hizo clic en una cita, no hacer nada (ya tiene su propio handler)
                if (e.target.closest('.appointment-dot')) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                const year = parseInt(dayEl.dataset.year);
                const month = parseInt(dayEl.dataset.month);
                const day = parseInt(dayEl.dataset.day);
                
                if (year && month !== undefined && day) {
                    openCreateAppointmentModal(year, month, day);
                }
            });
        }
    }

    // Asegurar que el grid no se desborde después de renderizar
    setTimeout(() => {
        const calendarGrid = document.getElementById('calendarGrid');
        if (calendarGrid) {
            calendarGrid.style.width = '100%';
            calendarGrid.style.maxWidth = '100%';
            calendarGrid.style.overflowX = 'hidden';
        }
        preventHorizontalScroll();
    }, 200);

    console.log('✅ Calendar page initialized');
});

