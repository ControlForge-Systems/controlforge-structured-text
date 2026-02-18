(* Test: Missing END_* blocks - should show code actions to insert missing closing keywords *)

PROGRAM Main
VAR
    x : INT;
END_VAR
    IF x > 0 THEN
        x := 10;
(* Missing END_IF - should offer quick fix to insert it *)

FUNCTION Add : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
    Add := a + b;
(* Missing END_FUNCTION - should offer quick fix *)

FUNCTION_BLOCK FB_Motor
VAR_INPUT
    start : BOOL;
END_VAR
VAR_OUTPUT
    running : BOOL;
(* Missing END_VAR - should offer quick fix *)
(* Missing END_FUNCTION_BLOCK - should offer quick fix *)
