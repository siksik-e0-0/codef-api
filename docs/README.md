# CODEF 신한 법인카드 API 연동 가이드

신한 법인카드(`organization: 0306`) 기준으로 테스트 완료된 CODEF API 연동 문서입니다.

---

## 환경

| 항목 | 값 |
|---|---|
| Runtime | Node.js (내장 모듈만 사용, 별도 패키지 불필요) |
| 데모 서버 | `development.codef.io` |
| 운영 서버 | `api.codef.io` |
| OAuth 서버 | `oauth.codef.io` |

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

## 전체 플로우

```
1. Access Token 발급
2. RSA Public Key 조회
3. 계정 등록 → connectedId 발급
4. API 호출 (카드목록 / 승인내역 / 청구내역 / 매입내역 / 선결제내역 / 한도조회)
```

---

## API 목록

| # | 문서 | 엔드포인트 | 지원 |
|---|---|---|---|
| - | [인증](./01_authentication.md) | 토큰 발급 / 계정 등록 | ✅ |
| 1 | [카드 목록 조회](./02_card-list.md) | `/v1/kr/card/b/account/card-list` | ✅ |
| 2 | [승인내역 조회](./03_approval-list.md) | `/v1/kr/card/b/account/approval-list` | ✅ |
| 3 | [청구내역 조회](./04_billing-list.md) | `/v1/kr/card/b/account/billing-list` | ✅ |
| 4 | [매입내역 조회](./05_purchase-details.md) | `/v1/kr/card/b/account/purchase-details` | ✅ |
| 5 | [선결제내역 조회](./06_prepayment-details.md) | `/v1/kr/card/b/account/prepayment-details` | ✅ |
| 6 | [한도조회](./07_limit.md) | `/v1/kr/card/b/account/limit` | ✅ |
| - | [에러코드 / 공통규칙](./08_error-codes.md) | - | - |
| - | 당일 승인내역 전용 | `/v1/kr/card/b/account/the-day-approval-list` | ❌ 0306 미지원 |

---

## 요청 공통 규칙

- **Content-Type**: `application/x-www-form-urlencoded`
- **Body 형식**: `encodeURIComponent(JSON.stringify(payload))`
- **응답 파싱**: `JSON.parse(decodeURIComponent(response))`

---

## 관련 파일

- `cards.js` - 구현된 Node.js 예제 스크립트
