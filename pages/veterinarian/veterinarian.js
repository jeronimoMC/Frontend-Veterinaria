/**
 * ============================================
 * PANEL DE VETERINARIO - VETERINARY CLINIC
 * ============================================
 * 
 * @fileoverview Panel completo del veterinario
 * @author VetUni Development Team
 * @version 1.0.0
 * 
 * Funcionalidades principales:
 * - Ver y gestionar pacientes
 * - Modificar historiales clínicos
 * - Crear y confirmar citas
 * - Recibir y gestionar notificaciones de citas
 * - Recetar medicamentos
 * - Prescripciones médicas
 * 
 * @requires localStorage - API del navegador
 * @requires mockAuthService - Servicio de autenticación mock
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
        // Si no es admin, redirigir a cliente
        if (!userRole.includes('ADMIN') && !userEmail.includes('admin')) {
            window.location.replace('../client/index.html');
            return;
        }
    }

    // Mostrar nombre del veterinario desde el perfil guardado o sesión
    const veterinarianName = document.getElementById('veterinarianName');
    if (veterinarianName) {
        const savedProfile = JSON.parse(localStorage.getItem('vetuni:veterinarianProfile') || '{}');
        const fullName = savedProfile.firstName && savedProfile.lastName
            ? `${savedProfile.firstName} ${savedProfile.lastName}`.trim()
            : `${session.firstName || 'Veterinario'} ${session.lastName || ''}`.trim();
        veterinarianName.textContent = fullName || 'Veterinario';
    }

    // ========== DATOS ==========
    let mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    let mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    let mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    let mockNotifications = JSON.parse(localStorage.getItem('vetuni:vetNotifications') || '[]');

    // ========== INICIALIZACIÓN ==========
    // Semana actual para el calendario
    let currentWeekStart = getStartOfWeek(new Date());
    
    loadStatistics();
    loadPatients();
    loadTodayAppointments();
    loadNotificationsBadge();
    loadRecentHistories();
    setupNotificationsModal();
    loadWeeklyCalendar();

    // Verificar nuevas citas y crear notificaciones
    checkForNewAppointments();
    
    // Verificar nuevas citas periódicamente (cada 30 segundos)
    setInterval(() => {
        checkForNewAppointments();
    }, 30000);

    console.log('✅ Veterinarian panel initialized');
});

/**
 * Verifica si hay nuevas citas y crea notificaciones
 */
function checkForNewAppointments() {
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    let mockNotifications = JSON.parse(localStorage.getItem('vetuni:vetNotifications') || '[]');
    
    // Filtrar nuevas citas pendientes que no tienen notificación aún
    const pendingAppointments = mockAppointments.filter(apt => {
        // Solo citas pendientes
        if (apt.status !== 'PENDIENTE') return false;
        
        // Verificar si ya existe una notificación para esta cita
        const hasNotification = mockNotifications.some(notif => 
            notif.appointmentId === apt.id && 
            notif.type === 'APPOINTMENT_REQUEST'
        );
        
        return !hasNotification;
    });
    
    if (pendingAppointments.length > 0) {
        // Crear notificaciones para nuevas citas
        const newNotifications = pendingAppointments.map(apt => {
            const pet = mockPets.find(p => p.id === apt.petId);
            const dateStr = new Date(apt.date + 'T00:00:00').toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const timeStr = apt.time.substring(0, 5);
            
            return {
                id: `notif-${apt.id}-${Date.now()}`,
                appointmentId: apt.id,
                type: 'APPOINTMENT_REQUEST',
                title: `Nueva cita solicitada: ${apt.service}`,
                description: `El cliente ha solicitado una cita para ${pet ? pet.name : 'mascota'} el ${dateStr} a las ${timeStr}. Por favor, revisa los detalles y confirma o rechaza la solicitud.${apt.notes && apt.notes !== 'Sin notas adicionales' ? ` Notas del cliente: ${apt.notes}` : ''}`,
                status: 'PENDING',
                priority: apt.priority || 'MEDIA',
                createdAt: apt.createdAt || new Date().toISOString()
            };
        });
        
        mockNotifications = [...mockNotifications, ...newNotifications];
        localStorage.setItem('vetuni:vetNotifications', JSON.stringify(mockNotifications));
        
        // Recargar badge y estadísticas
        loadNotificationsBadge();
        loadStatistics();
        
        // Mostrar notificación visual si hay nuevas
        if (newNotifications.length > 0) {
            const badge = document.getElementById('notificationsBadge');
            if (badge && badge.textContent !== '0') {
                // Animación para indicar nueva notificación
                badge.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    badge.style.animation = '';
                }, 500);
            }
        }
    }
}

/**
 * Carga las estadísticas del panel
 */
