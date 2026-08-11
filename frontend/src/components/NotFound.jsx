import React from 'react';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      {/* Icon Badge */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-full mb-4 text-slate-500 shadow-xs">
        <FileQuestion className="h-10 w-10 text-slate-600" />
      </div>

      {/* Error Message */}
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">404</h1>
      <h2 className="text-lg font-bold text-slate-800 mb-2">No Match Found</h2>
      <p className="text-xs text-slate-500 max-w-md mb-6">
         Please check the URL or navigate back to the dashboard.
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button> */}

        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          <Home className="h-4 w-4" /> Back to Dashboard
        </a>
      </div>
    </div>
  );
}