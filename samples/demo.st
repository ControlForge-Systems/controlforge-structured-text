PROGRAM Demo
VAR
    (* Timers *)
    startTimer      : TON;
    pulseTimer      : TP;
    offTimer        : TOF;

    (* Counters *)
    partCounter     : CTU;
    batchCounter    : CTUD;

    (* Edge detection *)
    startEdge       : R_TRIG;
    stopEdge        : F_TRIG;

    (* Bistables *)
    runLatch        : SR;

    (* Process variables *)
    counter         : INT := 0;
    temperature     : REAL := 22.5;
    isRunning       : BOOL := FALSE;
    message         : STRING := 'Idle';

    (* Time and date *)
    cycleTime       : TIME := T#500ms;
    startDate       : DATE := D#2026-01-01;
END_VAR

counter := counter + 1;

IF isRunning THEN
    startTimer(IN := startEdge.Q, PT := T#5s);
    pulseTimer(IN := startEdge.Q, PT := T#1s);

    partCounter(CU := startEdge.Q, R := FALSE, PV := 100);

    IF startTimer.Q THEN
        temperature := temperature + 0.5;
        message := 'Running';
    END_IF

    IF temperature > 80.0 THEN
        isRunning := FALSE;
        message := 'Overheat';
    END_IF
END_IF

runLatch(S1 := startEdge.Q, R := stopEdge.Q);
isRunning := runLatch.Q1;

CASE counter OF
    0..10:   message := 'Starting';
    11..50:  message := 'Running';
    51..99:  message := 'Finishing';
ELSE
    message := 'Done';
END_CASE

END_PROGRAM
