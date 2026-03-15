PROGRAM TestInstanceCompletion
VAR
    // Timer instances - should show IN, PT, Q, ET when typing instanceName.
    pulseTimer : TP;
    onDelayTimer : TON;
    offDelayTimer : TOF;
    
    // Counter instances - CTU/CTD show Q and CV, CTUD shows QU, QD, CV
    upCounter : CTU;
    downCounter : CTD;
    upDownCounter : CTUD;
    
    // Edge trigger instances - should show CLK, Q when typing instanceName.
    risingEdge : R_TRIG;
    fallingEdge : F_TRIG;
    
    // Bistable instances - should show S/R1/Q1 or S1/R/Q1
    setReset : RS;
    resetSet : SR;
    
    // Test variables
    triggerSignal : BOOL := FALSE;
    resetSignal : BOOL := FALSE;
    counterValue : INT;
    timerOutput : BOOL;
END_VAR

// Manual test instructions:
// 1. Type "pulseTimer." + Ctrl+Space → should show IN, PT, Q, ET
// 2. Type "upCounter." + Ctrl+Space → should show CU, R, PV, Q, CV
// 3. Type "upDownCounter." + Ctrl+Space → should show CU, CD, R, LD, PV, QU, QD, CV
// 4. Type "risingEdge." + Ctrl+Space → should show CLK, Q
// 5. Type "setReset." + Ctrl+Space → should show S, R1, Q1

// Example usage:
pulseTimer(IN := triggerSignal, PT := T#2s);
timerOutput := pulseTimer.Q;

upCounter(CU := triggerSignal, R := resetSignal, PV := 100);
counterValue := upCounter.CV;

IF upCounter.CV >= 10 THEN
    resetSignal := TRUE;
END_IF

END_PROGRAM
