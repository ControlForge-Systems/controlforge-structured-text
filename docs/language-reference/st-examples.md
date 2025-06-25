# Structured Text Code Examples

This document provides practical examples of Structured Text (ST) code for various program organization units and programming patterns according to the IEC 61131-3 standard.

## Basic Program Examples

### Simple Program Example

A basic temperature control program:

```
PROGRAM TemperatureControl
VAR
    currentTemp : REAL;
    setPoint : REAL := 22.5;
    heaterOutput : BOOL;
    coolerOutput : BOOL;
    hysteresis : REAL := 0.5;
END_VAR

// Control logic
IF currentTemp < (setPoint - hysteresis) THEN
    heaterOutput := TRUE;
    coolerOutput := FALSE;
ELSIF currentTemp > (setPoint + hysteresis) THEN
    heaterOutput := FALSE;
    coolerOutput := TRUE;
ELSE
    heaterOutput := FALSE;
    coolerOutput := FALSE;
END_IF;

END_PROGRAM
```

### Sequential Control Program

A program implementing a simple state machine:

```
PROGRAM SequenceControl
VAR
    State : INT := 0;
    StartButton : BOOL;
    StopButton : BOOL;
    ResetButton : BOOL;
    EmergencyStop : BOOL;
    Motor1 : BOOL;
    Motor2 : BOOL;
    Valve1 : BOOL;
    Timer1 : TON;
    Timer2 : TON;
END_VAR

// Emergency stop handling
IF EmergencyStop THEN
    State := 100;  // Emergency state
END_IF;

// Reset handling
IF ResetButton THEN
    State := 0;    // Initial state
END_IF;

// State machine
CASE State OF
    0:  // Idle state
        Motor1 := FALSE;
        Motor2 := FALSE;
        Valve1 := FALSE;
        
        IF StartButton THEN
            State := 10;  // Start sequence
        END_IF;
        
    10: // Starting Motor1
        Motor1 := TRUE;
        Timer1(IN := TRUE, PT := T#3s);
        
        IF Timer1.Q THEN
            Timer1(IN := FALSE);
            State := 20;
        END_IF;
        
    20: // Starting Motor2
        Motor2 := TRUE;
        Timer2(IN := TRUE, PT := T#2s);
        
        IF Timer2.Q THEN
            Timer2(IN := FALSE);
            State := 30;
        END_IF;
        
    30: // Opening valve
        Valve1 := TRUE;
        
        IF StopButton THEN
            State := 40;  // Begin shutdown sequence
        END_IF;
        
    40: // Closing valve
        Valve1 := FALSE;
        Timer1(IN := TRUE, PT := T#1s);
        
        IF Timer1.Q THEN
            Timer1(IN := FALSE);
            State := 50;
        END_IF;
        
    50: // Stopping motors
        Motor1 := FALSE;
        Motor2 := FALSE;
        State := 0;  // Return to idle
        
    100: // Emergency state
        Motor1 := FALSE;
        Motor2 := FALSE;
        Valve1 := FALSE;
        
        IF NOT EmergencyStop AND ResetButton THEN
            State := 0;  // Return to idle after reset
        END_IF;
        
END_CASE;

END_PROGRAM
```

## Function Examples

### Basic Math Function

A simple function to calculate the area of a circle:

```
FUNCTION CalculateCircleArea : REAL
VAR_INPUT
    radius : REAL;
END_VAR
VAR CONSTANT
    PI : REAL := 3.14159265359;
END_VAR

CalculateCircleArea := PI * radius * radius;
END_FUNCTION
```

### PID Controller Function

A PID controller implementation:

```
FUNCTION CalculatePID : REAL
VAR_INPUT
    setPoint : REAL;
    processValue : REAL;
    kp : REAL;
    ki : REAL;
    kd : REAL;
    dt : TIME;
END_VAR
VAR
    error : REAL;
    proportional : REAL;
    integral : REAL;
    derivative : REAL;
    previousError : REAL;
END_VAR

error := setPoint - processValue;
proportional := kp * error;
integral := integral + ki * error * TIME_TO_REAL(dt);
derivative := kd * (error - previousError) / TIME_TO_REAL(dt);
previousError := error;

RETURN proportional + integral + derivative;
END_FUNCTION
```

