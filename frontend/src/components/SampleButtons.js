import React, { useEffect, useState } from 'react';
import { aiSamples } from '../services/api';

/**
 * Reusable "Sample Fill" row for AI pages that don't use the shared AIPage
 * component. Fetches GET /api/ai/samples?feature=<verb> on mount and renders
 * one button per scenario. Clicking a button calls onPick(sample.values) so
 * the parent page can merge the values into whatever form state it owns.
 *
 * props:
 *   feature  — AI verb (e.g. 'draft-protocol')
 *   onPick   — (values) => void; values is {fieldName: value, ...}
 */
export default function SampleButtons({ feature, onPick }) {
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    if (!feature) return;
    aiSamples(feature)
      .then(r => setSamples(Array.isArray(r?.samples) ? r.samples : []))
      .catch(() => setSamples([]));
  }, [feature]);

  if (samples.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
        Sample scenarios — click to fill the form:
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {samples.map((s, i) => (
          <button
            key={i}
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => onPick && onPick(s.values || {})}
            title={`Fill form with: ${s.label}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
