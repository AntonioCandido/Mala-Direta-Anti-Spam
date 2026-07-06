export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const workspaceId = localStorage.getItem('mala_direta_workspace') || 'default';
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('X-Workspace-Id')) {
    headers.set('X-Workspace-Id', workspaceId);
  }
  
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const updatedOptions: RequestInit = {
    ...options,
    headers,
  };

  return fetch(url, updatedOptions);
}
