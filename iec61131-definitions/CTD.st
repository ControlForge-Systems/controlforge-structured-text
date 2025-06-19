// IEC 61131-3 Standard Counter Function Block: CTD (Count Down)
// This is a virtual definition file for language server navigation

FUNCTION_BLOCK CTD
VAR_INPUT
    CD : BOOL;      // Count down input - count on rising edge
    LD : BOOL;      // Load input - loads PV into CV
    PV : INT;       // Preset value - initial count value
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Counter output - TRUE when CV <= 0
    CV : INT;       // Current value - current count
END_VAR

// Standard behavior:
// CV decrements on each rising edge of CD
// Q becomes TRUE when CV <= 0
// LD loads PV into CV when TRUE

END_FUNCTION_BLOCK
