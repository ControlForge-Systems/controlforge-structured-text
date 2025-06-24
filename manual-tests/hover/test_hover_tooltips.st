// Test file for hover tooltips on function blocks and their members
// The purpose of this file is to verify the enhanced descriptions in hover tooltips
//
// Expected tooltip formats:
// - Variables: "variableName: TYPE"
// - Function blocks: "function block TYPE (Description)" 
// - FB instances: "instanceName: TYPE (Description)"
// - FB members: "(DIRECTION) memberName: TYPE"

PROGRAM TestHoverTooltips
VAR
    // Timer function blocks
    myTON: TON;        // Should show: "myTON: TON (On-Delay Timer)"
    myTOF: TOF;        // Should show: "myTOF: TOF (Off-Delay Timer)"
    myTP: TP;          // Should show: "myTP: TP (Pulse Timer)"
    
    // Counter function blocks
    myCounter: CTU;    // Should show: "myCounter: CTU (Up Counter)"
    myDownCounter: CTD; // Should show: "myDownCounter: CTD (Down Counter)"
    myBidirectionalCounter: CTUD; // Should show: "myBidirectionalCounter: CTUD (Up-Down Counter)"
    
    // Edge detection function blocks
    myRisingEdge: R_TRIG; // Should show: "myRisingEdge: R_TRIG (Rising Edge Detector)"
    myFallingEdge: F_TRIG; // Should show: "myFallingEdge: F_TRIG (Falling Edge Detector)"
    
    // Bistable function blocks
    myResetDominant: RS; // Should show: "myResetDominant: RS (Reset-Dominant Bistable)"
    mySetDominant: SR;   // Should show: "mySetDominant: SR (Set-Dominant Bistable)"
    
    // Helper variables
    buttonPress: BOOL;  // Should show: "buttonPress: BOOL"
    timerValue: TIME := T#5s; // Should show: "timerValue: TIME"
    countTarget: INT := 10; // Should show: "countTarget: INT"
    currentCount: INT;  // Should show: "currentCount: INT"
    startButton: BOOL;  // Should show: "startButton: BOOL"
    stopButton: BOOL;   // Should show: "stopButton: BOOL"
END_VAR

// Test function block instances and their members
// Hover over function block instances and members to see enhanced tooltips

// Timer tests
myTON(IN := buttonPress, PT := timerValue);
// myTON.IN should show: "(INPUT) IN: BOOL"
// myTON.PT should show: "(INPUT) PT: TIME"
// myTON.Q should show: "(OUTPUT) Q: BOOL"
// myTON.ET should show: "(OUTPUT) ET: TIME"

IF myTON.Q THEN
    // Q is active when elapsed time reaches preset time
    currentCount := currentCount + 1;
END_IF;

// Current elapsed time
timerValue := myTON.ET;

// Counter tests
myCounter(CU := buttonPress, R := stopButton, PV := countTarget);
// myCounter.CU should show: "(INPUT) CU: BOOL"
// myCounter.R should show: "(INPUT) R: BOOL"
// myCounter.PV should show: "(INPUT) PV: INT"
// myCounter.Q should show: "(OUTPUT) Q: BOOL"
// myCounter.CV should show: "(OUTPUT) CV: INT"

IF myCounter.Q THEN
    // Counter has reached preset value
    buttonPress := FALSE;
END_IF;

// Current count value
currentCount := myCounter.CV;

// Edge detection tests
myRisingEdge(CLK := startButton);
// myRisingEdge.CLK should show: "(INPUT) CLK: BOOL"
// myRisingEdge.Q should show: "(OUTPUT) Q: BOOL"

IF myRisingEdge.Q THEN
    // Start sequence on rising edge
    buttonPress := TRUE;
END_IF;

myFallingEdge(CLK := stopButton);
// myFallingEdge.CLK should show: "(INPUT) CLK: BOOL"
// myFallingEdge.Q should show: "(OUTPUT) Q: BOOL"

IF myFallingEdge.Q THEN
    // Stop sequence on falling edge
    buttonPress := FALSE;
END_IF;

// Bistable tests
myResetDominant(S := startButton, R1 := stopButton);
// myResetDominant.S should show: "(INPUT) S: BOOL"
// myResetDominant.R1 should show: "(INPUT) R1: BOOL"
// myResetDominant.Q1 should show: "(OUTPUT) Q1: BOOL"

buttonPress := myResetDominant.Q1;

END_PROGRAM
