from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from PIL import Image
from google import genai
import os

app = FastAPI()

# CORS (required for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# 🔥 1. Load Dataset for RAG
# -------------------------------

DATA_PATH = "C:/Users/manas/OneDrive/Desktop/CAP405_Project/backend/app/data/medical_knowledge.csv"

df = pd.read_csv(DATA_PATH)

# combine all symptom columns into one string
symptom_cols = [c for c in df.columns if c.startswith("symptom")]
df["all_symptoms"] = df[symptom_cols].astype(str).agg(" ".join, axis=1)

# create rag text for each row
df["rag_text"] = (
    "Disease: " + df["disease"] +
    "\nSymptoms: " + df["all_symptoms"] +
    "\nDescription: " + df["description"] +
    "\nPrecautions: " +
    df["precaution_1"] + ", " +
    df["precaution_2"] + ", " +
    df["precaution_3"] + ", " +
    df["precaution_4"]
)

# -------------------------------
# 🔥 2. Setup Gemini API
# -------------------------------
os.environ["GEMINI_API_KEY"] = "AIzaSyBwoMOpKAFJfwqGanEzbYJKQr4PDzyI_78"

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


def rag_search(query: str):
    try:
        # Ensure required columns exist
        required_cols = ["disease", "symptoms", "description", "precautions"]
        for col in required_cols:
            if col not in df.columns:
                raise KeyError(f"Missing column in dataset: {col}")

        # Create combined text safely
        df["combined_text"] = (
            df["disease"].astype(str).fillna("") + " " +
            df["symptoms"].astype(str).fillna("") + " " +
            df["description"].astype(str).fillna("") + " " +
            df["precautions"].astype(str).fillna("")
        )

        # Search
        mask = df["combined_text"].str.contains(query, case=False, na=False)
        matches = df[mask]

        if matches.empty:
            return "No matching medical information found."

        # Return safe text without NaN errors
        texts = matches["combined_text"].head(4).fillna("").tolist()
        texts = [str(x) for x in texts]

        return "\n\n---\n".join(texts)

    except Exception as e:
        return f"RAG search error: {str(e)}"



# -------------------------------
# 🔥 3. Diagnose Endpoint (FormData + Image)
# -------------------------------
@app.post("/diagnose")
async def diagnose(
    symptoms: str = Form(...),
    image: UploadFile = File(None)
):
    # -----------------------
    # RAG fetch
    # -----------------------
    context = rag_search(symptoms)

    # -----------------------
    # Ask Gemini for text-based diagnosis
    # -----------------------
    prompt = f"""
User Symptoms: {symptoms}

Relevant Medical Knowledge:
{context}

Provide:
1. Possible diseases  
2. Severity level  
3. Advice  
4. Precautions  
FORMAT AS JSON.
"""

    resp = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )

    symptom_diagnosis = resp.text

    # -----------------------
    # Image-based diagnosis
    # -----------------------
    image_diagnosis = None

    if image:
        img_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(img_bytes))

        image_resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=["Analyze this medical image and identify abnormalities:", pil_image]
        )
        image_diagnosis = image_resp.text

    # -----------------------
    # Final Response
    # -----------------------
    return {
        "your_symptoms": symptoms,
        "diagnosis_from_symptoms": symptom_diagnosis,
        "diagnosis_from_image": image_diagnosis,
    }


# -------------------------------
# Run Server
# -------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
