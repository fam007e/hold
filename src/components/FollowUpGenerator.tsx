import { useState } from 'react';
import { Copy, Check, Mail, Phone, Globe, ExternalLink } from 'lucide-react';
import type { Hold, FollowUpTone } from '@/lib/types';
import { generateFollowUpContent } from '@/lib/utils';
import './FollowUpGenerator.css';

interface FollowUpGeneratorProps {
  hold: Hold;
}

const TONES: { value: FollowUpTone; label: string; description: string }[] = [
  { value: 'polite', label: 'Polite', description: 'Friendly check-in' },
  { value: 'firm', label: 'Firm', description: 'Clear expectations' },
  { value: 'escalation', label: 'Escalation', description: 'Formal escalation' },
];

const CHANNELS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'call', label: 'Call Script', icon: Phone },
  { value: 'portal', label: 'Portal', icon: Globe },
] as const;

export function FollowUpGenerator({ hold }: FollowUpGeneratorProps) {
  const [selectedTone, setSelectedTone] = useState<FollowUpTone>('polite');
  const [copied, setCopied] = useState(false);

  const content = generateFollowUpContent(hold, selectedTone);
  const fullMessage = `Subject: ${content.subject}\n\n${content.body}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(content.subject);
    const body = encodeURIComponent(content.body);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="follow-up">
      <h3 className="follow-up__title">Generate Follow-Up</h3>

      <div className="follow-up__tones">
        {TONES.map(tone => (
          <button
            key={tone.value}
            className={`follow-up__tone ${selectedTone === tone.value ? 'follow-up__tone--active' : ''}`}
            onClick={() => setSelectedTone(tone.value)}
          >
            <span className="follow-up__tone-label">{tone.label}</span>
            <span className="follow-up__tone-desc">{tone.description}</span>
          </button>
        ))}
      </div>

      <div className="follow-up__channels">
        <span className="follow-up__channels-label">Channel:</span>
        {CHANNELS.map(channel => (
          <button key={channel.value} className="follow-up__channel">
            <channel.icon size={16} />
            {channel.label}
          </button>
        ))}
      </div>

      <div className="follow-up__preview">
        <div className="follow-up__preview-header">
          <span>Message Preview</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="follow-up__copy"
              onClick={handleEmail}
              title="Open in default email app"
              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
            >
              <ExternalLink size={14} />
              Open Email
            </button>
            <button
              className="follow-up__copy"
              onClick={handleCopy}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <pre className="follow-up__message">{fullMessage}</pre>
      </div>
    </div>
  );
}
