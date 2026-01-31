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
} from 'lucide-react';
import { useHolds } from '@/lib/HoldsContext';
import { CATEGORY_INFO, type HoldCategory, type NewHold as NewHoldType } from '@/lib/types';
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

        <button
          type="submit"
          className="new-hold__submit"
          disabled={isSubmitting}
        >
          <Plus size={20} />
          {isSubmitting ? 'Creating...' : 'Create Hold'}
        </button>
      </form>
    </div>
  );
}
