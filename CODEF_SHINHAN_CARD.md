# CODEF 신한 법인카드 API 연동 가이드

## 환경

- **Runtime**: Node.js (내장 모듈만 사용, 별도 패키지 불필요)
- **CODEF 서버**: `development.codef.io` (데모), `api.codef.io` (운영)
- **OAuth 서버**: `oauth.codef.io`

---

## 인증 정보

```
client_id:     73ff2cf3-8ff8-4cad-95fa-935fc53509ea
client_secret: f9c9bda8-5cdc-4e35-ba52-fbc7b99ea564
```

---

## 플로우

```
1. Access Token 발급  (oauth.codef.io)
2. RSA Public Key 조회  (선택 - 계정 등록 시 필요)
3. 계정 등록  → connectedId 발급
4. 카드 목록 조회
5. 승인내역 조회
```

---

## 1. Access Token 발급

**POST** `https://oauth.codef.io/oauth/token`

```
Headers:
  Authorization: Basic base64(client_id:client_secret)
  Content-Type: application/x-www-form-urlencoded

Body:
  grant_type=client_credentials&scope=read
```

```json
// Response
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 604799
}
```

---

## 2. RSA Public Key 조회

**GET** `https://development.codef.io/v1/util/public-key`

```
Headers:
  Authorization: Bearer {access_token}
```

```json
// Response
{
  "publicKey": "MIIBIjANBgkq..."
}
```

> 비밀번호 암호화 방식: RSA PKCS1 v1.5 → Base64 인코딩

---

## 3. 계정 등록

**POST** `https://development.codef.io/v1/account/create`

```
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/x-www-form-urlencoded

Body: encodeURIComponent(JSON.stringify(payload))
```

```json
// Payload
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

```json
// Response (성공)
{
  "result": { "code": "CF-00000", "message": "성공" },
  "data": {
    "connectedId": "56Yznkq7A1T9Vs3UW80lNK"
  }
}
```

### 계정 등록 파라미터 설명

| Key | 값 | 설명 |
|---|---|---|
| countryCode | `KR` | 고정 |
| businessType | `CD` | 카드 고정 |
| clientType | `B` | 법인(Business) |
| organization | `0306` | 신한 법인카드 |
| loginType | `1` | 아이디/패스워드 |
| loginTypeLevel | `0` | 이용자 |

---

## 4. 카드 목록 조회

**POST** `https://development.codef.io/v1/kr/card/b/account/card-list`

```json
// Payload
{
  "connectedId": "56Yznkq7A1T9Vs3UW80lNK",
  "organization": "0306",
  "loginTypeLevel": "0",
  "inquiryType": "0"
}
```

```json
// Response (성공)
{
  "result": { "code": "CF-00000", "message": "성공" },
  "data": [
    {
      "resUserNm": "최*식",
      "resCardNo": "451844******1635",
      "resIssueDate": "20240206",
      "resSleepYN": "N",
      "resCardName": "신한 T&E",
      "resCardType": "신한카드"
    }
  ]
}
```

---

## 5. 승인내역 조회

**POST** `https://development.codef.io/v1/kr/card/b/account/approval-list`

```json
// Payload
{
  "connectedId": "56Yznkq7A1T9Vs3UW80lNK",
  "organization": "0306",
  "loginTypeLevel": "0",
  "inquiryType": "0",
  "cardNo": "451844******1635",
  "startDate": "20260101",
  "endDate": "20260330",
  "orderBy": "0"
}
```

### 파라미터 설명

| Key | 값 | 설명 |
|---|---|---|
| inquiryType | `0` | 전체 (승인+취소) |
| cardNo | 마스킹 번호 그대로 | 카드목록 조회 결과값 사용 |
| startDate | `YYYYMMDD` | 조회 시작일 |
| endDate | `YYYYMMDD` | 조회 종료일 |
| orderBy | `0` | 최신순, `1`: 과거순 |

```json
// Response (성공)
{
  "result": { "code": "CF-00000", "message": "성공" },
  "data": [
    {
      "resUsedDate": "20260330",
      "resUsedTime": "100232",
      "resCardNo": "451844******1635",
      "resMemberStoreName": "오피카 로스터리",
      "resUsedAmount": "12500",
      "resPaymentType": "1",
      "resInstallmentMonth": "0",
      "resApprovalNo": "31441993",
      "resHomeForeignType": "1",
      "resAccountCurrency": "KRW",
      "resCancelYN": "0",
      "resCancelAmount": ""
    }
  ]
}
```

### 주요 응답 필드

| Field | 설명 |
|---|---|
| resUsedDate | 사용일 (YYYYMMDD) |
| resUsedTime | 사용시간 (HHmmss) |
| resMemberStoreName | 가맹점명 (`+`는 공백으로 치환) |
| resUsedAmount | 사용금액 |
| resPaymentType | `1`: 일시불 |
| resApprovalNo | 승인번호 |
| resHomeForeignType | `1`: 국내, `2`: 해외 |
| resCancelYN | `0`: 정상, `1`: 취소 |
| resCancelAmount | 취소금액 |

---

## 지원 API 현황 (organization: 0306)

| API | 엔드포인트 | 지원 |
|---|---|---|
| 카드 목록 조회 | `/v1/kr/card/b/account/card-list` | ✅ |
| 승인내역 조회 | `/v1/kr/card/b/account/approval-list` | ✅ |
| 당일 승인내역 | `/v1/kr/card/b/account/the-day-approval-list` | ❌ |
| 청구서/결제/포인트 등 | 기타 | ❌ |

---

## 요청 공통 규칙

- **Content-Type**: `application/x-www-form-urlencoded`
- **Body 형식**: `encodeURIComponent(JSON.stringify(payload))`
- **응답**: URL 인코딩된 문자열 → `JSON.parse(decodeURIComponent(response))` 로 파싱

---

## 에러 코드

| Code | 설명 |
|---|---|
| CF-00000 | 성공 |
| CF-00003 | 해당 기관 미지원 API |
| CF-00016 | 중복 요청 (잠시 후 재시도) |
| CF-00004 | 잘못된 도메인 (데모→`development.codef.io`) |
| CF-09002 | organization 코드 오류 또는 미지원 |
| CF-12411 | 필수 파라미터 누락 |
| CF-12803 | 아이디/비밀번호 오류 |
| CF-13002 | 잘못된 파라미터 |
| CF-13100 | 카드번호 오류 |

---

## 다중 계정 등록 방법

법인 이용자별로 ID/PW가 다른 경우, 각각 계정 등록하여 `connectedId`를 발급받아 사용합니다.

```json
// 여러 계정 동시 등록 가능
{
  "accountList": [
    { "organization": "0306", "loginTypeLevel": "0", "id": "user1", "password": "ENC_PW1", ... },
    { "organization": "0306", "loginTypeLevel": "0", "id": "user2", "password": "ENC_PW2", ... }
  ]
}
```

> 관리자 계정으로 등록 시 해당 계정에 연결된 카드 전체 조회 가능.
> 이용자 계정으로 등록 시 본인 카드만 조회 가능.

---

## 작업 파일

- `/home/fgcp/codef/cards.js` - 현재 구현된 Node.js 스크립트
