const fs = require('fs');
const path = require('path');
let urlIndex = 1;

// config.json 읽기
function getNextUrl() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const urls = Object.keys(config)
      .filter(key => key.startsWith('post_url_'))
      .sort((a, b) => {
        const aIndex = parseInt(a.split('_').pop(), 10);
        const bIndex = parseInt(b.split('_').pop(), 10);
        return aIndex - bIndex;
      });

    if (urls.length === 0) return null;

    const selectedKey = urls[Math.floor(Math.random() * urls.length)];
    return config[selectedKey];
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
  let { to } = req.query;

  if (!to) {
    to = getNextUrl();
    if (!to) return res.status(400).json({ error: 'URL parameter is required and no fallback available' });
  }

  const targetUrl = to;
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
    <p>리디렉션 중입니다...</p>
    <p>원본 URL: <span id="target_url">${targetUrl}</span></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
