# Screenshot Placeholders

This directory contains screenshots for the README.md file.

## Required Screenshots:

1. **function-block-completion.gif** - Animated GIF showing:
   - Typing `myTimer.` and seeing completion for `Q` and `ET`
   - Typing `upCounter.` and seeing completion for `Q` and `CV`
   - Show the type information and descriptions

2. **syntax-highlighting.png** - Static image showing:
   - A sample .st file with rich syntax highlighting
   - Different colors for keywords, types, operators, comments
   - Function block declarations and usage

## How to Create Screenshots:

### For function-block-completion.gif:
1. Open VS Code with the extension
2. Create a new .st file with function block instances
3. Use a screen recorder (like OBS, LICEcap, or VS Code's built-in recorder)
4. Record typing the dot notation and showing completions
5. Export as GIF, keep under 3MB for GitHub

### For syntax-highlighting.png:
1. Open `examples/test_instance_members.st` or similar
2. Make sure all syntax highlighting is visible
3. Take a screenshot showing the full file
4. Crop to show relevant code with good highlighting
5. Save as PNG

## Guidelines:
- Keep file sizes reasonable (< 3MB for GIFs, < 1MB for PNGs)
- Use high contrast themes for better visibility
- Show real, meaningful code examples
- Ensure text is readable at GitHub's display sizes
