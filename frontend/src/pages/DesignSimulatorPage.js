import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import SampleButtons from '../components/SampleButtons';
import { designPower, designSimulate, featureAiAnalyze } from '../services/api';

function DesignSimulatorPage() {
  const [tab, setTab] = useState('power');
  const [power, setPower] = useState({ endpoint_type: 'continuous', delta: 5, sd: 10, p1: 0.6, p2: 0.4, alpha: 0.05, power: 0.9, dropout_rate: 0.1 });
  const [sim, setSim] = useState({ n_per_arm: 85, delta: 0.5, looks: 3, alpha: 0.05, sims: 8000, seed: 'gsd-2026' });
  const [result, setResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  async function run() {
    setLoading(true); setError(null); setResult(null); setAiResult(null);
    try {
      if (tab === 'power') {
        setResult(await designPower({ ...power, delta: Number(power.delta), sd: Number(power.sd), p1: Number(power.p1), p2: Number(power.p2), alpha: Number(power.alpha), power: Number(power.power), dropout_rate: Number(power.dropout_rate) }));
      } else {
        setResult(await designSimulate({ ...sim, n_per_arm: Number(sim.n_per_arm), delta: Number(sim.delta), looks: Number(sim.looks), alpha: Number(sim.alpha), sims: Number(sim.sims) }));
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function runAiReview() {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      const input = tab === 'power'
        ? { ...power, delta: Number(power.delta), sd: Number(power.sd), p1: Number(power.p1), p2: Number(power.p2), alpha: Number(power.alpha), power: Number(power.power), dropout_rate: Number(power.dropout_rate) }
        : { ...sim, n_per_arm: Number(sim.n_per_arm), delta: Number(sim.delta), looks: Number(sim.looks), alpha: Number(sim.alpha), sims: Number(sim.sims) };
      const base = result || (tab === 'power' ? await designPower(input) : await designSimulate(input));
      if (!result) setResult(base);
      setAiResult(await featureAiAnalyze({
        feature: tab === 'power' ? 'design-power' : 'design-simulate',
        intent: 'Review the statistical design output, assumptions, limitations, and expert-validation needs.',
        input,
        mechanical_result: base,
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  const num = (obj, set) => (key) => (
    <input type="number" step="any" value={obj[key]} onChange={e => set({ ...obj, [key]: e.target.value })} />
  );
  const pNum = num(power, setPower);
  const sNum = num(sim, setSim);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Design Statistics</h2>
          <p>Exact power/sample-size (inverse-normal quantiles) and a Monte Carlo group-sequential simulator (O'Brien-Fleming-shaped boundaries, seeded &amp; reproducible). ADVISORY — biostatistician review required for regulatory use.</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button className={`btn ${tab === 'power' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('power'); setResult(null); }}>Power / Sample Size</button>
          <button className={`btn ${tab === 'sim' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('sim'); setResult(null); }}>Group-Sequential Simulator</button>
        </div>

        {tab === 'power'
          ? <SampleButtons feature="design-power" onPick={(v) => setPower(p => ({ ...p, ...v }))} />
          : <SampleButtons feature="design-simulate" onPick={(v) => setSim(s => ({ ...s, ...v }))} />}

        {tab === 'power' ? (
          <div className="form-grid">
            <div className="form-group"><label>Endpoint type</label>
              <select value={power.endpoint_type} onChange={e => setPower({ ...power, endpoint_type: e.target.value })}>
                <option value="continuous">Continuous (delta, SD)</option>
                <option value="binary">Binary (p1 vs p2)</option>
              </select>
            </div>
            {power.endpoint_type === 'continuous' ? (
              <>
                <div className="form-group"><label>Delta (difference to detect)</label>{pNum('delta')}</div>
                <div className="form-group"><label>SD</label>{pNum('sd')}</div>
              </>
            ) : (
              <>
                <div className="form-group"><label>p1 (arm A)</label>{pNum('p1')}</div>
                <div className="form-group"><label>p2 (arm B)</label>{pNum('p2')}</div>
              </>
            )}
            <div className="form-group"><label>Alpha (two-sided)</label>{pNum('alpha')}</div>
            <div className="form-group"><label>Power</label>{pNum('power')}</div>
            <div className="form-group"><label>Dropout rate</label>{pNum('dropout_rate')}</div>
          </div>
        ) : (
          <div className="form-grid">
            <div className="form-group"><label>N per arm</label>{sNum('n_per_arm')}</div>
            <div className="form-group"><label>Standardized effect (0 = null → type I check)</label>{sNum('delta')}</div>
            <div className="form-group"><label>Interim looks (K)</label>{sNum('looks')}</div>
            <div className="form-group"><label>Alpha</label>{sNum('alpha')}</div>
            <div className="form-group"><label>Simulations</label>{sNum('sims')}</div>
            <div className="form-group"><label>Seed (reproducibility)</label>
              <input value={sim.seed} onChange={e => setSim({ ...sim, seed: e.target.value })} />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? 'Running…' : tab === 'power' ? 'Calculate' : 'Simulate'}</button>
          <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
        </div>
      </div>

      <AIResult result={result} loading={loading} error={error} />
      <AIResult result={aiResult} loading={aiLoading} error={null} />
    </div>
  );
}
export default DesignSimulatorPage;
