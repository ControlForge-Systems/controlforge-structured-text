(* Test file for IEC 61131-3 literal highlighting *)
PROGRAM TestLiterals
VAR
    // Time literals
    shortTime : TIME := T#10s;
    longTime : LTIME := LTIME#1d_2h_30m_45s;
    timeMs : TIME := T#500ms;
    timeUs : TIME := T#100us;
    timeNs : LTIME := LTIME#50ns;
    
    // Date literals
    normalDate : DATE := D#2025-06-12;
    longDate : LDATE := LDATE#2025-12-31;
    
    // Time of day literals
    timeOfDay : TIME_OF_DAY := TOD#14:30:15;
    longTimeOfDay : LTIME_OF_DAY := LTOD#23:59:59.999;
    timeOfDay2 : TIME_OF_DAY := TIME_OF_DAY#08:00:00;
    
    // Date and time literals
    dateTime : DATE_AND_TIME := DT#2025-06-12-14:30:15;
    longDateTime : LDATE_AND_TIME := LDT#2025-12-31-23:59:59.999;
    dateTime2 : DATE_AND_TIME := DATE_AND_TIME#2025-01-01-00:00:00;
    
    // Numeric literals (regular)
    hexValue : WORD := 16#ABCD;
    binValue : BYTE := 2#11110000;
    octValue : BYTE := 8#377;
    intValue : INT := 12345;
    realValue : REAL := 3.14159;
    expValue : REAL := 1.23E-4;
    
    // Typed numeric literals (IEC 61131-3 extension)
    typedByte : BYTE := BYTE#16#FF;
    typedWord : WORD := WORD#16#ABCD;
    typedDWord : DWORD := DWORD#16#12345678;
    typedLWord : LWORD := LWORD#16#123456789ABCDEF0;
    typedBinary : BYTE := BYTE#2#11110000;
    typedOctal : BYTE := BYTE#8#377;
    typedInt : INT := INT#12345;
    typedReal : REAL := REAL#3.14159;
END_VAR

// All these literals should be highlighted as complete constants,
// not split between type prefix and value
END_PROGRAM
