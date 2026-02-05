@echo off
title ClawArmy: Test Agent Submission
color 0A

echo.
echo  ================================================
echo   🛡️ CLAWARMY: TEST AGENT SUBMISSION
echo  ================================================
echo.

:: Test Agent Configuration
set AGENT_NAME=TestNinja
set AGENT_PERSONA=A test specialist for validating the ClawArmy submission pipeline.
set AGENT_INSTRUCTIONS=Execute all validation protocols. Report any anomalies. Confirm data persistence.
set AGENT_CAPABILITIES=["Testing", "Validation", "Debugging"]
set AGENT_PRIORITY=quality

echo  [1/3] Preparing test payload...
echo.

:: Create JSON payload
set JSON_PAYLOAD={"name":"%AGENT_NAME%","persona":"%AGENT_PERSONA%","instructions":"%AGENT_INSTRUCTIONS%","capabilities":%AGENT_CAPABILITIES%,"priority":"%AGENT_PRIORITY%","submitter_id":"test_cli_001"}

echo  Payload: %JSON_PAYLOAD%
echo.

echo  [2/3] Transmitting to ClawArmy HQ...
echo.

:: Send POST request to the API
curl -X POST "https://clawarmy.vercel.app/api/agents/publish" ^
  -H "Content-Type: application/json" ^
  -d "%JSON_PAYLOAD%"

echo.
echo.
echo  [3/3] Transmission complete.
echo.
echo  ================================================
echo   Check /commander dashboard for pending agents
echo  ================================================
echo.

pause
