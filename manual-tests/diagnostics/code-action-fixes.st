(* Test: Code actions for semantic diagnostics *)
(* Open this file, then use Ctrl+. on squiggles to verify quick fixes *)

(* === Insert Semicolon === *)
(* Expected: Quick fix to insert ';' *)
PROGRAM SemicolonFixTest
VAR
    x : INT;
END_VAR
    x := 1  (* <-- hover, Ctrl+. should offer "Insert semicolon" *)
END_PROGRAM

(* === Remove Duplicate Declaration === *)
(* Expected: Quick fix to remove the duplicate line *)
PROGRAM DuplicateFixTest
VAR
    value : INT;
    value : REAL;  (* <-- Ctrl+. should offer "Remove duplicate declaration" *)
END_VAR
    value := 0;
END_PROGRAM

(* === Remove Unused Variable === *)
(* Expected: Quick fix to remove the unused variable line *)
PROGRAM UnusedFixTest
VAR
    active : BOOL;
    unused : INT;  (* <-- Ctrl+. should offer "Remove unused variable" *)
END_VAR
    active := TRUE;
END_PROGRAM
