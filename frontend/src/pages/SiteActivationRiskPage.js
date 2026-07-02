import React, { useEffect, useState } from 'react';
import DetailModal from '../components/DetailModal';

export default function SiteActivationRiskPage() {
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/site-activation-risk', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return <div className="page-card"><h2>Site Activation Risk</h2><p>Loading site activation risks...</p></div>;

  return (
    <div className="page-card">
      <h2>Site Activation Risk</h2>
      <p className="muted">Predict activation delays from contracts, IRB readiness, essential documents, and site training.</p>
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setDetail({ title: 'Activation risk summary', data: data.summary })}><strong>{data.summary.sitesReviewed}</strong><span>Sites Reviewed</span></div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setDetail({ title: 'High-risk activation sites', data: { highRisk: data.summary.highRisk, risks: data.risks.filter((risk) => risk.risk === 'High') } })}><strong>{data.summary.highRisk}</strong><span>High Risk</span></div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setDetail({ title: 'Contract blockers', data: { contractsBlocked: data.summary.contractsBlocked, risks: data.risks.filter((risk) => /contract/i.test(risk.blocker)) } })}><strong>{data.summary.contractsBlocked}</strong><span>Contracts Blocked</span></div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setDetail({ title: 'IRB delays', data: { irbDelayed: data.summary.irbDelayed, risks: data.risks.filter((risk) => /irb/i.test(risk.blocker)) } })}><strong>{data.summary.irbDelayed}</strong><span>IRB Delayed</span></div>
      </div>
      <div className="grid two">
        <section className="panel">
          <h3>Activation Queue</h3>
          {data.risks.map((risk) => (
            <div
              className="list-row"
              key={risk.site}
              style={{ cursor: 'pointer' }}
              onClick={() => setDetail({ title: `Activation risk — ${risk.site}`, data: risk })}
            >
              <strong>{risk.site} - {risk.country}</strong>
              <span>{risk.risk} risk: {risk.blocker}</span>
              <small>{risk.action}</small>
            </div>
          ))}
        </section>
        <section className="panel">
          <h3>Readiness Signals</h3>
          {data.readinessSignals.map((signal) => (
            <div
              className="list-row"
              key={signal.signal}
              style={{ cursor: 'pointer' }}
              onClick={() => setDetail({ title: `Readiness signal — ${signal.signal}`, data: signal })}
            >
              <strong>{signal.signal}</strong>
              <span>{signal.threshold} - {signal.weight}</span>
            </div>
          ))}
        </section>
      </div>
      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}
