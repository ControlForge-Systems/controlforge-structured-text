// IEC 61131-3 Standard Bistable Function Block: SR (Set-Reset)
// This is a virtual definition file for language server navigation

FUNCTION_BLOCK SR
VAR_INPUT
    S1 : BOOL;      // Set input - sets Q1 to TRUE (dominant)
    R : BOOL;       // Reset input - resets Q1 to FALSE
END_VAR
VAR_OUTPUT
    Q1 : BOOL;      // Output - bistable state
END_VAR

// Standard behavior:
// Q1 becomes TRUE when S1 is TRUE (set dominant)
// Q1 becomes FALSE when R is TRUE and S1 is FALSE
// When both S1 and R are TRUE, S1 takes precedence (Q1 = TRUE)
// Q1 maintains its state when both S1 and R are FALSE

END_FUNCTION_BLOCK
