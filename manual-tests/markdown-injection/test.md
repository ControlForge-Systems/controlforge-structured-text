# Markdown Injection Test

Verify ST syntax highlighting inside fenced code blocks.

## iecst fence (expect full ST highlighting)

```iecst
PROGRAM MainProgram
VAR
    counter : INT := 0;
    limit   : INT := 100;
    running : BOOL := TRUE;
END_VAR

(* Main control loop *)
IF running AND (counter < limit) THEN
    counter := counter + 1;
ELSIF counter >= limit THEN
    running := FALSE;
END_IF;
```

## structured-text fence (expect full ST highlighting)

```structured-text
FUNCTION_BLOCK TimerFB
VAR_INPUT
    enable : BOOL;
    preset : TIME := T#5s;
END_VAR
VAR_OUTPUT
    done : BOOL;
END_VAR
VAR
    elapsed : TIME;
END_VAR

(* TON-style timer logic *)
IF enable THEN
    elapsed := elapsed + T#100ms;
    done := elapsed >= preset;
ELSE
    elapsed := T#0s;
    done := FALSE;
END_IF;
END_FUNCTION_BLOCK
```

## st fence (expect NO ST highlighting — unregistered tag)

```st
VAR x : INT := 42; END_VAR
```

## Plain text (expect no impact)

This paragraph is plain Markdown. No ST highlighting should bleed in here.
