(* Manual test: Find All References
   Right-click a symbol > "Find All References" (or Shift+F12).
   Verify all expected locations are listed in the References panel. *)

(* === Test 1: Variable with multiple references === *)
(* Find references on "counter" — expect declaration + 4 usages *)
PROGRAM FindRefsVarTest
VAR
    counter : INT := 0;
    max : INT := 100;
    done : BOOL;
END_VAR
    counter := counter + 1;
    IF counter >= max THEN
        done := TRUE;
        counter := 0;
    END_IF
END_PROGRAM

(* === Test 2: FB instance references including member access === *)
(* Find references on "myTimer" — expect declaration + all usages *)
PROGRAM FindRefsFBTest
VAR
    myTimer : TON;
    elapsed : BOOL;
END_VAR
    myTimer(IN := TRUE, PT := T#3s);
    elapsed := myTimer.Q;
END_PROGRAM

(* === Test 3: Variable with single reference === *)
(* Find references on "unused" — expect declaration only *)
PROGRAM FindRefsSingleTest
VAR
    unused : INT;
    used : INT;
END_VAR
    used := 42;
END_PROGRAM

(* === Test 4: Parameter in function block === *)
(* Find references on "enable" — expect declaration + body usage *)
FUNCTION_BLOCK FB_FindRefsTest
VAR_INPUT
    enable : BOOL;
    speed : REAL;
END_VAR
VAR_OUTPUT
    running : BOOL;
END_VAR
    running := enable AND (speed > 0.0);
END_FUNCTION_BLOCK
