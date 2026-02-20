(* Test: Semantic diagnostics - Phase 2 checks *)
(* Open this file in VS Code to verify diagnostics appear correctly *)

(* === Missing Semicolons === *)
(* Expected: Error on line with missing semicolon *)
PROGRAM MissingSemicolonTest
VAR
    x : INT := 0;
    y : INT := 0;
END_VAR
    x := 1;
    y := x + 2  (* <-- missing semicolon, should show error *)
END_PROGRAM

(* === Duplicate Declarations === *)
(* Expected: Error on second declaration of 'counter' *)
PROGRAM DuplicateVarTest
VAR
    counter : INT;
    counter : REAL;  (* <-- duplicate, should show error *)
    status : BOOL;
END_VAR
    counter := 1;
    status := TRUE;
END_PROGRAM

(* === Undefined Variables === *)
(* Expected: Warning on undeclared identifiers *)
PROGRAM UndefinedVarTest
VAR
    x : INT;
END_VAR
    x := undeclaredVar;  (* <-- undefined, should show warning *)
END_PROGRAM

(* === Unused Variables === *)
(* Expected: Warning on unused local variables *)
PROGRAM UnusedVarTest
VAR
    used : INT;
    unused : INT;  (* <-- never referenced in body, should show warning *)
END_VAR
    used := 42;
END_PROGRAM

(* === Type Mismatches === *)
(* Expected: Error on incompatible assignment *)
PROGRAM TypeMismatchTest
VAR
    count : INT;
    flag : BOOL;
END_VAR
    count := 'hello';  (* <-- STRING to INT, should show error *)
    flag := 42;         (* <-- INT to BOOL, should show error *)
    count := 100;       (* <-- OK, INT to INT *)
    flag := TRUE;       (* <-- OK, BOOL to BOOL *)
END_PROGRAM

(* === Valid Code - No Diagnostics Expected === *)
PROGRAM CleanProgram
VAR
    i : INT;
    sum : INT := 0;
    running : BOOL := TRUE;
END_VAR
    FOR i := 1 TO 10 DO
        sum := sum + i;
    END_FOR
    IF sum > 50 THEN
        running := FALSE;
    END_IF
END_PROGRAM
