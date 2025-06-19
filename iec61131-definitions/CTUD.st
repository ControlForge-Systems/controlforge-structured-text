// IEC 61131-3 Standard Counter Function Block: CTUD (Count Up/Down)
// This is a virtual definition file for language server navigation

FUNCTION_BLOCK CTUD
VAR_INPUT
    CU : BOOL;      // Count up input - increment on rising edge
    CD : BOOL;      // Count down input - decrement on rising edge
    R : BOOL;       // Reset input - resets CV to 0
    LD : BOOL;      // Load input - loads PV into CV
    PV : INT;       // Preset value - load value and up count target
END_VAR
VAR_OUTPUT
    QU : BOOL;      // Count up output - TRUE when CV >= PV
    QD : BOOL;      // Count down output - TRUE when CV <= 0
    CV : INT;       // Current value - current count
END_VAR

// Standard behavior:
// CV increments on each rising edge of CU
// CV decrements on each rising edge of CD
// QU becomes TRUE when CV >= PV
// QD becomes TRUE when CV <= 0
// R resets CV to 0
// LD loads PV into CV when TRUE

END_FUNCTION_BLOCK
