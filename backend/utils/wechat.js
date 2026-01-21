const https = require('https');

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            resolve(json);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

async function code2Session({ appId, secret, code }) {
  const url =
    `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appId)}` +
    `&secret=${encodeURIComponent(secret)}` +
    `&js_code=${encodeURIComponent(code)}` +
    `&grant_type=authorization_code`;

  const result = await getJson(url);
  if (result.errcode) {
    const error = new Error(result.errmsg || 'code2session failed');
    error.errcode = result.errcode;
    throw error;
  }
  return result;
}

module.exports = {
  code2Session
};

