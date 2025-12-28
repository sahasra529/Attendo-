
import React, { useState, useEffect } from 'react';
import { User, ClassSession, QRData } from '../types';
import { teacherApi, studentApi } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

const TeacherDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [presentCount, setPresentCount] = useState(0);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await teacherApi.getClasses(user.email);
        setClasses(data as any);
      } catch (err) {
        console.error("Error loading teacher classes:", err);
      }
    };
    loadClasses();
  }, [user.email]);

  useEffect(() => {
    let timer: any;
    if (qrData && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        // Simulate real-time polling for attendance count
        if (timeLeft % 5 === 0) fetchAttendanceCount();
      }, 1000);
    } else if (timeLeft === 0) {
      setQrData(null);
    }
    return () => clearInterval(timer);
  }, [qrData, timeLeft]);

  const fetchAttendanceCount = async () => {
    if (!activeSession) return;
    try {
      const history = await studentApi.getHistory('all');
      const today = new Date().toISOString().split('T')[0];
      const count = history.filter((h: any) => h.classId === activeSession.classId && h.date === today).length;
      setPresentCount(count);
    } catch (e) {
      console.warn("Could not poll attendance count.");
    }
  };

  const startSession = (cls: ClassSession) => {
    const now = Date.now();
    const expiry = now + (2 * 60 * 1000); // 2 minutes
    const token = crypto.randomUUID();
    
    const data: QRData = {
      classId: cls.classId,
      date: new Date().toISOString().split('T')[0],
      startTimestamp: now,
      expiryTimestamp: expiry,
      token
    };
    
    setActiveSession(cls);
    setQrData(JSON.stringify(data));
    setTimeLeft(120);
    setPresentCount(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
          <p className="text-sm text-gray-500">Managing classes for {user.email}</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-700 text-sm font-bold border border-indigo-100">
          {classes.length} Classes Assigned
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length > 0 ? classes.map(cls => (
          <div key={cls.classId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-100 text-indigo-700 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cls.classId}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{cls.className}</h3>
              <p className="text-indigo-600 font-semibold text-sm mb-4">{cls.subject}</p>
              
              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium bg-gray-50 p-3 rounded-lg mb-6">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Schedule: {cls.startTime} - {cls.endTime}
              </div>

              <button
                onClick={() => startSession(cls)}
                className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              >
                Generate Attendance QR
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No classes assigned to this email in the database.</p>
          </div>
        )}
      </div>

      {qrData && activeSession && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-10 text-center relative shadow-2xl border border-white/20">
            <button 
              onClick={() => setQrData(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="mb-6">
              <h3 className="text-3xl font-black text-gray-900 mb-1">{activeSession.className}</h3>
              <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Live Attendance Session</p>
            </div>
            
            <div className="flex justify-center mb-8 p-6 bg-indigo-50/50 rounded-3xl border-2 border-indigo-100 ring-8 ring-indigo-50/20">
              <QRCodeSVG value={qrData} size={280} level="H" includeMargin={true} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Students Present</p>
                <p className="text-3xl font-black text-indigo-600">{presentCount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time Remaining</p>
                <p className={`text-3xl font-black ${timeLeft < 20 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 italic">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              Broadcasting session... Keep this screen visible to students.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
