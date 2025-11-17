import React, { useState } from "react";
import { AlertCircle, Upload, Sparkles, Heart, Shield, FileText } from "lucide-react";

export default function App() {
  const [symptoms, setSymptoms] = useState("");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData();
    form.append("symptoms", symptoms);
    if (image) form.append("image", image);

    const response = await fetch("http://localhost:8000/diagnose", {
      method: "POST",
      body: form,
    });

    const data = await response.json();
    setResult(data);
    setLoading(false);
  };

  // --------------------------------------------------------------------
  // SAFE JSON PARSER - THIS PREVENTS SCREEN BLANK
  // --------------------------------------------------------------------
  const safeParse = (text) => {
    if (!text) return null;

    // Remove markdown code blocks
    text = text.replace(/```json|```/g, "").trim();

    // Try extracting JSON inside curly brackets
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch (err) {
      console.error("JSON parse error:", err);
      return null;
    }
  };
  // --------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-700"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            AI Health Assistant
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Advanced AI-powered symptom analysis and disease prediction.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Describe Your Symptoms
                </label>
                <textarea
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-white/50"
                  rows="5"
                  placeholder="Example: fever, cough, headache..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-500" />
                  Upload Medical Image (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleImageChange}
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gradient-to-br from-gray-50 to-purple-50"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-2xl" />
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload image</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 rounded-2xl text-lg font-bold"
              >
                {loading ? "Analyzing..." : "Get AI Diagnosis"}
              </button>
            </form>
          </div>

          {/* Results Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            {!result ? (
              <div className="text-center text-gray-600">
                Awaiting Analysis...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 bg-blue-50 rounded-2xl border">
                  <h3 className="font-bold text-gray-700 mb-2">Your Symptoms</h3>
                  <p className="text-gray-700">{result.your_symptoms}</p>
                </div>

                {/* ----------- FIXED SECTION BELOW ----------- */}
                {(() => {
                  const parsed = safeParse(result.diagnosis_from_symptoms);

                  if (!parsed) {
                    return (
                      <div className="p-5 bg-red-50 border rounded-xl">
                        <h3 className="font-bold text-red-700 mb-2">AI Response</h3>
                        <p className="text-gray-700">{result.diagnosis_from_symptoms}</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-5">
                      {/* Possible Diseases */}
                      <div className="p-5 bg-red-50 rounded-2xl border">
                        <h4 className="font-bold text-red-700 mb-3">Possible Conditions</h4>
                        <div className="flex flex-wrap gap-2">
                          {parsed.possible_diseases?.map((d, i) => (
                            <span key={i} className="px-4 py-2 bg-white text-red-700 rounded-full text-sm font-semibold shadow">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Severity */}
                      <div className="p-5 bg-orange-50 rounded-2xl border">
                        <h4 className="font-bold text-orange-700 mb-2">Severity</h4>
                        <p className="text-gray-800">{parsed.severity_level}</p>
                      </div>

                      {/* Advice */}
                      <div className="p-5 bg-green-50 rounded-2xl border">
                        <h4 className="font-bold text-green-700 mb-3">Advice</h4>
                        <ul className="space-y-2">
                          {parsed.advice?.map((a, i) => (
                            <li key={i} className="text-gray-700">{a}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Precautions */}
                      <div className="p-5 bg-purple-50 rounded-2xl border">
                        <h4 className="font-bold text-purple-700 mb-3">Precautions</h4>
                        <ul className="space-y-2">
                          {parsed.precautions?.map((p, i) => (
                            <li key={i} className="text-gray-700">{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

                {/* Image Diagnosis */}
                {result.diagnosis_from_image && (
                  <div className="p-5 bg-cyan-50 rounded-2xl border">
                    <h3 className="font-bold text-cyan-700 mb-3">Image Analysis</h3>
                    <p className="text-gray-700">{result.diagnosis_from_image}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .delay-700 { animation-delay: 700ms; }
        .delay-1000 { animation-delay: 1000ms; }
      `}</style>
    </div>
  );
}
