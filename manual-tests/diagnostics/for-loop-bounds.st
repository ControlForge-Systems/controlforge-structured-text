(* Manual QA: FOR loop bounds validation *)
(* Open this file in VS Code. Verify squiggles appear ONLY on lines marked     *)
(* "EXPECT <SEVERITY>" and that no squiggles appear on lines marked "OK".      *)
(* Check the Problems panel (Ctrl+Shift+M) for full messages.                   *)

PROGRAM ForLoopBoundsTest
VAR
    i     : INT;
    start : INT;
    stop  : INT;
    total : INT;
END_VAR

    (* ── Normal ascending loops — no diagnostic expected ─────────────────── *)

    (* OK: ascending, default BY (+1) *)
    FOR i := 1 TO 10 DO
        total := total + i;
    END_FOR;

    (* OK: ascending, explicit BY 1 *)
    FOR i := 1 TO 10 BY 1 DO
        total := total + i;
    END_FOR;

    (* OK: descending with BY -1 *)
    FOR i := 10 TO 1 BY -1 DO
        total := total + i;
    END_FOR;

    (* OK: large positive step still valid direction *)
    FOR i := 0 TO 100 BY 5 DO
        total := total + i;
    END_FOR;

    (* OK: variable bounds — not checked at all *)
    FOR i := start TO stop DO
        total := total + i;
    END_FOR;

    (* OK: negative bounds, descending *)
    FOR i := -1 TO -10 BY -1 DO
        total := total + i;
    END_FOR;

    (* ── BY 0: error ─────────────────────────────────────────────────────── *)

    (* EXPECT ERROR on "BY 0": infinite loop
       Problems panel: "FOR loop step BY 0 causes an infinite loop"           *)
    FOR i := 1 TO 10 BY 0 DO
        total := total + i;
    END_FOR;

    (* ── Reverse range with positive BY: warning ─────────────────────────── *)

    (* EXPECT WARNING on "FOR": loop body never executes
       Problems panel: "FOR loop body never executes: counting up (BY 1) but start (10) > end (1)..." *)
    FOR i := 10 TO 1 BY 1 DO
        total := total + i;
    END_FOR;

    (* EXPECT WARNING on "FOR": default BY (+1) with descending range
       Problems panel: "FOR loop body never executes: counting up (BY 1) but start (10) > end (1)..." *)
    FOR i := 10 TO 1 DO
        total := total + i;
    END_FOR;

    (* EXPECT WARNING on "FOR": ascending range with negative step
       Problems panel: "FOR loop body never executes: counting down (BY -2) but start (1) < end (10)..." *)
    FOR i := 1 TO 10 BY -2 DO
        total := total + i;
    END_FOR;

    (* ── Start equals end: hint ──────────────────────────────────────────── *)

    (* EXPECT HINT on "FOR": executes exactly once — likely unintended
       Problems panel: "FOR loop executes exactly once (start equals end: 5)" *)
    FOR i := 5 TO 5 DO
        total := total + i;
    END_FOR;

    (* EXPECT HINT on "FOR": same with explicit BY
       Problems panel: "FOR loop executes exactly once (start equals end: 3)" *)
    FOR i := 3 TO 3 BY 1 DO
        total := total + i;
    END_FOR;

END_PROGRAM
