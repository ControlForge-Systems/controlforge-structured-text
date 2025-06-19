PROGRAM TestInstanceCompletion
VAR
    // Timer instances - should show Q and ET when typing instanceName.
    pulseTimer : TP;
    onDelayTimer : TON;
    offDelayTimer : TOF;
    
    // Counter instances - CTU/CTD show Q and CV, CTUD shows QU, QD, CV
    upCounter : CTU;
    downCounter : CTD;
    upDownCounter : CTUD;
    
    // Edge trigger instances - should show Q when typing instanceName.
    risingEdge : R_TRIG;
    fallingEdge : F_TRIG;
    
    // Bistable instances - should show Q1 when typing instanceName.
    setReset : RS;
    resetSet : SR;
    
    // Test variables
    triggerSignal : BOOL := FALSE;
    counterValue : INT;
    timerOutput : BOOL;
END_VAR

// Manual test instructions:
// 1. Type "pulseTimer." and press Ctrl+Space - should show Q and ET
// 2. Type "upCounter." and press Ctrl+Space - should show Q and CV  
// 3. Type "upDownCounter." and press Ctrl+Space - should show QU, QD, CV
// 4. Type "risingEdge." and press Ctrl+Space - should show Q
// 5. Type "setReset." and press Ctrl+Space - should show Q1

// Example usage:
// pulseTimer(IN := triggerSignal, PT := T#2s);
// timerOutput := pulseTimer.Q;
// upCounter(CU := triggerSignal, R := FALSE, PV := 100);
// counterValue := upCounter.CV;

END_PROGRAM
    inputSignal : BOOL;
    resetSignal : BOOL;
    result : BOOL;
END_VAR

// Test function block instance member completion here:
// Type: pulseTimer. and press Ctrl+Space - should show Q, ET
// Type: upCounter. and press Ctrl+Space - should show Q, CV
// Type: upDownCounter. and press Ctrl+Space - should show QU, QD, CV
// Type: risingEdge. and press Ctrl+Space - should show Q

// Example usage:
result := pulseTimer.Q;
IF upCounter.CV >= 10 THEN
    resetSignal := TRUE;
END_IF;

VAR
    myCounter : INT := 0;
    isActive : BOOL := TRUE;
END_VAR

END_PROGRAM
