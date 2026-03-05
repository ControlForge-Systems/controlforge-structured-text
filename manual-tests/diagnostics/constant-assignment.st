(* Manual QA: constant assignment detection (#60) *)
(* Open this file in VS Code. Verify red squiggles appear ONLY on the lines   *)
(* marked "EXPECT ERROR" and that no errors appear on lines marked "OK".       *)

(* === VAR_GLOBAL CONSTANT === *)
VAR_GLOBAL CONSTANT
    MAX_TEMP : REAL := 100.0;   (* constant — never writable *)
    VERSION  : STRING := 'v1.0';
END_VAR

VAR_GLOBAL
    currentTemp : REAL := 20.0; (* NOT constant — writable *)
END_VAR

(* === PROGRAM body === *)
(* Open this file, then look at the Problems panel (Ctrl+Shift+M).             *)
PROGRAM ConstantTest
VAR CONSTANT
    PI : REAL := 3.14159;       (* local constant *)
END_VAR
VAR
    result : REAL;
    flag   : BOOL;
END_VAR

    (* EXPECT ERROR: Cannot assign to constant 'MAX_TEMP' *)
    MAX_TEMP := 200.0;

    (* EXPECT ERROR: Cannot assign to constant 'PI' *)
    PI := 3.0;

    (* EXPECT ERROR: Cannot assign to constant 'VERSION' *)
    VERSION := 'v2.0';

    (* OK: regular variable assignment — no error *)
    currentTemp := 50.0;
    result := PI * 2.0;         (* reading PI is fine *)
    flag := currentTemp > MAX_TEMP; (* reading constants is fine *)

    (* OK: named FB parameter that happens to use := inside parens — no error *)
    (* (no FB instance here, but illustrates the paren-depth guard)            *)

END_PROGRAM

(* === Verify no false positives for plain VAR_GLOBAL === *)
PROGRAM NoFalsePositives
VAR
    x : REAL;
END_VAR
    (* OK: currentTemp is NOT constant *)
    currentTemp := 99.0;
    x := currentTemp;
END_PROGRAM
