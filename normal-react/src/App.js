// App.js - SkillPulse without Tailwind
// Uses custom CSS classes from index.css

import React, { useState, useEffect } from 'react';
import { signup, login } from './api/auth';
import { createCheckin, getCheckins } from './api/checkins';
import { createBooking, getBookings } from './api/bookings';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Calendar, Sparkles, ArrowRight, BarChart3, Heart, Coffee, Moon, Target, Zap, Clock, Download, Share2, Sun, Volume2, VolumeX, BarChart2, Eye } from 'lucide-react';
import MentorDashboard from './pages/MentorDashboard';
import StudentReport from './pages/StudentReport';
import StressMonitor from './pages/StressMonitor';
import StressAnalytics from './pages/StressAnalytics';


export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'student' or 'mentor'
  const [signupRole, setSignupRole] = useState('student'); // For role selection during signup
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [checkInData, setCheckInData] = useState({
    focus: 5,
    motivation: 5,
    stress: 5,
    studyHours: 4,
    sleep: 7,
    breaks: 'sometimes'
  });
  const [history, setHistory] = useState([]);
  const [currentScore, setCurrentScore] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);

  // Admin view state (hardcoded credentials)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminRecords, setAdminRecords] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Mentoring states
  const [mentors] = useState([
    { id: 1, name: 'Dr. Aisha Khan', title: 'Cognitive Learning Coach', expertise: ['Study strategies','Memory techniques'], rating: 4.9, bio: 'Helps students build sustainable study routines and memory skills.', availability: 'Mon, Wed, Fri' },
    { id: 2, name: 'Sam Patel', title: 'Productivity Mentor', expertise: ['Time management','Pomodoro'], rating: 4.8, bio: 'Focuses on practical productivity systems and micro-goal planning.', availability: 'Tue, Thu' },
    { id: 3, name: 'Lena Gomez', title: 'Wellness Mentor', expertise: ['Sleep','Stress management'], rating: 4.7, bio: 'Guides on sleep hygiene and stress-reduction for better learning.', availability: 'Weekends' }
  ]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [bookings, setBookings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skillpulse-bookings')) || []; } catch (e) { return []; }
  });

  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [modalMentor, setModalMentor] = useState(null);
  const [bookingTime, setBookingTime] = useState(() => new Date(Date.now() + 3600000).toISOString().slice(0,16)); // default: +1 hour
  const [bookingNotes, setBookingNotes] = useState('');

  // User-wise details state (must be at top level)
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const userList = React.useMemo(() => {
    if (!adminRecords) return [];
    const users = {};
    adminRecords.forEach(r => {
      const user = r.user || r.email || r.username || 'Unknown';
      if (!users[user]) users[user] = [];
      users[user].push(r);
    });
    return Object.entries(users).map(([user, records]) => ({ user, records }));
  }, [adminRecords]);

  useEffect(() => {
    const saved = localStorage.getItem('skillpulse-history');
    const hasVisited = localStorage.getItem('skillpulse-visited');
    const savedDarkMode = localStorage.getItem('skillpulse-darkmode');
    const savedSound = localStorage.getItem('skillpulse-sound');
    const loggedInUser = localStorage.getItem('skillpulse-current-user');
    const loggedInRole = localStorage.getItem('skillpulse-current-role');
    
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
    if (loggedInUser && loggedInRole) {
      setUser(loggedInUser);
      setUserRole(loggedInRole);
      setView('welcome');
    } else if (hasVisited) {
      setView('checkin');
    }
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
  }, []);

  // fetch remote data when authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let mounted = true;
    (async () => {
      try {
        const [checkInRes, bookingsRes] = await Promise.all([
          getCheckins(),
          getBookings()
        ]);

        if (!mounted) return;
        if (checkInRes.checkIns && Array.isArray(checkInRes.checkIns)) {
          setHistory(checkInRes.checkIns.slice(-7));
          localStorage.setItem('skillpulse-history', JSON.stringify(checkInRes.checkIns.slice(-7)));
        }
        if (bookingsRes.bookings && Array.isArray(bookingsRes.bookings)) {
          // Ensure each booking has _id for report creation
          const bookingsWithIds = bookingsRes.bookings.map(b => ({
            ...b,
            _id: b._id || b.id
          }));
          setBookings(bookingsWithIds);
          localStorage.setItem('skillpulse-bookings', JSON.stringify(bookingsWithIds));
        }
      } catch (err) {
        // ignore fetch errors silently
        console.warn('Could not fetch remote data', err.message);
      }
    })();

    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const playSound = (type) => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'click') {
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'success') {
      oscillator.frequency.value = 523.25;
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      oscillator.start(audioContext.currentTime);
      
      setTimeout(() => {
        oscillator.frequency.value = 659.25;
      }, 100);
      
      setTimeout(() => {
        oscillator.frequency.value = 783.99;
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.stop(audioContext.currentTime + 0.3);
      }, 200);
    } else if (type === 'warning') {
      oscillator.frequency.value = 400;
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  };

  const vibrate = (pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('skillpulse-darkmode', newMode);
    playSound('click');
    vibrate(50);
  };

  const toggleSound = () => {
    const newSound = !soundEnabled;
    setSoundEnabled(newSound);
    localStorage.setItem('skillpulse-sound', newSound);
    if (newSound) playSound('click');
    vibrate(50);
  };
  const handleSignup = async (email, password) => {
    if (!email || !password) return alert("Fill all fields");
    try {
      const res = await signup({ email, password, role: signupRole });
      // store auth info
      if (res.token) localStorage.setItem('token', res.token);
      localStorage.setItem('skillpulse-current-user', email);
      localStorage.setItem('skillpulse-current-role', signupRole);
      localStorage.setItem('isAuth', 'true');
      setUser(email);
      setUserRole(signupRole);
      setSignupRole('student');
      setView('welcome');
      alert('Signup successful!');
    } catch (err) {
      alert(err.message || 'Signup failed');
    }
  };

