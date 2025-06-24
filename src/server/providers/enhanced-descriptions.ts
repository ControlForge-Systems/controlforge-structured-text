/**
 * Enhanced descriptions for standard function blocks
 * These provide detailed documentation for hover tooltips
 */

import { FBMemberDefinition } from '../../shared/types';

interface EnhancedFBDescription {
    title: string;
    description: string;
    timing?: string;  // Timing diagram ASCII representation
    example?: string; // Code example
    applications?: string[]; // Common applications
    vendorNotes?: string; // Vendor-specific information
}

/**
 * Map of standard function block descriptions
 */
export const StandardFBDescriptions: Map<string, EnhancedFBDescription> = new Map([
    ['TON', {
        title: 'On-Delay Timer',
        description: 'Generates a delayed output signal after input is TRUE for the specified time. The timer starts when input goes TRUE and sets output after the preset delay time elapses.',
        timing: `
IN  ┐      ┌─────┐      
    │      │     │      
    └──────┘     └──────

Q   ┐        ┌───┐      
    │        │   │      
    └────────┘   └──────
       PT→│  │←PT       `,
        example: `// Start delay timer for 5 seconds
myTimer(IN := StartButton, PT := T#5s);

// Check if delay elapsed
IF myTimer.Q THEN
    Motor := TRUE; // Motor starts after delay
END_IF;`,
        applications: [
            'Motor start delays',
            'Process step timing',
            'Alarm delays',
            'Cycle time control'
        ]
    }],
    ['TOF', {
        title: 'Off-Delay Timer',
        description: 'Maintains output for a specified time after input goes FALSE. The timer output (Q) immediately follows the input (IN) when it goes TRUE, but when input goes FALSE, the output stays TRUE for the preset time.',
        timing: `
IN  ┐      ┌─────┐      ┌───
    │      │     │      │   
    └──────┘     └──────┘   

Q   ┐      ┌───────┐      ┌─
    │      │       │      │ 
    └──────┘       └──────┘ 
           PT→│   │←`,
        example: `VAR
    cooldownTimer: TOF;
END_VAR

// Start cooldown timer when process stops
cooldownTimer(IN := ProcessRunning, PT := T#30s);

// Keep cooling fans running during cooldown
CoolingFans := cooldownTimer.Q;`,
        applications: [
            'Cooling fan run-on after system shutdown',
            'Conveyor belt deceleration sequences',
            'Lubrication/purge after operation stops',
            'Status indicator persistence'
        ]
    }],
    ['TP', {
        title: 'Pulse Timer',
        description: 'Generates a fixed-duration pulse on the rising edge of the input. The output (Q) goes TRUE when input rises and stays TRUE for the preset time, regardless of input state changes during the pulse.',
        timing: `
IN  ┐      ┌───────────┐      
    │      │           │      
    └──────┘           └──────

Q   ┐      ┌─────┐      ┌─────
    │      │     │      │     
    └──────┘     └──────┘     
           PT→│ │←  PT→│ │←`,
        example: `VAR
    alarmPulse: TP;
END_VAR

// Generate a 2-second pulse when alarm triggered
alarmPulse(IN := AlarmTriggered, PT := T#2s);

// Use pulse to flash light or sound buzzer
AlarmLight := alarmPulse.Q;`,
        applications: [
            'Fixed-duration output pulses',
            'Momentary reset signals',
            'Alarm/notification pulses',
            'One-shot operations'
        ]
    }],
    ['CTU', {
        title: 'Count-Up Counter',
        description: 'Increments a counter value on rising edge of count input. The counter output (Q) becomes TRUE when the current value reaches or exceeds the preset value.',
        example: `VAR
    productCounter: CTU;
END_VAR

// Count each product detected
productCounter(CU := ProductSensor, PV := 100, R := ResetButton);

// Check if batch complete
IF productCounter.Q THEN
    BatchComplete := TRUE;
END_IF;

// Display current count
CurrentCount := productCounter.CV;`,
        applications: [
            'Production counting and batching',
            'Event counting and tracking',
            'Cycle counting for maintenance',
            'Usage limit monitoring'
        ]
    }],
    ['CTD', {
        title: 'Count-Down Counter',
        description: 'Decrements a counter value on rising edge of count input. The counter output (Q) becomes TRUE when the current value reaches zero.',
        example: `VAR
    itemsRemaining: CTD;
END_VAR

// Load initial value and count down with each item
itemsRemaining(CD := ItemTaken, PV := 50, LD := ReloadSignal);

// Signal when empty
IF itemsRemaining.Q THEN
    NeedsRefill := TRUE;
END_IF;

// Display remaining items
RemainingCount := itemsRemaining.CV;`,
        applications: [
            'Inventory tracking',
            'Countdown sequences',
            'Remaining operations',
            'Resource usage monitoring'
        ]
    }],
    ['CTUD', {
        title: 'Count-Up/Down Counter',
        description: 'Bidirectional counter that can increment and decrement. Provides two outputs: QU (count up reached preset) and QD (count down reached zero).',
        example: `VAR
    positionTracker: CTUD;
END_VAR

// Track position with up/down pulses
positionTracker(
    CU := MoveUp, 
    CD := MoveDown,
    PV := UpperLimit,
    R := ResetPos,
    LD := LoadPos
);

// Check position limits
AtUpperLimit := positionTracker.QU;
AtLowerLimit := positionTracker.QD;
CurrentPosition := positionTracker.CV;`,
        applications: [
            'Position tracking',
            'Bidirectional counting',
            'Net change monitoring',
            'Inventory balance tracking'
        ]
    }],
    ['R_TRIG', {
        title: 'Rising Edge Trigger',
        description: 'Detects rising edges (FALSE to TRUE transitions) of a boolean signal. The output (Q) is TRUE for exactly one scan cycle when a rising edge is detected on the input.',
        timing: `
CLK ┐      ┌─────┐      
    │      │     │      
    └──────┘     └──────

Q   ┐      ┌┐    ┐      
    │      ││    │      
    └──────┘└────┘──────
           ↑      ↑     `,
        example: `// Detect button press (rising edge only)
buttonTrig(CLK := ButtonInput);

// Execute once per button press
IF buttonTrig.Q THEN
    StartSequence := TRUE;
END_IF;`,
        applications: [
            'Button press detection',
            'Start command detection',
            'One-shot operations',
            'Edge-triggered events'
        ]
    }],
    ['F_TRIG', {
        title: 'Falling Edge Trigger',
        description: 'Detects falling edges (TRUE to FALSE transitions) of a boolean signal. The output (Q) is TRUE for exactly one scan cycle when a falling edge is detected on the input.',
        timing: `
CLK ┐      ┌─────┐      ┌───
    │      │     │      │   
    └──────┘     └──────┘   

Q   ┐    ┌┐      ┐    ┌┐    
    │    ││      │    ││    
    └────┘└──────┘────┘└────
         ↑        ↑        `,
        example: `VAR
    stopButton: F_TRIG;
END_VAR

// Detect button release (falling edge)
stopButton(CLK := StopButtonInput);

// Execute once when button released
IF stopButton.Q THEN
    StopSequence := TRUE;
END_IF;`,
        applications: [
            'Stop command detection',
            'Button release detection',
            'End-of-cycle detection',
            'Signal termination events'
        ]
    }],
    ['RS', {
        title: 'Reset-Dominant Bistable (Latch)',
        description: 'A reset-dominant bistable function block (latch) that sets its output (Q1) when S input is TRUE, and resets when R1 input is TRUE. If both S and R1 are TRUE, reset dominates (Q1 becomes FALSE).',
        example: `VAR
    motorLatch: RS;
END_VAR

// Start motor with start button, stop with stop button
motorLatch(S := StartButton, R1 := StopButton);

// Use latched output to control motor
Motor := motorLatch.Q1;`,
        applications: [
            'Motor start/stop circuits',
            'Process state retention',
            'Fault condition latching',
            'Run permission control'
        ],
        vendorNotes: 'Some vendors may implement this with different port names (e.g., Q instead of Q1). Consult vendor documentation for compatibility.'
    }],
    ['SR', {
        title: 'Set-Dominant Bistable (Latch)',
        description: 'A set-dominant bistable function block (latch) that sets its output (Q1) when S1 input is TRUE, and resets when R input is TRUE. If both S1 and R are TRUE, set dominates (Q1 becomes TRUE).',
        example: `VAR
    alarmLatch: SR;
END_VAR

// Set alarm with trigger, reset with acknowledgment
alarmLatch(S1 := AlarmTrigger, R := AcknowledgeButton);

// Use latched output for alarm indicator
AlarmActive := alarmLatch.Q1;`,
        applications: [
            'Alarm circuits with manual reset',
            'Permission sequences',
            'Mode selection retention',
            'System state memory'
        ],
        vendorNotes: 'Some vendors may implement this with different port names (e.g., Q instead of Q1). Consult vendor documentation for compatibility.'
    }]
]);

