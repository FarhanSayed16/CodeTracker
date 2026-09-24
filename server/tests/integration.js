import { io } from 'socket.io-client';
import fetch from 'node-fetch'; // assuming node-fetch or native fetch in Node 18+
import FormData from 'form-data';

// Use native fetch if available (Node 18+)
const API_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('--- STARTING END-TO-END INTEGRATION TEST ---');

  // 1. Professor Register & Login
  console.log('1. Registering professor...');
  const profEmail = `testprof_${Date.now()}@test.com`;
  let res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: profEmail, password: 'password123', name: 'Dr. Test' })
  });
  let data = await res.json();
  if (!res.ok) throw new Error(data.error);
  const profToken = data.data.token;
  console.log('✅ Professor registered and logged in.');

  // Connect Professor Socket
  const profSocket = io('http://localhost:3000', { auth: { token: profToken } });
  profSocket.on('connect', () => console.log('✅ Professor socket connected.'));

  // 2. Create Class & Upload Roster
  console.log('2. Creating class...');
  res = await fetch(`${API_URL}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${profToken}` },
    body: JSON.stringify({ className: 'Integration Test Class' })
  });
  data = await res.json();
  if (!res.ok) throw new Error(data.error);
  const classId = data.data.id;
  console.log(`✅ Class created (ID: ${classId})`);

  console.log('3. Uploading roster...');
  const formData = new FormData();
  formData.append('file', Buffer.from('Roll No.,Name of Students\nTEST-01,Alice Test\nTEST-02,Bob Test\n'), {
    filename: 'roster.csv',
    contentType: 'text/csv'
  });

  res = await fetch(`${API_URL}/classes/${classId}/roster`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${profToken}`,
      ...formData.getHeaders()
    },
    body: formData
  });
  data = await res.json();
  if (!res.ok) throw new Error(data.error);
  console.log(
    `✅ Roster uploaded (created ${data.data.created}, linked ${data.data.linked}, already ${data.data.alreadyEnrolled}).`
  );

  // 3. Create Session
  console.log('4. Creating session...');
  res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${profToken}` },
    body: JSON.stringify({ classId, title: 'E2E Test Session' })
  });
  data = await res.json();
  if (!res.ok) throw new Error(data.error);
  const sessionId = data.data.id;
  const sessionCode = data.data.sessionCode;
  console.log(`✅ Session created (Code: ${sessionCode})`);

  // Professor joins session room
  profSocket.emit('join-session', sessionId);

  // 4. Student search + join with PIN
  console.log('5. Student searching roster...');
  res = await fetch(`${API_URL}/sessions/${sessionCode}/students?q=Alice`);
  data = await res.json();
  if (!res.ok) throw new Error(data.error);
  const studentMatch = data.data?.[0];
  if (!studentMatch?.id) throw new Error('Student search returned no matches');
  console.log(`✅ Found student ${studentMatch.name} (${studentMatch.rollNo})`);

  console.log('6. Student joining with PIN...');
  res = await fetch(`${API_URL}/sessions/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionCode, studentId: studentMatch.id, pin: '1234' })
  });
  data = await res.json();
  if (!res.ok) throw new Error(data.error);
  const studentToken = data.data.token;
  console.log('✅ Student joined and received token.');

  const studentSocket = io('http://localhost:3000', { auth: { token: studentToken } });
  await new Promise(resolve => studentSocket.once('connect', resolve));
  console.log('✅ Student socket connected.');
  
  // Wait a small buffer to ensure the server processes the connection and room join
  await new Promise(resolve => setTimeout(resolve, 500));

  // 5. Add Tasks & Sync
  console.log('7. Adding tasks...');
  
  const studentTaskPromise = new Promise((resolve) => {
    studentSocket.once('new-task', (task) => {
      console.log(`✅ Student received new task via socket: ${task.title}`);
      resolve(task.id);
    });
  });

  res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${profToken}` },
    body: JSON.stringify({ sessionId, title: 'Test Task 1' })
  });
  data = await res.json();
  if (!res.ok) throw new Error(data.error);
  console.log('✅ Task created via API.');

  const taskId = await studentTaskPromise;

  // 6. Student Submits Status
  console.log('8. Student submitting status...');
  const profStatusPromise = new Promise((resolve) => {
    profSocket.once('status-update', (update) => {
      console.log(`✅ Professor received status update: ${update.status} (Issue: ${update.issueText || 'none'})`);
      resolve();
    });
  });

  res = await fetch(`${API_URL}/responses/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
    body: JSON.stringify({ taskId, status: 'ISSUE', issueText: 'I am stuck on this e2e test' })
  });
  if (!res.ok) {
    data = await res.json();
    throw new Error(data.error);
  }
  
  await profStatusPromise;

  // 7. End Session
  console.log('9. Ending session...');
  const studentEndPromise = new Promise((resolve) => {
    studentSocket.once('session-ended', () => {
      console.log('✅ Student received session-ended event.');
      resolve();
    });
  });

  res = await fetch(`${API_URL}/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${profToken}` },
  });
  if (!res.ok) {
    data = await res.json();
    throw new Error(data.error);
  }

  await studentEndPromise;

  console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  
  profSocket.disconnect();
  studentSocket.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
