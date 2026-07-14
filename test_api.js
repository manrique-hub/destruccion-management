const http = require('http');

async function test() {
  const email = 'admin.principal@humax.co';
  const password = 'AdminPassword123!'; // A standard password to try

  // 1) POST /api/auth/register
  console.log('--- 1) POST /api/auth/register ---');
  let registerRes;
  try {
    registerRes = await makeRequest('POST', '/api/auth/register', {
      nombre: 'Admin Principal',
      cargo: 'Administrador',
      email: email,
      correoCoporativo: email,
      password: password,
      rol: 'admin'
    });
    console.log('Register Success:', registerRes);
  } catch (err) {
    console.log('Register Failed:', err.message, err.body);
    registerRes = { err };
  }

  let id = null;
  // 2) If failed or if we need to search: GET /api/users?page=1&pageSize=200&search=admin.principal@humax.co
  if (registerRes.err || !registerRes.user || !registerRes.user.id) {
    console.log('--- 2) GET /api/users?page=1&pageSize=200&search=... ---');
    try {
      const searchRes = await makeRequest('GET', \/api/users?page=1&pageSize=200&search=\\);
      console.log('Search Success:', JSON.stringify(searchRes, null, 2));
      const user = searchRes.items && searchRes.items.find(u => {
        return (u.usuario && u.usuario.toLowerCase() === email.toLowerCase()) || 
               (u.correo_personal && u.correo_personal.toLowerCase() === email.toLowerCase()) ||
               (u.correo_corporativo && u.correo_corporativo.toLowerCase() === email.toLowerCase());
      });
      if (user) {
        id = user.id;
        console.log('Found User ID:', id);
      } else {
        console.log('User not found in searches.');
      }
    } catch (err) {
      console.error('Search Request Failed:', err);
    }
  } else {
    id = registerRes.user.id;
    console.log('User Registered with ID:', id);
  }

  if (id) {
    // 3) PATCH /api/users/{id}/status con activo=true
    console.log('--- 3) PATCH /api/users/{id}/status with activo=true ---');
    let patchSuccess = false;
    let patchRes;
    try {
      patchRes = await makeRequest('PATCH', \/api/users/\/status\, { activo: true });
      console.log('PATCH Status Success:', patchRes);
      patchSuccess = true;
    } catch (err) {
      console.error('PATCH Status Failed:', err);
    }

    // 4) POST /api/auth/login
    console.log('--- 4) POST /api/auth/login ---');
    try {
      const loginRes = await makeRequest('POST', '/api/auth/login', {
        email: email,
        password: password
      });
      console.log('Login Success:', loginRes);
      console.log('FINAL RESULT:', {
        id: id,
        activo: patchSuccess ? true : (patchRes && patchRes.user && patchRes.user.activo),
        rol: (loginRes && loginRes.user && loginRes.user.rol) || (patchRes && patchRes.user && patchRes.user.rol) || 'admin',
        loginExitoso: !!loginRes
      });
    } catch (err) {
      console.error('Login Failed:', err);
      // Let's get actual current state of user anyway
      try {
        const searchRes = await makeRequest('GET', \/api/users?page=1&pageSize=200&search=\\);
        const user = searchRes.items && searchRes.items.find(u => u.id === id);
        console.log('FINAL RESULT:', {
          id: id,
          activo: user ? user.activo : false,
          rol: user ? user.rol : 'admin',
          loginExitoso: false
        });
      } catch (searchErr) {
        console.error('Fetch Final Status Failed:', searchErr);
      }
    }
  }
}

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          const err = new Error(\Request failed with status \\);
          err.body = parsed;
          err.statusCode = res.statusCode;
          reject(err);
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

test();
