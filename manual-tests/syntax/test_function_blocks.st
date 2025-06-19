(* Test file for function block completion *)
PROGRAM TestFunctionBlocks
VAR
    // Test type declaration context - should complete with just "TON"
    myTimer : TON;
    myPulse : TP;
    myCounter : CTU;
    myEdge : R_TRIG;
    
    // Test variables for function calls
    startSignal : BOOL := FALSE;
    resetSignal : BOOL := FALSE;
    result : BOOL;
END_VAR

// Test function call context - should complete with parameter templates
// Type "TON" + Ctrl+Space here and select TON() option
// Expected: TON(IN := ${1:signal}, PT := ${2:T#1s})

// Type "CTU" + Ctrl+Space here and select CTU() option  
// Expected: CTU(CU := ${1:signal}, R := ${2:reset}, PV := ${3:100})

// Type "R_TRIG" + Ctrl+Space here and select R_TRIG() option
// Expected: R_TRIG(CLK := ${1:signal})

// Example of how they should work when completed:
myTimer(IN := startSignal, PT := T#5s);
myCounter(CU := myEdge.Q, R := resetSignal, PV := 10);
myEdge(CLK := startSignal);

result := myTimer.Q;

END_PROGRAM