/**
 * Get enhanced function block description
 */
export function getFunctionBlockDescription(fbType: string): string {
    const fbDesc = StandardFBDescriptions.get(fbType.toUpperCase());

    if (!fbDesc) {
        return `Function Block: ${fbType}`;
    }

    let result = `# ${fbType}: ${fbDesc.title}\n\n${fbDesc.description}`;

    if (fbDesc.timing) {
        result += `\n\n## Timing Diagram\n\`\`\`\n${fbDesc.timing}\n\`\`\``;
    }

    if (fbDesc.applications && fbDesc.applications.length > 0) {
        result += '\n\n## Common Applications\n';
        fbDesc.applications.forEach(app => {
            result += `- ${app}\n`;
        });
    }

    if (fbDesc.example) {
        result += `\n\n## Usage Example\n\`\`\`st\n${fbDesc.example}\n\`\`\``;
    }

    if (fbDesc.vendorNotes) {
        result += `\n\n## Vendor Notes\n${fbDesc.vendorNotes}`;
    }

    return result;
}

/**
 * Get enhanced member description
 */
export function getMemberDescription(fbType: string, memberName: string): string | null {
    const normalizedFbType = fbType.toUpperCase();
    const normalizedMemberName = memberName.toUpperCase();

    // Member descriptions map - organized by function block type and member name
    const memberDescriptions: Record<string, Record<string, string>> = {
        // Timer function blocks
        'TON': {
            'IN': `## IN (Input)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The boolean input that starts the timer. When IN transitions from FALSE to TRUE, the timer begins counting. When IN becomes FALSE, the timer stops and resets.

**Behavior**:
- Rising edge (FALSE to TRUE): Timer starts counting up
- While TRUE: Timer continues counting until PT is reached
- Falling edge (TRUE to FALSE): Timer resets to 0

**Related Members**: PT (preset time), Q (output), ET (elapsed time)`,

            'PT': `## PT (Preset Time)

**Data Type**: \`TIME\`  
**Direction**: INPUT

The preset time duration that determines when the output Q becomes TRUE.

**Usage**:
- Set PT before the timer starts
- Use time literals (e.g., T#5s, T#1m30s)
- The timer output Q becomes TRUE when ET reaches PT

**Examples**: 
- T#5s (5 seconds)
- T#1m30s (1 minute and 30 seconds)
- T#1h (1 hour)`,

            'Q': `## Q (Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The timer output. Q becomes TRUE when the elapsed time (ET) reaches or exceeds the preset time (PT), but only if IN remains TRUE.

**Behavior**:
- FALSE: When timer is not running or has not reached PT
- TRUE: When elapsed time reaches PT while IN remains TRUE
- When IN becomes FALSE, Q immediately becomes FALSE

**Common Uses**:
- Trigger actions after a delay
- Enable sequences after minimum time
- Control time-dependent processes`,

            'ET': `## ET (Elapsed Time)

**Data Type**: \`TIME\`  
**Direction**: OUTPUT

The current elapsed time of the timer. ET increases while IN is TRUE, up to the value of PT.

**Behavior**:
- Starts at T#0s when IN becomes TRUE
- Increases while IN remains TRUE, up to PT
- Resets to T#0s when IN becomes FALSE
- Stops incrementing when ET reaches PT

**Usage**:
- Monitor progress of the delay
- Calculate remaining time (PT - ET)
- Use for display or time-proportional control`
        },

        'TOF': {
            'IN': `## IN (Input)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The boolean input signal. When IN becomes TRUE, Q immediately becomes TRUE. When IN becomes FALSE, the timer starts counting.

**Behavior**:
- Rising edge (FALSE to TRUE): Q immediately becomes TRUE, timer resets
- Falling edge (TRUE to FALSE): Timer starts counting, Q remains TRUE until PT is reached

**Related Members**: PT (preset time), Q (output), ET (elapsed time)`,

            'PT': `## PT (Preset Time)

**Data Type**: \`TIME\`  
**Direction**: INPUT

The preset time duration that determines how long Q remains TRUE after IN becomes FALSE.

**Usage**:
- Set PT before the timer starts
- Use time literals (e.g., T#5s, T#1m30s)
- Q remains TRUE for PT time after IN becomes FALSE

**Examples**: 
- T#5s (5 seconds)
- T#1m30s (1 minute and 30 seconds)
- T#1h (1 hour)`,

            'Q': `## Q (Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The timer output. Q becomes TRUE immediately when IN becomes TRUE and remains TRUE for PT time after IN becomes FALSE.

**Behavior**:
- TRUE: When IN is TRUE or during the off-delay period
- FALSE: When off-delay period has expired

**Common Uses**:
- Implement cooldown periods
- Create delayed shutdowns
- Maintain signals for minimum durations`,

            'ET': `## ET (Elapsed Time)

**Data Type**: \`TIME\`  
**Direction**: OUTPUT

The current elapsed time of the timer. ET increases after IN becomes FALSE, up to the value of PT.

**Behavior**:
- Starts at T#0s when IN becomes FALSE
- Increases while IN remains FALSE, up to PT
- Resets to T#0s when IN becomes TRUE
- Stops incrementing when ET reaches PT

**Usage**:
- Monitor progress of the off-delay
- Calculate remaining time (PT - ET)
- Use for display or time-proportional control`
        },

        'TP': {
            'IN': `## IN (Input)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The boolean input signal. When IN transitions from FALSE to TRUE, a pulse of duration PT is started.

**Behavior**:
- Rising edge (FALSE to TRUE): Timer starts and Q becomes TRUE
- Further changes of IN: Ignored until pulse is complete
- New pulse can only be triggered after Q returns to FALSE

**Related Members**: PT (pulse time), Q (output), ET (elapsed time)`,

            'PT': `## PT (Pulse Time)

**Data Type**: \`TIME\`  
**Direction**: INPUT

The duration of the output pulse. Q remains TRUE for exactly PT time after triggered by a rising edge on IN.

**Usage**:
- Set PT before the timer starts
- Use time literals (e.g., T#5s, T#1m30s)
- The pulse width is exactly PT regardless of IN state

**Examples**: 
- T#5s (5 seconds)
- T#1m30s (1 minute and 30 seconds)
- T#1h (1 hour)`,

            'Q': `## Q (Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The pulse output. Q becomes TRUE when IN transitions from FALSE to TRUE and remains TRUE for exactly PT time, regardless of subsequent changes to IN.

**Behavior**:
- FALSE: Before pulse is triggered or after pulse duration completes
- TRUE: During the pulse (for exactly PT time)
- Changes to IN during the pulse have no effect on the current pulse

**Common Uses**:
- Generate fixed-width pulses
- Create one-shot actions
- Time-exact signal generation
- Alarm or notification pulses`,

            'ET': `## ET (Elapsed Time)

**Data Type**: \`TIME\`  
**Direction**: OUTPUT

The current elapsed time of the pulse. ET increases during the pulse, up to the value of PT.

**Behavior**:
- Starts at T#0s when pulse begins
- Increases during the pulse, up to PT
- Resets to T#0s when pulse completes
- Stops incrementing when ET reaches PT

**Usage**:
- Monitor progress of the pulse
- Calculate remaining time (PT - ET)
- Create proportional actions during the pulse duration`
        },

        // Counter function blocks
        'CTU': {
            'CU': `## CU (Count Up)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The count up input. The counter increments on each rising edge (FALSE to TRUE transition) of CU.

**Behavior**:
- Rising edge (FALSE to TRUE): Counter value (CV) increases by 1
- Falling edge (TRUE to FALSE): No effect
- When CV ≥ PV, the output Q becomes TRUE

**Usage**:
- Connect to pulse signals or events
- Use with sensors or triggers
- Only rising edges are counted`,

            'R': `## R (Reset)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The reset input. When R becomes TRUE, the counter value (CV) is reset to 0.

**Behavior**:
- Rising edge (FALSE to TRUE): CV is set to 0 and Q becomes FALSE
- R has priority over CU (if both are TRUE, reset occurs)

**Usage**:
- Reset counter at the start of cycles
- Clear counts on specific conditions
- Connect to reset buttons or signals`,

            'PV': `## PV (Preset Value)

**Data Type**: \`INT\`  
**Direction**: INPUT

The preset value. When the counter value (CV) reaches or exceeds PV, the output Q becomes TRUE.

**Usage**:
- Set PV to the target count value
- Can be changed during operation
- Determines when Q becomes TRUE

**Example**: 
- Setting PV to 100 means Q becomes TRUE when 100 or more counts have occurred`,

            'Q': `## Q (Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The counter output. Q becomes TRUE when the counter value (CV) reaches or exceeds the preset value (PV).

**Behavior**:
- FALSE: When CV < PV or after reset
- TRUE: When CV ≥ PV
- Q remains TRUE until counter is reset (R = TRUE)

**Common Uses**:
- Signal when a batch is complete
- Trigger actions after a specific count
- Indicate target achievement`,

            'CV': `## CV (Current Value)

**Data Type**: \`INT\`  
**Direction**: OUTPUT

The current counter value. CV increases by 1 on each rising edge of CU.

**Behavior**:
- Starts at 0 after reset
- Increases by 1 on each rising edge of CU
- Reset to 0 when R becomes TRUE
- Continues counting beyond PV

**Usage**:
- Monitor current count
- Display counter progress
- Use in calculations or comparisons`
        },

        'CTD': {
            'CD': `## CD (Count Down)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The count down input. The counter decrements on each rising edge (FALSE to TRUE transition) of CD.

**Behavior**:
- Rising edge (FALSE to TRUE): Counter value (CV) decreases by 1
- Falling edge (TRUE to FALSE): No effect
- When CV = 0, the output Q becomes TRUE

**Usage**:
- Connect to pulse signals or events
- Use with sensors or triggers
- Only rising edges are counted`,

            'LD': `## LD (Load)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The load input. When LD becomes TRUE, the counter value (CV) is loaded with the preset value (PV).

**Behavior**:
- Rising edge (FALSE to TRUE): CV is set to PV
- LD has priority over CD (if both are TRUE, load occurs)

**Usage**:
- Initialize counter with starting value
- Reload counter during operation
- Connect to load buttons or signals`,

            'PV': `## PV (Preset Value)

**Data Type**: \`INT\`  
**Direction**: INPUT

The preset value. The value loaded into CV when LD becomes TRUE.

**Usage**:
- Set PV to the initial count value
- Can be changed during operation
- Value loaded when LD becomes TRUE

**Example**: 
- Setting PV to 100 loads CV with 100 when LD becomes TRUE`,

            'Q': `## Q (Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The counter output. Q becomes TRUE when the counter value (CV) reaches zero.

**Behavior**:
- FALSE: When CV > 0 or after load
- TRUE: When CV = 0
- Q remains TRUE until counter is loaded (LD = TRUE)

**Common Uses**:
- Signal when resources are depleted
- Trigger replenishment actions
- Indicate completion of countdown`,

            'CV': `## CV (Current Value)

**Data Type**: \`INT\`  
**Direction**: OUTPUT

The current counter value. CV decreases by 1 on each rising edge of CD.

**Behavior**:
- Set to PV when LD becomes TRUE
- Decreases by 1 on each rising edge of CD
- Stops counting when it reaches 0
- When CV = 0, Q becomes TRUE

**Usage**:
- Monitor remaining items
- Display countdown progress
- Use in calculations or comparisons`
        },

        // Edge detection function blocks
        'R_TRIG': {
            'CLK': `## CLK (Clock)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The clock input signal. The R_TRIG function block monitors this signal for rising edges (transitions from FALSE to TRUE).

**Behavior**:
- Rising edge (FALSE to TRUE): Output Q becomes TRUE for one scan cycle
- Falling edge (TRUE to FALSE): No effect on output
- No change: No effect on output

**Usage**:
- Connect to signals where edge detection is needed
- Use with buttons, switches, or status signals
- Only rising edges trigger the output`,

            'Q': `## Q (Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The edge detection output. Q becomes TRUE for exactly one scan cycle when a rising edge is detected on CLK.

**Behavior**:
- TRUE: For exactly one scan cycle after a rising edge on CLK
- FALSE: At all other times
- Regardless of how long CLK remains TRUE, Q is only TRUE for one scan

**Common Uses**:
- Create one-shot actions on button press
- Detect the start of conditions
- Convert level signals to pulse signals
- Avoid repeated execution of actions while a signal is TRUE`
        },

        'F_TRIG': {
            'CLK': `## CLK (Clock)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The clock input signal. The F_TRIG function block monitors this signal for falling edges (transitions from TRUE to FALSE).

**Behavior**:
- Falling edge (TRUE to FALSE): Output Q becomes TRUE for one scan cycle
- Rising edge (FALSE to TRUE): No effect on output
- No change: No effect on output

**Usage**:
- Connect to signals where falling edge detection is needed
- Use with buttons, switches, or status signals
- Only falling edges trigger the output`,

            'Q': `## Q (Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The edge detection output. Q becomes TRUE for exactly one scan cycle when a falling edge is detected on CLK.

**Behavior**:
- TRUE: For exactly one scan cycle after a falling edge on CLK
- FALSE: At all other times
- Regardless of how long CLK remains FALSE, Q is only TRUE for one scan

**Common Uses**:
- Detect button release events
- Identify the end of conditions
- Create completion triggers
- Detect when signals turn off`
        },

        // Bistable function blocks
        'RS': {
            'S': `## S (Set)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The set input. When S becomes TRUE, the output Q1 is set to TRUE.

**Behavior**:
- When S becomes TRUE, Q1 becomes TRUE
- Once set, Q1 remains TRUE even if S returns to FALSE
- R1 takes priority over S (reset-dominant)

**Usage**:
- Use for start or enable signals
- Connect to activation triggers
- Persistent activation signal`,

            'R1': `## R1 (Reset)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The reset input. When R1 becomes TRUE, the output Q1 is reset to FALSE.

**Behavior**:
- When R1 becomes TRUE, Q1 becomes FALSE
- R1 has priority over S (if both are TRUE, Q1 becomes FALSE)
- Q1 remains FALSE until S is TRUE and R1 is FALSE

**Usage**:
- Use for stop or disable signals
- Connect to deactivation triggers
- Safety override signals`,

            'Q1': `## Q1 (Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The bistable output.

**Behavior**:
- Set to TRUE when S is TRUE and R1 is FALSE
- Reset to FALSE when R1 is TRUE
- Maintains its state when both S and R1 are FALSE
- R1 dominates when both inputs are TRUE

**Common Uses**:
- Implement start/stop logic
- Create persistent states
- Maintain status information
- Control enabling/disabling of processes

**Vendor Note**: Some PLC vendors implement this as Q instead of Q1`
        },

        'SR': {
            'S1': `## S1 (Set)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The set input. When S1 becomes TRUE, the output Q1 is set to TRUE.

**Behavior**:
- When S1 becomes TRUE, Q1 becomes TRUE
- Once set, Q1 remains TRUE even if S1 returns to FALSE
- S1 takes priority over R (set-dominant)

**Usage**:
- Use for start or enable signals
- Connect to activation triggers
- Safety-critical activation signals`,

            'R': `## R (Reset)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The reset input. When R becomes TRUE and S1 is FALSE, the output Q1 is reset to FALSE.

**Behavior**:
- When R becomes TRUE and S1 is FALSE, Q1 becomes FALSE
- S1 has priority over R (if both are TRUE, Q1 becomes TRUE)
- Q1 remains FALSE until S1 becomes TRUE

**Usage**:
- Use for stop or disable signals
- Connect to deactivation triggers
- Non-critical reset signals`,

            'Q1': `## Q1 (Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The bistable output.

**Behavior**:
- Set to TRUE when S1 is TRUE
- Reset to FALSE when R is TRUE and S1 is FALSE
- Maintains its state when both S1 and R are FALSE
- S1 dominates when both inputs are TRUE

**Common Uses**:
- Implement alarm circuits with manual reset
- Create persistent states with priority set
- Maintain critical status information
- Control processes where activation takes priority

**Vendor Note**: Some PLC vendors implement this as Q instead of Q1`
        },

        'CTUD': {
            'CU': `## CU (Count Up)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The count up input. The counter increments on each rising edge (FALSE to TRUE transition) of CU.

**Behavior**:
- Rising edge (FALSE to TRUE): Counter value (CV) increases by 1
- Falling edge (TRUE to FALSE): No effect
- When CV ≥ PV, the output QU becomes TRUE

**Usage**:
- Connect to up movement or increment signals
- Use with forward sensors or triggers
- Only rising edges are counted`,

            'CD': `## CD (Count Down)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The count down input. The counter decrements on each rising edge (FALSE to TRUE transition) of CD.

**Behavior**:
- Rising edge (FALSE to TRUE): Counter value (CV) decreases by 1
- Falling edge (TRUE to FALSE): No effect
- When CV = 0, the output QD becomes TRUE

**Usage**:
- Connect to down movement or decrement signals
- Use with reverse sensors or triggers
- Only rising edges are counted`,

            'R': `## R (Reset)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The reset input. When R becomes TRUE, the counter value (CV) is reset to 0.

**Behavior**:
- Rising edge (FALSE to TRUE): CV is set to 0 and QD becomes TRUE
- R has priority over other inputs except LD
- When R is TRUE, QU becomes FALSE and QD becomes TRUE

**Usage**:
- Reset position to zero
- Initialize counter
- Connect to home position signals`,

            'LD': `## LD (Load)

**Data Type**: \`BOOL\`  
**Direction**: INPUT

The load input. When LD becomes TRUE, the counter value (CV) is loaded with the preset value (PV).

**Behavior**:
- Rising edge (FALSE to TRUE): CV is set to PV
- LD has highest priority over all other inputs
- When CV = PV, QU becomes TRUE and QD becomes FALSE

**Usage**:
- Set to known position
- Initialize counter with specific value
- Connect to position presets`,

            'PV': `## PV (Preset Value)

**Data Type**: \`INT\`  
**Direction**: INPUT

The preset value. Used for two purposes:
1. The value loaded into CV when LD becomes TRUE
2. The threshold at which QU becomes TRUE when counting up

**Usage**:
- Set PV to the target or initial count value
- Can be changed during operation
- Determines when QU becomes TRUE
- Value loaded when LD becomes TRUE`,

            'QU': `## QU (Count Up Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The count up output. QU becomes TRUE when the counter value (CV) reaches or exceeds the preset value (PV).

**Behavior**:
- FALSE: When CV < PV or after reset
- TRUE: When CV ≥ PV
- QU remains TRUE until CV < PV

**Common Uses**:
- Signal when upper limit is reached
- Trigger actions at maximum position
- Indicate high threshold achievement`,

            'QD': `## QD (Count Down Output)

**Data Type**: \`BOOL\`  
**Direction**: OUTPUT

The count down output. QD becomes TRUE when the counter value (CV) reaches zero.

**Behavior**:
- FALSE: When CV > 0 or after load to PV
- TRUE: When CV = 0
- QD remains TRUE until CV > 0

**Common Uses**:
- Signal when lower limit is reached
- Trigger actions at minimum position
- Indicate empty or zero state`,

            'CV': `## CV (Current Value)

**Data Type**: \`INT\`  
**Direction**: OUTPUT

The current counter value. CV increases with CU pulses and decreases with CD pulses.

**Behavior**:
- Increases by 1 on each rising edge of CU
- Decreases by 1 on each rising edge of CD
- Set to 0 when R becomes TRUE
- Set to PV when LD becomes TRUE
- Cannot go below 0 or above 32767

**Usage**:
- Monitor current position or count
- Display counter value
- Use in calculations or comparisons
- Track bidirectional movement`
        }
    };

    // Look up the specific member description
    if (memberDescriptions[normalizedFbType] && memberDescriptions[normalizedFbType][normalizedMemberName]) {
        return memberDescriptions[normalizedFbType][normalizedMemberName];
    }

    return null;
}

/**
 * Get short function block description for concise tooltips
 */
export function getShortFBDescription(fbType: string): string {
    const fbDesc = StandardFBDescriptions.get(fbType.toUpperCase());

    if (!fbDesc) {
        return `Function Block of type ${fbType}`;
    }

    return fbDesc.description;
}
