const fs = require('fs');
const path = require('path');
let urlIndex = 1;

// config.json에서 ID 기반 URL 매핑 불러오기
function getUrlFromId(id) {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (config.links && config.links[id]) {
      return config.links[id];
    }
    return null;
  } catch (error) {
    console.error('config.json 읽기 실패:', error);
    return null;
  }
}

// 제목 추출
function extractTitle(url) {
  try {
    const match = url.match(/\/(2025|\d{4})\/(.*?)(?:\.html|$)/);
    if (match) {
      return decodeURIComponent(match[2])
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
  const { id, to } = req.query;

  let targetUrl = null;

  if (id) {
    targetUrl = getUrlFromId(id);
  } else if (to) {
    targetUrl = to;
  }

  if (!targetUrl) {
    res.status(400).send('유효한 URL을 찾을 수 없습니다.');
    return;
  }

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
<body></body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
