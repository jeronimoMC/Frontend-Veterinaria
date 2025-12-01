# Dockerfile para el Frontend de VetUni
# Usa nginx para servir archivos estáticos HTML/CSS/JS

FROM nginx:alpine

# Etiquetas de metadata
LABEL maintainer="VetUni Development Team"
LABEL description="Frontend de VetUni - Clínica Veterinaria Universitaria"
LABEL version="1.0"

# Instalar dependencias adicionales si son necesarias
RUN apk add --no-cache \
    curl \
    tzdata

# Eliminar la configuración por defecto de nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos del frontend
COPY . /usr/share/nginx/html

# Crear directorio para logs si no existe
RUN mkdir -p /var/log/nginx

# Exponer el puerto 80
EXPOSE 80

# Healthcheck para verificar que el contenedor está funcionando
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Comando para iniciar nginx en modo foreground
CMD ["nginx", "-g", "daemon off;"]

