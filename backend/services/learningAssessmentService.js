const PRIVATE_ANSWER_FIELDS = new Set([
  "correctIndex",
  "correctAnswer",
  "answer",
  "explanation",
  "rationale",
  "feedback",
]);

function sanitizeQuestion(question) {
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    return question;
  }

  return Object.fromEntries(
    Object.entries(question)
      .filter(([key]) => !PRIVATE_ANSWER_FIELDS.has(key))
      .map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map(sanitizeQuestion)
          : value && typeof value === "object"
            ? sanitizeQuestion(value)
            : value,
      ])
  );
}

function parseQuestionContent(content) {
  if (typeof content !== "string") return content;
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

function sanitizeLesson(lesson) {
  const record = typeof lesson?.toJSON === "function" ? lesson.toJSON() : { ...lesson };

  if (Array.isArray(record.quizQuestions)) {
    record.quizQuestions = record.quizQuestions.map(sanitizeQuestion);
  } else if (record.quizQuestions && typeof record.quizQuestions === "object") {
    record.quizQuestions = sanitizeQuestion(record.quizQuestions);
  }

  if (record.contentType === "quiz") {
    const parsedContent = parseQuestionContent(record.content);
    if (Array.isArray(parsedContent)) {
      record.content = JSON.stringify(parsedContent.map(sanitizeQuestion));
    } else if (parsedContent && typeof parsedContent === "object") {
      record.content = JSON.stringify(sanitizeQuestion(parsedContent));
    }
  }

  return record;
}

function getAssessmentQuestions(lesson) {
  if (Array.isArray(lesson?.quizQuestions) && lesson.quizQuestions.length) {
    return lesson.quizQuestions;
  }
  if (lesson?.quizQuestions && typeof lesson.quizQuestions === "object") {
    return [lesson.quizQuestions];
  }

  const parsedContent = parseQuestionContent(lesson?.content);
  if (Array.isArray(parsedContent)) return parsedContent;
  if (parsedContent?.question) return [parsedContent];
  return [];
}

function getCorrectIndex(question) {
  if (Number.isInteger(question?.correctIndex)) return question.correctIndex;
  const answer = question?.correctAnswer ?? question?.answer;
  if (Number.isInteger(answer)) return answer;
  if (typeof answer === "string" && Array.isArray(question?.options)) {
    return question.options.findIndex((option) => String(option).trim() === answer.trim());
  }
  return -1;
}

function gradeAssessment(lesson, submittedAnswers, questionIndices) {
  const allQuestions = getAssessmentQuestions(lesson);
  if (!allQuestions.length) throw new Error("This lesson has no gradable assessment questions.");

  const indices = Array.isArray(questionIndices) && questionIndices.length
    ? questionIndices.map(Number)
    : allQuestions.map((_, index) => index);
  if (indices.some((index) => !Number.isInteger(index) || index < 0 || index >= allQuestions.length)) {
    throw new Error("Assessment question index is invalid.");
  }
  const questions = indices.map((index) => allQuestions[index]);
  const answers = Array.isArray(submittedAnswers)
    ? submittedAnswers
    : indices.map((index) => submittedAnswers?.[index] ?? submittedAnswers?.[String(index)]);

  let correctAnswers = 0;
  const feedback = questions.map((question, index) => {
    const correctIndex = getCorrectIndex(question);
    if (correctIndex < 0) {
      throw new Error(`Assessment question ${index + 1} has no valid answer key.`);
    }

    const selectedIndex = Number(answers[index]);
    const isCorrect = Number.isInteger(selectedIndex) && selectedIndex === correctIndex;
    if (isCorrect) correctAnswers += 1;

    return {
      questionIndex: indices[index],
      selectedIndex: Number.isInteger(selectedIndex) ? selectedIndex : null,
      correctIndex,
      correct: isCorrect,
      explanation: question.explanation || question.rationale || question.feedback || null,
    };
  });

  return {
    correctAnswers,
    totalQuestions: questions.length,
    score: Math.round((correctAnswers / questions.length) * 100),
    feedback,
  };
}

module.exports = {
  sanitizeLesson,
  getAssessmentQuestions,
  gradeAssessment,
};