const handleLogin = async (email, password) => {
  if (!email || !password) return alert('Fill all fields');
  try {
    const res = await login({ email, password });
    if (res.token) localStorage.setItem('token', res.token);
    const role = res.user?.role || 'student';
    localStorage.setItem('skillpulse-current-user', email);
    localStorage.setItem('skillpulse-current-role', role);
    localStorage.setItem('isAuth', 'true');
    setUser(email);
    setUserRole(role);
    setView('welcome');
  } catch (err) {
    alert(err.message || 'Login failed');
  }
};

const handleLogout = () => {
  localStorage.removeItem("skillpulse-current-user");
  localStorage.removeItem("skillpulse-current-role");
  setUser(null);
  setUserRole(null);
  setView("login");
};

const adminLogin = async (username, password) => {
  setAdminError('');
  setAdminLoading(true);

  const response = await fetch('/api/admin/stress-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (!response.ok) {
    setAdminError(data.error || 'Invalid credentials');
    setAdminLoading(false);
    return;
  }

  setAdminRecords(data.records || []);
  setAdminStats(data.stats || null);
  setIsAdminAuthenticated(true);
  setView('admin');
  setAdminLoading(false);
};

const adminLogout = () => {
  setIsAdminAuthenticated(false);
  setAdminRecords([]);
  setAdminStats(null);
  setAdminError('');
  setView('welcome');
};

