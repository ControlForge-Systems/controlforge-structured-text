PROGRAM TestProgram
VAR
    myTimer : TON;
    counter : INT;
    isActive : BOOL;
    temperature : REAL;
END_VAR

// --- MANUAL TEST INSTRUCTIONS ---
//
// 1. MEMBER ACCESS (dot completion)
//    - Place cursor after "myTimer." on line below and press Ctrl+Space
//    - Expected: IN, PT, Q, ET
myTimer(IN := isActive, PT := T#5s);

// 2. FB CALL PARAMETERS (trigger on open paren)
//    - Delete the contents of the call above, type "myTimer(" and pause
//    - Expected: IN :=, PT := auto-suggested
//    - Type a param e.g. "IN := isActive, " then press Ctrl+Space again
//    - Expected: PT := still suggested

// 3. VARIABLE COMPLETION
//    - On a blank line in the body, type "co" and press Ctrl+Space
//    - Expected: counter appears in list

// 4. KEYWORD COMPLETION
//    - On a blank line, type "IF" and press Ctrl+Space
//    - Expected: IF keyword in list

// 5. DATA TYPE COMPLETION
//    - On a blank line in VAR, type "IN" and press Ctrl+Space
//    - Expected: INT, LINT, DINT, USINT, UINT, UDINT, ULINT visible
counter := counter + 1;
temperature := 25.5;

IF myTimer.Q THEN
    isActive := FALSE;
END_IF

END_PROGRAM
