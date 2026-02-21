import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', proposal: 4000, realizationA: 1000, realizationB: 1400 },
  { name: 'Feb', proposal: 3000, realizationA: 800, realizationB: 598 },
  { name: 'Mar', proposal: 2000, realizationA: 5000, realizationB: 4800 },
  { name: 'Apr', proposal: 2780, realizationA: 1500, realizationB: 2408 },
  { name: 'May', proposal: 1890, realizationA: 2000, realizationB: 2800 },
  { name: 'Jun', proposal: 2390, realizationA: 1200, realizationB: 2600 },
  { name: 'Jul', proposal: 3490, realizationA: 1800, realizationB: 2500 },
];

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Monthly Financial Trend</h1>
      <div className="w-full max-w-4xl h-96 bg-white rounded-lg shadow-md p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="proposal" fill="#8884d8" name="Usulan" />
            <Bar dataKey="realizationA" stackId="a" fill="#82ca9d" name="Realisasi A" />
            <Bar dataKey="realizationB" stackId="a" fill="#ffc658" name="Realisasi B" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;
