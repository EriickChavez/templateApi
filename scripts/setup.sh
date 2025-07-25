#!/bin/bash

# Script de setup automático para Template API
# Autor: Template API Team
# Versión: 1.0

set -e  # Exit on any error

BASE_URL="http://localhost:4000"
ADMIN_EMAIL="admin@templateapi.com"
ADMIN_PASSWORD="MiPassword123!"

echo "🚀 SETUP AUTOMÁTICO - TEMPLATE API"
echo "=================================="
echo ""

# Función para verificar si el servidor está corriendo
check_server() {
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Función para esperar que el servidor esté listo
wait_for_server() {
    echo "⏳ Esperando que el servidor esté listo..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if check_server; then
            echo "✅ Servidor está listo!"
            return 0
        fi
        
        attempts=$((attempts + 1))
        echo "   Intento $attempts/$max_attempts..."
        sleep 2
    done
    
    echo "❌ El servidor no está respondiendo después de $max_attempts intentos"
    echo "   Por favor, ejecuta 'npm run dev' en otra terminal"
    exit 1
}

# Función para registrar usuario admin
register_admin() {
    echo "📝 Registrando usuario administrador..."
    
    local response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$ADMIN_EMAIL\",
            \"password\": \"$ADMIN_PASSWORD\",
            \"firstName\": \"Admin\",
            \"lastName\": \"Principal\",
            \"middleName\": \"Sistema\"
        }")
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "201" ]; then
        echo "✅ Usuario administrador registrado exitosamente"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    elif [ "$http_code" = "409" ]; then
        echo "⚠️  Usuario administrador ya existe"
    else
        echo "❌ Error registrando usuario administrador (HTTP $http_code)"
        echo "$body"
        return 1
    fi
}

# Función para hacer login y obtener token
get_token() {
    echo "🔐 Haciendo login y obteniendo token..."
    
    local response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$ADMIN_EMAIL\",
            \"password\": \"$ADMIN_PASSWORD\"
        }")
    
    local token=$(echo "$response" | jq -r '.data.token' 2>/dev/null)
    
    if [ "$token" != "null" ] && [ -n "$token" ]; then
        echo "✅ Token obtenido exitosamente"
        echo "   Token: ${token:0:20}..."
        export TOKEN="$token"
        return 0
    else
        echo "❌ Error obteniendo token"
        echo "$response"
        return 1
    fi
}

# Función para verificar endpoints
test_endpoints() {
    echo "🧪 Probando endpoints principales..."
    
    # Test endpoint público
    echo "   - Probando endpoint público..."
    local health_response=$(curl -s "$BASE_URL/health")
    local health_status=$(echo "$health_response" | jq -r '.status' 2>/dev/null)
    
    if [ "$health_status" = "OK" ]; then
        echo "     ✅ Health check: OK"
    else
        echo "     ❌ Health check: Error"
    fi
    
    # Test endpoint protegido
    if [ -n "$TOKEN" ]; then
        echo "   - Probando endpoint protegido..."
        local me_response=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/auth/me")
        local user_name=$(echo "$me_response" | jq -r '.data.name' 2>/dev/null)
        
        if [ -n "$user_name" ] && [ "$user_name" != "null" ]; then
            echo "     ✅ Usuario autenticado: $user_name"
        else
            echo "     ❌ Error en endpoint protegido"
        fi
        
        # Test health check de base de datos
        echo "   - Probando health check de BD..."
        local db_health=$(curl -s "$BASE_URL/db/health")
        local db_status=$(echo "$db_health" | jq -r '.message' 2>/dev/null)
        
        if [ -n "$db_status" ]; then
            echo "     ✅ Base de datos: $db_status"
        else
            echo "     ❌ Error en health check de BD"
        fi
    fi
}

# Función para mostrar información útil
show_info() {
    echo ""
    echo "🎉 SETUP COMPLETADO"
    echo "==================="
    echo ""
    echo "📋 INFORMACIÓN IMPORTANTE:"
    echo "   🌐 URL Base: $BASE_URL"
    echo "   👤 Admin Email: $ADMIN_EMAIL"
    echo "   🔑 Admin Password: $ADMIN_PASSWORD"
    echo ""
    echo "🔗 ENDPOINTS ÚTILES:"
    echo "   📖 Documentación: README.md"
    echo "   🌐 Health Check: $BASE_URL/health"
    echo "   🗄️  BD Health: $BASE_URL/db/health"
    echo "   👤 Mi Info: $BASE_URL/auth/me"
    echo ""
    echo "📚 RECURSOS:"
    echo "   📖 Guía cURL: docs/CURL_GUIDE.md"
    echo "   🏗️  Inyección DI: docs/DEPENDENCY_INJECTION.md"
    echo "   📬 Postman: postman/template_api_collection.json"
    echo ""
    echo "💡 COMANDOS ÚTILES:"
    echo "   # Login rápido"
    echo "   TOKEN=\$(curl -s -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}' | jq -r '.data.token')"
    echo ""
    echo "   # Ver mi información"
    echo "   curl -H \"Authorization: Bearer \$TOKEN\" $BASE_URL/auth/me | jq"
    echo ""
    echo "   # Ver estadísticas"
    echo "   curl -H \"Authorization: Bearer \$TOKEN\" $BASE_URL/db/stats | jq"
    echo ""
}

# Función principal
main() {
    echo "1️⃣  Verificando servidor..."
    wait_for_server
    
    echo ""
    echo "2️⃣  Configurando usuario administrador..."
    register_admin
    
    echo ""
    echo "3️⃣  Obteniendo token de acceso..."
    get_token
    
    echo ""
    echo "4️⃣  Verificando endpoints..."
    test_endpoints
    
    echo ""
    show_info
}

# Verificar dependencias
if ! command -v curl &> /dev/null; then
    echo "❌ curl no está instalado. Por favor instálalo primero."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "⚠️  jq no está instalado. Las respuestas JSON no se formatearán correctamente."
    echo "   Para instalarlo: brew install jq (macOS) o apt-get install jq (Ubuntu)"
fi

# Ejecutar función principal
main

echo "🎯 ¡Setup completado! Ya puedes usar tu Template API."
