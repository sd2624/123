import fs from 'fs';
import path from 'path';

// Next.js API Route (Vercel Serverless Function)
export default async function handler(req, res) {
  // 1. config.json에서 URL 읽기
  const idx = req.query.idx || '1'; // ?idx=1 형태로 요청
  const configPath = path.join(process.cwd(), 'config.json');

  let config;
  try {
    const configRaw = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configRaw);
  } catch (e) {
    res.status(500).send('config.json 파일을 읽을 수 없습니다.');
    return;
  }

  const urlKey = `post_url_${idx}`;
  const targetUrl = config[urlKey];
  if (!targetUrl) {
    res.status(400).send(`config.json에 ${urlKey}가 없습니다.`);
    return;
  }

  // 2. 원본 URL에서 HTML 받아오기 (User-Agent 위장)
  try {
    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const contentType = fetchRes.headers.get('content-type') || 'text/html';
    const html = await fetchRes.text();

    res.setHeader('Content-Type', contentType);
    res.status(fetchRes.status).send(html);
  } catch (err) {
    res.status(500).send('Proxy fetch error: ' + err.message);
  }
}
