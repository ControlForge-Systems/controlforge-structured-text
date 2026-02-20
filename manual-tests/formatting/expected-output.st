(* Manual test: Code Formatting - Expected output *)
(* This file shows what unformatted-input.st should look like after formatting *)

// Test 1: Keyword casing (should become uppercase)
PROGRAM main
    VAR
        counter      : INT := 0;
        temperature  : REAL := 25.5;
        isRunning    : BOOL := TRUE;
        longVariableName : DINT := 100;
    END_VAR

    // Test 2: Indentation and operator spacing
    IF counter > 100 THEN
        counter := 0;
        temperature := temperature * 1.1;
    ELSIF counter > 50 THEN
        temperature := temperature * 0.99;
    ELSE
        temperature := temperature + 0.1;
    END_IF

    // Test 3: Nested blocks
    FOR i := 1 TO 10 BY 1 DO
        IF temperature > 50.0 THEN
            counter := counter + 1;
        END_IF
    END_FOR

    // Test 4: WHILE loop
    WHILE counter < 100 AND temperature < 80.0 DO
        counter := counter + 1;
    END_WHILE

    // Test 5: REPEAT..UNTIL
    REPEAT
        temperature := temperature - 0.1;
    UNTIL temperature <= 25.0
    END_REPEAT

    // Test 6: CASE statement
    CASE motorState OF
        STOPPED:
            message := 'Motor stopped';
        RUNNING:
            message := 'Motor running';
    ELSE
        message := 'Unknown state';
    END_CASE

    // Test 7: Comments should not be modified
    // this comment has if then else keywords
    (* block comment with var end_var inside *)

    // Test 8: Strings should not be modified
    message := 'Hello World';
    wideMsg := "Unicode Text";

END_PROGRAM

// Test 9: Function block with multiple VAR sections
FUNCTION_BLOCK fb_test
    VAR_INPUT
        start          : BOOL;
        speed_setpoint : REAL;
        enable         : BOOL := TRUE;
    END_VAR
    VAR_OUTPUT
        running      : BOOL;
        actual_speed : REAL;
    END_VAR
    VAR
        internal_state : INT;
        motor_on       : BOOL;
    END_VAR
    running := start AND enable;
END_FUNCTION_BLOCK

// Test 10: Function with return type
FUNCTION celsius_to_fahrenheit : REAL
    VAR_INPUT
        celsius : REAL;
    END_VAR
    celsius_to_fahrenheit := celsius * 9.0 / 5.0 + 32.0;
END_FUNCTION
