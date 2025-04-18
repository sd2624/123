const fs = require('fs');
const path = require('path');
let urlIndex = 1;

// config.json 읽기
function getNextUrl() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // post_url_1부터 순차적으로 검색
    while (true) {
      const key = `post_url_${urlIndex}`;
      const url = config[key];

      if (!url) {
        // 더 이상 URL이 없으면 처음으로 돌아감
        urlIndex = 1;
        return config.post_url_1;
      }

      urlIndex++;
      return url;
    }
  } catch (error) {
    console.error('Config 파일 읽기 실패:', error);
    return null;
  }
}

function generateRandomBlogUrl() {
  const randomNum = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
  return `https://blog.naver.com/user_${randomNum}`;
}

function extractTitle(url) {
  try {
    const match = url.match(/\/2025\/(.*?)(?:\.html|$)/);
    if (match) {
      return decodeURIComponent(match[1])
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()); // 각 단어 첫글자 대문자로
    }
    return '블로그 포스트';
  } catch {
    return '블로그 포스트';
  }
}

export default function handler(req, res) {
  const { to } = req.query;

  if (!to) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // 다음 URL 가져오기
  const targetUrl = to || getNextUrl();
  const blogUrl = generateRandomBlogUrl();
  const title = extractTitle(targetUrl);

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${blogUrl}">
    <link rel="canonical" href="${blogUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${title}">
    <meta property="og:site_name" content="네이버 블로그">
    <meta http-equiv="refresh" content="1;url=${targetUrl}">
    <title>${title}</title>
    <script>
        setTimeout(function() {
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
