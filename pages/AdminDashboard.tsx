
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getAttendanceInsights, detectAnomalies, processNaturalLanguageQuery, predictRisk } from '../services/gemini';
import { adminApi, studentApi } from '../services/api';

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'users'>('ai');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalStudents: 0, totalClasses: 0, avgAttendance: 0, flagsToday: 0 });
  const [insights, setInsights] = useState<string>('');
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const loadData = async () => {
    setLoadingAI(true);
    try {
      const uData = await adminApi.getUsers();
      const sData = await adminApi.getStats();
      setUsers(uData);
      setStats(sData);

      const history = await studentApi.getHistory('all');
      const ins = await getAttendanceInsights(history);
      const anom = await detectAnomalies(history);
      const rsk = await predictRisk(uData.filter((u: any) => u.role === UserRole.STUDENT), history);

      setInsights(ins || '');
      setAnomalies(anom || []);
      setRisks(rsk || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoadingAI(true);
    try {
      const history = await studentApi.getHistory('all');
      const result = await processNaturalLanguageQuery(query, { history, users, stats });
      setQueryResult(result || 'No result found.');
    } catch (e) {
      setQueryResult('Failed to process AI query.');
    } finally {
      setLoadingAI(false);
    }
  };

  const approveUser = async (email: string) => {
    if (!confirm(`Approve staff account for ${email}?`)) return;
    try {
      await adminApi.approveUser(email);
      loadData();
    } catch (e) {
      alert("Approval failed.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Students", val: stats.totalStudents, color: "indigo" },
          { label: "Active Classes", val: stats.totalClasses, color: "blue" },
          { label: "Avg Attendance", val: `${stats.avgAttendance}%`, color: "green" },
          { label: "Flags Today", val: stats.flagsToday, color: "red" }
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full bg-${s.color}-500`}></div>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{s.label}</p>
            <p className={`text-4xl font-black mt-2 text-gray-900`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('ai')}
          className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'ai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          AI Analytics & Insights
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          User Management
        </button>
      </div>

      {activeTab === 'ai' ? (
        <div className="space-y-8">
          {/* NLP Search Bar */}
          <div className="bg-indigo-700 p-8 rounded-3xl shadow-2xl shadow-indigo-100 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a.5.5 0 00-.5-.5h-11a.5.5 0 00-.5.5v3h12z" /></svg>
            </div>
            <h3 className="text-2xl font-black mb-6 flex items-center">
              <span className="mr-3 bg-white/20 p-2 rounded-xl">✨</span> Gemini AI Assistant
            </h3>
            <form onSubmit={handleQuerySubmit} className="relative z-10">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything, e.g., 'Show attendance for Rahul S101 last month'"
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-5 focus:bg-white focus:text-gray-900 focus:outline-none transition-all text-lg placeholder:text-indigo-200"
              />
              <button 
                type="submit"
                className="absolute right-4 top-4 bg-white text-indigo-700 px-6 py-2.5 rounded-xl font-black hover:bg-indigo-50 transition shadow-lg"
                disabled={loadingAI}
              >
                {loadingAI ? 'Working...' : 'Run Query'}
              </button>
            </form>
            {queryResult && (
              <div className="mt-8 p-6 bg-white/10 rounded-2xl text-sm leading-relaxed border border-white/10 font-medium backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                <p className="text-indigo-100 mb-2 font-black uppercase text-[10px] tracking-widest">AI Response</p>
                {queryResult}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-lg font-black text-gray-900">System Insights</h3>
                  <button onClick={loadData} disabled={loadingAI} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">REFRESH AI</button>
                </div>
                <div className="p-8">
                  {loadingAI ? (
                    <div className="flex flex-col items-center py-10">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-400 font-bold text-sm animate-pulse">Consulting Gemini AI...</p>
                    </div>
                  ) : (
                    <div className="text-gray-600 leading-relaxed font-medium space-y-4" dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br/>') }} />
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-lg font-black text-gray-900">Security Anomalies</h3>
                </div>
                <div className="p-8">
                  {anomalies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {anomalies.map((anom, i) => (
                        <div key={i} className={`p-5 rounded-2xl border-2 flex gap-4 ${anom.severity === 'High' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-yellow-50 border-yellow-100 text-yellow-900'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${anom.severity === 'High' ? 'bg-red-200' : 'bg-yellow-200'}`}>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-black">{anom.attendanceId}</p>
                            <p className="text-xs font-medium opacity-80">{anom.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <p className="text-gray-400 font-bold text-sm">No suspicious behavior detected.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-fit">
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-black text-gray-900">Risk Predictions</h3>
              </div>
              <div className="p-6 space-y-4">
                 {risks.length > 0 ? risks.map((risk, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-black text-gray-800">{risk.studentId}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${risk.riskLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {risk.riskLevel} Risk
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold leading-tight mb-3">{risk.warningMessage}</p>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${risk.predictedPercentage < 75 ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{ width: `${risk.predictedPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-[10px] font-black mt-1 text-gray-400">Predicted: {risk.predictedPercentage}%</p>
                    </div>
                  )) : (
                    <p className="text-gray-400 text-sm font-medium text-center py-10 italic">Collecting historical patterns...</p>
                 )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                 <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                 <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                 <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {users.map((u, i) => (
                 <tr key={i} className="hover:bg-gray-50 transition">
                   <td className="px-8 py-4">
                     <p className="font-black text-gray-900">{u.name}</p>
                     <p className="text-xs text-gray-400">{u.email}</p>
                   </td>
                   <td className="px-8 py-4">
                     <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : u.role === 'Teacher' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                       {u.role}
                     </span>
                   </td>
                   <td className="px-8 py-4">
                     <span className={`flex items-center gap-1.5 text-xs font-bold ${u.status === 'Active' ? 'text-green-600' : u.status === 'Pending' ? 'text-orange-500' : 'text-red-500'}`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-green-600' : u.status === 'Pending' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                       {u.status}
                     </span>
                   </td>
                   <td className="px-8 py-4 text-right">
                     {u.status === 'Pending' && (
                       <button 
                         onClick={() => approveUser(u.email)}
                         className="text-[10px] font-black text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
                       >
                         APPROVE
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
