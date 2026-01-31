import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Banknote,
  HeartPulse,
  Landmark,
  Briefcase,
  GraduationCap,
  User,
  Paperclip,
  FileText,
  X,
} from 'lucide-react';
import { useHolds } from '@/lib/HoldsContext';
import { useAuth } from '@/lib/AuthContext';
import { uploadAttachment } from '@/lib/storage';
import { CATEGORY_INFO, type HoldCategory, type NewHold as NewHoldType, type Attachment } from '@/lib/types';
import './NewHold.css';

const CATEGORY_ICONS: Record<HoldCategory, React.ReactNode> = {
  finance: <Banknote size={20} />,
  healthcare: <HeartPulse size={20} />,
  government: <Landmark size={20} />,
  work: <Briefcase size={20} />,
  education: <GraduationCap size={20} />,
  personal: <User size={20} />,
};

const CATEGORIES = Object.entries(CATEGORY_INFO).map(([value, info]) => ({
  value: value as HoldCategory,
  ...info,
}));

const COMMON_RESOLUTION_DAYS = [
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 45, label: '45 days' },
  { value: 60, label: '2 months' },
  { value: 90, label: '3 months' },
];

const DEFAULT_RESOLUTION_DAYS: Record<HoldCategory, number> = {
  finance: 14,
  healthcare: 30,
  government: 45,
  work: 7,
  education: 30,
  personal: 7,
};

export function NewHold() {
  const navigate = useNavigate();
  const { addHold } = useHolds();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HoldCategory | ''>('');
  const [counterparty, setCounterparty] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedResolutionDays, setExpectedResolutionDays] = useState(14);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload State
  const { user, encryptionKey } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [draftId] = useState(() => crypto.randomUUID()); // Stable draft ID for this session

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be smaller than 10MB');
      return;
    }

    if (!user || !encryptionKey) {
      setUploadError('You must be logged in and vault unlocked to upload files.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // Upload using the draft ID as the hold container for now
      // This is safe because storage path is just a convention.
      const attachment = await uploadAttachment(file, draftId, user, encryptionKey);
      setAttachments(prev => [...prev, attachment]);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError('Failed to encrypt and upload file. Please try again.');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    // Note: We leave the encrypted file in storage for now (orphaned) to keep client simple.
  };

  // Auto-update expected days when category changes
  useEffect(() => {
    if (category && DEFAULT_RESOLUTION_DAYS[category]) {
      setExpectedResolutionDays(DEFAULT_RESOLUTION_DAYS[category]);
    }
  }, [category]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    if (!counterparty.trim()) {
      newErrors.counterparty = 'Counterparty is required';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (expectedResolutionDays < 1) {
      newErrors.expectedResolutionDays = 'Expected resolution must be at least 1 day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const newHold: NewHoldType = {
        title,
        category: category as HoldCategory,
        counterparty,
        startDate: new Date(startDate),
        expectedResolutionDays,
        status: 'pending',
        notes,
        attachments,
      };

      const hold = await addHold(newHold);
      navigate(`/hold/${hold.id}`);
    } catch (error) {
      console.error('Failed to create hold:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-hold">
      <header className="new-hold__header">
        <Link to="/" className="new-hold__back">
          <ArrowLeft size={20} />
          <span>Cancel</span>
        </Link>
        <h1>Create New Hold</h1>
      </header>

      <form onSubmit={handleSubmit} className="new-hold__form">
        <div className="new-hold__field">
          <label htmlFor="title">What are you waiting on? *</label>
          <input
            id="title"
            type="text"
            placeholder="e.g., Insurance Refund – Claim #4832"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <span className="new-hold__error">{errors.title}</span>}
        </div>

        <div className="new-hold__field">
          <label>Category *</label>
          <div className="new-hold__categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                className={`new-hold__category ${category === cat.value ? 'new-hold__category--active' : ''}`}
                style={{
                  '--cat-color': cat.color,
                  '--cat-bg': `${cat.color}15`,
                } as React.CSSProperties}
                onClick={() => setCategory(cat.value)}
              >
                {CATEGORY_ICONS[cat.value]}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          {errors.category && <span className="new-hold__error">{errors.category}</span>}
        </div>

        <div className="new-hold__field">
          <label htmlFor="counterparty">Who are you waiting on? *</label>
          <input
            id="counterparty"
            type="text"
            placeholder="e.g., BlueCross Insurance, IRS, Acme Corp"
            value={counterparty}
            onChange={e => setCounterparty(e.target.value)}
            className={errors.counterparty ? 'error' : ''}
          />
          {errors.counterparty && <span className="new-hold__error">{errors.counterparty}</span>}
        </div>

        <div className="new-hold__row">
          <div className="new-hold__field">
            <label htmlFor="startDate">When did you submit? *</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className={errors.startDate ? 'error' : ''}
            />
            {errors.startDate && <span className="new-hold__error">{errors.startDate}</span>}
          </div>

          <div className="new-hold__field">
            <label htmlFor="expectedDays">Expected resolution *</label>
            <div className="new-hold__resolution-input">
              <input
                id="expectedDays"
                type="number"
                min="1"
                max="365"
                value={expectedResolutionDays}
                onChange={e => setExpectedResolutionDays(parseInt(e.target.value) || 1)}
              />
              <span>days</span>
            </div>
            <div className="new-hold__presets">
              {COMMON_RESOLUTION_DAYS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  className={`new-hold__preset ${expectedResolutionDays === preset.value ? 'new-hold__preset--active' : ''}`}
                  onClick={() => setExpectedResolutionDays(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="new-hold__field">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            placeholder="Reference numbers, key details, what you've already tried..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        {/* Evidence Locker */}
        <div className="new-hold__field">
          <label>Evidence Locker (Encrypted)</label>
          <div className="new-hold__evidence">
            <div className="new-hold__file-list">
              {attachments.map(att => (
                <div key={att.id} className="new-hold__file-item">
                  <FileText size={16} />
                  <span className="new-hold__file-name">{att.originalName}</span>
                  <button type="button" onClick={() => removeAttachment(att.id)} className="new-hold__file-remove">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="new-hold__upload-row">
              <label className={`new-hold__upload-btn ${uploading ? 'disabled' : ''}`}>
                <Paperclip size={18} />
                <span>{uploading ? 'Encrypting & Uploading...' : 'Attach Evidence'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
              <span className="new-hold__upload-hint">Files are encrypted <b>before</b> upload. Max 10MB.</span>
            </div>
            {uploadError && <p className="new-hold__error">{uploadError}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="new-hold__submit"
          disabled={isSubmitting || uploading}
        >
          <Plus size={20} />
          {isSubmitting ? 'Creating...' : 'Create Hold'}
        </button>
      </form>
    </div>
  );
}
