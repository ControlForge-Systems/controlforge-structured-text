FUNCTION_BLOCK FB_TestMotor
VAR_INPUT
    enable : BOOL;
    speed : REAL;
END_VAR
VAR_OUTPUT
    running : BOOL;
    actual_speed : REAL;
END_VAR
END_FUNCTION_BLOCK

PROGRAM TestCompletion
VAR
    motor : FB_TestMotor;
    counter : INT := 0;
    temperature : REAL := 25.5;
END_VAR
// Press Ctrl+Space here to test completion
// You should see:
// - Keywords: IF, WHILE, FOR, etc.
// - Data types: BOOL, INT, REAL, etc.
// - Function blocks: TON, CTU, FB_TestMotor, etc.
// - Variables: motor, counter, temperature

END_PROGRAM