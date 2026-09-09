const test = require("node:test");
const assert = require("node:assert");

function add(a, b) {
    return a + b;
}

test("2 + 3 should equal 5", () => {
    assert.strictEqual(add(2, 3), 5);
});