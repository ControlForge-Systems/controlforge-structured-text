(* Manual test: named parameter highlighting in FB/function calls
   Open this file in VS Code with the extension active.
   Use "Developer: Inspect Editor Tokens and Scopes" (Ctrl+Shift+P) to
   verify scope names on each token. *)

PROGRAM TestNamedParams
VAR
    MyTimer   : TON;
    MyCounter : CTU;
    StartSig  : BOOL;
    StopSig   : BOOL;
    CountOut  : INT;
    Result    : BOOL;
    Val1      : INT;
    Val2      : INT;
    i         : INT;
END_VAR

(* --- EXPECTED: named params scoped as variable.parameter.st --- *)

(* FB call with named input params: IN and PT should be variable.parameter.st *)
MyTimer(IN := StartSig, PT := T#5s);

(* FB call with named output param: Q should be variable.parameter.st, ET also *)
MyTimer(IN := StartSig, PT := T#5s, Q => Result, ET => CountOut);

(* Counter FB: CU, RESET, PV are variable.parameter.st; CV => is output *)
MyCounter(CU := StartSig, RESET := StopSig, PV := 10, CV => CountOut);

(* FB call with multiple named input params: CU, RESET, PV are variable.parameter.st *)
MyCounter(CU := Val1, RESET := StopSig, PV := Val2);

(* Multi-line call: each param name on its own line should still be variable.parameter.st *)
MyTimer(
    IN := StartSig,
    PT := T#10s
);


(* --- EXPECTED: regular assignments NOT scoped as variable.parameter.st --- *)

(* Plain assignment: i should be a plain identifier, NOT variable.parameter.st *)
i := 5;
Result := TRUE;
Val1 := Val2 + 1;

(* Variable declaration assignment: also NOT variable.parameter.st *)
(* (already shown in VAR block above) *)

END_PROGRAM
