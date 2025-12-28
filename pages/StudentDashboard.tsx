
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { studentApi } from '../services/api';
import { Scanner } from '@yudiel/react-qr-scanner';

const StudentDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const p = await studentApi.getProfile(user.studentId || '');
      const h = await studentApi.getHistory(user.studentId || '');
      setProfile(p);
      setHistory(h);
    } catch (error) {
      console.error("Failed to load student data:", error);
    }
  };

  useEffect(() => {
    if (user.studentId) {
      loadData();
    }
  }, [user.studentId]);

  const handleScan = async (result: string) => {
    if (!result || loading) return;
    setLoading(true);
    
    try {
      const data = JSON.parse(result);
      const now = Date.now();

      // Client-side expiry check
      if (now > data.expiryTimestamp) {
        alert("This QR code has expired. Please ask the teacher for a new one.");
        setShowScanner(false);
        setLoading(false);
        return;
      }

      // Capture Geolocation
      let locationStr = 'Unknown';
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        locationStr = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      } catch (locErr) {
        console.warn("Location access denied or timed out.");
      }

      // Mark Attendance on Backend
      await studentApi.markAttendance({
        studentId: user.studentId,
        classId: data.classId,
        location: locationStr,
        method: 'QR',
        token: data.token // Backend can verify token if logic is added
      });

      alert(`Success! Attendance marked for ${data.classId}.`);
      setShowScanner(false);
      // Refresh local data to show new record and updated percentage
      await loadData();
    } catch (e: any) {
      alert(e.message || "Invalid QR Code or Attendance Failure.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium">Fetching profile...</p>
    </div>
  );

  const lowAttendance = profile.attendancePercent < 75;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 border border-gray-100">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold ring-4 ring-indigo-50">
          {profile.name[0]}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
          <p className="text-gray-500 font-medium">{profile.studentId} • {profile.class}</p>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active Student
          </div>
        </div>
        <div className="text-center md:text-right bg-gray-50 p-4 rounded-xl">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Attendance Rate</p>
          <p className={`text-4xl font-black ${lowAttendance ? 'text-red-500' : 'text-green-600'}`}>
            {profile.attendancePercent}%
          </p>
          {lowAttendance && (
            <p className="text-[10px] text-red-500 mt-1 font-bold animate-pulse">
              ⚠️ BELOW 75% THRESHOLD
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Today's Sessions</h3>
            <button 
              onClick={() => setShowScanner(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-100"
            >
              Scan to Attend
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">Check with your instructor to generate the session QR code.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Recent Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Class</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {history.length > 0 ? history.map((h) => (
                  <tr key={h.attendanceId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{h.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{h.classId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${h.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-400 text-sm italic">
                      No attendance records found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative shadow-2xl">
            <button 
              onClick={() => setShowScanner(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-2xl font-black mb-1 text-gray-900 text-center">Scan QR Code</h3>
            <p className="text-gray-500 text-sm mb-6 text-center">Hold your phone steady in front of the teacher's screen</p>
            
            <div className="aspect-square bg-gray-900 rounded-2xl mb-6 overflow-hidden relative group">
               {loading && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                   <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                 </div>
               )}
               <Scanner
                  onScan={(result) => result && handleScan(result[0].rawValue)}
                  onError={(error) => console.log(error?.message)}
               />
               <div className="absolute inset-0 border-2 border-indigo-500/50 m-12 rounded-lg pointer-events-none">
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 -ml-1 -mt-1 rounded-tl"></div>
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 -mr-1 -mt-1 rounded-tr"></div>
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 -ml-1 -mb-1 rounded-bl"></div>
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 -mr-1 -mb-1 rounded-br"></div>
               </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Camera Feed Active
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