### String Manipulation Function

A function to convert a string to uppercase:

```
FUNCTION ToUpperCase : STRING
VAR_INPUT
    inString : STRING;
END_VAR
VAR
    i : INT;
    charCode : INT;
    outString : STRING;
    currentChar : CHAR;
END_VAR

FOR i := 1 TO LEN(inString) DO
    currentChar := MID(inString, 1, i);
    charCode := TO_ASCII(currentChar);
    
    // Check if lowercase letter (ASCII 97-122)
    IF charCode >= 97 AND charCode <= 122 THEN
        // Convert to uppercase (subtract 32)
        outString := CONCAT(outString, CHR(charCode - 32));
    ELSE
        outString := CONCAT(outString, currentChar);
    END_IF;
END_FOR;

ToUpperCase := outString;
END_FUNCTION
```

## Function Block Examples

### Counter Function Block

A basic counter with reset functionality:

```
FUNCTION_BLOCK Counter
VAR_INPUT
    reset : BOOL;
    increment : BOOL;
END_VAR
VAR_OUTPUT
    value : INT;
END_VAR
VAR
    lastIncrement : BOOL;
    edge : R_TRIG;
END_VAR

// Reset logic
IF reset THEN
    value := 0;
END_IF;

// Edge detection for increment
edge(CLK := increment);
IF edge.Q THEN
    value := value + 1;
END_IF;

END_FUNCTION_BLOCK
```

### PID Controller Function Block

A complete PID controller with internal state:

```
FUNCTION_BLOCK PIDController
VAR_INPUT
    setPoint : REAL;         // Desired process value
    processValue : REAL;     // Current process value
    manualMode : BOOL;       // Manual mode flag
    manualOutput : REAL;     // Manual output value
    kp : REAL := 1.0;        // Proportional gain
    ki : REAL := 0.1;        // Integral gain
    kd : REAL := 0.0;        // Derivative gain
    outMin : REAL := 0.0;    // Output minimum
    outMax : REAL := 100.0;  // Output maximum
    reset : BOOL;            // Reset the controller
END_VAR
VAR_OUTPUT
    output : REAL;           // Controller output
    errorValue : REAL;       // Current error
END_VAR
VAR
    integral : REAL;
    lastError : REAL;
    lastTime : TIME;
    currentTime : TIME;
    deltaTime : TIME;
    sampleRate : TIME := T#100ms;
    timer : TON;
END_VAR

// Timer for consistent sample rate
timer(IN := TRUE, PT := sampleRate);

IF timer.Q THEN
    timer(IN := FALSE);
    currentTime := TIME();
    
    IF lastTime = T#0s THEN
        // First execution
        deltaTime := sampleRate;
    ELSE
        deltaTime := currentTime - lastTime;
    END_IF;
    
    lastTime := currentTime;
    
    IF reset THEN
        // Reset controller
        integral := 0.0;
        lastError := 0.0;
        output := 0.0;
    ELSIF manualMode THEN
        // Manual mode
        output := manualOutput;
        // Keep tracking error to avoid bump on auto mode transition
        errorValue := setPoint - processValue;
        lastError := errorValue;
    ELSE
        // Automatic mode
        errorValue := setPoint - processValue;
        
        // Proportional term
        VAR
            proportional : REAL;
            derivative : REAL;
            dt : REAL;
        END_VAR
        
        proportional := kp * errorValue;
        
        // Integral term (with anti-windup)
        dt := TIME_TO_REAL(deltaTime);
        integral := integral + ki * errorValue * dt;
        
        // Limit integral term
        IF integral > outMax THEN
            integral := outMax;
        ELSIF integral < outMin THEN
            integral := outMin;
        END_IF;
        
        // Derivative term
        derivative := 0.0;
        IF dt > 0.0 THEN
            derivative := kd * (errorValue - lastError) / dt;
        END_IF;
        
        // Calculate output
        output := proportional + integral + derivative;
        
        // Limit output
        IF output > outMax THEN
            output := outMax;
        ELSIF output < outMin THEN
            output := outMin;
        END_IF;
        
        lastError := errorValue;
    END_IF;
    
    timer(IN := TRUE);  // Restart timer
END_IF;

END_FUNCTION_BLOCK
```

