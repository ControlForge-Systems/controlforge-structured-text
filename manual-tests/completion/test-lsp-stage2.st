// Enhanced test file for Stage 2 LSP functionality
// Tests: Functions, Function Blocks, Programs, and various VAR sections

// Global variables
VAR_GLOBAL
    g_SystemRunning : BOOL := TRUE;
    g_EmergencyStop : BOOL := FALSE;
    g_MainCounter : INT := 0;
END_VAR

// Custom function with parameters
FUNCTION CalculateAverage : REAL
VAR_INPUT
    value1 : REAL;
    value2 : REAL;
    value3 : REAL;
END_VAR
VAR
    sum : REAL;
END_VAR

sum := value1 + value2 + value3;
CalculateAverage := sum / 3.0;

END_FUNCTION

// Custom function block
FUNCTION_BLOCK FB_PIDController
VAR_INPUT
    setpoint : REAL;
    processValue : REAL;
    kP : REAL := 1.0;
    kI : REAL := 0.1;
    kD : REAL := 0.01;
END_VAR
VAR_OUTPUT
    output : REAL;
    error : REAL;
END_VAR
VAR
    integral : REAL;
    lastError : REAL;
    derivative : REAL;
END_VAR

// PID calculation
error := setpoint - processValue;
integral := integral + error;
derivative := error - lastError;
output := kP * error + kI * integral + kD * derivative;
lastError := error;

END_FUNCTION_BLOCK

// Main program
PROGRAM MainControl
VAR
    // Standard function block instances
    mainTimer : TON;
    emergencyTrigger : R_TRIG;
    productCounter : CTU;
    
    // Custom function block instance
    temperatureController : FB_PIDController;
    
    // Local variables
    currentTemp : REAL;
    targetTemp : REAL := 75.5;
    timerRunning : BOOL;
    cycleCount : INT;
END_VAR

// Timer logic
mainTimer(IN := g_SystemRunning, PT := T#10s);
timerRunning := mainTimer.Q;

// Emergency stop detection
emergencyTrigger(CLK := g_EmergencyStop);

// Counter logic
productCounter(CU := timerRunning, R := emergencyTrigger.Q, PV := 100);
cycleCount := productCounter.CV;

// PID temperature control
temperatureController(
    setpoint := targetTemp,
    processValue := currentTemp,
    kP := 2.5,
    kI := 0.8,
    kD := 0.15
);

// Function call example
IF cycleCount > 50 THEN
    targetTemp := CalculateAverage(75.0, 80.0, 70.0);
END_IF

// Global variable usage
g_MainCounter := cycleCount;

END_PROGRAM
