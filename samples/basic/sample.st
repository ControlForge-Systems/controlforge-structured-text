(* Comprehensive Structured Text Sample - Covers All IEC 61131-3 Features *)

// Global variables accessible across programs
VAR_GLOBAL
    systemStatus : BOOL := FALSE;
    globalCounter : DINT := 0;
    systemTime : TIME;
END_VAR

// User-defined data types
TYPE
    MotorState : (STOPPED, STARTING, RUNNING, STOPPING, FAULT);
    ProcessData : STRUCT
        setpoint : REAL;
        actual : REAL;
        error : REAL;
        timestamp : DT;
    END_STRUCT;
    TemperatureArray : ARRAY[1..10] OF REAL;
END_TYPE

// Enhanced main program with comprehensive features
PROGRAM ExampleProgram
VAR
    // Basic data types
    counter : INT := 0;
    temperature : REAL := 25.5;
    isRunning : BOOL := TRUE;
    message : STRING := 'Hello PLC World';
    wideMessage : WSTRING := "Unicode Text";
    
    // Time and date types
    timer : TIME := T#10s;
    currentDate : DATE := D#2025-06-12;
    currentTime : TIME_OF_DAY := TOD#14:30:15;
    timestamp : DATE_AND_TIME := DT#2025-06-12-14:30:15;
    longTime : LTIME := LTIME#1d_2h_30m_45s;
    
    // Extended data types
    byteValue : BYTE := 16#FF;
    wordValue : WORD := 16#ABCD;
    dwordValue : DWORD := 16#12345678;
    longValue : LWORD := 16#123456789ABCDEF0;
    
    // Signed and unsigned integers
    shortInt : SINT := -127;
    unsignedShortInt : USINT := 255;
    doubleInt : DINT := -2147483648;
    unsignedDoubleInt : UDINT := 4294967295;
    longInt : LINT := -9223372036854775808;
    unsignedLongInt : ULINT := 18446744073709551615;
    
    // Real numbers
    singleReal : REAL := 3.14159;
    doubleReal : LREAL := 2.71828182845904523536;
    
    // Character types
    singleChar : CHAR := 'A';
    wideChar : WCHAR := "Ω";
    
    // Arrays and structures
    tempArray : TemperatureArray;
    processInfo : ProcessData;
    motorState : MotorState := STOPPED;
    
    // Pointers and references
    tempPointer : POINTER TO REAL;
    tempReference : REFERENCE TO REAL;
    
    // Standard function block instances
    pulseTimer : TP;
    onDelayTimer : TON;
    offDelayTimer : TOF;
    upCounter : CTU;
    downCounter : CTD;
    upDownCounter : CTUD;
    risingEdge : R_TRIG;
    fallingEdge : F_TRIG;
    resetSetFF : RS;
    setResetFF : SR;
    
    // Custom function block instances
    motor1 : FB_Motor;
    motor2 : FB_Motor;
    
    // Control variables
    i : INT;
    j : INT;
    startSignal : BOOL := FALSE;
    stopSignal : BOOL := FALSE;
    resetSignal : BOOL := FALSE;
    mathResult : REAL;
    conversionResult : STRING;
    comparisonResult : BOOL;
END_VAR

