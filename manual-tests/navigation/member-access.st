// Member Access Test File
// This file specifically tests function block member navigation
// Test cases for: instance.member → definition navigation

// Custom Function Block for testing
FUNCTION_BLOCK FB_MotorControl
VAR_INPUT
    start : BOOL;           // Start command
    stop : BOOL;            // Stop command
    speed : REAL;           // Desired speed (0-100%)
END_VAR
VAR_OUTPUT
    running : BOOL;         // Motor running status
    currentSpeed : REAL;    // Current actual speed
    fault : BOOL;           // Fault condition
END_VAR
VAR
    internalState : INT;    // Internal state machine
    rampTimer : TON;        // Speed ramping timer
END_VAR

// Simple motor control logic
IF start AND NOT stop THEN
    running := TRUE;
    currentSpeed := speed;
ELSIF stop THEN
    running := FALSE;
    currentSpeed := 0.0;
END_IF

// Ramp timer for smooth speed changes
rampTimer(IN := running, PT := T#2s);

END_FUNCTION_BLOCK

// Main test program
PROGRAM MemberAccessTest
VAR
    // Standard function block instances
    myTimer : TON;              // Timer instance
    edgeDetector : R_TRIG;      // Rising edge detector
    counter : CTU;              // Up counter
    
    // Custom function block instance
    motorCtrl : FB_MotorControl;  // Custom motor controller
    
    // Test variables
    enableSignal : BOOL;
    motorSpeed : REAL := 75.0;
    pulseSignal : BOOL;
    countValue : INT;
    timerDone : BOOL;
    motorStatus : BOOL;
    motorFault : BOOL;
END_VAR

// Test 1: Standard FB member access - Timer
// Navigate: myTimer.Q → should go to TON.Q definition
// Navigate: myTimer.PT → should go to TON.PT definition
myTimer(IN := enableSignal, PT := T#5s);
timerDone := myTimer.Q;        // Test navigation to .Q member
enableSignal := NOT myTimer.Q; // Test navigation to .Q member again

// Test 2: Standard FB member access - Edge detector
// Navigate: edgeDetector.CLK → should go to R_TRIG.CLK definition
// Navigate: edgeDetector.Q → should go to R_TRIG.Q definition
edgeDetector(CLK := pulseSignal);
IF edgeDetector.Q THEN         // Test navigation to .Q member
    countValue := countValue + 1;
END_IF

// Test 3: Standard FB member access - Counter
// Navigate: counter.CU → should go to CTU.CU definition
// Navigate: counter.CV → should go to CTU.CV definition
counter(CU := edgeDetector.Q, R := myTimer.Q, PV := 10);
countValue := counter.CV;      // Test navigation to .CV member

// Test 4: Custom FB member access
// Navigate: motorCtrl.start → should go to FB_MotorControl.start definition
// Navigate: motorCtrl.running → should go to FB_MotorControl.running definition
motorCtrl(
    start := enableSignal,     // Test navigation to .start member
    stop := FALSE,
    speed := motorSpeed        // Test navigation to .speed member
);

// Access output members
motorStatus := motorCtrl.running;  // Test navigation to .running member
motorFault := motorCtrl.fault;     // Test navigation to .fault member

// Test 5: Nested member access in expressions
IF (myTimer.Q AND motorCtrl.running) OR counter.Q THEN
    // Multiple member accesses in one expression
    // Navigate: myTimer.Q, motorCtrl.running, counter.Q
    motorSpeed := 50.0;
END_IF

// Test 6: Member access in function calls (future test case)
// This would be for when we implement function parameter navigation
// Example: SomeFunction(motorCtrl.currentSpeed, myTimer.ET);

END_PROGRAM
