(* Test: Unclosed string literals - should show code actions to close them *)

PROGRAM Main
VAR
    msg1 : STRING := 'Hello World;
(* Missing closing single quote - should offer quick fix *)
    
    msg2 : WSTRING := "Wide String;
(* Missing closing double quote - should offer quick fix *)
    
    msg3 : STRING := 'Test;
(* Should insert quote before semicolon *)
END_VAR
END_PROGRAM
