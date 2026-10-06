import assert from "node:assert/strict";
import { shapeResume } from "./resume_service.js";

const result = shapeResume({ name: "Mina Chen", skills: ["TypeScript", 4, "Node.js"], years_experience: 6 });
assert.deepEqual(result, {
  candidate: "Mina Chen",
  skills: ["TypeScript", "Node.js"],
  years: 6,
  raw: { name: "Mina Chen", skills: ["TypeScript", 4, "Node.js"], years_experience: 6 }
});
assert.deepEqual(shapeResume({}), { candidate: "Unknown candidate", skills: [], years: null, raw: {} });
console.log("resume shaping decisions pass");
