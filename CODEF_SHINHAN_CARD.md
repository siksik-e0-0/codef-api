# CODEF 신한 법인카드 API 연동 가이드

## 환경

- **Runtime**: Node.js (내장 모듈만 사용, 별도 패키지 불필요)
- **CODEF 서버**: `development.codef.io` (데모), `api.codef.io` (운영)
- **OAuth 서버**: `oauth.codef.io`

---

## 인증 정보

> 민감정보는 `.env` 파일에 저장하고 절대 커밋하지 마세요.

```bash
# .env
CODEF_CLIENT_ID=your_client_id
CODEF_CLIENT_SECRET=your_client_secret
CODEF_CONNECTED_ID=your_connected_id
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
    "connectedId": "YOUR_CONNECTED_ID"
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
  "connectedId": "YOUR_CONNECTED_ID",
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
      "resCardNo": "CARD_NO_MASKED",
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
  "connectedId": "YOUR_CONNECTED_ID",
  "organization": "0306",
  "loginTypeLevel": "0",
  "inquiryType": "0",
  "cardNo": "CARD_NO_MASKED",
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
      "resCardNo": "CARD_NO_MASKED",
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

## 6. 청구내역 조회

**POST** `https://development.codef.io/v1/kr/card/b/account/billing-list`

```json
// Payload
{
  "connectedId": "YOUR_CONNECTED_ID",
  "organization": "0306",
  "loginTypeLevel": "0",
  "cardNo": "CARD_NO_MASKED",
  "startDate": "202603"
}
```

### 파라미터 설명

| Key | 값 | 설명 |
|---|---|---|
| cardNo | 마스킹 번호 그대로 | 카드목록 조회 결과값 사용 |
| startDate | `YYYYMM` | 조회 년월 (6자리) |

```json
// Response (성공)
{
  "result": { "code": "CF-00000", "message": "성공" },
  "data": {
    "resPaymentDueDate": "20260315",
    "resWithdrawalDueDate": "20260316",
    "resTotalAmount": "412600",
    "resBillType": "신한카드",
    "resPaymentAccount": "신한은행 / 100035*****7",
    "resDepartmentCode": "B002545505",
    "resDepartmentName": "최*식",
    "resCardNo": "CARD_NO_MASKED",
    "resOverseasUse": "0",
    "resAnnualFee": "10000",
    "resFullAmt": "402600",
    "resInstallmentAmt": "0",
    "resCashService": "0",
    "resChargeHistoryList": [
      {
        "resUsedDate": "20260202",
        "resUsedCard": "CARD_NO_MASKED",
        "resMemberStoreName": "씨유(CU)구로우림1차",
        "resMemberStoreCorpNo": "5580801713",
        "resMemberStoreAddr": "특별시 구로구 디지털",
        "resUsedAmount": "19900",
        "resInstallmentMonth": "",
        "resPaymentPrincipal": "19900",
        "resFee": "0",
        "resMemberStoreType": "편의점",
        "resApprovalNo": "40683679",
        "resCancelAmount": ""
      }
    ]
  }
}
```

### 주요 응답 필드

| Field | 설명 |
|---|---|
| resPaymentDueDate | 결제예정일 (YYYYMMDD) |
| resWithdrawalDueDate | 출금예정일 (YYYYMMDD) |
| resTotalAmount | 총 청구금액 |
| resPaymentAccount | 결제 계좌 |
| resAnnualFee | 연회비 |
| resFullAmt | 일시불 금액 |
| resInstallmentAmt | 할부 금액 |
| resCashService | 현금서비스 금액 |
| resChargeHistoryList | 청구 상세 내역 배열 |
| resChargeHistoryList[].resMemberStoreName | 가맹점명 |
| resChargeHistoryList[].resUsedAmount | 사용금액 |
| resChargeHistoryList[].resMemberStoreType | 업종 |
| resChargeHistoryList[].resApprovalNo | 승인번호 |

---

## 7. 매입내역 조회

**POST** `https://development.codef.io/v1/kr/card/b/account/purchase-details`

