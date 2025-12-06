'use client';

/**
 * Settings Page - Application settings and preferences
 */
export default function SettingsPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-100">Settings</h1>
          <p className="text-gray-500 mt-1">Configure Jessica to your preferences</p>
        </header>
        
        {/* API Configuration */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-200 mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-200 font-medium">Claude API</div>
                  <div className="text-sm text-gray-500">Anthropic Claude for complex reasoning</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm text-emerald-400">Connected</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-200 font-medium">Grok API</div>
                  <div className="text-sm text-gray-500">X.AI Grok for research queries</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm text-emerald-400">Connected</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-200 font-medium">Gemini API</div>
                  <div className="text-sm text-gray-500">Google Gemini for quick lookups</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm text-emerald-400">Connected</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-200 font-medium">Local Dolphin</div>
                  <div className="text-sm text-gray-500">Ollama dolphin-llama3:8b for personality</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-sm text-amber-400">Check Status</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-200 mb-4">Appearance</h2>
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-200 font-medium">Theme</div>
                <div className="text-sm text-gray-500">Currently using dark theme with amber accents</div>
              </div>
              <span className="px-3 py-1 text-sm bg-amber-500/10 text-amber-400 rounded-lg">Dark</span>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-lg font-medium text-gray-200 mb-4">About</h2>
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
            <div className="text-gray-200 font-medium mb-1">Jessica AI</div>
            <div className="text-sm text-gray-500 mb-3">Personal Cognitive Prosthetic for Disabled Veterans</div>
            <div className="text-xs text-amber-500">For the Forgotten 99%, We Rise 🔥</div>
          </div>
        </section>
      </div>
    </div>
  );
}

