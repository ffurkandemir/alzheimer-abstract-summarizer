'use client'

import { useState } from 'react'

/**
 * Main page component for the Alzheimer Abstract Summarizer
 * Provides a form to submit abstracts and displays the generated summary
 */
export default function Home() {
  // State management
  const [abstract, setAbstract] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  /**
   * Handle form submission and API call
   */
  const handleSummarize = async () => {
    // Reset previous states
    setError(null)
    setSummary('')
    setLoading(true)

    try {
      // Call the API endpoint
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ abstract }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle error response
        setError(data.error || 'Failed to generate summary')
        return
      }

      // Set the summary
      setSummary(data.summary)
    } catch (err) {
      console.error('Error calling summarize API:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Copy summary to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Check if form is valid
  const isFormValid = abstract.trim().length > 0 && !loading

  return (
    <main className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Alzheimer Abstract Summarizer
          </h1>
          <p className="text-lg text-slate-300">
            AI-powered tool for summarizing Alzheimer and neurodegenerative disease research abstracts
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-6 space-y-6">
          {/* Input Section */}
          <div>
            <label 
              htmlFor="abstract" 
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Research Abstract
            </label>
            <textarea
              id="abstract"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Paste abstract here..."
              rows={12}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-vertical"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSummarize}
            disabled={!isFormValid}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              isFormValid
                ? 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700'
                : 'bg-slate-700 cursor-not-allowed'
            }`}
          >
            {loading ? 'Summarizing...' : 'Summarize'}
          </button>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Summary Display */}
          {summary && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-300">
                  Summary
                </label>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors duration-200"
                >
                  {copied ? 'Copied!' : 'Copy summary'}
                </button>
              </div>
              <div className="p-4 bg-slate-800 border border-slate-600 rounded-lg">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>
            Powered by{' '}
            <span className="text-emerald-400 font-semibold">
              flan-t5-base-alzheimer-ultra-safe
            </span>{' '}
            model
          </p>
        </div>
      </div>
    </main>
  )
}
