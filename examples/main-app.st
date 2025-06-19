// Main application using library components
// File: examples/main-app.st
// This file demonstrates cross-file references to library.st

PROGRAM MainApplication
VAR
    // Library function block instances
    temperatureController : FB_AdvancedPID;
    safetySystem : FB_SafetyMonitor;
    
    // Process variables
    currentTemp : REAL := 25.0;
    currentPressure : REAL := 2.5;
    targetTemp : REAL := 75.0;
    
    // Control signals
    heaterOutput : REAL;
    emergencyPressed : BOOL := FALSE;
    
    // Status variables
    systemSafe : BOOL;
    alarmState : BOOL;
    
    // Converted temperatures for display
    tempInFahrenheit : REAL;
    
    // Timers
    controlCycleTimer : TON;
    safetyCheckTimer : TON;
    
    // System info
    version : STRING;
END_VAR

// Initialize system version from global constant
version := SYSTEM_VERSION;

// Convert temperature for display (using library function)
tempInFahrenheit := CelsiusToFahrenheit(currentTemp);

// Temperature control using advanced PID from library
temperatureController(
    setpoint := targetTemp,
    processValue := currentTemp,
    kP := 2.5,
    kI := 0.8,
    kD := 0.15,
    enableIntegral := TRUE,
    enableDerivative := TRUE
);

heaterOutput := temperatureController.output;

// Safety monitoring using library function block
safetySystem(
    temperature := currentTemp,
    pressure := currentPressure,
    emergencyStop := emergencyPressed
);

systemSafe := safetySystem.safetyOK;
alarmState := safetySystem.alarmActive;

// Emergency shutdown if required
IF safetySystem.shutdownRequired THEN
    heaterOutput := 0.0;
    targetTemp := MIN_TEMPERATURE;
END_IF

// Control cycle timing
controlCycleTimer(IN := TRUE, PT := T#100ms);
IF controlCycleTimer.Q THEN
    // Reset timer for next cycle
    controlCycleTimer(IN := FALSE);
END_IF

// Safety check timing
safetyCheckTimer(IN := TRUE, PT := T#50ms);
IF safetyCheckTimer.Q THEN
    // Reset timer for next safety check
    safetyCheckTimer(IN := FALSE);
END_IF

// Temperature bounds checking using global constants
IF targetTemp > MAX_TEMPERATURE THEN
    targetTemp := MAX_TEMPERATURE;
END_IF

IF targetTemp < MIN_TEMPERATURE THEN
    targetTemp := MIN_TEMPERATURE;
END_IF

END_PROGRAM
