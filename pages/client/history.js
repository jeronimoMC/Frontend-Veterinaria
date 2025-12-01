/**
 * HISTORIAL CLÍNICO - JAVASCRIPT
 * Página de historial clínico completo de las mascotas
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========== VERIFICACIÓN DE SESIÓN ==========
    const session = window.apiService?.getCurrentUser?.();
    if (!session) {
        window.location.replace('../auth/index.html');
        return;
    }

    // ========== DATOS ==========
    let mockPets = JSON.parse(localStorage.getItem('vetuni:mockPets') || '[]');
    let mockAppointments = JSON.parse(localStorage.getItem('vetuni:mockAppointments') || '[]');
    let mockHistory = JSON.parse(localStorage.getItem('vetuni:mockHistory') || '[]');
    
    let selectedPetId = null;

    // ========== INICIALIZACIÓN ==========
    // Leer parámetro de URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const petIdFromUrl = urlParams.get('pet');
    
    loadPetSelector();
    if (petIdFromUrl && mockPets.find(p => p.id === petIdFromUrl)) {
        selectedPetId = petIdFromUrl;
        // Actualizar selector activo
        setTimeout(() => {
            document.querySelectorAll('.pet-chip-selector').forEach(chip => {
                chip.classList.remove('active');
                if (chip.dataset.petId === selectedPetId) {
                    chip.classList.add('active');
                }
            });
        }, 100);
        loadHistory(selectedPetId);
    } else if (mockPets.length > 0) {
        selectedPetId = mockPets[0].id;
        loadHistory(selectedPetId);
    }

    // ========== SELECTOR DE MASCOTAS ==========
    function loadPetSelector() {
        const selector = document.getElementById('petSelector');
        if (!selector) return;

        selector.innerHTML = '';

        if (mockPets.length === 0) {
            selector.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-paw"></i>
                    <h3>No hay mascotas registradas</h3>
                    <p>Registra una mascota para ver su historial clínico</p>
                    <a href="./index.html" class="submit-btn" style="margin-top:1rem; display:inline-block;">
                        <i class="fa-solid fa-plus"></i> Registrar Mascota
                    </a>
                </div>
            `;
            return;
        }

        mockPets.forEach(pet => {
            const chip = document.createElement('button');
            chip.className = 'pet-chip-selector';
            chip.dataset.petId = pet.id;
            if (pet.id === selectedPetId) {
                chip.classList.add('active');
            }

            const icon = pet.species === 'Perro' ? 'fa-dog' : 'fa-cat';
            chip.innerHTML = `
                <i class="fa-solid ${icon}"></i>
                <span>${pet.name}</span>
            `;

            chip.addEventListener('click', () => {
                selectedPetId = pet.id;
                document.querySelectorAll('.pet-chip-selector').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                loadHistory(selectedPetId);
            });

            selector.appendChild(chip);
        });
    }

    // ========== CARGAR HISTORIAL ==========
    function loadHistory(petId) {
        if (!petId) return;

        const pet = mockPets.find(p => p.id === petId);
        if (!pet) return;

        // Cargar historial clínico completo
        loadHistorialClinicoCompleto(petId);
        
        // Cargar citas de esta mascota
        loadCitas(petId);
        
        // Cargar recetas
        loadRecetas(petId);
        
        // Cargar vacunaciones
        loadVacunas(petId);
        
        // Cargar procedimientos
        loadProcedimientos(petId);
    }

    // ========== CARGAR HISTORIAL CLÍNICO COMPLETO ==========
    function loadHistorialClinicoCompleto(petId) {
        // Crear o encontrar la sección de historial clínico completo
        let historialSection = document.getElementById('historialClinicoSection');
        
        if (!historialSection) {
            const citasSection = document.getElementById('citasSection');
            if (citasSection && citasSection.parentNode) {
                historialSection = document.createElement('div');
                historialSection.className = 'history-section';
                historialSection.id = 'historialClinicoSection';
                historialSection.innerHTML = `
                    <div class="section-title">
                        <i class="fa-solid fa-file-medical"></i> Historial Clínico Completo
                    </div>
                    <div class="timeline" id="historialClinicoTimeline">
                        <!-- Se cargará dinámicamente -->
                    </div>
                `;
                citasSection.parentNode.insertBefore(historialSection, citasSection);
            } else {
                return;
            }
        }
        
        const timeline = document.getElementById('historialClinicoTimeline');
        if (!timeline) return;

        // Obtener todos los historiales habilitados de esta mascota
        const historiales = mockHistory.filter(h => 
            h.petId === petId && 
            (h.enabled === undefined || h.enabled === 1) // Solo historiales habilitados
        );

        if (historiales.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-file-medical"></i>
                    <p>No hay registros clínicos para esta mascota</p>
                </div>
            `;
            return;
        }

        // Ordenar por fecha (más recientes primero)
        historiales.sort((a, b) => {
            const dateA = new Date(a.fecha || a.createdAt || 0);
            const dateB = new Date(b.fecha || b.createdAt || 0);
            return dateB - dateA;
        });

        timeline.innerHTML = '';

        historiales.forEach(hist => {
            const item = document.createElement('div');
            item.className = 'timeline-item';

            const date = new Date(hist.fecha || hist.createdAt);
            const dateStr = date.toLocaleDateString('es-ES', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const type = hist.tipo || hist.nombre || 'Consulta';
            const typeColors = {
                'CONSULTA': '#4CAF50',
                'VACUNACION': '#2196F3',
                'CIRUGIA': '#F44336',
                'LABORATORIO': '#FF9800',
                'RADIOGRAFIA': '#9C27B0',
                'CONTROL': '#00BCD4',
                'RECETA': '#8E24AA',
                'PROCEDIMIENTO': '#00ACC1'
            };

            item.innerHTML = `
                <div class="timeline-header">
                    <div class="timeline-title">
                        <i class="fa-solid fa-file-medical" style="color:${typeColors[type] || '#4CAF50'};"></i>
                        ${hist.nombre || type}
                    </div>
                    <div class="timeline-date">${dateStr}</div>
                </div>
                <div class="timeline-content" style="margin-top:1rem;">
                    ${hist.peso ? `<p><strong><i class="fa-solid fa-weight"></i> Peso:</strong> ${hist.peso} kg</p>` : ''}
                    ${hist.sintomas ? `<p><strong><i class="fa-solid fa-exclamation-triangle"></i> Síntomas:</strong> ${hist.sintomas}</p>` : ''}
                    ${hist.diagnostico ? `<p><strong><i class="fa-solid fa-stethoscope"></i> Diagnóstico:</strong> ${hist.diagnostico}</p>` : ''}
                    ${hist.tratamiento ? `<p><strong><i class="fa-solid fa-pills"></i> Tratamiento:</strong> ${hist.tratamiento}</p>` : ''}
                    ${hist.receta ? `<p><strong><i class="fa-solid fa-prescription-bottle-medical"></i> Receta:</strong> ${hist.receta}</p>` : ''}
                    ${hist.controlPosterior ? `<p><strong><i class="fa-solid fa-calendar-check"></i> Control Posterior:</strong> ${hist.controlPosterior}</p>` : ''}
                    ${hist.observaciones ? `<p><strong><i class="fa-solid fa-comment-medical"></i> Observaciones:</strong> ${hist.observaciones}</p>` : ''}
                </div>
                <div class="timeline-meta">
                    <span class="status-badge status-completed" style="background:${typeColors[type] || '#4CAF50'}; color:white;">
                        ${type}
                    </span>
                </div>
            `;

            timeline.appendChild(item);
        });
    }

    // ========== CARGAR CITAS ==========
    function loadCitas(petId) {
        const timeline = document.getElementById('citasTimeline');
        if (!timeline) return;

        const petAppointments = mockAppointments.filter(apt => apt.petId === petId);
        
        if (petAppointments.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <p>No hay citas registradas para esta mascota</p>
                </div>
            `;
            return;
        }

        // Ordenar por fecha (más recientes primero)
        petAppointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB - dateA;
        });

        timeline.innerHTML = '';

        petAppointments.forEach(apt => {
            const item = document.createElement('div');
            item.className = 'timeline-item';

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
            if (apt.status === 'CONFIRMADA') {
                statusClass = 'status-completed';
                statusText = 'Completada';
            } else if (apt.status === 'CANCELADA') {
                statusClass = 'status-cancelled';
                statusText = 'Cancelada';
            } else if (apt.status === 'PENDIENTE') {
                // Verificar si la cita ya pasó
                if (date < new Date()) {
                    statusClass = 'status-completed';
                    statusText = 'Completada';
                }
            }

            const petIcon = apt.petSpecies === 'Perro' ? 'fa-dog' : 'fa-cat';

            item.innerHTML = `
                <div class="timeline-header">
                    <div class="timeline-title">
                        <i class="fa-solid ${petIcon}" style="color:var(--primary-color);"></i>
                        ${apt.service}
                    </div>
                    <div class="timeline-date">${dateStr}</div>
                </div>
                <div class="timeline-content">
                    <p><strong>Módulo:</strong> ${apt.module || 'N/A'}</p>
                    <p><strong>Hora:</strong> ${timeStr}</p>
                    <p><strong>Motivo/Notas:</strong> ${apt.notes || 'Sin notas adicionales'}</p>
                </div>
                <div class="timeline-meta">
                    <span class="status-badge ${statusClass}">
                        <i class="fa-solid ${statusClass === 'status-completed' ? 'fa-check-circle' : statusClass === 'status-cancelled' ? 'fa-times-circle' : 'fa-clock'}"></i>
                        ${statusText}
                    </span>
                    <div class="meta-item">
                        <i class="fa-solid fa-building"></i>
                        ${apt.module || 'N/A'}
                    </div>
                </div>
            `;

            timeline.appendChild(item);
        });
    }

    // ========== CARGAR RECETAS ==========
    function loadRecetas(petId) {
        const recetasList = document.getElementById('recetasList');
        if (!recetasList) return;

        // Obtener recetas del historial mock (solo habilitadas - enabled = 1 o undefined)
        const petRecetas = mockHistory.filter(h => 
            h.petId === petId && 
            h.tipo === 'RECETA' &&
            (h.enabled === undefined || h.enabled === 1) // Solo historiales habilitados
        );

        if (petRecetas.length === 0) {
            recetasList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-prescription-bottle"></i>
                    <p>No hay recetas registradas para esta mascota</p>
                </div>
            `;
            return;
        }

        recetasList.innerHTML = '';

        petRecetas.forEach(receta => {
            const card = document.createElement('div');
            card.className = 'prescription-card';

            const date = new Date(receta.fecha);
            const dateStr = date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            card.innerHTML = `
                <div class="prescription-header">
                    <div>
                        <div style="font-weight:600; color:var(--primary-dark);">Receta Médica</div>
                        <div style="font-size:0.9rem; color:var(--gray-600); margin-top:0.25rem;">${dateStr}</div>
                    </div>
                    <div class="status-badge status-completed">
                        <i class="fa-solid fa-check-circle"></i> Activa
                    </div>
                </div>
                <div class="prescription-medications">
                    ${receta.medicamentos ? receta.medicamentos.map(med => `
                        <div class="medication-item">
                            <div class="medication-info">
                                <div class="medication-name">${med.nombre}</div>
                                <div class="medication-details">
                                    ${med.dosis || ''} • ${med.frecuencia || ''} • ${med.duracion || ''}
                                </div>
                            </div>
                        </div>
                    `).join('') : '<p style="color:var(--gray-600);">Sin medicamentos registrados</p>'}
                </div>
                ${receta.observaciones ? `<div style="margin-top:1rem; padding-top:1rem; border-top:1px solid var(--gray-200); color:var(--gray-700);"><strong>Observaciones:</strong> ${receta.observaciones}</div>` : ''}
            `;

            recetasList.appendChild(card);
        });
    }

    // ========== CARGAR VACUNACIONES ==========
    function loadVacunas(petId) {
        const timeline = document.getElementById('vacunasTimeline');
        if (!timeline) return;

        // Obtener vacunaciones del historial (solo habilitadas)
        const petVacunas = mockHistory.filter(h => 
            h.petId === petId && 
            h.tipo === 'VACUNA' &&
            (h.enabled === undefined || h.enabled === 1) // Solo historiales habilitados
        );

        // También incluir citas de vacunación completadas
        const vacunaAppointments = mockAppointments.filter(apt => 
            apt.petId === petId && 
            apt.service.toLowerCase().includes('vacuna') &&
            (apt.status === 'CONFIRMADA' || new Date(`${apt.date}T${apt.time}`) < new Date())
        );

        const allVacunas = [...petVacunas, ...vacunaAppointments.map(apt => ({
            tipo: 'VACUNA',
            nombre: apt.service,
            fecha: apt.date,
            observaciones: apt.notes
        }))];

        if (allVacunas.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-syringe"></i>
                    <p>No hay vacunaciones registradas para esta mascota</p>
                </div>
            `;
            return;
        }

        timeline.innerHTML = '';

        allVacunas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        allVacunas.forEach(vacuna => {
            const item = document.createElement('div');
            item.className = 'timeline-item';

            const date = new Date(vacuna.fecha);
            const dateStr = date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            item.innerHTML = `
                <div class="timeline-header">
                    <div class="timeline-title">
                        <i class="fa-solid fa-syringe" style="color:var(--primary-color);"></i>
                        ${vacuna.nombre || 'Vacunación'}
                    </div>
                    <div class="timeline-date">${dateStr}</div>
                </div>
                <div class="timeline-content">
                    ${vacuna.observaciones ? `<p>${vacuna.observaciones}</p>` : ''}
                </div>
                <div class="timeline-meta">
                    <span class="status-badge status-completed">
                        <i class="fa-solid fa-check-circle"></i> Completada
                    </span>
                </div>
            `;

            timeline.appendChild(item);
        });
    }

    // ========== CARGAR PROCEDIMIENTOS ==========
    function loadProcedimientos(petId) {
        const timeline = document.getElementById('procedimientosTimeline');
        if (!timeline) return;

        // Obtener procedimientos del historial (solo habilitados)
        const petProcedimientos = mockHistory.filter(h => 
            h.petId === petId && 
            h.tipo === 'PROCEDIMIENTO' &&
            (h.enabled === undefined || h.enabled === 1) // Solo historiales habilitados
        );

        // También incluir citas de procedimientos completadas
        const procedimientoAppointments = mockAppointments.filter(apt => 
            apt.petId === petId && 
            (apt.service.toLowerCase().includes('cirugía') || 
             apt.service.toLowerCase().includes('procedimiento') ||
             apt.service.toLowerCase().includes('radiografía') ||
             apt.service.toLowerCase().includes('ecografía')) &&
            (apt.status === 'CONFIRMADA' || new Date(`${apt.date}T${apt.time}`) < new Date())
        );

        const allProcedimientos = [...petProcedimientos, ...procedimientoAppointments.map(apt => ({
            tipo: 'PROCEDIMIENTO',
            nombre: apt.service,
            fecha: apt.date,
            hora: apt.time,
            observaciones: apt.notes,
            modulo: apt.module
        }))];

        if (allProcedimientos.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-stethoscope"></i>
                    <p>No hay procedimientos registrados para esta mascota</p>
                </div>
            `;
            return;
        }

        timeline.innerHTML = '';

        allProcedimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        allProcedimientos.forEach(proc => {
            const item = document.createElement('div');
            item.className = 'timeline-item';

            const date = new Date(proc.fecha);
            const dateStr = date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            item.innerHTML = `
                <div class="timeline-header">
                    <div class="timeline-title">
                        <i class="fa-solid fa-stethoscope" style="color:var(--primary-color);"></i>
                        ${proc.nombre || 'Procedimiento'}
                    </div>
                    <div class="timeline-date">${dateStr}</div>
                </div>
                <div class="timeline-content">
                    ${proc.modulo ? `<p><strong>Módulo:</strong> ${proc.modulo}</p>` : ''}
                    ${proc.hora ? `<p><strong>Hora:</strong> ${proc.hora.substring(0, 5)}</p>` : ''}
                    ${proc.observaciones ? `<p><strong>Observaciones:</strong> ${proc.observaciones}</p>` : ''}
                </div>
                <div class="timeline-meta">
                    <span class="status-badge status-completed">
                        <i class="fa-solid fa-check-circle"></i> Completado
                    </span>
                </div>
            `;

            timeline.appendChild(item);
        });
    }

    // ========== EXPORTAR PDF ==========
    const exportPDFBtn = document.getElementById('exportPDFBtn');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', () => {
            alert('La funcionalidad de exportar PDF estará disponible próximamente.\n\nSe implementará para generar un documento PDF completo con todo el historial clínico de la mascota seleccionada.');
        });
    }

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
        
        const historyContainer = document.querySelector('.history-container');
        if (historyContainer) {
            historyContainer.style.width = '100%';
            historyContainer.style.maxWidth = '100%';
            historyContainer.style.overflowX = 'hidden';
        }
    };
    
    preventHorizontalScroll();
    window.addEventListener('resize', preventHorizontalScroll);
    window.addEventListener('load', preventHorizontalScroll);
    
    setTimeout(() => {
        preventHorizontalScroll();
        window.dispatchEvent(new Event('resize'));
    }, 100);

    console.log('✅ History page initialized');
});

