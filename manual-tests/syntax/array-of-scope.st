(* Manual QA: OF keyword scoping in ARRAY vs CASE (#95)
   OPEN: this file in VS Code with the extension active.
   USE:  Ctrl+Shift+P -> "Developer: Inspect Editor Tokens and Scopes"

   EXPECT:
     - OF after ] in ARRAY declaration → keyword.other.array-of.st
     - OF in CASE...OF               → keyword.control.st
*)

PROGRAM ArrayOfTest
VAR
    row    : ARRAY[1..10] OF INT;       (* EXPECT: OF → keyword.other.array-of.st *)
    grid   : ARRAY[0..3, 0..3] OF REAL; (* EXPECT: OF → keyword.other.array-of.st *)
    flags  : ARRAY[
        1..100
    ] OF BOOL;                          (* EXPECT: OF → keyword.other.array-of.st *)
    x      : INT := 5;
END_VAR

CASE x OF                               (* EXPECT: OF → keyword.control.st *)
    1: x := 10;
    2: x := 20;
ELSE
    x := 0;
END_CASE

END_PROGRAM
