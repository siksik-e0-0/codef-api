# 카드 목록 조회

**POST** `https://development.codef.io/v1/kr/card/b/account/card-list`

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
  "inquiryType": "0"
}
```

### 파라미터 설명

| Key | Required | 값 | 설명 |
|---|---|---|---|
| connectedId | O | | 계정 등록 후 발급된 ID |
| organization | O | `0306` | 신한 법인카드 |
| loginTypeLevel | O | `0` | 이용자 |
| inquiryType | O | `0` | 전체 |

---

## Response

```json
{
  "result": { "code": "CF-00000", "message": "성공" },
  "data": [
    {
      "resUserNm": "최*식",
      "resCardNo": "CARD_NO_MASKED",
      "resIssueDate": "20240206",
      "resValidPeriod": "",
      "resSleepYN": "N",
      "resCardName": "신한 T&E",
      "resCardType": "신한카드",
      "resTrafficYN": ""
    }
  ]
}
```

### 응답 필드 설명

| Field | 설명 |
|---|---|
| resUserNm | 카드 소지인 |
| resCardNo | 카드번호 (마스킹) |
| resIssueDate | 발급일 (YYYYMMDD) |
| resValidPeriod | 유효기간 |
| resSleepYN | 휴면여부 (`N`: 활성, `Y`: 휴면) |
| resCardName | 카드명 |
| resCardType | 카드사 |

---

## 테스트 결과

| 카드번호 | 카드명 | 발급일 | 상태 |
|---|---|---|---|
| `CARD_NO_MASKED` | 신한 T&E | 2024-02-06 | 활성 |
| `CARD_NO_MASKED_2` | 신한 T&E | 2022-01-26 | 휴면 |

> `resCardNo` 마스킹 번호를 이후 API 호출 시 `cardNo` 파라미터에 그대로 사용
