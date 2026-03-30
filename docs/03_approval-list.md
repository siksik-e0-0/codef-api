# 승인내역 조회

**POST** `https://development.codef.io/v1/kr/card/b/account/approval-list`

> 기간 조회 및 당일 조회 모두 이 API 사용 (`startDate` = `endDate` = 오늘 날짜)

---

## Request

```
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/x-www-form-urlencoded

Body: encodeURIComponent(JSON.stringify(payload))
```

```json
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

| Key | Required | 값 | 설명 |
|---|---|---|---|
| connectedId | O | | 계정 등록 후 발급된 ID |
| organization | O | `0306` | 신한 법인카드 |
| loginTypeLevel | O | `0` | 이용자 |
| inquiryType | O | `0` | 전체 (승인+취소) |
| cardNo | O | 마스킹 번호 | 카드목록 조회 결과값 사용 |
| startDate | O | `YYYYMMDD` | 조회 시작일 |
| endDate | O | `YYYYMMDD` | 조회 종료일 (당일 조회 시 startDate와 동일하게) |
| orderBy | O | `0` | 최신순, `1`: 과거순 |

---

## Response

```json
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
      "resPaymentDueDate": "-",
      "resMemberStoreNo": "0139473672",
      "resMemberStoreCorpNo": "",
      "resMemberStoreAddr": "",
      "resMemberStoreType": "",
      "resMemberStoreTelNo": "",
      "resHomeForeignType": "1",
      "resAccountCurrency": "KRW",
      "resCancelYN": "0",
      "resCancelAmount": "",
      "resCashBack": "",
      "resVAT": "",
      "resKRWAmt": "",
      "resFee": "",
      "resPurchaseYN": "",
      "resPurchaseDate": ""
    }
  ]
}
```

### 응답 필드 설명

| Field | 설명 |
|---|---|
| resUsedDate | 사용일 (YYYYMMDD) |
| resUsedTime | 사용시간 (HHmmss) |
| resMemberStoreName | 가맹점명 (`+`는 공백으로 치환) |
| resUsedAmount | 사용금액 |
| resPaymentType | `1`: 일시불, `2`: 할부, `3`: 그외 |
| resInstallmentMonth | 할부개월 (일시불이면 `0`) |
| resApprovalNo | 승인번호 |
| resHomeForeignType | `1`: 국내, `2`: 해외 |
| resAccountCurrency | 통화코드 (KRW, USD 등 ISO 4217) |
| resCancelYN | `0`: 정상, `1`: 취소, `2`: 부분취소, `3`: 거절 |
| resCancelAmount | 취소금액 |
| resPurchaseYN | 매입여부 |
| resPurchaseDate | 매입일자 |

---

## 당일 조회 예시

```json
{
  "connectedId": "YOUR_CONNECTED_ID",
  "organization": "0306",
  "loginTypeLevel": "0",
  "inquiryType": "0",
  "cardNo": "CARD_NO_MASKED",
  "startDate": "20260330",
  "endDate": "20260330",
  "orderBy": "0"
}
```

> `the-day-approval-list` 엔드포인트는 `0306` 기관 미지원 → `approval-list`로 대체
