export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, data } = req.body;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = 'escape9851/blog-zh';

  try {
    if (action === 'get') {
      if (!GITHUB_TOKEN) return res.status(500).json({ error: 'Token not configured' });
      const response = await fetch(`https://api.github.com/repos/${REPO}/contents/data.json`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const fileData = await response.json();
      const content = Buffer.from(fileData.content, 'base64').toString();
      return res.status(200).json({ data: JSON.parse(content), sha: fileData.sha });
    }
    
    if (action === 'save') {
      if (!GITHUB_TOKEN) return res.status(500).json({ error: 'Token not configured' });
      const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/data.json`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const fileData = await getRes.json();
      
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
      const saveRes = await fetch(`https://api.github.com/repos/${REPO}/contents/data.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update via admin',
          content: content,
          sha: fileData.sha
        })
      });
      
      if (!saveRes.ok) {
        const err = await saveRes.json();
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json({ success: true });
    }
    
    // 图片上传 - 尝试用 tmpfiles.org
    if (action === 'uploadImage') {
      const { imageData, fileName } = data;
      
      if (!imageData) {
        return res.status(400).json({ error: 'Missing image data' });
      }
      
      // 限制大小
      if (imageData.length > 5000000) {
        return res.status(400).json({ error: '图片太大，请用 URL 方式添加' });
      }
      
      // 返回提示，让用户使用 URL 方式
      return res.status(200).json({ 
        success: false,
        error: '服务端上传暂不可用，请使用 URL 方式添加图片',
        suggest: 'url'
      });
    }
    
    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
