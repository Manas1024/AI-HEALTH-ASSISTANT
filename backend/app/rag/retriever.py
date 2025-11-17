import pandas as pd
import faiss
import numpy as np
from .embedder import embed_text

class MedicalRetriever:
    def __init__(self, csv_path, index_path):
        self.csv = pd.read_csv(csv_path)
        self.index_path = index_path

        texts = (self.csv["disease"] + " - " + self.csv["symptoms"]).tolist()
        embeddings = embed_text(texts).astype("float32")

        self.index = faiss.IndexFlatL2(embeddings.shape[1])
        self.index.add(embeddings)
        faiss.write_index(self.index, index_path)

    def search(self, query, k=3):
        q_emb = embed_text([query]).astype("float32")
        D, I = self.index.search(q_emb, k)
        return self.csv.iloc[I[0]].to_dict("records")