### Data Logger Function Block

A function block for logging data with timestamps:

```
FUNCTION_BLOCK DataLogger
VAR_INPUT
    enable : BOOL;            // Enable logging
    logInterval : TIME;       // Logging interval
    value1 : REAL;            // Value to log
    value2 : REAL;            // Value to log
    value3 : REAL;            // Value to log
    clearLog : BOOL;          // Clear log flag
END_VAR
VAR_OUTPUT
    logCount : INT;           // Number of log entries
    logFull : BOOL;           // Log buffer full flag
END_VAR
VAR
    timer : TON;              // Interval timer
    logData : ARRAY[0..99] OF LogEntry;  // Log buffer
    writeIndex : INT := 0;    // Current write position
END_VAR
VAR
    TYPE LogEntry:
        STRUCT
            timestamp : DT;   // Date and time
            val1 : REAL;      // Logged value 1
            val2 : REAL;      // Logged value 2
            val3 : REAL;      // Logged value 3
        END_STRUCT
    END_TYPE
END_VAR

// Clear log if requested
IF clearLog THEN
    FOR writeIndex := 0 TO 99 DO
        logData[writeIndex].timestamp := DT#1970-01-01-00:00:00;
        logData[writeIndex].val1 := 0.0;
        logData[writeIndex].val2 := 0.0;
        logData[writeIndex].val3 := 0.0;
    END_FOR;
    writeIndex := 0;
    logCount := 0;
    logFull := FALSE;
END_IF;

// Log data at the specified interval
IF enable THEN
    timer(IN := TRUE, PT := logInterval);
    
    IF timer.Q THEN
        timer(IN := FALSE);
        
        // Store data in log buffer
        logData[writeIndex].timestamp := DT_CURRENT();
        logData[writeIndex].val1 := value1;
        logData[writeIndex].val2 := value2;
        logData[writeIndex].val3 := value3;
        
        // Increment write index
        writeIndex := writeIndex + 1;
        IF writeIndex > 99 THEN
            writeIndex := 0;
            logFull := TRUE;
        END_IF;
        
        // Update log count
        IF logCount < 100 THEN
            logCount := logCount + 1;
        END_IF;
        
        timer(IN := TRUE);  // Restart timer
    END_IF;
ELSE
    timer(IN := FALSE);     // Stop timer if disabled
END_IF;

END_FUNCTION_BLOCK
```

## Object-Oriented Examples

### Class Example

A basic motor control class:

```
CLASS Motor
    VAR
        Speed : REAL;
        MaxSpeed : REAL := 100.0;
        IsRunning : BOOL := FALSE;
    END_VAR
    
    METHOD PUBLIC Start : BOOL
        IF NOT IsRunning THEN
            IsRunning := TRUE;
            Start := TRUE;
        ELSE
            Start := FALSE;  // Already running
        END_IF
    END_METHOD
    
    METHOD PUBLIC Stop : BOOL
        IsRunning := FALSE;
        Speed := 0.0;
        Stop := TRUE;
    END_METHOD
    
    METHOD PUBLIC SetSpeed : BOOL
        VAR_INPUT
            RequestedSpeed : REAL;
        END_VAR
        
        IF RequestedSpeed <= MaxSpeed THEN
            Speed := RequestedSpeed;
            SetSpeed := TRUE;
        ELSE
            SetSpeed := FALSE;  // Speed too high
        END_IF
    END_METHOD
END_CLASS
```

### Inheritance Example

A class hierarchy with inheritance:

