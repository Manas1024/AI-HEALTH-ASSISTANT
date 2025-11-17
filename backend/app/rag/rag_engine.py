from .retriever import MedicalRetriever
from openai import OpenAI

client = OpenAI()

retriever = MedicalRetriever(
    "C:/Users/manas/OneDrive/Desktop/CAP405_Project/backend/app/data/medical_knowledge.csv",
    "app/data/faiss_index.bin"
)

def generate_advice(query):
    docs = retriever.search(query)

    context = ""
    for d in docs:
        context += f"Disease: {d['disease']}\nSymptoms: {d['symptoms']}\nTreatment: {d['treatment']}\n\n"

    prompt = f"""
You are a medical assistant. Use the context to generate advice.
Query: {query}

Context:
{context}

Give a short medical advice. Add a disclaimer.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return {
        "results": docs,
        "gen_ai_advice": response.choices[0].message["content"]
    }
