// IEC 61131-3 Standard Edge Detector: F_TRIG (Falling Trigger)
// This is a virtual definition file for language server navigation

FUNCTION_BLOCK F_TRIG
VAR_INPUT
    CLK : BOOL;     // Clock input - signal to detect falling edge
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Output - TRUE for one scan on falling edge
END_VAR
VAR
    M : BOOL;       // Internal memory of previous CLK state
END_VAR

// Standard behavior:
// Q is TRUE for exactly one scan cycle when CLK transitions from TRUE to FALSE
// Q is FALSE at all other times

END_FUNCTION_BLOCK