```
CLASS Device
    VAR
        Name : STRING;
        IsActive : BOOL := FALSE;
    END_VAR
    
    METHOD PUBLIC VIRTUAL Activate : BOOL
        IsActive := TRUE;
        Activate := TRUE;
    END_METHOD
    
    METHOD PUBLIC VIRTUAL Deactivate : BOOL
        IsActive := FALSE;
        Deactivate := TRUE;
    END_METHOD
END_CLASS

CLASS Pump EXTENDS Device
    VAR
        FlowRate : REAL;
    END_VAR
    
    METHOD PUBLIC OVERRIDE Activate : BOOL
        // Pump-specific activation logic
        FlowRate := 10.0;
        SUPER.Activate();  // Call base implementation
        Activate := TRUE;
    END_METHOD
END_CLASS

CLASS Valve EXTENDS Device
    VAR
        OpenPercentage : REAL;
    END_VAR
    
    METHOD PUBLIC OVERRIDE Activate : BOOL
        // Valve-specific activation logic
        OpenPercentage := 100.0;
        SUPER.Activate();  // Call base implementation
        Activate := TRUE;
    END_METHOD
END_CLASS
```

### Interface Implementation Example

Implementing interfaces:

```
INTERFACE IController
    METHOD Configure : BOOL
        VAR_INPUT
            P : REAL;
            I : REAL;
            D : REAL;
        END_VAR
    END_METHOD
    
    METHOD Compute : REAL
        VAR_INPUT
            SetPoint : REAL;
            ProcessValue : REAL;
        END_VAR
    END_METHOD
END_INTERFACE

CLASS PIDController IMPLEMENTS IController
    VAR
        Kp : REAL := 1.0;
        Ki : REAL := 0.0;
        Kd : REAL := 0.0;
        LastError : REAL := 0.0;
        Integral : REAL := 0.0;
    END_VAR
    
    METHOD PUBLIC Configure : BOOL
        VAR_INPUT
            P : REAL;
            I : REAL;
            D : REAL;
        END_VAR
        
        Kp := P;
        Ki := I;
        Kd := D;
        Configure := TRUE;
    END_METHOD
    
    METHOD PUBLIC Compute : REAL
        VAR_INPUT
            SetPoint : REAL;
            ProcessValue : REAL;
        END_VAR
        VAR
            Error : REAL;
            Derivative : REAL;
            Output : REAL;
        END_VAR
        
        Error := SetPoint - ProcessValue;
        Integral := Integral + Error;
        Derivative := Error - LastError;
        
        Output := Kp * Error + Ki * Integral + Kd * Derivative;
        LastError := Error;
        
        Compute := Output;
    END_METHOD
END_CLASS
```

### Program Using OOP Example

A program using object-oriented features:

```
PROGRAM MotorControl
VAR
    motorA : Motor;
    motorB : Motor;
    speedControl : REAL;
    startButton : BOOL;
    stopButton : BOOL;
END_VAR

// Initialize motors
IF motorA = NULL THEN
    motorA := NEW Motor();
END_IF;

IF motorB = NULL THEN
    motorB := NEW Motor();
END_IF;

// Process start/stop commands
IF startButton THEN
    motorA.Start();
    motorB.Start();
END_IF;

IF stopButton THEN
    motorA.Stop();
    motorB.Stop();
END_IF;

// Set speed for both motors
motorA.SetSpeed(speedControl);
motorB.SetSpeed(speedControl * 0.8);  // Motor B runs at 80% of speed control

END_PROGRAM
```

## Advanced Examples

### Working with Arrays

Processing array data:

