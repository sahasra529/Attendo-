
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxA3XUeIPjKSx9n-5eJAfUSMukTTeDH5-AmeMUD04GawViBEk1KM78cBRap175HGVQu_Q/exec';

export async function callBackend(action: string, payload: any = {}) {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      throw new Error("Invalid response from backend server.");
    }

    if (!result.success) {
      throw new Error(result.error || 'Backend operation failed');
    }
    return result.data;
  } catch (error: any) {
    console.error(`API Error [${action}]:`, error);
    throw new Error(error.message || "Connection to backend failed.");
  }
}

export const authApi = {
  loginManual: (email: string) => callBackend('login_manual', { email: email.trim().toLowerCase() }),
  loginGoogle: (email: string) => callBackend('login_google', { email: email.trim().toLowerCase() }),
  signup: (data: any) => callBackend('signup', { ...data, email: data.email.trim().toLowerCase() }),
};

export const studentApi = {
  getProfile: (id: string) => callBackend('get_student_profile', { studentId: id }),
  getHistory: (id: string) => callBackend('get_attendance_history', { studentId: id }),
  markAttendance: (data: any) => callBackend('mark_attendance', data),
};

export const teacherApi = {
  getClasses: (email: string) => callBackend('get_classes', { email: email.trim().toLowerCase(), role: 'Teacher' }),
};

export const adminApi = {
  getUsers: () => callBackend('admin_get_users'),
  approveUser: (email: string) => callBackend('admin_approve_user', { email: email.trim().toLowerCase() }),
  deactivateUser: (email: string) => callBackend('admin_deactivate_user', { email: email.trim().toLowerCase() }),
  getStats: () => callBackend('admin_get_stats'),
};
