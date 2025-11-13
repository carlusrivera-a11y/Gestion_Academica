# Imagen base con PHP 8.2 y Debian Bullseye (más estable y completa)
FROM php:8.2-fpm-bullseye

# Instalar dependencias del sistema y extensiones necesarias de PHP
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpq-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql gd zip bcmath intl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Composer (desde imagen oficial)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Establecer directorio de trabajo
WORKDIR /var/www/html

# Copiar archivos del proyecto
COPY . .

# Instalar dependencias de Laravel (sin las de desarrollo)
RUN composer install --optimize-autoloader --no-dev

# Generar la clave de aplicación si no existe
RUN php artisan key:generate || true

# Asignar permisos adecuados
RUN chmod -R 775 storage bootstrap/cache

# Exponer el puerto para Render
EXPOSE 10000

# Comando de inicio del servidor Laravel
CMD php artisan serve --host=0.0.0.0 --port=10000