```
FUNCTION_BLOCK ArrayProcessor
VAR_INPUT
    inputArray : ARRAY[0..9] OF REAL;
END_VAR
VAR_OUTPUT
    minimum : REAL;
    maximum : REAL;
    average : REAL;
    sorted : ARRAY[0..9] OF REAL;
END_VAR
VAR
    i, j : INT;
    sum : REAL;
    temp : REAL;
END_VAR

// Initialize
minimum := inputArray[0];
maximum := inputArray[0];
sum := 0.0;

// Copy input to sorted array
FOR i := 0 TO 9 DO
    sorted[i] := inputArray[i];
END_FOR;

// Find min, max, and calculate sum
FOR i := 0 TO 9 DO
    // Update minimum
    IF inputArray[i] < minimum THEN
        minimum := inputArray[i];
    END_IF;
    
    // Update maximum
    IF inputArray[i] > maximum THEN
        maximum := inputArray[i];
    END_IF;
    
    // Add to sum
    sum := sum + inputArray[i];
END_FOR;

// Calculate average
average := sum / 10.0;

// Sort array (bubble sort)
FOR i := 0 TO 8 DO
    FOR j := 0 TO 8 - i DO
        IF sorted[j] > sorted[j + 1] THEN
            temp := sorted[j];
            sorted[j] := sorted[j + 1];
            sorted[j + 1] := temp;
        END_IF;
    END_FOR;
END_FOR;

END_FUNCTION_BLOCK
```

### State Machine with Enum

Using enumeration for state machine:

```
PROGRAM StateMachine
VAR
    TYPE States:
        (Idle, Starting, Running, Stopping, Error);
    END_TYPE
    
    currentState : States := States.Idle;
    startButton : BOOL;
    stopButton : BOOL;
    errorFlag : BOOL;
    resetButton : BOOL;
    motorOutput : BOOL;
    timer : TON;
END_VAR

CASE currentState OF
    States.Idle:
        motorOutput := FALSE;
        
        IF startButton THEN
            currentState := States.Starting;
        END_IF;
    
    States.Starting:
        // Starting sequence with timer
        timer(IN := TRUE, PT := T#5s);
        motorOutput := TRUE;
        
        IF timer.Q THEN
            timer(IN := FALSE);
            currentState := States.Running;
        END_IF;
        
        IF errorFlag THEN
            currentState := States.Error;
            timer(IN := FALSE);
        END_IF;
    
    States.Running:
        motorOutput := TRUE;
        
        IF stopButton THEN
            currentState := States.Stopping;
        END_IF;
        
        IF errorFlag THEN
            currentState := States.Error;
        END_IF;
    
    States.Stopping:
        // Stopping sequence with timer
        timer(IN := TRUE, PT := T#3s);
        motorOutput := TRUE;
        
        IF timer.Q THEN
            timer(IN := FALSE);
            motorOutput := FALSE;
            currentState := States.Idle;
        END_IF;
        
        IF errorFlag THEN
            currentState := States.Error;
            timer(IN := FALSE);
        END_IF;
    
    States.Error:
        motorOutput := FALSE;
        
        IF resetButton AND NOT errorFlag THEN
            currentState := States.Idle;
        END_IF;
    
END_CASE;

END_PROGRAM
```

### Structured Error Handling

A function block with structured error handling:

```
FUNCTION_BLOCK FileReader
VAR_INPUT
    fileName : STRING;
    readRequest : BOOL;
END_VAR
VAR_OUTPUT
    data : STRING;
    status : INT;  // 0=OK, 1=FileNotFound, 2=AccessDenied, 3=IOError
    errorMessage : STRING;
END_VAR
VAR
    fileHandle : DINT;
    errorCode : DINT;
END_VAR

// Process read request
IF readRequest THEN
    // Initialize
    status := 0;
    errorMessage := '';
    data := '';
    
    // Open file
    fileHandle := FileOpen(fileName, 'r');
    
    // Check for errors
    IF fileHandle = -1 THEN
        errorCode := GetLastError();
        
        CASE errorCode OF
            2:  // File not found
                status := 1;
                errorMessage := CONCAT('File not found: ', fileName);
                
            5:  // Access denied
                status := 2;
                errorMessage := CONCAT('Access denied: ', fileName);
                
            ELSE
                status := 3;
                errorMessage := CONCAT('IO error (', TO_STRING(errorCode), '): ', fileName);
        END_CASE;
        
        RETURN;
    END_IF;
    
    // Read data
    data := FileReadString(fileHandle);
    
    // Close file
    FileClose(fileHandle);
END_IF;

END_FUNCTION_BLOCK
```

These examples demonstrate various aspects of Structured Text programming and should serve as reference implementations for common programming patterns.
