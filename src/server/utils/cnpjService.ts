export const fetchCNPJData = async (cnpj: string) => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
    
    if (response.status === 429 || response.status >= 500) {
      throw new Error('API overloaded');
    }
    
    return await response.json();
  } catch {
    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleaned}`);
      return await response.json();
    } catch {
      throw new Error('Serviço indisponível');
    }
  }
};