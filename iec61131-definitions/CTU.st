// IEC 61131-3 Standard Counter Function Block: CTU (Count Up)
// This is a virtual definition file for language server navigation

FUNCTION_BLOCK CTU
VAR_INPUT
    CU : BOOL;      // Count up input - count on rising edge
    R : BOOL;       // Reset input - resets CV to 0
    PV : INT;       // Preset value - count target
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Counter output - TRUE when CV >= PV
    CV : INT;       // Current value - current count
END_VAR

// Standard behavior:
// CV increments on each rising edge of CU
// Q becomes TRUE when CV >= PV
// R resets CV to 0 and Q to FALSE

END_FUNCTION_BLOCK
