// Library file with reusable function blocks and functions
// File: samples/advanced/library.st

// Global constants
VAR_GLOBAL CONSTANT
    MAX_TEMPERATURE : REAL := 100.0;
    MIN_TEMPERATURE : REAL := 0.0;
    SYSTEM_VERSION : STRING := 'v2.1.0';
END_VAR

// Utility function for temperature conversion
FUNCTION CelsiusToFahrenheit : REAL
VAR_INPUT
    celsius : REAL;
END_VAR

CelsiusToFahrenheit := celsius * 9.0 / 5.0 + 32.0;

END_FUNCTION

// Advanced PID controller function block
FUNCTION_BLOCK FB_AdvancedPID
VAR_INPUT
    setpoint : REAL;
    processValue : REAL;
    kP : REAL := 1.0;
    kI : REAL := 0.1;
    kD : REAL := 0.01;
    enableIntegral : BOOL := TRUE;
    enableDerivative : BOOL := TRUE;
END_VAR
VAR_OUTPUT
    output : REAL;
    error : REAL;
    saturated : BOOL;
END_VAR
VAR
    integral : REAL;
    lastError : REAL;
    derivative : REAL;
    integralLimit : REAL := 100.0;
END_VAR

// Enhanced PID calculation with saturation handling
error := setpoint - processValue;

// Integral term with windup protection
IF enableIntegral AND NOT saturated THEN
    integral := integral + error;
    integral := LIMIT(integralLimit * -1.0, integral, integralLimit);
END_IF

// Derivative term
IF enableDerivative THEN
    derivative := error - lastError;
END_IF

// PID output calculation
output := kP * error;
IF enableIntegral THEN
    output := output + kI * integral;
END_IF
IF enableDerivative THEN
    output := output + kD * derivative;
END_IF

// Saturation detection
saturated := (output >= 100.0) OR (output <= 0.0);
output := LIMIT(0.0, output, 100.0);

lastError := error;

END_FUNCTION_BLOCK

// Safety monitoring function block
FUNCTION_BLOCK FB_SafetyMonitor
VAR_INPUT
    temperature : REAL;
    pressure : REAL;
    emergencyStop : BOOL;
END_VAR
VAR_OUTPUT
    safetyOK : BOOL;
    alarmActive : BOOL;
    shutdownRequired : BOOL;
END_VAR
VAR
    tempAlarm : BOOL;
    pressureAlarm : BOOL;
END_VAR

// Temperature monitoring
tempAlarm := (temperature > MAX_TEMPERATURE) OR (temperature < MIN_TEMPERATURE);

// Pressure monitoring (assuming max pressure of 10.0 bar)
pressureAlarm := pressure > 10.0;

// Overall safety evaluation
alarmActive := tempAlarm OR pressureAlarm;
shutdownRequired := emergencyStop OR (alarmActive AND (temperature > MAX_TEMPERATURE * 1.1));
safetyOK := NOT alarmActive AND NOT emergencyStop;

END_FUNCTION_BLOCK
