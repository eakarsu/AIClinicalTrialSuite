const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    feature: 'Site Activation Risk',
    summary: { sitesReviewed: 42, highRisk: 7, contractsBlocked: 5, irbDelayed: 4 },
    risks: [
      { site: 'Boston Oncology Group', country: 'US', risk: 'high', blocker: 'CTA redlines unresolved', action: 'Escalate legal review and sponsor fallback language' },
      { site: 'Madrid Clinical Institute', country: 'ES', risk: 'medium', blocker: 'IRB meeting date pending', action: 'Confirm submission packet completeness' },
      { site: 'Seoul Research Hospital', country: 'KR', risk: 'high', blocker: 'Drug import license missing', action: 'Route to regulatory ops for import permit' }
    ],
    readinessSignals: [
      { signal: 'Contract cycle time', threshold: '> 21 days', weight: 'high' },
      { signal: 'IRB packet completeness', threshold: '< 90%', weight: 'high' },
      { signal: 'Essential docs missing', threshold: '> 2 documents', weight: 'medium' },
      { signal: 'Site training completion', threshold: '< 80%', weight: 'medium' }
    ]
  });
});

module.exports = router;
