const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// config.json에서 순차적으로 URL 가져오고 ID 자동 생성
function getNextUrlWithId() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const links = config.links || {};
    const nextIndex = Object.keys(links).length + 1;
    const postUrl = config[`post_url_${nextIndex}`];

    if (!postUrl) return null;

    const newId = uuidv4();
    links[newId] = postUrl;
    config.links = links;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return { id: newId, url: postUrl };
  } catch (error) {
    console.error('config.json 읽기 실패 또는 쓰기 실패:', error);
    return null;
  }
}

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

export default function handler(req, res) {
  const { id } = req.query;
  let config, targetUrl;

  try {
    const configPath = path.join(process.cwd(), 'config.json');
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    res.status(500).send('config.json 읽기 실패');
    return;
  }

  if (id && config.links && config.links[id]) {
    targetUrl = config.links[id];
  } else {
    const result = getNextUrlWithId();
    if (!result) {
      res.status(404).send('다음 URL을 찾을 수 없습니다.');
      return;
    }
    targetUrl = result.url;
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
