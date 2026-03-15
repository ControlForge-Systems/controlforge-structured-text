(* Manual QA: := vs = confusion detection *)
(* Open this file in VS Code. Verify yellow squiggles (warnings) appear ONLY   *)
(* on lines marked "EXPECT WARNING" and that no warnings appear on "OK" lines. *)
(* For each warning, a lightbulb quick-fix should be available (Ctrl+.).        *)

PROGRAM AssignmentConfusion
VAR
    counter : INT := 0;
    x       : INT := 5;
    ok      : BOOL;
    tmr     : TON;
    arr     : ARRAY[0..9] OF INT;
END_VAR

    (* === Case 1: '=' in statement context — should be ':=' === *)

    (* EXPECT WARNING: "Used '=' in statement context; did you mean ':='?" *)
    (* Quick-fix: Replace '=' with ':='                                    *)
    counter = counter + 1;

    (* EXPECT WARNING *)
    x = 42;

    (* EXPECT WARNING: array element *)
    arr[0] = 5;

    (* OK: correct := assignment — no warning *)
    counter := counter + 1;
    x := 42;
    arr[0] := 5;

    (* OK: '=' in IF condition — intentional comparison *)
    IF x = 10 THEN
        x := 0;
    END_IF;

    (* OK: '=' inside parentheses (RHS comparison) *)
    ok := (x = 5);

    (* OK: '<=' and '>=' — not a bare '=' *)
    ok := x <= 10;
    ok := x >= 0;

    (* OK: '<>' — not a bare '=' *)
    ok := x <> 0;

    (* OK: '=' inside FB call paren (depth > 0) *)
    tmr(IN := TRUE, PT := T#1s);
    IF tmr.Q = TRUE THEN
        tmr(IN := FALSE, PT := T#1s);
    END_IF;

    (* === Case 2: ':=' in boolean condition — should be '=' === *)

    (* EXPECT WARNING: "Used ':=' in condition context; did you mean '='?" *)
    (* Quick-fix: Replace ':=' with '='                                    *)
    IF x := 10 THEN
        x := 0;
    END_IF;

    (* EXPECT WARNING: in ELSIF *)
    IF x = 0 THEN
        x := 1;
    ELSIF x := 5 THEN
        x := 0;
    END_IF;

    (* EXPECT WARNING: in WHILE *)
    WHILE x := 0 DO
        x := x + 1;
    END_WHILE;

    (* OK: correct '=' in IF condition — no warning *)
    IF x = 10 THEN
        x := 0;
    END_IF;

    (* OK: ':=' in FOR loop header is correct syntax — no warning *)
    FOR x := 1 TO 10 DO
        counter := counter + 1;
    END_FOR;

    (* OK: ':=' inside parens in IF body (named parameter) — no warning *)
    IF tmr.Q = TRUE THEN
        tmr(IN := FALSE, PT := T#1s);
    END_IF;

END_PROGRAM
