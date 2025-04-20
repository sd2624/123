// Vercel 서버리스 함수 (api/preview.js)
export default async function handler(req, res) {
  const { data } = req.query; // 암호화된 파라미터로 변경
  
  // Base64 디코딩
  const decoded = Buffer.from(data, 'base64').toString('utf-8');
  const targetUrl = decodeURIComponent(decoded);

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 ...' }
    });
    
    // 원본 사이트의 메타태그 추출
    const html = await response.text();
    const soup = new JSDOM(html).window.document;
    
    // OG 태그 재생성
    const ogTags = {
      title: soup.querySelector('meta[property="og:title"]')?.content || '기본 제목',
      image: soup.querySelector('meta[property="og:image"]')?.content || '',
      description: soup.querySelector('meta[property="og:description"]')?.content || ''
    };

    // 프록시 서버에서 OG 태그 포함해 응답
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <html>
        <head>
          <meta property="og:title" content="${ogTags.title}">
          <meta property="og:image" content="${ogTags.image}">
          <meta property="og:description" content="${ogTags.description}">
        </head>
        <body style="margin:0">
          <iframe src="${targetUrl}" width="100%" height="100%" frameborder="0"></iframe>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error');
  }
}
