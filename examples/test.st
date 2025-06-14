PROGRAM TestProgram
VAR
    counter : INT := 0;
    temperature : REAL := 25.5;
    isRunning : BOOL := TRUE;
END_VAR

// Test completion here


PROGRAM ProgramName
VAR
    variable : INT := 0;
END_VAR

TON(IN := signal, PT := T#1s)
myCounter : CTU;
myCounter(
    CU := count_trigger,
    R := reset,
    PV := 100
);
current_value := myCounter.CV;
// Program code

END_PROGRAM

myCounter : CTU;
myCounter(
    CU := count_trigger,
    R := reset,
    PV := 100
);
current_value := myCounter.CV;
REAL INT CTD 