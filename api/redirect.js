const fs = require('fs');
const path = require('path');
const cachePath = path.join(process.cwd(), 'url_cache.json');

function getUrlFromCache(key) {
  try {
    if (!fs.existsSync(cachePath)) return null;
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    return cache[key] || null;
  } catch (e) {
    console.error('캐시 로딩 실패:', e);
    return null;
  }
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
  const { id } = req.query;

  if (!id) {
    return res.status(400).send('id 파라미터가 필요합니다.');
  }

  const targetUrl = getUrlFromCache(id);

  if (!targetUrl) {
    return res.status(404).send('해당 ID의 URL을 찾을 수 없습니다.');
  }

  const title = extractTitle(targetUrl);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
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
