const http = require('http');

function requestJson({ method, url, data }) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = data ? Buffer.from(JSON.stringify(data)) : null;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname + u.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': body.length } : {})
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(raw) });
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${raw}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const api = `${baseUrl}/api`;

  const health = await requestJson({ method: 'GET', url: `${baseUrl}/health` });
  console.log('health:', health.statusCode, health.data?.data?.status);

  const login = await requestJson({
    method: 'POST',
    url: `${api}/wechat/login`,
    data: { code: `smoke_${Date.now()}`, nickname: '联调用户', avatar_url: '/image/dog.png' }
  });
  const userId = login.data?.data?.user?.id;
  console.log('login:', login.statusCode, 'userId=', userId, 'mock=', login.data?.mock);
  if (!userId) throw new Error('login failed: missing userId');

  const donationPrepay = await requestJson({
    method: 'POST',
    url: `${api}/pay/donation/1/prepay`,
    data: { user_id: userId, amount: 1 }
  });
  console.log('donation prepay:', donationPrepay.statusCode, donationPrepay.data?.data);

  const productBefore = await requestJson({ method: 'GET', url: `${api}/products/1` });
  console.log('product before:', productBefore.statusCode, {
    stock: productBefore.data?.data?.stock,
    sales: productBefore.data?.data?.sales
  });

  const orderPrepay = await requestJson({
    method: 'POST',
    url: `${api}/pay/order/prepay`,
    data: { user_id: userId, product_id: 1, quantity: 1 }
  });
  console.log('order prepay:', orderPrepay.statusCode, orderPrepay.data?.data?.order);

  const productAfter = await requestJson({ method: 'GET', url: `${api}/products/1` });
  console.log('product after:', productAfter.statusCode, {
    stock: productAfter.data?.data?.stock,
    sales: productAfter.data?.data?.sales
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

