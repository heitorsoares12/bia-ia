# list-assistants.py
import os
import openai
from dotenv import load_dotenv

load_dotenv('.env.local')
openai.api_key = os.getenv('OPENAI_API_KEY')

try:
    assistants = openai.beta.assistants.list()
    print("Lista de assistentes:")
    for assistant in assistants.data:
        print(f"ID: {assistant.id} | Nome: {assistant.name}")
except Exception as e:
    print(f"Erro: {e}")