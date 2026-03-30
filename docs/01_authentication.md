# 인증

## 1. Access Token 발급

**POST** `https://oauth.codef.io/oauth/token`

### Request

```
Headers:
  Authorization: Basic base64(client_id:client_secret)
  Content-Type: application/x-www-form-urlencoded

Body:
  grant_type=client_credentials&scope=read
```

### Response

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 604799
}
```

> 토큰 유효기간: 7일 (604,799초). 매 요청마다 새로 발급 권장.

---

## 2. RSA Public Key 조회

**GET** `https://development.codef.io/v1/util/public-key`

### Request

```
Headers:
  Authorization: Bearer {access_token}
```

### Response

```json
{
  "publicKey": "MIIBIjANBgkq..."
}
```

### 비밀번호 암호화

```js
const crypto = require('crypto');

function encryptPassword(publicKeyBase64, password) {
  const publicKey = crypto.createPublicKey({
    key: `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`,
    format: 'pem',
    type: 'spki'
  });
  const encrypted = crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(password, 'utf8')
  );
  return encrypted.toString('base64');
}
```

> 암호화 방식: RSA PKCS1 v1.5 → Base64 인코딩

---

## 3. 계정 등록 (connectedId 발급)

**POST** `https://development.codef.io/v1/account/create`

### Request

```
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/x-www-form-urlencoded

Body: encodeURIComponent(JSON.stringify(payload))
```

```json
{
  "accountList": [
    {
      "countryCode": "KR",
      "businessType": "CD",
      "clientType": "B",
      "organization": "0306",
      "loginType": "1",
      "loginTypeLevel": "0",
      "id": "YOUR_ID",
      "password": "RSA_ENCRYPTED_PASSWORD"
    }
  ]
}
```

### 파라미터 설명

| Key | 값 | 설명 |
|---|---|---|
| countryCode | `KR` | 고정 |
| businessType | `CD` | 카드 고정 |
| clientType | `B` | 법인(Business) |
| organization | `0306` | 신한 법인카드 |
| loginType | `1` | 아이디/패스워드 |
| loginTypeLevel | `0` | 이용자 (`1`: 사업장/부서관리자, `2`: 총괄관리자) |

### Response

```json
{
  "result": { "code": "CF-00000", "message": "성공" },
  "data": {
    "connectedId": "YOUR_CONNECTED_ID"
  }
}
```

> - 이용자 계정(`loginTypeLevel: 0`): 본인 카드만 조회 가능
> - 총괄관리자 계정(`loginTypeLevel: 2`): 전체 카드 조회 가능
> - 여러 이용자의 ID/PW로 각각 계정 등록하면 각기 다른 `connectedId` 발급

---

## 4. Node.js 전체 예제

```js
const https = require('https');
const crypto = require('crypto');

const CLIENT_ID = 'your_client_id';
const CLIENT_SECRET = 'your_client_secret';

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await httpsRequest({
    hostname: 'oauth.codef.io', path: '/oauth/token', method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, 'grant_type=client_credentials&scope=read');
  return res.body.access_token;
}
```
