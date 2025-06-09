(* Sample Structured Text Program *)
PROGRAM ExampleProgram
VAR
    counter : INT := 0;
    temperature : REAL := 25.5;
    isRunning : BOOL := TRUE;
    message : STRING := 'Hello PLC World';
    timer : TIME := T#10s;
END_VAR

// Main program logic
IF isRunning THEN
    counter := counter + 1;
    
    IF counter > 100 THEN
        counter := 0;
        temperature := temperature * 1.1;
    END_IF;
    
    CASE counter OF
        0..10: 
            message := 'Starting phase';
        11..50:
            message := 'Running phase';
        51..100:
            message := 'Finishing phase';
    END_CASE;
    
    FOR i := 1 TO 10 BY 2 DO
        // Process loop
        IF temperature > 50.0 THEN
            EXIT;
        END_IF;
    END_FOR;
    
    WHILE temperature < 100.0 DO
        temperature := temperature + 0.5;
    END_WHILE;
    
END_IF;

END_PROGRAM

(* Function Block Example *)
FUNCTION_BLOCK FB_Motor
VAR_INPUT
    start : BOOL;
    stop : BOOL;
    speed_setpoint : REAL;
END_VAR

VAR_OUTPUT
    running : BOOL;
    actual_speed : REAL;
    fault : BOOL;
END_VAR

VAR
    internal_state : INT;
    motor_on : BOOL;
END_VAR

// Motor control logic
IF start AND NOT stop THEN
    motor_on := TRUE;
    running := TRUE;
    actual_speed := speed_setpoint * 0.95; // 95% efficiency
ELSIF stop THEN
    motor_on := FALSE;
    running := FALSE;
    actual_speed := 0.0;
END_IF;

// Fault detection
IF actual_speed > speed_setpoint * 1.2 THEN
    fault := TRUE;
    motor_on := FALSE;
END_IF;

END_FUNCTION_BLOCK
