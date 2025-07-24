#!/usr/bin/env node

const readline = require('readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdmin() {
  console.log('🔐 CREADOR DE USUARIO ADMINISTRADOR');
  console.log('===================================\n');

  try {
    const email = await question('📧 Email del admin: ');
    const password = await question('🔑 Contraseña: ');
    const firstName = await question('👤 Nombre: ');
    const lastName = await question('👤 Apellido: ');

    console.log('\n🔄 Procesando...\n');

    // Validar datos
    if (!email || !password || !firstName || !lastName) {
      console.log('❌ Todos los campos son requeridos');
      process.exit(1);
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Datos del admin
    const adminData = {
      email,
      password,
      firstName,
      lastName,
      role: 'admin'
    };

    console.log('✅ USUARIO ADMIN CREADO');
    console.log('=======================');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Nombre: ${firstName} ${lastName}`);
    console.log(`🛡️  Rol: ADMIN`);
    console.log(`🔐 Password Hash: ${passwordHash}\n`);

    console.log('🚀 INSTRUCCIONES PARA USAR:');
    console.log('============================');
    console.log('1. Inicia tu servidor: npm run dev');
    console.log('2. Registra este usuario con el endpoint POST /auth/register');
    console.log('3. Una vez registrado, cambia su rol manualmente\n');

    console.log('📋 DATOS PARA EL REGISTRO:');
    console.log(JSON.stringify(adminData, null, 2));

    console.log('\n💡 También puedes usar estos comandos curl:');
    console.log('===========================================');
    
    console.log('\n# 1. Registrar usuario:');
    console.log(`curl -X POST http://localhost:3000/auth/register \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(adminData)}'`);

    console.log('\n# 2. Login:');
    console.log(`curl -X POST http://localhost:3000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "${email}", "password": "${password}"}'`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

createAdmin();
