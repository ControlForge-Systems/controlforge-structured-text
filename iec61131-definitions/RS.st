// IEC 61131-3 Standard Bistable Function Block: RS (Reset-Set)
// This is a virtual definition file for language server navigation

FUNCTION_BLOCK RS
VAR_INPUT
    S : BOOL;       // Set input - sets Q1 to TRUE
    R1 : BOOL;      // Reset input - resets Q1 to FALSE (dominant)
END_VAR
VAR_OUTPUT
    Q1 : BOOL;      // Output - bistable state
END_VAR

// Standard behavior:
// Q1 becomes TRUE when S is TRUE and R1 is FALSE
// Q1 becomes FALSE when R1 is TRUE (reset dominant)
// When both S and R1 are TRUE, R1 takes precedence (Q1 = FALSE)
// Q1 maintains its state when both S and R1 are FALSE

END_FUNCTION_BLOCK
