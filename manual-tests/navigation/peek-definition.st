// Peek Definition (Alt+F12) — Manual QA Fixture
//
// HOW TO TEST
//   Open this file in VS Code with the extension active.
//   Press Alt+F12 on the indicated tokens to open the inline peek window.
//   Press Escape to close the peek window.
//   Press F12 to jump to the full definition instead.
//
// EXPECTED: peek window opens inline showing the definition source.
// EXPECTED: Escape closes the window without navigating.
// EXPECTED: F12 jumps to the definition file and closes the peek.

// ─── Custom symbols (cross-file peek) ────────────────────────────────────────

// Test 1: User-defined function block — peek shows FB_Counter body
FUNCTION_BLOCK FB_Counter
VAR_INPUT
    Enable : BOOL;
    Reset  : BOOL;
END_VAR
VAR_OUTPUT
    Count : INT;
    Done  : BOOL;
END_VAR
    IF Reset THEN
        Count := 0;
        Done  := FALSE;
    ELSIF Enable THEN
        Count := Count + 1;
        Done  := Count >= 10;
    END_IF;
END_FUNCTION_BLOCK

PROGRAM PeekTest
VAR
    // Alt+F12 on "FB_Counter" below — EXPECT: peek shows FUNCTION_BLOCK FB_Counter above (line 17)
    myCounter : FB_Counter;

    // Alt+F12 on "TON" below — EXPECT: peek opens iec61131-definitions/TON.st
    onDelay : TON;

    // Alt+F12 on "CTU" below — EXPECT: peek opens iec61131-definitions/CTU.st
    partCounter : CTU;

    // Alt+F12 on "R_TRIG" below — EXPECT: peek opens iec61131-definitions/R_TRIG.st
    risingEdge : R_TRIG;

    // Alt+F12 on "TOF" below — EXPECT: peek opens iec61131-definitions/TOF.st
    offDelay : TOF;

    // Alt+F12 on "TP" below — EXPECT: peek opens iec61131-definitions/TP.st
    pulse : TP;

    // Alt+F12 on "CTD" below — EXPECT: peek opens iec61131-definitions/CTD.st
    downCounter : CTD;

    // Alt+F12 on "CTUD" below — EXPECT: peek opens iec61131-definitions/CTUD.st
    biCounter : CTUD;

    // Alt+F12 on "F_TRIG" below — EXPECT: peek opens iec61131-definitions/F_TRIG.st
    fallingEdge : F_TRIG;

    // Alt+F12 on "RS" below — EXPECT: peek opens iec61131-definitions/RS.st
    resetDom : RS;

    // Alt+F12 on "SR" below — EXPECT: peek opens iec61131-definitions/SR.st
    setDom : SR;

    // Local variable — Alt+F12 on "Enable" below — EXPECT: peek shows VAR_INPUT Enable above (line 19)
    localEnable : BOOL;
END_VAR

// ─── Member access peek ────────────────────────────────────────────────────

onDelay(IN := localEnable, PT := T#3s);

// Alt+F12 on "onDelay" in "onDelay.Q" — EXPECT: peek shows instance declaration above
// Alt+F12 on "Q" in "onDelay.Q" — EXPECT: peek shows Q member in iec61131-definitions/TON.st
IF onDelay.Q THEN
    myCounter(Enable := TRUE, Reset := FALSE);
END_IF;

// Alt+F12 on "Count" in "myCounter.Count" — EXPECT: peek shows Count output in FB_Counter (line 25)
IF myCounter.Count >= 5 THEN
    localEnable := FALSE;
END_IF;

// ─── Multiple definitions (tabs in peek) ──────────────────────────────────

// Alt+F12 on "myCounter" — EXPECT: single peek location (the VAR declaration above)

END_PROGRAM
