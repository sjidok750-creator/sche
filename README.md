# ✈️ 비행 스케줄 PWA + 홈화면 한 줄 위젯

월 스케줄을 `public/schedule.json` 한 파일로 관리하고, GitHub Pages PWA에서 보고,
아이폰 홈/잠금화면에 오늘 일정을 "한 줄"로 띄운다. 서버·백엔드·API키 없음.

- 배포 주소: `https://sjidok750-creator.github.io/sche/`
- 데이터: `https://sjidok750-creator.github.io/sche/schedule.json`

## 구조

```
[월 1회] 새 스케줄 사진 → Claude로 파싱 → schedule.json 갱신 → main 푸시 → Pages 자동 배포
[항상]   PWA + Scriptable 위젯  → 같은 공개 schedule.json 을 읽어 "오늘" 표시
```

## 기술 스택

React + Vite + TypeScript · Tailwind CSS · vite-plugin-pwa · HashRouter · GitHub Pages(Actions)

## 개발

```bash
npm install
npm run dev      # 로컬 개발 (http://localhost:5173/sche/)
npm run build    # 프로덕션 빌드 → dist/
npm run icons    # 아이콘 재생성 (선택, sharp 필요)
```

## 화면

1. **오늘** — 비행/레이오버/휴무/교육/일정없음 큰 카드. 비행이면 편명·목적지·출도착(현지)·
   리포팅 추정(출발 -90분)·D-day·실시간 카운트다운. 다음 일정 미리보기.
2. **이번 달** — 거리별 색 보딩패스 카드 + 상단 요약 + 한 달 리듬 스트립.
3. **도움말** — 스케줄 바꾸는 법 + 위젯 설치 안내.

## 월 1회 업데이트

새 스케줄 캘린더 사진과 함께 아래 프롬프트를 Claude에 준다. 받은 JSON을
`public/schedule.json`에 덮어쓰고, 도착 +1일/야간편을 한 번 확인한 뒤 `main`에 푸시.

```
첨부한 승무원 월간 스케줄 캘린더 이미지를 아래 규칙대로 JSON "하나"로만 변환해줘.
설명/머리말/코드펜스 없이 JSON만 출력.
규칙:
- 비행 블록이 놓인 "날짜 칸"을 근거로 date/arrDate를 채운다.
- 도착이 출발보다 이르거나 다음 날 칸으로 이어지면 arrDate=+1일.
- domestic = 출도착 모두 국내공항(GMP/CJU/PUS/USN/TAE 등). EDU=education,
  ADO/ATDO/PDO/휴무=offDays로 분리.
  국제선은 거리로 long(미주·유럽·대양주)/mid(동남아·중동)/short(일본·중국·괌 등) 추정.
- 출발 21:00 이후/야간이면 redeye=true. 같은 도시 연속 LO는 layover.nights로 합산.
- 편명 KExxxx 유지, 애매하면 추정 말고 null.
- 공항코드→도시/국가는 표준 IATA 기준.
스키마: README의 schedule.json 구조 그대로.
```

## 위젯 (Scriptable)

`widget/roster-widget.js` 를 Scriptable에 붙여넣고 `DATA_URL` 을 본인 Pages 주소로 바꾼 뒤,
홈화면 Small 위젯 또는 잠금화면 인라인 위젯으로 추가한다.

## GitHub Pages 설정

리포 **Settings → Pages → Source** 를 **GitHub Actions** 로 설정하면
`main` 푸시 시 `.github/workflows/deploy.yml` 이 자동 배포한다.
