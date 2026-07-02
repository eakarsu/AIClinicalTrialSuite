import React from 'react';
import AIPage from '../components/AIPage';
import { enrollmentForecast } from '../services/api';

function EnrollmentForecastPage() {
  return (
    <AIPage
      title="Enrollment Forecast"
      subtitle="MECHANICAL — mean of the last 3 accrual months, linear projection to target. AI narrative is advisory."
      feature="enrollment-forecast"
      defaults={{ trial: 'ONCO-LUNG-301', target_n: 120 }}
      fields={[
        { key: 'trial', label: 'Trial ID' },
        { key: 'target_n', label: 'Target enrollment (N)', type: 'number' },
      ]}
      call={enrollmentForecast}
      submitLabel="Run Forecast"
    />
  );
}
export default EnrollmentForecastPage;
