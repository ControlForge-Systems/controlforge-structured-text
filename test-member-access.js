import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position } from 'vscode-languageserver';
import { MemberAccessProvider } from './src/server/providers/member-access-provider';

// Quick test of member access parsing
const testCode = `
PROGRAM Test
VAR
    myTimer : TON;
    motorCtrl : FB_MotorControl;
END_VAR

myTimer(IN := TRUE, PT := T#5s);
IF myTimer.Q THEN
    motorCtrl.start := TRUE;
END_IF

motorStatus := motorCtrl.running;
END_PROGRAM
`;

// Create a test document
const document = TextDocument.create(
    'file:///test.st',
    'structured-text',
    1,
    testCode
);

// Test the member access provider
const provider = new MemberAccessProvider();
const memberExpressions = provider.parseMemberAccess(document);

console.log('Found member access expressions:');
memberExpressions.forEach((expr, index) => {
    console.log(`${index + 1}. ${expr.instance}.${expr.member} at line ${expr.location.range.start.line + 1}`);
    console.log(`   Instance range: chars ${expr.instanceLocation.range.start.character}-${expr.instanceLocation.range.end.character}`);
    console.log(`   Member range: chars ${expr.memberLocation.range.start.character}-${expr.memberLocation.range.end.character}`);
});

// Test position checking
const testPosition = { line: 7, character: 10 }; // Should be on "myTimer.Q"
const memberAtPos = provider.getMemberAccessAtPosition(memberExpressions, testPosition);
if (memberAtPos) {
    console.log(`\nFound member access at position: ${memberAtPos.instance}.${memberAtPos.member}`);
    const accessPart = provider.getAccessPart(memberAtPos, testPosition);
    console.log(`Position is on: ${accessPart}`);
} else {
    console.log('\nNo member access found at test position');
}
