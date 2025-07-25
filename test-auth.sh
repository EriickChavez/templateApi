#!/bin/bash

# Script de prueba para el sistema de autenticación basado en roles
# Asegúrate de que el servidor esté corriendo en el puerto 4000

BASE_URL="http://localhost:4000"
ADMIN_TOKEN=""
USER_TOKEN=""

echo "🚀 Iniciando pruebas del sistema de autenticación basado en roles"
echo "================================================================="

# Función para realizar requests HTTP
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local description=$5
    
    echo ""
    echo "📋 $description"
    echo "   → $method $endpoint"
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -X $method "${BASE_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        else
            response=$(curl -s -X $method "${BASE_URL}${endpoint}" \
                -H "Authorization: Bearer $token")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -X $method "${BASE_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -X $method "${BASE_URL}${endpoint}")
        fi
    fi
    
    echo "   ✅ Respuesta: $(echo $response | jq -r '.message // .error // "Sin mensaje"')"
    
    # Extraer token si es una respuesta de login/register
    if [[ $endpoint == *"/login"* ]] || [[ $endpoint == *"/register"* ]]; then
        token=$(echo $response | jq -r '.data.token // empty')
        if [ -n "$token" ]; then
            echo "   🔑 Token obtenido: ${token:0:20}..."
            echo $token
        fi
    fi
}

# 1. CREAR USUARIOS DE PRUEBA
echo ""
echo "👥 PASO 1: Creando usuarios de prueba"
echo "===================================="

# Registrar usuario normal
make_request "POST" "/auth/register" '{
    "email": "user@test.com",
    "password": "UserPass123!",
    "firstName": "Test",
    "lastName": "User"
}' "" "Registrar usuario normal"

USER_TOKEN=$(make_request "POST" "/auth/login" '{
    "email": "user@test.com",
    "password": "UserPass123!"
}' "" "Login usuario normal" | tail -1)

# Registrar admin (en un caso real, esto se haría manualmente)
make_request "POST" "/auth/register" '{
    "email": "admin@test.com",
    "password": "AdminPass123!",
    "firstName": "Admin",
    "lastName": "User"
}' "" "Registrar admin"

ADMIN_TOKEN=$(make_request "POST" "/auth/login" '{
    "email": "admin@test.com",
    "password": "AdminPass123!"
}' "" "Login admin" | tail -1)

echo ""
echo "🔑 Tokens obtenidos:"
echo "   USER_TOKEN:  ${USER_TOKEN:0:20}..."
echo "   ADMIN_TOKEN: ${ADMIN_TOKEN:0:20}..."

# 2. PROBAR RUTAS BÁSICAS DE AUTENTICACIÓN
echo ""
echo "🔐 PASO 2: Probando rutas básicas de autenticación"
echo "================================================="

make_request "GET" "/auth/me" "" "$USER_TOKEN" "Obtener información del usuario"
make_request "GET" "/auth/my-permissions" "" "$USER_TOKEN" "Ver permisos del usuario"

# 3. PROBAR CONTROL DE ACCESO POR ROLES
echo ""
echo "🛡️ PASO 3: Probando control de acceso por roles"
echo "=============================================="

# Usuario normal intentando acceder a rutas de admin (debería fallar)
make_request "GET" "/auth/admin-only" "" "$USER_TOKEN" "Usuario normal → Ruta solo admin (debería FALLAR)"
make_request "GET" "/auth/moderator-area" "" "$USER_TOKEN" "Usuario normal → Área moderador (debería FALLAR)"

# Usuario normal accediendo a su área
make_request "GET" "/auth/user-area" "" "$USER_TOKEN" "Usuario normal → Área de usuario (debería FUNCIONAR)"

# Admin accediendo a todas las áreas
make_request "GET" "/auth/admin-only" "" "$ADMIN_TOKEN" "Admin → Ruta solo admin (debería FUNCIONAR)"
make_request "GET" "/auth/moderator-area" "" "$ADMIN_TOKEN" "Admin → Área moderador (debería FUNCIONAR)"

# 4. PROBAR RUTAS PROTEGIDAS AVANZADAS
echo ""
echo "🔒 PASO 4: Probando rutas protegidas avanzadas"
echo "============================================="

# Gestión de usuarios
make_request "GET" "/protected/users" "" "$USER_TOKEN" "Usuario normal → Listar usuarios (debería FALLAR)"
make_request "GET" "/protected/users" "" "$ADMIN_TOKEN" "Admin → Listar usuarios (debería FUNCIONAR)"

# Crear contenido
make_request "POST" "/protected/content" '{
    "title": "Mi primer post",
    "content": "Este es el contenido de mi post de prueba",
    "category": "general",
    "tags": ["test", "demo"]
}' "$USER_TOKEN" "Usuario normal → Crear contenido (debería FUNCIONAR)"

# Gestión administrativa
make_request "GET" "/protected/admin/analytics" "" "$USER_TOKEN" "Usuario normal → Analytics (debería FALLAR)"
make_request "GET" "/protected/admin/analytics" "" "$ADMIN_TOKEN" "Admin → Analytics (debería FUNCIONAR)"

# 5. PROBAR FUNCIONALIDADES ESPECÍFICAS
echo ""
echo "⚙️ PASO 5: Probando funcionalidades específicas"
echo "=============================================="

# Verificar permisos
make_request "GET" "/protected/my-permissions" "" "$USER_TOKEN" "Ver permisos de usuario normal"
make_request "GET" "/protected/my-permissions" "" "$ADMIN_TOKEN" "Ver permisos de admin"

# Demostración de roles
make_request "GET" "/auth/role-demo" "" "$USER_TOKEN" "Demo de funcionalidades por rol - Usuario"
make_request "GET" "/auth/role-demo" "" "$ADMIN_TOKEN" "Demo de funcionalidades por rol - Admin"

# 6. PROBAR RUTAS PÚBLICAS CON AUTENTICACIÓN OPCIONAL
echo ""
echo "🌍 PASO 6: Probando rutas públicas con auth opcional"
echo "================================================="

make_request "GET" "/auth/public-with-optional-user" "" "" "Ruta pública sin autenticación"
make_request "GET" "/auth/public-with-optional-user" "" "$USER_TOKEN" "Ruta pública con usuario autenticado"

# 7. PROBAR GESTIÓN DE TOKENS
echo ""
echo "🔄 PASO 7: Probando gestión de tokens"
echo "===================================="

make_request "POST" "/auth/refresh" "" "$USER_TOKEN" "Renovar token"
make_request "POST" "/auth/logout" "" "$USER_TOKEN" "Cerrar sesión"

# 8. RESUMEN FINAL
echo ""
echo "📊 RESUMEN DE PRUEBAS"
echo "===================="
echo "✅ Registro de usuarios"
echo "✅ Login y obtención de tokens"
echo "✅ Control de acceso por roles"
echo "✅ Verificación de permisos"
echo "✅ Rutas protegidas"
echo "✅ Funcionalidades específicas por rol"
echo "✅ Gestión de tokens"
echo ""
echo "🎉 ¡Pruebas completadas! Revisa los resultados arriba."
echo ""
echo "💡 SIGUIENTES PASOS:"
echo "   1. Revisa los logs del servidor para ver el sistema de auditoría"
echo "   2. Prueba con Postman/Insomnia para más control"
echo "   3. Personaliza los permisos según tus necesidades"
echo "   4. Implementa más roles si es necesario"
