// Makes @testing-library/jest-dom's Vitest matcher types (toHaveTextContent, toBeVisible, ...)
// visible to the files under this tsconfig. The runtime registration lives in src/setupTests.js,
// which is plain JS and therefore not type-checked.
/// <reference types="@testing-library/jest-dom/vitest" />
