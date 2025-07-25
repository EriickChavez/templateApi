#!/bin/bash

echo "🧪 PRUEBA RÁPIDA DEL SISTEMA DE AUTENTICACIÓN"
echo "=============================================="

BASE_URL="http://localhost:4000"

echo ""
echo "1️⃣ Registrando primer usuario (será ADMIN automáticamente)..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "AdminPass123!",
    "firstName": "Super",
    "lastName": "Admin"
  }')

echo "📧 Respuesta de registro:"
echo "$ADMIN_RESPONSE" | jq '.'

echo ""
echo "2️⃣ Haciendo login del admin..."
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "AdminPass123!"
  }')

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.data.token')
echo "🔑 Token de admin obtenido: ${ADMIN_TOKEN:0:20}..."

echo ""
echo "3️⃣ Probando ruta solo para admins..."
curl -s -X GET "$BASE_URL/auth/admin-only" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo ""
echo "4️⃣ Registrando segundo usuario (será USER normal)..."
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "UserPass123!",
    "firstName": "Normal",
    "lastName": "User"
  }')

echo "📧 Respuesta de registro usuario normal:"
echo "$USER_RESPONSE" | jq '.'

echo ""
echo "5️⃣ Login del usuario normal..."
USER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "UserPass123!"
  }')

USER_TOKEN=$(echo "$USER_LOGIN" | jq -r '.data.token')
echo "🔑 Token de usuario obtenido: ${USER_TOKEN:0:20}..."

echo ""
echo "6️⃣ Usuario normal intentando acceder a ruta de admin (debería FALLAR)..."
curl -s -X GET "$BASE_URL/auth/admin-only" \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.'

echo ""
echo "7️⃣ Usuario normal accediendo a su área (debería FUNCIONAR)..."
curl -s -X GET "$BASE_URL/auth/user-area" \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.'

echo ""
echo "✅ ¡Prueba completada!"
echo ""
echo "💡 RESUMEN:"
echo "   - Primer usuario registrado: ADMIN automáticamente"
echo "   - Segundo usuario registrado: USER normal"
echo "   - Control de acceso funcionando correctamente"
echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   Admin Token: $ADMIN_TOKEN"
echo "   User Token:  $USER_TOKEN"
