'use client';

import React, { useState } from 'react';
import { DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface CustomParagraphInputProps {
  onParagraphChange: (paragraph: string) => void;
  initialParagraph?: string;
}

const DEFAULT_PARAGRAPH = `Good customer service is the foundation of any successful business. It requires clear communication, active listening, and genuine empathy for customer concerns. When customers call with problems, they expect prompt, professional assistance. A skilled call center agent can turn a frustrated customer into a loyal advocate by demonstrating patience, understanding, and solution-focused thinking.`;

const CustomParagraphInput: React.FC<CustomParagraphInputProps> = ({ 
  onParagraphChange, 
  initialParagraph 
}) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customParagraph, setCustomParagraph] = useState(initialParagraph || DEFAULT_PARAGRAPH);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleCustom = () => {
    if (isCustom) {
      // Switching back to default
      setCustomParagraph(DEFAULT_PARAGRAPH);
      onParagraphChange(DEFAULT_PARAGRAPH);
      setIsCustom(false);
    } else {
      // Switching to custom
      setIsCustom(true);
      setIsExpanded(true);
    }
  };

  const handleParagraphChange = (value: string) => {
    setCustomParagraph(value);
    onParagraphChange(value);
  };

  const handleReset = () => {
    setCustomParagraph(DEFAULT_PARAGRAPH);
    onParagraphChange(DEFAULT_PARAGRAPH);
  };

  const wordCount = customParagraph.trim().split(/\s+/).length;

  return (
    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-800 text-md font-semibold flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-600" />
          Voice Quality Assessment Paragraph
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            {isExpanded ? 'Hide' : 'Show'} Paragraph
          </button>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isCustom}
              onChange={handleToggleCustom}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">Use Custom</span>
          </label>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {isCustom ? (
            <>
              <div>
                <label htmlFor="customParagraph" className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Paragraph for Voice Assessment
                </label>
                <textarea
                  id="customParagraph"
                  value={customParagraph}
                  onChange={(e) => handleParagraphChange(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                  placeholder="Enter a custom paragraph for the candidate to read..."
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {wordCount} words • Recommended: 50-100 words
                </span>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Reset to Default
                </button>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                💡 <strong>Tip:</strong> Choose a paragraph that tests pronunciation, clarity, and natural speech flow. 
                Avoid overly technical terms unless relevant to the role.
              </div>
            </>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                "{DEFAULT_PARAGRAPH}"
              </p>
              <div className="mt-2 text-xs text-gray-500">
                ✓ Default paragraph • {wordCount} words
              </div>
            </div>
          )}
        </div>
      )}

      {!isExpanded && (
        <div className="text-sm text-gray-600">
          {isCustom ? (
            <span className="text-purple-600 font-medium">✓ Using custom paragraph ({wordCount} words)</span>
          ) : (
            <span className="text-gray-500">Using default paragraph ({wordCount} words)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomParagraphInput;
