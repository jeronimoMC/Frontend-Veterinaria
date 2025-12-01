/**
 * ============================================
 * CLIENT PANEL - VETERINARY CLINIC
 * ============================================
 * 
 * @fileoverview Panel principal del cliente - Dashboard completo
 * @author VetUni Development Team
 * @version 1.0.0
 * 
 * Funcionalidades principales:
 * - Gestión de mascotas (registro, visualización, detalles)
 * - Sistema de citas con prioridades (4 niveles)
 * - Validación de fechas (no permite fechas pasadas)
 * - Integración con calendario para crear citas
 * - Historial médico de mascotas
 * - Notificaciones y alertas
 * - Carrito de compras (badge)
 * 
 * @requires localStorage - API del navegador
 * @requires mockAuthService - Servicio de autenticación mock
 */

// ========== INICIALIZACIÓN PRINCIPAL ==========

/**
 * Inicializa el panel del cliente cuando el DOM está listo
 * Verifica sesión, carga datos y configura todos los módulos
 */
document.addEventListener('DOMContentLoaded', () => {
    // ========== VERIFICACIÓN DE SESIÓN ==========
    const session = window.apiService?.getCurrentUser?.();
    if (!session) {
        window.location.replace('../auth/index.html');
        return;
    }

    // ========== INICIALIZACIÓN ==========
    const greeting = document.getElementById('userGreeting');
    if (greeting) {
        // Cargar perfil guardado si existe
        const savedProfile = JSON.parse(localStorage.getItem('vetuni:userProfile') || '{}');
        const displayName = savedProfile.firstName || savedProfile.nombre || session.firstName || session.nombre || 'Usuario';
        greeting.textContent = `Hola, ${displayName}`;
    }

    // Feedback visual para botones
    document.querySelectorAll('.submit-btn, .social-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.style.transform = 'translateY(-1px) scale(.99)';
            setTimeout(() => (btn.style.transform = ''), 120);
        });
    });

    // ========== UTILIDADES GENERALES ==========
    
    /**
     * Muestra una notificación toast en la pantalla
     * 
     * @param {string} message - Mensaje a mostrar
     * @param {string} [type='success'] - Tipo de notificación: 'success', 'error', 'info'
     * @returns {void}
     */
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

    /**
     * Abre un modal por su ID
     * 
     * @param {string} modalId - ID del elemento modal
     * @returns {void}
     */
    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    /**
     * Cierra un modal por su ID
     * 
     * @param {string} modalId - ID del elemento modal
     * @returns {void}
     */
    const closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    // Cerrar modales al hacer clic fuera
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // ========== REGISTRO DE MASCOTAS ==========
    const openPetModalBtn = document.getElementById('openPetModal');
    const closePetModalBtn = document.getElementById('closePetModal');
    const cancelPetBtn = document.getElementById('cancelPet');
    const savePetBtn = document.getElementById('savePet');
    const petForm = document.getElementById('petForm');
    const petPhotoInput = document.getElementById('petPhoto');
    const avatarPreview = document.getElementById('avatarPreview');

    if (openPetModalBtn) {
        openPetModalBtn.addEventListener('click', () => openModal('petModal'));
    }
    if (closePetModalBtn) {
        closePetModalBtn.addEventListener('click', () => closeModal('petModal'));
    }
    if (cancelPetBtn) {
        cancelPetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('petModal');
        });
    }

    // Preview de foto
    if (petPhotoInput && avatarPreview) {
        petPhotoInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            avatarPreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;';
            avatarPreview.appendChild(img);
        });
    }

    // Validación del formulario
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

    const validatePetForm = () => {
        const nameOk = fieldError('petName', document.getElementById('petName').value.trim() ? '' : 'Requerido');
        const speciesOk = fieldError('species', document.getElementById('species').value ? '' : 'Selecciona especie');
        const sexOk = fieldError('sex', document.getElementById('sex').value ? '' : 'Selecciona sexo');
        const birthOk = fieldError('birthdate', document.getElementById('birthdate').value ? '' : 'Fecha requerida');
        const weightVal = document.getElementById('weight').value;
        const weightOk = fieldError('weight', weightVal && Number(weightVal) > 0 ? '' : 'Peso válido requerido');
        return nameOk && speciesOk && sexOk && birthOk && weightOk;
    };

    // Almacenamiento de mascotas (cache local + backend)
    let mockPets = []; // Cache local para renderizado rápido

    // Cargar mascotas desde el backend
    const loadPetsFromBackend = async () => {
        try {
            const currentUser = apiService.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                console.warn('Usuario no autenticado, no se pueden cargar mascotas');
                return [];
            }

            const mascotas = await apiService.getMascotasByOwner(currentUser.id);
            mockPets = mascotas.map(m => ({
                id: m.id,
                name: m.nombre,
                species: m.especie,
                breed: m.raza || 'No especificada',
                sex: m.sexo,
                birthdate: m.fechaNacimiento,
                weight: m.peso,
                color: m.color || 'No especificado',
                active: m.active !== false
            }));
            
            // Guardar en cache local para renderizado rápido
            localStorage.setItem('vetuni:mockPets', JSON.stringify(mockPets));
            return mockPets;
        } catch (error) {
            console.error('Error cargando mascotas desde backend:', error);
            // Fallback a cache local si hay error
            mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
            return mockPets;
        }
    };

    const chipsContainer = document.getElementById('petChips');
    const noPets = document.getElementById('noPets');

    const refreshPetsDisplay = () => {
        if (!chipsContainer) return;
        
        // Limpiar chips existentes
        chipsContainer.innerHTML = '';
        
        // Renderizar mascotas
        mockPets.forEach(pet => {
            const chip = document.createElement('button');
            chip.className = 'tag pet-chip';
            chip.dataset.petId = pet.id;
            chip.dataset.name = pet.name;
            chip.dataset.species = pet.species;
            chip.style.cssText = 'background: var(--white); border:1px solid var(--gray-200); border-radius:999px; padding:.35rem .75rem; cursor:pointer; display:inline-flex; align-items:center; gap:.5rem;';
            
            const icon = pet.species === 'Perro' ? 'fa-dog' : 'fa-cat';
            chip.innerHTML = `
                <span class="pet-icon"><i class="fa-solid ${icon}"></i></span>
                <span class="pet-name">${pet.name}</span>
            `;
            
            chip.addEventListener('click', () => openPetDetail(pet));
        chipsContainer.appendChild(chip);
        });

        // Mostrar/ocultar estado vacío
        if (noPets) {
            noPets.style.display = mockPets.length === 0 ? 'block' : 'none';
        }
    };

    const appendPetChip = async (petData) => {
        try {
            const currentUser = apiService.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                showToast('Error: Usuario no autenticado', 'error');
                return;
            }

            // Crear mascota en el backend
            const newPet = await apiService.createMascota({
                name: petData.name,
                species: petData.species,
                breed: petData.breed || 'No especificada',
                sex: petData.sex,
                birthdate: petData.birthdate,
                weight: petData.weight,
                color: petData.color || 'No especificado',
                duenioId: currentUser.id
            });

            // Agregar a cache local
            mockPets.push({
                id: newPet.id,
                name: newPet.nombre,
                species: newPet.especie,
                breed: newPet.raza || 'No especificada',
                sex: newPet.sexo,
                birthdate: newPet.fechaNacimiento,
                weight: newPet.peso,
                color: newPet.color || 'No especificado',
                active: true
            });

            localStorage.setItem('vetuni:mockPets', JSON.stringify(mockPets));
            refreshPetsDisplay();
        } catch (error) {
            console.error('Error creando mascota:', error);
            showToast('Error al crear la mascota: ' + (error.message || 'Error desconocido'), 'error');
        }
    };

    // Guardar mascota
    if (savePetBtn) {
        savePetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!validatePetForm()) return;

            const petData = {
                name: document.getElementById('petName').value.trim(),
                species: document.getElementById('species').value,
                breed: document.getElementById('breed').value.trim() || 'No especificada',
                sex: document.getElementById('sex').value,
                birthdate: document.getElementById('birthdate').value,
                weight: parseFloat(document.getElementById('weight').value),
                color: document.getElementById('color').value.trim() || 'No especificado'
            };

            appendPetChip(petData);
            closeModal('petModal');
            petForm.reset();
            if (avatarPreview) {
            avatarPreview.innerHTML = '<i class="fa-solid fa-image"></i>';
            }
            showToast('Mascota registrada correctamente', 'success');
        });
    }

    // Cargar mascotas al iniciar
    loadPetsFromBackend().then(() => {
        refreshPetsDisplay();
    });

    // ========== DETALLE DE MASCOTA ==========
    const closePetDetail = document.getElementById('closePetDetail');

    const openPetDetail = (pet) => {
        const petDetailModal = document.getElementById('petDetailModal');
        if (!petDetailModal) return;

        // Llenar información
        const detailName = document.getElementById('detailName');
        const detailMeta = document.getElementById('detailMeta');
        const detailInfo = document.getElementById('detailInfo');
        const detailStatus = document.getElementById('detailStatus');
        const detailHistory = document.getElementById('detailHistory');

        if (detailName) {
            detailName.textContent = pet.name;
        }
        if (detailMeta) {
            detailMeta.innerHTML = `${pet.species} • ${pet.breed} • ${pet.sex}`;
        }
        if (detailInfo) {
            const age = pet.birthdate ? Math.floor((new Date() - new Date(pet.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
            detailInfo.innerHTML = `
                <div><strong>Edad:</strong> ${age} años</div>
                <div><strong>Peso:</strong> ${pet.weight} kg</div>
                <div><strong>Color:</strong> ${pet.color}</div>
                <div><strong>Fecha de nacimiento:</strong> ${pet.birthdate || 'No especificada'}</div>
            `;
        }
        if (detailStatus) {
            detailStatus.innerHTML = '<div style="color:var(--success-color);"><i class="fa-solid fa-check-circle"></i> Activa</div>';
        }
        if (detailHistory) {
            // Cargar historiales habilitados de esta mascota
            const petHistories = mockHistory
                .filter(h => h.petId === pet.id && (h.enabled === undefined || h.enabled === 1))
                .sort((a, b) => {
                    const dateA = new Date(a.fecha || a.createdAt || 0);
                    const dateB = new Date(b.fecha || b.createdAt || 0);
                    return dateB - dateA;
                })
                .slice(0, 3); // Mostrar solo los 3 más recientes
            
            if (petHistories.length === 0) {
                detailHistory.innerHTML = '<div style="color:var(--gray-600);">No hay historial médico registrado aún.</div>';
            } else {
                detailHistory.innerHTML = petHistories.map(hist => {
                    const date = hist.fecha || (hist.createdAt ? new Date(hist.createdAt).toLocaleDateString('es-ES') : 'N/A');
                    const type = hist.tipo || 'Consulta';
                    
                    return `
                        <div style="background:var(--gray-50); padding:0.75rem; border-radius:8px; margin-bottom:0.5rem; border-left:3px solid var(--primary-color);">
                            <div style="font-weight:600; color:var(--gray-900); font-size:0.9rem; margin-bottom:0.25rem;">${hist.nombre || type}</div>
                            <div style="font-size:0.8rem; color:var(--gray-600); margin-bottom:0.5rem;">${date}</div>
                            ${hist.diagnostico ? `<div style="font-size:0.85rem; color:var(--gray-700); margin-top:0.25rem;"><strong>Diagnóstico:</strong> ${hist.diagnostico.substring(0, 100)}${hist.diagnostico.length > 100 ? '...' : ''}</div>` : ''}
                            ${hist.tratamiento ? `<div style="font-size:0.85rem; color:var(--gray-700); margin-top:0.25rem;"><strong>Tratamiento:</strong> ${hist.tratamiento.substring(0, 100)}${hist.tratamiento.length > 100 ? '...' : ''}</div>` : ''}
                        </div>
                    `;
                }).join('');
            }
        }

        // Configurar botón de historial completo
        const openFullHistoryBtn = document.getElementById('openFullHistory');
        if (openFullHistoryBtn) {
            openFullHistoryBtn.onclick = () => {
                closeModal('petDetailModal');
                window.location.href = `./history.html?pet=${pet.id}`;
            };
        }

        openModal('petDetailModal');
    };

    if (closePetDetail) {
        closePetDetail.addEventListener('click', () => closeModal('petDetailModal'));
    }

    // ========== CREAR CITA ==========
    const openAppointmentModalBtn = document.getElementById('openAppointmentModal');
    const openAppointmentModalAlt = document.getElementById('openAppointmentModalAlt');
    const closeAppointmentModal = document.getElementById('closeAppointmentModal');
    const cancelAppointment = document.getElementById('cancelAppointment');
    const saveAppointment = document.getElementById('saveAppointment');
    const appointmentForm = document.getElementById('appointmentForm');

    if (openAppointmentModalBtn) {
        openAppointmentModalBtn.addEventListener('click', () => openModal('appointmentModal'));
    }
    if (openAppointmentModalAlt) {
        openAppointmentModalAlt.addEventListener('click', () => openModal('appointmentModal'));
    }
    if (closeAppointmentModal) {
        closeAppointmentModal.addEventListener('click', () => closeModal('appointmentModal'));
    }
    if (cancelAppointment) {
        cancelAppointment.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('appointmentModal');
        });
    }

    // Actualizar lista de mascotas en el select de citas
    const updateAppointmentPetSelect = () => {
        const select = document.getElementById('appointmentPet');
        if (!select) return;
        
        // Guardar valor seleccionado
        const currentValue = select.value;
        
        // Limpiar opciones (excepto la primera)
        select.innerHTML = '<option value="">Mascota</option>';
        
        // Agregar mascotas
        mockPets.forEach(pet => {
            const option = document.createElement('option');
            option.value = pet.id;
            option.textContent = `${pet.name} (${pet.species})`;
            select.appendChild(option);
        });
        
        // Restaurar valor si existe
        if (currentValue) {
            select.value = currentValue;
        }
    };

    // Almacenamiento de citas (cache local + backend)
    let mockAppointments = []; // Cache local
    let mockHistory = []; // Cache local

    // Cargar citas desde el backend
    const loadAppointmentsFromBackend = async () => {
        try {
            const currentUser = apiService.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                console.warn('Usuario no autenticado, no se pueden cargar citas');
                return [];
            }

            // Obtener todas las mascotas del usuario
            const mascotas = await apiService.getMascotasByOwner(currentUser.id);
            const allCitas = [];

            // Obtener citas para cada mascota
            for (const mascota of mascotas) {
                try {
                    // El backend no tiene endpoint directo para citas por usuario
                    // Usaremos el endpoint de citas del día y cache local
                    const hoy = new Date().toISOString().split('T')[0];
                    const citasHoy = await apiService.getCitasDelDia(hoy);
                    allCitas.push(...citasHoy);
                } catch (error) {
                    console.warn(`Error cargando citas para mascota ${mascota.id}:`, error);
                }
            }

            // Mapear al formato esperado
            mockAppointments = allCitas.map(c => ({
                id: c.id,
                petId: c.petId,
                petName: mascotas.find(m => m.id === c.petId)?.nombre || 'Mascota',
                petSpecies: mascotas.find(m => m.id === c.petId)?.especie || 'Desconocida',
                service: c.servicioId ? 'Servicio' : 'Consulta general',
                priority: c.prioridad || 'MEDIA',
                date: c.fecha ? c.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
                time: c.hora || '10:00',
                notes: c.motivoConsulta || 'Sin notas',
                status: c.estado || 'PENDIENTE',
                module: 'Consultorio General',
                createdAt: c.createdAt || new Date().toISOString()
            }));

            localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
            return mockAppointments;
        } catch (error) {
            console.error('Error cargando citas desde backend:', error);
            // Fallback a cache local
            mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
            return mockAppointments;
        }
    };

    const saveAppointments = () => {
        localStorage.setItem('vetuni:mockAppointments', JSON.stringify(mockAppointments));
    };

    const saveHistory = () => {
        localStorage.setItem('vetuni:mockHistory', JSON.stringify(mockHistory));
    };

    // Actualizar estado de citas pasadas
    const updateAppointmentsStatus = () => {
        const now = new Date();
        let updated = false;

        mockAppointments.forEach(apt => {
            const aptDate = new Date(`${apt.date}T${apt.time}`);
            
            // Si la cita ya pasó y está pendiente, marcarla como completada
            if (apt.status === 'PENDIENTE' && aptDate < now) {
                apt.status = 'COMPLETADA';
                apt.completedAt = new Date().toISOString();
                updated = true;
                
                // Agregar al historial
                const historyEntry = {
                    id: `hist-${Date.now()}-${Math.random()}`,
                    petId: apt.petId,
                    tipo: 'CITA',
                    nombre: apt.service,
                    fecha: apt.date,
                    hora: apt.time,
                    observaciones: apt.notes,
                    modulo: apt.module,
                    createdAt: new Date().toISOString()
                };
                mockHistory.push(historyEntry);
            }
        });

        if (updated) {
            saveAppointments();
            saveHistory();
        }
    };

    // Ejecutar al cargar
    updateAppointmentsStatus();

    /**
     * Valida todos los campos del formulario de creación de citas
     * Incluye validación de fecha (no permite fechas pasadas)
     * 
     * @returns {boolean} true si todos los campos son válidos, false en caso contrario
     */
    const validateAppointmentForm = () => {
        // Validar selección de mascota
        const petOk = fieldError('appointmentPet', document.getElementById('appointmentPet').value ? '' : 'Selecciona una mascota');
        
        // Validar selección de servicio
        const serviceOk = fieldError('appointmentService', document.getElementById('appointmentService').value ? '' : 'Selecciona un servicio');
        
        // Validar selección de prioridad
        const priorityOk = fieldError('appointmentPriority', document.getElementById('appointmentPriority').value ? '' : 'Selecciona una prioridad');
        
        // Validar fecha - no permitir fechas pasadas
        const dateInput = document.getElementById('appointmentDate');
        const selectedDate = dateInput.value;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        
        let dateError = '';
        if (!selectedDate) {
            dateError = 'Fecha requerida';
        } else if (selected < today) {
            dateError = 'No puedes programar citas en fechas pasadas';
        }
        
        const dateOk = fieldError('appointmentDate', dateError);
        
        // Validar hora
        const timeOk = fieldError('appointmentTime', document.getElementById('appointmentTime').value ? '' : 'Hora requerida');
        
        return petOk && serviceOk && priorityOk && dateOk && timeOk;
    };

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

    if (saveAppointment) {
        saveAppointment.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!validateAppointmentForm()) return;

            try {
                const petId = document.getElementById('appointmentPet').value;
                const pet = mockPets.find(p => p.id === petId);
                const service = document.getElementById('appointmentService').value;
                const priority = document.getElementById('appointmentPriority').value;
                const date = document.getElementById('appointmentDate').value;
                const time = document.getElementById('appointmentTime').value;
                const notes = document.getElementById('appointmentNotes').value.trim() || 'Sin notas adicionales';

                // Obtener servicioId y disponibilidad desde el backend
                // Por ahora, creamos la cita con datos básicos
                const citaData = {
                    petId: parseInt(petId),
                    veterinarianId: null, // Se puede obtener de un selector
                    servicioId: null, // Se puede mapear desde el servicio seleccionado
                    idsDisponibilidad: [], // Se debe obtener desde agendamiento
                    motivoConsulta: notes,
                    estadoGeneralMascota: 'Normal'
                };

                const nuevaCita = await apiService.createCita(citaData);

                // Agregar a cache local
                const appointment = {
                    id: nuevaCita.id,
                    petId: parseInt(petId),
                    petName: pet ? pet.name : 'Mascota',
                    petSpecies: pet ? pet.species : 'Desconocida',
                    service: service,
                    priority: priority,
                    date: date,
                    time: time,
                    notes: notes,
                    status: nuevaCita.estado || 'PENDIENTE',
                    module: getModuleByService(service),
                    createdAt: nuevaCita.createdAt || new Date().toISOString()
                };

                mockAppointments.push(appointment);
                saveAppointments();
                refreshAppointmentsList();
                refreshUpcomingAppointments();
                closeModal('appointmentModal');
                appointmentForm.reset();
                showToast('Cita creada correctamente', 'success');
            } catch (error) {
                console.error('Error creando cita:', error);
                showToast('Error al crear la cita: ' + (error.message || 'Error desconocido'), 'error');
            }
        });
    }

    // Configurar fecha mínima (hoy) para el input de fecha
    const appointmentDateInput = document.getElementById('appointmentDate');
    if (appointmentDateInput) {
        const today = new Date().toISOString().split('T')[0];
        appointmentDateInput.setAttribute('min', today);
        
        // Validar en tiempo real
        appointmentDateInput.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                fieldError('appointmentDate', 'No puedes programar citas en fechas pasadas');
                this.value = '';
            } else {
                fieldError('appointmentDate', '');
            }
        });
    }

    // Verificar si hay parámetro de fecha en la URL (desde el calendario)
    const urlParams = new URLSearchParams(window.location.search);
    const createAppointmentDate = urlParams.get('createAppointment');
    if (createAppointmentDate) {
        // Limpiar parámetro de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Abrir modal y pre-llenar fecha
        setTimeout(() => {
            openModal('appointmentModal');
            if (appointmentDateInput) {
                appointmentDateInput.value = createAppointmentDate;
            }
        }, 300);
    }

    // Actualizar select de mascotas cuando se abre el modal
    const appointmentModal = document.getElementById('appointmentModal');
    if (appointmentModal) {
        const observer = new MutationObserver(() => {
            if (appointmentModal.classList.contains('open')) {
                updateAppointmentPetSelect();
                // Asegurar que la fecha mínima esté actualizada
                if (appointmentDateInput) {
                    const today = new Date().toISOString().split('T')[0];
                    appointmentDateInput.setAttribute('min', today);
                }
            }
        });
        observer.observe(appointmentModal, { attributes: true, attributeFilter: ['class'] });
    }

    // ========== LISTA DE CITAS ==========
    const appointmentsList = document.getElementById('appointmentsList');
    const upcomingAppointments = document.getElementById('upcomingAppointments');

    // ========== SISTEMA DE PRIORIDADES ==========
    
    /**
     * Genera el badge HTML para mostrar la prioridad de una cita
     * 
     * @param {string} priority - Nivel de prioridad: 'BAJA', 'MEDIA', 'ALTA', 'CRITICA'
     * @returns {string} HTML del badge de prioridad
     * 
     * @example
     * getPriorityBadge('ALTA'); // Retorna badge naranja con "Alta"
     */
    const getPriorityBadge = (priority) => {
        const priorities = {
            'BAJA': { text: 'Baja', color: '#4CAF50', icon: 'fa-arrow-down' },
            'MEDIA': { text: 'Media', color: '#FF9800', icon: 'fa-minus' },
            'ALTA': { text: 'Alta', color: '#FF5722', icon: 'fa-arrow-up' },
            'CRITICA': { text: 'Crítica', color: '#F44336', icon: 'fa-exclamation-triangle' }
        };
        const p = priorities[priority] || null;
        return p ? `<span style="background:${p.color}; color:white; padding:.2rem .5rem; border-radius:4px; font-size:.7rem; font-weight:600; margin-left:.5rem;">
            <i class="fa-solid ${p.icon}"></i> ${p.text}
        </span>` : '';
    };

    /**
     * Actualiza la lista de citas - Solo muestra la última cita completada
     */
    const refreshAppointmentsList = () => {
        if (!appointmentsList) return;

        appointmentsList.innerHTML = '';

        // Filtrar solo citas completadas y ordenar por fecha (más reciente primero)
        const completedAppointments = mockAppointments
            .filter(appt => appt.status === 'COMPLETADA' || appt.status === 'CONFIRMADA')
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateB - dateA; // Más reciente primero
            });

        if (completedAppointments.length === 0) {
            appointmentsList.innerHTML = '<div style="color:var(--gray-600); padding:1rem; text-align:center;">No hay citas completadas.</div>';
            return;
        }

        // Mostrar solo la última cita completada
        const lastAppointment = completedAppointments[0];
        
        const item = document.createElement('div');
        item.className = 'notif-item';
        item.style.cssText = 'background: var(--white); border:1px solid var(--gray-200); border-radius:12px; padding:.75rem; margin-bottom:.5rem;';

        const statusColors = {
            'PENDIENTE': '#FF9800',
            'CONFIRMADA': '#4CAF50',
            'COMPLETADA': '#4CAF50',
            'CANCELADA': '#F44336'
        };

        const statusColor = statusColors[lastAppointment.status] || '#757575';
        const petIcon = lastAppointment.petSpecies === 'Perro' ? 'fa-dog' : 'fa-cat';
        
        item.innerHTML = `
            <div class="notif-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem;">
                <div class="notif-title" style="display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;">
                    <i class="fa-solid ${petIcon}" style="color:var(--primary-color);"></i>
                    <strong>${lastAppointment.petName}</strong> - ${lastAppointment.service}
                    ${lastAppointment.priority ? getPriorityBadge(lastAppointment.priority) : ''}
                </div>
                <span style="background:${statusColor}; color:#fff; padding:.2rem .6rem; border-radius:999px; font-size:.75rem; font-weight:600;">
                    ${lastAppointment.status}
                </span>
            </div>
            <div style="color:var(--gray-600); font-size:.9rem; margin-bottom:.5rem;">
                ${lastAppointment.date} a las ${lastAppointment.time} • ${lastAppointment.module}
            </div>
            <div style="display:flex; gap:.5rem; justify-content:flex-end;">
                <button class="notif-toggle" data-appt-id="${lastAppointment.id}" style="background:var(--primary-color); color:#fff; border:none; padding:.4rem .8rem; border-radius:8px; cursor:pointer;">
                    Ver Detalles
                </button>
            </div>
        `;

        appointmentsList.appendChild(item);

        // Event listener para el botón de detalles
        const detailBtn = item.querySelector('[data-appt-id]');
        if (detailBtn) {
            detailBtn.addEventListener('click', () => {
                openAppointmentDetail(lastAppointment);
            });
        }
    };

    /**
     * Actualiza la lista de próximas citas
     * Solo muestra citas PENDIENTES que sean en el futuro
     */
    const refreshUpcomingAppointments = () => {
        if (!upcomingAppointments) return;

        upcomingAppointments.innerHTML = '';

        const now = new Date();
        
        // Obtener próximas 3 citas: solo PENDIENTES y en el futuro
        const upcoming = mockAppointments
            .filter(appt => {
                // Solo citas pendientes
                if (appt.status !== 'PENDIENTE') return false;
                
                // Solo citas futuras (fecha y hora en el futuro)
                const apptDateTime = new Date(`${appt.date}T${appt.time}`);
                return apptDateTime > now;
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            })
            .slice(0, 3);

        if (upcoming.length === 0) {
            upcomingAppointments.innerHTML = '<li style="background: var(--white); border:1px solid var(--gray-200); border-radius:12px; padding:.75rem; color:var(--gray-600); text-align:center;">No hay citas próximas</li>';
            return;
        }

        upcoming.forEach(appt => {
            const li = document.createElement('li');
            const date = new Date(`${appt.date}T${appt.time}`);
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const dayName = dayNames[date.getDay()];
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const time = appt.time.substring(0, 5);
            
            li.style.cssText = 'background: var(--white); border:1px solid var(--gray-200); border-radius:12px; padding:.75rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.5rem;';
            li.innerHTML = `
                <span style="display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;">
                    <strong>${appt.service}</strong> • ${appt.petName}
                    ${appt.priority ? getPriorityBadge(appt.priority) : ''}
                </span>
                <span style="color:var(--gray-600)">${dayName} ${day}/${month} • ${time}</span>
            `;
            upcomingAppointments.appendChild(li);
        });
    };

    const cancelAppointmentById = (apptId) => {
        const appt = mockAppointments.find(a => a.id === apptId);
        if (appt && confirm(`¿Estás seguro de cancelar la cita de ${appt.petName}?`)) {
            appt.status = 'CANCELADA';
            saveAppointments();
            refreshAppointmentsList();
            refreshUpcomingAppointments();
            showToast('Cita cancelada', 'info');
        }
    };

    // Cargar citas al iniciar
    loadAppointmentsFromBackend().then(() => {
        refreshAppointmentsList();
        refreshUpcomingAppointments();
    });
    
    // ========== RESUMEN DEL HISTORIAL ==========
    const historySummary = document.getElementById('historySummary');
    
    const loadHistorySummary = () => {
        if (!historySummary) return;
        
        const totalCitas = mockAppointments.length;
        const citasCompletadas = mockAppointments.filter(apt => 
            apt.status === 'COMPLETADA' || apt.status === 'CONFIRMADA' || 
            (apt.status === 'PENDIENTE' && new Date(`${apt.date}T${apt.time}`) < new Date())
        ).length;
        const citasPendientes = mockAppointments.filter(apt => 
            apt.status === 'PENDIENTE' && new Date(`${apt.date}T${apt.time}`) >= new Date()
        ).length;
        
        if (totalCitas === 0) {
            historySummary.innerHTML = `
                <div style="color:var(--gray-600); font-size:0.9rem; text-align:center; padding:1rem;">
                    <i class="fa-solid fa-info-circle"></i> Aún no hay historial registrado
                </div>
            `;
            return;
        }
        
        const isMobile = window.innerWidth <= 768;
        const gridCols = isMobile ? '1fr' : 'repeat(3, 1fr)';
        
        historySummary.innerHTML = `
            <div style="display:grid; grid-template-columns: ${gridCols}; gap:0.75rem;">
                <div style="text-align:center; padding:0.75rem; background:var(--white); border-radius:12px;">
                    <div style="font-size:1.5rem; font-weight:700; color:var(--primary-color);">${totalCitas}</div>
                    <div style="font-size:0.75rem; color:var(--gray-600); margin-top:0.25rem;">Total citas</div>
                </div>
                <div style="text-align:center; padding:0.75rem; background:var(--white); border-radius:12px;">
                    <div style="font-size:1.5rem; font-weight:700; color:#4CAF50;">${citasCompletadas}</div>
                    <div style="font-size:0.75rem; color:var(--gray-600); margin-top:0.25rem;">Completadas</div>
                </div>
                <div style="text-align:center; padding:0.75rem; background:var(--white); border-radius:12px;">
                    <div style="font-size:1.5rem; font-weight:700; color:#FF9800;">${citasPendientes}</div>
                    <div style="font-size:0.75rem; color:var(--gray-600); margin-top:0.25rem;">Pendientes</div>
                </div>
            </div>
        `;
    };
    
    loadHistorySummary();
    loadInvoices();

    // ========== DETALLE DE CITA ==========
    const closeAppointmentDetail = document.getElementById('closeAppointmentDetail');
    const apptDetailClose = document.getElementById('apptDetailClose');

    const openAppointmentDetail = (appt) => {
        const appointmentDetailModal = document.getElementById('appointmentDetailModal');
        if (!appointmentDetailModal) return;

        const apptDetailHeader = document.getElementById('apptDetailHeader');
        const apptDetailStatus = document.getElementById('apptDetailStatus');
        const apptDetailModule = document.getElementById('apptDetailModule');
        const apptDetailNotes = document.getElementById('apptDetailNotes');

        const petIcon = appt.petSpecies === 'Perro' ? 'fa-dog' : 'fa-cat';
        const statusColors = {
            'PENDIENTE': '#FF9800',
            'CONFIRMADA': '#4CAF50',
            'CANCELADA': '#F44336'
        };

        if (apptDetailHeader) {
            apptDetailHeader.innerHTML = `
                <div style="display:flex; align-items:center; gap:.5rem;">
                    <i class="fa-solid ${petIcon}" style="color:var(--primary-color);"></i>
                    <strong>${appt.petName}</strong> (${appt.petSpecies})
                </div>
                <div style="margin-top:.5rem; color:var(--gray-600);">${appt.service}</div>
            `;
        }
        if (apptDetailStatus) {
            apptDetailStatus.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:.5rem;">
                    <div style="display:inline-block; background:${statusColors[appt.status]}; color:#fff; padding:.4rem .8rem; border-radius:8px; font-weight:600;">
                        ${appt.status}
                    </div>
                    ${appt.priority ? `
                    <div>
                        <strong>Prioridad:</strong> ${getPriorityBadge(appt.priority)}
                    </div>
                    ` : ''}
                </div>
            `;
        }
        if (apptDetailModule) {
            apptDetailModule.innerHTML = `<div>${appt.module}</div>`;
        }
        if (apptDetailNotes) {
            apptDetailNotes.innerHTML = `<div>${appt.notes}</div><div style="margin-top:.5rem; color:var(--gray-600); font-size:.9rem;">Fecha: ${appt.date} a las ${appt.time}</div>`;
        }

        openModal('appointmentDetailModal');
    };

    if (closeAppointmentDetail) {
        closeAppointmentDetail.addEventListener('click', () => closeModal('appointmentDetailModal'));
    }
    if (apptDetailClose) {
        apptDetailClose.addEventListener('click', () => closeModal('appointmentDetailModal'));
    }

    // ========== NOTIFICACIONES - MENÚ HAMBURGUESA ==========
    const notifToggle = document.getElementById('notifToggle');
    const notifDropdown = document.getElementById('notifDropdown');
    const closeNotifDropdown = document.getElementById('closeNotifDropdown');
    const notifDropdownList = document.getElementById('notifDropdownList');
    const notifBadge = document.getElementById('notifBadge');

    const notifications = [
        {
            icon: 'fa-syringe',
            iconColor: 'var(--primary-color)',
            title: 'Vacuna de Luna',
            time: 'Hace 2h',
            body: 'Recuerda traer el carnet de vacunación. La cita está confirmada para el Lunes 04/11 a las 10:30.'
        },
        {
            icon: 'fa-calendar-check',
            iconColor: 'var(--accent-blue)',
            title: 'Cita reprogramada',
            time: 'Ayer',
            body: 'Tu cita de Mishi se reprogramó para el Jueves 07/11 a las 16:00 por disponibilidad del consultorio.'
        },
        {
            icon: 'fa-bone',
            iconColor: 'var(--secondary-color)',
            title: 'Nuevo servicio',
            time: 'Hace 3 días',
            body: 'Se habilitó el servicio de fisioterapia para mascotas con paquetes promocionales durante este mes.'
        }
    ];

    const renderNotifications = () => {
        if (!notifDropdownList) return;
        
        notifDropdownList.innerHTML = '';
        
        if (notifications.length === 0) {
            notifDropdownList.innerHTML = `
                <div style="text-align:center; padding:2rem; color:var(--gray-600);">
                    <i class="fa-solid fa-bell-slash" style="font-size:2rem; margin-bottom:0.5rem; opacity:0.5;"></i>
                    <p>No hay notificaciones</p>
                </div>
            `;
            return;
        }

        notifications.forEach(notif => {
            const item = document.createElement('div');
            item.className = 'notif-dropdown-item';
            item.innerHTML = `
                <div style="display:flex; gap:0.75rem;">
                    <div style="flex-shrink:0; width:40px; height:40px; background:${notif.iconColor}20; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                        <i class="fa-solid ${notif.icon}" style="color:${notif.iconColor};"></i>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                            <div style="font-weight:600; color:var(--gray-900); font-size:0.95rem;">${notif.title}</div>
                            <div style="font-size:0.75rem; color:var(--gray-600); white-space:nowrap; margin-left:0.5rem;">${notif.time}</div>
                        </div>
                        <p style="margin:0; color:var(--gray-600); font-size:0.85rem; line-height:1.4;">${notif.body}</p>
                    </div>
                </div>
            `;
            notifDropdownList.appendChild(item);
        });
    };

    if (notifToggle && notifDropdown) {
        notifToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = notifDropdown.style.display === 'block';
            
            if (!isOpen) {
                renderNotifications();
                
                // Calcular posición del dropdown - siempre centrado
                const rect = notifToggle.getBoundingClientRect();
                const isMobile = window.innerWidth <= 768;
                
                // Siempre centrar el dropdown en la pantalla
                notifDropdown.style.position = 'fixed';
                notifDropdown.style.left = '50%';
                notifDropdown.style.right = 'auto';
                notifDropdown.style.transform = 'translateX(-50%)';
                notifDropdown.style.top = `${rect.bottom + window.scrollY + 8}px`;
                
                if (isMobile) {
                    notifDropdown.style.width = `calc(100vw - 2rem)`;
                    notifDropdown.style.maxWidth = `calc(100vw - 2rem)`;
                } else {
                    notifDropdown.style.width = '400px';
                    notifDropdown.style.maxWidth = '400px';
                }
                
                notifDropdown.style.display = 'block';
            } else {
                notifDropdown.style.display = 'none';
            }
        });
    }
    
    // Recalcular posición al redimensionar
    window.addEventListener('resize', () => {
        if (notifDropdown && notifDropdown.style.display === 'block' && notifToggle) {
            const rect = notifToggle.getBoundingClientRect();
            const isMobile = window.innerWidth <= 768;
            
            notifDropdown.style.position = 'fixed';
            notifDropdown.style.left = '50%';
            notifDropdown.style.right = 'auto';
            notifDropdown.style.transform = 'translateX(-50%)';
            notifDropdown.style.top = `${rect.bottom + window.scrollY + 8}px`;
            
            if (isMobile) {
                notifDropdown.style.width = `calc(100vw - 2rem)`;
                notifDropdown.style.maxWidth = `calc(100vw - 2rem)`;
            } else {
                notifDropdown.style.width = '400px';
                notifDropdown.style.maxWidth = '400px';
            }
        }
    });

    if (closeNotifDropdown) {
        closeNotifDropdown.addEventListener('click', () => {
            notifDropdown.style.display = 'none';
        });
    }

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (notifDropdown && notifToggle && 
            !notifDropdown.contains(e.target) && 
            !notifToggle.contains(e.target)) {
            notifDropdown.style.display = 'none';
        }
    });

    // Actualizar badge
    if (notifBadge) {
        notifBadge.textContent = notifications.length;
        if (notifications.length === 0) {
            notifBadge.style.display = 'none';
        }
    }

    // ========== PREVENIR DESBORDAMIENTO Y MANTENER RESPONSIVIDAD ==========
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
        
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.style.width = '100%';
            formContainer.style.maxWidth = '100%';
            formContainer.style.overflowX = 'hidden';
        }
        
        const dashboardGrid = document.querySelector('.dashboard-grid');
        if (dashboardGrid) {
            dashboardGrid.style.width = '100%';
            dashboardGrid.style.maxWidth = '100%';
            dashboardGrid.style.overflowX = 'hidden';
        }
    };
    
    // Ejecutar inmediatamente y en resize
    preventHorizontalScroll();
    window.addEventListener('resize', preventHorizontalScroll);
    window.addEventListener('load', preventHorizontalScroll);
    
    // Forzar recálculo después de un momento
    setTimeout(() => {
        preventHorizontalScroll();
        window.dispatchEvent(new Event('resize'));
    }, 100);

    console.log('✅ Client panel initialized');
});

/**
 * Carga las facturas del cliente
 */
async function loadInvoices() {
    const session = window.apiService?.getCurrentUser?.();
    if (!session) return;
    
    try {
        const clientId = session.id;
        const invoices = await apiService.getFacturasByUsuario(clientId);
        
        // Mapear al formato esperado
        const clientInvoices = invoices.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.numFactura || `FAC-${inv.id}`,
            total: inv.total || 0,
            subtotal: inv.subtotal || 0,
            tax: inv.impuestos || 0,
            status: inv.estadoFactura?.toLowerCase() || 'pendiente',
            createdAt: inv.fechaEmision || new Date().toISOString(),
            items: inv.items || [],
            clientName: session.nombre || session.firstName || 'Cliente',
            observations: inv.observaciones || ''
        }));
    
    // Ordenar por fecha (más recientes primero)
    clientInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
        // Mostrar en el dashboard (últimas 3)
        const invoicesList = document.getElementById('invoicesList');
        if (invoicesList) {
        if (clientInvoices.length === 0) {
            invoicesList.innerHTML = `
                <div style="text-align:center; padding:1.5rem; color:var(--gray-600);">
                    <i class="fa-solid fa-receipt" style="font-size:2rem; opacity:0.3; margin-bottom:0.5rem;"></i>
                    <p style="font-size:0.9rem;">No tienes facturas registradas</p>
                </div>
            `;
        } else {
            const recentInvoices = clientInvoices.slice(0, 3);
            invoicesList.innerHTML = recentInvoices.map(invoice => {
                const date = new Date(invoice.createdAt).toLocaleDateString('es-ES');
                const statusColor = invoice.status === 'paid' ? '#4CAF50' : invoice.status === 'cancelled' ? '#F44336' : '#FF9800';
                const statusText = invoice.status === 'paid' ? 'Pagada' : invoice.status === 'cancelled' ? 'Anulada' : 'Pendiente';
                
                return `
                    <div onclick="viewInvoiceDetail('${invoice.id}')" style="background:var(--white); padding:0.75rem; border-radius:var(--border-radius-lg); border:1px solid var(--gray-200); margin-bottom:0.5rem; cursor:pointer; transition:all 0.2s ease;" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow=''; this.style.transform=''">
                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;">
                            <div>
                                <div style="font-weight:600; color:var(--gray-900); font-size:0.9rem;">${invoice.invoiceNumber}</div>
                                <div style="font-size:0.75rem; color:var(--gray-600);">${date}</div>
                            </div>
                            <span style="background:${statusColor}; color:white; padding:0.25rem 0.5rem; border-radius:999px; font-size:0.7rem; font-weight:600;">${statusText}</span>
                        </div>
                        <div style="font-size:1.1rem; font-weight:bold; color:var(--primary-color);">$${invoice.total.toFixed(2)}</div>
                    </div>
                `;
            }).join('');
            
            if (clientInvoices.length > 3) {
                invoicesList.innerHTML += `
                    <div style="text-align:center; padding:0.5rem; color:var(--gray-600); font-size:0.85rem;">
                        +${clientInvoices.length - 3} factura(s) más
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error cargando facturas:', error);
        // Fallback a cache local
        const invoices = JSON.parse(localStorage.getItem('vetuni:mockInvoices') || '[]');
        const clientInvoices = invoices.filter(inv => inv.clientId === (session.email || session.id));
        clientInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const invoicesList = document.getElementById('invoicesList');
        if (invoicesList) {
            if (clientInvoices.length === 0) {
                invoicesList.innerHTML = `
                    <div style="text-align:center; padding:1.5rem; color:var(--gray-600);">
                        <i class="fa-solid fa-receipt" style="font-size:2rem; opacity:0.3; margin-bottom:0.5rem;"></i>
                        <p style="font-size:0.9rem;">No tienes facturas registradas</p>
                    </div>
                `;
            } else {
                const recentInvoices = clientInvoices.slice(0, 3);
                invoicesList.innerHTML = recentInvoices.map(invoice => {
                    const date = new Date(invoice.createdAt).toLocaleDateString('es-ES');
                    const statusColor = invoice.status === 'paid' ? '#4CAF50' : invoice.status === 'cancelled' ? '#F44336' : '#FF9800';
                    const statusText = invoice.status === 'paid' ? 'Pagada' : invoice.status === 'cancelled' ? 'Anulada' : 'Pendiente';
                    
                    return `
                        <div onclick="viewInvoiceDetail('${invoice.id}')" style="background:var(--white); padding:0.75rem; border-radius:var(--border-radius-lg); border:1px solid var(--gray-200); margin-bottom:0.5rem; cursor:pointer; transition:all 0.2s ease;" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow=''; this.style.transform=''">
                            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;">
                                <div>
                                    <div style="font-weight:600; color:var(--gray-900); font-size:0.9rem;">${invoice.invoiceNumber}</div>
                                    <div style="font-size:0.75rem; color:var(--gray-600);">${date}</div>
                                </div>
                                <span style="background:${statusColor}; color:white; padding:0.25rem 0.5rem; border-radius:999px; font-size:0.7rem; font-weight:600;">${statusText}</span>
                            </div>
                            <div style="font-size:1.1rem; font-weight:bold; color:var(--primary-color);">$${invoice.total.toFixed(2)}</div>
                        </div>
                    `;
                }).join('');
                
                if (clientInvoices.length > 3) {
                    invoicesList.innerHTML += `
                        <div style="text-align:center; padding:0.5rem; color:var(--gray-600); font-size:0.85rem;">
                            +${clientInvoices.length - 3} factura(s) más
                        </div>
                    `;
                }
            }
        }
    }
}

