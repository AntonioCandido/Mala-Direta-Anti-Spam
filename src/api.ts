export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const workspaceId = localStorage.getItem('mala_direta_workspace') || 'default';
  
  // Aponta para a nova rota do Vercel Serverless (/api/server/...)
  let targetUrl = url;
  if (targetUrl.startsWith('/api/') && !targetUrl.startsWith('/api/server/')) {
    targetUrl = targetUrl.replace('/api/', '/api/server/');
  }

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

  const response = await fetch(targetUrl, updatedOptions);

  // Verificação rigorosa se a resposta do servidor foi bem-sucedida (status 200-299)
  if (!response.ok) {
    const statusText = response.statusText || `Erro ${response.status}`;
    let errorDetails = '';
    try {
      errorDetails = await response.text();
    } catch {
      errorDetails = 'Não foi possível ler os detalhes do erro.';
    }
    
    // Sobrescrevemos o método json() para evitar que o chamador quebre ao tentar fazer o parse de um HTML 404/500
    response.json = async () => ({
      success: false,
      error: `Erro na requisição (Status ${response.status} - ${statusText}): ${errorDetails.slice(0, 150)}`
    });
    
    return response;
  }

  // Se a resposta está OK, ainda aplicamos a proteção contra retorno que não seja JSON
  const originalJson = response.json.bind(response);
  response.json = async () => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      try {
        const text = await response.text();
        return {
          success: false,
          error: `Resposta recebida com sucesso, mas não é um JSON válido: ${text.slice(0, 150)}`
        };
      } catch {
        return {
          success: false,
          error: 'Resposta recebida com sucesso, mas o formato não é JSON e não pôde ser lido.'
        };
      }
    }
    try {
      return await originalJson();
    } catch (e: any) {
      return {
        success: false,
        error: `Erro ao decodificar JSON do servidor: ${e.message}`
      };
    }
  };

  return response;
}
