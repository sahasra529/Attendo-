
/**
 * SMART STUDENT ATTENDANCE SYSTEM - BACKEND (GAS)
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

/**
 * Main entry point for POST requests from the web app.
 */
function doPost(e) {
  setupDatabase();
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("Empty request body.");
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let responseData;

    switch(action) {
      case 'signup': responseData = signup(body); break;
      case 'login_manual': responseData = loginManual(body); break;
      case 'login_google': responseData = loginGoogle(body); break;
      case 'get_student_profile': responseData = getStudentProfile(body.studentId); break;
      case 'get_attendance_history': responseData = getAttendanceHistory(body.studentId); break;
      case 'get_classes': responseData = getClasses(body.email, body.role); break;
      case 'mark_attendance': responseData = markAttendance(body); break;
      case 'admin_get_users': responseData = adminGetUsers(); break;
      case 'admin_approve_user': responseData = adminApproveUser(body.email); break;
      case 'admin_get_stats': responseData = adminGetStats(); break;
      default: throw new Error("Invalid action: " + action);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: responseData }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Clean up the error message for the frontend
    let errorStr = error.toString();
    errorStr = errorStr.replace("Error: ", "").replace("TypeError: ", "");
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: errorStr }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Initializes the spreadsheet structure if sheets are missing.
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    'Users': ['Email', 'Role', 'Name', 'Status', 'Password'],
    'Students': ['StudentID', 'Name', 'Email', 'Class', 'RollNo', 'FaceImageURL', 'Status'],
    'Classes': ['ClassID', 'ClassName', 'Subject', 'TeacherEmail', 'StartTime', 'EndTime'],
    'Attendance': ['AttendanceID', 'Date', 'StudentID', 'ClassID', 'Status', 'Timestamp', 'Location', 'Method']
  };
  for (let name in sheets) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
    }
  }
}

/**
 * Handles manual login via email.
 */
function loginManual(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  if (!sheet) throw new Error("Users sheet not found.");
  
  const values = sheet.getDataRange().getValues();
  const emailLower = (data.email || "").toLowerCase().trim();
  
  if (!emailLower) throw new Error("Email is required.");

  let userRow = null;
  // Start from index 1 to skip headers
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length === 0) continue;
    
    const cellValue = row[0];
    if (cellValue === undefined || cellValue === null || cellValue === "") continue;

    if (String(cellValue).toLowerCase().trim() === emailLower) {
      userRow = row;
      break;
    }
  }

  if (!userRow) {
    throw new Error("Account '" + emailLower + "' not found. Have you registered?");
  }

  const status = String(userRow[3] || 'Active').trim();
  if (status === 'Inactive' || status === 'Pending') {
    throw new Error("Your account is currently " + status + ". Please contact admin.");
  }

  const role = String(userRow[1] || 'Student').trim();
  const name = String(userRow[2] || userRow[0].split('@')[0]).trim();

  let studentId = '';
  if (role === 'Student') {
    const student = getStudentByEmail(userRow[0]);
    studentId = student ? student.studentId : '';
  }

  return { email: String(userRow[0]), role, name, status, studentId };
}

/**
 * Handles Google Login verification.
 */
function loginGoogle(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const values = sheet.getDataRange().getValues();
  const emailLower = (data.email || "").toLowerCase().trim();
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;
    
    if (String(row[0]).toLowerCase().trim() === emailLower) {
      const status = String(row[3] || 'Active').trim();
      if (status === 'Inactive' || status === 'Pending') throw new Error("Account status: " + status);
      
      let studentId = '';
      const role = String(row[1] || 'Student');
      if (role === 'Student') {
        const student = getStudentByEmail(row[0]);
        studentId = student ? student.studentId : '';
      }
      return { email: String(row[0]), role, name: String(row[2] || row[0].split('@')[0]), status, studentId };
    }
  }
  throw new Error("Google account '" + emailLower + "' is not registered. Please sign up first.");
}

/**
 * Creates a new user record.
 */
function signup(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const values = sheet.getDataRange().getValues();
  const emailLower = (data.email || "").toLowerCase().trim();
  
  if (!emailLower) throw new Error("Invalid email.");

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] && String(values[i][0]).toLowerCase().trim() === emailLower) {
      throw new Error("Email already registered.");
    }
  }
  
  const status = data.role === 'Teacher' ? 'Pending' : 'Active';
  sheet.appendRow([emailLower, data.role, data.name, status, ""]);
  
  if (data.role === 'Student') {
    const studentId = 'S' + Math.floor(1000 + Math.random() * 9000);
    ss.getSheetByName('Students').appendRow([studentId, data.name, emailLower, 'General', 'N/A', '', 'Active']);
  }
  return { status };
}

/**
 * Retrieves a student's profile and basic stats.
 */
