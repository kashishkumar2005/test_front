# Stress Detection Dataset

Generated synthetic dataset for the SkillPulse stress module.

Files:
- stress_detection_dataset.csv: flat tabular data (300 records)
- stress_detection_dataset.json: API-ready objects for `POST /api/stress/analyze`

Notes:
- This dataset matches the expected detection input shape from `backend/src/stress-detector.js`.
- `expectedStressLevel` and `expectedIntensity` are derived using the same scoring rules as the backend logic.
- Data is synthetic and safe for testing/demo purposes.
