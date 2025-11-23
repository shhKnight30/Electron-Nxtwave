// Voice settings component

import React, { useState, useEffect } from "react";
import api from "../../services/api";

const VoiceSettings = () => {
  const [settings, setSettings] = useState({
    wakeWord: "hey study",
    language: "en",
    sensitivity: 0.6,
    useOfflineSTT: true,
    useOfflineTTS: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get("/voice/settings");
      if (res.data) setSettings(res.data);
    } catch (error) {
      console.error("Failed to load voice settings:", error);
    }
  };

  const saveSettings = async () => {
    try {
      await api.post("/voice/settings", settings);
      alert("Voice settings saved!");
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  return (
    <div className="w-full p-6 bg-[#111] text-white rounded-xl shadow-lg space-y-6">

      <h2 className="text-xl font-bold">Voice Settings</h2>

      {/* Wake Word */}
      <div>
        <label className="block mb-1">Wake Word</label>
        <input
          type="text"
          value={settings.wakeWord}
          onChange={(e) => setSettings({ ...settings, wakeWord: e.target.value })}
          className="w-full p-2 bg-[#222] rounded-md border border-gray-700"
        />
      </div>

      {/* Language */}
      <div>
        <label className="block mb-1">Language</label>
        <select
          value={settings.language}
          onChange={(e) => setSettings({ ...settings, language: e.target.value })}
          className="w-full p-2 bg-[#222] rounded-md border border-gray-700"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="hn">Hinglish</option>
          <option value="bn">Bengali</option>
          <option value="te">Telugu</option>
          <option value="ta">Tamil</option>
        </select>
      </div>

      {/* Sensitivity */}
      <div>
        <label className="block mb-1">Wake Word Sensitivity</label>
        <input
          type="range"
          min="0.3"
          max="0.9"
          step="0.05"
          value={settings.sensitivity}
          onChange={(e) =>
            setSettings({ ...settings, sensitivity: Number(e.target.value) })
          }
          className="w-full"
        />
        <p>{settings.sensitivity.toFixed(2)}</p>
      </div>

      {/* Offline STT/TTS */}
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.useOfflineSTT}
            onChange={() =>
              setSettings({ ...settings, useOfflineSTT: !settings.useOfflineSTT })
            }
          />
          Use Offline Speech-to-Text (Whisper.cpp)
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.useOfflineTTS}
            onChange={() =>
              setSettings({ ...settings, useOfflineTTS: !settings.useOfflineTTS })
            }
          />
          Use Offline Text-to-Speech (Coqui / Piper)
        </label>
      </div>

      {/* Save button */}
      <button
        onClick={saveSettings}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md mt-4"
      >
        Save Settings
      </button>
    </div>
  );
};

export default VoiceSettings;
