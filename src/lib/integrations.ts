import { format } from 'date-fns';
import type { Hold, HoldCategory } from './types';

interface ParsedEmail {
  title?: string;
  counterparty?: string;
  date?: Date;
  category?: HoldCategory;
}

/**
 * Smart Email Parser (Client-Side Regex)
 * Extracts key metadata from common confirmation emails
 */
export function parseEmailContent(text: string): ParsedEmail {
  const result: ParsedEmail = {};

  // 1. Detect Counterparty
  // Look for "From:", "Support", "Hello from [Company]", etc.
  const counterpartyRegexes = [
    /from\s+([^,\n\r]+)/i,
    /Your\s+(?:order|request|claim)\s+with\s+([^.\n\r]+)/i,
    /Thank\s+you\s+for\s+contacting\s+([^.\n\r]+)/i
  ];

  for (const regex of counterpartyRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      result.counterparty = match[1].trim();
      break;
    }
  }

  // 2. Detect Date
  // Look for standard date patterns
  const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4})|([A-Z][a-z]{2}\s\d{1,2},?\s\d{4})/g;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    const parsedDate = new Date(dateMatch[0]);
    if (!isNaN(parsedDate.getTime())) {
      result.date = parsedDate;
    }
  }

  // 3. Detect Title / Subject
  const titleRegex = /Subject:\s*(.*)/i;
  const titleMatch = text.match(titleRegex);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  // 4. Heuristic Category Detection
  const keywords: Record<HoldCategory, string[]> = {
    finance: ['bank', 'credit', 'refund', 'charge', 'payment', 'billing', 'invoice'],
    healthcare: ['medical', 'claim', 'insurance', 'doctor', 'hospital', 'health'],
    government: ['irs', 'tax', 'visa', 'passport', 'permit', 'application'],
    work: ['ticket', 'hr', 'it support', 'jira', 'request'],
    education: ['transcript', 'admission', 'university', 'college', 'school'],
    personal: []
  };

  const lowerText = text.toLowerCase();
  for (const [cat, tokens] of Object.entries(keywords)) {
    if (tokens.some(token => lowerText.includes(token))) {
      result.category = cat as HoldCategory;
      break;
    }
  }

  return result;
}

/**
 * Generate iCal (.ics) content client-side
 */
export function generateICal(hold: Hold): string {
  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  const start = format(hold.startDate, "yyyyMMdd'T'HHmmss'Z'");

  // Calculate end date (expected resolution)
  const endDate = new Date(hold.startDate);
  endDate.setDate(endDate.getDate() + hold.expectedResolutionDays);
  const end = format(endDate, "yyyyMMdd'T'HHmmss'Z'");

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HOLD App//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${hold.id}@hold.app`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:HOLD: ${hold.title}`,
    `DESCRIPTION:Waiting on ${hold.counterparty}. Expected resolution within ${hold.expectedResolutionDays} days.\\nNotes: ${hold.notes || 'None'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return icsLines.join('\r\n');
}

/**
 * Trigger browser download of a file
 */
export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
