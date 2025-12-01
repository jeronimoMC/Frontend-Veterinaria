# Frontend - VetUni Clínica Veterinaria

Frontend de la aplicación web para la Clínica Veterinaria Universitaria (VetUni).

## 📁 Estructura del Proyecto

```
frontend/
├── assets/
│   ├── css/
│   │   └── styles.css          # Estilos globales de la aplicación
│   └── js/
│       └── mocks/
│           └── auth.mock.js     # Servicio mock de autenticación
├── pages/
│   ├── auth/
│   │   ├── index.html          # Página de login/registro
│   │   └── auth.js             # Lógica de autenticación
│   ├── client/
│   │   ├── index.html          # Panel del cliente
│   │   └── client.js           # Lógica del panel cliente
│   ├── admin/
│   │   ├── index.html          # Panel de administración
│   │   └── admin.js            # Lógica del panel admin
│   └── catalog/
│       ├── index.html          # Catálogo de productos
│       └── catalog.js          # Lógica del catálogo
├── index.html                  # Redirección a auth
└── README.md                    # Este archivo
```

## 🚀 Inicio Rápido

### Opción 1: Usando Docker (Recomendado)

El frontend está dockerizado y listo para usar:

```bash
# Desde el directorio frontend/
docker-compose up -d
```

El frontend estará disponible en: **http://localhost:3000**

Para más información sobre Docker, consulta [README.DOCKER.md](./README.DOCKER.md)

### Opción 2: Acceso Directo

El sistema funciona completamente sin backend (solo visual). Para acceder:

1. **Abrir `pages/auth/index.html` en el navegador**
2. **Login con correos que contengan:**
   - `admin` → Acceso al panel de administración
   - `cliente` → Acceso al panel del cliente

### Ejemplos de Correos

- **Admin:** `admin@vetuni.edu`, `administrador@test.com`, `admin123@example.com`
- **Cliente:** `cliente@vetuni.edu`, `cliente123@test.com`, `mi.cliente@example.com`

**Nota:** Cualquier contraseña funciona para acceso visual.

## 🎯 Funcionalidades

### Panel del Cliente

- ✅ Registro de mascotas
- ✅ Visualización de mascotas registradas
- ✅ Crear citas veterinarias
- ✅ Ver y gestionar citas (cancelar, ver detalles)
- ✅ Notificaciones expandibles
- ✅ Vista previa del catálogo de productos
- ✅ Navegación al catálogo completo

### Panel de Administración

- ✅ Dashboard con estadísticas
- ✅ Vista de citas del día
- ✅ Avisos y notificaciones
- ✅ Acceso rápido a funciones administrativas

### Catálogo de Productos

- ✅ Búsqueda de productos
- ✅ Filtrado por categorías
- ✅ Vista detallada de productos
- ✅ Diseño responsive

## 🔧 Tecnologías Utilizadas

- **HTML5** - Estructura
- **CSS3** - Estilos (con variables CSS)
- **JavaScript (ES6+)** - Lógica e interacciones
- **Font Awesome** - Iconos
- **Google Fonts (Poppins)** - Tipografía

## 📝 Características Técnicas

### Sistema de Autenticación Mock

El sistema utiliza `auth.mock.js` para simular la autenticación:

- Detecta automáticamente el rol basado en el correo electrónico
- Almacena sesiones en `localStorage`
- Permite acceso visual sin backend

### Almacenamiento Local

Los datos se guardan en `localStorage`:

- `vetuni:session` - Sesión del usuario actual
- `vetuni:mockUsers` - Usuarios registrados
- `vetuni:mockPets` - Mascotas registradas
- `vetuni:mockAppointments` - Citas creadas

### Estilos

El sistema utiliza un sistema de diseño consistente con:

- Variables CSS para colores, espaciado, tipografía
- Diseño responsive
- Animaciones suaves
- Modales accesibles

## 🎨 Estilo Visual

- **Colores principales:**
  - Verde (#2E8B57) - Color primario
  - Naranja (#FF8C42) - Color secundario
  - Azul (#4A90E2) - Acentos

- **Tipografía:** Poppins (Google Fonts)
- **Iconos:** Font Awesome 6.4.0

## 🔄 Flujo de Navegación

```
index.html
  └── pages/auth/index.html
      ├── (Login con correo "admin") → pages/admin/index.html
      └── (Login con correo "cliente") → pages/client/index.html
          └── (Ver catálogo) → pages/catalog/index.html
```

## 🐳 Dockerización

El frontend está completamente dockerizado usando nginx para servir los archivos estáticos.

### Archivos de Docker

- `Dockerfile` - Configuración de la imagen Docker
- `docker-compose.yml` - Orquestación del contenedor
- `nginx.conf` - Configuración del servidor web nginx
- `.dockerignore` - Archivos excluidos del build
- `README.DOCKER.md` - Documentación completa de Docker
- `Makefile` - Comandos útiles para Docker

### Comandos Rápidos

```bash
# Iniciar el contenedor
make up
# o
docker-compose up -d

# Ver logs
make logs
# o
docker-compose logs -f frontend

# Detener el contenedor
make down
# o
docker-compose down
```

Ver [README.DOCKER.md](./README.DOCKER.md) para documentación completa.

## 📋 Próximas Mejoras

- [ ] Integración con backend real
- [ ] Más funcionalidades en panel admin
- [ ] Sistema de notificaciones en tiempo real
- [ ] Mejoras en responsive design
- [ ] Optimización de rendimiento
- [ ] Tests automatizados

## 👨‍💻 Desarrollo

### Estructura de Archivos

- **HTML:** Estructura semántica y accesible
- **CSS:** Organizado por secciones, uso de variables
- **JavaScript:** Código comentado y organizado por funcionalidades

### Buenas Prácticas

- ✅ Código comentado
- ✅ Estructura modular
- ✅ Nombres descriptivos
- ✅ Validación de formularios
- ✅ Manejo de errores
- ✅ Accesibilidad (ARIA labels)

## 📞 Soporte

Para preguntas o problemas, contactar al equipo de desarrollo.

---

**VetUni** - Clínica Veterinaria Universitaria 🐾

