(* Manual test: FB hover tooltips (#22)
   Hover over type names and instance names to verify rich tooltips
   with parameter tables, behavior descriptions, and usage examples. *)

PROGRAM HoverTooltipTest
VAR
    (* Timers — hover on type name and instance name *)
    onDelay     : TON;
    offDelay    : TOF;
    pulse       : TP;

    (* Counters *)
    countUp     : CTU;
    countDown   : CTD;
    countUpDown : CTUD;

    (* Edge detection *)
    rising      : R_TRIG;
    falling     : F_TRIG;

    (* Bistable *)
    resetDom    : RS;
    setDom      : SR;

    (* Non-FB variable — should show standard hover *)
    counter     : INT;
    running     : BOOL;
END_VAR

(* Hover on instance names in member access *)
onDelay(IN := running, PT := T#5s);
IF onDelay.Q THEN
    counter := counter + 1;
END_IF

countUp(CU := rising.Q, R := FALSE, PV := 100);
IF countUp.Q THEN
    running := FALSE;
END_IF

resetDom(S := running, R1 := falling.Q);

(* Hover on member names — should show member type and description *)
offDelay.ET;
pulse.Q;
countDown.CV;
countUpDown.QU;
countUpDown.QD;

END_PROGRAM
