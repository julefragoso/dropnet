#!/bin/bash

# Script para iniciar el servidor de producción de DropNet
echo "🚀 Iniciando DropNet en modo producción..."

# Limpiar build anterior
echo "🧹 Limpiando build anterior..."
rm -rf dist

# Instalar dependencias si es necesario
echo "📦 Verificando dependencias..."
npm install

# Build de producción
echo "🔨 Construyendo aplicación para producción..."
npm run build:prod

# Verificar si el build fue exitoso
if [ $? -eq 0 ]; then
    echo "✅ Build completado exitosamente!"
    echo "🌐 Iniciando servidor en http://localhost:3000"
    echo "📱 Presiona Ctrl+C para detener el servidor"
    echo ""
    
    # Iniciar servidor
    npm run serve
else
    echo "❌ Error en el build. Revisa los errores arriba."
    exit 1
fi 