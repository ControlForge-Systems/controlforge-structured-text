(* Manual QA: array bounds checking for constant indices (#61) *)
(* Open this file in VS Code. Verify red squiggles appear ONLY on lines marked  *)
(* "EXPECT ERROR" and that no errors appear on lines marked "OK".               *)
(* Check the Problems panel (Ctrl+Shift+M) for full messages.                   *)

PROGRAM ArrayBoundsTest
VAR
    temps    : ARRAY[1..10] OF REAL;     (* bounds: 1 to 10 *)
    buf      : ARRAY[0..7]  OF BYTE;     (* bounds: 0 to 7  *)
    offsets  : ARRAY[-5..5] OF INT;      (* bounds: -5 to 5 *)
    matrix   : ARRAY[1..4, 1..4] OF REAL; (* 2-D: rows 1-4, cols 1-4 *)
    i        : INT;
    x        : REAL;
END_VAR

    (* --- single-dimension, 1-based --- *)

    (* OK: boundary values *)
    temps[1]  := 20.0;
    temps[10] := 99.9;
    temps[5]  := 50.0;

    (* EXPECT ERROR: index 0 below lower bound 1
       Message: Array index 0 is out of bounds [1..10] for 'temps' *)
    temps[0] := 10.0;

    (* EXPECT ERROR: index 11 above upper bound 10
       Message: Array index 11 is out of bounds [1..10] for 'temps' *)
    temps[11] := 10.0;

    (* EXPECT ERROR: index 15 far above upper bound
       Message: Array index 15 is out of bounds [1..10] for 'temps' *)
    temps[15] := 25.0;

    (* OK: variable index — not checked *)
    temps[i] := 0.0;

    (* --- zero-based array --- *)

    (* OK: valid range *)
    buf[0] := 0;
    buf[7] := 255;

    (* EXPECT ERROR: index 8 above upper bound 7
       Message: Array index 8 is out of bounds [0..7] for 'buf' *)
    buf[8] := 128;

    (* --- negative lower bound --- *)

    (* OK: valid range *)
    offsets[-5] := -1;
    offsets[0]  :=  0;
    offsets[5]  :=  1;

    (* EXPECT ERROR: index -6 below lower bound -5
       Message: Array index -6 is out of bounds [-5..5] for 'offsets' *)
    offsets[-6] := 0;

    (* EXPECT ERROR: index 6 above upper bound 5
       Message: Array index 6 is out of bounds [-5..5] for 'offsets' *)
    offsets[6] := 0;

    (* --- multi-dimensional array --- *)

    (* OK: all indices in range *)
    matrix[1, 1] := 0.0;
    matrix[4, 4] := 1.0;
    matrix[2, 3] := 0.5;

    (* EXPECT ERROR: first index 0 out of [1..4]
       Message: Array index 0 is out of bounds [1..4] for 'matrix' *)
    matrix[0, 2] := 1.0;

    (* EXPECT ERROR: second index 5 out of [1..4]
       Message: Array index 5 is out of bounds [1..4] for 'matrix' *)
    matrix[2, 5] := 1.0;

    (* --- reading (RHS) also checked --- *)

    (* OK *)
    x := temps[3];

    (* EXPECT ERROR: index 99 out of [1..10]
       Message: Array index 99 is out of bounds [1..10] for 'temps' *)
    x := temps[99];

END_PROGRAM
