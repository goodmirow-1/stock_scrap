# Yahoo Finance Nasdaq News Summarizer

매일 오전 9시(KST), Yahoo Finance에서 나스닥 시장 뉴스와 급등락 종목(Top Movers) 뉴스를 자동으로 수집하여 요약 및 한글 번역을 제공하는 자동화 도구입니다.

## 주요 기능

1.  **나스닥 시장 뉴스 수집**
    -   Yahoo Finance에서 최신 나스닥 관련 뉴스를 크롤링합니다.
    -   Puppeteer를 사용하여 동적 페이지 콘텐츠를 안전하게 추출합니다.

2.  **급등락 종목(Volatile Stocks) 분석**
    -   Top Gainers / Top Losers 목록을 실시간으로 확인합니다.
    -   **등락률 30% 이상**인 종목만 필터링하여 노이즈를 제거합니다.
    -   해당 종목의 최신 뉴스를 찾아 급등/급락의 원인을 파악합니다.

3.  **지능형 요약 및 번역**
    -   뉴스 기사의 핵심 내용을 추출(Heuristic Summarization)합니다.
    -   Google Translate(Mobile)를 크롤링하여 **무료로 한글 번역**을 수행합니다.

4.  **자동 스케줄러**
    -   `node-cron`을 사용하여 매일 오전 9시에 작업이 자동으로 실행됩니다.

## 설치 방법 (Installation)

Node.js 환경(v16 이상 권장)이 필요합니다.

```bash
# 의존성 설치
npm install
```

주요 의존성:
- `puppeteer`: 크롤링 및 번역
- `cheerio`: HTML 파싱
- `node-cron`: 스케줄링

## 사용 방법 (Usage)

### 1. 스케줄러 실행 (백그라운드)
매일 오전 9시에 자동으로 실행되도록 서비스를 시작합니다.

```bash
node scheduler.js
```

### 2. 수동 테스트 (즉시 실행)
기능을 즉시 확인하고 싶을 때 사용합니다.

```bash
node scheduler.js --test
```

## 프로젝트 구조

- `scheduler.js`: 메인 진입점. 스케줄링 및 전체 로직 제어.
- `yahoo_crawler.js`: 나스닥 일반 뉴스 크롤러.
- `volatile_crawler.js`: 급등락 종목 및 관련 뉴스 크롤러.
- `summarizer.js`: 요약 로직 및 번역 모듈 통합.
- `translator.js`: Google Translate 크롤링을 통한 번역기.
