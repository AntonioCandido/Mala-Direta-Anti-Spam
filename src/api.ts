export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const workspaceId = localStorage.getItem('mala_direta_workspace') || 'default';
  
  const customInit = { ...init };
  if (customInit.headers) {
    const headers = new Headers(customInit.headers);
    headers.set('x-workspace-id', workspaceId);
    customInit.headers = headers;
  } else {
    customInit.headers = { 'x-workspace-id': workspaceId };
  }
  
  return fetch(input, customInit);
}
