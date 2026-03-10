const REPO = 'escape9851/blog-zh';
const DATA_FILE = 'data.json';

function json(res, status, payload) {
  return res.status(status).json(payload);
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function ensureToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('Token not configured');
  }
  return token;
}

function encodePath(path) {
  return path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

function sanitizeFileName(name) {
  return String(name || 'asset')
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'asset';
}

function extFromMimeType(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/quicktime': 'mov'
  };
  return map[mimeType] || '';
}

async function githubFetch(path, token, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      ...(options.headers || {})
    }
  });

  let body = {};
  try {
    body = await res.json();
  } catch (_) {}

  if (!res.ok) {
    const message = body.message || `GitHub request failed (${res.status})`;
    throw new Error(message);
  }

  return body;
}

async function getRepoMeta(token) {
  const body = await githubFetch(`/repos/${REPO}`, token);
  return {
    defaultBranch: body.default_branch || 'main'
  };
}

async function getContent(path, token) {
  const encoded = encodePath(path);
  const file = await githubFetch(`/repos/${REPO}/contents/${encoded}`, token);
  const content = Buffer.from(file.content || '', 'base64').toString('utf8');

  return {
    data: content ? JSON.parse(content) : {},
    sha: file.sha
  };
}

async function saveContent(path, token, { message, contentBase64, sha, branch }) {
  const encoded = encodePath(path);

  await githubFetch(`/repos/${REPO}/contents/${encoded}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: contentBase64,
      sha,
      branch
    })
  });
}

function parseBody(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }
  return raw;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const body = parseBody(req.body);
  const action = body.action;
  const data = body.data || {};

  try {
    const token = ensureToken();

    if (action === 'get') {
      const file = await getContent(DATA_FILE, token);
      return json(res, 200, { data: file.data, sha: file.sha });
    }

    if (action === 'save') {
      const current = await getContent(DATA_FILE, token);
      const payload = {
        articles: Array.isArray(data.articles) ? data.articles : [],
        settings: data.settings || {}
      };

      const contentBase64 = Buffer.from(JSON.stringify(payload, null, 2), 'utf8').toString('base64');
      await saveContent(DATA_FILE, token, {
        message: 'Update blog data via admin',
        contentBase64,
        sha: current.sha
      });

      return json(res, 200, { success: true });
    }

    if (action === 'uploadAsset') {
      const fileData = String(data.fileData || '');
      const fileName = sanitizeFileName(data.fileName || 'asset');
      const mimeType = String(data.mimeType || '');
      const kind = data.kind === 'video' ? 'video' : 'image';

      if (!fileData) {
        return json(res, 400, { error: 'Missing file data' });
      }

      if (!mimeType.startsWith(`${kind}/`)) {
        return json(res, 400, { error: `Invalid mime type for ${kind}` });
      }

      const bytes = Math.ceil((fileData.length * 3) / 4);
      const maxBytes = kind === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (bytes > maxBytes) {
        return json(res, 400, { error: `File too large. Max ${kind === 'video' ? '50MB' : '10MB'}` });
      }

      const { defaultBranch } = await getRepoMeta(token);

      const extFromName = fileName.includes('.') ? fileName.split('.').pop() : '';
      const ext = sanitizeFileName(extFromName) || extFromMimeType(mimeType) || (kind === 'video' ? 'mp4' : 'jpg');
      const baseName = fileName.replace(/\.[^.]+$/, '') || `${kind}-${Date.now()}`;

      const finalName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${sanitizeFileName(baseName)}.${ext}`;
      const relativePath = `uploads/${kind}s/${finalName}`;

      await saveContent(relativePath, token, {
        message: `Upload ${kind} asset: ${finalName}`,
        contentBase64: fileData,
        sha: undefined,
        branch: defaultBranch
      });

      const rawUrl = `https://raw.githubusercontent.com/${REPO}/${defaultBranch}/${encodePath(relativePath)}`;
      return json(res, 200, {
        success: true,
        url: rawUrl,
        path: relativePath,
        kind
      });
    }

    return json(res, 400, { error: 'Invalid action' });
  } catch (error) {
    console.error('API error:', error);
    return json(res, 500, { error: error.message || 'Internal server error' });
  }
}