// Main program logic demonstrating all language features
IF isRunning THEN
    counter := counter + 1;
    
    // Mathematical functions
    mathResult := ABS(temperature - 50.0);
    mathResult := SQRT(mathResult);
    mathResult := SIN(mathResult * 3.14159 / 180.0); // Convert to radians
    mathResult := MAX(mathResult, 0.1);
    mathResult := MIN(mathResult, 10.0);
    mathResult := LIMIT(0.0, mathResult, 5.0);
    
    // Arithmetic functions
    temperature := ADD(temperature, 0.1);
    temperature := SUB(temperature, 0.05);
    temperature := MUL(temperature, 1.001);
    temperature := DIV(temperature, 1.001);
    
    // Comparison functions
    comparisonResult := GT(temperature, 25.0);
    comparisonResult := LT(temperature, 100.0);
    comparisonResult := GE(temperature, 25.0);
    comparisonResult := LE(temperature, 100.0);
    comparisonResult := EQ(counter, 50);
    comparisonResult := NE(counter, 0);
    
    // Type conversion functions
    conversionResult := REAL_TO_STRING(temperature);
    counter := REAL_TO_INT(temperature);
    isRunning := INT_TO_BOOL(counter);
    timer := REAL_TO_TIME(temperature);
    
    // Control structures
    IF counter > 100 THEN
        counter := 0;
        temperature := temperature * 1.1;
    ELSIF counter > 50 THEN
        temperature := temperature * 0.99;
    ELSE
        temperature := temperature + 0.1;
    END_IF;
    
    // CASE statement with enumeration
    CASE motorState OF
        STOPPED:
            message := 'Motor is stopped';
        STARTING:
            message := 'Motor is starting';
        RUNNING:
            message := 'Motor is running';
        STOPPING:
            message := 'Motor is stopping';
        FAULT:
            message := 'Motor fault detected';
    ELSE
        message := 'Unknown motor state';
    END_CASE;
    
    // Traditional CASE with ranges
    CASE counter OF
        0..10: 
            message := 'Starting phase';
        11..50:
            message := 'Running phase';
        51..100:
            message := 'Finishing phase';
    ELSE
        message := 'Unknown phase';
    END_CASE;
    
    // FOR loop with array processing
    FOR i := 1 TO 10 BY 1 DO
        tempArray[i] := temperature + REAL(i);
        IF tempArray[i] > 100.0 THEN
            EXIT;
        END_IF;
    END_FOR;
    
    // WHILE loop
    j := 1;
    WHILE j <= 5 AND temperature < 100.0 DO
        temperature := temperature + 0.5;
        j := j + 1;
    END_WHILE;
    
    // REPEAT-UNTIL loop
    REPEAT
        temperature := temperature - 0.1;
    UNTIL temperature <= 25.0 OR counter > 200
    END_REPEAT;
    
    // Standard function blocks usage
    pulseTimer(IN := startSignal, PT := T#5s);
    onDelayTimer(IN := startSignal, PT := T#2s);
    offDelayTimer(IN := NOT stopSignal, PT := T#3s);
    
    upCounter(CU := risingEdge.Q, R := resetSignal, PV := 100);
    downCounter(CD := fallingEdge.Q, LD := resetSignal, PV := 100);
    upDownCounter(CU := risingEdge.Q, CD := fallingEdge.Q, R := resetSignal, LD := FALSE, PV := 100);
    
    risingEdge(CLK := startSignal);
    fallingEdge(CLK := stopSignal);
    
    resetSetFF(S := startSignal, R1 := resetSignal);
    setResetFF(S1 := startSignal, R := resetSignal);
    
    // Custom function blocks with parameter passing
    motor1(
        start := startSignal AND onDelayTimer.Q,
        stop := stopSignal OR pulseTimer.Q,
        speed_setpoint := temperature
    );
    
    motor2(
        start := motor1.running,
        stop := NOT motor1.running,
        speed_setpoint := 50.0
    );
    
    // Structure assignment
    processInfo.setpoint := temperature;
    processInfo.actual := motor1.actual_speed;
    processInfo.error := processInfo.setpoint - processInfo.actual;
    processInfo.timestamp := timestamp;
    
    // Pointer operations
    tempPointer := ADR(temperature);
    tempReference REF= temperature;
    
    // Update global variables
    globalCounter := globalCounter + 1;
    systemStatus := isRunning AND motor1.running;
    
END_IF;

END_PROGRAM

// Enhanced Motor Function Block with comprehensive features
FUNCTION_BLOCK FB_Motor
VAR_INPUT
    start : BOOL;
    stop : BOOL;
    speed_setpoint : REAL;
    enable : BOOL := TRUE;
    reset_fault : BOOL := FALSE;
END_VAR

VAR_OUTPUT
    running : BOOL;
    actual_speed : REAL;
    fault : BOOL;
    status : MotorState;
    runtime : TIME;
END_VAR

VAR
    internal_state : INT;
    motor_on : BOOL;
    fault_timer : TON;
    runtime_timer : TON;
    start_edge : R_TRIG;
    stop_edge : R_TRIG;
    speed_ramp : REAL := 0.0;
    last_scan_time : TIME;
END_VAR

// Edge detection for start/stop signals
start_edge(CLK := start);
stop_edge(CLK := stop);

// Motor control state machine
CASE status OF
    STOPPED:
        motor_on := FALSE;
        running := FALSE;
        actual_speed := 0.0;
        speed_ramp := 0.0;
        
        IF start_edge.Q AND enable AND NOT fault THEN
            status := STARTING;
        END_IF;
        
    STARTING:
        motor_on := TRUE;
        running := TRUE;
        
        // Ramp up speed gradually
        IF speed_ramp < speed_setpoint THEN
            speed_ramp := speed_ramp + 1.0; // 1 unit per scan
        ELSE
            status := RUNNING;
        END_IF;
        
        actual_speed := speed_ramp * 0.95; // 95% efficiency
        
        IF stop_edge.Q OR NOT enable THEN
            status := STOPPING;
        END_IF;
        
    RUNNING:
        motor_on := TRUE;
        running := TRUE;
        actual_speed := speed_setpoint * 0.95; // 95% efficiency
        
        IF stop_edge.Q OR NOT enable THEN
            status := STOPPING;
        END_IF;
        
    STOPPING:
        motor_on := FALSE;
        
        // Ramp down speed gradually
        IF speed_ramp > 0.0 THEN
            speed_ramp := speed_ramp - 2.0; // Faster ramp down
            actual_speed := speed_ramp * 0.95;
        ELSE
            status := STOPPED;
            running := FALSE;
            actual_speed := 0.0;
        END_IF;
        
    FAULT:
        motor_on := FALSE;
        running := FALSE;
        actual_speed := 0.0;
        speed_ramp := 0.0;
        
        IF reset_fault THEN
            fault := FALSE;
            status := STOPPED;
        END_IF;
END_CASE;

// Fault detection with timer
fault_timer(IN := actual_speed > speed_setpoint * 1.2, PT := T#1s);
IF fault_timer.Q THEN
    fault := TRUE;
    status := FAULT;
END_IF;

// Runtime calculation
runtime_timer(IN := running, PT := T#0s);
IF running THEN
    runtime := runtime + T#100ms; // Assuming 100ms scan time
END_IF;

END_FUNCTION_BLOCK

// Utility function for temperature conversion
FUNCTION CelsiusToFahrenheit : REAL
VAR_INPUT
    celsius : REAL;
END_VAR

CelsiusToFahrenheit := celsius * 9.0 / 5.0 + 32.0;

END_FUNCTION

// Utility function for array processing
FUNCTION ArrayAverage : REAL
VAR_INPUT
    values : ARRAY[1..10] OF REAL;
    count : INT;
END_VAR

VAR
    sum : REAL := 0.0;
    i : INT;
END_VAR

FOR i := 1 TO count DO
    sum := sum + values[i];
END_FOR;

IF count > 0 THEN
    ArrayAverage := sum / INT_TO_REAL(count);
ELSE
    ArrayAverage := 0.0;
END_IF;

END_FUNCTION

// Advanced PID Controller Function Block
FUNCTION_BLOCK FB_PIDController
VAR_INPUT
    enable : BOOL := FALSE;
    setpoint : REAL;
    process_value : REAL;
    kp : REAL := 1.0;           // Proportional gain
    ki : REAL := 0.1;          // Integral gain  
    kd : REAL := 0.01;         // Derivative gain
    output_min : REAL := 0.0;   // Minimum output
    output_max : REAL := 100.0; // Maximum output
    reset : BOOL := FALSE;
END_VAR

VAR_OUTPUT
    output : REAL;
    error : REAL;
    integral_term : REAL;
    derivative_term : REAL;
    proportional_term : REAL;
END_VAR

VAR
    last_error : REAL;
    integral_sum : REAL;
    dt : TIME := T#100ms;
    first_scan : BOOL := TRUE;
    dt_real : REAL;
END_VAR

// Convert cycle time to real
dt_real := TIME_TO_REAL(dt) / 1000.0; // Convert to seconds

IF enable THEN
    // Calculate error
    error := setpoint - process_value;
    
    // Proportional term
    proportional_term := kp * error;
    
    // Integral term with windup protection
    IF NOT (output >= output_max AND error > 0.0) AND 
       NOT (output <= output_min AND error < 0.0) THEN
        integral_sum := integral_sum + error * dt_real;
    END_IF;
    integral_term := ki * integral_sum;
    
    // Derivative term (avoid derivative kick on setpoint change)
    IF NOT first_scan THEN
        derivative_term := kd * (error - last_error) / dt_real;
    ELSE
        derivative_term := 0.0;
        first_scan := FALSE;
    END_IF;
    
    // Calculate output
    output := proportional_term + integral_term + derivative_term;
    
    // Limit output
    output := LIMIT(output_min, output, output_max);
    
    // Store current error for next cycle
    last_error := error;
    
ELSE
    // Reset when disabled
    output := 0.0;
    error := 0.0;
    integral_sum := 0.0;
    integral_term := 0.0;
    derivative_term := 0.0;
    proportional_term := 0.0;
    first_scan := TRUE;
END_IF;

// Reset integral sum on reset signal
IF reset THEN
    integral_sum := 0.0;
END_IF;

END_FUNCTION_BLOCK

// Configuration example
CONFIGURATION DefaultConfig
    RESOURCE DefaultResource ON PLC
        TASK MainTask(INTERVAL := T#100ms, PRIORITY := 1);
        PROGRAM MainProgram WITH MainTask : ExampleProgram;
    END_RESOURCE
END_CONFIGURATION

GT()