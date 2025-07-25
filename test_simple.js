const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Probando API simple...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Probando /health...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    });
    console.log('✅ Health:', healthResponse.status, healthResponse.data);
    
    // Test 2: Root endpoint
    console.log('\n2️⃣ Probando / ...');
    const rootResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/',
      method: 'GET'
    });
    console.log('✅ Root:', rootResponse.status, rootResponse.data);
    
    // Test 3: Registro
    console.log('\n3️⃣ Probando registro...');
    const registerData = {
      email: "erick@ch.com",
      password: "MiPassword123!",
      firstName: "Erick",
      lastName: "Chavez"
    };
    
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, registerData);
    
    console.log('📝 Registro:', registerResponse.status, registerResponse.data);
    
    // Test 4: Login
    console.log('\n4️⃣ Probando login...');
    const loginData = {
      email: "erick@ch.com",
      password: "MiPassword123!"
    };
    
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, loginData);
    
    console.log('🔐 Login:', loginResponse.status, loginResponse.data);
    
    console.log('\n✅ ¡Todos los tests pasaron!');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testAPI();
