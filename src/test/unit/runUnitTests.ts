import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
    // Create the mocha test for unit tests only
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        timeout: 10000
    });

    // Make Mocha globals available
    (global as any).suite = Mocha.suite;
    (global as any).test = Mocha.test;
    (global as any).setup = Mocha.setup;
    (global as any).teardown = Mocha.teardown;
    (global as any).suiteSetup = Mocha.suiteSetup;
    (global as any).suiteTeardown = Mocha.suiteTeardown;

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise(async (c, e) => {
        try {
            // Only include unit test files
            const files = await glob('**/*.unit.test.js', { cwd: testsRoot });

            // Add files to the test suite
            files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                console.error(err);
                e(err);
            }
        } catch (err) {
            return e(err);
        }
    });
}
