'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Section {
  type: 'text' | 'image' | 'table' | 'graph';
  column: 'left' | 'right' | 'full';
  content: {
    type: string;
    content?: string;
    ocrText?: string;
    headers?: string[];
    rows?: string[][];
    markdown?: string;
    description?: string;
  };
  bounds?: { x: number; y: number; width: number; height: number };
}

interface ParsedPage {
  pageNum: number;
  sections: Section[];
  rawText: { left: string; right: string };
  metadata: {
    width: number;
    height: number;
    pageIndex: number;
    hasText: boolean;
    hasImages: boolean;
    hasTables: boolean;
  };
}

interface ParsedResult {
  success: boolean;
  pages: ParsedPage[];
  error?: string;
}

interface PDFParserServiceType {
  initialize: () => Promise<void>;
  loadDocument: (data: ArrayBuffer) => Promise<number>;
  parsePage: (pageNum: number) => Promise<ParsedPage>;
  parseAllPages: () => Promise<ParseResult>;
  getPageCount: () => number;
  destroy: () => void;
}

interface ParseResult {
  success: boolean;
  pages: ParsedPage[];
  error?: string;
}

export default function TestPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageRangeInput, setPageRangeInput] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [pdfService, setPdfService] = useState<PDFParserServiceType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializePDFService();
  }, []);

  const initializePDFService = async () => {
    try {
      console.log('[TestPdf] Initializing PDF service...');
      const PDFParserModule = await import('@/services/PDFParserService');
      const service = PDFParserModule.createPDFParserService();
      await service.initialize();
      setPdfService(service);
      console.log('[TestPdf] PDF service initialized');
    } catch (err) {
      console.error('[TestPdf] Failed to initialize PDF service:', err);
      setInitError('Failed to initialize PDF parser. Please refresh the page.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a valid PDF file');
    }
  }, []);

  const handleUpload = async () => {
    if (!file || !pdfService) {
      setError('PDF service not initialized or no file selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[TestPdf] Loading file:', file.name);
      const arrayBuffer = await file.arrayBuffer();
      const count = await pdfService.loadDocument(arrayBuffer);
      setPageCount(count);
      console.log('[TestPdf] Document loaded, pages:', count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async (parseAll = false) => {
    if (!pdfService) {
      setError('PDF service not initialized');
      return;
    }

    setParsing(true);
    setError(null);

    try {
      console.log('[TestPdf] Starting parse');

      if (parseAll) {
        const data = await pdfService.parseAllPages();
        setResult(data);
        setCurrentPage(1);
      } else {
        const page = await pdfService.parsePage(currentPage);
        setResult({ success: true, pages: [page] });
        setCurrentPage(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setParsing(false);
    }
  };

  const togglePage = (pageNum: number) => {
    setSelectedPages(prev =>
      prev.includes(pageNum)
        ? prev.filter(p => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const parsePageRange = (input: string, maxPage: number): number[] => {
    const pages: number[] = [];
    const parts = input.split(',').map(s => s.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(maxPage, end); i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= maxPage && !pages.includes(num)) {
          pages.push(num);
        }
      }
    }
    
    return pages.sort((a, b) => a - b);
  };

  const handleParseSelected = async () => {
    if (!pdfService || selectedPages.length === 0) {
      setError('Please select pages to parse');
      return;
    }

    setParsing(true);
    setError(null);

    try {
      console.log('[TestPdf] Parsing selected pages:', selectedPages);
      
      const allPages: ParsedPage[] = [];
      
      for (const pageNum of selectedPages) {
        const parsed = await pdfService.parsePage(pageNum);
        allPages.push(parsed);
      }

      setResult({ success: true, pages: allPages });
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setParsing(false);
    }
  };

  const downloadJson = () => {
    if (!result) return;
    
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parsed_pdf_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getContentBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-700',
      image: 'bg-purple-100 text-purple-700',
      table: 'bg-green-100 text-green-700',
      graph: 'bg-orange-100 text-orange-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const renderSection = (section: Section, index: number) => {
    const langLabel = section.column === 'left' ? 'Indonesian' : 'English';
    const langColor = section.column === 'left' ? 'text-blue-600' : 'text-green-600';

    return (
      <div key={index} className="mb-4 p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs font-medium ${langColor}`}>{langLabel}</span>
          <span className={`text-xs px-2 py-1 rounded ${getContentBadge(section.type)}`}>
            {section.type.toUpperCase()}
          </span>
        </div>

        {section.type === 'text' && section.content.content && (
          <pre className="text-sm whitespace-pre-wrap text-gray-700 max-h-96 overflow-auto">
            {section.content.content}
          </pre>
        )}

        {section.type === 'image' && (
          <div>
            <p className="text-sm text-gray-500 mb-2">OCR Result:</p>
            <pre className="text-sm whitespace-pre-wrap text-gray-700 bg-gray-50 p-2 rounded">
              {section.content.ocrText || '[No OCR text]'}
            </pre>
          </div>
        )}

        {section.type === 'table' && section.content.markdown && (
          <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded overflow-auto">
            {section.content.markdown}
          </pre>
        )}

        {section.type === 'graph' && section.content.description && (
          <p className="text-sm text-gray-700">{section.content.description}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">PDF Parser - Bilingual (ID/EN)</h1>

        {initError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            <p className="font-medium">Initialization Error</p>
            <p className="text-sm">{initError}</p>
            <button 
              onClick={initializePDFService}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Retry Initialization
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload PDF</h2>
          
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 cursor-pointer hover:border-blue-400 transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div>
                <p className="text-green-600 font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <p className="text-gray-500">Drag & drop PDF here or click to browse</p>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="px-6 py-2 bg-[#1a2436] text-white rounded-lg hover:bg-[#2a3446] disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load PDF'}
            </button>

            {pageCount > 0 && (
              <span className="text-sm text-gray-600">{pageCount} pages loaded</span>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
          )}
        </div>

        {pageCount > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Parse Options</h2>
            
            <div className="flex flex-wrap gap-4 items-center mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Page:</label>
                <input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-sm text-gray-500">/ {pageCount}</span>
              </div>

              <button
                onClick={() => handleParse(false)}
                disabled={parsing || !pdfService}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {parsing ? 'Parsing...' : 'Parse Page'}
              </button>

              <button
                onClick={() => handleParse(true)}
                disabled={parsing || !pdfService}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {parsing ? 'Parsing...' : 'Parse All Pages'}
              </button>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showRaw}
                  onChange={(e) => setShowRaw(e.target.checked)}
                  className="w-4 h-4"
                />
                Show Raw Text
              </label>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Select Pages to Parse:</h3>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1))}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedPages([])}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1).filter(n => n % 2 === 1))}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                >
                  Odd Pages
                </button>
                <button
                  onClick={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1).filter(n => n % 2 === 0))}
                  className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                >
                  Even Pages
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs text-gray-600">Range (e.g., 1-5, 8, 10-15):</label>
                <input
                  type="text"
                  value={pageRangeInput}
                  onChange={(e) => setPageRangeInput(e.target.value)}
                  placeholder="1-5, 8, 10-15"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => {
                    const pages = parsePageRange(pageRangeInput, pageCount);
                    setSelectedPages(pages);
                  }}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  Apply Range
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
                  <label
                    key={pageNum}
                    className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm ${
                      selectedPages.includes(pageNum)
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(pageNum)}
                      onChange={() => togglePage(pageNum)}
                      className="w-4 h-4"
                    />
                    {pageNum}
                  </label>
                ))}
              </div>

              {selectedPages.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={handleParseSelected}
                    disabled={parsing || !pdfService}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {parsing ? 'Parsing...' : `Parse Selected (${selectedPages.length} pages)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {result && result.success && result.pages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Parse Results</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {result.pages.length}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(result.pages.length, currentPage + 1))}
                  disabled={currentPage >= result.pages.length}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mb-4">
              <button
                onClick={downloadJson}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Download JSON
              </button>
            </div>

            {result.pages[currentPage - 1] && (
              <div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Indonesian (Left Column)</h3>
                    <pre className="text-sm whitespace-pre-wrap text-blue-700 max-h-48 overflow-auto">
                      {result.pages[currentPage - 1].rawText.left || '[No text detected]'}
                    </pre>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2">English (Right Column)</h3>
                    <pre className="text-sm whitespace-pre-wrap text-green-700 max-h-48 overflow-auto">
                      {result.pages[currentPage - 1].rawText.right || '[No text detected]'}
                    </pre>
                  </div>
                </div>

                <h3 className="font-medium mb-3">Sections ({result.pages[currentPage - 1].sections.length})</h3>
                {result.pages[currentPage - 1].sections.map((section, idx) => renderSection(section, idx))}
              </div>
            )}
          </div>
        )}

        {!result && !error && (
          <div className="text-center py-12 text-gray-500">
            Load a PDF and click Parse to see results
          </div>
        )}
      </div>
    </div>
  );
}