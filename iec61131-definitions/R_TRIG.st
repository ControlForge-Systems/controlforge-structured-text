// IEC 61131-3 Standard Edge Detector: R_TRIG (Rising Trigger)
// This is a virtual definition file for language server navigation

FUNCTION_BLOCK R_TRIG
VAR_INPUT
    CLK : BOOL;     // Clock input - signal to detect rising edge
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Output - TRUE for one scan on rising edge
END_VAR
VAR
    M : BOOL;       // Internal memory of previous CLK state
END_VAR

// Standard behavior:
// Q is TRUE for exactly one scan cycle when CLK transitions from FALSE to TRUE
// Q is FALSE at all other times

END_FUNCTION_BLOCK
