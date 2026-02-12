import { useState } from 'react';
import { Sparkles, X, Wand2 } from 'lucide-react';
import { parseEmailContent } from '@/lib/integrations';
import type { HoldCategory } from '@/lib/types';
import './EmailParser.css';

interface EmailParserProps {
  onParsed: (data: {
    title?: string;
    counterparty?: string;
    date?: Date;
    category?: HoldCategory;
  }) => void;
  onClose: () => void;
}

export function EmailParser({ onParsed, onClose }: EmailParserProps) {
  const [content, setContent] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = () => {
    if (!content.trim()) return;

    setIsParsing(true);
    // Artificial delay for "Magic" feel
    setTimeout(() => {
      const result = parseEmailContent(content);
      onParsed(result);
      setIsParsing(false);
    }, 800);
  };

  return (
    <div className="email-parser-overlay">
      <div className="email-parser">
        <div className="email-parser__header">
          <div className="email-parser__title">
            <Sparkles size={18} color="#7c3aed" />
            <h3>Magic Email Detector</h3>
          </div>
          <button className="email-parser__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="email-parser__hint">
          Paste the confirmation email from the company below. We'll use local AI (regex) to extract details securely on your device.
        </p>

        <textarea
          className="email-parser__textarea"
          placeholder="Paste email content (Subject, Body, etc.) here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
        />

        <div className="email-parser__footer">
          <button className="email-parser__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`email-parser__submit ${isParsing ? 'loading' : ''}`}
            onClick={handleParse}
            disabled={!content.trim() || isParsing}
          >
            {isParsing ? (
              'Analyzing...'
            ) : (
              <>
                <Wand2 size={18} />
                Magic Fill
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
