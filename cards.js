const https = require('https');
const crypto = require('crypto');

// .env 파일 또는 환경변수에서 로드 (절대 코드에 직접 입력하지 마세요)
const CLIENT_ID = process.env.CODEF_CLIENT_ID;
const CLIENT_SECRET = process.env.CODEF_CLIENT_SECRET;
const CONNECTED_ID = process.env.CODEF_CONNECTED_ID;

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const body = 'grant_type=client_credentials&scope=read';

  const options = {
    hostname: 'oauth.codef.io',
    path: '/oauth/token',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };

  const res = await httpsRequest(options, body);
  console.log('Token response:', res.status, JSON.stringify(res.body, null, 2));
  return res.body.access_token;
}

async function getPublicKey(token) {
  const options = {
    hostname: 'development.codef.io',
    path: '/v1/util/public-key',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  };

  const res = await httpsRequest(options, null);
  console.log('PublicKey response:', res.status, JSON.stringify(res.body, null, 2));
  return res.body.publicKey;
}

function encryptPassword(publicKeyPem, password) {
  // CODEF uses RSA PKCS1 v1.5 encryption
  const publicKey = crypto.createPublicKey({
    key: `-----BEGIN PUBLIC KEY-----\n${publicKeyPem}\n-----END PUBLIC KEY-----`,
    format: 'pem',
    type: 'spki'
  });
  const encrypted = crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(password, 'utf8')
  );
  return encrypted.toString('base64');
}

async function apiRequest(token, path, payload) {
  const body = encodeURIComponent(JSON.stringify(payload));

  const options = {
    hostname: 'development.codef.io',
    path: path,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    }
  };

  const res = await httpsRequest(options, body);
  // 응답이 URL 인코딩된 문자열인 경우 디코딩
  let parsed = res.body;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(decodeURIComponent(parsed));
    } catch {}
  }
  return { status: res.status, body: parsed };
}

async function getCards(token) {
  // 신한 법인카드 카드 목록 조회
  const endpoints = [
    '/v1/kr/card/b/account/card-list',
    '/v1/kr/card/b/account/cards',
    '/v1/kr/card/b/card/list',
  ];

  for (const path of endpoints) {
    const payload = {
      connectedId: CONNECTED_ID,
      organization: '0306',
      inquiryType: '0',
      loginTypeLevel: '0',
    };

    console.log(`\n시도: ${path}`);
    const res = await apiRequest(token, path, payload);
    console.log('Status:', res.status);
    console.log(JSON.stringify(res.body, null, 2));

    if (res.body?.result?.code !== 'CF-00003') {
      return res.body;
    }
  }
}

async function getApprovalList(token) {
  const payload = {
    connectedId: CONNECTED_ID,
    organization: '0306',
    loginTypeLevel: '0',
    inquiryType: '0',  // 0: 전체, 1: 승인, 2: 취소
    cardNo: '451844******1635',  // 카드목록에서 반환된 마스킹 번호 그대로
    startDate: '20260330',
    endDate: '20260330',
    orderBy: '0',
  };

  console.log('\n=== 승인내역 조회 ===');
  console.log('요청 payload:', JSON.stringify(payload, null, 2));
  const res = await apiRequest(token, '/v1/kr/card/b/account/approval-list', payload);
  console.log('Status:', res.status);
  console.log(JSON.stringify(res.body, null, 2));
  return res.body;
}

async function getTodayApprovalList(token) {
  const payload = {
    connectedId: CONNECTED_ID,
    organization: '0307',
    loginTypeLevel: '0',
    inquiryType: '0',   // 0: 카드별 조회
    cardNo: '451844******1635',
    orderBy: '0',       // 0: 최신순
  };

  console.log('\n=== 당일 승인내역 조회 ===');
  console.log('요청 payload:', JSON.stringify(payload, null, 2));
  const res = await apiRequest(token, '/v1/kr/card/b/account/the-day-approval-list', payload);
  console.log('Status:', res.status);
  console.log(JSON.stringify(res.body, null, 2));
  return res.body;
}

async function main() {
  try {
    console.log('1. 토큰 발급 중...');
    const token = await getToken();
    if (!token) {
      console.error('토큰 발급 실패');
      return;
    }
    console.log('토큰 발급 성공:', token.substring(0, 20) + '...\n');

    console.log('2. 당일 승인내역 조회 중...');
    await getTodayApprovalList(token);
  } catch (err) {
    console.error('오류:', err.message);
  }
}

main();
