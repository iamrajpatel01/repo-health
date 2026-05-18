import React from 'react';

const healthData = [
  { repo: 'api-service', score: 42, colorClass: 'bg-red-500' },
  { repo: 'data-pipeline', score: 61, colorClass: 'bg-yellow-500' },
  { repo: 'frontend', score: 74, colorClass: 'bg-orange-500' },
  { repo: 'auth-service', score: 96, colorClass: 'bg-green-500' },
];

const HealthScores = () => {
  return (
    <div className="bg-dashboard-panel border border-dashboard-border rounded-xl p-6 shadow-sm w-full h-full">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-lg font-semibold text-slate-100">REPO HEALTH RATINGS</h2>
        <span className="text-xs text-slate-500">0 = critical · 100 = perfect</span>
      </div>

      <div className="space-y-5">
        {healthData.map((item) => (
          <div key={item.repo} className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-mono text-slate-300">{item.repo}</span>
              <span className="font-mono text-slate-400">{item.score}</span>
            </div>
            {/* Progress Track */}
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${item.colorClass}`}
                style={{ width: `${item.score}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthScores;