function loadStatistics() {
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    let mockNotifications = JSON.parse(localStorage.getItem('vetuni:vetNotifications') || '[]');
    const mockApptsForNotif = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const mockPetsForNotif = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    
    // Si no hay notificaciones, crear algunas de ejemplo
    if (mockNotifications.length === 0) {
        const pendingAppointments = mockApptsForNotif.filter(apt => apt.status === 'PENDIENTE');
        mockNotifications = pendingAppointments.slice(0, 5).map(apt => {
            const pet = mockPetsForNotif.find(p => p.id === apt.petId);
            return {
                id: `notif-${apt.id}`,
                appointmentId: apt.id,
                type: 'APPOINTMENT_REQUEST',
                title: `Nueva cita solicitada: ${apt.service}`,
                description: `El cliente ha solicitado una cita para ${pet ? pet.name : 'mascota'} el ${apt.date} a las ${apt.time}. Por favor, revisa los detalles y confirma o rechaza la solicitud.`,
                status: 'PENDING',
                priority: apt.priority || 'MEDIA',
                createdAt: apt.createdAt || new Date().toISOString()
            };
        });
        localStorage.setItem('vetuni:vetNotifications', JSON.stringify(mockNotifications));
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = mockAppointments.filter(apt => apt.date === today);
    const pendingNotifications = mockNotifications.filter(notif => notif.status === 'PENDING');
    
    const statPatients = document.getElementById('statPatients');
    const statAppointmentsToday = document.getElementById('statAppointmentsToday');
    
    if (statPatients) statPatients.textContent = mockPets.length;
    if (statAppointmentsToday) statAppointmentsToday.textContent = todayAppointments.length;
}

/**
 * Carga la lista de pacientes
 */
function loadPatients() {
    const patientsList = document.getElementById('patientsList');
    if (!patientsList) return;
    
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    
    if (mockPets.length === 0) {
        patientsList.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--gray-600);">No hay pacientes registrados</div>';
        return;
    }
    
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    
    patientsList.innerHTML = mockPets.slice(0, 5).map(pet => {
        const age = pet.birthdate ? Math.floor((new Date() - new Date(pet.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
        const petIcon = pet.species === 'Perro' ? 'fa-dog' : 'fa-cat';
        
        // Buscar próxima cita del paciente
        const upcomingAppointments = mockAppointments
            .filter(apt => apt.petId === pet.id && apt.status !== 'CANCELADA')
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            });
        
        const nextAppointment = upcomingAppointments[0];
        let appointmentStatusBadge = '';
        
        if (nextAppointment) {
            const statusColor = getAppointmentColor(nextAppointment);
            const colorMap = {
                'green': '#4CAF50',
                'yellow': '#FFC107',
                'red': '#F44336',
                'blue': '#2196F3'
            };
            const color = colorMap[statusColor] || colorMap['blue'];
            const statusText = nextAppointment.status === 'CONFIRMADA' ? 'Confirmada' : 
                              nextAppointment.status === 'PENDIENTE' ? 'Pendiente' : 
                              'Programada';
            
            appointmentStatusBadge = `
                <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid var(--gray-200);">
                    <div style="width:8px; height:8px; background:${color}; border-radius:50%;"></div>
                    <span style="font-size:0.75rem; color:var(--gray-600);">
                        Próxima cita: ${new Date(nextAppointment.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${statusText}
                    </span>
                </div>
            `;
        }
        
        return `
            <div class="patient-item" onclick="openPatientDetail('${pet.id}')">
                <div style="display:flex; align-items:center; gap:1rem;">
                    <div style="width:50px; height:50px; background:var(--primary-color); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem;">
                        <i class="fa-solid ${petIcon}"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-weight:600; color:var(--gray-900); margin-bottom:0.25rem;">${pet.name}</div>
                        <div style="font-size:0.85rem; color:var(--gray-600);">${pet.species} • ${pet.breed} • ${age} años</div>
                        ${appointmentStatusBadge}
                    </div>
                    <button class="btn-action btn-view" onclick="event.stopPropagation(); openPatientHistory('${pet.id}')">
                        <i class="fa-solid fa-file-medical"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    if (mockPets.length > 5) {
        patientsList.innerHTML += `
            <div style="text-align:center; margin-top:1rem;">
                <button class="btn-action btn-view" onclick="openPatientSearch()">
                    Ver todos los pacientes (${mockPets.length})
                </button>
            </div>
        `;
    }
}

/**
 * Carga las citas del día
 */
function loadTodayAppointments() {
    const appointmentsList = document.getElementById('appointmentsTodayList');
    if (!appointmentsList) return;
    
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    const todayAppointments = mockAppointments
        .filter(apt => apt.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));
    
    if (todayAppointments.length === 0) {
        appointmentsList.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--gray-600);">No hay citas programadas para hoy</div>';
        return;
    }
    
    appointmentsList.innerHTML = todayAppointments.map(apt => {
        const pet = mockPets.find(p => p.id === apt.petId);
        const petName = pet ? pet.name : 'Mascota';
        const petIcon = pet && pet.species === 'Perro' ? 'fa-dog' : 'fa-cat';
        const time = apt.time.substring(0, 5);
        
        let statusBadge = '';
        if (apt.status === 'PENDIENTE') {
            statusBadge = '<span style="background:#FF9800; color:white; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.75rem; font-weight:600;">Pendiente</span>';
        } else if (apt.status === 'CONFIRMADA') {
            statusBadge = '<span style="background:#4CAF50; color:white; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.75rem; font-weight:600;">Confirmada</span>';
        }
        
        return `
            <div class="appointment-item" onclick="openAppointmentDetail('${apt.id}')">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <i class="fa-solid ${petIcon}" style="color:var(--primary-color); font-size:1.2rem;"></i>
                        <div>
                            <div style="font-weight:600; color:var(--gray-900);">${apt.service}</div>
                            <div style="font-size:0.85rem; color:var(--gray-600);">${petName}</div>
                        </div>
                    </div>
                    ${statusBadge}
                </div>
                <div style="display:flex; align-items:center; gap:1rem; font-size:0.9rem; color:var(--gray-600);">
                    <span><i class="fa-solid fa-clock"></i> ${time}</span>
                    <span><i class="fa-solid fa-building"></i> ${apt.module || 'N/A'}</span>
                </div>
                ${apt.priority ? `
                    <div style="margin-top:0.5rem;">
                        <span style="background:${getPriorityColor(apt.priority)}; color:white; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.75rem; font-weight:600;">
                            Prioridad: ${apt.priority}
                        </span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Carga el badge de notificaciones y actualiza el contador
 */
function loadNotificationsBadge() {
    let mockNotifications = JSON.parse(localStorage.getItem('vetuni:vetNotifications') || '[]');
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    
    // Si no hay notificaciones, crear algunas de ejemplo basadas en citas pendientes
    if (mockNotifications.length === 0) {
        const pendingAppointments = mockAppointments.filter(apt => apt.status === 'PENDIENTE');
        mockNotifications = pendingAppointments.slice(0, 5).map(apt => {
            const pet = mockPets.find(p => p.id === apt.petId);
            return {
                id: `notif-${apt.id}`,
                appointmentId: apt.id,
                type: 'APPOINTMENT_REQUEST',
                title: `Nueva cita solicitada: ${apt.service}`,
                description: `El cliente ha solicitado una cita para ${pet ? pet.name : 'mascota'} el ${apt.date} a las ${apt.time}. Por favor, revisa los detalles y confirma o rechaza la solicitud. Si necesitas más información sobre el paciente o la cita, puedes contactar al cliente directamente.`,
                status: 'PENDING',
                priority: apt.priority || 'MEDIA',
                createdAt: apt.createdAt || new Date().toISOString()
            };
        });
        localStorage.setItem('vetuni:vetNotifications', JSON.stringify(mockNotifications));
    }
    
    const pendingNotifications = mockNotifications.filter(notif => notif.status === 'PENDING');
    
    // Actualizar badge
    const badge = document.getElementById('notificationsBadge');
    if (badge) {
        if (pendingNotifications.length > 0) {
            badge.textContent = pendingNotifications.length > 99 ? '99+' : pendingNotifications.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Configura el modal de notificaciones
 */
function setupNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    const toggleBtn = document.getElementById('notificationsToggle');
    const closeBtn = document.getElementById('closeNotificationsModal');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openNotificationsModal();
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeNotificationsModal();
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeNotificationsModal();
            }
        });
    }
}

/**
 * Abre el modal de notificaciones
 */
function openNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (!modal) return;
    
    loadNotificationsInModal();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de notificaciones
 */
function closeNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (!modal) return;
    
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

/**
 * Carga las notificaciones en el modal con acordeón
 */
function loadNotificationsInModal() {
    const modalBody = document.getElementById('notificationsModalBody');
    if (!modalBody) return;
    
    let mockNotifications = JSON.parse(localStorage.getItem('vetuni:vetNotifications') || '[]');
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    
    // Si no hay notificaciones, crear algunas de ejemplo
    if (mockNotifications.length === 0) {
        const pendingAppointments = mockAppointments.filter(apt => apt.status === 'PENDIENTE');
        mockNotifications = pendingAppointments.slice(0, 5).map(apt => {
            const pet = mockPets.find(p => p.id === apt.petId);
            return {
                id: `notif-${apt.id}`,
                appointmentId: apt.id,
                type: 'APPOINTMENT_REQUEST',
                title: `Nueva cita solicitada: ${apt.service}`,
                description: `El cliente ha solicitado una cita para ${pet ? pet.name : 'mascota'} el ${apt.date} a las ${apt.time}. Por favor, revisa los detalles y confirma o rechaza la solicitud. Si necesitas más información sobre el paciente o la cita, puedes contactar al cliente directamente.`,
                status: 'PENDING',
                priority: apt.priority || 'MEDIA',
                createdAt: apt.createdAt || new Date().toISOString()
            };
        });
        localStorage.setItem('vetuni:vetNotifications', JSON.stringify(mockNotifications));
    }
    
    // Obtener todas las notificaciones, ordenadas por fecha (más recientes primero)
    const allNotifications = [...mockNotifications].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    if (allNotifications.length === 0) {
        modalBody.innerHTML = `
            <div class="notification-empty">
                <i class="fa-solid fa-bell-slash"></i>
                <h3 style="margin:0.5rem 0; color:var(--gray-700);">No hay notificaciones</h3>
                <p style="margin:0; color:var(--gray-600);">Cuando tengas nuevas notificaciones, aparecerán aquí.</p>
            </div>
        `;
        return;
    }
    
    modalBody.innerHTML = allNotifications.map((notif, index) => {
        const priorityClass = notif.priority === 'CRITICA' || notif.priority === 'ALTA' ? 'urgent' : 'pending';
        const iconColor = notif.priority === 'CRITICA' || notif.priority === 'ALTA' ? '#F44336' : '#FF9800';
        const iconBg = notif.priority === 'CRITICA' || notif.priority === 'ALTA' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 152, 0, 0.1)';
        
        // Formatear fecha
        const date = new Date(notif.createdAt);
        const formattedDate = date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Determinar icono según tipo
        let icon = 'fa-bell';
        if (notif.type === 'APPOINTMENT_REQUEST') {
            icon = 'fa-calendar-plus';
        } else if (notif.type === 'APPOINTMENT_CANCELLED') {
            icon = 'fa-calendar-times';
        } else if (notif.type === 'APPOINTMENT_UPDATED') {
            icon = 'fa-calendar-check';
        }
        
        return `
            <div class="notification-accordion-item" data-notification-id="${notif.id}">
                <div class="notification-accordion-header" onclick="toggleNotificationAccordion('${notif.id}')">
                    <div class="notification-accordion-title-section">
                        <div class="notification-icon" style="background:${iconBg}; color:${iconColor};">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="notification-title-content">
                            <div class="notification-title">${escapeHtml(notif.title || 'Sin título')}</div>
                            <div class="notification-date">
                                <i class="fa-solid fa-clock"></i> ${formattedDate}
                            </div>
                        </div>
                    </div>
                    ${notif.priority ? `
                        <span style="background:${getPriorityColor(notif.priority)}; color:white; padding:0.25rem 0.6rem; border-radius:999px; font-size:0.7rem; font-weight:600; white-space:nowrap; margin-right:0.5rem;">
                            ${notif.priority}
                        </span>
                    ` : ''}
                    <button class="notification-accordion-toggle" onclick="event.stopPropagation(); toggleNotificationAccordion('${notif.id}')">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
                <div class="notification-accordion-body">
                    <div class="notification-description">
                        ${escapeHtml(notif.description || notif.message || 'Sin descripción disponible.')}
                    </div>
                    ${notif.status === 'PENDING' ? `
                        <div class="action-buttons" style="margin-top:1rem; padding-top:1rem; border-top:1px solid var(--gray-200);">
                            <button class="btn-action btn-accept" onclick="event.stopPropagation(); handleNotification('${notif.id}', 'ACCEPT')">
                        <i class="fa-solid fa-check"></i> Aceptar
                    </button>
                            <button class="btn-action btn-postpone" onclick="event.stopPropagation(); handleNotification('${notif.id}', 'POSTPONE')">
                        <i class="fa-solid fa-clock"></i> Posponer
                    </button>
                            <button class="btn-action btn-reject" onclick="event.stopPropagation(); handleNotification('${notif.id}', 'REJECT')">
                        <i class="fa-solid fa-times"></i> Rechazar
                    </button>
                        </div>
                    ` : `
                        <div style="margin-top:1rem; padding:0.75rem; background:var(--gray-50); border-radius:8px; text-align:center;">
                            <span style="color:var(--gray-600); font-size:0.85rem;">
                                ${notif.status === 'ACCEPTED' ? '<i class="fa-solid fa-check-circle" style="color:#4CAF50;"></i> Notificación procesada' : 
                                  notif.status === 'REJECTED' ? '<i class="fa-solid fa-times-circle" style="color:#F44336;"></i> Notificación rechazada' : 
                                  '<i class="fa-solid fa-clock" style="color:#FF9800;"></i> Notificación pospuesta'}
                            </span>
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Alterna el acordeón de una notificación
 */
function toggleNotificationAccordion(notificationId) {
    const item = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (!item) return;
    
    const isOpen = item.classList.contains('open');
    
    // Cerrar todos los demás acordeones
    document.querySelectorAll('.notification-accordion-item').forEach(accItem => {
        accItem.classList.remove('open');
    });
    
    // Abrir el seleccionado si estaba cerrado
    if (!isOpen) {
        item.classList.add('open');
    }
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Carga los historiales clínicos recientes
 */
function loadRecentHistories() {
    const recentHistoriesList = document.getElementById('recentHistoriesList');
    if (!recentHistoriesList) return;
    
    const mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    
    // Veterinario ve todos los historiales (habilitados y deshabilitados)
    const recentHistories = mockHistory
        .sort((a, b) => new Date(b.createdAt || b.fecha) - new Date(a.createdAt || a.fecha))
        .slice(0, 5);
    
    if (recentHistories.length === 0) {
        recentHistoriesList.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--gray-600);">No hay historiales clínicos registrados</div>';
        return;
    }
    
    recentHistoriesList.innerHTML = recentHistories.map(hist => {
        const pet = mockPets.find(p => p.id === hist.petId);
        const petName = pet ? pet.name : 'Mascota';
        const date = hist.fecha || (hist.createdAt ? new Date(hist.createdAt).toLocaleDateString('es-ES') : 'N/A');
        const isEnabled = hist.enabled !== undefined ? hist.enabled : 1;
        
        return `
            <div class="patient-item" onclick="openPatientDetail('${hist.petId}'); switchPatientTab('history');" style="${isEnabled === 0 ? 'opacity:0.7;' : ''}">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="flex:1;">
                        <div style="font-weight:600; color:var(--gray-900); margin-bottom:0.25rem;">
                            ${isEnabled === 0 ? '<i class="fa-solid fa-eye-slash" style="color:var(--gray-500); margin-right:0.5rem;"></i>' : ''}
                            ${hist.nombre || hist.tipo}
                        </div>
                        <div style="font-size:0.85rem; color:var(--gray-600);">${petName} • ${date}</div>
                        ${isEnabled === 0 ? '<div style="font-size:0.75rem; color:var(--gray-500); margin-top:0.25rem;"><i class="fa-solid fa-info-circle"></i> Deshabilitado</div>' : ''}
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-action btn-view" onclick="event.stopPropagation(); openPatientDetail('${hist.petId}'); setTimeout(() => { switchPatientTab('history'); openHistoryEditorForPatient('${hist.petId}', '${hist.id}'); }, 300);">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button class="btn-action ${isEnabled === 1 ? 'btn-reject' : 'btn-accept'}" onclick="event.stopPropagation(); const mockHist = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]'); const h = mockHist.find(x => x.id === '${hist.id}'); if(h) { toggleHistoryStatus('${hist.id}', h.enabled !== undefined ? h.enabled : 1); loadRecentHistories(); }">
                            <i class="fa-solid ${isEnabled === 1 ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Maneja las acciones de notificaciones
 */
function handleNotification(notificationId, action) {
    let mockNotifications = JSON.parse(localStorage.getItem('vetuni:vetNotifications') || '[]');
    let mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    const appointment = mockAppointments.find(a => a.id === notification.appointmentId);
    
    if (action === 'ACCEPT') {
        if (appointment) {
            appointment.status = 'CONFIRMADA';
            localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
        }
        notification.status = 'ACCEPTED';
        showToast('Cita aceptada correctamente', 'success');
    } else if (action === 'REJECT') {
        if (appointment) {
            appointment.status = 'CANCELADA';
            localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
        }
        notification.status = 'REJECTED';
        showToast('Cita rechazada', 'info');
    } else if (action === 'POSTPONE') {
        // Abrir modal para posponer
        const newDate = prompt('Ingrese la nueva fecha (YYYY-MM-DD):');
        if (newDate && appointment) {
            appointment.date = newDate;
            localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
            notification.status = 'POSTPONED';
            showToast('Cita pospuesta correctamente', 'info');
        }
    }
    
    notification.resolvedAt = new Date().toISOString();
    localStorage.setItem('vetuni:vetNotifications', JSON.stringify(mockNotifications));
    
    // Recargar datos
    loadStatistics();
    loadTodayAppointments();
    loadNotificationsBadge();
    
    // Si el modal está abierto, recargar notificaciones
    const modal = document.getElementById('notificationsModal');
    if (modal && modal.classList.contains('open')) {
        loadNotificationsInModal();
    }
}

/**
 * Obtiene el color según la prioridad
 */
function getPriorityColor(priority) {
    const colors = {
        'BAJA': '#4CAF50',
        'MEDIA': '#FF9800',
        'ALTA': '#FF5722',
        'CRITICA': '#F44336'
    };
    return colors[priority] || colors['MEDIA'];
}

/**
 * Muestra un toast de notificación
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Hacer funciones globales
window.toggleNotificationAccordion = toggleNotificationAccordion;
window.handleNotification = handleNotification;
window.viewNotificationDetail = viewNotificationDetail;
window.openNotificationsModal = openNotificationsModal;
window.closeNotificationsModal = closeNotificationsModal;

// ========== GESTIÓN DE PACIENTES ==========

let currentPatientId = null;
let currentHistoryId = null;

/**
 * Abre el modal de búsqueda de pacientes
 */
function openPatientSearch() {
    const modal = document.getElementById('patientSearchModal');
    if (!modal) return;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Cargar todos los pacientes
    loadPatientSearchResults('');
    
    // Configurar búsqueda en tiempo real
    const searchInput = document.getElementById('patientSearchInput');
    if (searchInput) {
        searchInput.value = '';
        searchInput.addEventListener('input', (e) => {
            loadPatientSearchResults(e.target.value);
        });
    }
}

/**
 * Cierra el modal de búsqueda
 */
function closePatientSearchModal() {
    const modal = document.getElementById('patientSearchModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Carga los resultados de búsqueda de pacientes
 */
function loadPatientSearchResults(searchTerm) {
    const resultsContainer = document.getElementById('patientSearchResults');
    if (!resultsContainer) return;
    
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    
    // Filtrar pacientes
    let filteredPets = mockPets;
    if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredPets = mockPets.filter(pet => 
            pet.name.toLowerCase().includes(term) ||
            pet.species.toLowerCase().includes(term) ||
            (pet.breed && pet.breed.toLowerCase().includes(term))
        );
    }
    
    if (filteredPets.length === 0) {
        resultsContainer.innerHTML = `
            <div style="text-align:center; padding:3rem; color:var(--gray-600);">
                <i class="fa-solid fa-search" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                <p>No se encontraron pacientes</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = filteredPets.map(pet => {
        const age = pet.birthdate ? Math.floor((new Date() - new Date(pet.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
        const petIcon = pet.species === 'Perro' ? 'fa-dog' : 'fa-cat';
        const appointmentsCount = mockAppointments.filter(apt => apt.petId === pet.id && apt.status !== 'CANCELADA').length;
        
        return `
            <div class="patient-item" onclick="openPatientDetail('${pet.id}')" style="cursor:pointer;">
                <div style="display:flex; align-items:center; gap:1rem;">
                    <div style="width:60px; height:60px; background:var(--primary-color); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:2rem;">
                        <i class="fa-solid ${petIcon}"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-weight:700; color:var(--gray-900); margin-bottom:0.25rem; font-size:1.1rem;">${pet.name}</div>
                        <div style="font-size:0.9rem; color:var(--gray-600);">${pet.species} • ${pet.breed || 'No especificada'} • ${age} años</div>
                        <div style="font-size:0.85rem; color:var(--primary-color); margin-top:0.25rem;">
                            <i class="fa-solid fa-calendar"></i> ${appointmentsCount} cita${appointmentsCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="color:var(--gray-400);"></i>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Abre el modal de detalles del paciente
 */
function openPatientDetail(petId) {
    currentPatientId = petId;
    const modal = document.getElementById('patientDetailModal');
    if (!modal) return;
    
    closePatientSearchModal();
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Cargar información del paciente
    loadPatientDetails(petId);
    
    // Activar primera tab
    switchPatientTab('info');
}

/**
 * Cierra el modal de detalles
 */
function closePatientDetailModal() {
    const modal = document.getElementById('patientDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    currentPatientId = null;
}

/**
 * Carga los detalles del paciente
 */
function loadPatientDetails(petId) {
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    
    const pet = mockPets.find(p => p.id === petId);
    if (!pet) {
        showToast('Paciente no encontrado', 'error');
        closePatientDetailModal();
        return;
    }
    
    // Actualizar título
    const title = document.getElementById('patientDetailTitle');
    if (title) {
        title.innerHTML = `<i class="fa-solid fa-paw"></i> ${pet.name}`;
    }
    
    // Cargar información general
    loadPatientInfoTab(pet, mockUsers);
    
    // Cargar historial
    loadPatientHistoryTab(petId, mockHistory);
    
    // Cargar citas
    loadPatientAppointmentsTab(petId, mockAppointments, mockPets);
    
    // Cargar notificaciones
    loadPatientNotificationsTab(petId, mockUsers);
}

/**
 * Carga la pestaña de información
 */
function loadPatientInfoTab(pet, mockUsers) {
    const tabContent = document.getElementById('patientTabInfo');
    if (!tabContent) return;
    
    const age = pet.birthdate ? Math.floor((new Date() - new Date(pet.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
    const petIcon = pet.species === 'Perro' ? 'fa-dog' : 'fa-cat';
    
    // Buscar dueño
    const owner = mockUsers.find(u => u.pets && u.pets.includes(pet.id));
    
    tabContent.innerHTML = `
        <div class="patient-info-header">
            <div class="patient-info-avatar">
                <i class="fa-solid ${petIcon}"></i>
            </div>
            <div class="patient-info-details">
                <h3>${pet.name}</h3>
                <p><i class="fa-solid fa-paw"></i> ${pet.species} • ${pet.breed || 'No especificada'}</p>
                <p><i class="fa-solid fa-calendar"></i> ${age} años</p>
                ${owner ? `<p><i class="fa-solid fa-user"></i> Dueño: ${owner.firstName || ''} ${owner.lastName || ''}</p>` : ''}
            </div>
        </div>
        
        <div class="patient-info-grid">
            <div class="patient-info-item">
                <div class="patient-info-item-label">Especie</div>
                <div class="patient-info-item-value">${pet.species}</div>
            </div>
            <div class="patient-info-item">
                <div class="patient-info-item-label">Raza</div>
                <div class="patient-info-item-value">${pet.breed || 'No especificada'}</div>
            </div>
            <div class="patient-info-item">
                <div class="patient-info-item-label">Edad</div>
                <div class="patient-info-item-value">${age} años</div>
            </div>
            <div class="patient-info-item">
                <div class="patient-info-item-label">Sexo</div>
                <div class="patient-info-item-value">${pet.gender || 'No especificado'}</div>
            </div>
            ${pet.birthdate ? `
                <div class="patient-info-item">
                    <div class="patient-info-item-label">Fecha de Nacimiento</div>
                    <div class="patient-info-item-value">${new Date(pet.birthdate).toLocaleDateString('es-ES')}</div>
                </div>
            ` : ''}
            ${pet.weight ? `
                <div class="patient-info-item">
                    <div class="patient-info-item-label">Peso</div>
                    <div class="patient-info-item-value">${pet.weight} kg</div>
                </div>
            ` : ''}
        </div>
        
        ${pet.notes ? `
            <div style="background:var(--gray-50); padding:1rem; border-radius:var(--border-radius-lg); margin-top:1rem;">
                <div style="font-weight:600; color:var(--gray-900); margin-bottom:0.5rem;">Notas</div>
                <div style="color:var(--gray-700);">${escapeHtml(pet.notes)}</div>
            </div>
        ` : ''}
        
        <div class="patient-actions">
            <button class="btn-action btn-view" onclick="openEditPetInfo('${pet.id}')">
                <i class="fa-solid fa-edit"></i> Editar Información
            </button>
            <button class="btn-action btn-view" onclick="openHistoryEditorForPatient('${pet.id}', null)">
                <i class="fa-solid fa-file-medical"></i> Nuevo Historial
            </button>
            <button class="btn-action btn-accept" onclick="openAppointmentForPatient('${pet.id}')">
                <i class="fa-solid fa-calendar-plus"></i> Programar Cita
            </button>
            <button class="btn-action btn-postpone" onclick="openSendNotificationForPatient('${pet.id}')">
                <i class="fa-solid fa-paper-plane"></i> Enviar Notificación
            </button>
        </div>
    `;
}

function viewNotificationDetail(notificationId) {
    // Abrir el modal si no está abierto
    const modal = document.getElementById('notificationsModal');
    if (!modal || !modal.classList.contains('open')) {
        openNotificationsModal();
    }
    
    // Expandir la notificación específica
    setTimeout(() => {
        toggleNotificationAccordion(notificationId);
        // Scroll a la notificación
        const item = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

/**
 * Carga la pestaña de historial clínico
 */
function loadPatientHistoryTab(petId, mockHistory) {
    const tabContent = document.getElementById('patientTabHistory');
    if (!tabContent) return;
    
    // Veterinario ve todos los historiales (habilitados y deshabilitados)
    const patientHistory = mockHistory
        .filter(h => h.petId === petId)
        .sort((a, b) => {
            const dateA = new Date(a.fecha || a.createdAt || 0);
            const dateB = new Date(b.fecha || b.createdAt || 0);
            return dateB - dateA;
        });
    
    if (patientHistory.length === 0) {
        tabContent.innerHTML = `
            <div style="text-align:center; padding:3rem; color:var(--gray-600);">
                <i class="fa-solid fa-file-medical" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                <p>No hay historial clínico registrado</p>
                <button class="btn-action btn-view" onclick="openHistoryEditorForPatient('${petId}', null)" style="margin-top:1rem;">
                    <i class="fa-solid fa-plus"></i> Crear Primer Historial
                </button>
            </div>
        `;
        return;
    }
    
    tabContent.innerHTML = `
        <div style="margin-bottom:1rem;">
            <button class="btn-action btn-view" onclick="openHistoryEditorForPatient('${petId}', null)">
                <i class="fa-solid fa-plus"></i> Nuevo Historial
            </button>
        </div>
        <div class="history-list">
            ${patientHistory.map(hist => {
                const date = hist.fecha || (hist.createdAt ? new Date(hist.createdAt).toLocaleDateString('es-ES') : 'N/A');
                const type = hist.tipo || hist.nombre || 'Consulta';
                const typeColors = {
                    'CONSULTA': '#4CAF50',
                    'VACUNACION': '#2196F3',
                    'CIRUGIA': '#F44336',
                    'LABORATORIO': '#FF9800',
                    'RADIOGRAFIA': '#9C27B0',
                    'CONTROL': '#00BCD4'
                };
                
                const isEnabled = hist.enabled !== undefined ? hist.enabled : 1; // Por defecto habilitado
                const disabledStyle = isEnabled === 0 ? 'opacity:0.6; background:var(--gray-100); border-left-color:var(--gray-400);' : '';
                
                return `
                    <div class="history-item" style="${disabledStyle}">
                        <div class="history-item-header">
                            <div>
                                <div class="history-item-title">
                                    ${isEnabled === 0 ? '<i class="fa-solid fa-eye-slash" style="color:var(--gray-500); margin-right:0.5rem;"></i>' : ''}
                                    ${escapeHtml(hist.nombre || type)}
                                </div>
                                <div class="history-item-date"><i class="fa-solid fa-calendar"></i> ${date}</div>
                            </div>
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                ${isEnabled === 0 ? '<span style="background:#9E9E9E; color:white; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.7rem; font-weight:600;">Deshabilitado</span>' : ''}
                                <span class="history-item-type" style="background:${typeColors[type] || '#4CAF50'};">${type}</span>
                            </div>
                        </div>
                        <div class="history-item-content">
                            ${hist.peso ? `<p><strong><i class="fa-solid fa-weight"></i> Peso:</strong> ${escapeHtml(hist.peso)} kg</p>` : ''}
                            ${hist.sintomas ? `<p><strong><i class="fa-solid fa-exclamation-triangle"></i> Síntomas:</strong> ${escapeHtml(hist.sintomas)}</p>` : ''}
                            ${hist.diagnostico ? `<p><strong><i class="fa-solid fa-stethoscope"></i> Diagnóstico:</strong> ${escapeHtml(hist.diagnostico)}</p>` : ''}
                            ${hist.tratamiento ? `<p><strong><i class="fa-solid fa-pills"></i> Tratamiento:</strong> ${escapeHtml(hist.tratamiento)}</p>` : ''}
                            ${hist.receta ? `<p><strong><i class="fa-solid fa-prescription-bottle-medical"></i> Receta:</strong> ${escapeHtml(hist.receta)}</p>` : ''}
                            ${hist.controlPosterior ? `<p><strong><i class="fa-solid fa-calendar-check"></i> Control Posterior:</strong> ${escapeHtml(hist.controlPosterior)}</p>` : ''}
                            ${hist.observaciones ? `<p><strong><i class="fa-solid fa-comment-medical"></i> Observaciones:</strong> ${escapeHtml(hist.observaciones)}</p>` : ''}
                        </div>
                        <div style="display:flex; gap:0.5rem; margin-top:0.75rem; flex-wrap:wrap;">
                            <button class="btn-action btn-view" onclick="openHistoryEditorForPatient('${currentPatientId}', '${hist.id}')" style="padding:0.5rem 1rem; font-size:0.85rem;">
                                <i class="fa-solid fa-edit"></i> Editar
                            </button>
                            <button class="btn-action ${isEnabled === 1 ? 'btn-reject' : 'btn-accept'}" onclick="toggleHistoryStatus('${hist.id}', ${isEnabled})" style="padding:0.5rem 1rem; font-size:0.85rem;">
                                <i class="fa-solid ${isEnabled === 1 ? 'fa-eye-slash' : 'fa-eye'}"></i> ${isEnabled === 1 ? 'Deshabilitar' : 'Habilitar'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Carga la pestaña de citas del paciente
 */
function loadPatientAppointmentsTab(petId, mockAppointments, mockPets) {
    const tabContent = document.getElementById('patientTabAppointments');
    if (!tabContent) return;
    
    const patientAppointments = mockAppointments
        .filter(apt => apt.petId === petId)
        .sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB - dateA;
        });
    
    if (patientAppointments.length === 0) {
        tabContent.innerHTML = `
            <div style="text-align:center; padding:3rem; color:var(--gray-600);">
                <i class="fa-solid fa-calendar" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                <p>No hay citas programadas</p>
                <button class="btn-action btn-view" onclick="openAppointmentForPatient('${petId}')" style="margin-top:1rem;">
                    <i class="fa-solid fa-plus"></i> Programar Primera Cita
                </button>
            </div>
        `;
        return;
    }
    
    tabContent.innerHTML = `
        <div style="margin-bottom:1rem;">
            <button class="btn-action btn-view" onclick="openAppointmentForPatient('${petId}')">
                <i class="fa-solid fa-plus"></i> Nueva Cita
            </button>
        </div>
        <div class="appointments-list-patients">
            ${patientAppointments.map(apt => {
                const date = new Date(apt.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const time = apt.time.substring(0, 5);
                const statusColor = getAppointmentColor(apt);
                const colorHex = getColorHex(statusColor);
                
                let statusBadge = '';
                if (apt.status === 'PENDIENTE') {
                    statusBadge = '<span style="background:#FFC107; color:white; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">Pendiente</span>';
                } else if (apt.status === 'CONFIRMADA') {
                    statusBadge = '<span style="background:#4CAF50; color:white; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">Confirmada</span>';
                } else if (apt.status === 'CANCELADA') {
                    statusBadge = '<span style="background:#F44336; color:white; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">Cancelada</span>';
                }
                
                return `
                    <div class="appointment-item-patients" style="border-left-color:${colorHex};">
                        <div class="appointment-item-header">
                            <div>
                                <div style="font-weight:700; color:var(--gray-900); margin-bottom:0.25rem;">${escapeHtml(apt.service)}</div>
                                <div style="font-size:0.85rem; color:var(--gray-600);">
                                    <i class="fa-solid fa-calendar"></i> ${date}
                                    <br>
                                    <i class="fa-solid fa-clock"></i> ${time}
                                    ${apt.module ? `<br><i class="fa-solid fa-building"></i> ${escapeHtml(apt.module)}` : ''}
                                </div>
                            </div>
                            ${statusBadge}
                        </div>
                        ${apt.notes ? `
                            <div style="margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid var(--gray-200);">
                                <div style="font-size:0.85rem; color:var(--gray-700);">
                                    <strong>Notas:</strong> ${escapeHtml(apt.notes)}
                                </div>
                            </div>
                        ` : ''}
                        ${apt.status === 'PENDIENTE' || apt.status === 'CONFIRMADA' ? `
                            <div style="display:flex; gap:0.5rem; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--gray-200);" onclick="event.stopPropagation();">
                                ${apt.status === 'PENDIENTE' ? `
                                    <button class="btn-action btn-accept" onclick="handleCalendarAppointment('${apt.id}', 'confirm')" style="padding:0.5rem 1rem; font-size:0.85rem;">
                                        <i class="fa-solid fa-check"></i> Confirmar
                                    </button>
                                ` : ''}
                                <button class="btn-action btn-postpone" onclick="openPostponeAppointmentModal('${apt.id}')" style="padding:0.5rem 1rem; font-size:0.85rem;">
                                    <i class="fa-solid fa-clock-rotate-left"></i> Posponer
                                </button>
                                <button class="btn-action btn-reject" onclick="handleCalendarAppointment('${apt.id}', 'cancel')" style="padding:0.5rem 1rem; font-size:0.85rem;">
                                    <i class="fa-solid fa-times"></i> Cancelar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Carga la pestaña de notificaciones enviadas
 */
function loadPatientNotificationsTab(petId, mockUsers) {
    const tabContent = document.getElementById('patientTabNotifications');
    if (!tabContent) return;
    
    // Buscar notificaciones del cliente relacionadas con este paciente
    const pet = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]').find(p => p.id === petId);
    if (!pet) return;
    
    const owner = mockUsers.find(u => u.pets && u.pets.includes(petId));
    
    // Obtener notificaciones del cliente
    const clientNotifications = JSON.parse(localStorage.getItem('vetuni:clientNotifications') || '[]');
    const petNotifications = clientNotifications.filter(n => n.petId === petId);
    
    tabContent.innerHTML = `
        <div style="margin-bottom:1rem;">
            <button class="btn-action btn-view" onclick="openSendNotificationForPatient('${petId}')">
                <i class="fa-solid fa-plus"></i> Nueva Notificación
            </button>
        </div>
        ${petNotifications.length === 0 ? `
            <div style="text-align:center; padding:3rem; color:var(--gray-600);">
                <i class="fa-solid fa-bell-slash" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                <p>No hay notificaciones enviadas</p>
            </div>
        ` : `
            <div class="notification-list-patient">
                ${petNotifications.map(notif => {
                    const date = new Date(notif.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    return `
                        <div class="notification-item-patient">
                            <div class="notification-item-patient-header">
                                <div class="notification-item-patient-title">${escapeHtml(notif.title)}</div>
                                <div class="notification-item-patient-date">${date}</div>
                            </div>
                            <div class="notification-item-patient-message">${escapeHtml(notif.message || notif.description)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `}
    `;
}

/**
 * Cambia de tab en el modal del paciente
 */
function switchPatientTab(tabName) {
    // Ocultar todas las tabs
    document.querySelectorAll('.patient-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.patient-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activar tab seleccionada
    const tabContent = document.getElementById(`patientTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (tabContent) tabContent.classList.add('active');
    if (tabButton) tabButton.classList.add('active');
    
    // Si estamos cambiando a una tab que necesita recarga
    if (currentPatientId) {
        const mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
        const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        
        if (tabName === 'history') {
            loadPatientHistoryTab(currentPatientId, mockHistory);
        } else if (tabName === 'appointments') {
            loadPatientAppointmentsTab(currentPatientId, mockAppointments, mockPets);
        } else if (tabName === 'notifications') {
            loadPatientNotificationsTab(currentPatientId, mockUsers);
        }
    }
}

/**
 * Obtiene el inicio de la semana (lunes)
 */
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que el lunes sea el primer día
    return new Date(d.setDate(diff));
}

/**
 * Formatea una fecha para mostrar
 */
function formatDate(date) {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

/**
 * Obtiene el nombre del día en español
 */
function getDayName(dayIndex) {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dayIndex];
}

/**
 * Obtiene el color de estado de una cita
 */
function getAppointmentColor(appointment) {
    // Si la cita tiene un color personalizado asignado
    if (appointment.statusColor) {
        return appointment.statusColor;
    }
    
    // Colores por defecto según estado y prioridad
    if (appointment.status === 'CONFIRMADA') {
        return 'green';
    } else if (appointment.status === 'PENDIENTE') {
        if (appointment.priority === 'CRITICA' || appointment.priority === 'ALTA') {
            return 'red';
        }
        return 'yellow';
    } else if (appointment.priority === 'URGENTE' || appointment.priority === 'CRITICA') {
        return 'red';
    }
    
    // Por defecto: azul para revisiones generales
    return 'blue';
}

/**
 * Carga el calendario semanal
 */
function loadWeeklyCalendar() {
    const calendarContainer = document.getElementById('weeklyCalendar');
    const weekRange = document.getElementById('weekRange');
    if (!calendarContainer) return;
    
    // Calcular rango de la semana
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (weekRange) {
        weekRange.textContent = `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}`;
    }
    
    // Generar días de la semana
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekStart);
        day.setDate(day.getDate() + i);
        days.push(day);
    }
    
    // Obtener citas
    const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    
    // Renderizar calendario
    calendarContainer.innerHTML = days.map((day, index) => {
        const dayStr = day.toISOString().split('T')[0];
        const isToday = dayStr === new Date().toISOString().split('T')[0];
        
        // Filtrar citas del día y ordenar por hora
        const dayAppointments = mockAppointments
            .filter(apt => apt.date === dayStr)
            .sort((a, b) => a.time.localeCompare(b.time));
        
        const appointmentsHtml = dayAppointments.map(apt => {
            const pet = mockPets.find(p => p.id === apt.petId);
            const petName = pet ? pet.name : apt.petName || 'Mascota';
            const client = mockUsers.find(u => u.id === apt.userId || u.pets?.includes(apt.petId));
            const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : 'Cliente';
            
            const statusColor = getAppointmentColor(apt);
            const time = apt.time.substring(0, 5);
            
            return `
                <div class="calendar-appointment-item" data-status-color="${statusColor}" onclick="openAppointmentDetail('${apt.id}')">
                    <div class="calendar-appointment-time">
                        <i class="fa-solid fa-clock"></i> ${time}
                    </div>
                    <div class="calendar-appointment-client">
                        <i class="fa-solid fa-user"></i> ${escapeHtml(clientName)}
                    </div>
                    <div class="calendar-appointment-pet">
                        <i class="fa-solid ${pet && pet.species === 'Perro' ? 'fa-dog' : 'fa-cat'}"></i> ${escapeHtml(petName)}
                    </div>
                    <div class="calendar-appointment-service">
                        ${escapeHtml(apt.service || 'Consulta')}
                    </div>
                    <div class="calendar-appointment-actions" onclick="event.stopPropagation();">
                        ${apt.status === 'PENDIENTE' || apt.status === 'CONFIRMADA' ? `
                            ${apt.status === 'PENDIENTE' ? `
                                <button class="calendar-appointment-btn accept" onclick="handleCalendarAppointment('${apt.id}', 'confirm')" title="Confirmar">
                                    <i class="fa-solid fa-check"></i>
                                </button>
                            ` : ''}
                            <button class="calendar-appointment-btn postpone" onclick="openPostponeAppointmentModal('${apt.id}')" title="Posponer">
                                <i class="fa-solid fa-clock-rotate-left"></i>
                            </button>
                            <button class="calendar-appointment-btn reject" onclick="handleCalendarAppointment('${apt.id}', 'cancel')" title="Cancelar">
                                <i class="fa-solid fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="calendar-appointment-btn color" onclick="openColorPickerModal('${apt.id}', '${statusColor}')" title="Cambiar color">
                            <i class="fa-solid fa-palette"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="calendar-day ${isToday ? 'today' : ''}">
                <div class="calendar-day-header">
                    <div class="calendar-day-name">${getDayName(index)}</div>
                    <div class="calendar-day-number">${day.getDate()}</div>
                </div>
                <div class="calendar-appointments">
                    ${appointmentsHtml || '<div style="text-align:center; color:var(--gray-500); font-size:0.85rem; padding:1rem;">No hay citas</div>'}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Navega a la semana anterior
 */
function previousWeek() {
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    loadWeeklyCalendar();
}

/**
 * Navega a la semana siguiente
 */
function nextWeek() {
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    loadWeeklyCalendar();
}

/**
 * Va a la semana actual
 */
function goToToday() {
    currentWeekStart = getStartOfWeek(new Date());
    loadWeeklyCalendar();
}

/**
 * Maneja acciones de citas desde el calendario
 */
function handleCalendarAppointment(appointmentId, action) {
    let mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const appointment = mockAppointments.find(a => a.id === appointmentId);
    
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    if (action === 'confirm' || action === 'accept') {
        appointment.status = 'CONFIRMADA';
        showToast('Cita confirmada correctamente', 'success');
        
        // Actualizar notificación si existe
        let mockNotifications = JSON.parse(localStorage.getItem('vetuni:vetNotifications') || '[]');
        const notification = mockNotifications.find(n => n.appointmentId === appointmentId);
        if (notification) {
            notification.status = 'ACCEPTED';
            localStorage.setItem('vetuni:vetNotifications', JSON.stringify(mockNotifications));
        }
    } else if (action === 'cancel') {
        // Abrir modal de cancelación con motivo
        openCancelAppointmentModal(appointmentId);
        return;
    }
    
    localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
    
    // Recargar todo
    loadStatistics();
    loadTodayAppointments();
    loadWeeklyCalendar();
    loadNotificationsBadge();
    
    // Recargar detalles del paciente si está abierto
    if (currentPatientId === appointment.petId) {
        const mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
        const mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
        const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        loadPatientAppointmentsTab(currentPatientId, mockAppointments, mockPets);
    }
}

/**
 * Abre el modal para posponer una cita
 */
function openPostponeAppointmentModal(appointmentId) {
    const appointment = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]').find(a => a.id === appointmentId);
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    window.currentPostponingAppointmentId = appointmentId;
    
    const modal = document.getElementById('postponeAppointmentModal');
    const form = document.getElementById('postponeAppointmentForm');
    
    if (!modal || !form) return;
    
    // Establecer fecha actual como mínimo
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('postponeDate');
    const timeInput = document.getElementById('postponeTime');
    
    if (dateInput) {
        dateInput.setAttribute('min', today);
        dateInput.value = appointment.date || today;
    }
    
    if (timeInput) {
        timeInput.value = appointment.time || '';
    }
    
    // Mostrar información actual
    const currentDateEl = document.getElementById('currentAppointmentDate');
    if (currentDateEl) {
        const currentDate = new Date(appointment.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        currentDateEl.textContent = `${currentDate} a las ${appointment.time.substring(0, 5)}`;
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de posponer cita
 */
function closePostponeAppointmentModal() {
    const modal = document.getElementById('postponeAppointmentModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    window.currentPostponingAppointmentId = null;
}

/**
 * Guarda la cita pospuesta
 */
function savePostponedAppointment() {
    const appointmentId = window.currentPostponingAppointmentId;
    if (!appointmentId) return;
    
    const dateInput = document.getElementById('postponeDate');
    const timeInput = document.getElementById('postponeTime');
    const notesInput = document.getElementById('postponeNotes');
    
    if (!dateInput || !timeInput || !dateInput.value || !timeInput.value) {
        showToast('Por favor, completa la fecha y hora', 'error');
        return;
    }
    
    let mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const appointment = mockAppointments.find(a => a.id === appointmentId);
    
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    const oldDate = appointment.date;
    const oldTime = appointment.time;
    
    // Actualizar cita
    appointment.date = dateInput.value;
    appointment.time = timeInput.value;
    
    if (notesInput && notesInput.value.trim()) {
        appointment.notes = (appointment.notes || '') + ` | Pospuesta: ${notesInput.value.trim()}`;
    } else {
        appointment.notes = (appointment.notes || '') + ` | Cita pospuesta`;
    }
    
    // Crear notificación para el cliente
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const pet = mockPets.find(p => p.id === appointment.petId);
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const owner = mockUsers.find(u => u.pets && u.pets.includes(appointment.petId));
    
    if (owner) {
        let clientNotifications = JSON.parse(localStorage.getItem('vetuni:clientNotifications') || '[]');
        const newDate = new Date(appointment.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        clientNotifications.push({
            id: `notif-client-postpone-${Date.now()}`,
            userId: owner.id,
            petId: appointment.petId,
            petName: pet ? pet.name : 'Mascota',
            title: 'Cita Pospuesta',
            message: `Su cita para ${pet ? pet.name : 'su mascota'} ha sido pospuesta. Nueva fecha: ${newDate} a las ${appointment.time.substring(0, 5)}.${notesInput && notesInput.value.trim() ? ` Motivo: ${notesInput.value.trim()}` : ''}`,
            description: `Su cita del ${new Date(oldDate).toLocaleDateString('es-ES')} a las ${oldTime.substring(0, 5)} ha sido reprogramada para el ${newDate} a las ${appointment.time.substring(0, 5)}.`,
            type: 'APPOINTMENT_POSTPONED',
            priority: 'MEDIA',
            status: 'UNREAD',
            createdAt: new Date().toISOString()
        });
        
        localStorage.setItem('vetuni:clientNotifications', JSON.stringify(clientNotifications));
    }
    
    localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
    
    showToast('Cita pospuesta correctamente. El cliente ha sido notificado.', 'success');
    closePostponeAppointmentModal();
    
    // Recargar todo
    loadStatistics();
    loadTodayAppointments();
    loadWeeklyCalendar();
    
    // Recargar detalles del paciente si está abierto
    if (currentPatientId === appointment.petId) {
        const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        loadPatientAppointmentsTab(currentPatientId, mockAppointments, mockPets);
    }
}

/**
 * Abre el modal para cancelar una cita con motivo
 */
function openCancelAppointmentModal(appointmentId) {
    const appointment = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]').find(a => a.id === appointmentId);
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    window.currentCancellingAppointmentId = appointmentId;
    
    const modal = document.getElementById('cancelAppointmentModal');
    const form = document.getElementById('cancelAppointmentForm');
    
    if (!modal || !form) return;
    
    form.reset();
    
    // Mostrar información de la cita
    const appointmentInfoEl = document.getElementById('cancelAppointmentInfo');
    if (appointmentInfoEl) {
        const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        const pet = mockPets.find(p => p.id === appointment.petId);
        const date = new Date(appointment.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        appointmentInfoEl.innerHTML = `
            <div style="font-weight:600; color:var(--gray-900); margin-bottom:0.5rem;">${escapeHtml(appointment.service)}</div>
            <div style="font-size:0.9rem; color:var(--gray-600);">
                <i class="fa-solid fa-paw"></i> ${pet ? pet.name : 'Mascota'}<br>
                <i class="fa-solid fa-calendar"></i> ${date} a las ${appointment.time.substring(0, 5)}
            </div>
        `;
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de cancelar cita
 */
function closeCancelAppointmentModal() {
    const modal = document.getElementById('cancelAppointmentModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    window.currentCancellingAppointmentId = null;
}

/**
 * Confirma la cancelación de la cita con motivo
 */
function confirmCancelAppointment() {
    const appointmentId = window.currentCancellingAppointmentId;
    if (!appointmentId) return;
    
    const reasonInput = document.getElementById('cancelReason');
    if (!reasonInput || !reasonInput.value.trim()) {
        showToast('Por favor, ingresa el motivo de la cancelación', 'error');
        return;
    }
    
    let mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const appointment = mockAppointments.find(a => a.id === appointmentId);
    
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    const cancelReason = reasonInput.value.trim();
    
    // Actualizar cita
    appointment.status = 'CANCELADA';
    appointment.cancelReason = cancelReason;
    appointment.cancelledAt = new Date().toISOString();
    
    if (appointment.notes) {
        appointment.notes = appointment.notes + ` | Cancelada: ${cancelReason}`;
    } else {
        appointment.notes = `Cancelada: ${cancelReason}`;
    }
    
    // Crear notificación para el cliente
    createClientNotificationForCancelledAppointment(appointment, cancelReason);
    
    // Actualizar notificación del veterinario si existe
    let mockNotifications = JSON.parse(localStorage.getItem('vetuni:vetNotifications') || '[]');
    const notification = mockNotifications.find(n => n.appointmentId === appointmentId);
    if (notification) {
        notification.status = 'REJECTED';
        localStorage.setItem('vetuni:vetNotifications', JSON.stringify(mockNotifications));
    }
    
    localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
    
    showToast('Cita cancelada. El cliente ha sido notificado.', 'success');
    closeCancelAppointmentModal();
    
    // Recargar todo
    loadStatistics();
    loadTodayAppointments();
    loadWeeklyCalendar();
    loadNotificationsBadge();
    
    // Recargar detalles del paciente si está abierto
    if (currentPatientId === appointment.petId) {
        const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
        loadPatientAppointmentsTab(currentPatientId, mockAppointments, mockPets);
    }
}

/**
 * Crea una notificación para el cliente cuando se cancela una cita
 */
function createClientNotificationForCancelledAppointment(appointment, cancelReason) {
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const pet = mockPets.find(p => p.id === appointment.petId);
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const owner = mockUsers.find(u => u.pets && u.pets.includes(appointment.petId));
    
    if (owner) {
        let clientNotifications = JSON.parse(localStorage.getItem('vetuni:clientNotifications') || '[]');
        const date = new Date(appointment.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        clientNotifications.push({
            id: `notif-client-cancel-${Date.now()}`,
            userId: owner.id,
            petId: appointment.petId,
            petName: pet ? pet.name : 'Mascota',
            title: 'Cita Cancelada',
            message: `Su cita para ${pet ? pet.name : 'su mascota'} del ${date} a las ${appointment.time.substring(0, 5)} ha sido cancelada.${cancelReason ? ` Motivo: ${cancelReason}` : ''} Por favor, programe una nueva cita.`,
            description: `La cita programada para el servicio "${appointment.service}" ha sido cancelada.${cancelReason ? `\n\nMotivo de cancelación: ${cancelReason}` : ''}\n\nPuede programar una nueva cita cuando lo desee.`,
            type: 'APPOINTMENT_CANCELLED',
            priority: 'MEDIA',
            status: 'UNREAD',
            createdAt: new Date().toISOString()
        });
        
        localStorage.setItem('vetuni:clientNotifications', JSON.stringify(clientNotifications));
    }
}

let currentAppointmentIdForColor = null;

/**
 * Abre el modal de selector de color
 */
function openColorPickerModal(appointmentId, currentColor) {
    currentAppointmentIdForColor = appointmentId;
    const modal = document.getElementById('colorPickerModal');
    const optionsContainer = document.getElementById('colorPickerOptions');
    
    if (!modal || !optionsContainer) return;
    
    const colors = [
        { value: 'green', label: 'Confirmada', icon: 'fa-check-circle' },
        { value: 'yellow', label: 'Pendiente', icon: 'fa-clock' },
        { value: 'red', label: 'Urgencia', icon: 'fa-exclamation-triangle' },
        { value: 'blue', label: 'Revisión General', icon: 'fa-stethoscope' }
    ];
    
    optionsContainer.innerHTML = colors.map(color => {
        const isSelected = color.value === currentColor;
        return `
            <div class="color-option ${isSelected ? 'selected' : ''}" 
                 onclick="setAppointmentColor('${appointmentId}', '${color.value}')"
                 data-color="${color.value}">
                <div class="color-circle" style="background:${getColorHex(color.value)}; border-color:${getColorHex(color.value)};">
                    <i class="fa-solid ${color.icon}"></i>
                </div>
                <span class="color-label">${color.label}</span>
            </div>
        `;
    }).join('');
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de selector de color
 */
function closeColorPickerModal() {
    const modal = document.getElementById('colorPickerModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    currentAppointmentIdForColor = null;
}

/**
 * Obtiene el código hexadecimal de un color
 */
function getColorHex(color) {
    const colorMap = {
        'green': '#4CAF50',
        'yellow': '#FFC107',
        'red': '#F44336',
        'blue': '#2196F3'
    };
    return colorMap[color] || colorMap['blue'];
}

/**
 * Establece el color de una cita
 */
function setAppointmentColor(appointmentId, color) {
    let mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    const appointment = mockAppointments.find(a => a.id === appointmentId);
    
    if (appointment) {
        appointment.statusColor = color;
        localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
        showToast('Color de cita actualizado', 'success');
        
        // Cerrar el modal
        closeColorPickerModal();
        
        // Recargar vistas
        loadWeeklyCalendar();
        loadPatients();
        loadTodayAppointments();
    }
}

/**
 * Abre el editor de historial clínico
 */
function openHistoryEditorForPatient(petId, historyId) {
    currentHistoryId = historyId;
    currentPatientId = petId;
    
    const modal = document.getElementById('historyEditorModal');
    const title = document.getElementById('historyEditorTitle');
    const form = document.getElementById('historyEditorForm');
    
    if (!modal || !form) return;
    
    if (title) {
        title.innerHTML = `<i class="fa-solid fa-file-medical"></i> ${historyId ? 'Editar' : 'Nuevo'} Historial Clínico`;
    }
    
    // Limpiar formulario
    form.reset();
    
    // Si es edición, cargar datos
    if (historyId) {
        const mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
        const history = mockHistory.find(h => h.id === historyId);
        
        if (history) {
            document.getElementById('historyTitle').value = history.nombre || '';
            document.getElementById('historyDate').value = history.fecha || '';
            document.getElementById('historyType').value = history.tipo || '';
            document.getElementById('historyWeight').value = history.peso || '';
            document.getElementById('historySymptoms').value = history.sintomas || '';
            document.getElementById('historyDiagnosis').value = history.diagnostico || '';
            document.getElementById('historyTreatment').value = history.tratamiento || '';
            document.getElementById('historyPrescription').value = history.receta || '';
            document.getElementById('historyFollowUp').value = history.controlPosterior || '';
            document.getElementById('historyNotes').value = history.observaciones || '';
        }
    } else {
        // Establecer fecha por defecto (hoy)
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('historyDate');
        if (dateInput) {
            dateInput.value = today;
            dateInput.setAttribute('max', today); // No permitir fechas futuras
        }
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el editor de historial
 */
function closeHistoryEditorModal() {
    const modal = document.getElementById('historyEditorModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    currentHistoryId = null;
}

/**
 * Abre el modal para programar cita desde el perfil del paciente
 */
function openAppointmentForPatient(petId) {
    currentPatientId = petId;
    
    const modal = document.getElementById('patientAppointmentModal');
    const form = document.getElementById('patientAppointmentForm');
    
    if (!modal || !form) return;
    
    form.reset();
    
    // Establecer fecha mínima (hoy)
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('appointmentDateFromPatient');
    if (dateInput) {
        dateInput.setAttribute('min', today);
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de programación de cita
 */
function closePatientAppointmentModal() {
    const modal = document.getElementById('patientAppointmentModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Abre el modal para enviar notificación
 */
function openSendNotificationForPatient(petId) {
    currentPatientId = petId;
    
    const modal = document.getElementById('sendNotificationModal');
    const form = document.getElementById('sendNotificationForm');
    
    if (!modal || !form) return;
    
    form.reset();
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de notificación
 */
function closeSendNotificationModal() {
    const modal = document.getElementById('sendNotificationModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Elimina un historial desde el perfil del paciente
 */
function deleteHistoryFromPatient(historyId) {
    if (!confirm('¿Está seguro de eliminar este historial clínico?')) return;
    
    let mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    mockHistory = mockHistory.filter(h => h.id !== historyId);
    localStorage.setItem('vetuni:mockHistory', JSON.stringify(mockHistory));
    
    showToast('Historial eliminado', 'success');
    
    // Recargar tab de historial
    if (currentPatientId) {
        loadPatientHistoryTab(currentPatientId, mockHistory);
    }
    
    loadRecentHistories();
}

/**
 * Ver una cita en el calendario
 */
function viewAppointmentInCalendar(appointmentId) {
    closePatientDetailModal();
    // Scroll al calendario y destacar la cita
    const calendarContainer = document.getElementById('weeklyCalendar');
    if (calendarContainer) {
        calendarContainer.scrollIntoView({ behavior: 'smooth' });
        showToast('Busca la cita en el calendario semanal', 'info');
    }
}

// Configurar formularios al cargar
document.addEventListener('DOMContentLoaded', () => {
    // Formulario de historial clínico
    const historyForm = document.getElementById('historyEditorForm');
    if (historyForm) {
        historyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveHistory();
        });
    }
    
    // Formulario de cita desde paciente
    const appointmentForm = document.getElementById('patientAppointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveAppointmentFromPatient();
        });
    }
    
    // Formulario de notificación
    const notificationForm = document.getElementById('sendNotificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendNotificationToOwner();
        });
    }
});

/**
 * Guarda un historial clínico
 */
function saveHistory() {
    const title = document.getElementById('historyTitle').value.trim();
    const date = document.getElementById('historyDate').value;
    const type = document.getElementById('historyType').value;
    const weight = document.getElementById('historyWeight').value.trim();
    const symptoms = document.getElementById('historySymptoms').value.trim();
    const diagnosis = document.getElementById('historyDiagnosis').value.trim();
    const treatment = document.getElementById('historyTreatment').value.trim();
    const prescription = document.getElementById('historyPrescription').value.trim();
    const followUp = document.getElementById('historyFollowUp').value.trim();
    const notes = document.getElementById('historyNotes').value.trim();
    
    // Solo validar campos básicos requeridos
    if (!title || !date || !type) {
        showToast('Por favor, completa los campos básicos requeridos (Título, Fecha y Tipo)', 'error');
        return;
    }
    
    let mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    
    if (currentHistoryId) {
        // Editar
        const index = mockHistory.findIndex(h => h.id === currentHistoryId);
        if (index !== -1) {
            mockHistory[index] = {
                ...mockHistory[index],
                nombre: title,
                fecha: date,
                tipo: type,
                peso: weight || undefined,
                sintomas: symptoms || undefined,
                diagnostico: diagnosis || undefined,
                tratamiento: treatment || undefined,
                receta: prescription || undefined,
                controlPosterior: followUp || undefined,
                observaciones: notes || undefined,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Nuevo - por defecto habilitado (enabled = 1)
        const newHistory = {
            id: `hist-${Date.now()}`,
            petId: currentPatientId,
            nombre: title,
            fecha: date,
            tipo: type,
            peso: weight || undefined,
            sintomas: symptoms || undefined,
            diagnostico: diagnosis || undefined,
            tratamiento: treatment || undefined,
            receta: prescription || undefined,
            controlPosterior: followUp || undefined,
            observaciones: notes || undefined,
            enabled: 1, // Habilitado por defecto
            createdAt: new Date().toISOString()
        };
        mockHistory.push(newHistory);
    }
    
    localStorage.setItem('vetuni:mockHistory', JSON.stringify(mockHistory));
    showToast(`Historial ${currentHistoryId ? 'actualizado' : 'creado'} correctamente`, 'success');
    
    closeHistoryEditorModal();
    
    // Recargar tabs
    if (currentPatientId) {
        loadPatientDetails(currentPatientId);
    }
    loadRecentHistories();
}

/**
 * Alterna el estado habilitado/deshabilitado de un historial (borrado lógico)
 */
function toggleHistoryStatus(historyId, currentStatus) {
    let mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    const history = mockHistory.find(h => h.id === historyId);
    
    if (!history) {
        showToast('Historial no encontrado', 'error');
        return;
    }
    
    // Cambiar estado (0 = deshabilitado, 1 = habilitado)
    history.enabled = currentStatus === 1 ? 0 : 1;
    history.updatedAt = new Date().toISOString();
    
    if (currentStatus === 1) {
        history.disabledAt = new Date().toISOString();
    } else {
        delete history.disabledAt;
    }
    
    localStorage.setItem('vetuni:mockHistory', JSON.stringify(mockHistory));
    showToast(`Historial ${history.enabled === 1 ? 'habilitado' : 'deshabilitado'} correctamente`, 'success');
    
    // Recargar tab de historial
    if (currentPatientId) {
        loadPatientHistoryTab(currentPatientId, mockHistory);
    }
    loadRecentHistories();
}

/**
 * Elimina un historial desde el perfil del paciente
 */
function deleteHistoryFromPatient(historyId) {
    // Usar borrado lógico en lugar de eliminar
    let mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    const history = mockHistory.find(h => h.id === historyId);
    
    if (!history) return;
    
    if (history.enabled === 0) {
        // Si ya está deshabilitado, preguntar si quiere habilitarlo
        if (confirm('Este historial está deshabilitado. ¿Desea habilitarlo?')) {
            toggleHistoryStatus(historyId, 0);
        }
    } else {
        // Si está habilitado, preguntar si quiere deshabilitarlo
        if (confirm('¿Está seguro de deshabilitar este historial? El cliente ya no podrá verlo, pero permanecerá en el sistema.')) {
            toggleHistoryStatus(historyId, 1);
        }
    }
}

/**
 * Guarda una cita programada desde el perfil del paciente
 */
function saveAppointmentFromPatient() {
    const service = document.getElementById('appointmentServiceFromPatient').value;
    const date = document.getElementById('appointmentDateFromPatient').value;
    const time = document.getElementById('appointmentTimeFromPatient').value;
    const priority = document.getElementById('appointmentPriorityFromPatient').value;
    const notes = document.getElementById('appointmentNotesFromPatient').value.trim();
    
    if (!service || !date || !time || !priority) {
        showToast('Por favor, completa los campos requeridos', 'error');
        return;
    }
    
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const pet = mockPets.find(p => p.id === currentPatientId);
    
    const getModuleByService = (service) => {
        const modules = {
            'Radiografía': 'Módulo de Radiología',
            'Laboratorio': 'Módulo de Laboratorio',
            'Ecografía': 'Módulo de Ecografía',
            'Cirugía': 'Quirófano',
            'Consulta general': 'Consultorio General',
            'Vacunación': 'Consultorio de Vacunación',
            'Control post-operatorio': 'Consultorio de Control',
            'Desparasitación': 'Consultorio General'
        };
        return modules[service] || 'Consultorio General';
    };
    
    const appointment = {
        id: `appt-${Date.now()}`,
        petId: currentPatientId,
        petName: pet ? pet.name : 'Mascota',
        service: service,
        priority: priority,
        date: date,
        time: time,
        notes: notes || 'Sin notas adicionales',
        status: 'CONFIRMADA', // La cita programada por el veterinario está confirmada por defecto
        module: getModuleByService(service),
        createdAt: new Date().toISOString(),
        createdBy: 'VETERINARIAN'
    };
    
    let mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    mockAppointments.push(appointment);
    localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
    
    showToast('Cita programada correctamente', 'success');
    closePatientAppointmentModal();
    
    // Recargar tabs
    if (currentPatientId) {
        loadPatientDetails(currentPatientId);
    }
    loadWeeklyCalendar();
    loadTodayAppointments();
    loadStatistics();
}

/**
 * Envía una notificación al dueño del paciente
 */
function sendNotificationToOwner() {
    const title = document.getElementById('notificationTitleToSend').value.trim();
    const message = document.getElementById('notificationMessageToSend').value.trim();
    const priority = document.getElementById('notificationPriorityToSend').value;
    
    if (!title || !message) {
        showToast('Por favor, completa los campos requeridos', 'error');
        return;
    }
    
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    
    const pet = mockPets.find(p => p.id === currentPatientId);
    const owner = mockUsers.find(u => u.pets && u.pets.includes(currentPatientId));
    
    if (!owner) {
        showToast('No se encontró el dueño del paciente', 'error');
        return;
    }
    
    let clientNotifications = JSON.parse(localStorage.getItem('vetuni:clientNotifications') || '[]');
    
    const notification = {
        id: `notif-client-${Date.now()}`,
        userId: owner.id,
        petId: currentPatientId,
        petName: pet ? pet.name : 'Mascota',
        title: title,
        message: message,
        description: message,
        type: 'VETERINARIAN_MESSAGE',
        priority: priority,
        status: 'UNREAD',
        createdAt: new Date().toISOString()
    };
    
    clientNotifications.push(notification);
    localStorage.setItem('vetuni:clientNotifications', JSON.stringify(clientNotifications));
    
    showToast('Notificación enviada al dueño', 'success');
    closeSendNotificationModal();
    
    // Recargar tab de notificaciones
    if (currentPatientId) {
        loadPatientNotificationsTab(currentPatientId, mockUsers);
    }
}

// Hacer funciones globales
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;
window.goToToday = goToToday;
window.handleCalendarAppointment = handleCalendarAppointment;
window.openColorPickerModal = openColorPickerModal;
window.closeColorPickerModal = closeColorPickerModal;
window.setAppointmentColor = setAppointmentColor;
window.openPatientDetail = openPatientDetail;
window.openPatientHistory = openPatientDetail;
window.openPatientSearch = openPatientSearch;
window.closePatientSearchModal = closePatientSearchModal;
window.closePatientDetailModal = closePatientDetailModal;
window.switchPatientTab = switchPatientTab;
window.openHistoryEditorForPatient = openHistoryEditorForPatient;
window.closeHistoryEditorModal = closeHistoryEditorModal;
window.deleteHistoryFromPatient = deleteHistoryFromPatient;
window.toggleHistoryStatus = toggleHistoryStatus;
window.openAppointmentForPatient = openAppointmentForPatient;
/**
 * Abre el modal para crear una nueva cita desde el botón "+ Nueva"
 */
function openCreateAppointment() {
    const modal = document.getElementById('createAppointmentModal');
    if (!modal) {
        showToast('Error al abrir el formulario de cita', 'error');
        return;
    }
    
    // Cargar lista de mascotas
    loadPetsForCreateAppointment();
    
    // Establecer fecha mínima como hoy
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('createAppointmentDate');
    if (dateInput) {
        dateInput.min = today;
        dateInput.value = today;
    }
    
    // Limpiar formulario
    const form = document.getElementById('createAppointmentForm');
    if (form) {
        form.reset();
        if (dateInput) dateInput.value = today;
    }
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de crear cita
 */
function closeCreateAppointmentModal() {
    const modal = document.getElementById('createAppointmentModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Carga la lista de mascotas en el selector del modal de crear cita
 */
function loadPetsForCreateAppointment() {
    const select = document.getElementById('createAppointmentPet');
    if (!select) return;
    
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    
    // Limpiar opciones (excepto la primera)
    select.innerHTML = '<option value="">Selecciona una mascota</option>';
    
    // Agregar mascotas
    mockPets.forEach(pet => {
        const owner = mockUsers.find(u => u.pets && u.pets.includes(pet.id));
        const ownerName = owner ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() : 'Sin dueño';
        const option = document.createElement('option');
        option.value = pet.id;
        option.textContent = `${pet.name} (${pet.species}) - ${ownerName}`;
        select.appendChild(option);
    });
    
    if (mockPets.length === 0) {
        select.innerHTML = '<option value="">No hay mascotas registradas</option>';
        select.disabled = true;
    }
}

/**
 * Guarda una nueva cita creada desde el modal de crear cita
 */
function saveCreateAppointment() {
    const petId = document.getElementById('createAppointmentPet').value;
    const service = document.getElementById('createAppointmentService').value;
    const date = document.getElementById('createAppointmentDate').value;
    const time = document.getElementById('createAppointmentTime').value;
    const priority = document.getElementById('createAppointmentPriority').value;
    const notes = document.getElementById('createAppointmentNotes').value.trim();
    
    // Validar campos requeridos
    if (!petId || !service || !date || !time || !priority) {
        showToast('Por favor, completa todos los campos requeridos', 'error');
        return;
    }
    
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const pet = mockPets.find(p => p.id === petId);
    const owner = mockUsers.find(u => u.pets && u.pets.includes(petId));
    
    if (!pet) {
        showToast('Mascota no encontrada', 'error');
        return;
    }
    
    const getModuleByService = (service) => {
        const modules = {
            'Radiografía': 'Módulo de Radiología',
            'Laboratorio': 'Módulo de Laboratorio',
            'Ecografía': 'Módulo de Ecografía',
            'Cirugía': 'Quirófano',
            'Consulta general': 'Consultorio General',
            'Vacunación': 'Consultorio de Vacunación',
            'Control post-operatorio': 'Consultorio de Control',
            'Desparasitación': 'Consultorio General'
        };
        return modules[service] || 'Consultorio General';
    };
    
    const appointment = {
        id: `appt-${Date.now()}`,
        petId: petId,
        userId: owner ? owner.id : null,
        petName: pet.name,
        service: service,
        priority: priority,
        date: date,
        time: time,
        notes: notes || 'Sin notas adicionales',
        status: 'CONFIRMADA', // La cita creada por el veterinario está confirmada por defecto
        module: getModuleByService(service),
        createdAt: new Date().toISOString(),
        createdBy: 'VETERINARIAN'
    };
    
    let mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    mockAppointments.push(appointment);
    localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
    
    // Crear notificación para el dueño si existe
    if (owner) {
        let clientNotifications = JSON.parse(localStorage.getItem('vetuni:clientNotifications') || '[]');
        const notification = {
            id: `notif-client-${Date.now()}`,
            userId: owner.id,
            petId: petId,
            petName: pet.name,
            title: `Nueva cita programada: ${service}`,
            message: `Se ha programado una nueva cita para ${pet.name} el ${new Date(date).toLocaleDateString('es-ES')} a las ${time.substring(0, 5)}.`,
            description: `El veterinario ha programado una cita para ${pet.name}:\n\nServicio: ${service}\nFecha: ${new Date(date).toLocaleDateString('es-ES')}\nHora: ${time.substring(0, 5)}\nMódulo: ${appointment.module}${notes ? `\n\nNotas: ${notes}` : ''}`,
            type: 'APPOINTMENT_CREATED',
            priority: priority,
            status: 'UNREAD',
            createdAt: new Date().toISOString()
        };
        clientNotifications.push(notification);
        localStorage.setItem('vetuni:clientNotifications', JSON.stringify(clientNotifications));
    }
    
    showToast('Cita creada correctamente', 'success');
    closeCreateAppointmentModal();
    
    // Recargar datos
    loadWeeklyCalendar();
    loadTodayAppointments();
    loadStatistics();
}

// Exponer funciones globalmente
window.openCreateAppointment = openCreateAppointment;
window.closeCreateAppointmentModal = closeCreateAppointmentModal;
window.saveCreateAppointment = saveCreateAppointment;

/**
 * Abre el modal para editar la información de una mascota
 */
function openEditPetInfo(petId) {
    const modal = document.getElementById('editPetInfoModal');
    if (!modal) {
        showToast('Error al abrir el formulario de edición', 'error');
        return;
    }
    
    const mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const pet = mockPets.find(p => p.id === petId);
    
    if (!pet) {
        showToast('Mascota no encontrada', 'error');
        return;
    }
    
    // Llenar formulario con datos actuales
    document.getElementById('editPetName').value = pet.name || '';
    document.getElementById('editPetSpecies').value = pet.species || '';
    document.getElementById('editPetBreed').value = pet.breed || '';
    document.getElementById('editPetGender').value = pet.gender || pet.sex || '';
    document.getElementById('editPetBirthdate').value = pet.birthdate || '';
    document.getElementById('editPetWeight').value = pet.weight || '';
    document.getElementById('editPetColor').value = pet.color || '';
    document.getElementById('editPetNotes').value = pet.notes || '';
    
    // Guardar ID de la mascota para después
    modal.dataset.petId = petId;
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de edición de información de mascota
 */
function closeEditPetInfoModal() {
    const modal = document.getElementById('editPetInfoModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        // Limpiar datos
        delete modal.dataset.petId;
    }
}

/**
 * Guarda los cambios en la información de la mascota
 */
function savePetInfo() {
    const modal = document.getElementById('editPetInfoModal');
    const petId = modal ? modal.dataset.petId : null;
    
    if (!petId) {
        showToast('Error: No se pudo identificar la mascota', 'error');
        return;
    }
    
    const name = document.getElementById('editPetName').value.trim();
    const species = document.getElementById('editPetSpecies').value;
    const breed = document.getElementById('editPetBreed').value.trim();
    const gender = document.getElementById('editPetGender').value;
    const birthdate = document.getElementById('editPetBirthdate').value;
    const weight = document.getElementById('editPetWeight').value.trim();
    const color = document.getElementById('editPetColor').value.trim();
    const notes = document.getElementById('editPetNotes').value.trim();
    
    // Validar campos requeridos
    if (!name || !species) {
        showToast('Por favor, completa los campos requeridos (Nombre y Especie)', 'error');
        return;
    }
    
    let mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    const petIndex = mockPets.findIndex(p => p.id === petId);
    
    if (petIndex === -1) {
        showToast('Mascota no encontrada', 'error');
        return;
    }
    
    // Actualizar información
    mockPets[petIndex] = {
        ...mockPets[petIndex],
        name: name,
        species: species,
        breed: breed || undefined,
        gender: gender || undefined,
        sex: gender || mockPets[petIndex].sex, // Mantener compatibilidad
        birthdate: birthdate || undefined,
        weight: weight || undefined,
        color: color || undefined,
        notes: notes || undefined,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('vetuni:mockPets', JSON.stringify(mockPets));
    showToast('Información de la mascota actualizada correctamente', 'success');
    
    closeEditPetInfoModal();
    
    // Recargar información del paciente si el modal está abierto
    if (currentPatientId === petId) {
        const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
        const updatedPet = mockPets[petIndex];
        loadPatientInfoTab(updatedPet, mockUsers);
    }
    
    // Recargar lista de pacientes si está abierta
    loadPatientSearchResults();
}

// Exponer funciones globalmente
window.openEditPetInfo = openEditPetInfo;
window.closeEditPetInfoModal = closeEditPetInfoModal;
window.savePetInfo = savePetInfo;

/**
 * Genera un número de factura único
 */
function generateInvoiceNumber() {
    const invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
    const lastInvoice = invoices.length > 0 ? invoices[invoices.length - 1] : null;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    if (lastInvoice && lastInvoice.invoiceNumber) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0');
        return `FAC-${year}${month}-${String(lastNumber + 1).padStart(4, '0')}`;
    }
    
    return `FAC-${year}${month}-0001`;
}

let invoiceItemCounter = 0;

/**
 * Abre el modal para crear una factura
 */
function openCreateInvoiceModal() {
    const modal = document.getElementById('createInvoiceModal');
    if (!modal) {
        showToast('Error al abrir el formulario de factura', 'error');
        return;
    }
    
    // Limpiar formulario
    invoiceItemCounter = 0;
    document.getElementById('invoiceItemsList').innerHTML = '';
    document.getElementById('invoiceClientId').value = '';
    document.getElementById('invoiceObservations').value = '';
    updateInvoiceTotals();
    
    // Cargar clientes
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const clients = mockUsers.filter(u => {
        const role = String(u.role || '').toUpperCase();
        return role.includes('CLIENTE') || role.includes('OWNER') || role.includes('DUENO') || !role.includes('VETERINARIO') && !role.includes('ADMIN');
    });
    
    const clientSelect = document.getElementById('invoiceClientId');
    clientSelect.innerHTML = '<option value="">Selecciona el cliente</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id || client.email;
        option.textContent = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email;
        option.dataset.clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email;
        clientSelect.appendChild(option);
    });
    
    // Agregar primer ítem por defecto
    addInvoiceItem();
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}


/**
 * Lista de servicios disponibles con precios base
 */
const AVAILABLE_SERVICES = [
    { id: 'consulta-general', name: 'Consulta general', basePrice: 30.00 },
    { id: 'desparasitacion', name: 'Desparasitación', basePrice: 25.00 },
    { id: 'bano-medicado', name: 'Baño medicado', basePrice: 35.00 },
    { id: 'urgencias', name: 'Urgencias', basePrice: 50.00 },
    { id: 'vacunacion', name: 'Vacunación', basePrice: 20.00 },
    { id: 'cirugia', name: 'Cirugía', basePrice: 150.00 },
    { id: 'radiografia', name: 'Radiografía', basePrice: 45.00 },
    { id: 'laboratorio', name: 'Laboratorio', basePrice: 40.00 },
    { id: 'ecografia', name: 'Ecografía', basePrice: 60.00 },
    { id: 'control-post-operatorio', name: 'Control post-operatorio', basePrice: 25.00 }
];

/**
 * Carga productos del catálogo desde localStorage
 */
function loadCatalogProducts() {
    // Intentar cargar desde el script del catálogo si está disponible
    if (typeof MOCK_PRODUCTS !== 'undefined' && Array.isArray(MOCK_PRODUCTS)) {
        return MOCK_PRODUCTS.filter(p => p.disponibleParaVenta && p.stockActual > 0);
    }
    
    // Si no está disponible, intentar desde localStorage
    const storedProducts = localStorage.getItem('vetuni:mockProducts');
    if (storedProducts) {
        try {
            const products = JSON.parse(storedProducts);
            return products.filter(p => p.disponibleParaVenta && p.stockActual > 0);
        } catch (e) {
            console.error('Error loading products:', e);
        }
    }
    
    // Retornar array vacío si no hay productos
    return [];
}

/**
 * Agrega un nuevo ítem a la factura (rediseñado)
 */
function addInvoiceItem() {
    invoiceItemCounter++;
    const itemsList = document.getElementById('invoiceItemsList');
    const products = loadCatalogProducts();
    
    const itemId = `item_${invoiceItemCounter}`;
    const itemHtml = `
        <div class="invoice-item" data-item-id="${itemId}" style="background:var(--white); padding:1.25rem; border-radius:var(--border-radius-lg); border:2px solid var(--gray-200); box-shadow:var(--shadow-sm);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h4 style="color:var(--gray-900); font-size:1rem; font-weight:600;">
                    <i class="fa-solid fa-list-ul" style="color:var(--primary-color); margin-right:0.5rem;"></i>
                    Ítem #${invoiceItemCounter}
                </h4>
                <button type="button" onclick="removeInvoiceItem('${itemId}')" style="background:var(--gray-200); color:var(--gray-700); border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s ease;" onmouseover="this.style.background='var(--error-color)'; this.style.color='white';" onmouseout="this.style.background='var(--gray-200)'; this.style.color='var(--gray-700)';" title="Eliminar ítem">
                    <i class="fa-solid fa-times" style="font-size:0.85rem;"></i>
                </button>
            </div>
            
            <!-- Tipo de ítem -->
            <div class="input-group" style="margin-bottom:1rem;">
                <label style="display:block; margin-bottom:0.5rem; color:var(--gray-700); font-weight:600; font-size:0.9rem;">
                    <i class="fa-solid fa-tag" style="color:var(--primary-color); margin-right:0.25rem;"></i>
                    Tipo de ítem
                </label>
                <div class="input-container select-container">
                    <select class="invoice-item-type" required onchange="handleInvoiceItemTypeChange('${itemId}', this.value)">
                        <option value="">Selecciona el tipo</option>
                        <option value="service">Servicio</option>
                        <option value="product">Producto</option>
                    </select>
                    <div class="input-underline"></div>
                </div>
            </div>
            
            <!-- Nombre del ítem (servicio o producto) -->
            <div class="input-group invoice-item-name-container" style="margin-bottom:1rem; display:none;">
                <label style="display:block; margin-bottom:0.5rem; color:var(--gray-700); font-weight:600; font-size:0.9rem;">
                    <i class="fa-solid fa-box" style="color:var(--primary-color); margin-right:0.25rem;"></i>
                    Nombre del ítem
                </label>
                <div class="input-container select-container">
                    <select class="invoice-item-name" required onchange="handleInvoiceItemNameChange('${itemId}', this.value)">
                        <option value="">Selecciona un ítem</option>
                        <!-- Se llenará dinámicamente según el tipo -->
                    </select>
                    <div class="input-underline"></div>
                </div>
            </div>
            
            <!-- Cantidad y Precio -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                <div class="input-group">
                    <label style="display:block; margin-bottom:0.5rem; color:var(--gray-700); font-weight:600; font-size:0.9rem;">
                        <i class="fa-solid fa-hashtag" style="color:var(--primary-color); margin-right:0.25rem;"></i>
                        Cantidad
                    </label>
                    <div class="input-container">
                        <input type="number" class="invoice-item-quantity" placeholder="Cantidad" min="1" step="1" value="1" required onchange="updateInvoiceTotals(); updateInvoiceItemTotal('${itemId}');">
                        <div class="input-underline"></div>
                    </div>
                </div>
                <div class="input-group">
                    <label style="display:block; margin-bottom:0.5rem; color:var(--gray-700); font-weight:600; font-size:0.9rem;">
                        <i class="fa-solid fa-dollar-sign" style="color:var(--primary-color); margin-right:0.25rem;"></i>
                        Precio unitario
                    </label>
                    <div class="input-container">
                        <input type="number" class="invoice-item-price" placeholder="0.00" min="0" step="0.01" value="0" required onchange="updateInvoiceTotals(); updateInvoiceItemTotal('${itemId}');">
                        <div class="input-underline"></div>
                    </div>
                </div>
            </div>
            
            <!-- Total del ítem -->
            <div class="input-group" style="margin-bottom:1rem;">
                <label style="display:block; margin-bottom:0.5rem; color:var(--gray-700); font-weight:600; font-size:0.9rem;">
                    <i class="fa-solid fa-calculator" style="color:var(--primary-color); margin-right:0.25rem;"></i>
                    Total del ítem
                </label>
                <div class="input-container">
                    <input type="text" class="invoice-item-total" placeholder="0.00" readonly style="background:var(--gray-100); font-weight:600; font-size:1.1rem; color:var(--primary-color);">
                    <div class="input-underline"></div>
                </div>
            </div>
            
            <!-- Descripción opcional -->
            <div class="input-group">
                <label style="display:block; margin-bottom:0.5rem; color:var(--gray-700); font-weight:600; font-size:0.9rem;">
                    <i class="fa-solid fa-comment" style="color:var(--gray-500); margin-right:0.25rem;"></i>
                    Descripción (opcional)
                </label>
                <div class="input-container">
                    <textarea class="invoice-item-description" placeholder="Agregar descripción adicional si es necesario" rows="2"></textarea>
                    <div class="input-underline"></div>
                </div>
            </div>
        </div>
    `;
    
    itemsList.insertAdjacentHTML('beforeend', itemHtml);
    updateInvoiceTotals();
}

/**
 * Maneja el cambio de tipo de ítem (servicio/producto)
 */
function handleInvoiceItemTypeChange(itemId, type) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) return;
    
    const nameContainer = item.querySelector('.invoice-item-name-container');
    const nameSelect = item.querySelector('.invoice-item-name');
    const priceInput = item.querySelector('.invoice-item-price');
    
    if (!type) {
        nameContainer.style.display = 'none';
        nameSelect.innerHTML = '<option value="">Selecciona un ítem</option>';
        priceInput.value = '0';
        updateInvoiceItemTotal(itemId);
        return;
    }
    
    nameContainer.style.display = 'block';
    nameSelect.innerHTML = '<option value="">Selecciona un ítem</option>';
    priceInput.value = '0';
    
    if (type === 'service') {
        // Cargar servicios
        AVAILABLE_SERVICES.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name;
            option.dataset.price = service.basePrice;
            nameSelect.appendChild(option);
        });
    } else if (type === 'product') {
        // Cargar productos del catálogo
        const products = loadCatalogProducts();
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            const presentation = product.pesoEnKg ? `${product.pesoEnKg}kg` : product.tamanio || product.presentacion || '';
            option.textContent = `${product.nombre}${presentation ? ` - ${presentation}` : ''}`;
            option.dataset.price = product.precio || 0;
            nameSelect.appendChild(option);
        });
    }
    
    updateInvoiceItemTotal(itemId);
}

/**
 * Maneja el cambio de nombre del ítem (seleccionar servicio/producto específico)
 */
function handleInvoiceItemNameChange(itemId, itemValue) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) return;
    
    const nameSelect = item.querySelector('.invoice-item-name');
    const priceInput = item.querySelector('.invoice-item-price');
    const selectedOption = nameSelect.options[nameSelect.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.price) {
        priceInput.value = parseFloat(selectedOption.dataset.price).toFixed(2);
        updateInvoiceItemTotal(itemId);
    }
}

/**
 * Actualiza el total de un ítem específico
 */
function updateInvoiceItemTotal(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) return;
    
    const quantity = parseFloat(item.querySelector('.invoice-item-quantity')?.value || 0);
    const price = parseFloat(item.querySelector('.invoice-item-price')?.value || 0);
    const total = quantity * price;
    
    const totalInput = item.querySelector('.invoice-item-total');
    if (totalInput) {
        totalInput.value = `$${total.toFixed(2)}`;
    }
    
    updateInvoiceTotals();
}

/**
 * Elimina un ítem de la factura
 */
function removeInvoiceItem(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (item) {
        item.remove();
        updateInvoiceTotals();
    }
}

/**
 * Actualiza los totales de la factura
 */
function updateInvoiceTotals() {
    const items = document.querySelectorAll('.invoice-item');
    let subtotal = 0;
    
    items.forEach(item => {
        const quantity = parseFloat(item.querySelector('.invoice-item-quantity')?.value || 0);
        const price = parseFloat(item.querySelector('.invoice-item-price')?.value || 0);
        const total = quantity * price;
        subtotal += total;
        
        // El total ya se actualiza en updateInvoiceItemTotal
    });
    
    const tax = subtotal * 0.19; // 19% de impuestos
    const total = subtotal + tax;
    
    document.getElementById('invoiceSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('invoiceTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('invoiceTotal').textContent = `$${total.toFixed(2)}`;
}

/**
 * Cierra el modal de creación de factura
 */
function closeCreateInvoiceModal() {
    const modal = document.getElementById('createInvoiceModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Guarda la factura
 */
function saveInvoice() {
    const clientId = document.getElementById('invoiceClientId').value;
    const observations = document.getElementById('invoiceObservations').value.trim();
    
    if (!clientId) {
        showToast('Por favor, selecciona el cliente', 'error');
        return;
    }
    
    const items = [];
    const itemElements = document.querySelectorAll('.invoice-item');
    
    if (itemElements.length === 0) {
        showToast('Debes agregar al menos un ítem a la factura', 'error');
        return;
    }
    
    let hasError = false;
    itemElements.forEach(item => {
        const type = item.querySelector('.invoice-item-type')?.value;
        const nameSelect = item.querySelector('.invoice-item-name');
        const selectedNameOption = nameSelect?.options[nameSelect.selectedIndex];
        const itemName = selectedNameOption ? selectedNameOption.textContent : '';
        const quantity = parseFloat(item.querySelector('.invoice-item-quantity')?.value || 0);
        const price = parseFloat(item.querySelector('.invoice-item-price')?.value || 0);
        const description = item.querySelector('.invoice-item-description')?.value.trim() || '';
        
        if (!type || !nameSelect?.value || quantity <= 0 || price <= 0) {
            hasError = true;
            return;
        }
        
        items.push({
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            name: itemName,
            description: description || itemName,
            quantity: quantity,
            unitPrice: price,
            total: quantity * price
        });
    });
    
    if (hasError) {
        showToast('Por favor, completa todos los campos de los ítems', 'error');
        return;
    }
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;
    
    // Obtener información del cliente
    const mockUsers = JSON.parse(localStorage.getItem('vetuni:mockUsers') || '[]');
    const client = mockUsers.find(u => (u.id || u.email) === clientId);
    const clientSelect = document.getElementById('invoiceClientId');
    const selectedClientOption = clientSelect.options[clientSelect.selectedIndex];
    
    // Obtener información del veterinario actual
    const session = window.apiService?.getCurrentUser?.();
    const veterinarianProfile = JSON.parse(localStorage.getItem('vetuni:veterinarianProfile') || '{}');
    
    // Crear factura
    const invoice = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber: generateInvoiceNumber(),
        clientId: clientId,
        clientName: selectedClientOption?.dataset.clientName || `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || client?.email || 'Cliente',
        createdBy: session?.email || session?.id || 'veterinarian',
        createdByRole: 'veterinarian',
        createdByName: veterinarianProfile.firstName && veterinarianProfile.lastName 
            ? `${veterinarianProfile.firstName} ${veterinarianProfile.lastName}`.trim()
            : `${session?.firstName || ''} ${session?.lastName || ''}`.trim() || 'Veterinario',
        createdAt: new Date().toISOString(),
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'pending',
        observations: observations || undefined,
        paymentDate: undefined,
        cancelledAt: undefined,
        cancellationReason: undefined
    };
    
    // Guardar factura
    let invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
    invoices.push(invoice);
    localStorage.setItem('vetuni:mockInvoices', JSON.stringify(invoices));
    
    // Crear notificaciones
    createInvoiceNotifications(invoice, client);
    
    showToast('Factura creada exitosamente', 'success');
    closeCreateInvoiceModal();
}

/**
 * Crea notificaciones cuando se genera una factura
 */
function createInvoiceNotifications(invoice, client) {
    const session = window.apiService?.getCurrentUser?.();
    
    // Notificación para el cliente
    if (client) {
        let clientNotifications = JSON.parse(localStorage.getItem('vetuni:clientNotifications') || '[]');
        clientNotifications.push({
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'INVOICE_CREATED',
            title: 'Nueva Factura Disponible',
            description: `Se ha generado una nueva factura (${invoice.invoiceNumber}) por $${invoice.total.toFixed(2)}. Puedes revisarla en tu panel de facturas.`,
            date: new Date().toISOString(),
            status: 'PENDING',
            invoiceId: invoice.id,
            read: false
        });
        localStorage.setItem('vetuni:clientNotifications', JSON.stringify(clientNotifications));
    }
    
    // Notificación para empleados/admin si aplica (aquí puedes agregar lógica adicional)
    // Por ahora, las facturas del veterinario no generan notificación a admin, pero puede agregarse
}

// Exponer funciones globalmente
window.openCreateInvoiceModal = openCreateInvoiceModal;
window.closeCreateInvoiceModal = closeCreateInvoiceModal;
window.addInvoiceItem = addInvoiceItem;
window.removeInvoiceItem = removeInvoiceItem;
window.updateInvoiceTotals = updateInvoiceTotals;
window.handleInvoiceItemTypeChange = handleInvoiceItemTypeChange;
window.handleInvoiceItemNameChange = handleInvoiceItemNameChange;
window.updateInvoiceItemTotal = updateInvoiceItemTotal;
window.saveInvoice = saveInvoice;

window.openHistoryDetail = function(historyId) {
    const mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    const history = mockHistory.find(h => h.id === historyId);
    if (history) {
        openPatientDetail(history.petId);
        setTimeout(() => {
            switchPatientTab('history');
        }, 300);
    }
};
window.editHistory = function(historyId) {
    const mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    const history = mockHistory.find(h => h.id === historyId);
    if (history) {
        openPatientDetail(history.petId);
        setTimeout(() => {
            switchPatientTab('history');
            openHistoryEditorForPatient(history.petId, historyId);
        }, 300);
    }
};
window.closePatientAppointmentModal = closePatientAppointmentModal;
window.openSendNotificationForPatient = openSendNotificationForPatient;
window.closeSendNotificationModal = closeSendNotificationModal;
window.viewAppointmentInCalendar = viewAppointmentInCalendar;
window.openAppointmentDetail = openPatientDetail; // Para compatibilidad
window.openHistoryManager = function() {
    openPatientSearch();
};
window.openPostponeAppointmentModal = openPostponeAppointmentModal;
window.closePostponeAppointmentModal = closePostponeAppointmentModal;
window.savePostponedAppointment = savePostponedAppointment;
window.openCancelAppointmentModal = openCancelAppointmentModal;
window.closeCancelAppointmentModal = closeCancelAppointmentModal;
window.confirmCancelAppointment = confirmCancelAppointment;

