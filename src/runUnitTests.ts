import * as path from 'path';

async function main() {
    try {
        // For unit tests, we don't need VS Code - just run the test runner directly
        const { run } = await import(path.resolve(__dirname, './test/unit/runUnitTests'));
        await run();
        console.log('✅ All unit tests passed!');
    } catch (err) {
        console.error('❌ Unit tests failed:', err);
        process.exit(1);
    }
}

main();
