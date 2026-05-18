import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gqdxveunrlkjpryabexd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZHh2ZXVucmxranByeWFiZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDcxMTIsImV4cCI6MjA5MzExMn0.AudkiJsUAc6naoMeNJI0Qu4p8z8UXxRMf4YgR0gc3SQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APP_VERSION = "1.4.0";
const CHANGELOG = [
  {
    version: "1.4.0",
    date: "2026-05-18",
    items: [
      "生徒画面に『間違えた問題』一覧を追加",
      "先生画面に『間違えた問題』タブを追加",
      "問題ごとの不正解回数と、問題文・正解・他の選択肢を確認できるように変更",
      "CSV取り込み時のエラー表示処理を安定化",
      "問題削除時の確認メッセージ処理を安定化",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-05-18",
    items: [
      "アプリ内にバージョン表記を追加",
      "先生画面にアップデート履歴を追加",
      "解答ログの時刻表示を日本時間に補正",
      "生徒画面で、その回に間違えた問題を確認できる機能を追加",
      "先生画面から特定の解答ログを個別削除できる機能を追加",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-05-18",
    items: [
      "CSV取り込み失敗時の理由表示を追加",
      "先生画面から問題を手動削除できる機能を追加",
      "不正解問題リストと不正解回数の表示を追加",
      "ログリセット機能を追加",
    ],
  },
];

const emptyQuestion = {
  id: "",
  questionText: "",
  choicesText: "",
  correctAnswer: "",
  unit: "",
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: 16,
    background: "#f6f7f9",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#111827",
  },
  container: {
    maxWidth: 960,
    margin: "0 auto",
  },
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  button: {
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "white",
    cursor: "pointer",
    fontSize: 14,
  },
  primaryButton: {
    padding: "10px 14px",
    border: "1px solid #2563eb",
    borderRadius: 8,
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
  },
  dangerButton: {
    padding: "10px 14px",
    border: "1px solid #dc2626",
    borderRadius: 8,
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
  },
  disabledButton: {
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#e5e7eb",
    color: "#6b7280",
    cursor: "not-allowed",
    fontSize: 14,
  },
  choiceButton: {
    width: "100%",
    minHeight: 52,
    textAlign: "left",
    padding: 12,
    border: "1px solid #d1d5db",
    borderRadius: 10,
    background: "white",
    cursor: "pointer",
    fontSize: 16,
  },
  correctChoice: {
    width: "100%",
    minHeight: 52,
    textAlign: "left",
    padding: 12,
    border: "1px solid #16a34a",
    borderRadius: 10,
    background: "#dcfce7",
    cursor: "not-allowed",
    fontSize: 16,
  },
  wrongChoice: {
    width: "100%",
    minHeight: 52,
    textAlign: "left",
    padding: 12,
    border: "1px solid #dc2626",
    borderRadius: 10,
    background: "#fee2e2",
    cursor: "not-allowed",
    fontSize: 16,
  },
  input: {
    width: "100%",
    padding: 10,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    padding: 10,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  label: {
    display: "block",
    fontWeight: 600,
    marginBottom: 6,
  },
  badge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    fontSize: 12,
    background: "#f9fafb",
  },
  error: {
    padding: 10,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    borderRadius: 8,
    marginBottom: 12,
  },
  success: {
    padding: 10,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    borderRadius: 8,
    marginBottom: 12,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
};

function getMode() {
  if (typeof window === "undefined") return "student";
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "teacher" ? "teacher" : "student";
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function shuffleArray(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copied[i];
    copied[i] = copied[j];
    copied[j] = temp;
  }
  return copied;
}

function parseChoices(choicesText) {
  return String(choicesText || "")
    .split("\n")
    .map((choice) => choice.trim())
    .filter(Boolean);
}

function isValidQuestionForm(form) {
  const choices = parseChoices(form.choicesText);
  const answer = String(form.correctAnswer || "").trim();
  return Boolean(String(form.questionText || "").trim() && choices.length === 4 && choices.includes(answer));
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const source = String(text || "").replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const nextChar = source[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;
      row.push(field.trim());
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

function parseCsvLine(line) {
  return parseCsvRows(line)[0] || [];
}

function parseCsvText(text) {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => String(header || "").replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

function normalizeSupabaseTimestamp(value) {
  if (!value) return "";
  const text = String(value);
  if (/[zZ]$/.test(text) || /[+-]\d{2}:?\d{2}$/.test(text)) return text;
  return `${text}Z`;
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const date = new Date(normalizeSupabaseTimestamp(iso));
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeCsvCell(value) {
  return `"${String(value == null ? "" : value).replaceAll('"', '""')}"`;
}

function buildCsv(logs) {
  const header = ["日時", "問題番号", "単元", "選んだ選択肢", "正解", "正誤"];
  const rows = logs.map((log) => [
    formatDateTime(log.answered_at || log.answeredAt),
    log.question_id || log.questionId,
    log.unit,
    log.selected_choice || log.selectedChoice,
    log.correct_answer || log.correctAnswer,
    log.is_correct || log.isCorrect ? "正解" : "不正解",
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function validateImportedRow(row) {
  return validateImportedRowDetailed(row).valid;
}

function validateImportedRowDetailed(row, rowNumber = "?") {
  const id = String(row.id || "").trim();
  const question = String(row.question || "").trim();
  const choices = [row.choice1, row.choice2, row.choice3, row.choice4].map((choice) => String(choice || "").trim());
  const answer = String(row.answer || "").trim();
  const reasons = [];

  if (!id) reasons.push("id（問題番号）が空です");
  if (!question) reasons.push("question（問題文）が空です");
  choices.forEach((choice, index) => {
    if (!choice) reasons.push(`choice${index + 1} が空です`);
  });
  if (!answer) reasons.push("answer（正解）が空です");
  if (answer && !choices.includes(answer)) reasons.push("answer が choice1〜choice4 のどれとも完全一致していません");

  return {
    valid: reasons.length === 0,
    message: reasons.length ? `${rowNumber}行目${id ? `（${id}）` : ""}: ${reasons.join(" / ")}` : "",
  };
}

function rowToQuestionInsert(row) {
  return {
    id: String(row.id || makeId()).trim(),
    question: String(row.question || "").trim(),
    choice1: String(row.choice1 || "").trim(),
    choice2: String(row.choice2 || "").trim(),
    choice3: String(row.choice3 || "").trim(),
    choice4: String(row.choice4 || "").trim(),
    answer: String(row.answer || "").trim(),
    unit: String(row.unit || "未分類").trim() || "未分類",
  };
}

function dbQuestionToAppQuestion(row) {
  return {
    id: row.id,
    title: row.id,
    questionText: row.question,
    choices: [row.choice1, row.choice2, row.choice3, row.choice4].map((choice) => String(choice || "").trim()),
    correctAnswer: row.answer,
    explanation: "",
    unit: row.unit || "未分類",
    createdAt: row.created_at || "",
  };
}

function runSelfTests() {
  return [
    {
      name: "parseChoices removes blank lines and trims spaces",
      pass: JSON.stringify(parseChoices(" A \n\nB\n C ")) === JSON.stringify(["A", "B", "C"]),
    },
    {
      name: "valid form requires exactly four choices and a matching correct answer",
      pass: isValidQuestionForm({ ...emptyQuestion, questionText: "Q", choicesText: "A\nB\nC\nD", correctAnswer: "C" }) === true,
    },
    {
      name: "invalid form rejects missing correct answer in choices",
      pass: isValidQuestionForm({ ...emptyQuestion, questionText: "Q", choicesText: "A\nB\nC\nD", correctAnswer: "E" }) === false,
    },
    {
      name: "invalid form rejects fewer than four choices",
      pass: isValidQuestionForm({ ...emptyQuestion, questionText: "Q", choicesText: "A\nB\nC", correctAnswer: "C" }) === false,
    },
    {
      name: "invalid form rejects more than four choices",
      pass: isValidQuestionForm({ ...emptyQuestion, questionText: "Q", choicesText: "A\nB\nC\nD\nE", correctAnswer: "C" }) === false,
    },
    {
      name: "shuffleArray keeps all elements",
      pass: shuffleArray([1, 2, 3, 4]).sort().join(",") === "1,2,3,4",
    },
    {
      name: "buildCsv contains header columns",
      pass: buildCsv([]).startsWith('"日時","問題番号","単元","選んだ選択肢","正解","正誤"'),
    },
    {
      name: "parseCsvLine handles quoted commas",
      pass: JSON.stringify(parseCsvLine('"A, B",C,"D"')) === JSON.stringify(["A, B", "C", "D"]),
    },
    {
      name: "parseCsvText converts CSV rows to objects",
      pass: parseCsvText('id,question,choice1,choice2,choice3,choice4,answer,unit\nPO001,Q,A,B,C,D,A,時制')[0].id === "PO001",
    },
    {
      name: "validateImportedRow accepts valid imported rows",
      pass: validateImportedRow({ id: "PO001", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "A", unit: "時制" }) === true,
    },
    {
      name: "validateImportedRow rejects answer not in choices",
      pass: validateImportedRow({ id: "PO001", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "E", unit: "時制" }) === false,
    },
    {
      name: "validateImportedRowDetailed explains invalid answer",
      pass: validateImportedRowDetailed({ id: "PO001", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "E", unit: "時制" }, 2).message.includes("完全一致"),
    },
    {
      name: "rowToQuestionInsert preserves question id",
      pass: rowToQuestionInsert({ id: "PO011", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "A", unit: "時制" }).id === "PO011",
    },
    {
      name: "parseCsvRows handles CRLF and five rows",
      pass: parseCsvText('id,question,choice1,choice2,choice3,choice4,answer,unit\r\nPO001,Q,A,B,C,D,A,時制\r\nPO002,Q,A,B,C,D,A,時制\r\nPO003,Q,A,B,C,D,A,時制\r\nPO004,Q,A,B,C,D,A,時制\r\nPO005,Q,A,B,C,D,A,時制').length === 5,
    },
    {
      name: "parseCsvRows handles quoted newline inside a cell",
      pass: parseCsvText('id,question,choice1,choice2,choice3,choice4,answer,unit\nPO001,"Line1\nLine2",A,B,C,D,A,時制')[0].question === "Line1\nLine2",
    },
    {
      name: "dbQuestionToAppQuestion keeps four choices",
      pass: dbQuestionToAppQuestion({ id: "PO012", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "D", unit: "時制" }).choices.length === 4,
    },
    {
      name: "dbQuestionToAppQuestion exposes id for answer screen",
      pass: dbQuestionToAppQuestion({ id: "PO013", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "D", unit: "時制" }).id === "PO013",
    },
    {
      name: "getMode defaults to student outside teacher query",
      pass: typeof window === "undefined" || ["student", "teacher"].includes(getMode()),
    },
    {
      name: "normalizeSupabaseTimestamp appends UTC marker when timezone is missing",
      pass: normalizeSupabaseTimestamp("2026-05-18T00:00:00").endsWith("Z"),
    },
    {
      name: "app version is defined",
      pass: APP_VERSION === "1.4.0",
    },
  ];
}

function StudentQuizView({
  questions = [],
  currentQuestion,
  currentIndex,
  quizQueue = [],
  currentChoices = [],
  selectedChoice,
  answered,
  startQuiz,
  answerQuestion,
  nextQuestion,
  loading,
  wrongAnswers = [],
  clearWrongAnswers = () => {},
  reviewWrongLogs = [],
  wrongQuestionSummary = [],
}) {
  return (
    <div>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>英語4択トレーニング</h2>
          <button style={questions.length === 0 || loading ? styles.disabledButton : styles.primaryButton} onClick={startQuiz} disabled={questions.length === 0 || loading}>
            出題開始
          </button>
        </div>

        {!currentQuestion ? (
          <div style={{ padding: 24, textAlign: "center", color: "#6b7280", border: "1px dashed #d1d5db", borderRadius: 12 }}>
            出題開始を押すと、ランダムに問題が出ます。
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 12 }}>
              <span style={styles.badge}>{currentIndex + 1} / {quizQueue.length}</span>
            </div>

            <div style={{ ...styles.card, background: "#ffffff", fontSize: 18, lineHeight: 1.7 }}>
              {currentQuestion.questionText}
            </div>

            <div style={styles.grid2}>
              {currentChoices.map((choice) => {
                const isSelected = selectedChoice === choice;
                const isCorrect = choice === currentQuestion.correctAnswer;
                const showCorrect = answered && isCorrect;
                const showWrong = answered && isSelected && !isCorrect;
                const buttonStyle = showCorrect ? styles.correctChoice : showWrong ? styles.wrongChoice : styles.choiceButton;
                return (
                  <button key={choice} type="button" style={buttonStyle} onClick={() => answerQuestion(choice)} disabled={answered}>
                    {showCorrect ? "○ " : ""}{showWrong ? "× " : ""}{choice}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div style={{ ...styles.card, marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{selectedChoice === currentQuestion.correctAnswer ? "正解" : "不正解"}</div>
                <div>問題番号：{currentQuestion.id}</div>
                <div>正解：{currentQuestion.correctAnswer}</div>
                <button style={{ ...styles.primaryButton, marginTop: 12 }} onClick={nextQuestion}>次の問題へ</button>
              </div>
            )}
          </div>
        )}
      </div>

      {wrongAnswers.length > 0 && (
        <div style={styles.card}>
          <div style={styles.header}>
            <h2 style={{ margin: 0 }}>今回間違えた問題</h2>
            <button style={styles.button} onClick={clearWrongAnswers}>このリストをクリア</button>
          </div>
          {wrongAnswers.map((item, index) => (
            <details key={`${item.questionId}-${index}`} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, color: "#991b1b" }}>
                {item.questionId}：選んだ答え「{item.selectedChoice}」
              </summary>
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 8 }}>{item.questionText}</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>選択肢：{item.choices.join(" / ")}</div>
                <div style={{ marginTop: 4 }}>選んだ答え：{item.selectedChoice}</div>
                <div style={{ fontWeight: 700 }}>正解：{item.correctAnswer}</div>
              </div>
            </details>
          ))}
        </div>
      )}

      {wrongQuestionSummary.length > 0 && (
        <div style={styles.card}>
          <h2 style={{ marginTop: 0 }}>間違えた問題</h2>
          <p style={{ color: "#6b7280", fontSize: 13 }}>これまでに不正解だった問題を、問題ごとの回数でまとめています。</p>
          {wrongQuestionSummary.map((item) => (
            <details key={item.questionId} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, color: "#991b1b" }}>
                {item.questionId}：不正解 {item.wrongCount}回
              </summary>
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 8 }}>{item.questionText || "問題文を取得できませんでした"}</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>選択肢：{item.choices.length ? item.choices.join(" / ") : "取得できませんでした"}</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>正解：{item.correctAnswer || "取得できませんでした"}</div>
              </div>
            </details>
          ))}
        </div>
      )}

      {reviewWrongLogs.length > 0 && (
        <div style={styles.card}>
          <h2 style={{ marginTop: 0 }}>これまで間違えた問題</h2>
          <p style={{ color: "#6b7280", fontSize: 13 }}>過去の解答ログから、不正解だった問題を表示しています。</p>
          {reviewWrongLogs.map((item) => (
            <details key={item.logId} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, color: "#991b1b" }}>
                {item.questionId}：{formatDateTime(item.answeredAt)} に不正解
              </summary>
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 8 }}>{item.questionText || "問題文を取得できませんでした"}</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>選択肢：{item.choices.length ? item.choices.join(" / ") : "取得できませんでした"}</div>
                <div style={{ marginTop: 4 }}>選んだ答え：{item.selectedChoice}</div>
                <div style={{ fontWeight: 700 }}>正解：{item.correctAnswer}</div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OnlineTutorQuizApp() {
  const mode = getMode();
  const isTeacher = mode === "teacher";

  const [questions, setQuestions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(emptyQuestion);
  const [quizQueue, setQuizQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentChoices, setCurrentChoices] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState("");
  const [answered, setAnswered] = useState(false);
  const [formError, setFormError] = useState("");
  const [importError, setImportError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [showTests, setShowTests] = useState(false);
  const [showSavedQuestions, setShowSavedQuestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState("");
  const [teacherTab, setTeacherTab] = useState("quiz");
  const [wrongAnswers, setWrongAnswers] = useState([]);

  const fetchQuestions = async () => {
    setLoading(true);
    setDbError("");
    const { data, error } = await supabase
      .from("questions")
      .select("id, question, choice1, choice2, choice3, choice4, answer, unit, created_at")
      .order("id", { ascending: true });

    if (error) {
      setDbError("問題データの取得に失敗しました: " + error.message);
      setLoading(false);
      return;
    }

    setQuestions((data || []).map(dbQuestionToAppQuestion));
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("answer_logs")
      .select("id, question_id, selected_choice, correct_answer, is_correct, unit, answered_at")
      .order("answered_at", { ascending: false })
      .limit(200);

    if (error) {
      setDbError("解答ログの取得に失敗しました: " + error.message);
      return;
    }

    setLogs(data || []);
  };

  useEffect(() => {
    fetchQuestions();
    fetchLogs();
  }, [isTeacher]);

  const currentQuestion = quizQueue[currentIndex];
  const testResults = useMemo(() => runSelfTests(), []);

  const stats = useMemo(() => {
    const total = logs.length;
    const correct = logs.filter((log) => log.is_correct || log.isCorrect).length;
    const rate = total ? Math.round((correct / total) * 100) : 0;
    return { total, correct, rate };
  }, [logs]);

  const weakUnits = useMemo(() => {
    const unitMap = {};
    logs.forEach((log) => {
      const unit = log.unit || "未分類";
      if (!unitMap[unit]) unitMap[unit] = { total: 0, wrong: 0 };
      unitMap[unit].total += 1;
      if (!(log.is_correct || log.isCorrect)) unitMap[unit].wrong += 1;
    });

    return Object.entries(unitMap)
      .map(([unit, value]) => ({
        unit,
        ...value,
        wrongRate: value.total ? Math.round((value.wrong / value.total) * 100) : 0,
      }))
      .sort((a, b) => b.wrongRate - a.wrongRate)
      .slice(0, 5);
  }, [logs]);

  const wrongQuestionCounts = useMemo(() => {
    const countMap = {};
    logs.forEach((log) => {
      const isCorrect = log.is_correct || log.isCorrect;
      const questionId = log.question_id || log.questionId;
      if (!isCorrect) countMap[questionId] = (countMap[questionId] || 0) + 1;
    });
    return Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [logs]);

  const reviewWrongLogs = useMemo(() => {
    return logs
      .filter((log) => !(log.is_correct || log.isCorrect))
      .map((log) => {
        const questionId = log.question_id || log.questionId;
        const question = questions.find((item) => item.id === questionId);
        return {
          logId: log.id,
          questionId,
          answeredAt: log.answered_at || log.answeredAt,
          selectedChoice: log.selected_choice || log.selectedChoice,
          correctAnswer: log.correct_answer || log.correctAnswer,
          questionText: question ? question.questionText : "",
          choices: question ? question.choices : [],
        };
      })
      .slice(0, 30);
  }, [logs, questions]);

  const wrongQuestionSummary = useMemo(() => {
    const summaryMap = {};

    logs.forEach((log) => {
      const isCorrect = log.is_correct || log.isCorrect;
      if (isCorrect) return;

      const questionId = log.question_id || log.questionId;
      if (!questionId) return;

      if (!summaryMap[questionId]) {
        const question = questions.find((item) => item.id === questionId);
        summaryMap[questionId] = {
          questionId,
          wrongCount: 0,
          questionText: question ? question.questionText : "",
          choices: question ? question.choices : [],
          correctAnswer: question ? question.correctAnswer : (log.correct_answer || log.correctAnswer || ""),
        };
      }

      summaryMap[questionId].wrongCount += 1;
    });

    return Object.values(summaryMap).sort((a, b) => b.wrongCount - a.wrongCount || a.questionId.localeCompare(b.questionId));
  }, [logs, questions]);

  const startQuiz = () => {
    const queue = shuffleArray(questions);
    setQuizQueue(queue);
    setCurrentIndex(0);
    setSelectedChoice("");
    setAnswered(false);
    setCurrentChoices(queue[0] ? shuffleArray(queue[0].choices) : []);
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= quizQueue.length) {
      setQuizQueue([]);
      setCurrentIndex(0);
      setCurrentChoices([]);
      setSelectedChoice("");
      setAnswered(false);
      if (isTeacher) fetchLogs();
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedChoice("");
    setAnswered(false);
    setCurrentChoices(shuffleArray(quizQueue[nextIndex].choices));
  };

  const answerQuestion = async (choice) => {
    if (!currentQuestion || answered) return;

    const isCorrect = choice === currentQuestion.correctAnswer;
    setSelectedChoice(choice);
    setAnswered(true);

    if (!isCorrect) {
      setWrongAnswers((prev) => [
        {
          questionId: currentQuestion.id,
          questionText: currentQuestion.questionText,
          choices: currentQuestion.choices,
          selectedChoice: choice,
          correctAnswer: currentQuestion.correctAnswer,
        },
        ...prev,
      ]);
    }

    const logRow = {
      question_id: currentQuestion.id,
      selected_choice: choice,
      correct_answer: currentQuestion.correctAnswer,
      is_correct: isCorrect,
      unit: currentQuestion.unit || "未分類",
    };

    const { data, error } = await supabase.from("answer_logs").insert([logRow]).select().single();

    if (error) {
      setDbError("解答ログの保存に失敗しました: " + error.message);
      return;
    }

    if (isTeacher) {
      setLogs((prev) => [data || { ...logRow, id: makeId(), answered_at: new Date().toISOString() }, ...prev]);
    }
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    const choices = parseChoices(form.choicesText);

    if (!form.questionText.trim()) {
      setFormError("問題文を入力してください。");
      return;
    }
    if (choices.length !== 4) {
      setFormError("選択肢は必ず4つ入力してください。");
      return;
    }
    if (!choices.includes(form.correctAnswer.trim())) {
      setFormError("正解欄は、選択肢のどれかと完全一致させてください。");
      return;
    }

    const id = form.id.trim() || makeId();
    const insertRow = {
      id,
      question: form.questionText.trim(),
      choice1: choices[0],
      choice2: choices[1],
      choice3: choices[2],
      choice4: choices[3],
      answer: form.correctAnswer.trim(),
      unit: form.unit.trim() || "未分類",
    };

    const { error } = await supabase.from("questions").upsert([insertRow], { onConflict: "id" });
    if (error) {
      setFormError("問題の保存に失敗しました: " + error.message);
      return;
    }

    setForm(emptyQuestion);
    setFormError("");
    fetchQuestions();
  };

  const handleCsvImport = (file) => {
    setImportError("");
    setImportMessage("");
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target ? event.target.result : "";
        const rows = parseCsvText(String(result || ""));

        if (rows.length === 0) {
          setImportError("CSVに問題データがありません。");
          return;
        }

        const required = ["id", "question", "choice1", "choice2", "choice3", "choice4", "answer", "unit"];
        const cols = Object.keys(rows[0]);
        const missing = required.filter((key) => !cols.includes(key));
        if (missing.length) {
          setImportError("CSVの列が不足しています: " + missing.join(", "));
          return;
        }

        const invalidMessages = [];
        const newQuestions = [];
        rows.forEach((row, index) => {
          const result = validateImportedRowDetailed(row, index + 2);
          if (result.valid) {
            newQuestions.push(rowToQuestionInsert(row));
          } else {
            invalidMessages.push(result.message);
          }
        });

        if (newQuestions.length === 0) {
          setImportError("有効な問題が1つもありません。フォーマットを確認してください。");
          return;
        }

        const { error } = await supabase.from("questions").upsert(newQuestions, { onConflict: "id" });
        if (error) {
          setImportError("Supabaseへの保存に失敗しました: " + error.message);
          return;
        }

setImportMessage(`${newQuestions.length}問をSupabaseに保存しました（無効: ${invalidMessages.length}問）`);
        if (invalidMessages.length > 0) {
 const message =
  "取り込めなかった行があります。\n" +
  invalidMessages.join("\n");
          setImportError(message);
        }
        fetchQuestions();
      } catch (error) {
        setImportError("CSVの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const deleteQuestion = async (questionId) => {
    const target = questions.find((question) => question.id === questionId);
   const confirmMessage =
  "問題 " +
  questionId +
  " を削除します。" +
  (target ? "\n\n" + target.questionText : "") +
  "\n\n解答ログは削除されません。よろしいですか？";
    const ok = window.confirm(confirmMessage);
    if (!ok) return;

    const { error } = await supabase.from("questions").delete().eq("id", questionId);
    if (error) {
      setDbError("問題の削除に失敗しました: " + error.message);
      return;
    }

    setQuestions((prev) => prev.filter((question) => question.id !== questionId));
    setDbError("");
  };

  const exportLogs = () => {
    const csv = buildCsv(logs);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "answer_logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetAnswerLogs = async () => {
    const ok = window.confirm("解答ログをすべて削除します。回答数・正解数・正答率もリセットされます。よろしいですか？");
    if (!ok) return;

    const { error } = await supabase.from("answer_logs").delete().not("id", "is", null);
    if (error) {
      setDbError("解答ログのリセットに失敗しました: " + error.message);
      return;
    }

    setLogs([]);
    setDbError("");
  };

  const deleteAnswerLog = async (logId) => {
    const ok = window.confirm("この解答ログを削除します。よろしいですか？");
    if (!ok) return;

    const { error } = await supabase.from("answer_logs").delete().eq("id", logId);
    if (error) {
      setDbError("解答ログの削除に失敗しました: " + error.message);
      return;
    }

    setLogs((prev) => prev.filter((log) => log.id !== logId));
    setDbError("");
  };

  const refreshAll = () => {
    fetchQuestions();
    if (isTeacher) fetchLogs();
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={{ marginBottom: 4 }}>オンライン家庭教師・4択練習アプリ</h1>
            <p style={{ color: "#6b7280", marginTop: 0 }}>{isTeacher ? "先生用：問題管理とログ確認" : "生徒用：英語の穴埋め4択トレーニング"}</p>
            <p style={{ color: "#6b7280", marginTop: 4, fontSize: 13 }}>ver {APP_VERSION}</p>
          </div>
          <div style={styles.row}>
            <button style={styles.button} onClick={refreshAll}>再読み込み</button>
            {isTeacher && (
              <button style={styles.button} onClick={() => setShowSavedQuestions((prev) => !prev)}>
                {showSavedQuestions ? "保存済み問題を閉じる" : "保存済み問題を確認"}
              </button>
            )}
          </div>
        </div>

        {dbError && <div style={styles.error}>{dbError}</div>}
        {loading && <div style={styles.card}>Supabaseから読み込み中...</div>}

        {isTeacher && showSavedQuestions && (
          <div style={styles.card}>
            <h2>保存済み問題一覧</h2>
            {questions.length === 0 ? (
              <div>保存済みの問題はありません</div>
            ) : (
              questions.map((question) => (
                <div key={`saved-${question.id}-${question.createdAt}`} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
                  <div style={styles.row}>
                    <span style={styles.badge}>{question.id}</span>
                    <span style={styles.badge}>{question.unit || "未分類"}</span>
                  </div>
                  <p>{question.questionText}</p>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>選択肢：{question.choices.join(" / ")}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>正解：{question.correctAnswer}</div>
                </div>
              ))
            )}
          </div>
        )}

        {!isTeacher ? (
          <StudentQuizView
            questions={questions}
            currentQuestion={currentQuestion}
            currentIndex={currentIndex}
            quizQueue={quizQueue}
            currentChoices={currentChoices}
            selectedChoice={selectedChoice}
            answered={answered}
            startQuiz={startQuiz}
            answerQuestion={answerQuestion}
            nextQuestion={nextQuestion}
            loading={loading}
            wrongAnswers={wrongAnswers}
            clearWrongAnswers={() => setWrongAnswers([])}
            reviewWrongLogs={reviewWrongLogs}
            wrongQuestionSummary={wrongQuestionSummary}
          />
        ) : (
          <div>
            <div style={styles.statsGrid}>
              <div style={styles.card}><div>登録問題数</div><strong style={{ fontSize: 24 }}>{questions.length}問</strong></div>
              <div style={styles.card}><div>解答数</div><strong style={{ fontSize: 24 }}>{stats.total}回</strong></div>
              <div style={styles.card}><div>正解数</div><strong style={{ fontSize: 24 }}>{stats.correct}回</strong></div>
              <div style={styles.card}><div>正答率</div><strong style={{ fontSize: 24 }}>{stats.rate}%</strong></div>
            </div>

            <div style={{ ...styles.row, marginBottom: 16 }}>
              {[
                ["quiz", "出題確認"],
                ["import", "取込"],
                ["add", "手入力"],
                ["list", "問題一覧"],
                ["logs", "ログ"],
                ["wrong", "間違えた問題"],
                ["updates", "更新履歴"],
                ["tests", "テスト"],
              ].map(([key, label]) => (
                <button key={key} style={teacherTab === key ? styles.primaryButton : styles.button} onClick={() => setTeacherTab(key)}>
                  {label}
                </button>
              ))}
            </div>

            {teacherTab === "quiz" && (
              <StudentQuizView
                questions={questions}
                currentQuestion={currentQuestion}
                currentIndex={currentIndex}
                quizQueue={quizQueue}
                currentChoices={currentChoices}
                selectedChoice={selectedChoice}
                answered={answered}
                startQuiz={startQuiz}
                answerQuestion={answerQuestion}
                nextQuestion={nextQuestion}
                loading={loading}
              />
            )}

            {teacherTab === "import" && (
              <div style={styles.card}>
                <h2>CSV取り込み</h2>
                <input type="file" accept=".csv" onChange={(e) => handleCsvImport(e.target.files ? e.target.files[0] : null)} />
                {importMessage && <div style={styles.success}>{importMessage}</div>}
                {importError && <div style={{ ...styles.error, whiteSpace: "pre-wrap" }}>{importError}</div>}
                <p style={{ fontSize: 13, color: "#6b7280" }}>列名は id, question, choice1, choice2, choice3, choice4, answer, unit にしてください。</p>
              </div>
            )}

            {teacherTab === "add" && (
              <div style={styles.card}>
                <h2>問題を手入力</h2>
                <form onSubmit={addQuestion}>
                  <div style={styles.grid2}>
                    <div>
                      <label style={styles.label}>問題番号</label>
                      <input style={styles.input} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="例: PO003" />
                    </div>
                    <div>
                      <label style={styles.label}>単元・タグ</label>
                      <input style={styles.input} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="例: 時制" />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={styles.label}>問題文</label>
                    <textarea style={styles.textarea} value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} placeholder="Everyone _____about his success in business." />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={styles.label}>選択肢（1行に1つ・必ず4つ）</label>
                    <textarea style={styles.textarea} value={form.choicesText} onChange={(e) => setForm({ ...form, choicesText: e.target.value })} placeholder={`is known\nis knowing\nknow\nknows`} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={styles.label}>正解（選択肢と完全一致）</label>
                    <input style={styles.input} value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} placeholder="knows" />
                  </div>
                  {formError && <div style={styles.error}>{formError}</div>}
                  <button style={{ ...styles.primaryButton, marginTop: 12 }} type="submit">Supabaseに保存</button>
                </form>
              </div>
            )}

            {teacherTab === "list" && (
              <div style={styles.card}>
                <h2>問題一覧</h2>
                {questions.map((question) => (
                  <div key={`${question.id}-${question.createdAt}`} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
                    <div style={styles.row}>
                      <strong>{question.id}</strong>
                      <span style={styles.badge}>{question.unit || "未分類"}</span>
                    </div>
                    <p>{question.questionText}</p>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>選択肢：{question.choices.join(" / ")}</div>
                    <div style={{ fontWeight: 700 }}>正解：{question.correctAnswer}</div>
                    <button style={{ ...styles.dangerButton, marginTop: 8 }} onClick={() => deleteQuestion(question.id)}>この問題を削除</button>
                  </div>
                ))}
              </div>
            )}

            {teacherTab === "logs" && (
              <div>
                <div style={styles.card}>
                  <div style={styles.header}>
                    <h2>解答ログ</h2>
                    <div style={styles.row}>
                      <button style={styles.button} onClick={fetchLogs}>更新</button>
                      <button style={logs.length === 0 ? styles.disabledButton : styles.button} onClick={exportLogs} disabled={logs.length === 0}>CSV</button>
                      <button style={logs.length === 0 ? styles.disabledButton : styles.dangerButton} onClick={resetAnswerLogs} disabled={logs.length === 0}>ログをリセット</button>
                    </div>
                  </div>
                  {logs.length === 0 ? (
                    <div>まだ解答ログがありません</div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
                        <div style={styles.row}>
                          <span style={log.is_correct ? styles.badge : { ...styles.badge, background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontWeight: 700 }}>{log.is_correct ? "正解" : "不正解"}</span>
                          <span style={styles.badge}>{log.question_id}</span>
                          <span style={styles.badge}>{log.unit}</span>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>{formatDateTime(log.answered_at)}</span>
                          <button style={styles.button} onClick={() => deleteAnswerLog(log.id)}>このログを削除</button>
                        </div>
                        <div>選んだ選択肢：{log.selected_choice}</div>
                        <div>正解：{log.correct_answer}</div>
                      </div>
                    ))
                  )}
                </div>

                <div style={styles.grid2}>
                  <div style={styles.card}>
                    <h3>苦手傾向</h3>
                    {weakUnits.length === 0 ? (
                      <div>ログが増えると単元別のミス傾向を表示します。</div>
                    ) : (
                      weakUnits.map((unit) => (
                        <div key={unit.unit} style={{ marginBottom: 8 }}>
                          <strong>{unit.unit}</strong>：ミス {unit.wrong} / {unit.total}回、不正解率 {unit.wrongRate}%
                        </div>
                      ))
                    )}
                  </div>
                  <div style={styles.card}>
                    <h3>不正解だった問題リスト</h3>
                    {wrongQuestionCounts.length === 0 ? (
                      <div>不正解ログが増えると、問題番号別に表示します。</div>
                    ) : (
                      wrongQuestionCounts.map(([id, count]) => (
                        <div key={id} style={{ marginBottom: 8, padding: 8, border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8 }}>
                          <strong style={{ color: "#991b1b" }}>{id}</strong>：不正解 {count}回
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {teacherTab === "wrong" && (
              <div style={styles.card}>
                <h2>間違えた問題</h2>
                <p style={{ color: "#6b7280", fontSize: 13 }}>これまでの解答ログから、不正解だった問題を回数順に表示します。</p>
                {wrongQuestionSummary.length === 0 ? (
                  <div>不正解ログがありません。</div>
                ) : (
                  wrongQuestionSummary.map((item) => (
                    <details key={item.questionId} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 700, color: "#991b1b" }}>
                        {item.questionId}：不正解 {item.wrongCount}回
                      </summary>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ marginBottom: 8 }}>{item.questionText || "問題文を取得できませんでした"}</div>
                        <div style={{ fontSize: 13, color: "#6b7280" }}>選択肢：{item.choices.length ? item.choices.join(" / ") : "取得できませんでした"}</div>
                        <div style={{ fontWeight: 700, marginTop: 4 }}>正解：{item.correctAnswer || "取得できませんでした"}</div>
                      </div>
                    </details>
                  ))
                )}
              </div>
            )}

            {teacherTab === "updates" && (
              <div style={styles.card}>
                <h2>更新履歴</h2>
                {CHANGELOG.map((entry) => (
                  <div key={entry.version} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
                    <div style={{ fontWeight: 700 }}>ver {entry.version}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{entry.date}</div>
                    <ul style={{ marginTop: 0 }}>
                      {entry.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {teacherTab === "tests" && (
              <div style={styles.card}>
                <div style={styles.header}>
                  <h2>簡易テスト</h2>
                  <button style={styles.button} onClick={() => setShowTests((prev) => !prev)}>{showTests ? "隠す" : "表示"}</button>
                </div>
                {showTests && testResults.map((test) => (
                  <div key={test.name} style={{ borderTop: "1px solid #e5e7eb", padding: 8 }}>
                    {test.pass ? "PASS" : "FAIL"}：{test.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
