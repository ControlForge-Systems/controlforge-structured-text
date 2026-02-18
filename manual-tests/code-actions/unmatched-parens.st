(* Test: Unmatched parentheses - should show code actions to fix them *)

PROGRAM Main
VAR
    x : INT;
    y : REAL;
END_VAR
    x := (1 + 2;
(* Missing closing paren - should offer quick fix to add ) *)
    
    y := ((3.0 * 4.0;
(* Two missing closing parens - should offer quick fix to add )) *)
    
    x := 5 + 6);
(* Extra closing paren - should offer quick fix to remove *)
END_PROGRAM
