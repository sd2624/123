import fetch from 'node-fetch';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  const { to } = req.query;

  if (!to) {
    return res.status(400).send("Missing 'to' parameter");
  }

  try {
    const response = await fetch(to, { timeout: 3000 }); // 대상 URL 가져오기
    const html = await response.text();
    const $ = cheerio.load(html);

    const ogTitle = $('meta[property="og:title"]').attr('content') || '미리보기 제목 없음';
    const ogDesc = $('meta[property="og:description"]').attr('content') || ogTitle;
    const ogImage = $('meta[property="og:image"]').attr('content') || 'https://ssl.pstatic.net/static/blog/img_common/blog_og_default.gif';

    // OG 태그로 구성된 HTML 생성 + JS로 리디렉션
    const previewHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDesc}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${to}">
  <meta http-equiv="refresh" content="1;url=${to}">
  <title>${ogTitle}</title>
  <script>
    setTimeout(() => {
      window.location.href = "${to}";
    }, 1000);
  </script>
</head>
<body>

</body>
</html>
`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(previewHtml);
  } catch (error) {
    console.error('미리보기 생성 실패:', error);
    res.status(500).send("미리보기 생성에 실패했습니다.");
  }
}
