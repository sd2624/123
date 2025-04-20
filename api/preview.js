const fs = require('fs');
const path = require('path');
let urlIndex = 1;

// config.json에서 순차적으로 URL 가져오기
function getNextUrl() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 순차적으로 post_url_n 찾기
    while (true) {
      const key = `post_url_${urlIndex}`;
      const url = config[key];

      if (!url) {
        // URL 끝났으면 처음부터 다시
        urlIndex = 1;
        return config.post_url_1;
      }

      urlIndex++;
      return url;
    }
  } catch (error) {
    console.error('config.json 읽기 실패:', error);
    return null;
  }
}

// 제목 추출
function extractTitle(url) {
  try {
    const match = url.match(/\/2025\/(.*?)(?:\.html|$)/);
    if (match) {
      return decodeURIComponent(match[1])
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    return '블로그 포스트';
  } catch {
    return '블로그 포스트';
  }
}

// 메인 핸들러
export default function handler(req, res) {
  const { to } = req.query;

  const targetUrl = to || getNextUrl();
  const title = extractTitle(targetUrl);
  const blogUrl = `https://blog.naver.com/random_${Math.floor(Math.random() * 100000)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${blogUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${title}">
  <meta property="og:site_name" content="네이버 블로그">
  <meta http-equiv="refresh" content="1;url=${targetUrl}">
  <link rel="canonical" href="${blogUrl}">
  <title>${title}</title>
  <script>
    setTimeout(() => {
      window.location.href = "${targetUrl}";
    }, 1000);
  </script>
</head>
<body>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
