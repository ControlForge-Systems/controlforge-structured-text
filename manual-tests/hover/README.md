# Hover Tooltip Testing

This directory contains test files for verifying hover tooltip functionality in the ControlForge Structured Text extension.

## Tooltip Style

Tooltips in this extension now follow the minimalist style of VS Code's built-in TypeScript/JavaScript tooltips:

- Regular variables: `variableName: TYPE`
- Function block instances: `instanceName: TYPE (Description)`
- Function block members: `(DIRECTION) memberName: TYPE`
- Function block types: `function block TYPE (Description)`

This minimalist approach ensures tooltips are concise and consistent with the VS Code experience.

## Files

- `test_hover_tooltips.st` - Tests VS Code style hover tooltips for standard function blocks and their members

## Testing Procedure

1. Open the test file in VS Code with the ControlForge Structured Text extension active
2. Hover over the following elements to verify tooltips:
   - Function block types (TON, TOF, TP, CTU, CTD, CTUD, R_TRIG, F_TRIG, RS, SR)
   - Function block instances (myTON, myTOF, etc.)
   - Function block members (IN, PT, Q, ET, CU, CD, CLK, etc.)

## Expected Results

- Tooltips should follow VS Code style similar to TypeScript/JavaScript
- Function block type tooltips should show: `function block TON` with brief description
- Function block instance tooltips should show: `myTON: TON` with brief description
- Member tooltips should show: `(INPUT) IN: BOOL` with brief description

## VS Code Style Guidelines

Tooltips should be:
- Concise and focused on core information
- Well-formatted but minimal
- Include only the first line of descriptions
- Show type/kind information clearly
- Match the style of built-in VS Code tooltips

## Issues to Look For

- Tooltips that are too verbose or overly formatted
- Missing essential information (type, direction, etc.)
- Inconsistent style compared to VS Code built-ins
- Slow tooltip rendering

## Related Issues

- Issue #22: "Improve Function Block Definition Descriptions in Hover Tooltips"
