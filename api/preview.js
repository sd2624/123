const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cachePath = path.join(process.cwd(), 'url_cache.json');

// 임시 URL 캐시 저장
function saveToCache(key, value) {
  const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf-8')) : {};
  cache[key] = value;
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
}

// config에서 무작위 URL 가져오기
function getRandomUrl() {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8'));
    const postUrls = Object.keys(config)
      .filter(k => k.startsWith('post_url_'))
      .map(k => config[k]);

    if (postUrls.length === 0) return null;
    return postUrls[Math.floor(Math.random() * postUrls.length)];
  } catch (error) {
    console.error('Config 읽기 실패:', error);
    return null;
  }
}

function generateRandomBlogUrl() {
  const randomNum = Math.floor(Math.random() * 90000) + 10000;
  return `https://blog.naver.com/user_${randomNum}`;
}

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

export default function handler(req, res) {
  // 무작위 키 생성
  const key = crypto.randomBytes(6).toString('hex');
  const targetUrl = getRandomUrl();

  if (!targetUrl) {
    return res.status(500).send('URL을 가져올 수 없습니다.');
  }

  // 캐시에 저장 (두 번째 프록시에서 읽을 수 있게)
  saveToCache(key, targetUrl);

  const blogUrl = generateRandomBlogUrl();
  const title = extractTitle(targetUrl);

  const secondRedirect = `https://${req.headers.host}/api/redirect?id=${key}`;

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
    <meta http-equiv="refresh" content="1;url=${secondRedirect}">
    <title>${title}</title>
    <script>
        setTimeout(function() {
            window.location.href = "${secondRedirect}";
        }, 1000);
    </script>
</head>
<body>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