/**
 * Abre el modal de facturas
 */
async function openInvoicesModal() {
    const modal = document.getElementById('invoicesModal');
    if (!modal) return;
    
    const session = window.apiService?.getCurrentUser?.();
    if (!session) return;
    
    try {
        const clientId = session.id;
        const invoices = await apiService.getFacturasByUsuario(clientId);
        
        // Mapear al formato esperado
        const clientInvoices = invoices.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.numFactura || `FAC-${inv.id}`,
            total: inv.total || 0,
            subtotal: inv.subtotal || 0,
            tax: inv.impuestos || 0,
            status: inv.estadoFactura?.toLowerCase() || 'pendiente',
            createdAt: inv.fechaEmision || new Date().toISOString(),
            items: inv.items || [],
            clientName: session.nombre || session.firstName || 'Cliente',
            observations: inv.observaciones || ''
        }));
        
        // Ordenar por fecha (más recientes primero)
        clientInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const invoicesModalList = document.getElementById('invoicesModalList');
    if (invoicesModalList) {
        if (clientInvoices.length === 0) {
            invoicesModalList.innerHTML = `
                <div style="text-align:center; padding:3rem; color:var(--gray-600);">
                    <i class="fa-solid fa-receipt" style="font-size:3rem; opacity:0.3; margin-bottom:1rem;"></i>
                    <p>No tienes facturas registradas</p>
                </div>
            `;
        } else {
            invoicesModalList.innerHTML = clientInvoices.map(invoice => {
                const date = new Date(invoice.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const time = new Date(invoice.createdAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const statusColor = invoice.status === 'paid' ? '#4CAF50' : invoice.status === 'cancelled' ? '#F44336' : '#FF9800';
                const statusText = invoice.status === 'paid' ? 'Pagada' : invoice.status === 'cancelled' ? 'Anulada' : 'Pendiente';
                
                return `
                    <div onclick="viewInvoiceDetail('${invoice.id}')" style="background:var(--white); padding:1.5rem; border-radius:var(--border-radius-lg); border:1px solid var(--gray-200); cursor:pointer; transition:all 0.2s ease; box-shadow:var(--shadow-sm);" onmouseover="this.style.boxShadow='var(--shadow-md)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='var(--shadow-sm)'; this.style.transform=''">
                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1rem;">
                            <div style="flex:1;">
                                <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
                                    <div style="font-weight:bold; color:var(--gray-900); font-size:1.1rem;">${invoice.invoiceNumber}</div>
                                    <span style="background:${statusColor}; color:white; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:600;">${statusText}</span>
                                </div>
                                <div style="color:var(--gray-600); font-size:0.85rem;">
                                    <i class="fa-solid fa-calendar"></i> ${date} a las ${time}
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:1.5rem; font-weight:bold; color:var(--primary-color);">$${invoice.total.toFixed(2)}</div>
                                <div style="font-size:0.75rem; color:var(--gray-600);">${invoice.items.length} ítem(s)</div>
                            </div>
                        </div>
                        <div style="display:flex; justify-content:flex-end; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--gray-200);">
                            <button class="submit-btn" style="padding:0.5rem 1rem; font-size:0.9rem;" onclick="event.stopPropagation(); viewInvoiceDetail('${invoice.id}')">
                                <i class="fa-solid fa-eye"></i> Ver Detalles
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    modal.classList.add('open');
}

/**
 * Cierra el modal de facturas
 */
function closeInvoicesModal() {
    const modal = document.getElementById('invoicesModal');
    if (modal) {
        modal.classList.remove('open');
    }
}

let currentInvoiceId = null;

/**
 * Abre el detalle de una factura
 */
async function viewInvoiceDetail(invoiceId) {
    currentInvoiceId = invoiceId;
    const modal = document.getElementById('invoiceDetailModal');
    if (!modal) return;
    
    try {
        const invoice = await apiService.getFacturaById(invoiceId);
        
        // Mapear al formato esperado
        const invoiceMapped = {
            id: invoice.id,
            invoiceNumber: invoice.numFactura || `FAC-${invoice.id}`,
            total: invoice.total || 0,
            subtotal: invoice.subtotal || 0,
            tax: invoice.impuestos || 0,
            status: invoice.estadoFactura?.toLowerCase() || 'pendiente',
            createdAt: invoice.fechaEmision || new Date().toISOString(),
            items: invoice.items || [],
            clientName: invoice.clienteNombre || 'Cliente',
            observations: invoice.observaciones || ''
        };
    
    if (!invoiceMapped || !invoiceMapped.id) {
        const showToast = (message, type = 'success') => {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 16px;
                right: 16px;
                background: ${type === 'error' ? '#F44336' : '#2E8B57'};
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
        showToast('Factura no encontrada', 'error');
        return;
    }
    
        const date = new Date(invoiceMapped.createdAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const time = new Date(invoiceMapped.createdAt).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const statusColor = invoiceMapped.status === 'paid' || invoiceMapped.status === 'pagada' ? '#4CAF50' : invoiceMapped.status === 'cancelled' || invoiceMapped.status === 'anulada' ? '#F44336' : '#FF9800';
        const statusText = invoiceMapped.status === 'paid' || invoiceMapped.status === 'pagada' ? 'Pagada' : invoiceMapped.status === 'cancelled' || invoiceMapped.status === 'anulada' ? 'Anulada' : 'Pendiente';
        
        const content = document.getElementById('invoiceDetailContent');
        if (content) {
            content.innerHTML = `
                <div style="background:var(--gray-50); padding:1.5rem; border-radius:var(--border-radius-lg); margin-bottom:1.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1rem; flex-wrap:wrap; gap:1rem;">
                        <div>
                            <h3 style="font-size:1.5rem; font-weight:bold; color:var(--gray-900); margin-bottom:0.25rem;">${invoiceMapped.invoiceNumber}</h3>
                            <div style="color:var(--gray-600); font-size:0.9rem;">
                                <i class="fa-solid fa-calendar"></i> ${date} a las ${time}
                            </div>
                        </div>
                        <span style="background:${statusColor}; color:white; padding:0.5rem 1rem; border-radius:999px; font-weight:600;">${statusText}</span>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-top:1rem;">
                        <div>
                            <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:0.25rem;">Cliente</div>
                            <div style="font-weight:600; color:var(--gray-900);">${invoiceMapped.clientName}</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom:1.5rem;">
                    <h4 style="font-weight:600; color:var(--gray-900); margin-bottom:1rem; font-size:1.1rem;">
                        <i class="fa-solid fa-list"></i> Ítems de la Factura
                    </h4>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="background:var(--gray-100); border-bottom:2px solid var(--gray-300);">
                                    <th style="padding:0.75rem; text-align:left; font-weight:600; color:var(--gray-700);">Tipo</th>
                                    <th style="padding:0.75rem; text-align:left; font-weight:600; color:var(--gray-700);">Descripción</th>
                                    <th style="padding:0.75rem; text-align:center; font-weight:600; color:var(--gray-700);">Cantidad</th>
                                    <th style="padding:0.75rem; text-align:right; font-weight:600; color:var(--gray-700);">Precio Unit.</th>
                                    <th style="padding:0.75rem; text-align:right; font-weight:600; color:var(--gray-700);">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(invoiceMapped.items && invoiceMapped.items.length > 0 ? invoiceMapped.items.map(item => {
                                    const typeText = item.tipo || item.type === 'service' ? 'Servicio' : item.type === 'product' ? 'Producto' : 'Medicamento';
                                    const typeIcon = item.tipo === 'SERVICIO' || item.type === 'service' ? 'fa-stethoscope' : item.type === 'product' ? 'fa-box' : 'fa-pills';
                                    return `
                                        <tr style="border-bottom:1px solid var(--gray-200);">
                                            <td style="padding:0.75rem;">
                                                <div style="display:flex; align-items:center; gap:0.5rem;">
                                                    <i class="fa-solid ${typeIcon}" style="color:var(--primary-color);"></i>
                                                    <span style="font-weight:500;">${typeText}</span>
                                                </div>
                                            </td>
                                            <td style="padding:0.75rem; color:var(--gray-700);">${item.descripcion || item.description || 'Sin descripción'}</td>
                                            <td style="padding:0.75rem; text-align:center; color:var(--gray-700);">${item.cantidad || item.quantity || 1}</td>
                                            <td style="padding:0.75rem; text-align:right; color:var(--gray-700);">$${(item.precioUnitario || item.unitPrice || 0).toFixed(2)}</td>
                                            <td style="padding:0.75rem; text-align:right; font-weight:600; color:var(--gray-900);">$${(item.total || item.precioUnitario * item.cantidad || 0).toFixed(2)}</td>
                                        </tr>
                                    `;
                                }).join('') : '<tr><td colspan="5" style="padding:1rem; text-align:center; color:var(--gray-600);">No hay items registrados</td></tr>')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                ${invoiceMapped.observations ? `
                    <div style="background:var(--gray-50); padding:1rem; border-radius:var(--border-radius-lg); margin-bottom:1.5rem;">
                        <div style="font-weight:600; color:var(--gray-900); margin-bottom:0.5rem;">
                            <i class="fa-solid fa-comment"></i> Observaciones
                        </div>
                        <div style="color:var(--gray-700);">${invoiceMapped.observations}</div>
                    </div>
                ` : ''}
                
                <div style="background:var(--primary-color); color:white; padding:1.5rem; border-radius:var(--border-radius-lg);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                        <span>Subtotal:</span>
                        <span>$${invoiceMapped.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                        <span>Impuestos (19%):</span>
                        <span>$${invoiceMapped.tax.toFixed(2)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:1.25rem; font-weight:bold; padding-top:0.5rem; border-top:2px solid rgba(255,255,255,0.3);">
                        <span>Total:</span>
                        <span>$${invoiceMapped.total.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando factura:', error);
        const showToast = (message, type = 'success') => {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 16px;
                right: 16px;
                background: ${type === 'error' ? '#F44336' : '#2E8B57'};
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
        showToast('Error al cargar la factura: ' + (error.message || 'Error desconocido'), 'error');
        return;
    }
    
    // Cerrar modal de lista y abrir detalle
    closeInvoicesModal();
    setTimeout(() => {
        modal.classList.add('open');
    }, 300);
}

/**
 * Cierra el modal de detalle de factura
 */
function closeInvoiceDetailModal() {
    const modal = document.getElementById('invoiceDetailModal');
    if (modal) {
        modal.classList.remove('open');
    }
    currentInvoiceId = null;
}

/**
 * Descarga la factura como PDF (por ahora solo muestra mensaje)
 */
function downloadInvoice() {
    if (!currentInvoiceId) return;
    
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 16px;
            right: 16px;
            background: ${type === 'error' ? '#F44336' : '#2E8B57'};
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
    
    // Por ahora, solo mostramos un mensaje
    // En el futuro, se puede implementar generación real de PDF
    showToast('Funcionalidad de descarga de PDF próximamente disponible', 'info');
}

// Exponer funciones globalmente
window.openInvoicesModal = openInvoicesModal;
window.closeInvoicesModal = closeInvoicesModal;
window.viewInvoiceDetail = viewInvoiceDetail;
window.closeInvoiceDetailModal = closeInvoiceDetailModal;
window.downloadInvoice = downloadInvoice;

