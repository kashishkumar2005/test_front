import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/StressMonitor.css';
import EmotionPostureDetector from '../components/EmotionPostureDetector';
import LiveStressChart from '../components/LiveStressChart';
import SessionSummaryModal from '../components/SessionSummaryModal';

const StressMonitor = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stressLevel, setStressLevel] = useState(0);
  const [intensity, setIntensity] = useState('Minimal');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [permissions, setPermissions] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [detectorActive, setDetectorActive] = useState(false);
  const detectorRef = useRef({});
  const [monitoringTime, setMonitoringTime] = useState(0);
  const streamRef = useRef(null);
  const monitoringIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const previousFrameRef = useRef(null);
  const [stressHistory, setStressHistory] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary] = useState({ avg: 0, max: 0, min: 0, duration: 0, tip: '' });

  // Initialize webcam
  const initializeWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = null; // Force refresh
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setHasCameraAccess(true); // Set only when video is ready
          console.log('✅ Webcam enabled and video playing', videoRef.current);
        };
        // Fallback: if onloadedmetadata doesn't fire in 1s, set anyway
        setTimeout(() => {
          if (videoRef.current && videoRef.current.srcObject && !hasCameraAccess) {
            setHasCameraAccess(true);
            console.log('✅ Webcam fallback: set hasCameraAccess after timeout');
          }
        }, 1000);
      }
    } catch (error) {
      console.log('Camera access not available:', error.message);
      setHasCameraAccess(false);
    } finally {
      setPermissions(true);
    }
  };

  // Analyze video frame for stress indicators
  const analyzeVideoFrame = useCallback(() => {
    if (!videoRef.current || !hasCameraAccess) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = 640;
      canvas.height = 480;
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, 640, 480);
      
      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, 640, 480);
      const data = imageData.data;
      
      // Calculate average brightness
      let brightness = 0;
      let colorVariance = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const pixelBrightness = (r + g + b) / 3;
        brightness += pixelBrightness;
        colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
      }
      
      brightness = brightness / (data.length / 4);
      colorVariance = (colorVariance / (data.length / 4)) * 0.5;
      
      // Calculate movement (frame-to-frame difference)
      let movement = 0;
      if (previousFrameRef.current) {
        for (let i = 0; i < Math.min(data.length, previousFrameRef.current.length); i += 4) {
          const diff = Math.abs(data[i] - previousFrameRef.current[i]) +
                      Math.abs(data[i + 1] - previousFrameRef.current[i + 1]) +
                      Math.abs(data[i + 2] - previousFrameRef.current[i + 2]);
          movement += diff;
        }
        movement = movement / (data.length / 4) / 255 * 100;
      }
      
      previousFrameRef.current = new Uint8ClampedArray(data);
      
      // Calculate stress: brightness deviation + movement + color variance
      let stressBased = Math.abs((brightness - 128) / 128) * 30 + 
                       Math.min(movement, 50) + 
                       Math.min(colorVariance, 20) +
                       (Math.random() - 0.5) * 10;
      
      stressBased = Math.min(100, Math.max(0, stressBased));
      // If detector provided a combined score, prefer it (detector updates state separately)
      if (!detectorRef.current.combined) {
        setStressLevel(Math.round(stressBased));
      }
      
      // Determine intensity level
      if (stressBased >= 80) setIntensity('Critical');
      else if (stressBased >= 60) setIntensity('High');
      else if (stressBased >= 40) setIntensity('Moderate');
      else if (stressBased >= 20) setIntensity('Low');
      else setIntensity('Minimal');
      
      // Add to stress value update logic (inside analyzeVideoFrame, simulateStress, and handleDetectorPrediction):
      setStressHistory(prev => [
        ...prev.slice(-49),
        { time: new Date().toLocaleTimeString().split(' ')[0], value: Math.round(stressBased ?? stressLevel) }
      ]);
    }
  }, [hasCameraAccess, stressLevel]);

  // Simulate stress detection (when camera not available)
  const simulateStress = useCallback(() => {
    let stress = 20;
    const randomChange = (Math.random() - 0.5) * 40;
    stress = Math.min(100, Math.max(0, stress + randomChange));
    setStressLevel(Math.round(stress));
    
    if (stress >= 80) setIntensity('Critical');
    else if (stress >= 60) setIntensity('High');
    else if (stress >= 40) setIntensity('Moderate');
    else if (stress >= 20) setIntensity('Low');
    else setIntensity('Minimal');
  }, []);

  // Start monitoring with continuous live feed
  const startMonitoring = async () => {
    if (!permissions) {
      await initializeWebcam();
    }
    
    setIsMonitoring(true);
    setMonitoringTime(0);
    setDetectorActive(true);
    
    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setMonitoringTime(prev => prev + 1);
    }, 1000);
    
    const monitoringLoop = async () => {
      let isRunning = true;
      
      const intervalId = setInterval(async () => {
        if (!isRunning) return;
        
        if (hasCameraAccess) {
          analyzeVideoFrame();
        } else {
          simulateStress();
        }
      }, 500);
      
      // Run for continuous monitoring (no auto-stop)
      monitoringIntervalRef.current = intervalId;
    };
    
    monitoringLoop();
  };

  // Stop monitoring and save data
  const stopMonitoring = async () => {
    setIsMonitoring(false);
    setDetectorActive(false);

    // Clear timers
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Only send if detectionData is non-empty
    if (!Array.isArray(stressHistory) || stressHistory.length < 3) {
      // Not enough data collected. Please monitor for a few seconds before stopping.
      setMonitoringTime(0);
      return;
    }

    // Build detectionData with extra fields for backend compatibility
    const detectionData = stressHistory.map(entry => ({
      time: entry.time,
      value: entry.value,
      faceScore: entry.faceScore ?? entry.value,
      postureScore: entry.postureScore ?? entry.value,
      combined: entry.combined ?? entry.value
    }));

    // Save stress data to backend
    try {
      const token = localStorage.getItem('token');
      const payload = {
        stressLevel: Number.isFinite(stressLevel) ? stressLevel : 0,
        intensity: intensity || 'Minimal',
        duration: Number.isFinite(monitoringTime) ? monitoringTime : 0,
        timestamp: new Date().toISOString(),
        detectionData
      };
      const response = await fetch('/api/stress/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        // Failed to save stress data: errorText
      } else {
        console.log('✅ Stress data saved:', payload);
      }
    } catch (error) {
      console.error('Error saving stress data:', error);
      // Error saving stress data: error.message
    }

    setMonitoringTime(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleDetectorPrediction = useCallback(({ combined, faceScore, postureScore }) => {
    detectorRef.current = { combined, faceScore, postureScore };
    setStressLevel(combined);
    if (combined >= 80) setIntensity('Critical');
    else if (combined >= 60) setIntensity('High');
    else if (combined >= 40) setIntensity('Moderate');
    else if (combined >= 20) setIntensity('Low');
    else setIntensity('Minimal');

    // Add a new entry to stressHistory with all fields for backend compatibility
    setStressHistory(prev => [
      ...prev.slice(-49),
      {
        time: new Date().toLocaleTimeString().split(' ')[0],
        value: combined,
        faceScore,
        postureScore,
        combined
      }
    ]);
  }, []);

  return (
    <div className="stress-monitor">
      <h1>🧠 Real-Time Stress Monitor</h1>
      
      <div className="monitor-controls">
        {!permissions && (
          <button onClick={initializeWebcam} className="btn btn-primary">
            🎥 Enable Webcam
          </button>
        )}
        
        {permissions && (
          <>
            {!isMonitoring ? (
              <button onClick={startMonitoring} className="btn btn-success">
                ▶ Start Monitoring
              </button>
            ) : (
              <button onClick={stopMonitoring} className="btn btn-danger">
                ⏹ Stop Monitoring
              </button>
            )}
          </>
        )}
      </div>

      <div className="monitor-content">
        <div className="video-container" style={{ position: 'relative' }}>
          {/* Always render the video element so ref is always set */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onError={e => console.log('Video error', e)}
            style={{
              width: '100%',
              maxWidth: '640px',
              borderRadius: '12px',
              display: permissions ? 'block' : 'none',
              background: '#000',
              opacity: hasCameraAccess ? 1 : 0.5,
              filter: hasCameraAccess ? 'none' : 'grayscale(1) blur(2px)'
            }}
          />
          {/* Always render canvas for analysis, but hide it visually */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{ display: 'none' }}
          />
          {/* Overlay and status messages */}
          {!permissions && (
            <div style={{
              width: '100%',
              maxWidth: '640px',
              height: '480px',
              background: '#1a1a2e',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <p>Click "Enable Webcam" to start</p>
              <small>Allow camera access for live analysis</small>
            </div>
          )}
          {permissions && !hasCameraAccess && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              background: 'rgba(26,26,46,0.8)',
              borderRadius: '12px',
              zIndex: 2
            }}>
              <span>Waiting for camera access...</span>
            </div>
          )}
          {isMonitoring && hasCameraAccess && (
            <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '8px' }}>🔴 LIVE: Camera Feed Active</div>
          )}
          {isMonitoring && !hasCameraAccess && (
            <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '8px' }}>📊 Demo Mode: Simulated Analysis</div>
          )}
          {/* Debug panel for troubleshooting camera issues */}
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '6px',
            zIndex: 10
          }}>
            <div>permissions: {String(permissions)}</div>
            <div>hasCameraAccess: {String(hasCameraAccess)}</div>
            <div>videoRef.current: {videoRef.current ? 'set' : 'null'}</div>
            <div>videoRef.current.srcObject: {videoRef.current && videoRef.current.srcObject ? 'set' : 'null'}</div>
          </div>
        </div>
        <LiveStressChart data={stressHistory} />
        {/* Background detector component: uses same videoRef for analysis */}
        <EmotionPostureDetector
          videoRef={videoRef}
          enabled={detectorActive && hasCameraAccess}
          onPrediction={handleDetectorPrediction}
        />

        {isMonitoring && (
          <div className="analysis-panel">
            <div className="stress-meter">
              <h2>Stress Level: <span style={{ fontSize: '32px' }}>{stressLevel}%</span></h2>
              <div className="stress-bar" 
                style={{ 
                  width: `${stressLevel}%`,
                  background: stressLevel >= 80 ? '#ef4444' :
                             stressLevel >= 60 ? '#f97316' :
                             stressLevel >= 40 ? '#eab308' :
                             '#22c55e'
                }}
              ></div>
              <p className={`intensity ${intensity.toLowerCase()}`}>
                {stressLevel >= 80 ? '🔴' : stressLevel >= 60 ? '🟠' : stressLevel >= 40 ? '🟡' : '🟢'} {intensity}
              </p>
            </div>

            <div className="recommendations">
              <h3>💡 Recommendations:</h3>
              <ul>
                {stressLevel >= 80 && (
                  <>
                    <li>✓ Take a 5-10 minute break immediately</li>
                    <li>✓ Practice deep breathing exercises</li>
                    <li>✓ Step outside for fresh air</li>
                  </>
                )}
                {stressLevel >= 60 && stressLevel < 80 && (
                  <>
                    <li>✓ Take a short 2-3 minute break</li>
                    <li>✓ Stretch your neck and shoulders</li>
                    <li>✓ Drink some water</li>
                  </>
                )}
                {stressLevel < 60 && (
                  <>
                    <li>✓ Keep maintaining your current pace</li>
                    <li>✓ Take periodic breaks every hour</li>
                    <li>✓ Stay hydrated and focused</li>
                  </>
                )}
              </ul>
            </div>

            <div className="session-summary">
              <h3>📌 Session Summary</h3>
              <SessionSummaryModal
                avg={sessionSummary.avg}
                max={sessionSummary.max}
                min={sessionSummary.min}
                duration={sessionSummary.duration}
                tip={sessionSummary.tip}
                isOpen={showSummary}
                onClose={() => setShowSummary(false)}
              />
            </div>
          </div>
        )}
      </div>
      <SessionSummaryModal open={showSummary} summary={sessionSummary} onClose={() => setShowSummary(false)} />
    </div>
  );
};

export default StressMonitor;
