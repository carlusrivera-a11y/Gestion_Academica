FROM php:8.2-fpm

# ----------------------------
# Instalar dependencias del sistema
# ----------------------------
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl \
    libzip-dev \
    libcurl4-openssl-dev \
    npm \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ----------------------------
# Habilitar extensiones PHP necesarias
# ----------------------------
RUN docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip curl

# ----------------------------
# Instalar Composer
# ----------------------------
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ----------------------------
# Directorio de trabajo
# ----------------------------
WORKDIR /var/www

# ----------------------------
# Copiar archivos de proyecto
# ----------------------------
COPY composer.json composer.lock ./
COPY package.json package-lock.json* ./
COPY . .

# ----------------------------
# Instalar dependencias PHP y Node
# ----------------------------
RUN composer install --no-interaction --optimize-autoloader
RUN npm install
RUN npm run build

# ----------------------------
# Cache Laravel
# ----------------------------
RUN php artisan config:cache
RUN php artisan route:cache
RUN php artisan view:cache

# ----------------------------
# Exponer puerto
# ----------------------------
EXPOSE 8000

# ----------------------------
# Comando por defecto
# ----------------------------
CMD php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
