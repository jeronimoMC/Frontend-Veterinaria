/**
 * MOCK AUTH SERVICE
 * --------------------------------------------------
 * Simula el comportamiento del backend de autenticación
 * para poder trabajar el frontend de manera aislada.
 */
(function (global) {
    const STORAGE_KEYS = {
        USERS: 'vetuni:mockUsers',
        SESSION: 'vetuni:session'
    };

    const DEFAULT_USERS = [
        {
            id: 'user-admin',
            firstName: 'Admin',
            lastName: 'Sistema',
            email: 'admin@',
            password: 'admin',
            role: 'ADMIN'
        },
        {
            id: 'user-client',
            firstName: 'Cliente',
            lastName: 'Usuario',
            email: 'cliente@',
            password: 'cliente',
            role: 'CLIENTE'
        },
        {
            id: 'user-vet',
            firstName: 'Veterinario',
            lastName: 'Profesional',
            email: 'vet@',
            password: 'vet',
            role: 'VETERINARIO'
        }
    ];

    const withDelay = (result, shouldReject = false) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                shouldReject ? reject(result) : resolve(result);
            }, 400);
        });
    };

    const getUsers = () => {
        try {
            const stored = global.localStorage.getItem(STORAGE_KEYS.USERS);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('No se pudieron leer los usuarios mock del almacenamiento local:', error);
        }
        return [...DEFAULT_USERS];
    };

    const saveUsers = (users) => {
        try {
            global.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        } catch (error) {
            console.warn('No se pudieron guardar los usuarios mock:', error);
        }
    };

    const getSession = () => {
        try {
            const data = global.localStorage.getItem(STORAGE_KEYS.SESSION);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('No se pudo leer la sesión mock:', error);
            return null;
        }
    };

    const setSession = (session) => {
        try {
            if (session) {
                global.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
            } else {
                global.localStorage.removeItem(STORAGE_KEYS.SESSION);
            }
        } catch (error) {
            console.warn('No se pudo actualizar la sesión mock:', error);
        }
    };

    /**
     * Determina el rol basado en el correo electrónico
     * Si el correo contiene "admin" → ADMIN
     * Si el correo contiene "vet" o "veterinario" → VETERINARIO
     * Si el correo contiene "cliente" → CLIENTE
     * Por defecto → CLIENTE
     */
    const determineRoleFromEmail = (email) => {
        const emailLower = email.toLowerCase();
        if (emailLower.includes('admin')) {
            return 'ADMIN';
        } else if (emailLower.includes('vet') || emailLower.includes('veterinario')) {
            return 'VETERINARIO';
        } else if (emailLower.includes('cliente')) {
            return 'CLIENTE';
        }
        // Por defecto, si no se encuentra en usuarios registrados, se asigna CLIENTE
        return 'CLIENTE';
    };

    const login = async (email, password) => {
        const users = getUsers();
        let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        // Si no se encuentra el usuario pero el correo contiene "admin", "cliente" o "vet",
        // creamos un usuario temporal para permitir el acceso visual
        if (!user) {
            const emailLower = email.toLowerCase();
            const role = determineRoleFromEmail(email);
            
            // Permitir login visual con cualquier contraseña si el correo contiene palabras clave
            if (emailLower.includes('admin') || emailLower.includes('cliente') || emailLower.includes('vet') || emailLower.includes('veterinario')) {
                let firstName = 'Usuario';
                if (emailLower.includes('admin')) firstName = 'Admin';
                else if (emailLower.includes('cliente')) firstName = 'Cliente';
                else if (emailLower.includes('vet') || emailLower.includes('veterinario')) firstName = 'Veterinario';
                
                user = {
                    id: `user-temp-${Date.now()}`,
                    firstName: firstName,
                    lastName: 'Sistema',
                    email: email,
                    password: password,
                    role: role
                };
            } else {
                return withDelay({ message: 'Credenciales inválidas' }, true);
            }
        }

        const session = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        };

        setSession(session);
        return withDelay({ user: session });
    };

    const register = async (payload) => {
        const users = getUsers();
        const emailExists = users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase());

        if (emailExists) {
            return withDelay({ message: 'El correo ya se encuentra registrado' }, true);
        }

        // Determinar rol basado en el correo si no se especifica en el payload
        const role = payload.userRole || determineRoleFromEmail(payload.email);

        const newUser = {
            id: `user-${Date.now()}`,
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            password: payload.password,
            phone: payload.phone || '',
            role: role,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        const session = {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role
        };

        setSession(session);
        return withDelay({ user: session });
    };

    const logout = () => {
        setSession(null);
        return withDelay({ success: true });
    };

    const getCurrentUser = () => getSession();

    /**
     * Obtiene el rol del usuario actual
     */
    const getCurrentUserRole = () => {
        const session = getSession();
        return session ? session.role : null;
    };

    /**
     * Verifica si el usuario actual es admin
     */
    const isAdmin = () => {
        const role = getCurrentUserRole();
        return role && role.toUpperCase().includes('ADMIN');
    };

    /**
     * Verifica si el usuario actual es cliente
     */
    const isClient = () => {
        const role = getCurrentUserRole();
        return role && role.toUpperCase().includes('CLIENTE');
    };

    global.mockAuthService = {
        login,
        register,
        logout,
        getCurrentUser,
        getCurrentUserRole,
        isAdmin,
        isClient,
        _debug: {
            listUsers: getUsers,
            clearUsers: () => saveUsers([...DEFAULT_USERS]),
            clearSession: () => setSession(null)
        }
    };
})(window);

