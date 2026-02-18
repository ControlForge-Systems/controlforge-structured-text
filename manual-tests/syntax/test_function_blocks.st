(* Test file for FUNCTION_BLOCK syntax highlighting *)

(* Test 1: FUNCTION_BLOCK declaration with parameters *)
FUNCTION_BLOCK FB_Counter
VAR_INPUT
    increment : BOOL;
    reset : BOOL;
    maxValue : INT := 100;
END_VAR

VAR_OUTPUT
    count : INT;
    overflow : BOOL;
END_VAR

VAR
    internalState : INT;
END_VAR

// Body
IF reset THEN
    count := 0;
    overflow := FALSE;
ELSIF increment THEN
    IF count < maxValue THEN
        count := count + 1;
    ELSE
        overflow := TRUE;
    END_IF;
END_IF;

END_FUNCTION_BLOCK

(* Test 2: FUNCTION_BLOCK with VAR_IN_OUT *)
FUNCTION_BLOCK FB_Swap
VAR_IN_OUT
    valueA : REAL;
    valueB : REAL;
END_VAR

VAR
    temp : REAL;
END_VAR

// Swap logic
temp := valueA;
valueA := valueB;
valueB := temp;

END_FUNCTION_BLOCK

(* Test 3: Using function blocks in a PROGRAM *)
PROGRAM TestFunctionBlocks
VAR
    // Standard FB instances (should highlight TON, CTU, R_TRIG as types)
    myTimer : TON;
    myCounter : CTU;
    myEdge : R_TRIG;
    
    // Custom FB instances
    customCounter : FB_Counter;
    swapper : FB_Swap;
    
    // Test variables
    startSignal : BOOL := FALSE;
    resetSignal : BOOL := FALSE;
    result : BOOL;
    val1 : REAL := 1.5;
    val2 : REAL := 2.5;
END_VAR

// Standard FB calls with named parameters
myTimer(IN := startSignal, PT := T#5s);
myCounter(CU := myEdge.Q, R := resetSignal, PV := 10);
myEdge(CLK := startSignal);

// Custom FB calls
customCounter(increment := startSignal, reset := resetSignal, maxValue := 50);
swapper(valueA := val1, valueB := val2);

result := myTimer.Q;

END_PROGRAM
