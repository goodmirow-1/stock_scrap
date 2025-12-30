const express = require('express');
const Parser = require('rss-parser');
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  // 필요시 추가 옵션 (타임아웃 등)
  timeout: 10000
});

const app = express();
const PORT = 3000;

const GEEKNEWS_RSS = 'https://news.hada.io/rss/news';  // <-- 여기 수정!

// GeekNews 토픽 가져오기 (상위 30개 제한)
async function getGeekNewsTopics(limit = 30) {
  try {
    const feed = await parser.parseURL(GEEKNEWS_RSS);
    
    return feed.items.slice(0, limit).map(item => ({
      title: item.title || '(No title)',
      url: item.link,
      // 긱뉴스 RSS에는 점수(score)가 없고 시간순이니, 카테고리나 내용 일부 활용
      summary: item.contentSnippet || 'No summary',
      by: item.creator || 'unknown',
      time: new Date(item.pubDate || item.isoDate).toLocaleString('ko-KR'),
      commentsUrl: item.comments || item.link + '#comments',
    }));
  } catch (err) {
    console.error('RSS 파싱 에러:', err);
    throw err;
  }
}

// API 엔드포인트
app.get('/api/topstories', async (req, res) => {
  try {
    const topics = await getGeekNewsTopics(30);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GeekNews topics', details: error.message });
  }
});

// 루트 페이지
app.get('/', async (req, res) => {
  try {
    const topics = await getGeekNewsTopics(30);
    let html = `
      <html>
        <head>
          <title>긱뉴스 (GeekNews) Top Topics</title>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; margin: 40px; }
            ol { line-height: 1.6; }
            small { color: #666; }
          </style>
        </head>
        <body>
          <h1>긱뉴스 최근 30 토픽 (시간순)</h1>
          <p><a href="https://news.hada.io" target="_blank">원본 사이트 방문하기</a> | RSS: <a href="${GEEKNEWS_RSS}">${GEEKNEWS_RSS}</a></p>
          <ol>
    `;
    topics.forEach(topic => {
      html += `
        <li>
          <a href="${topic.url}" target="_blank">${topic.title}</a>
          <br>
          <small>${topic.summary ? topic.summary + '<br>' : ''}작성자: ${topic.by} | ${topic.time} | <a href="${topic.commentsUrl}" target="_blank">댓글 보기</a></small>
        </li><br>
      `;
    });
    html += `
          </ol>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    res.status(500).send('Error loading GeekNews topics: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});