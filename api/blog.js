export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, data } = req.body;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = 'escape9851/blog-zh';
  const FILE = 'data.json';

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }

  try {
    if (action === 'get') {
      const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const fileData = await response.json();
      const content = Buffer.from(fileData.content, 'base64').toString();
      return res.status(200).json({ data: JSON.parse(content), sha: fileData.sha });
    }
    
    if (action === 'save') {
      const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const fileData = await getRes.json();
      
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
      const saveRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
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
    
    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
