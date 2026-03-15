(* Manual QA: hardware address literals (#82)
   OPEN: this file in VS Code with the extension active.
   USE:  Ctrl+Shift+P -> "Developer: Inspect Editor Tokens and Scopes"
         hover over each %... literal and confirm the scope is
         constant.other.hardware-address.st
*)

PROGRAM HardwareAddressTest
VAR
    Input_Bit_0  AT %IX0.0  : BOOL;   (* EXPECT: %IX0.0  → constant.other.hardware-address.st *)
    Input_Bit_7  AT %IX1.7  : BOOL;   (* EXPECT: %IX1.7  → constant.other.hardware-address.st *)
    Input_Word   AT %IW2    : INT;    (* EXPECT: %IW2    → constant.other.hardware-address.st *)
    Output_Bit   AT %QX0.0  : BOOL;  (* EXPECT: %QX0.0  → constant.other.hardware-address.st *)
    Output_Word  AT %QW1    : INT;   (* EXPECT: %QW1    → constant.other.hardware-address.st *)
    Mem_DWord    AT %MD100  : DINT;  (* EXPECT: %MD100  → constant.other.hardware-address.st *)
    Mem_Byte     AT %MB5    : BYTE;  (* EXPECT: %MB5    → constant.other.hardware-address.st *)
    Mem_Long     AT %IL3    : LINT;  (* EXPECT: %IL3    → constant.other.hardware-address.st *)
    Deep_Addr    AT %IX1.2.3 : BOOL; (* EXPECT: %IX1.2.3 → constant.other.hardware-address.st *)
END_VAR

END_PROGRAM