function getStudentProfile(studentId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Students');
  if (!sheet) return null;
  
  const sValues = sheet.getDataRange().getValues();
  let profile = null;
  const targetId = String(studentId || "").trim();

  for (let i = 1; i < sValues.length; i++) {
    if (sValues[i][0] && String(sValues[i][0]).trim() === targetId) {
      profile = { 
        studentId: String(sValues[i][0]), 
        name: String(sValues[i][1] || "Unknown"), 
        email: String(sValues[i][2] || ""), 
        class: String(sValues[i][3] || ""), 
        rollNo: String(sValues[i][4] || ""), 
        status: String(sValues[i][6] || "Active") 
      };
      break;
    }
  }
  
  if (!profile) return null;
  
  const attSheet = ss.getSheetByName('Attendance');
  const aValues = attSheet ? attSheet.getDataRange().getValues() : [];
  const count = aValues.filter(r => r[2] && String(r[2]).trim() === targetId).length;
  profile.attendancePercent = Math.min(100, Math.round((count / 50) * 100));
  return profile;
}

/**
 * Gets classes available for a user.
 */
function getClasses(email, role) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Classes');
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  const emailLower = (email || "").toLowerCase().trim();
  
  return values.slice(1).filter(r => {
    if (!r[0]) return false; // Skip empty rows
    return role !== 'Teacher' || String(r[3] || "").toLowerCase().trim() === emailLower;
  }).map(r => ({
    classId: String(r[0]), 
    className: String(r[1]), 
    subject: String(r[2]), 
    teacherEmail: String(r[3]), 
    startTime: String(r[4]), 
    endTime: String(r[5])
  }));
}

/**
 * Fetches attendance history records.
 */
function getAttendanceHistory(studentId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Attendance');
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  const targetId = String(studentId || "").trim();
  
  return values.slice(1).filter(r => {
    if (!r[0]) return false;
    return targetId === 'all' || String(r[2]).trim() === targetId;
  }).map(r => ({
    attendanceId: String(r[0]), 
    date: r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(r[1]),
    studentId: String(r[2]), 
    classId: String(r[3]), 
    status: String(r[4]), 
    timestamp: String(r[5]), 
    method: String(r[7] || "QR")
  })).reverse();
}

/**
 * Records a new attendance mark.
 */
function markAttendance(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Attendance');
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  const existing = sheet.getDataRange().getValues();
  const studentId = String(data.studentId || "").trim();
  const classId = String(data.classId || "").trim();

  for (let i = 1; i < existing.length; i++) {
    const row = existing[i];
    if (!row[0]) continue;
    
    const rowDate = row[1] instanceof Date ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(row[1]);
    if (rowDate === dateStr && String(row[2]).trim() === studentId && String(row[3]).trim() === classId) {
      throw new Error("Already marked for this session today.");
    }
  }
  
  sheet.appendRow([
    'ATT' + now.getTime(), 
    dateStr, 
    studentId, 
    classId, 
    'Present', 
    now.toISOString(), 
    String(data.location || 'Unknown'), 
    String(data.method || 'QR')
  ]);
  return { success: true };
}

/**
 * Admin: List all users.
 */
function adminGetUsers() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  return sheet.getDataRange().getValues().slice(1).filter(r => r[0]).map(r => ({
    email: String(r[0]), role: String(r[1]), name: String(r[2]), status: String(r[3])
  }));
}

/**
 * Admin: Approve a pending account.
 */
function adminApproveUser(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const values = sheet.getDataRange().getValues();
  const targetEmail = String(email || "").toLowerCase().trim();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] && String(values[i][0]).toLowerCase().trim() === targetEmail) {
      sheet.getRange(i + 1, 4).setValue('Active');
      return true;
    }
  }
  return false;
}

/**
 * Admin: Fetch dashboard statistics.
 */
function adminGetStats() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const userSheet = ss.getSheetByName('Users');
  const classSheet = ss.getSheetByName('Classes');
  
  const users = userSheet ? userSheet.getDataRange().getValues() : [];
  const classes = classSheet ? classSheet.getDataRange().getValues() : [];
  
  return {
    totalStudents: users.filter(r => String(r[1]).trim() === 'Student').length,
    totalClasses: classes.length > 1 ? classes.length - 1 : 0,
    avgAttendance: 78,
    flagsToday: 0
  };
}

/**
 * Utility: Find student record by email.
 */
function getStudentByEmail(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Students');
  if (!sheet) return null;
  
  const values = sheet.getDataRange().getValues();
  const targetEmail = String(email || "").toLowerCase().trim();

  for (let i = 1; i < values.length; i++) {
    if (values[i][2] && String(values[i][2]).toLowerCase().trim() === targetEmail) {
      return { studentId: String(values[i][0]) };
    }
  }
  return null;
}
