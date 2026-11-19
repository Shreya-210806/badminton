
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getAuthToken() {
  return localStorage.getItem('sp_token') || '';
}

// Common API request function
export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getAuthToken();

  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    reqHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    const err = new Error(
      data?.message || `Request failed with status ${response.status}`
    );
    err.status = response.status;
    err.errors = data?.errors || [];
    throw err;
  }

  return data;
}

// Upload image or PDF to Amazon S3
export async function uploadFile(file, folder) {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Please sign in before uploading a file.');
  }

  const allowedFolders = [
    'player-photos',
    'tournament-images',
    'team-logos',
    'certificates',
  ];

  if (!allowedFolders.includes(folder)) {
    throw new Error('Invalid upload folder.');
  }

  if (!file) {
    throw new Error('Please select a file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    const err = new Error(data?.message || 'File upload failed.');
    err.status = response.status;
    throw err;
  }

  return data;
}

// Download CSV report
export async function downloadCsvReport(path, filename = 'report.csv') {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('Failed to download CSV export.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
