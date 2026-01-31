import { useState } from 'react';
import { Copy, Check, Mail, Phone, Globe } from 'lucide-react';
import type { Hold, FollowUpTone } from '@/lib/types';
import { generateFollowUpMessage } from '@/lib/utils';
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

  const message = generateFollowUpMessage(hold, selectedTone);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <button
            className="follow-up__copy"
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="follow-up__message">{message}</pre>
      </div>
    </div>
  );
}
