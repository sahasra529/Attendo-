
export enum UserRole {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  ADMIN = 'Admin'
}

export type UserStatus = 'Active' | 'Pending' | 'Inactive';

export interface User {
  email: string;
  role: UserRole;
  name: string;
  status: UserStatus;
  studentId?: string;
}

export interface ClassSession {
  classId: string;
  className: string;
  subject: string;
  teacherEmail: string;
  startTime: string;
  endTime: string;
}

export interface AttendanceRecord {
  attendanceId: string;
  date: string;
  studentId: string;
  classId: string;
  status: 'Present' | 'Absent';
  timestamp: string;
  location?: string;
  method: 'QR' | 'Manual' | 'AI';
}

export interface QRData {
  classId: string;
  date: string;
  startTimestamp: number;
  expiryTimestamp: number;
  token: string;
}
