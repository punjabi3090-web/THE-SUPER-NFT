import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { TEST_MODE } from "../App";

const languages = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ur", label: "Urdu", native: "اردو", flag: "🇵🇰" },
  { code: "hi", label: "Hindi", native: "हिंदी", flag: "🇮🇳" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦" },
];

export default function Language() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState(
    () => localStorage.getItem('language') || 'en'
  );
  const [saved, setSaved] = useState(false);

  const handleSelect = (code: string) => {
    console.log('language selected', code);
    setSelected(code);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('language', selected);
    console.log('language saved', selected);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setLocation('/my');
    }, 1200);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 pb-8">
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {saved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ✅ Language saved!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => { console.log('back from language'); setLocation('/my'); }} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Language</h1>
      </div>

      <p className="text-xs text-slate-400 text-center mt-4 mb-3">Select your preferred language</p>

      {/* Language List */}
      <div className="px-4 space-y-2">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl shadow-sm transition-all ${
              selected === lang.code
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-white text-slate-700"
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <div className="flex-1 text-left">
              <p className={`font-semibold text-sm ${selected === lang.code ? "text-white" : "text-slate-800"}`}>
                {lang.label}
              </p>
              <p className={`text-xs mt-0.5 ${selected === lang.code ? "text-white/80" : "text-slate-400"}`}>
                {lang.native}
              </p>
            </div>
            {selected === lang.code && <Check size={20} className="text-white flex-shrink-0" strokeWidth={2.5} />}
          </button>
        ))}
      </div>

      {/* Save Button */}
      <div className="px-4 mt-6">
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg"
        >
          Save Language
        </button>
      </div>
    </div>
  );
}
