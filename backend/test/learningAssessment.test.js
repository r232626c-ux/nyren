const test = require("node:test");
const assert = require("node:assert/strict");
const {
  sanitizeLesson,
  gradeAssessment,
} = require("../services/learningAssessmentService");

test("sanitizes answer keys and explanations from a quiz lesson", () => {
  const lesson = {
    id: "lesson-1",
    contentType: "quiz",
    quizQuestions: [
      {
        question: "Which molecule carries genetic information?",
        options: ["DNA", "ATP"],
        correctIndex: 0,
        explanation: "DNA stores hereditary information.",
      },
    ],
  };

  const sanitized = sanitizeLesson(lesson);
  assert.equal(sanitized.quizQuestions[0].question, lesson.quizQuestions[0].question);
  assert.deepEqual(sanitized.quizQuestions[0].options, lesson.quizQuestions[0].options);
  assert.equal("correctIndex" in sanitized.quizQuestions[0], false);
  assert.equal("explanation" in sanitized.quizQuestions[0], false);
});

test("grades submitted choices on the server-side helper and returns post-submit feedback", () => {
  const result = gradeAssessment({
    quizQuestions: [
      { question: "Q1", options: ["A", "B"], correctIndex: 1, explanation: "B is correct." },
      { question: "Q2", options: ["A", "B"], correctIndex: 0 },
    ],
  }, [1, 1]);

  assert.equal(result.correctAnswers, 1);
  assert.equal(result.totalQuestions, 2);
  assert.equal(result.score, 50);
  assert.equal(result.feedback[0].correct, true);
  assert.equal(result.feedback[0].correctIndex, 1);
  assert.equal(result.feedback[0].explanation, "B is correct.");
  assert.equal(result.feedback[1].correct, false);
});

test("rejects assessments without server-held answer keys", () => {
  assert.throws(
    () => gradeAssessment({ quizQuestions: [{ question: "Q", options: ["A", "B"] }] }, [0]),
    /no valid answer key/
  );
});

test("sanitizes answer keys from JSON-encoded quiz content", () => {
  const lesson = sanitizeLesson({
    id: "lesson-json",
    contentType: "quiz",
    content: JSON.stringify({
      question: "Which answer is correct?",
      options: ["A", "B"],
      correctIndex: 1,
      rationale: "The second option is supported.",
    }),
  });
  const publicQuestion = JSON.parse(lesson.content);
  assert.deepEqual(publicQuestion.options, ["A", "B"]);
  assert.equal("correctIndex" in publicQuestion, false);
  assert.equal("rationale" in publicQuestion, false);
});

test("grades a selected quick-check question by its original question index", () => {
  const result = gradeAssessment({
    quizQuestions: [
      { question: "Q1", options: ["A", "B"], correctIndex: 0 },
      { question: "Q2", options: ["C", "D"], correctIndex: 1 },
    ],
  }, [1], [1]);

  assert.equal(result.totalQuestions, 1);
  assert.equal(result.score, 100);
  assert.equal(result.feedback[0].questionIndex, 1);
  assert.equal(result.feedback[0].correct, true);
});