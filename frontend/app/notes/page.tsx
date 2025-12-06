'use client';

/**
 * Notes Page - Coming Soon
 */
export default function NotesPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-100">Notes</h1>
          <p className="text-gray-500 mt-1">Quick notes and documentation</p>
        </header>
        
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-200 mb-2">Coming Soon</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Notes feature is under development. Check back soon!
          </p>
        </div>
      </div>
    </div>
  );
}

