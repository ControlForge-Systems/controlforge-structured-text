(* Test file for syntax highlighting verification *)
PROGRAM TestHighlighting
VAR
    // Basic types
    boolVar : BOOL := TRUE;
    intVar : INT := 123;
    realVar : REAL := 3.14;
    
    // Extended time types (should be highlighted now)
    timeVar : TIME := T#10s;
    ltimeVar : LTIME := LTIME#1d_2h_30m_45s;
    dateVar : DATE := D#2025-06-12;
    ldateVar : LDATE := LDATE#2025-06-12;
    
    // Character types (should be highlighted)
    charVar : CHAR := 'A';
    wcharVar : WCHAR := "Ω";
    
    // String types
    stringVar : STRING := 'Hello World';
    wstringVar : WSTRING := "Unicode String";
    
    // Extended integer and real types
    lwordVar : LWORD := 16#123456789ABCDEF0;
    lintVar : LINT := -9223372036854775808;
    ulintVar : ULINT := 18446744073709551615;
    lrealVar : LREAL := 2.71828182845904523536;
    
    // Typed numeric literals (alternative IEC 61131-3 syntax)
    typedLWord : LWORD := LWORD#16#123456789ABCDEF0;
    typedWord : WORD := WORD#16#ABCD;
    typedByte : BYTE := BYTE#16#FF;
    
    // Generic types
    anyVar : ANY;
    anyNumVar : ANY_NUM;
    anyRealVar : ANY_REAL;
    
    // Standard function block types (should be highlighted)
    myTimer : TON;
    myPulse : TP;
    myCounter : CTU;
    myEdgeDetector : R_TRIG;
    myFlipFlop : RS;
END_VAR

// Test control structures with highlighting
IF boolVar THEN
    intVar := intVar + 1;
    realVar := ABS(realVar);
    
    CASE intVar OF
        1..10:
            stringVar := 'Low range';
        11..100:
            stringVar := 'Medium range';
    ELSE
        stringVar := 'High range';
    END_CASE;
    
    FOR i := 1 TO 10 DO
        lrealVar := lrealVar * 1.1;
    END_FOR;
    
END_IF;

END_PROGRAM