const downloadAdminTrendReport = () => {
  if (!adminStats || !adminRecords || adminRecords.length === 0) {
    alert('No trend data available to export. Please refresh records first.');
    return;
  }

  const safeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const recordsWithTimestamp = adminRecords
    .map((record) => ({
      timestamp: record.timestamp ? new Date(record.timestamp) : null,
      expectedIntensity: safeNumber(record.expectedIntensity),
      expectedStressLevel: (record.expectedStressLevel || 'Unknown').toString()
    }))
    .filter((record) => record.timestamp && !Number.isNaN(record.timestamp.getTime()));

  const sorted = recordsWithTimestamp.sort((a, b) => a.timestamp - b.timestamp);

  const dailyBuckets = sorted.reduce((acc, record) => {
    const day = record.timestamp.toISOString().split('T')[0];
    if (!acc[day]) {
      acc[day] = {
        count: 0,
        intensityTotal: 0,
        intensityCount: 0,
        minIntensity: null,
        maxIntensity: null,
        levels: {}
      };
    }

    const bucket = acc[day];
    bucket.count += 1;
    bucket.levels[record.expectedStressLevel] = (bucket.levels[record.expectedStressLevel] || 0) + 1;

    if (record.expectedIntensity !== null) {
      bucket.intensityTotal += record.expectedIntensity;
      bucket.intensityCount += 1;
      bucket.minIntensity = bucket.minIntensity === null ? record.expectedIntensity : Math.min(bucket.minIntensity, record.expectedIntensity);
      bucket.maxIntensity = bucket.maxIntensity === null ? record.expectedIntensity : Math.max(bucket.maxIntensity, record.expectedIntensity);
    }

    return acc;
  }, {});

  const dateRange = sorted.length > 0
    ? `${sorted[0].timestamp.toISOString().split('T')[0]} to ${sorted[sorted.length - 1].timestamp.toISOString().split('T')[0]}`
    : 'No dated records';

  const levelSummary = Object.entries(adminStats.byLevel || {})
    .map(([level, count]) => `- ${level}: ${count}`)
    .join('\n');

  const dailySummary = Object.entries(dailyBuckets)
    .sort(([dayA], [dayB]) => dayA.localeCompare(dayB))
    .map(([day, bucket]) => {
      const avg = bucket.intensityCount > 0 ? (bucket.intensityTotal / bucket.intensityCount).toFixed(2) : 'N/A';
      const min = bucket.minIntensity ?? 'N/A';
      const max = bucket.maxIntensity ?? 'N/A';
      const levels = Object.entries(bucket.levels)
        .map(([level, count]) => `${level}:${count}`)
        .join(', ');
      return `${day} | records=${bucket.count} | avgIntensity=${avg} | min=${min} | max=${max} | levels=[${levels}]`;
    })
    .join('\n');

  const report = [
    'SkillPulse Admin Trend Analysis Report',
    '=====================================',
    '',
    `Generated On: ${new Date().toLocaleString()}`,
    `Date Range: ${dateRange}`,
    `Total Records: ${adminStats.total}`,
    `Average Intensity: ${adminStats.avgIntensity}`,
    `Minimum Intensity: ${adminStats.minIntensity}`,
    `Maximum Intensity: ${adminStats.maxIntensity}`,
    `Overall Trend: ${adminStats.trend}`,
    '',
    'Stress Level Distribution',
    '-------------------------',
    levelSummary || 'No distribution data available',
    '',
    'Daily Trend Breakdown',
    '---------------------',
    dailySummary || 'No daily trend data available',
    '',
    'End of Report'
  ].join('\n');

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SkillPulse-Admin-Trend-Report-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  playSound('success');
  vibrate([100, 50, 100]);
};

  // Admin: Download 7-Day Wellness Trend Report (not CV-related)
  const downloadAdminWellnessReport = () => {
    if (!adminRecords || adminRecords.length === 0) {
      alert('No data available to export. Please refresh records first.');
      return;
    }

    // Only use records with timestamp, expectedIntensity, expectedStressLevel
    const safeNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const records = adminRecords
      .map((r) => ({
        timestamp: r.timestamp ? new Date(r.timestamp) : null,
        expectedIntensity: safeNumber(r.expectedIntensity),
        expectedStressLevel: (r.expectedStressLevel || 'Unknown').toString()
      }))
      .filter((r) => r.timestamp && !Number.isNaN(r.timestamp.getTime()));

    // Group by day (last 7 days)
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const dayBuckets = {};
    days.forEach((day) => {
      dayBuckets[day] = [];
    });
    records.forEach((r) => {
      const day = r.timestamp.toISOString().split('T')[0];
      if (dayBuckets[day]) dayBuckets[day].push(r);
    });

    // Calculate stats for each day
    const dailyStats = days.map((day) => {
      const bucket = dayBuckets[day];
      if (!bucket || bucket.length === 0) {
        return {
          day,
          count: 0,
          avg: 'N/A',
          min: 'N/A',
          max: 'N/A',
          healthy: 0,
          moderate: 0,
          high: 0
        };
      }
      const intensities = bucket.map((r) => r.expectedIntensity).filter((n) => n !== null);
      const avg = intensities.length ? (intensities.reduce((a, b) => a + b, 0) / intensities.length).toFixed(2) : 'N/A';
      const min = intensities.length ? Math.min(...intensities) : 'N/A';
      const max = intensities.length ? Math.max(...intensities) : 'N/A';
      // Classify by intensity (example: <=30 healthy, 31-60 moderate, >60 high)
      const healthy = intensities.filter((v) => v <= 30).length;
      const moderate = intensities.filter((v) => v > 30 && v <= 60).length;
      const high = intensities.filter((v) => v > 60).length;
      return { day, count: bucket.length, avg, min, max, healthy, moderate, high };
    });

    // Build report
    const report = [
      'SkillPulse - 7-Day Wellness Trend Report (Admin)',
      '===============================================',
      '',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Day         | Records | Avg Intensity | Min | Max | Healthy | Moderate | High',
      '----------------------------------------------------------------------------',
      ...dailyStats.map((s) => `${s.day} | ${s.count}      | ${s.avg}         | ${s.min} | ${s.max} | ${s.healthy}      | ${s.moderate}       | ${s.high}`),
      '',
      'Legend:',
      'Healthy (<=30), Moderate (31-60), High (>60)',
      '',
      'End of Report'
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkillPulse-Admin-7Day-Wellness-Report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    playSound('success');
    vibrate([100, 50, 100]);
  };

// Mentoring helpers
const selectMentor = (mentor) => {
  setSelectedMentor(mentor);
  playSound('click');
  vibrate(50);
};

const bookMentor = (mentor) => {
  // quick local fallback; prefer API booking via confirmBooking/modal flow
  const booking = { id: Date.now(), mentorId: mentor.id, mentorName: mentor.name, date: new Date().toLocaleString(), notes: '' };
  const newBookings = [...bookings, booking];
  setBookings(newBookings);
  localStorage.setItem('skillpulse-bookings', JSON.stringify(newBookings));
  playSound('success');
  vibrate([100,50,100]);
  alert(`Booked a mentoring session with ${mentor.name}`);
};

const openBookingModal = (mentor) => {
  setModalMentor(mentor);
  setBookingTime(new Date(Date.now() + 3600000).toISOString().slice(0,16));
  setBookingNotes('');
  setIsBookingModalOpen(true);
  playSound('click');
  vibrate(50);
};

const closeBookingModal = () => {
  setIsBookingModalOpen(false);
  setModalMentor(null);
};

const confirmBooking = async (mentor) => {
  if (!bookingTime) return alert('Please select a date and time for your session.');
  const bookingDate = new Date(bookingTime);
  if (isNaN(bookingDate.getTime())) return alert('Invalid date/time selected');

  const payload = {
    mentorId: mentor.id,
    mentorName: mentor.name,
    date: bookingDate.toLocaleString(),
    iso: bookingDate.toISOString(),
    notes: bookingNotes
  };

  try {
    // send to backend
    const created = await createBooking(payload);
    const bookingObj = created.booking || created;
    // Ensure we have _id for later report creation
    if (!bookingObj._id && bookingObj.id) {
      bookingObj._id = bookingObj.id;
    }
    const newBookings = [...bookings, bookingObj];
    setBookings(newBookings);
    localStorage.setItem('skillpulse-bookings', JSON.stringify(newBookings));
    setIsBookingModalOpen(false);
    setModalMentor(null);
    playSound('success');
    vibrate([100,50,100]);
    alert(`Scheduled: ${mentor.name} on ${bookingDate.toLocaleString()}`);
  } catch (err) {
    alert(err.message || 'Failed to create booking');
  }
};

// Cancel booking helper
const cancelBooking = (bookingId) => {
  const toCancel = bookings.find(b => b.id === bookingId);
  if (!toCancel) return;
  const ok = window.confirm(`Cancel booking with ${toCancel.mentorName} on ${toCancel.date}?`);
  if (!ok) return;
  const newBookings = bookings.filter(b => b.id !== bookingId);
  setBookings(newBookings);
  localStorage.setItem('skillpulse-bookings', JSON.stringify(newBookings));
  playSound('warning');
  vibrate([50,50]);
  alert('Booking canceled');
};

  if (view === 'login') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <Brain size={56} />
          <h2>Welcome Back</h2>
          <p>Login to continue SkillPulse</p>

          <input id="login-email" placeholder="Email" />
          <input id="login-password" type="password" placeholder="Password" />

          <button
            className="btn btn-primary btn-full"
            onClick={() =>
              handleLogin(
                document.getElementById("login-email").value,
                document.getElementById("login-password").value
              )
            }
          >
            Login
          </button>

          <button
            className="btn btn-secondary btn-full"
            style={{ marginTop: '1rem' }}
            onClick={() => setView('admin-login')}
          >
            👨‍💼 Admin Login
          </button>

          <p className="auth-switch">
            New here?{" "}
            <span onClick={() => setView("signup")}>Create account</span>
          </p>
        </div>
      </div>
    );
  }

  if (view === 'admin-login') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <Brain size={56} />
          <h2>Admin Login</h2>
          <p>Enter admin credentials to access reports</p>
          <input id="admin-username" placeholder="Username" />
          <input id="admin-password" type="password" placeholder="Password" />
          <button
            className="btn btn-primary btn-full"
            onClick={() =>
              adminLogin(
                document.getElementById("admin-username").value,
                document.getElementById("admin-password").value
              )
            }
            disabled={adminLoading}
          >
            {adminLoading ? "Logging in..." : "Login"}
          </button>
          {adminError && <div className="error">{adminError}</div>}
          <button
            className="btn btn-secondary btn-full"
            style={{ marginTop: '1rem' }}
            onClick={() => setView('login')}
          >
            Back to User Login
          </button>
        </div>
      </div>
    );
  }


  // --- User-wise details state (move to top level for hooks rule) ---

  // ...existing code...

  if (view === 'admin') {
    return (
      <div className="admin-container" style={{maxWidth: 900, margin: '40px auto', padding: 24}}>
        <div className="admin-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
          <h2 style={{fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1px'}}>Admin Dashboard</h2>
          <button className="btn btn-secondary" onClick={adminLogout}>Logout</button>
        </div>
        <div style={{display:'flex',gap:'2rem',flexWrap:'wrap',marginBottom:'2.5rem'}}>
          {/* Stats Card */}
          <div style={{flex:'1 1 260px',background:'#fff',borderRadius:16,boxShadow:'0 2px 16px #0001',padding:'2rem 1.5rem',minWidth:260}}>
            <h3 style={{fontSize:'1.2rem',marginBottom:16,borderLeft:'4px solid #9333ea',paddingLeft:8,color:'#9333ea'}}>Trend Analysis</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <span><b>Total Records:</b> <span style={{color:'#9333ea'}}>{adminStats?.total ?? '-'}</span></span>
              <span><b>Avg Intensity:</b> <span style={{color:'#f59e42'}}>{adminStats?.avgIntensity ?? '-'}</span></span>
              <span><b>Min Intensity:</b> <span style={{color:'#22c55e'}}>{adminStats?.minIntensity ?? '-'}</span></span>
              <span><b>Max Intensity:</b> <span style={{color:'#ef4444'}}>{adminStats?.maxIntensity ?? '-'}</span></span>
              <span><b>Overall Trend:</b> <span style={{color:'#6366f1'}}>{adminStats?.trend ?? '-'}</span></span>
            </div>
            <div style={{marginTop:24,display:'flex',gap:12}}>
              <button className="btn btn-primary" onClick={downloadAdminTrendReport} style={{flex:1}}>Download Trend Report</button>
              <button className="btn btn-primary" onClick={downloadAdminWellnessReport} style={{flex:1,background:'#a78bfa'}}>7-Day Wellness</button>
            </div>
          </div>
          {/* Divider for large screens */}
          <div style={{width:2,background:'#f3f4f6',borderRadius:2,alignSelf:'stretch',display:window.innerWidth>700?'block':'none'}}></div>
          {/* Records Card */}
          <div style={{flex:'2 1 400px',background:'#fff',borderRadius:16,boxShadow:'0 2px 16px #0001',padding:'2rem 1.5rem',minWidth:320}}>
            <h3 style={{fontSize:'1.2rem',marginBottom:16,borderLeft:'4px solid #9333ea',paddingLeft:8,color:'#9333ea'}}>Recent Records</h3>
            {/* User List */}
            <div style={{marginBottom:16}}>
              <span style={{fontWeight:600}}>Users: </span>
              {userList.map(({user, records}, idx) => (
                <button key={user} style={{margin:'0 8px 8px 0',padding:'4px 12px',borderRadius:8,border:'1px solid #9333ea',background:'#f3f4f6',color:'#9333ea',cursor:'pointer',fontWeight:500,fontSize:'0.98rem'}} onClick={()=>{setSelectedUser({user,records});setShowUserModal(true);}}>
                  {user} <span style={{fontSize:'0.85em',color:'#888'}}>({records.length})</span>
                </button>
              ))}
            </div>
            <div className="admin-records" style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'1rem',background:'#fafaff',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px #0001'}}>
                <thead>
                  <tr style={{background:'#f3f4f6',color:'#9333ea'}}>
                    <th style={{padding:'10px 8px',fontWeight:600}}>Date</th>
                    <th style={{padding:'10px 8px',fontWeight:600}}>Intensity</th>
                    <th style={{padding:'10px 8px',fontWeight:600}}>Stress Level</th>
                    <th style={{padding:'10px 8px',fontWeight:600}}>User</th>
                  </tr>
                </thead>
                <tbody>
                  {adminRecords && adminRecords.length > 0 ? adminRecords.slice(-20).reverse().map((rec, i) => (
                    <tr key={i} style={{background: i%2===0 ? '#fff' : '#f6f6fa', transition:'background 0.2s'}}>
                      <td style={{padding:'8px 8px',borderBottom:'1px solid #f3f4f6'}}>{rec.timestamp ? new Date(rec.timestamp).toLocaleString() : '-'}</td>
                      <td style={{padding:'8px 8px',borderBottom:'1px solid #f3f4f6',color:'#6366f1',fontWeight:500}}>{rec.expectedIntensity}</td>
                      <td style={{padding:'8px 8px',borderBottom:'1px solid #f3f4f6'}}>{rec.expectedStressLevel}</td>
                      <td style={{padding:'8px 8px',borderBottom:'1px solid #f3f4f6',color:'#9333ea',fontWeight:500}}>{rec.user || rec.email || rec.username || 'Unknown'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} style={{padding:'12px',textAlign:'center',color:'#888'}}>No records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* User Modal */}
        {showUserModal && selectedUser && (
          <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.25)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowUserModal(false)}>
            <div style={{background:'#fff',borderRadius:16,padding:'2rem 2.5rem',minWidth:340,maxWidth:500,boxShadow:'0 4px 32px #0002',position:'relative'}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setShowUserModal(false)} style={{position:'absolute',top:12,right:12,background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#9333ea'}}>&times;</button>
              <h3 style={{marginBottom:12,color:'#9333ea'}}>User Details: {selectedUser.user}</h3>
              <div style={{maxHeight:350,overflowY:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.98rem',background:'#fafaff',borderRadius:8,overflow:'hidden'}}>
                  <thead>
                    <tr style={{background:'#f3f4f6',color:'#9333ea'}}>
                      <th style={{padding:'8px',fontWeight:600}}>Date</th>
                      <th style={{padding:'8px',fontWeight:600}}>Intensity</th>
                      <th style={{padding:'8px',fontWeight:600}}>Stress Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.records.map((rec, i) => (
                      <tr key={i} style={{background: i%2===0 ? '#fff' : '#f6f6fa'}}>
                        <td style={{padding:'7px 8px',borderBottom:'1px solid #f3f4f6'}}>{rec.timestamp ? new Date(rec.timestamp).toLocaleString() : '-'}</td>
                        <td style={{padding:'7px 8px',borderBottom:'1px solid #f3f4f6',color:'#6366f1',fontWeight:500}}>{rec.expectedIntensity}</td>
                        <td style={{padding:'7px 8px',borderBottom:'1px solid #f3f4f6'}}>{rec.expectedStressLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
if (view === 'signup') {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <Sparkles size={56} />
        <h2>Create Account</h2>
        <p>Start your learning wellness journey</p>

        <input id="signup-email" placeholder="Email" />
        <input id="signup-password" type="password" placeholder="Password" />

        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>I am a:</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setSignupRole('student')}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: signupRole === 'student' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                background: signupRole === 'student' ? 'var(--primary-light)' : 'var(--input-background)',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              👨‍🎓 Student
            </button>
            <button
              onClick={() => setSignupRole('mentor')}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: signupRole === 'mentor' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                background: signupRole === 'mentor' ? 'var(--primary-light)' : 'var(--input-background)',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              👨‍🏫 Mentor
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={() =>
            handleSignup(
              document.getElementById("signup-email").value,
              document.getElementById("signup-password").value
            )
          }
        >
          Sign Up
        </button>

        <p className="auth-switch">
          Already registered?{" "}
          <span onClick={() => setView("login")}>Login</span>
        </p>
      </div>
    </div>
  );
}
<button onClick={handleLogout} className="icon-btn">
  Logout
</button>

  const calculateFatigueScore = (data) => {
    const stressComponent = data.stress * 2.5;
    const focusComponent = (10 - data.focus) * 2;
    const motivationComponent = (10 - data.motivation) * 2;
    const studyComponent = data.studyHours >= 6 ? 15 : 0;
    const sleepComponent = (10 - data.sleep) * 1.5;
    const breakComponent = data.breaks === 'no' ? 10 : data.breaks === 'rarely' ? 5 : 0;

    const score = Math.min(100, Math.max(0, 
      stressComponent + focusComponent + motivationComponent + 
      studyComponent + sleepComponent + breakComponent
    ));

    return Math.round(score);
  };

  const generateSuggestions = (score, data) => {
    const suggestions = [];

    if (data.stress >= 7) {
      suggestions.push({
        icon: '🧘',
        title: 'Manage Your Stress',
        text: 'Try 5-minute breathing exercises between study sessions. High stress blocks learning.',
        action: 'Start 5-min meditation'
      });
    }

    if (data.focus <= 4) {
      suggestions.push({
        icon: '⏱️',
        title: 'Use Pomodoro Technique',
        text: 'Study for 25 minutes, break for 5. This maintains focus without exhaustion.',
        action: 'Set timer now'
      });
    }

    if (data.sleep <= 6) {
      suggestions.push({
        icon: '😴',
        title: 'Prioritize Sleep',
        text: 'Aim for 7-8 hours tonight. Sleep directly impacts focus, memory, and stress levels.',
        action: 'Set bedtime reminder'
      });
    }

    if (data.studyHours >= 6 && data.breaks !== 'yes') {
      suggestions.push({
        icon: '🚶',
        title: 'Take Active Breaks',
        text: 'Every 90 minutes, take a 10-minute walk. Movement improves retention and reduces fatigue.',
        action: 'Schedule breaks'
      });
    }

    if (data.motivation <= 4) {
      suggestions.push({
        icon: '🎯',
        title: 'Set Micro-Goals',
        text: 'Break tasks into 30-minute chunks. Small wins rebuild motivation naturally.',
        action: 'Create goal list'
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        icon: '✨',
        title: 'Keep Up The Balance',
        text: 'Your learning rhythm looks healthy. Maintain this pace and stay consistent.',
        action: 'View insights'
      });
    }

    return suggestions.slice(0, 3);
  };

  const handleSubmit = async () => {
    const score = calculateFatigueScore(checkInData);
    const newSuggestions = generateSuggestions(score, checkInData);
    
    const payload = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: Date.now(),
      score,
      ...checkInData
    };

    try {
      const created = await createCheckin(payload);
      // API returns created check-in under `checkIn` or raw object
      const checkInObj = created.checkIn || created;

      const newHistory = [...history, checkInObj].slice(-7);
      setHistory(newHistory);
      localStorage.setItem('skillpulse-history', JSON.stringify(newHistory));

      setCurrentScore(score);
      setSuggestions(newSuggestions);

      if (score <= 30) {
        setShowConfetti(true);
        playSound('success');
        vibrate([100, 50, 100, 50, 100]);
        setTimeout(() => setShowConfetti(false), 3000);
      } else if (score > 60) {
        playSound('warning');
        vibrate([200, 100, 200]);
      } else {
        playSound('click');
        vibrate(100);
      }

      setAnimateScore(true);
      setTimeout(() => setAnimateScore(false), 1000);
      setView('results');
    } catch (err) {
      alert(err.message || 'Failed to save check-in');
    }
  };

  const exportPDF = () => {
    playSound('click');
    vibrate(50);
    
    const report = `
SkillPulse - Weekly Wellness Report
==================================

Generated: ${new Date().toLocaleDateString()}

7-Day Summary:
${history.map((h, i) => `
Day ${i + 1} (${h.date}):
- Fatigue Score: ${h.score}/100
- Focus: ${h.focus}/10
- Motivation: ${h.motivation}/10
- Stress: ${h.stress}/10
- Study Hours: ${h.studyHours}
- Sleep: ${h.sleep}/10
- Breaks: ${h.breaks}
`).join('\n')}

Statistics:
- Healthy Days: ${history.filter(h => h.score <= 30).length}
- Moderate Days: ${history.filter(h => h.score > 30 && h.score <= 60).length}
- High Risk Days: ${history.filter(h => h.score > 60).length}

Keep tracking your wellness with SkillPulse!
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkillPulse-Report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareProgress = () => {
    const healthyDays = history.filter(h => h.score <= 30).length;
    const message = `🎉 I maintained healthy learning habits for ${healthyDays} out of ${history.length} days with SkillPulse! Track your learning wellness and prevent burnout. #SkillPulse #LearningWellness`;
    
    if (navigator.share) {
      navigator.share({
        title: 'SkillPulse - My Progress',
        text: message,
      }).then(() => {
        playSound('success');
        vibrate(100);
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(message);
      setShowShareModal(true);
      playSound('click');
      vibrate(50);
      setTimeout(() => setShowShareModal(false), 2000);
    }
  };

  const getScoreStatus = (score) => {
    if (score <= 30) return { text: 'Healthy Learning Pace', emoji: '🎉', className: 'healthy' };
    if (score <= 60) return { text: 'Moderate Fatigue', emoji: '⚠️', className: 'moderate' };
    return { text: 'High Burnout Risk', emoji: '🚨', className: 'high-risk' };
  };

  const handleStart = () => {
    localStorage.setItem('skillpulse-visited', 'true');
    setView('checkin');
    playSound('success');
    vibrate(100);
  };

  const handleSliderChange = (field, value) => {
    setCheckInData({...checkInData, [field]: parseInt(value)});
    playSound('click');
    vibrate(10);
  };

  const SliderInput = ({ label, value, onChange, max = 10, icon: Icon, lowLabel, highLabel }) => (
    <div className="slider-container">
      <div className="slider-label">
        <label>
          {Icon && <Icon size={16} />}
          {label}
        </label>
        <span className={`value ${animateScore ? 'animate' : ''}`}>{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={onChange}
        className="slider"
        style={{
          background: `linear-gradient(to right, ${darkMode ? '#a78bfa' : '#9333ea'} 0%, ${darkMode ? '#a78bfa' : '#9333ea'} ${(value/max)*100}%, ${darkMode ? '#4b5563' : '#e9d5ff'} ${(value/max)*100}%, ${darkMode ? '#4b5563' : '#e9d5ff'} 100%)`
        }}
      />
      <div className="slider-labels">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );

  if (view === 'welcome') {
    return (
      <div className="welcome-container">
        <div className="welcome-content">
          <div className="welcome-hero">
            <div className="hero-icon">
              <Brain size={80} />
            </div>
            <h1>SkillPulse</h1>
            <p>Your Personal Learning Wellness Companion</p>
          </div>

          <div className="card-glass">
            <h2>Why SkillPulse?</h2>
            <div className="feature-grid">
              <div className="feature-card purple">
                <div className="icon">📊</div>
                <div>
                  <h3>Track Your Energy</h3>
                  <p>Daily check-ins help you understand your learning patterns</p>
                </div>
              </div>
              <div className="feature-card pink">
                <div className="icon">🤖</div>
                <div>
                  <h3>AI-Powered Insights</h3>
                  <p>Get personalized suggestions to prevent burnout</p>
                </div>
              </div>
              <div className="feature-card violet">
                <div className="icon">📈</div>
                <div>
                  <h3>See Your Progress</h3>
                  <p>Visualize trends and celebrate healthy habits</p>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleStart} className="btn btn-primary btn-large btn-full">
            Start Your Journey
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {showConfetti && (
        <div className="confetti-container">
          <div className="confetti-main">🎉</div>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="confetti-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      {showShareModal && (
        <div className="share-modal">
          <div className="share-modal-content">
            <p>✅ Copied to clipboard!</p>
          </div>
        </div>
      )}
      
      <div className="container">
        {/* Header */}
        <div className="app-header">
          <div className="logo-container">
            <div className="logo-icon">
              <Brain size={32} />
            </div>
            <div className="logo-text">
              <h1>SkillPulse</h1>
              <p>Learning Wellness Tracker</p>
            </div>
          </div>
          <div className="header-controls">
            <button onClick={toggleSound} className="icon-btn">
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button onClick={toggleDarkMode} className="icon-btn">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {history.length > 0 && (
              <div className="streak-badge">
                <div className="label">Streak</div>
                <div className="value">{history.length} 🔥</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Pills */}
        <div className="nav-pills">
          {/* Common for both students and mentors */}
          <button
            onClick={() => { setView('checkin'); playSound('click'); vibrate(50); }}
            className={`nav-pill ${view === 'checkin' ? 'active' : ''}`}
          >
            <Heart size={20} />
            Check-In
          </button>
          <button
            onClick={() => { setView('trends'); playSound('click'); vibrate(50); }}
            className={`nav-pill ${view === 'trends' ? 'active' : ''}`}
          >
            <BarChart3 size={20} />
            Trends
          </button>

          <button
            onClick={() => { setView('stress-monitor'); playSound('click'); vibrate(50); }}
            className={`nav-pill ${view === 'stress-monitor' ? 'active' : ''}`}
          >
            <Eye size={20} />
            AI Stress
          </button>

          <button
            onClick={() => { setView('stress-analytics'); playSound('click'); vibrate(50); }}
            className={`nav-pill ${view === 'stress-analytics' ? 'active' : ''}`}
          >
            <BarChart3 size={20} />
            Stress Stats
          </button>

          <button
            onClick={() => { setView('activities'); playSound('click'); vibrate(50); }}
            className={`nav-pill ${view === 'activities' ? 'active' : ''}`}
          >
            <Sparkles size={20} />
            Stress-Busters
          </button>

          {/* Student-only navigation */}
          {userRole === 'student' && (
            <>
              <button
                onClick={() => { setView('mentoring'); playSound('click'); vibrate(50); }}
                className={`nav-pill ${view === 'mentoring' ? 'active' : ''}`}
              >
                <Coffee size={20} />
                Mentoring
              </button>

              <button
                onClick={() => { setView('studentreport'); playSound('click'); vibrate(50); }}
                className={`nav-pill ${view === 'studentreport' ? 'active' : ''}`}
              >
                <BarChart2 size={20} />
                My Reports
              </button>
            </>
          )}

          {/* Mentor-only navigation */}
          {userRole === 'mentor' && (
            <button
              onClick={() => { setView('mentordash'); playSound('click'); vibrate(50); }}
              className={`nav-pill ${view === 'mentordash' ? 'active' : ''}`}
            >
              <Brain size={20} />
              Mentor Hub
            </button>
          )}
        </div>

        {/* Check-In View */}
        {view === 'checkin' && (
          <div className="card">
            <div style={{ marginBottom: '2rem' }}>
              <h2>Daily Check-In</h2>
              <p>How are you feeling today? Take a moment to reflect.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <SliderInput
                label="Focus Level"
                value={checkInData.focus}
                onChange={(e) => handleSliderChange('focus', e.target.value)}
                icon={Target}
                lowLabel="Distracted"
                highLabel="Laser-focused"
              />

              <SliderInput
                label="Motivation"
                value={checkInData.motivation}
                onChange={(e) => handleSliderChange('motivation', e.target.value)}
                icon={Zap}
                lowLabel="Unmotivated"
                highLabel="Energized"
              />

              <SliderInput
                label="Stress Level"
                value={checkInData.stress}
                onChange={(e) => handleSliderChange('stress', e.target.value)}
                icon={AlertCircle}
                lowLabel="Calm"
                highLabel="Overwhelmed"
              />

              <SliderInput
                label="Study Hours"
                value={checkInData.studyHours}
                onChange={(e) => handleSliderChange('studyHours', e.target.value)}
                max={12}
                icon={Clock}
                lowLabel="0 hrs"
                highLabel="12+ hrs"
              />

              <SliderInput
                label="Sleep Quality"
                value={checkInData.sleep}
                onChange={(e) => handleSliderChange('sleep', e.target.value)}
                icon={Moon}
                lowLabel="Poor"
                highLabel="Excellent"
              />

              <div className="slider-container">
                <div className="slider-label">
                  <label>
                    <Coffee size={16} />
                    Did you take breaks?
                  </label>
                </div>
                <div className="break-buttons">
                  {[
                    { value: 'yes', label: 'Yes, regularly', emoji: '✅' },
                    { value: 'sometimes', label: 'Sometimes', emoji: '😊' },
                    { value: 'rarely', label: 'Rarely', emoji: '😐' },
                    { value: 'no', label: 'No breaks', emoji: '😰' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => { 
                        setCheckInData({...checkInData, breaks: option.value}); 
                        playSound('click'); 
                        vibrate(50); 
                      }}
                      className={`break-btn ${checkInData.breaks === option.value ? 'active' : ''}`}
                    >
                      <span className="emoji">{option.emoji}</span>
                      <span className="label">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} className="btn btn-primary btn-large btn-full" style={{ marginTop: '2.5rem' }}>
              <Sparkles size={24} />
              Analyze My Wellness
              <ArrowRight size={24} />
            </button>
          </div>
        )}

        {/* Results View */}
        {view === 'results' && currentScore !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <h2>Your Learning Wellness Score</h2>
                <button onClick={shareProgress} className="action-btn purple">
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>
              
              <div className="score-display">
                <div className="score-circle-container">
                  <svg className={`score-circle ${animateScore ? 'animate' : ''}`} viewBox="0 0 192 192">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke={darkMode ? '#374151' : '#e5e7eb'}
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke={currentScore <= 30 ? '#22c55e' : currentScore <= 60 ? '#eab308' : '#ef4444'}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(currentScore / 100) * 552.92} 552.92`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="score-value">
                    <div className={`score-number ${getScoreStatus(currentScore).className} ${animateScore ? 'animate' : ''}`}>
                      {currentScore}
                    </div>
                    <div className="score-max">out of 100</div>
                  </div>
                </div>

                <div className={`score-badge ${getScoreStatus(currentScore).className}`}>
                  <span className="emoji">{getScoreStatus(currentScore).emoji}</span>
                  <span>{getScoreStatus(currentScore).text}</span>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <div className="emoji">😴</div>
                  <div className="label">Sleep</div>
                  <div className="value">{checkInData.sleep}/10</div>
                </div>
                <div className="stat-item">
                  <div className="emoji">🎯</div>
                  <div className="label">Focus</div>
                  <div className="value">{checkInData.focus}/10</div>
                </div>
                <div className="stat-item">
                  <div className="emoji">😰</div>
                  <div className="label">Stress</div>
                  <div className="value">{checkInData.stress}/10</div>
                </div>
              </div>
            </div>

            <div className="suggestions-card">
              <h3>
                <Sparkles size={28} />
                Personalized Recommendations
              </h3>
              <div>
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="suggestion-item">
                    <div className="suggestion-icon">{suggestion.icon}</div>
                    <div className="suggestion-content">
                      <h4>{suggestion.title}</h4>
                      <p>{suggestion.text}</p>
                      <button 
                        onClick={() => { playSound('click'); vibrate(50); }}
                        className="suggestion-action"
                      >
                        {suggestion.action} →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setView('trends'); playSound('click'); vibrate(50); }}
              className="btn btn-secondary btn-full"
            >
              View My Trends
              <TrendingUp size={20} />
            </button>
          </div>
        )}

        {/* Mentoring View */}
        {view === 'mentoring' && userRole === 'student' && (
          <div className="card">
            <div style={{ marginBottom: '1.5rem' }}>
              <h2>Mentoring Sessions</h2>
              <p>Browse mentors and book a session to get personalized guidance.</p>
            </div>

            <div className="mentors-grid">
              {mentors.map(m => (
                <div key={m.id} className={`mentor-card ${selectedMentor && selectedMentor.id === m.id ? 'selected' : ''}`}>
                  <div className="mentor-header">
                    <h3>{m.name}</h3>
                    <div className="mentor-title">{m.title}</div>
                  </div>
                  <p className="mentor-bio">{m.bio}</p>
                  <div className="mentor-meta">
                    <div>Expertise: {m.expertise.join(', ')}</div>
                    <div>Rating: {m.rating} ⭐</div>
                    <div>Availability: {m.availability}</div>
                  </div>
                  <div className="mentor-actions">
                    <button className={`btn ${selectedMentor && selectedMentor.id === m.id ? 'btn-secondary' : 'btn-primary'}`} onClick={() => selectMentor(m)}>
                      {selectedMentor && selectedMentor.id === m.id ? 'Selected' : 'Select'}
                    </button>
                    <button className="btn btn-outline" onClick={() => openBookingModal(m)}>
                      Schedule Session
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Booking Modal */}
            {isBookingModalOpen && modalMentor && (
              <div className="modal-overlay" onClick={closeBookingModal}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Schedule session with {modalMentor.name}</h3>
                  <label style={{ display: 'block', marginTop: '0.75rem' }}>When</label>
                  <input type="datetime-local" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />

                  <label style={{ display: 'block', marginTop: '0.75rem' }}>Notes (optional)</label>
                  <textarea value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} placeholder="Things you'd like to cover" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '8px', minHeight: '80px', border: '1px solid var(--border-color)' }} />

                  <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={closeBookingModal}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => confirmBooking(modalMentor)}>Confirm</button>
                  </div>
                </div>
              </div>
            )}

            {bookings.length > 0 && (
              <div className="bookings-list" style={{ marginTop: '1.5rem' }}>
                <h4>Your Bookings</h4>
                <ul>
                  {bookings.map(b => (
                    <li key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                      <div>{b.date} — {b.mentorName}{b.notes ? ` — ${b.notes}` : ''}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" onClick={() => navigator.clipboard?.writeText(`${b.mentorName} — ${b.date}${b.notes ? ` — ${b.notes}` : ''}`) || alert('Copied booking details')}>Copy</button>
                        <button className="btn btn-danger" onClick={() => cancelBooking(b.id)}>Cancel</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Activities View */}
        {view === 'activities' && (
          <div className="card">
            <div style={{ marginBottom: '1rem' }}>
              <h2>Stress-Busting Activities</h2>
              <p>Try one of these quick, calming activities. Each opens in a new tab.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="suggestion-item">
                <div className="suggestion-icon">🧘</div>
                <div className="suggestion-content">
                  <h4>Yoga for Stress Relief (10 min)</h4>
                  <p>A short, gentle yoga sequence to release tension and calm the mind.</p>
                  <a href="https://www.yogajournal.com/poses/" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Open Yoga Guide</a>
                </div>
              </div>

              <div className="suggestion-item">
                <div className="suggestion-icon">🧘‍♂️</div>
                <div className="suggestion-content">
                  <h4>Short Guided Meditation (5 min)</h4>
                  <p>A quick mindfulness practice to reset focus and calm.</p>
                  <a href="https://www.headspace.com/meditation/stress" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Open Meditation</a>
                </div>
              </div>

              <div className="suggestion-item">
                <div className="suggestion-icon">🧩</div>
                <div className="suggestion-content">
                  <h4>Calming Jigsaw Puzzle</h4>
                  <p>A simple puzzle you can do for a few minutes to lower stress and improve focus.</p>
                  <a href="https://www.jigsawplanet.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Open Puzzle</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Stress Monitor View */}
        {view === 'stress-monitor' && (
          <StressMonitor />
        )}

        {/* Stress Analytics View */}
        {view === 'stress-analytics' && (
          <StressAnalytics />
        )}

        {/* Student Report View - Only for Students */}
        {view === 'studentreport' && userRole === 'student' && (
          <StudentReport 
            completedBookings={bookings.filter(b => new Date(b.iso) < new Date())}
            onReportSubmitted={() => {
              playSound('success');
              vibrate([100,50,100]);
            }}
          />
        )}

        {/* Mentor Dashboard View - Only for Mentors */}
        {view === 'mentordash' && userRole === 'mentor' && (
          <MentorDashboard />
        )}

        {/* Navbar */}
<div className="navbar">
  <div className="navbar-left">
    <h1>SkillPulse</h1>
  </div>
  <div className="navbar-right">
    <button
      className="btn btn-logout"
      onClick={() => {
        handleLogout();
        playSound('click');
        vibrate(50);
      }}
    >
      Logout
    </button>
  </div>
</div>

        {/* Trends View */}
        {view === 'trends' && (
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 className="flex items-center gap-3">
                <TrendingUp size={28} />
                Your 7-Day Wellness Journey
              </h2>
              {history.length > 0 && (
                <button onClick={exportPDF} className="action-btn purple">
                  <Download size={16} />
                  <span>Export Report</span>
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={darkMode ? '#a78bfa' : '#9333ea'} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={darkMode ? '#a78bfa' : '#9333ea'} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f0f0f0'} />
                      <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#9ca3af'} style={{ fontSize: '12px' }} />
                      <YAxis domain={[0, 100]} stroke={darkMode ? '#9ca3af' : '#9ca3af'} style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#1f2937' : '#fff', 
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          color: darkMode ? '#fff' : '#000'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke={darkMode ? '#a78bfa' : '#9333ea'} 
                        strokeWidth={3}
                        fill="url(#colorScore)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="trend-stats">
                  <div className="trend-stat healthy">
                    <div className="number">{history.filter(h => h.score <= 30).length}</div>
                    <div className="label">Healthy Days</div>
                    <div className="sublabel">🎉 Great balance</div>
                  </div>
                  <div className="trend-stat moderate">
                    <div className="number">{history.filter(h => h.score > 30 && h.score <= 60).length}</div>
                    <div className="label">Moderate Days</div>
                    <div className="sublabel">⚠️ Watch carefully</div>
                  </div>
                  <div className="trend-stat high-risk">
                    <div className="number">{history.filter(h => h.score > 60).length}</div>
                    <div className="label">High Risk Days</div>
                    <div className="sublabel">🚨 Take action</div>
                  </div>
                </div>

                <div className="insight-box">
                  <div className="icon">💡</div>
                  <div>
                    <h4>AI Insight</h4>
                    <p>
                      {history.length >= 3 && history[history.length - 1].score > history[0].score + 15
                        ? "Your fatigue is trending upward. Consider reducing study hours or improving sleep quality to prevent burnout."
                        : history.length >= 3 && history[history.length - 1].score < history[0].score - 15
                        ? "Excellent progress! Your fatigue levels are decreasing. Keep up your healthy habits and balanced routine."
                        : "Your fatigue levels are relatively stable. Continue monitoring your patterns to maintain this balance."}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Calendar size={80} />
                <h3>No Data Yet</h3>
                <p>Complete your first check-in to see your wellness trends!</p>
                <button
                  onClick={() => { setView('checkin'); playSound('click'); vibrate(50); }}
                  className="btn btn-primary"
                >
                  Start Check-In
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}