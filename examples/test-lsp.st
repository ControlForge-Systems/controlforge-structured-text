PROGRAM TestProgram
VAR
    myTimer : TON;
    counter : INT;
    isActive : BOOL;
    temperature : REAL;
END_VAR

// Test variable usage
myTimer(IN := isActive, PT := T#5s);
counter := counter + 1;
temperature := 25.5;

IF myTimer.Q THEN
    isActive := FALSE;
END_IF

END_PROGRAM