```json
// Payload
{
  "connectedId": "YOUR_CONNECTED_ID",
  "organization": "0306",
  "loginTypeLevel": "0",
  "startDate": "20260101",
  "endDate": "20260330",
  "orderBy": "0",
  "inquiryType": "0",
  "cardNo": "CARD_NO_MASKED",
  "memberStoreInfoType": "1",
  "type": "0"
}
```

### 파라미터 설명

| Key | 값 | 설명 |
|---|---|---|
| startDate | `YYYYMMDD` | 조회 시작일 |
| endDate | `YYYYMMDD` | 조회 종료일 |
| orderBy | `0` | 최신순, `1`: 과거순 |
| inquiryType | `0` | 카드별 조회, `1`: 전체조회 |
| cardNo | 마스킹 번호 | inquiryType=`0` 필수 |
| memberStoreInfoType | `0` | 가맹점 미포함, `1`: 포함 |
| type | `0` | 기존 조회, `1`: 엑셀다운로드 |

> 신한카드 조회 가능 기간: 제한 없음

---

## 8. 선결제내역 조회

**POST** `https://development.codef.io/v1/kr/card/b/account/prepayment-details`

```json
// Payload
{
  "connectedId": "YOUR_CONNECTED_ID",
  "organization": "0306",
  "loginTypeLevel": "0",
  "startDate": "20260101",
  "endDate": "20260330",
  "searchGbn": "0",
  "cardNo": "CARD_NO_MASKED"
}
```

### 파라미터 설명

| Key | 값 | 설명 |
|---|---|---|
| startDate | `YYYYMMDD` | 조회 시작일 |
| endDate | `YYYYMMDD` | 조회 종료일 |
| searchGbn | `0` | 카드별 조회, `1`: 전체조회 |
| cardNo | 마스킹 번호 | searchGbn=`0` 필수 |

```json
// Response (성공)
{
  "result": { "code": "CF-00000", "message": "성공" },
  "data": {
    "resAccount": "",
    "resBankName": "",
    "resPrePaymentAmt": "",
    "resPrePaymentDate": "",
    "resDetailList": [
      {
        "resCardNo": "",
        "resMemberStoreName": "",
        "resPaymentType": "",
        "resApprovalAmount": ""
      }
    ]
  }
}
```

---

## 9. 한도조회

**POST** `https://development.codef.io/v1/kr/card/b/account/limit`

```json
// Payload
{
  "connectedId": "YOUR_CONNECTED_ID",
  "organization": "0306",
  "loginTypeLevel": "0",
  "inquiryType": "0",
  "cardNo": "CARD_NO_MASKED"
}
```

### 파라미터 설명

| Key | 값 | 설명 |
|---|---|---|
| inquiryType | `0` | 카드별, `1`: 법인 총한도, `2`: 전체 카드별 |
| cardNo | 마스킹 번호 | inquiryType=`0` 필수 |

> inquiryType=`2` 전체 카드별은 신한카드 총괄관리자 계정만 제공

```json
// Response (성공)
{
  "result": { "code": "CF-00000", "message": "성공" },
  "data": {
    "resCardNo": "CARD_NO_MASKED",
    "resCardCompany": "신한카드",
    "resLimitAmount": "1500000",
    "resUsedAmount": "1046124",
    "resRemainLimit": "453876"
  }
}
```

### 주요 응답 필드

| Field | 설명 |
|---|---|
| resLimitAmount | 한도금액 |
| resUsedAmount | 이용금액 |
| resRemainLimit | 잔여한도 |
| resCardCompany | 카드사 |

---

## 지원 API 현황 (organization: 0306)

| API | 엔드포인트 | 지원 |
|---|---|---|
| 카드 목록 조회 | `/v1/kr/card/b/account/card-list` | ✅ |
| 승인내역 조회 (기간/당일) | `/v1/kr/card/b/account/approval-list` | ✅ |
| 청구내역 조회 | `/v1/kr/card/b/account/billing-list` | ✅ |
| 매입내역 조회 | `/v1/kr/card/b/account/purchase-details` | ✅ |
| 선결제내역 조회 | `/v1/kr/card/b/account/prepayment-details` | ✅ |
| 한도조회 | `/v1/kr/card/b/account/limit` | ✅ |
| 당일 승인내역 전용 | `/v1/kr/card/b/account/the-day-approval-list` | ❌ 0306 미지원 |

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
