# debug-openai.py
import os
import openai
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env.local
load_dotenv('.env.local')

# Configurar a chave da API
openai.api_key = os.getenv('OPENAI_API_KEY')

# Testar a conexão
try:
    # Listar assistentes
    assistants = openai.beta.assistants.list()
    print("Conexão com a API OpenAI bem-sucedida!")
    print(f"Número de assistentes: {len(assistants.data)}")
    
    # Verificar se o assistente específico existe
    assistant_id = "asst_LTs4N9cLNB566TDDMV7ojIza"
    try:
        assistant = openai.beta.assistants.retrieve(assistant_id)
        print(f"Assistente encontrado: {assistant.name}")
    except Exception as e:
        print(f"Erro ao buscar assistente: {e}")
    
except Exception as e:
    print(f"Erro na conexão com a API OpenAI: {e}")